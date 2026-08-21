---
title: 常量表达式与 constexpr（Constant Expressions and constexpr）
date: 2026-08-14
---

# 常量表达式与 constexpr（Constant Expressions and constexpr）

## 编译期需要确定的表达式

大多数表达式都可以到程序运行时再求值，但有些语言结构要求表达式在翻译程序时便能按照常量求值规则确定结果。`switch` 的 `case` 标签就是已经出现过的一种情况：

```cpp
int selected_mode{3};

switch (selected_mode) {
case 1 + 2:
    break;
default:
    break;
}
```

标签中的 `1 + 2` 不是等程序运行到 `switch` 时才计算的普通分支条件。C++ 要求编译器在翻译程序时确认它的值为 `3`，从而把它作为固定的分支入口。

**满足语言规定的额外限制、能够用于这类语境的表达式称为常量表达式（constant expression）。**常量表达式不是一种新的数据类型，而是 C++ 按照表达式的组成与求值行为给出的分类。某个语境要求常量表达式时，如果实际表达式不满足要求，程序便不合法，编译器必须给出诊断。

## 由字面量组成的常量表达式

字面量本身就是表达式。对于目前接触到的内建类型，直接写出的普通字面量都可以参与常量求值：

```cpp
42
2.5
'A'
true
```

这些表达式还可以通过已经介绍的运算符继续组合：

```cpp
6 * 7
(12 + 4) / 2
8 > 3
true && !false
```

它们分别产生 `int`、`int`、`bool` 和 `bool` 类型的结果，并且都属于常量表达式。**常量表达式并不只产生整数；具体语境还会对结果类型提出自己的要求。例如，`2.5` 是常量表达式，但浮点值不能作为当前所用 `switch` 的 `case` 标签。**

**表达式能够写在源代码中，不代表它一定能够完成常量求值。除以零、有符号整数溢出等不合法的求值过程不能借助“编译期计算”获得一个可用结果。**

## const 不等于常量表达式

**`const` 约束的是对象：对象完成初始化后，程序不能再通过普通方式修改它。常量表达式约束的则是一次求值：表达式必须满足语言为常量求值规定的条件。二者相关，但不是同一个概念。**

```cpp
int requested_mode{2};
const int runtime_mode{requested_mode};
```

`runtime_mode` 初始化后不能再被赋值，但它的初始值来自普通对象 `requested_mode`。读取 `runtime_mode` 的值不能形成所需的常量表达式，因此下面的标签不合法：

```cpp
switch (requested_mode) {
case runtime_mode: // 错误：runtime_mode 不能用于这里的常量表达式
    break;
default:
    break;
}
```

另一方面，在下面这个整数例子中，一个由常量表达式初始化的 `const int` 可以用于整数常量表达式：

```cpp
const int service_mode{2};
int selected_mode{2};

switch (selected_mode) {
case service_mode: // 正确
    break;
default:
    break;
}
```

**这并不意味着所有 `const` 对象都可以用于常量表达式。`const` 本身只保证对象不可修改；能否参与常量求值，还取决于对象的类型、初始化方式以及使用位置等语言规则。**

## 使用 constexpr 声明对象

当一个对象的值不仅不应改变，而且必须由常量表达式完成初始化时，可以在声明中使用 `constexpr`：

```cpp
constexpr int wheel_count{4};
constexpr double pressure_limit{2.5};
```

**对于当前讨论的基本类型，`constexpr` 用于对象声明时同时建立两项约束：**

- 对象隐含为 `const`，初始化后不能再修改；
- 初始化的完整表达式必须是常量表达式。

因此，`constexpr` 对象必须在定义时完成初始化：

```cpp
constexpr int maximum_attempts; // 错误：缺少初始化器
```

普通运行期对象的值也不能直接用来初始化 `constexpr` 对象：

```cpp
int requested_attempts{4};
constexpr int maximum_attempts{requested_attempts}; // 错误
```

**即使编译器通过优化能够推断 `requested_attempts` 此刻保存 `4`，它仍然是允许修改的普通对象。语言不会把优化器偶然能够推断出的值当作常量表达式。**

**`constexpr` 对象可以继续参与其他常量表达式，从而构成具有名称的计算关系：**

```cpp
constexpr int wheel_count{4};
constexpr int bolts_per_wheel{5};
constexpr int total_bolts{wheel_count * bolts_per_wheel};
constexpr bool has_bolts{total_bolts > 0};
```

这里每个初始化器都满足常量表达式要求。`total_bolts` 保存 `20`，`has_bolts` 保存 `true`。如果其中一次求值不符合要求，错误会在相应的 `constexpr` 声明处暴露：

```cpp
constexpr int invalid_result{12 / 0}; // 错误：整数除数为零
```

## 回到 case 标签

`case` 标签值要求是 `switch` 控制条件调整后类型的转换后常量表达式（converted constant expression）。下面的控制条件与各标签均为 `int`，因此这里只需确认每个标签都是可以作为 `int` 使用的常量表达式：

```cpp
constexpr int assisted_mode{1};
int selected_mode{assisted_mode};

switch (selected_mode) {
case assisted_mode:
    break;
}
```

`assisted_mode` 是由常量表达式初始化的 `constexpr int`，因此满足这个 `case` 标签的编译期要求。符合相应条件的 `const int` 也可以用于这里；**当程序明确依赖一个值的编译期可用性时，`constexpr` 能把这项要求直接写入声明。`switch` 的控制流程与标签规则参见 [switch 语句](../04-control-flow/02-switch-statements.md)。**

## 常量表达式与编译器优化

**编译器可能先通过常量传播（constant propagation）推断普通对象在某处必然具有的值，再通过常量折叠（constant folding）提前计算由这些已知值组成的运算。两者都是编译器可以选择进行的优化，不能与语言定义的常量表达式混为一谈：**

```cpp
int base{6};
int folded_result{base * 7};

constexpr int guaranteed_result{6 * 7};
```

优化器观察到 `base` 在读取前没有改变时，可能直接生成值 `42`，但表达式 `base * 7` 读取了普通可修改对象，并不因此成为常量表达式。是否进行这项优化属于实现选择，不改变源程序在 C++ 语言中的分类。

**`guaranteed_result` 则不同：它的声明要求 `6 * 7` 必须满足常量表达式规则。编译器若无法按这些规则确定初始化结果，就必须拒绝程序。这是一项语言保证，而不是对优化器的性能提示。**

即便某个常量表达式出现在普通运行期语境中，C++ 也不要求以某一种具体机器指令实现它。**常量表达式描述的是语言允许在哪里使用这项计算，不等同于“程序一定运行得更快”。**

## const 与 constexpr 的选择

三种声明表达的约束不同：

| 声明 | 初始化值的来源 | 初始化后能否修改 | 是否明确要求常量初始化 |
|---|---|---|---|
| `int value{...};` | 常量表达式或运行期结果 | 可以 | 否 |
| `const int value{...};` | 常量表达式或运行期结果 | 不可以 | 否 |
| `constexpr int value{...};` | 常量表达式 | 不可以 | 是 |

**选择时应当由程序需要表达的约束决定：**

- 值需要在之后发生变化，使用普通对象；
- 值可以到运行时才取得，但初始化后不应改变，使用 `const`；
- 值按设计就应在编译期确定，并且可能用于要求常量表达式的语境，使用 `constexpr`。

**不必为了“让编译器优化”而把所有 `const` 机械地改成 `constexpr`。运行时取得后保持不变，同样是一项清晰而有价值的约束；`constexpr` 应当用于表达真正存在的编译期要求。**

相关规则可参阅 C++23 工作草案 N4950 中的[常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)、[`constexpr` 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)与 [`switch` 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.switch)。
