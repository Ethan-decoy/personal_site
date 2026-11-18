---
title: 移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）
date: 2026-09-05
order: 3
---

# 移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）

开始一项校准登记时，活动计数递增。负责这项登记的对象销毁时，计数递减。移动构造可以在计数保持不变的情况下，把已有登记交给新对象，由它在销毁时解除。

## 让源对象能够处于无责任状态

移动语义（move semantics）允许目标对象利用源对象已有的状态完成构造或赋值。独占登记的对象可以把解除责任交给目标。其他类型如何利用源状态，由各自的移动操作决定。

移动构造函数（move constructor）的常见形式是 `T(T&& source)`。其中 `source` 是右值引用形参，函数通过它访问可修改的源对象，并初始化新的同类型对象。

`registration` 允许两种符合类不变式的状态。`counter` 非空时，对象承担一次解除登记的责任，析构时递减指针所指的计数。`counter` 为空时，对象没有登记需要解除，析构跳过递减。

计数对象 `count` 由调用方持有，`counter` 只借用它。登记交接后，`count` 必须保持存活，直到最终承担责任的对象完成递减。如果 `count` 先销毁，持有登记的对象析构时访问它会产生未定义行为。相关条件见[前文的外部对象生命周期约束](../16-class-object-destruction-and-resource-lifetime/03-scope-bound-cleanup-and-raii.md#raii-不延长外部对象的生命周期)。

下面的完整程序在 `source` 和 `target` 的外层作用域创建 `count`，使计数在两个登记对象销毁时都仍然有效。

```cpp
#include <iostream>
#include <utility>

class registration {
  public:
    explicit registration(int& count) : counter{&count} {
        ++(*counter);
    }

    registration(const registration&) = delete;
    registration& operator=(const registration&) = delete;

    registration(registration&& source) : counter{source.counter} {
        source.counter = nullptr;
    }

    ~registration() {
        if (counter != nullptr) {
            --(*counter);
        }
    }

    bool is_active() const {
        return counter != nullptr;
    }

  private:
    int* counter;
};

int main() {
    int count{0};

    {
        registration source{count};

        {
            const registration target{std::move(source)};

            std::cout << count << ' ' << source.is_active() << ' ' << target.is_active() << '\n';
        }

        std::cout << count << '\n';
    }

    std::cout << count << '\n';
}
```

程序依次输出 `1 0 1`、`0` 和 `0`。第一行显示移动构造后的计数仍为 `1`，只有 `target` 处于活动状态。`target` 销毁时解除登记，计数降到 `0`。稍后 `source` 以空状态销毁，计数保持为 `0`。

## 参数绑定与责任转移是两步

`std::move(source)` 产生表示源对象的将亡值。本例中，同一个非 `const` 将亡值能匹配两个构造函数的形参。绑定到 `registration&&` 优于绑定到 `const registration&`，因此重载决议选中移动构造函数。

> [!IMPORTANT] 形参绑定与责任交接分别判断
> **右值引用形参为构造函数提供访问源对象的途径。交接哪些资源、怎样改变源状态，由选中的构造操作决定。**如果资源成员能自行转交责任，外层类可以通过该成员的移动构造完成交接。

在 `registration` 的移动构造函数内，名称 `source` 在成员访问表达式中是左值。成员初始化先把 `source.counter` 的指针值保存到目标成员，函数体随后把源指针设为空。对于本例中的活动登记，这两步使构造完成后只有目标负责解除。如果源本来为空，目标的指针也为空，双方都没有需要解除的登记。

如果从第一个程序中去掉 `source.counter = nullptr;`，两个析构函数都会对同一项登记执行递减，最终计数会变成 `-1`。另一种独立改法是把 `target{std::move(source)}` 改为 `target{source}`。左值只能匹配复制构造函数的 `const registration&` 形参，选中已删除的函数会导致编译失败。

## 两个对象身份，一份资源责任

> [!IMPORTANT] 移动构造建立目标对象的身份
> **移动构造初始化一个新的目标对象。源对象保留自己的身份和生命周期，原先指向源对象本身的指针或引用仍然指向它。**目标取得什么状态，以及移后的源对象可以执行哪些操作，由类型的契约决定。

本例中的 `source` 在交接后进入空状态，`is_active()` 返回 `false`。离开作用域时，源和目标各自析构，由仍持有登记的 `target` 完成解除。

## 从序列副本到已有元素的接管

引用让函数访问原序列，复制会建立可以独立修改的一组元素，见[采样序列的复制与访问](../11-sequences-and-data-access/03-sequence-copying-and-function-access.md#参数形式表达需要怎样的数据关系)。下面的独立程序比较复制构造如何建立副本，以及移动构造如何接管已有元素。

```cpp
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<double> source{240.0, 245.0, 250.0};
    std::vector<double> copy{source};
    copy[0] = 260.0;

    const double* const first{&source[0]};
    const std::vector<double> target{std::move(source)};

    std::cout << copy[0] << ' ' << target[0] << ' ' << (first == &target[0]) << '\n';
}
```

程序输出 `260 240 1`。`copy` 有自己的一组元素，修改它不会改写原采样值。`target` 的构造则接管了原来由 `source` 管理的那组元素；`first` 仍然指向原来的第一个元素，现在它也是 `target[0]`。

这里调用的是只传源容器的 `vector(vector&&)` 重载。标准规定目标取得源容器原有的同一组元素，操作具有常数复杂度（constant complexity），即操作次数的上界与元素数量无关。

分配器（allocator）负责分配和释放元素所用的存储。显式传入新分配器时适用另一项构造要求。如果新旧分配器不相等，标准规定线性复杂度，并允许目标另行建立元素。两种构造的条件见[C++23 容器构造要求](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts#16)。

| 构造方式 | 目标管理的元素 | 需要完成的工作 |
| --- | --- | --- |
| 从已有左值 `source` 复制构造 | 另一组独立的 `double` 对象，初始数值与源相同 | 为副本建立元素；复制构造的工作量随元素数量线性增长 |
| 用 `std::move(source)` 移动构造 | 原来由 `source` 管理的同一批元素 | 接管已有元素及其存储管理关系，无需另建一组元素来保存原数值 |

> [!PRACTICE] 按数据保留需求选择借用、复制或移动
> 只需在源序列有效期间读取时，可以用 `const` 引用访问。需要独立保留两组可分别修改的数据时，使用复制构造。接收方可以接管已有元素、调用方允许源序列状态改变时，本例中的移动构造可以省去另建一组元素的工作。

容器对象 `source` 保留原有身份，`target` 是新建的容器。原先指向 `source` 容器本身的指针仍然指向它。`first` 指向的则是原来的第一个元素，交接后该元素由 `target` 管理。

移动后的 `source` 处于有效但未指定的状态。可以调用 `empty()` 查询当前是否有元素，确认下标处于当前有效范围内才访问对应元素。`registration` 则明确规定移后的源对象处于无责任状态。

这项成本结论限定于示例中的移动构造。移动赋值还涉及目标原有元素的处理，其他类型也可能逐项移动自身的成员，不能据此把所有移动操作理解为只交接一个地址。

## 参考资料

- [C++23 工作草案：分配器感知容器的移动构造](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts#16)
- [C++23 工作草案：容器复制构造的复杂度](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts#14)
- [C++23 工作草案：标准库类型的移后状态](https://timsong-cpp.github.io/cppwp/n4950/lib.types.movedfrom)
- [C++ Core Guidelines：复制操作与副本关系](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-copy-semantic)
- [C++ Core Guidelines：移动操作及源对象的有效状态](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-move-semantic)
- [C++23 工作草案：复制与移动构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：引用绑定的重载优先级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
