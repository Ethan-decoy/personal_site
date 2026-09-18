---
title: 移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）
date: 2026-09-05
order: 3
---

# 移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）

一项校准登记开始时，活动计数递增；负责这项登记的对象销毁时，计数递减。把责任交给新对象不需要再增加一项登记，只需要保证交接后由新对象负责解除，而源对象不再重复解除。

## 让源对象能够处于无责任状态

移动语义（move semantics）允许目标对象利用源对象已有的状态完成构造或赋值。对于独占登记责任的对象，这意味着转交责任；对于其他类型，实际利用哪些状态，由类型自身的操作定义。

移动构造函数（move constructor）的常见形式是 `T(T&& source)`。它接收一个可以修改的源对象，用于初始化新的同类型对象。引用绑定本身不会改变源对象，责任转移必须由构造函数的成员初始化与函数体完成。

为使交接后的源对象仍然能够安全销毁，`registration` 需要允许两种有效状态：`counter` 非空时，对象承担一次登记的解除责任；为空时，对象不承担登记责任，析构不执行递减。

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
            registration target{std::move(source)};

            std::cout << count << ' ' << source.is_active() << ' ' << target.is_active() << '\n';
        }

        std::cout << count << '\n';
    }

    std::cout << count << '\n';
}
```

程序依次输出 `1 0 1`、`0` 和 `0`。登记开始时计数变为 `1`；移动构造只转交这项登记，没有再次递增。新对象销毁时解除登记，计数变为 `0`；源对象虽然稍后也会销毁，但它已经不再承担解除责任。

空指针在这里有明确的类内含义，不是要求所有移动操作都把源对象清空。这个类型同时调整了移动构造与析构，使“有责任”和“无责任”都符合类的不变量（class invariant）。

## 参数绑定与责任转移是两步

`std::move(source)` 产生表示源对象的将亡值。重载决议在接收 `registration&&` 的移动构造函数与接收 `const registration&` 的复制构造函数之间，优先选择前者；复制构造虽然被删除，但并不是这次调用选中的函数。

进入构造函数后，形参 `source` 在成员访问表达式中是左值。`source.counter` 取得源对象保存的指针值，用它初始化新对象的成员；函数体随后把源指针设为空。只有完成这两步，解除责任才真正只属于新对象。

如果省略把源指针设为空的语句，两边仍然会各自执行一次递减。参数写成 `T&&` 不会让编译器自动推断这种业务责任，也不会代替函数体修正源对象。

普通左值 `source` 不会自动绑定到这里的右值引用形参。若去掉调用处的 `std::move`，初始化会选择已删除的复制构造函数，程序不能通过编译。调用方必须明确提供可转交状态的来源。

## 两个对象身份，一份资源责任

移动构造建立了一个新对象，源对象仍然存在；它们有不同的身份、各自的存储和各自的销毁过程。已有的指针或引用仍然指向原来的源对象，不会自动改为指向接收对象。

源对象在交接后可以安全调用 `is_active()`，结果为 `false`，也可以正常销毁。这里的“可用”由类型提供的有效状态与接口决定，不表示还能继续使用已经转走的登记。

> [!IMPORTANT]
> 移动构造转交的是类型定义的状态或责任，不是把源对象的地址、身份和生命周期一起搬到新对象上。

## 从序列副本到已有元素的接管

[采样序列的复制与访问](../11-sequences-and-data-access/03-sequence-copying-and-function-access.md#参数形式表达需要怎样的数据关系)已经区分了两种需求：引用让函数访问原序列，复制则建立可以独立修改的一组元素。如果接收方需要管理自己的序列，而调用方允许源序列改变原有内容，就可以使用移动构造：

```cpp
#include <iostream>
#include <utility>
#include <vector>

int main() {
    std::vector<double> source{240.0, 245.0, 250.0};
    std::vector<double> copy{source};
    copy[0] = 260.0;

    const double* first{&source[0]};
    std::vector<double> target{std::move(source)};

    std::cout << copy[0] << ' ' << target[0] << ' ' << (first == &target[0]) << '\n';
}
```

程序输出 `260 240 1`。`copy` 有自己的一组元素，修改它不会改写原采样值。`target` 的构造则接管了原来由 `source` 管理的那组元素；`first` 仍然指向原来的第一个元素，现在它也是 `target[0]`。

这里的依据是 `std::vector<double>` 这一移动构造接口的契约：从源对象直接移动构造一个新容器时，目标取得原先的同一批元素，操作具有常数复杂度（constant complexity），即所需操作次数有一个不依赖元素数量的上界。输出用于展示契约的结果，不能代替标准保证。

| 构造方式 | 目标管理的元素 | 需要完成的工作 |
| --- | --- | --- |
| 从已有左值 `source` 复制构造 | 另一组独立的 `double` 对象，初始数值与源相同 | 为副本建立元素；复制构造的工作量随元素数量线性增长 |
| 用 `std::move(source)` 移动构造 | 原来由 `source` 管理的同一批元素 | 接管已有元素及其存储管理关系，无需另建一组元素来保存原数值 |

> [!IMPORTANT]
> 在这个序列例子中，移动节省的是为另一组元素准备存储并复制原数值的工作。成立的前提是接收方可以接管已有数据，调用方无需依赖源对象保留原内容；只需读取原序列时，引用访问就已经足够。

`source` 与 `target` 仍然是两个容器对象，各自保持原有的对象身份。指向容器对象 `source` 的指针仍然指向它；`first` 指向的是元素对象，因此跟随的是这批元素的存储与生命周期。两种访问关系不能混在一起。

移动后的 `source` 保持有效，但这里不依赖它必定为空，也不依赖它保留某个旧元素。可以调用 `empty()` 查询；只有确认存在对应元素后，才可以通过下标访问。它与明确保证移后不承担登记责任的 `registration` 有不同的状态契约。

这项成本结论限定于示例中的移动构造。移动赋值还涉及目标原有元素的处理，其他类型也可能逐项移动自身的成员，不能据此把所有移动操作理解为只交接一个地址。

## 参考资料

- [C++23 工作草案：分配器感知容器的复制与移动构造](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts)
- [C++23 工作草案：容器复制的复杂度](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
- [C++23 工作草案：标准库类型的移后状态](https://timsong-cpp.github.io/cppwp/n4950/lib.types.movedfrom)

- [C++ Core Guidelines：复制操作与副本关系](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-copy-semantic)
- [C++ Core Guidelines：移动操作及源对象的有效状态](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-move-semantic)
- [C++23 工作草案：复制与移动构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：引用绑定的重载优先级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
