---
title: 所有权转交与借用有效性（Ownership Transfer and Borrowed Access）
date: 2026-09-14
order: 2
---

# 所有权转交与借用有效性（Ownership Transfer and Borrowed Access）

传感器的地址已经交给观察代码。此后，移出拥有权、更换目标或清空拥有者，都要重新判断观察代码何时还能使用那个地址。

## 读取地址没有取得清理责任

`owner.get()` 取得的是拥有者保存的指针。保存这个指针只建立借用，目标须存活到最后一次访问。

> [!IMPORTANT] 顺着目标判断借用是否有效
> **不同的拥有者交接同一目标时，来源变空，原有借用仍指向那个目标。** 当操作销毁该目标时，对它的借用随之失效。对源拥有者本身的引用仍然引用源，可以观察它交接后的状态。

## 移动构造转交责任，保留目标对象

下面用同一条借用 `observed` 追踪读数为 `240.0` kPa 的传感器。`source` 先把它交给新建的 `target`，`target` 再把它交给已有传感器的 `receiver`。各自的计数都先于对应的传感器建立，并存活到其析构完成。

```cpp
#include <iostream>
#include <memory>
#include <utility>

class pressure_sensor {
  public:
    pressure_sensor(const double value_kpa, int& count)
        : value{value_kpa}, destruction_count{count} {}

    ~pressure_sensor() {
        ++destruction_count;
    }

    double value_kpa() const {
        return value;
    }

  private:
    const double value;
    int& destruction_count;
};

int main() {
    int transferred_destructions{0};
    int old_destructions{0};
    std::unique_ptr<pressure_sensor> receiver =
        std::make_unique<pressure_sensor>(260.0, old_destructions);
    const pressure_sensor* observed{nullptr};

    {
        std::unique_ptr<pressure_sensor> source =
            std::make_unique<pressure_sensor>(240.0, transferred_destructions);
        const std::unique_ptr<pressure_sensor>& source_alias{source};
        observed = source.get();

        std::unique_ptr<pressure_sensor> target{std::move(source)};
        std::cout << "source empty: " << !source_alias << '\n';
        std::cout << "same sensor after construction: " << (target.get() == observed) << '\n';

        receiver = std::move(target);
        std::cout << "target empty: " << !target << '\n';
        std::cout << "old sensor destructions: " << old_destructions << '\n';
    }

    std::cout << "same sensor after assignment: " << (receiver.get() == observed) << '\n';
    std::cout << "transferred sensor destructions: " << transferred_destructions << '\n';
    std::cout << observed->value_kpa() << '\n';

    receiver.reset();
    std::cout << "receiver empty: " << !receiver << '\n';
    std::cout << "transferred sensor destructions: " << transferred_destructions << '\n';
    observed = nullptr;
}
```

程序输出如下。

```text
source empty: 1
same sensor after construction: 1
target empty: 1
old sensor destructions: 1
same sensor after assignment: 1
transferred sensor destructions: 0
240
receiver empty: 1
transferred sensor destructions: 1
```

`std::move(source)` 提供将亡值，构造 `target` 时才执行所有权转交。绑定 `source` 的 `source_alias` 读到空状态，指向传感器的 `observed` 则仍指向同一对象。见[表达式类别转换](../17-rvalue-references-and-move-semantics/02-std-move-and-expression-category-conversion.md#一个只改变表达式类别的标准库工具)。

## 移动赋值还要结束接收方原有的责任

`receiver = std::move(target)` 先从 `target` 取出指针并使其变空。`receiver` 先保存转入的指针，再用旧指针销毁原来的 `260.0` kPa 传感器。对旧传感器的借用在这时失效。

退出内层作用域时，`source` 和 `target` 都作为空拥有者销毁。`receiver` 继续管理 `240.0` kPa 的传感器，所以它的析构计数仍为 `0`，`observed` 可以继续读取它。

对不同的同类型拥有者，从空源移动赋值也会清理接收方的旧目标，接收方随后为空。同一个 `std::unique_ptr` 自移动赋值后保留原先的指针。本例使用默认删除器，传感器的析构正常完成。

## 重置目标后，结束对它的借用

`receiver.reset()` 使 `receiver` 变空，把 `240.0` kPa 传感器的析构计数增至 `1`。这个目标的存储已归还，程序从此停止经 `observed` 访问它，并直接把 `nullptr` 写入指针变量。

> [!WARNING] 拥有者变空和借用失效分别判断
> 转交后，源拥有者为空，传感器可由接收方继续管理。无参 `reset()` 也使拥有者变空，但会销毁它原来持有的目标。销毁之后，复制或比较失效的旧指针值也不能作为可移植的有效性检查。给指针直接赋新值时则无需读取旧值。见[空指针、悬空指针与有效性](../07-object-addresses-and-pointers/05-null-dangling-pointers-and-validity.md#指针存在不等于目标存在)。

即使借用通过函数向外传递，也要核对使用期间是否存在重置、替换或销毁目标的路径。

## 禁止复制的是拥有关系

若将主例中的 `target` 声明改为 `std::unique_ptr<pressure_sensor> target{source};`，初始化会选中已删除的复制构造，编译失败。`std::unique_ptr` 的复制赋值也已删除。需要第二个传感器时，可以重新构造独立目标。需要交接同一个传感器时，移动拥有者即可，即使目标类型本身禁止复制和移动。

## 参考资料

- [C++23 工作草案：unique_ptr 的复制操作被删除](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.general)
- [C++23 工作草案：unique_ptr 的移动构造](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.ctor#18)
- [C++23 工作草案：unique_ptr 的移动赋值](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.asgn#3)
- [C++23 工作草案：reset 更新指针与清理旧目标](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.modifiers#3)
- [C++23 工作草案：存储期结束与无效指针值](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.general#4)
