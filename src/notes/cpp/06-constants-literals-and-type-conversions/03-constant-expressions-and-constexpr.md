---
title: 常量表达式与 constexpr（Constant Expressions and constexpr）
date: 2026-08-27
order: 3
---

# 常量表达式与 constexpr（Constant Expressions and constexpr）

## 由语言规则判定的表达式

某些语言结构要求一个值在程序运行之前就能够确定。例如，`switch` 的 `case` 标签需要使用满足相应要求的常量表达式。

**常量表达式（constant expression）是满足 C++ 额外语义限制、能够由语言规则在翻译期间求值的表达式。** 对这类表达式的判定与求值属于常量求值（constant evaluation）。这个名称描述的是表达式是否满足规则，不是优化器是否碰巧能够推断出结果。

```cpp
int current_limit{2 + 3};
```

`2 + 3` 是常量表达式，但由它初始化出来的 `current_limit` 仍是允许修改的普通 `int` 对象。表达式的性质与目标对象是否可以修改不是同一个问题。

## constexpr 对象

`constexpr` 是声明说明符（declaration specifier），不是类型限定符。对对象使用 `constexpr`，可以把“这个对象必须由常量表达式初始化”写进声明：

```cpp
constexpr int wheel_count{4};
constexpr int bolts_per_wheel{5};
constexpr int total_bolt_count{wheel_count * bolts_per_wheel};
```

`wheel_count * bolts_per_wheel` 是常量表达式，它产生的值用于初始化 `total_bolt_count`。二者不能混为一谈：前者是一次计算，后者是由计算结果创建的对象。

对对象使用 `constexpr` 还会将该对象声明为 `const`。因此它同时表达两项约束：

- 初始化式必须满足常量表达式要求；
- 对象初始化完成后不能通过普通操作修改。

`constexpr` 对象仍然是具有类型、身份和值的对象。它不是预处理阶段的文本替换，也不等于“必然不占存储”。

## 普通运行期对象不能冒充常量表达式

```cpp
int requested_attempts{4};
const int runtime_limit{requested_attempts};
constexpr int compile_time_limit{requested_attempts};  // 错误
```

`requested_attempts` 是允许修改的普通对象。读取它当前保存的值不满足这里的常量表达式要求，因此不能用它初始化 `compile_time_limit`。

`runtime_limit` 的声明合法，因为 `const` 只要求对象正确初始化，并限制之后的普通修改操作；它没有要求初始化式一定是常量表达式。

## const 整数对象的精确边界

`const` 与 `constexpr` 不能简单理解为“一个只能在运行期使用，一个只能在编译期使用”。在当前同一作用域内，如果 `const` 整数对象本身使用常量表达式初始化，它的值也可以继续参与常量表达式：

```cpp
const int maintenance_mode{2};
constexpr int copied_mode{maintenance_mode};
```

这里的 `maintenance_mode` 是 `const int`，初始化值 `2` 满足常量表达式要求，因此 `copied_mode` 的声明合法。相反：

```cpp
int selected_mode{2};
const int runtime_mode{selected_mode};
constexpr int copied_runtime_mode{runtime_mode};  // 错误
```

`runtime_mode` 虽然不可修改，但它的初始值来自普通运行期对象，不能用于这里的常量求值。

这项规则是当前 `const` 整数类型的特定边界，不能推广到所有 `const` 对象：

```cpp
const double ratio{0.5};
constexpr double doubled_ratio{ratio * 2.0};  // 错误
```

这也解释了为什么某些 `const int` 可以用作 `case` 标签，而另一些不能。**`const` 描述修改约束；`constexpr` 直接声明常量求值契约。**

## 容易计算不等于常量表达式

如果求值需要调用普通的非 `constexpr` 函数，读取不允许用于常量求值的对象，或者执行会产生未定义行为的操作，表达式就不能满足常量表达式要求。

```cpp
int calculate_limit(int base_limit) {
    return base_limit + 1;
}

constexpr int maximum_attempts{calculate_limit(3)};  // 错误
```

这里的参数值 `3` 可以在翻译期间确定，但 `calculate_limit` 是普通函数。即使编译器很容易算出调用结果，这个调用仍不满足常量表达式的语言规则。

当一个值只需要在初始化后保持不变时，`const` 已经表达了正确约束；当程序依赖它能够参与常量求值时，才应使用 `constexpr`。二者的选择来自语义需求，而不是把所有固定值机械地改成同一种写法。

## 参考资料

- [C++23 工作草案：常量求值](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：constexpr 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
