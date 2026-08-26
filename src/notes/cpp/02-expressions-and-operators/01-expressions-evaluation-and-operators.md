---
title: 表达式、求值与运算符（Expressions, Evaluation, and Operators）
date: 2026-08-25
---

# 表达式、求值与运算符（Expressions, Evaluation, and Operators）

第一章建立了对象、值与类型：对象能够保存状态，名称让程序找到对象，类型规定对象可以保存怎样的值。程序还需要读取这些状态、计算新的结果，并在需要时修改已有对象。C++ 使用表达式（expression）描述这些计算与作用。

## 表达式与求值（Expressions and Evaluation）

下面的代码创建两个 `int` 对象，并用已有对象参与一次计算：

```cpp
int wheel_count{4};
int next_wheel_count{wheel_count + 1};
```

第二行的初始化器中包含三个表达式：

- `wheel_count` 使用名称指定已经存在的对象；
- `1` 直接表示一个值；
- `wheel_count + 1` 把前两个表达式组合成一次加法。

**按照 C++ 语言规则确定一个表达式所表示的结果与作用，称为求值（evaluation）。**求值 `wheel_count + 1` 时，程序读取 `wheel_count` 当前保存的值 `4`，再与 `1` 相加，得到 `int` 类型的结果 `5`。这个结果随后用于初始化 `next_wheel_count`。

表达式不只出现在初始化器中。赋值号左右两侧和运算符的操作数等位置，也都由表达式构成。

## 表达式的类型与结果

**表达式具有类型，求值采用相应类型的语言规则。**在当前例子中：

| 表达式 | 类型 | 求值所确定的内容 |
| --- | --- | --- |
| `wheel_count` | `int` | 指定已有的 `int` 对象 |
| `1` | `int` | 表示 `int` 值 `1` |
| `wheel_count + 1` | `int` | 产生 `int` 值 `5` |

名称表达式与算术表达式的结果并不具有完全相同的语义：前者能够指定已有对象，后者在这里产生用于计算的新值。**表达式可以保留对象身份，也可以只产生用于计算的值；不能把所有表达式都想象成暂时存放数字的匿名对象。**

表达式的结果可以继续成为另一个表达式的组成部分，也可以用于初始化对象。**结果最终被用在什么位置，不会反过来改变当前表达式已经采用的求值规则。**

## 值计算与副作用（Value Computations and Side Effects）

求值可以包含值计算（value computation），也可以对程序状态产生副作用（side effect）。在当前范围内，修改已有对象就是最直接的副作用：

```cpp
int remaining_count{12};
int snapshot{remaining_count};

remaining_count = 9;
```

初始化 `snapshot` 时，表达式 `remaining_count` 提供对象当前保存的值，不修改该对象。最后一行中的赋值表达式则把 `remaining_count` 改为保存 `9`，因此产生副作用。

**“表达式具有结果”与“表达式会不会修改状态”是两个不同问题。**算术表达式通常只计算结果；赋值、自增和自减等表达式除了具有结果，还会改变对象。判断一段代码时，需要分别追踪这两件事。

## 运算符与操作数（Operators and Operands）

**运算符（operator）规定需要执行什么运算，操作数（operand）则是参与该运算的表达式。**例如：

```cpp
int front_count{2};
int rear_count{2};
int total_count{front_count + rear_count};
```

在 `front_count + rear_count` 中，`+` 是运算符，`front_count` 与 `rear_count` 是它的两个操作数。作用于两个操作数的运算符称为二元运算符（binary operator）。这里的 `binary` 表示“具有两个操作数”，与二进制表示中的 `0` 和 `1` 不是同一个含义。

继续使用上面已经创建的 `front_count` 与 `rear_count`，同一个符号可能具有不同数量的操作数：

```cpp
int difference{front_count - rear_count};
int opposite{-difference};
```

第一行的 `-` 是执行减法的二元运算符；第二行的 `-` 只有一个操作数，是表示相反数的一元运算符（unary operator）。**运算符的含义由所在的表达式结构、操作数类型和相应语言规则共同确定，不能只凭符号外形判断。**

本章讨论此前已经建立的基本类型，以及语言为它们提供的内建运算符（built-in operators）。

本章使用的基本运算符可以按解决的问题分为：

| 类别 | 运算符 | 作用 |
| --- | --- | --- |
| 算术运算 | `+`、`-`、`*`、`/`、`%` | 计算数值结果 |
| 赋值与状态修改 | `=`、`+=`、`-=`、`*=`、`/=`、`%=`、`++`、`--` | 修改已有对象 |
| 比较运算 | `==`、`!=`、`<`、`<=`、`>`、`>=` | 产生布尔判断 |
| 逻辑运算 | `!`、`&&`、`\|\|` | 反转或组合布尔判断 |

## 表达式语句（Expression Statement）

表达式本身描述求值内容。对于前面已经创建的 `remaining_count`，在允许出现语句的位置为赋值表达式补上分号，可以形成表达式语句（expression statement）：

```cpp
remaining_count = 9;
```

这里，`remaining_count = 9` 是表达式，末尾的 `;` 标记表达式语句结束。执行这条语句时，表达式会被求值；整个表达式的结果没有继续交给其他代码使用，但赋值产生的副作用仍然保留。

变量声明不是表达式语句：

```cpp
int remaining_count{12};
```

整个 `int remaining_count{12};` 是声明，其中的 `12` 是初始化器使用的表达式。**声明与表达式属于不同的语法结构；分号只表示相应结构结束，不能据此把二者视为同一种东西。**

相关语言规则可参阅 C++23 工作草案中的[表达式](https://eel.is/c%2B%2Bdraft/expr.pre)、[执行与求值](https://eel.is/c%2B%2Bdraft/intro.execution)和[表达式语句](https://eel.is/c%2B%2Bdraft/stmt.expr)。
