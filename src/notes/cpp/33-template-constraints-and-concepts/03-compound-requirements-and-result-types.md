---
title: 复合要求与结果类型（Compound Requirements and Result Types）
date: 2026-09-27
order: 3
---

# 复合要求与结果类型（Compound Requirements and Result Types）

[只要求调用合法](./02-requires-expressions-and-valid-operations.md#能够调用不等于已经取得所需结果)，还不足以支持返回 `double` 的气压读取函数。一个返回 `void` 的 `read()` 同样是合法调用，但它的结果不能交给 `return` 产生 `double`。

接口需要继续说明：调用不仅要成立，它的结果还必须满足函数体实际使用的条件。复合要求（compound requirement）把这两层检查放在一起。

## 从调用合法到结果可用

下面的完整程序定义 `pressure_source`：对 `const T&` 调用 `read()` 必须合法，其结果还必须能够转换成 `double`。

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

struct pressure_sensor {
    int stored;

    int read() const {
        return stored;
    }
};

struct status_source {
    void read() const {}
};

template <typename T>
    requires pressure_source<T>
double read_pressure(const T& value) {
    return value.read();
}

int main() {
    std::cout << pressure_source<pressure_sensor> << ' ' << pressure_source<status_source> << '\n';

    const pressure_sensor source{220};
    std::cout << read_pressure(source) << '\n';
}
```

程序先输出 `1 0`，再输出 `220`。`pressure_sensor::read()` 返回 `int`，能够通过隐式转换成为 `double`，所以概念检查为 `true`，`read_pressure` 可以使用它。`status_source::read()` 虽然可以调用，却返回 `void`，因此不满足 `pressure_source`，检查结果为 `false`。

`{ value.read() } -> std::convertible_to<double>;` 可以分成三部分读取：

| 写法 | 作用 |
| --- | --- |
| `{ value.read() }` | 指定要检查的表达式，先要求它合法 |
| `-> std::convertible_to<double>` | 用右侧概念约束这个表达式的结果类型 |
| 最后的 `;` | 结束这一条复合要求 |

外层 `requires(const T& value) { ... }` 仍然是不执行 `read()` 的编译期检查。内部多出的一对花括号也不是函数体，不会在约束检查时读取传感器。箭头说明结果要满足什么要求，不会在这里执行转换，也不会把 `read()` 原来的返回类型改成 `double`。

## convertible_to 与 same_as 表达不同的契约

`<concepts>` 提供两个适合当前问题的标准概念：

| 概念 | 要表达的契约 |
| --- | --- |
| `std::same_as<A, B>` | `A` 与 `B` 是同一个类型；引用及 `const` 限定也参与比较 |
| `std::convertible_to<From, To>` | 对相应源类型和值类别的表达式，隐式转换与 `static_cast<To>` 都可行，而且两条路径应产生相等的结果 |

第二个概念同时有编译器能够检查的转换条件和转换应当一致的语义要求。为自定义类型设计转换时，也要兑现后一项约定；不能只因编译期得到 `true`，就断言编译器验证了全部运行时行为。

`read_pressure` 的函数体执行 `return value.read();`，需要的是结果能够隐式转换为 `double`，并不要求读取接口本来就返回 `double`。因此，`std::convertible_to<double>` 与当前接口相符。只提供 `explicit operator double()` 的结果类型无法通过这个条件：它支持显式转换，却不支持这里需要的隐式转换。

`std::same_as<double>` 表达的范围更窄。例如，一个按值返回 `int` 的 `read()` 满足前面的可转换要求，却不满足结果恰为 `double` 的要求。只有当接口确实需要精确类型时，才应当增加这种限制。

> [!WARNING]
> **可转换不等于无数值损失。**例如 `std::convertible_to<double, int>` 为 `true`，但把 `3.75` 转为 `int` 会得到 `3`。这个概念没有承诺保留小数、精度或全部取值范围；隐式与显式转换结果一致，也不等于结果与原值完全相同。

## 箭头会自动补入表达式的类型

`std::convertible_to` 本来有两个模板参数，复合要求中却只写了 `<double>`。这是因为箭头右侧的概念会自动收到一个放在最前面的模板实参：被检查表达式的类型信息，包括它的值类别。

于是，对返回 `int` 的 `value.read()`，`-> std::convertible_to<double>` 检查的是 `std::convertible_to<int, double>`。同样，`-> std::same_as<double>` 检查的是 `std::same_as<int, double>`，结果为 `false`。

这里“表达式的类型信息”需要保留一个关键细节：**检查不会像按值接收参数那样抹掉引用关系。**对当前读取接口，映射如下：

| `read()` 的返回声明 | 调用表达式的值类别 | 自动补入概念的第一个类型实参 | `-> std::same_as<double>` |
| --- | --- | --- | --- |
| `double read() const` | `double` 纯右值（prvalue） | `double` | 满足 |
| `double& read() const` | `double` 左值（lvalue） | `double&` | 不满足 |
| `const double& read() const` | `const double` 左值 | `const double&` | 不满足 |
| `int read() const` | `int` 纯右值 | `int` | 不满足 |

表中的第二行只描述一种可能的接口。成员函数尾部的 `const` 约束的是它通过当前对象进行修改的能力，并不强制返回类型带 `const`。无论引用指向哪里，作者都必须保证被引用对象的生命周期有效。

以安全地借用自身成员的情况为例。保留前面程序中的 `pressure_source`、`status_source` 和 `read_pressure`，用以下定义替换 `pressure_sensor`，并把新的概念定义也放在 `main` 之前的命名空间作用域中：

```cpp
struct pressure_sensor {
    double stored;

    const double& read() const {
        return stored;
    }
};

template <typename T>
concept exact_pressure_source = requires(const T& value) {
    { value.read() } -> std::same_as<double>;
};
```

同时把 `main` 替换为：

```cpp
int main() {
    std::cout << pressure_source<pressure_sensor> << ' '
              << exact_pressure_source<pressure_sensor> << '\n';

    const pressure_sensor source{220.0};
    std::cout << read_pressure(source) << '\n';
}
```

程序先输出 `1 0`，再输出 `220`。`read()` 返回对 `source.stored` 的只读引用，`source` 在读取时仍然存活。这个 `const double` 左值能够用于产生一个 `double` 值，因此满足 `pressure_source`；但自动补入 `same_as` 的类型是 `const double&`，与 `double` 不同，所以不满足 `exact_pressure_source`。

如果需要的契约正是“返回只读借用”，应写 `-> std::same_as<const double&>`。如果只是要将读取结果作为 `double` 值使用，保留可转换要求就能同时接受按值返回和合适的引用返回，而不必对底层存储方式作多余限制。

## noexcept 检查的是表达式的异常性质

复合要求还可以在内部花括号后加上 `noexcept`。将下面的定义加入前面程序的命名空间作用域：

```cpp
template <typename T>
concept nothrow_pressure_source = requires(const T& value) {
    { value.read() } noexcept -> std::convertible_to<double>;
};
```

它依次要求 `value.read()` 合法、该表达式不是潜在抛出表达式（potentially-throwing expression），以及结果满足可转换要求。这里的 `noexcept` 是在检查表达式，没有给 `read()` 添加异常说明。

上面的 `pressure_sensor::read()` 没有声明 `noexcept`，即使函数体只有 `return stored;`，仍然无法通过这项检查。在 `main` 中加入下面的语句，会输出 `0`：

```cpp
std::cout << nothrow_pressure_source<pressure_sensor> << '\n';
```

如果把该成员函数的声明改成 `const double& read() const noexcept`，同一条输出语句会改为输出 `1`，这时检查通过。区别来自编译期的异常性质，而不是运行一次、观察有没有真正抛出异常。

这条复合要求检查的非抛出表达式是 `value.read()`。箭头后的可转换检查不会进一步保证“把结果转换为 `double`”也不抛出；自定义转换可能另有异常行为。因此，不能仅凭这一项约束，就机械地给外层 `read_pressure` 添加 `noexcept`。

## 参考资料

- [C++23 工作草案：复合要求与结果类型约束](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.compound)
- [C++23 工作草案：same_as](https://timsong-cpp.github.io/cppwp/n4950/concept.same)
- [C++23 工作草案：convertible_to](https://timsong-cpp.github.io/cppwp/n4950/concept.convertible)
- [C++23 工作草案：异常说明与潜在抛出表达式](https://timsong-cpp.github.io/cppwp/n4950/except.spec)
