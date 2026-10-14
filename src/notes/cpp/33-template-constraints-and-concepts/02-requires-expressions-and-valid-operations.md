---
title: requires 表达式与操作有效性（Requires Expressions and Valid Operations）
date: 2026-09-27
order: 2
---

# requires 表达式与操作有效性（Requires Expressions and Valid Operations）

读取压力的接口不一定由同一个类实现。只要一个对象提供当前需要的操作，就可能成为合适的输入；此时检查它是不是某一种内置类型，并不能表达这个要求。

requires 表达式（requires-expression）用一组类型和表达式要求来进行检查。它得到一个 `bool` 结果，可以用来定义概念，再由 requires 子句把这个条件附着到接口上。

## 用操作要求定义概念

以下以非引用对象类型 `T` 为例，检查通过只读引用访问对象时，能否写出 `value.read()` 这条调用表达式。下面的概念定义应放在命名空间作用域：

```cpp
template <typename T>
concept has_read = requires(const T& value) { value.read(); };
```

`template <typename T>` 声明类型模板形参，`concept has_read = ...;` 用等号右边的条件定义名为 `has_read` 的概念。于是 `has_read<T>` 就可以表示“当前类型是否满足这份要求”。

`requires(const T& value) { ... }` 是右侧的 requires 表达式。括号里的 `value` 为检查提供一个名称，并指定通过 `const T&` 访问对象；大括号中的 `value.read();` 是简单要求（simple requirement），检查这条表达式是否合法。

这里的分号结束一项要求，不是让程序执行一次读取。requires 表达式中的局部参数只为描述检查服务，不实际创建对象，也没有对象存储和生命周期。

| 写法 | 当前职责 |
| --- | --- |
| `requires has_read<T>` | requires 子句：把一个条件作为声明的约束 |
| `requires(const T& value) { value.read(); }` | requires 表达式：检查所列要求，得到 `bool` 结果 |
| `concept has_read = ...;` | 为条件提供可以复用的概念名称 |

同一个关键字出现在不同位置，承担的语法职责不同。

## 能够调用，不等于已经取得所需结果

下面的完整程序检查几种不同的读取接口：

```cpp
#include <iostream>

template <typename T>
concept has_read = requires(const T& value) { value.read(); };

struct pressure_sensor {
    double read() const {
        return 220.0;
    }
};

struct logging_sensor {
    void read() const {
        std::cout << "reading logged\n";
    }
};

struct mutable_sensor {
    double read() {
        return 230.0;
    }
};

int main() {
    std::cout << has_read<pressure_sensor> << ' ' << has_read<int> << ' '
              << has_read<logging_sensor> << ' ' << has_read<mutable_sensor> << '\n';
}
```

程序只输出 `1 0 1 0`，不会输出 `reading logged`。

| 模板实参 | 检查结果 | 原因 |
| --- | --- | --- |
| `pressure_sensor` | `true` | 可以经只读对象调用 `read() const` |
| `int` | `false` | 没有可供调用的 `read` 成员 |
| `logging_sensor` | `true` | 调用表达式合法，即使返回类型是 `void` |
| `mutable_sensor` | `false` | 普通 `read()` 不能经当前的 `const T&` 调用 |

**简单要求只证明所写的表达式合法。** `has_read` 没有要求调用返回 `double`，也没有要求读取成功或得到正数。概念的名字不能替没有写出的要求提供保证。

大括号内的表达式是不求值操作数（unevaluated operand）：编译器检查表达式能否形成，不执行其中的操作。因此检查 `logging_sensor` 时不会调用它的函数体，更不会为了测试设备是否可读而实际访问设备。

## 检查的访问方式应当与实现相同

`requires(const T& value)` 中的 `const` 影响成员选择，与普通代码中的只读访问一样。若将它改成 `requires(T& value)`，`mutable_sensor` 就可以通过这项检查，但得到的是“经可修改对象调用”的能力。

如果实际函数接收 `const T&`，约束却只检查 `T&` 上的调用，就可能让类型通过约束，随后又在函数体中失败。**应按实际实现使用的访问方式写出检查表达式。**

这里的 `value` 是具名表达式，因此是左值。检查右值访问时也要明确写出对应表达式；仅仅把参数类型里的符号改成右值引用，不会让具名参数的每次使用自动变成右值。这与已有的[具名右值引用仍作为左值表达式使用](../17-rvalue-references-and-move-semantics/01-rvalue-references-and-xvalues.md#右值引用怎样绑定对象)规则相同。

## 类型要求检查一个名字能否表示类型

除了成员调用，接口还可能依赖类公开的 `value_type`。[成员类型名](../32-class-templates-and-generic-types/05-type-aliases-and-member-types.md#类把相关类型放进自己的接口)并不由语言自动提供，可以把它的存在写成类型要求（type requirement）：

```cpp
#include <array>
#include <iostream>
#include <vector>

template <typename T>
concept has_value_type = requires { typename T::value_type; };

int main() {
    std::cout << has_value_type<std::vector<int>> << ' '
              << has_value_type<std::array<double, 3>> << ' ' << has_value_type<int> << '\n';
}
```

输出为 `1 1 0`。这里不需要描述某个对象上的操作，因此省略了 requires 表达式的局部参数列表。

`typename T::value_type;` 要求这个限定名在当前语境中能表示一个可访问的类型。它不是声明一个名为 `value_type` 的变量，也没有要求构造该类型的对象。名字不存在、不可访问，或实际表示数据成员而不是类型，都不能满足这项要求。

## 表达式合法，不等于布尔值为真

简单要求只检查合法性，直接把一个布尔条件放进去，也不会自动要求它的值为 `true`。以下是一个独立程序：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept integral_expression_valid = requires { std::integral<T>; };

int main() {
    std::cout << integral_expression_valid<double> << ' ' << std::integral<double> << '\n';
}
```

输出为 `1 0`。`std::integral<double>` 是合法的布尔表达式，只是结果为假；所以它满足简单要求，却不满足“类型属于整型”这个条件。

要让函数只接受整型，应当在声明上直接写 `requires std::integral<T>`。把同一个条件放进大括号并写成简单要求，会改变所检查的问题。

> [!IMPORTANT]
> 检查一条表达式能否成立，与要求一个布尔条件为真，是不同操作。`value.read();` 检查调用表达式；`std::integral<T>;` 作为简单要求时也只检查表达式，不检查它的真假。

## 无效要求变为 false 有对应的模板语境

在 `has_read<T>` 中，把 `int` 代入与 `T` 有关的要求，会发现 `value.read()` 无法形成。这里 requires 表达式得到 `false`，不会仅因这个检查就让整个程序报错。

但 requires 表达式不是能在任意位置捕获编译错误的工具。下面这个独立程序仍然是错误的：

```cpp
int main() {
    const bool available = requires(int value) {
        value.read(); // 错误：这里是非模板语境中的具体无效表达式
    };
}
```

这里没有模板实参替换带来的条件检查，`value` 已明确是 `int`，无效成员调用仍使程序不合法。同样，模板中的语法错误和不依赖模板参数的非法内容，也不能普遍靠 requires 表达式隐藏。

当前模型是：**在相应模板语境中，让依赖实参的要求能否成立成为检查结果。** 这既使不支持操作的类型可以被识别出来，也保留了程序定义本身需要合法的边界。

## 参考资料

- [C++23 工作草案：概念的定义位置与条件](https://timsong-cpp.github.io/cppwp/n4950/temp.concept)
- [C++23 工作草案：requires 表达式、局部参数与替换检查](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.general)
- [C++23 工作草案：简单要求](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.simple)
- [C++23 工作草案：类型要求](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.type)
