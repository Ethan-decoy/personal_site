---
title: 所有权转移与对象身份（Transferring Ownership and Object Identity）
date: 2026-09-14
order: 2
---

# 所有权转移与对象身份（Transferring Ownership and Object Identity）

观察代码已经取得一个传感器的地址，管理方随后要把它交给另一个拥有者。能否继续使用原来的地址，取决于交接改变了传感器本身，还是只改变了谁负责它。

对于 `std::unique_ptr`，移动操作转交的是拥有关系。**移动拥有者不会因此移动它管理的对象；目标仍是原来的对象，清理责任由接收方承担。** 本篇讨论默认销毁方式下，同一种单对象拥有者类型之间的移动。

## 移动构造转交责任，保留目标对象

`owner.get()` 返回拥有者保存的目标指针；空拥有者返回 `nullptr`。取得这个指针只提供借用，不会改变拥有关系。它适合用来观察目标地址，或者把访问交给需要普通指针的接口。

`std::unique_ptr` 禁用了复制构造和复制赋值，允许通过移动交接。`std::move(source)` 将源表达式转换为可用于移动的形式，真正的交接发生在接收方的构造或赋值操作中。使用 `std::move` 需要直接包含 `<utility>`。

下面的 `pressure_sensor` 保存压力读数。程序先记录它的地址，再把拥有关系交给 `target`：

```cpp
#include <iostream>
#include <memory>
#include <utility>

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

  private:
    double value;
};

int main() {
    std::unique_ptr<pressure_sensor> source{std::make_unique<pressure_sensor>(240.0)};
    const pressure_sensor* const observed{source.get()};

    const std::unique_ptr<pressure_sensor> target{std::move(source)};

    std::cout << (source.get() == nullptr) << '\n';
    std::cout << (target.get() == observed) << '\n';
    std::cout << observed->value_kpa() << '\n';
}
```

输出依次为 `1`、`1`、`240`。其中 `observed` 是一个指针值不再改变的只读借用；移动后它仍然访问原传感器。

这次构造前后的关系如下：

| 对象或访问关系 | 构造前 | 构造后 |
| --- | --- | --- |
| `source` | 拥有传感器 | 仍然存在，但为空 |
| `target` | 尚未构造 | 拥有原传感器 |
| 动态传感器 | 保存 `240.0` | 仍是同一个对象，地址与读数不变 |
| `observed` | 借用该传感器 | 保持原来的访问关系 |

`target` 的移动构造没有调用 `pressure_sensor` 的复制构造或移动构造。即使传感器类型禁止复制和移动，也不妨碍这种拥有者之间的交接：被创建的新对象是 `target`，传感器没有被重新构造。

正常离开作用域时，`target` 负责销毁传感器；已经为空的 `source` 不再清理它。源拥有者本身没有因移动而销毁。

## 禁止复制的是拥有关系

在上述程序中，如果把 `target` 的声明替换为下面这一行，代码不能编译，因为它要求调用已删除的拥有者复制构造函数：

```cpp
const std::unique_ptr<pressure_sensor> target{source};
```

这项限制不等于传感器的值不能复制。是否能复制传感器，由 `pressure_sensor` 自己的接口决定。如果明确需要另一个独立传感器，可以根据业务所需的状态创建它；新的对象有新的身份，原来的观察指针不会改为观察它。

同样，`std::unique_ptr<pressure_sensor>& alias{source};` 只是给原拥有者建立引用，没有创建第二个拥有者，也没有转交责任。

> [!IMPORTANT]
> 判断移动后的访问关系，要先确认访问的对象：指向传感器的指针仍然指向传感器；绑定 `source` 的引用仍然绑定原拥有者，看到的则是交接后的空状态。移动不会把所有相关指针和引用一起改指接收方。

## 移动赋值还要结束目标原有的责任

接收方如果已经拥有另一个传感器，就必须处理那一项已有责任。对于两个不同的拥有者，移动赋值会销毁目标原先管理的对象、归还其存储，并让目标接管源所管理的对象；源变为空状态。

下面的片段可以替换第一个程序的 `main` 函数体：

```cpp
std::unique_ptr<pressure_sensor> source{std::make_unique<pressure_sensor>(240.0)};
std::unique_ptr<pressure_sensor> target{std::make_unique<pressure_sensor>(250.0)};
const pressure_sensor* const observed{source.get()};

target = std::move(source);

std::cout << (source.get() == nullptr) << '\n';
std::cout << (target.get() == observed) << '\n';
std::cout << target->value_kpa() << '\n';
```

输出仍然依次为 `1`、`1`、`240`，但过程中发生的清理不同：原来保存 `250.0` 的传感器已经销毁，保存 `240.0` 的传感器继续存在。这里没有给旧传感器赋一个新读数，也没有调用传感器的移动赋值。

如果其他代码借用了原来保存 `250.0` 的传感器，这些借用在此次赋值后失效。拥有者 `target` 仍在，不能证明它过去管理的对象仍在。

源拥有者也可以为空。向一个非空目标移动赋值一个空源，会清理目标原来的对象，并让目标变空。对本篇的默认销毁方式，拥有者的移动构造和移动赋值都具有 `noexcept` 承诺；目标原有对象的析构仍须遵守不向外抛出异常的要求。

上述交接分析针对不同拥有者。若给拥有者自身做移动赋值，`unique_ptr` 保留它原来的目标指针，不能套用“源一定变空”来推断自移动结果。

## 创建它的局部拥有者可以先结束

被管理对象的生命可以跨越原拥有者的作用域，条件是责任已经交给仍然有效的接收方。下面仍是替换第一个程序 `main` 函数体的片段：

```cpp
std::unique_ptr<pressure_sensor> target{};
const pressure_sensor* observed{nullptr};

{
    std::unique_ptr<pressure_sensor> source{std::make_unique<pressure_sensor>(240.0)};
    observed = source.get();
    target = std::move(source);
}

std::cout << observed->value_kpa() << '\n';
```

程序输出 `240`。内层作用域结束时，空的 `source` 被销毁，传感器仍由外层的 `target` 管理。最后销毁 `target` 才结束传感器的生命周期。

如果没有转交责任，内层拥有者结束时就会销毁目标，保存在外面的普通指针不能维持它的生命。能够跨越作用域的是被管理对象，并非原局部拥有者偷偷延长了自己的生命周期。

> [!PRACTICE]
> 当其他代码必须继续观察同一个对象时，交接拥有者能够保留目标身份。还应同时检查接收方原来管理的对象是否正被借用，以及新的拥有者是否覆盖所有借用所需的有效期。
>
> 移动拥有者可以省去重建被管理对象的工作，但移动赋值仍可能执行旧目标的析构和存储释放。应当按实际的交接与清理动作判断成本。

## 参考资料

- [C++23 工作草案：unique_ptr 的构造与移动后状态](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.ctor)
- [C++23 工作草案：unique_ptr 的移动赋值](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.asgn)
- [C++23 工作草案：get 与目标访问](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.observers)
- [C++23 工作草案：unique_ptr 的复制操作被删除](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.general)
