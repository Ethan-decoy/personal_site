---
title: std::forward 与参数转发（std::forward and Argument Forwarding）
date: 2026-09-28
order: 4
---

# std::forward 与参数转发（std::forward and Argument Forwarding）

[转发引用的推导](./03-reference-collapsing-and-forwarding-references.md#转发引用让左值实参参与特殊推导)让 `T&&` 形参能够接收左值和右值，并把差别保存在推导出的 `T` 中。但包装函数把具名形参继续交给其他函数时，名称表达式本身仍是左值。

参数转发（argument forwarding）要解决的就是这一步：包装层已接到一个对象，怎样按照原调用的左右值关系，把同一个对象交给下一层接口？

## 直接传递参数名会统一提供左值

下面的两个 `receive` 重载分别接收只读引用和非 `const` 右值引用。函数体只输出所选重载及文本，用来观察调用关系，没有执行资源转移。

```cpp
#include <iostream>
#include <string>
#include <utility>

void receive(const std::string& value) {
    std::cout << "const&: " << value << '\n';
}

void receive(std::string&& value) {
    std::cout << "&&: " << value << '\n';
}

template <typename T> void relay(T&& value) {
    receive(value);
}

int main() {
    std::string title{"report"};
    const std::string label{"fixed"};

    relay(title);
    relay(label);
    relay(std::string{"temporary"});
    relay(std::move(title));
    relay(std::move(label));
}
```

程序输出：

```text
const&: report
const&: fixed
const&: temporary
const&: report
const&: fixed
```

即使外层写了 `relay(std::string{"temporary"})`，内层仍选择 `const std::string&`。进入 `relay` 时，推导得到 `T = std::string`，形参类型为 `std::string&&`；随后 `receive(value)` 使用具名参数的左值表达式，不能绑定到 `std::string&&` 重载。

这一版代码能够编译运行，但没有完成包装函数的转发目的。它把所有输入都作为左值交给接收方，因此丢失了外层调用通过右值表达的选择。

## 根据原先推导的 T 转发

`std::forward` 声明在 `<utility>` 中。对这里的 `T&& value` 形参，`std::forward<T>(value)` 使用本次 `relay` 调用推导出的 `T`，按照 `T&&` 折叠后的类型产生指向同一个对象的引用结果。

将上一完整程序中的 `relay` 定义整体替换为：

```cpp
template <typename T> void relay(T&& value) {
    receive(std::forward<T>(value));
}
```

其余定义和 `main` 保持原样，输出变为：

```text
const&: report
const&: fixed
&&: temporary
&&: report
const&: fixed
```

第三、四项现在能选择右值引用重载。`std::forward<T>(value)` 没有重新构造一个字符串，也没有自行修改字符串；它使接收方按相应的引用绑定规则进行重载选择。

对本例的对象，整个关系可以逐项展开：

| 传给 `relay` 的表达式 | 推导出的 `T` | `std::forward<T>` 的返回类型 | 转发表达式的类别 | 选择的 `receive` |
| --- | --- | --- | --- | --- |
| `title` | `std::string&` | `std::string&` | 左值 | `const std::string&` |
| `label` | `const std::string&` | `const std::string&` | 左值 | `const std::string&` |
| `std::string{"temporary"}` | `std::string` | `std::string&&` | 将亡值 | `std::string&&` |
| `std::move(title)` | `std::string` | `std::string&&` | 将亡值 | `std::string&&` |
| `std::move(label)` | `const std::string` | `const std::string&&` | 将亡值 | `const std::string&` |

表中的返回类型与表达式类别需要分开读：返回左值引用的调用是左值，返回对象右值引用的调用是将亡值。`std::forward` 形成的是引用结果；引用类型中的 `&`、`&&` 不表示它创建了另一层对象。

第一行中，`T = std::string&`，返回类型 `T&&` 按[引用折叠](./03-reference-collapsing-and-forwarding-references.md#类型别名怎样触发引用折叠)成为 `std::string&`。第三行中，`T = std::string`，`T&&` 就是 `std::string&&`。因此同一条调用可以对左值来源保留左值，对右值来源提供右值。

## 显式写出的 T 保存着哪一次推导

在上述用法中，`std::forward<T>(value)` 的结果与 `static_cast<T&&>(value)` 的转换关系一致。需要保留的不是运行时标记，而是调用 `relay` 时已经推导出的类型：

- 左值来源使 `T` 带上左值引用，`T&&` 折叠后仍为左值引用。
- 右值来源使 `T` 成为相应的对象类型，`T&&` 形成右值引用。
- 对象类型原有的 `const` 等 cv 限定随类型保留，不因转发而消失。

因此，标准写法要显式提供 `<T>`。如果把上一版 `relay` 再替换成下面的错误定义，程序在实例化调用时不能通过编译：

```cpp
template <typename T> void relay(T&& value) {
    receive(std::forward(value)); // 错误：这里不能推导 std::forward 所需的类型实参。
}
```

`std::forward` 的接口要求调用方给出用来决定转发方式的类型。只有当前的表达式 `value` 不够：它在这些调用中都是左值，无法单凭这个表达式恢复外层实参原先是左值还是右值。

同样，不应把 `<T>` 随意换成一个固定类型。比如 `std::forward<std::string>(value)` 会按照 `std::string&&` 提供结果，即使原来的实参是可修改左值，也会被当作右值交出。这已经改变了包装函数的接口行为。

> [!IMPORTANT]
> 在 `template <typename T> void relay(T&& value)` 的通常转发用法中，把同一个形参 `value` 与本次推导出的 `T` 配对，写成 `std::forward<T>(value)`。`T` 负责保留来源信息，引用折叠负责形成目标引用类型，`std::forward` 负责在继续调用时提供相应的表达式。

## std::move 与 std::forward 表达不同的选择

`std::move` 对这里的普通对象表达式提供将亡值；它不根据外层调用是否传入左值来改变这项选择。若将 `relay` 的定义换成下面这一版，程序仍然合法，但第一项调用的含义改变了：

```cpp
template <typename T> void relay(T&& value) {
    receive(std::move(value));
}
```

原来的 `relay(title)` 现在会输出 `&&: report`。调用者明明提供了普通左值，包装层却把它作为右值交给接收方。如果右值重载实际会改变来源状态，这种改写就可能影响调用方仍打算使用的对象。

这里的示例重载只负责打印，所以它没有改变 `title`。输出 `&&` 只证明选中了右值引用重载，不证明文本已被取走，也不证明字符串变空。

| 写法 | 对本篇普通对象表达式的作用 | 适用意图 |
| --- | --- | --- |
| `value` | 以左值表达式访问 | 当前操作需要访问已命名的对象 |
| `std::move(value)` | 保留 cv 限定，提供将亡值 | 当前代码明确允许接收方复用该对象的状态 |
| `std::forward<T>(value)` | 按本次推导的 `T` 保留左值或提供将亡值 | 包装层把调用方的左右值选择传给下一层 |

这三种写法都不直接执行字符串的移动构造或移动赋值。是否复制、移动、修改或仅读取对象，仍由接收方真正执行的操作决定，延续了[`std::move` 只改变表达式类别](../17-rvalue-references-and-move-semantics/02-std-move-and-expression-category-conversion.md#一个只改变表达式类别的标准库工具)的契约。

## const 不会因为右值来源而消失

正确转发版的最后一项是 `relay(std::move(label))`。外层表达式是表示 `const std::string` 的将亡值，因此 `T = const std::string`，`std::forward<T>(value)` 返回 `const std::string&&`。

接收方提供的是 `std::string&&`，不是 `const std::string&&`。把前者绑定到只读字符串会丢弃 `const`，所以该重载不可用；`const std::string&` 仍可绑定这个对象，最终输出 `const&: fixed`。

这个结果没有破坏转发规则。转发已经保留了来源的 cv 限定及其右值关系，接收方随后按照自己的接口决定可用操作。**右值不等于可修改对象，正确转发也不保证一定调用某个移动操作。**

## 完美转发保留的范围

把这种由转发引用接收、再用 `std::forward<T>` 交给下一层的方式称为完美转发（perfect forwarding）。对于本篇已经成功推导并绑定的普通对象实参，核心是保留对象类型的 cv 限定与左值、右值关系。

这里的“保留”不能理解为每一种表达式性质都完全相同。`std::string{"temporary"}` 原本是纯右值；为了绑定 `relay` 的引用形参，它先物化为临时对象。函数内再经 `std::forward<T>(value)` 提供给 `receive` 的，是表示这个对象的将亡值。两者都属于右值，但纯右值没有原样穿过引用形参。

这一差别也限定了成本判断。如果目标函数按值接收对象，直接传入同类型纯右值可以直接构造目标形参；经引用参数转发得到的将亡值则可能需要移动或复制。不能仅凭写了 `std::forward`，就保证包装调用与直接调用具有完全相同的构造行为，也不能由它推出整个包装过程零成本。

此外，转发的前提仍是能够完成模板实参推导与引用绑定。花括号列表等不在前述普通对象表达式范围内的输入，不能靠 `std::forward` 自动变成可推导的实参；下一层接口不接受某种类型或访问方式时，转发也不会替它创造一个可用操作。

## 转发不延长实参的生命周期

在正确转发版的 `relay(std::string{"temporary"});` 中，临时字符串在包含这次调用的完整表达式结束时销毁，也就是该语句的分号处。嵌套的 `receive` 调用发生在此之前，因此示例中的打印可以安全读取文本。

若接收方改为保存指向该字符串的引用或指针，试图在这条语句结束后再使用，就会面对已销毁的对象。`std::forward` 返回对原对象的引用，既不为对象增加一个拥有者，也不把临时实参的生命周期延长到保存下来的引用的生命周期。这与[临时对象的生命周期不会沿引用关系传播](../08-object-identity-and-lvalue-references/04-temporary-objects-and-lifetime-extension.md#生命周期延长不会沿引用关系传播)一致。

对 `title` 这样的已有局部对象，转发同样不改变它的销毁时刻。是否允许接收方改变它的状态，以及它能活多久，是两项独立的判断。

> [!PRACTICE]
> 当函数的职责是在当前调用中把实参交给下一层接口时，转发引用与 `std::forward<T>` 可以保留调用方的左右值选择。如果函数要把对象保存起来供以后使用，应另外明确保存的是独立对象还是借用，并核对复制、移动及生命周期契约；转发本身不提供这些保证。

## 参考资料

- [C++23 工作草案：std::forward 与 std::move 的返回关系](https://timsong-cpp.github.io/cppwp/n4950/utility#forward)
- [C++23 工作草案：转发引用的模板实参推导](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
- [C++23 工作草案：static_cast 与引用结果](https://timsong-cpp.github.io/cppwp/n4950/expr.static.cast)
- [C++23 工作草案：函数调用表达式的值类别](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：临时对象物化与引用形参的生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
