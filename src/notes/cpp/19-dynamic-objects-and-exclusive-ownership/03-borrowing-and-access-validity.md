---
title: 动态对象的借用与访问有效性（Borrowing Dynamic Objects and Access Validity）
date: 2026-09-14
order: 3
---

# 动态对象的借用与访问有效性（Borrowing Dynamic Objects and Access Validity）

`unique_ptr` 负责销毁目标，其他代码可以通过指针或引用借用这个目标。取得一个借用地址之后，还需要判断：负责维持对象存活的是谁，哪些操作会让这条访问关系失效？

[拥有者之间的移动](02-transferring-ownership-and-object-identity.md)可以保留被管理对象的身份。但接收方仍然能够结束该对象的生命周期；交接时没有失效，不代表借用可以无限期保留。

## 读取地址没有取得清理责任

对于本章的 `std::unique_ptr<pressure_sensor>`，`owner.get()` 返回 `pressure_sensor*`。它提供目标的地址，不创建另一个传感器，也不转交所有权。`*owner` 则可以用来绑定对目标的引用。

下面给 `pressure_sensor` 增加 `set_value_kpa` 成员函数，用于修改同一传感器的读数。这里的类仅保存数值，不实施量程校验。

拥有者的 `reset()` 无参调用用于结束当前拥有关系：有目标时销毁目标并归还存储；调用完成后拥有者为空。原本为空时则仍然为空。`reset()` 不会销毁拥有者自身。

```cpp
#include <iostream>
#include <memory>

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

    void set_value_kpa(double value_kpa) {
        value = value_kpa;
    }

  private:
    double value;
};

int main() {
    std::unique_ptr<pressure_sensor> owner{std::make_unique<pressure_sensor>(240.0)};
    const pressure_sensor* const observed{owner.get()};

    owner->set_value_kpa(245.0);
    std::cout << observed->value_kpa() << '\n';

    owner.reset();

    if (!owner) {
        std::cout << "no sensor\n";
    }
}
```

程序输出 `245` 和 `no sensor`。借用者看到更新后的读数，因为 `observed` 与 `owner` 访问的是同一个传感器。`observed` 采用 `const pressure_sensor*`，只限制经这条路径修改目标；拥有者仍然可以通过自己的可修改路径更新它。

执行 `reset()` 后，`owner` 还在自己的作用域中，但传感器已经销毁。`observed` 因而成为悬空指针（dangling pointer）；程序没有再读取它，也没有通过它访问目标。若绑定的是引用，目标销毁后同样不能再通过该引用访问传感器。

> [!IMPORTANT]
> 借用的有效性取决于被借用对象是否仍然存活。拥有者变量还在作用域内、借用指针已经取得，都不足以保证目标仍然存在；`reset()` 就能在拥有者销毁之前结束目标的生命周期。

## 失效不会通知已经保存的借用

`reset()` 改变拥有者保存的地址，并清理它原来负责的目标。它不会寻找所有曾经从 `get()` 取得地址的指针变量，再把那些变量逐个设为 `nullptr`。

因此，检查一个长期保存的借用指针是否为空，并不能证明原来的对象仍然存活。不能依赖对失效指针的读取或比较来验证生命周期；应当从负责清理的对象及其操作判断访问是否仍然成立。

把某个可修改的借用指针主动赋为 `nullptr`，可以清除该变量里的失效地址，却不会修复其他借用，也不会让已经销毁的传感器重新存在。

对于一个指向当前动态传感器的有效借用，几种已有操作的影响可以这样区分：

| 对当前拥有者执行的操作 | 原传感器是否继续存在 | 对原传感器的借用 |
| --- | --- | --- |
| 查询读数，或修改读数 | 继续存在，身份不变 | 仍然有效，读取到的数值可能变化 |
| 将所有权移动给另一个拥有者 | 继续存在，由接收方负责清理 | 交接本身不使其失效；之后依赖接收方保留目标 |
| 无参调用 `reset()` | 被销毁 | 失效 |
| 通过移动赋值接收另一个目标 | 当前拥有者原来负责的传感器被销毁 | 对旧传感器的借用失效；对转入传感器的借用不因交接失效 |
| 当前拥有者带着目标销毁 | 被销毁 | 失效 |

表中的转交发生在两个不同的拥有者之间。移动后原拥有者已经为空，它随后销毁，不会再次销毁交出去的目标。

## const 限制拥有者还是限制目标

`const` 写在 `unique_ptr` 外部时，限制的是拥有者对象。`const std::unique_ptr<pressure_sensor>` 不能通过移动或重置交出、替换自己的目标，但访问操作仍然提供对 `pressure_sensor` 的访问。

如果要求通过拥有者只能读取传感器，就要让被管理的类型带有 `const`：`std::unique_ptr<const pressure_sensor>`。这里的尖括号内部指定的是 `const pressure_sensor`，拥有者本身仍然可以修改。

下面的片段可替换首个程序的 `main` 函数体，类定义保持不变：

```cpp
const std::unique_ptr<pressure_sensor> fixed_owner{std::make_unique<pressure_sensor>(240.0)};
fixed_owner->set_value_kpa(245.0);
std::cout << fixed_owner->value_kpa() << '\n';

std::unique_ptr<const pressure_sensor> readonly_owner{
    std::make_unique<const pressure_sensor>(250.0)};
std::cout << readonly_owner->value_kpa() << '\n';
readonly_owner.reset();
```

程序输出 `245` 和 `250`。`make_unique<const pressure_sensor>(250.0)` 直接构造一个 `const pressure_sensor`，因此不能通过 `readonly_owner` 调用非 `const` 的修改函数。不过，销毁一个 `const` 对象是允许的，非 `const` 的 `readonly_owner` 也可以正常调用 `reset()`。

反过来，`fixed_owner.reset()` 无法编译，因为这项操作要修改 `const` 拥有者。它能修改读数，是因为被管理的类型仍然是 `pressure_sensor`，并非 `const pressure_sensor`。

**固定拥有关系与只读访问是两个不同约束。** 两者也可以同时成立，例如 `const std::unique_ptr<const pressure_sensor>`；不论采用哪种限定，借用都不会因此延长目标的生命周期。

## 借用的使用范围需要与管理操作协调

> [!PRACTICE]
> 只在一次操作中读取或修改传感器时，让借用尽量停留在这次操作内，并保证期间不会重置、替换或销毁目标。需要长期保存借用时，就要明确谁维持对象存活，以及停止使用借用和结束目标生命周期的先后关系。
>
> 管理方交接可以保留对象身份，但并不解除这项协调责任。新的拥有者必须知道仍有哪些访问依赖目标继续存在。

如果某次函数调用还能通过其他路径修改拥有者，借用在调用开始时有效也不够：调用内部一旦结束了目标生命周期，剩余代码就不能继续访问它。判断边界应当覆盖实际使用的整个过程，而不只是取得地址的那一行。

## 参考资料

- [C++23 工作草案：unique_ptr 的访问操作](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.observers)
- [C++23 工作草案：reset 与拥有关系修改](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.modifiers)
- [C++23 工作草案：unique_ptr 的移动赋值](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.asgn)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：存储期结束与无效指针值](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.general)
