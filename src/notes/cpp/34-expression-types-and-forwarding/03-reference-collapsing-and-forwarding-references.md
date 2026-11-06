---
title: 引用折叠与转发引用（Reference Collapsing and Forwarding References）
date: 2026-09-28
order: 3
---

# 引用折叠与转发引用（Reference Collapsing and Forwarding References）

一个包装函数要把输入交给其他函数，输入既可能是调用方保留的对象，也可能是临时对象。普通按值推导会建立自己的形参对象，用 `const T&` 从对象实参推导则提供只读访问；如果包装层需要保留原对象的可修改性，并区分左值与右值来源，就需要另一种推导关系。

这时常见的形参写法是 `T&& value`。对于具体对象类型，`int&&` 不能绑定普通整数左值；但在特定的模板推导语境中，`T&&` 可以接收左值。关键不是取消右值引用的绑定规则，而是**左值实参会使 `T` 本身推导成引用类型，再由引用折叠形成最终形参类型**。

## 类型别名怎样触发引用折叠

类型别名可以直接表示一个引用类型。下面的完整程序用 `std::same_as` 检查：给这样的别名再附加 `&` 或 `&&`，最终得到什么类型。

```cpp
#include <concepts>
#include <iostream>

int main() {
    using lvalue_ref = int&;
    using rvalue_ref = int&&;

    std::cout << std::same_as<lvalue_ref&, int&> << ' ' << std::same_as<lvalue_ref&&, int&> << ' '
              << std::same_as<rvalue_ref&, int&> << ' '
              << std::same_as<rvalue_ref&&, int&&> << '\n';
}
```

输出为 `1 1 1 1`。语言没有建立“引用的引用”这种对象关系，而是按引用折叠（reference collapsing）规则，把组合后的类型化简成一种引用：

| 内层类型 | 外层附加 `&` | 外层附加 `&&` |
| --- | --- | --- |
| `X&` | `X&` | `X&` |
| `X&&` | `X&` | `X&&` |

**只有内外两层都是右值引用时，结果才是 `X&&`；其余情况都折叠为 `X&`。** 这里的 `X` 表示被引用的类型，也可以带有 `const`。

例如，`lvalue_ref&&` 的内部组合可以记作 `(int&)&&`，折叠结果是 `int&`。这个记法用来推演类型，不是让源程序直接写出 `int& &&`；直接把多个引用符号堆在声明中不能定义“引用的引用”。引用别名、表示引用类型的模板形参，以及得到引用类型的 `decltype`，都可以触发这里的折叠规则。

## const 不能把引用本身限定为只读

折叠时还要分清 `const int&` 与“给一个引用类型添加 `const`”。前者是对 `const int` 的引用，限制通过这条路径修改整数；后者试图限定引用本身，不会得到一种新的只读引用类型。

如果类型别名 `lvalue_ref` 已经表示 `int&`，那么 `const lvalue_ref` 中新增的 `const` 会被忽略，结果仍是 `int&`，不会变成 `const int&`。类型模板形参表示引用类型时，也有同样的关系。下面是一个完整程序：

```cpp
#include <concepts>
#include <iostream>

template <typename T> void increment_alias(const T& value) {
    std::cout << std::same_as<decltype(value), int&> << '\n';
    ++value;
}

int main() {
    int count{10};
    increment_alias<int&>(count);
    std::cout << count << '\n';
}
```

程序输出 `1`、`11`。调用显式指定 `T = int&`，所以形成 `const T&` 时，附着到引用类型上的 `const` 被忽略，外层 `&` 再与内层引用折叠，最终形参为 `int&`。`++value` 因而可以修改 `count`。

这里必须保留显式的 `<int&>`。若改为普通调用 `increment_alias(count)`，`T` 会按 `const T&` 的模式推导为 `int`，实际形参成为 `const int&`，函数体中的 `++value` 就会编译失败。

这也解释了为什么[用 `const T&` 描述只读操作要求](../33-template-constraints-and-concepts/02-requires-expressions-and-valid-operations.md#用操作要求定义概念)时，需要限定 `T` 为非引用对象类型。允许 `T` 本身为引用类型之后，不能只看 `const T&` 的字面写法就断言访问一定只读。

> [!IMPORTANT]
> `const int&` 保留被引用整数的 `const`。如果 `T` 已经是 `int&`，`const T&` 不会给整数补上 `const`。形成完整类型时，先辨认限定作用于对象类型还是引用类型，再应用引用折叠。

## 转发引用让左值实参参与特殊推导

在本篇讨论的普通函数模板中，若形参写作 `T&&`，`T` 是该函数模板自己的类型模板形参，并且该写法未给 `T` 附加 `const` 或 `volatile`，这个形参就是转发引用（forwarding reference）。当前调用实际从实参推导 `T` 时，具有一条特殊规则：**若实参是左值，`T` 推导为该实参类型的左值引用。**

下面的程序分别传入可修改左值、只读左值和纯右值。输出的前三列依次检查 `T` 是否为 `int&`、`const int&`、`int`，最后一列检查完整形参类型是否等于折叠后的 `T&&`。

```cpp
#include <concepts>
#include <iostream>

template <typename T> void inspect(T&& value) {
    std::cout << std::same_as<T, int&> << ' ' << std::same_as<T, const int&> << ' '
              << std::same_as<T, int> << ' ' << std::same_as<decltype(value), T&&> << '\n';
}

int main() {
    int count{10};
    const int limit{20};

    inspect(count);
    inspect(limit);
    inspect(30);
}
```

程序输出：

```text
1 0 0 1
0 1 0 1
0 0 1 1
```

推导与折叠是两个连续步骤：

| 实参 | 推导出的 `T` | 代入 `T&&` 后的形参类型 |
| --- | --- | --- |
| 可修改 `int` 左值 `count` | `int&` | `(int&)&&` 折叠为 `int&` |
| `const int` 左值 `limit` | `const int&` | `(const int&)&&` 折叠为 `const int&` |
| `int` 右值，例如 `30` | `int` | `int&&` |

`inspect(count)` 没有把左值绑定到 `int&&`：这个实例的完整形参从一开始就是 `int&`。相比之下，[普通 `T&` 形参](../31-function-templates-and-type-deduction/03-value-and-reference-parameters.md#引用模式保留绑定关系t-不一定含有引用)接收 `count` 时，通常推导 `T = int`，由形参模式里的 `&` 构成 `int&`。最终类型相同，推导路径却不同。

表格中的 `int` 可以替换成普通对象类型 `X`：`X` 左值对应 `T = X&`，`const X` 左值对应 `T = const X&`，不带 `const` 的 `X` 右值对应 `T = X`。右值也可能带 `const`；此时推导保留它，得到 `T = const X`，完整形参为 `const X&&`。

本篇用普通整数和类对象说明这条关系，不展开原生数组、函数或花括号初始化列表的推导。尤其是 `{1, 2}` 本身不是一个普通的有类型表达式，不能仅凭“能够接收左右值”就断言 `inspect({1, 2})` 可以推导 `T`。

## 不是所有写作 T&& 的形参都会这样推导

判断转发引用，必须结合 `T` 的来源和调用中的推导位置。下面的声明都放在命名空间作用域：

```cpp
template <typename T> void inspect_const(const T&& value);

template <typename T> struct receiver {
    void accept(T&& value);
};
```

`inspect_const` 的形参写成 `const T&&`，不是这里要求的、对未附加 cv 限定的类型模板形参的右值引用。传入整数左值时，不会把 `T` 特殊推导为 `int&` 来接住它；`const int&&` 仍然不能绑定普通整数左值。

`receiver<int>` 中 `accept` 的形参则已经是 `int&&`。`T` 来自类模板，确定类类型时就已经选定，调用 `accept` 不会再从实参推导这个 `T`。如果显式写成 `receiver<int&>`，成员形参确实会折叠为 `int&`，但这是代入已有类型的结果，不是本次成员调用进行了转发引用推导。

即使原模板是 `inspect(T&&)`，显式指定 `T` 也会改变判断。将前一完整程序的 `main` 整体替换成下面的错误示例：

```cpp
int main() {
    int count{10};
    inspect<int>(count); // 错误：实际形参是 int&&，不能绑定 count 这个左值。
}
```

`<int>` 已经确定 `T = int`，不会再从 `count` 推导出 `int&`。若显式写成 `inspect<int&>(count)`，折叠后为 `int&`，调用可以成立；这时使用的是显式给出的引用类型，也不是由左值实参推导出来的。

因此，不能把转发引用概括成“所有 `&&` 都能接收左值”，也不能把显式指定模板实参与让模板自行推导视为相同操作。

## 具名形参仍然以左值表达式使用

`inspect(30)` 推导 `T = int`，所以 `value` 的声明类型是 `int&&`。在函数体内把名称 `value` 用作另一个函数的实参时，它仍是左值表达式，遵循[具名右值引用的访问规则](../17-rvalue-references-and-move-semantics/01-rvalue-references-and-xvalues.md#右值引用怎样绑定对象)。

可以用两种 `decltype` 写法分开查看：在这个实例中，`decltype(value)` 得到声明类型 `int&&`，`decltype((value))` 则因括号内的表达式是左值而得到 `int&`。形参的声明类型记录了绑定关系，不会使之后每次写出这个名称都自动提供右值。

这使包装函数面对两个不同问题：进入函数时，转发引用能够保留推导信息；继续调用其他函数时，单独写 `value` 仍只提供左值。后一个问题由[根据 `T` 转发实参](./04-std-forward-and-argument-forwarding.md#根据原先推导的-t-转发)处理。

## auto&& 也可以从单个表达式形成借用

局部变量使用 `auto&&`，并从单个普通表达式推导类型时，也会按相应的模板推导规则处理左右值。下面片段放在已包含 `<concepts>` 和 `<iostream>` 的函数体内：

```cpp
int count{10};
const int limit{20};

auto&& first = count;
auto&& second = limit;
auto&& third = 30;

std::cout << std::same_as<decltype(first), int&> << ' '
          << std::same_as<decltype(second), const int&> << ' '
          << std::same_as<decltype(third), int&&> << '\n';

first = 11;
std::cout << count << '\n';
```

输出为 `1 1 1`、`11`。`first` 借用 `count`，`second` 只读地借用 `limit`，`third` 直接绑定由 `30` 物化的临时整数。在这条局部引用初始化中，临时整数的生命周期延长到 `third` 的生命周期结束；它并没有被复制进一个名为 `third` 的独立整数对象。

这里的 `auto&&` 根据初始化表达式选择引用类型，并不意味着任意借用都安全。引用已有对象时，仍须由原对象的生命周期覆盖使用；若初始化表达式来自返回引用的函数，`auto&&` 也不能修复该函数交出的悬空引用。本节的推导对照限定为上面的单表达式初始化，不把 `auto&& value = {1, 2};` 这类花括号列表套进同一张表。

## 参考资料

- [C++23 工作草案：引用类型、cv 限定与引用折叠](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：从函数调用推导模板实参与转发引用](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
- [C++23 工作草案：auto 占位类型的推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.auto.deduct)
- [C++23 工作草案：名称表达式的值类别](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.unqual)
