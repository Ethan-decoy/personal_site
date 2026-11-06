---
title: decltype 与表达式类型（decltype and Expression Types）
date: 2026-09-28
order: 1
---

# decltype 与表达式类型（decltype and Expression Types）

同一个对象可以按值读取，也可以通过引用访问。泛型代码若要沿用某个结果的类型，就需要分清：要取的是变量声明中的类型，还是表达式所提供的访问关系。

`decltype` 是从名称或表达式取得类型的语言设施。它写作 `decltype(expression)`，整体可以放在需要类型的位置。**它只取得类型，不执行括号里的表达式，也不会因此复制对象。**

## 从已有声明取得类型

[类型别名](../32-class-templates-and-generic-types/05-type-aliases-and-member-types.md#using-为已有类型起别名)可以替已有类型命名；配合 `decltype`，不必再次手写那个类型。下面是一个完整程序：

```cpp
#include <iostream>

int main() {
    int value{220};
    int& alias{value};

    using value_type = decltype(value);
    using alias_type = decltype(alias);

    const value_type copy{value};
    alias_type borrowed{value};
    borrowed = 230;

    std::cout << value << ' ' << copy << '\n';
}
```

程序输出 `230 220`。`decltype(value)` 得到声明中的 `int`，`decltype(alias)` 得到声明中的 `int&`。因此 `copy` 是独立的整数对象，`borrowed` 则是指向 `value` 的另一个引用。别名声明本身没有读取或复制 `value`；对象初始化和赋值发生在随后的语句中。

这使用了 `decltype` 的一条特殊规则：对于这里的普通变量，**操作数若是没有额外括号包围的名称，就取得被命名实体的声明类型**。普通成员访问也适用这条规则，但一般表达式需要采用另一条判断路径。

## 一般表达式把值类别映射到引用类型

[表达式的类型与值类别](../17-rvalue-references-and-move-semantics/01-rvalue-references-and-xvalues.md#三种值类别与引用绑定)共同说明它提供什么结果。`decltype` 对一般表达式的处理如下；表中的 `U` 是表达式的非引用类型，保留它实际具有的 `const` 等限定：

| 一般表达式的值类别 | `decltype` 得到的类型 |
| --- | --- |
| 左值（lvalue） | `U&` |
| 将亡值（xvalue） | `U&&` |
| 纯右值（prvalue） | `U` |

这里不是说表达式本来具有引用类型，而是 `decltype` **把表达式的类型和值类别编码为一个类型**。例如，普通整型变量作为表达式是 `int` 左值；一般表达式规则会把它表示成 `int&`。

对照下面的完整程序。`std::same_as` 用于检查两个类型是否相同：

```cpp
#include <concepts>
#include <iostream>
#include <utility>

int main() {
    int value{220};
    int&& candidate{230};

    std::cout << std::same_as<decltype(value), int> << ' '
              << std::same_as<decltype((value)), int&> << '\n';
    std::cout << std::same_as<decltype(candidate), int&&> << ' '
              << std::same_as<decltype((candidate)), int&> << '\n';
    std::cout << std::same_as<decltype(std::move(value)), int&&> << ' '
              << std::same_as<decltype(value + 1), int> << '\n';
}
```

三行都输出 `1 1`，但每行证明的关系不同：

- `decltype(value)` 中，操作数是名称 `value`，适用声明类型规则。`decltype((value))` 中，操作数是带括号的表达式 `(value)`，改用一般表达式规则，因此得到 `int&`。
- `candidate` 声明为 `int&&`，但[`candidate` 在这里作为表达式仍是左值](../17-rvalue-references-and-move-semantics/01-rvalue-references-and-xvalues.md#右值引用怎样绑定对象)。所以前一种写法得到 `int&&`，后一种得到 `int&`。
- `std::move(value)` 是 `int` 将亡值，`value + 1` 是 `int` 纯右值，因此分别得到 `int&&` 和 `int`。它们在 `decltype` 内都没有真正求值。

`decltype(...)` 最外层的括号属于语法。`decltype((value))` 里面多出的那对括号才使操作数不再是“没有额外括号的名称”。**括号没有把左值变成另一种值类别，改变的是 `decltype` 使用哪条规则。**

> [!TIP]
> 对本篇的普通变量和成员，先看操作数是否为没有额外括号的名称或成员访问；是，就取声明类型。否则，再依据表达式的类型和值类别判断 `U`、`U&` 或 `U&&`。不要一看到变量名，就把两条路径混为一谈。

## 成员声明与本次访问可以有不同限定

成员访问也能显示两条规则的区别。下面的完整程序通过一个只读对象访问其成员：

```cpp
#include <concepts>
#include <iostream>

struct reading {
    double pressure_kpa;
};

int main() {
    const reading source{220.0};

    std::cout << std::same_as<decltype(source.pressure_kpa), double> << ' '
              << std::same_as<decltype((source.pressure_kpa)), const double&> << '\n';
}
```

程序输出 `1 1`。`pressure_kpa` 在结构体里声明为 `double`，所以 `decltype(source.pressure_kpa)` 得到 `double`。通过 `const reading` 对象访问这个普通数据成员时，表达式则是 `const double` 左值，所以 `decltype((source.pressure_kpa))` 得到 `const double&`。

前者描述“成员怎样声明”，后者描述“这次表达式怎样访问成员”。`decltype` 没有移除实际访问的只读限制，也不会让 `source.pressure_kpa` 因而变得可修改。

## 不求值仍然要求表达式合法

不求值意味着可以检查一种操作的结果类型，而不执行该操作。以下完整程序中的 `increment(value)` 就没有真正调用：

```cpp
#include <iostream>

int& increment(int& value) {
    return ++value;
}

int main() {
    int value{220};
    using increment_result = decltype(increment(value));

    increment_result alias{value};
    std::cout << value << ' ' << alias << '\n';
}
```

程序输出 `220 220`。`increment` 声明为返回 `int&`，它的调用表达式是左值，因此 `increment_result` 是 `int&`。但 `decltype` 不执行调用，函数体中的自增没有发生，`value` 仍为 `220`。

“不求值”不等于“表达式可以随意写”。名称必须能够找到，所写操作也必须合法。例如把 `main` 中的 `value` 改成 `const int` 后，它不能绑定到 `increment` 的 `int&` 形参，调用写在 `decltype` 中仍会导致编译错误。`decltype` 不是自动忽略错误的检查器。

## 复合要求保留的正是表达式关系

[复合要求的箭头](../33-template-constraints-and-concepts/03-compound-requirements-and-result-types.md#箭头会自动补入表达式的类型)会把表达式对应的类型放在概念的第一个模板实参位置。现在可以准确地写出它采用的类型：**`decltype((expression))`**。

例如，对要求 `{ value.read() } -> std::same_as<double>;`，检查的相当于 `std::same_as<decltype((value.read())), double>`。`read()` 若返回 `const double&`，调用表达式是 `const double` 左值，得到的就是 `const double&`，不会被悄悄转成 `double`。

同样的规则可以用于泛型代码中的类型别名、接口声明和结果类型判断。它保留的是类型信息；这个类型若代表引用，被引用对象能存活多久，仍需根据对象的来源判断。

## 参考资料

- [C++23 工作草案：decltype 的类型规则](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.decltype)
- [C++23 工作草案：值类别与表达式类型](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：复合要求中的结果类型](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.compound)
