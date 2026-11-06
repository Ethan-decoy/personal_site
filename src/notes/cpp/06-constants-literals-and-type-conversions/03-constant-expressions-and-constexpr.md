---
title: 常量表达式与 constexpr（Constant Expressions and constexpr）
date: 2026-08-27
order: 3
---

# 常量表达式与 constexpr（Constant Expressions and constexpr）

## 由语言规则判定的表达式

`const` 可以限制对象创建后的修改，但不能单独保证它的值可以用于 `case` 标签等编译期要求。这里还需要检查提供这个值的表达式是否满足常量表达式规则。

常量表达式（constant expression）是满足语言规定的额外求值限制、可以在翻译期间求值的表达式；按这些规则进行的求值称为常量求值（constant evaluation）。

表达式的性质与接收结果的对象类型需要分开判断。除完整程序外，以下片段均放在 `main` 函数体内；注明沿用时保留对应声明，其余片段彼此独立：

```cpp
int count{2 + 3};
++count;
```

`2 + 3` 满足常量表达式要求，为 `count` 提供初值 5。`count` 本身是普通 `int` 对象，仍然可以递增，执行后保存 6。

> [!IMPORTANT] 常量表达式与对象的修改限制
> **常量表达式描述表达式是否满足常量求值规则，不会自动把接收结果的普通对象变为 `const`。**表达式能否用于常量求值，与对象初始化后能否修改，是两项不同的判断。

## constexpr 对象

如果要求对象的初始化在定义处就通过常量表达式检查，可以在声明中使用 `constexpr`：

```cpp
constexpr int limit{2 + 3};
```

`2 + 3` 满足要求，因此 `limit` 初始化为 5。这里对象的实际类型是 `const int`，初始化后不能再给它赋值或进行自增、自减。

> [!IMPORTANT] constexpr 对象的两项约束
> **对这里的基本类型对象使用 `constexpr`，既要求初始化满足常量表达式规则，也将对象声明为 `const`。**如果初始化不满足要求，程序不合法，编译器必须诊断；不能改为在运行时完成这次初始化。

从语法分类上说，`constexpr` 是声明说明符（declaration specifier），用于给声明增加上述要求；`const` 是类型限定符。`constexpr int limit{...};` 中的 `constexpr` 并不形成一种新的整数类型，`limit` 的类型是隐含了修改限制的 `const int`。

沿用这个 `limit` 的声明，可以继续计算另一个常量，也可以用它的值创建普通对象：

```cpp
constexpr int doubled_limit{limit * 2};
int count{limit};
++count;
```

`limit` 的值可以用于这里的常量表达式，因此 `limit * 2` 得到 10，满足 `doubled_limit` 的初始化要求。另一个对象 `count` 的类型是 `int`，先取得值 5，再递增为 6；`limit` 仍然为 5。

`constexpr` 对象仍然具有类型、身份、生命周期和值，其值也可以供运行中的普通计算使用。这个声明不表示对象名称会在预处理阶段被替换成文本，也不保证实现一定省略对象的存储。

## 普通运行期对象不能冒充常量表达式

在 `main` 中已经存在的普通可修改对象，即使最初由字面量初始化，也不能仅凭当前数值就用来初始化这里的 `constexpr` 对象：

```cpp
int source{5};
const int target{source};
constexpr int limit{source}; // 错误：读取 source 不满足这里的常量表达式要求
```

第二行合法：读取 `source` 当时的值 5，用它初始化 `const int` 对象 `target`，之后不再修改 `target`。第三行还要求初始化满足常量表达式规则，但读取这个已经存在的普通 `int` 对象不符合要求，因此声明不合法。

给 `source` 提供初值的字面量 `5` 可以用于常量表达式，不代表以后读取 `source` 都具有同样的性质。这里也不取决于此前是否真的修改过 `source`。

## const 整数对象的精确边界

`const int` 对象在满足初始化条件时，其值也可以继续用于常量表达式：

```cpp
const int source{5};
constexpr int target{source};
```

`source` 的类型为 `const int`，初值 5 满足常量表达式要求，初始化声明在这里可见，因此读取它可以用于初始化 `constexpr int target`。

> [!IMPORTANT] const 整数的类型与初始化条件
> **在当前同一块作用域中，使用常量表达式初始化的 `const int` 对象，其值可以继续用于常量表达式。**这项判断同时依赖对象类型与初始化来源；仅仅写出 `const`，不能让任意初值或任意类型都获得同样的条件。

在初始化链条中增加一个普通可修改对象，结果就不同：

```cpp
int count{5};
const int source{count};
constexpr int target{source}; // 错误：source 的初值不满足常量表达式要求
```

`source` 虽然不可修改，但初始化它需要读取普通 `int` 对象 `count`。把这个值复制到一个 `const int` 对象中，不会改变初值来源所受的常量求值限制，因此不能再用它初始化这里的 `constexpr` 对象。

即使仍然直接用数值 5 初始化，只把对象类型换成 `const double`，也不能照搬 `const int` 的结论：

```cpp
const double source{5.0};
constexpr double target{source}; // 错误：普通 const double 不满足这里的读取条件
```

这里失败的原因是读取这个普通 `const double` 对象不满足相应条件，与数值是否容易计算无关。将第一行改为 `constexpr double source{5.0};`，原来的第二行就合法了。

因此，`const` 与 `constexpr` 都不能简单归为“只能在运行期使用”或“只能在编译期使用”。应分别检查对象的修改限制、初始化要求，以及它的值在当前使用位置能否参与常量求值。

## 容易计算不等于常量表达式

常量求值还要检查实际执行的操作。把同样的 `2 + 3` 放进一个普通函数，并不会让调用自动满足常量表达式要求。下面是完整的错误程序，辅助函数定义在 `main` 之前：

```cpp
int calculate_limit() {
    return 2 + 3;
}

int main() {
    constexpr int limit{calculate_limit()}; // 错误：调用普通函数不满足常量表达式要求
    return 0;
}
```

直接用 `2 + 3` 初始化 `constexpr int` 可以成立，但这里的初始化需要调用普通的非 `constexpr` 函数，因而不满足要求。即使优化器能直接生成结果 5，也不能改变这个声明不合法的结论。

两个操作数本身都是常量，也不保证运算一定成立。例如，下面的独立错误片段需要在初始化中执行整数除零：

```cpp
constexpr int result{1 / 0}; // 错误：常量求值需要执行整数除零
```

整数除零会产生未定义行为，因此这次初始化不能通过常量表达式检查，编译器必须诊断。`constexpr` 不会为原本无效的运算提供有效结果。

> [!IMPORTANT] 常量求值检查输入和实际执行的操作
> **在要求常量表达式的语境中，求值所需的输入和实际执行的操作都必须满足相应规则。**不满足要求时，初始化不合法，编译器必须诊断；优化器能否提前算出结果，不能代替语言要求。

> [!PRACTICE] 把常量求值要求写在对象定义处
> 对初始化后只需读取的对象，`const` 可以表达修改限制。若后续代码依赖这个对象的值来初始化其他 `constexpr` 对象，或将其用于 `case` 标签等位置，使用 `constexpr` 可以在对象定义处检查初始化要求。即使某个 `const int` 当前也满足条件，明确声明这项要求仍能让不合适的初值改动更早得到诊断。

## 参考资料

- [C++23 工作草案：常量求值](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：constexpr 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
