---
title: if constexpr 与模板分支（if constexpr and Template Branches）
date: 2026-09-28
order: 6
---

# if constexpr 与模板分支（if constexpr and Template Branches）

一个气压读取接口既接受具有 `read()` 的对象，也接受直接给出的 `double`。这两种输入能完成同一项业务，却不能使用同一条表达式：对象要调用成员函数，`double` 则直接提供数值。

[析取约束](../33-template-constraints-and-concepts/04-constraint-composition-and-overload-selection.md#与或按照从左到右的顺序检查)能够说明“至少满足其中一条”，但普通 `if` 不会隐藏对当前类型不成立的操作。这里需要的是在模板实例化时选择实现分支，而不只是执行时选择路径。

## 条件按类型确定，未选分支不实例化

`if constexpr` 称为编译期条件语句（constexpr if statement）。它的条件经上下文转换为 `bool` 后，必须是常量表达式。对于这里的函数模板，代入 `T` 后可以确定条件值；未选中的分支成为丢弃语句（discarded statement），在这个特化中不被实例化。

下面的完整程序沿用 `pressure_source` 与 `pressure_input`。前者要求通过只读对象调用 `read()`，结果可以转换为 `double`；后者额外接受类型恰为 `double` 的输入：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

template <typename T>
concept pressure_input = pressure_source<T> || std::same_as<T, double>;

struct pressure_sensor {
    int stored;

    int read() const {
        return stored;
    }
};

template <typename T>
    requires pressure_input<T>
double read_pressure(const T& value) {
    if constexpr (pressure_source<T>) {
        return value.read();
    } else {
        return value;
    }
}

int main() {
    const pressure_sensor source{220};
    std::cout << read_pressure(source) << '\n';
    std::cout << read_pressure(230.5) << '\n';
}
```

程序输出 `220` 和 `230.5`。两次调用在实例化时分别得到不同的实现：

| 模板实参 | 条件 pressure_source<T> | 实例化的分支 | 丢弃的分支 |
| --- | --- | --- | --- |
| `pressure_sensor` | `true` | `return value.read();` | `return value;` |
| `double` | `false` | `return value;` | `return value.read();` |

因此，`read_pressure<double>` 不会要求 `double` 拥有 `read()`，而 `read_pressure<pressure_sensor>` 也不会要求传感器对象本身能够转换为 `double`。每个特化只需要被选中的实现成立。

`else` 可以直接返回数值，有接口约束作为依据：已知 `pressure_input<T>` 成立，而 `pressure_source<T>` 为 `false`，剩下的情况就是 `T` 为 `double`。这不是对任意类型都成立的兜底路径。

调用 `read_pressure(230)` 会因为 `T` 推导为 `int` 而被约束拒绝。虽然整数可以转换为 `double`，本接口只额外接纳 `double`，没有承诺所有可转换类型都适用。

## 普通 if 即使条件已知，也不丢弃模板分支

在完整程序中，仅把 `read_pressure` 替换为下面的版本，就会编译失败：

```cpp
template <typename T>
    requires pressure_input<T>
double read_pressure(const T& value) {
    if (pressure_source<T>) {
        return value.read();
    } else {
        return value;
    }
}
```

`pressure_source<T>` 仍能在编译期得到 `true` 或 `false`，但语句现在是普通 `if`。实例化 `read_pressure<double>` 时，编译器仍要检查 `value.read()`；实例化传感器版本时，也仍要检查 `return value;` 能否产生 `double`。两种特化分别在不适合自己的表达式上失败。

> [!IMPORTANT]
> 常量条件只说明条件值能够确定；`if constexpr` 的丢弃规则才决定某个模板分支是否实例化。优化器消除不会执行的机器代码，无法修复实例化阶段已经不成立的表达式。

## 选择实现不要求函数调用常量求值

前面的 `read_pressure` 没有声明为 `constexpr`，`pressure_sensor::read()` 也没有。程序仍可正常读取运行时对象并输出结果。

编译期确定的是“这个特化采用哪种读取方式”。真正读取 `source.stored` 时的数值不必在编译期已知。若同一个传感器对象的读数发生变化，之后再次调用同一特化，仍可以得到新的数值。

| 写法 | 在本例中回答的问题 |
| --- | --- |
| `requires pressure_input<T>` | 当前类型是否属于接口接受的范围 |
| `if constexpr (pressure_source<T>)` | 这个特化的函数体使用哪种读取实现 |
| 函数声明上的 `constexpr` | 满足条件的调用是否可以参与常量求值 |

`if constexpr` 可以出现在普通函数模板中；`constexpr` 函数也可以只使用普通 `if`。这两个位置的 `constexpr` 不能互相代替。

## 丢弃分支仍然属于模板定义

不实例化未选分支，不等于在解析源码之前把它删掉。两个分支都必须有正确语法；不依赖模板参数的名称，也必须遵守[定义处的名称查找规则](../31-function-templates-and-type-deduction/04-instantiation-and-operation-requirements.md#名称查找并非全部推迟到调用处)。

例如，保留完整程序中的头文件与概念，把函数替换为以下错误定义：

```cpp
template <typename T>
    requires pressure_input<T>
double read_pressure(const T& value) {
    if constexpr (pressure_source<T>) {
        return value.read();
    } else {
        return missing_value; // 错误：非依赖名称没有声明
    }
}
```

`missing_value` 不依赖 `T`。即使程序只调用传感器版本，也不能靠丢弃 `else` 来赋予这个名字有效含义。同样，在分支中漏写分号，不能因为某次实例化不选择它就变成正确语法。

前面能够隐藏 `double` 的 `value.read()`，是因为该表达式依赖 `T`，并且在气压源分支中确实有成立的类型；不是因为丢弃分支可以存放任意错误代码。

在非模板函数中，也没有“代入类型时不实例化分支”这层作用。下面是命名空间作用域中的错误函数定义：

```cpp
double read_pressure(double value) {
    if constexpr (false) {
        return value.read(); // 错误：double 没有 read 成员
    } else {
        return value;
    }
}
```

这里已经知道 `value` 是 `double`。`false` 保证不会执行第一条路径，却没有免除这条成员访问的类型检查。**`if constexpr` 不能作为普通非模板代码中屏蔽非法操作的工具。**

## 普通形参不能按每次调用值选择模板分支

条件必须自身满足常量表达式要求。给函数加上 `constexpr`，不会使普通形参获得这项资格；以下命名空间作用域中的定义错误：

```cpp
constexpr int nonnegative_pressure(int value) {
    if constexpr (value >= 0) { // 错误：条件需要读取普通按值形参
        return value;
    } else {
        return 0;
    }
}
```

即使调用写成 `nonnegative_pressure(220)`，或者用该调用初始化 `constexpr` 对象，也不能修复条件。这个函数的声明与函数体不会为每个普通实参数值分别生成一套分支。

如果目的只是按输入数值决定返回什么，应把这里改为普通 `if (value >= 0)`。这样，同一函数既可以在常量求值中判断数值，也可以在普通调用中判断运行时数值。立即函数的普通形参也有相同边界；[必须常量求值的调用](./05-consteval-and-immediate-calls.md#立即函数的普通形参仍不是模板参数)不会把形参自动转成值模板参数。

## 丢弃的 return 不参与该实例的返回推导

[多个普通返回分支](../34-expression-types-and-forwarding/02-return-type-deduction-and-value-reference-results.md#多个返回分支必须推导出同一类型)使用 `auto` 时，参与推导的 `return` 必须得到同一类型。`if constexpr` 补充了一条边界：丢弃分支中的 `return` 不参与推导。

下面是命名空间作用域中的合法函数模板。`fractional` 是值模板参数，其值在相应特化中确定：

```cpp
template <bool fractional> auto select_pressure() {
    if constexpr (fractional) {
        return 220.5;
    } else {
        return 220;
    }
}
```

`select_pressure<true>()` 的返回类型是 `double`，`select_pressure<false>()` 的返回类型是 `int`。这是两个不同的特化各自得到固定返回类型，不是同一个函数在运行时改变返回类型。

这里的 `else` 有实际作用。如果把 `return 220;` 移到整个 `if constexpr` 之后，它就不属于丢弃分支；对 `fractional = true` 的特化，两条 `return` 会再次参与推导并发生类型冲突。仅凭执行时已经提前返回，不能把后面的返回语句排除。

需要统一交付 `double` 的业务接口，仍可像 `read_pressure` 一样明确声明返回类型。`if constexpr` 的价值在于让每种受支持的类型只使用适合自己的实现，不要求接口顺便改变返回类型。

## 参考资料

- [C++23 工作草案：if constexpr 的条件与丢弃语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.if)
- [C++23 工作草案：模板中的名称解析与定义有效性](https://timsong-cpp.github.io/cppwp/n4950/temp.res.general)
- [C++23 工作草案：非丢弃 return 与返回类型推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
