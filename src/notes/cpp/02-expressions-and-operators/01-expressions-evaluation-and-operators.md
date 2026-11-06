---
title: 表达式、求值与运算符（Expressions, Evaluation, and Operators）
date: 2026-08-25
---

# 表达式、求值与运算符（Expressions, Evaluation, and Operators）

绘图程序记录图形数量后，还需要计算新增图形后的数量，并在需要时更新已有记录。C++ 使用表达式（expression）描述这些计算与作用。

以下代码片段均放在 `main` 函数体内；注明接续时沿用前面的对象，其余示例各自独立。

## 表达式与求值（Expressions and Evaluation）

当前有三个图形。下面先记录当前数量，再计算新增一个图形后的数量，还不修改当前记录：

```cpp
int shape_count{3};
int next_count{shape_count + 1};
```

第二行中，以下三部分都是表达式：

- `shape_count` 使用名称指定已经存在的对象；
- `1` 直接表示一个值；
- `shape_count + 1` 把前两个表达式组合成一次加法。

> [!IMPORTANT] 表达式与求值
> **表达式描述计算；按照 C++ 语言规则确定它的结果与作用，称为求值（evaluation）。**表达式不要求一定包含运算符：单个变量名、数值写法也可以是表达式，它们还可以组合成更大的表达式。

求值 `shape_count + 1` 时，程序读取 `shape_count` 当前保存的 `3`，与 `1` 相加，得到 `int` 类型的值 `4`。这个结果随后用于初始化新对象 `next_count`。

执行后，`shape_count` 仍保存 `3`，`next_count` 保存 `4`。加法计算出了新数量，没有把它自动写回原来的对象。

## 表达式的类型与结果

表达式具有类型，求值采用相应类型的语言规则。在当前例子中：

| 表达式 | 类型 | 求值所确定的内容 |
| --- | --- | --- |
| `shape_count` | `int` | 指定已有的 `int` 对象 |
| `1` | `int` | 表示 `int` 值 `1` |
| `shape_count + 1` | `int` | 产生 `int` 值 `4` |

名称表达式先确定正在使用哪一个对象，是否还要读取它的值，取决于使用位置。`shape_count` 作为这里加法所需的数值时，程序进一步读取该对象当前保存的 `3`；在 `shape_count = next_count` 这样的普通赋值中，左侧名称用于指定待修改的对象，不需要先读取这个对象原来的值。

> [!IMPORTANT] 表达式的类型与结果
> **表达式具有类型，但类型相同，不代表结果具有相同形式。**`shape_count` 与 `shape_count + 1` 都是 `int` 类型的表达式，前者指定已有对象，后者在这里产生用于计算的新值。不能把每个表达式都想象成额外创建的匿名对象。

本例先按 `int` 加法规则得到 `int` 值 `4`，再用它初始化 `next_count`。接收结果的对象不会反向改变这次加法采用的类型规则；相关对照见[运算先于结果的使用位置](02-arithmetic-operations-and-result-types.md#运算先于结果的使用位置)。

## 值计算与副作用（Value Computations and Side Effects）

继续使用最初创建的 `shape_count` 和 `next_count`。先保留一份旧数量，再把新数量写回当前记录：

```cpp
int previous_count{shape_count};

shape_count = next_count;
```

初始化 `previous_count` 时，表达式 `shape_count` 提供当前保存的值 `3`，这个读取不修改源对象；整条声明则创建一个新对象，并让它保存 `3`。

赋值时，右侧的 `next_count` 提供值 `4`，左侧的 `shape_count` 指定待修改的对象。赋值把这个对象改为保存 `4`，`previous_count` 仍保存 `3`，`next_count` 仍保存 `4`。

确定表达式指定的对象、读取对象保存的值、算出新的数值，都属于值计算（value computation）。赋值对已有对象进行写入，则产生副作用（side effect）。赋值表达式 `shape_count = next_count` 本身也有结果：它仍指定修改后的左侧对象；对该对象的修改与表达式的结果需要分别判断。

> [!IMPORTANT] 值计算与副作用
> **值计算确定表达式的结果；副作用改变执行环境的状态，例如修改对象或进行输入输出。同一次求值可以同时包含两者。**判断表达式时，应分别追踪它得到什么结果，以及它改变了哪些状态；结果没有继续被使用，不表示副作用没有发生。

“副作用”是中性术语，不表示有害、意外或次要。修改对象、输出信息本来就可能是代码的主要目的。

## 运算符与操作数（Operators and Operands）

本篇使用 C++ 为已介绍的基本类型提供的内建运算符（built-in operators），下面的示例只使用 `int`。

在 `shape_count + 1` 中，`+` 是运算符（operator）；`shape_count` 与 `1` 是它的两个操作数（operand），即参与这次运算的两个表达式。作用于两个操作数的运算符称为二元运算符（binary operator）。这里的 `binary` 表示“具有两个操作数”，与二进制表示不是同一个含义。

同一个符号还可能具有不同数量的操作数。下面是独立示例，仍比较当前数量 `3` 与新增一个图形后的数量 `4`：

```cpp
int shape_count{3};
int next_count{shape_count + 1};

int difference{shape_count - next_count};
int opposite{-difference};
```

`shape_count - next_count` 中的 `-` 有两个操作数，执行减法，得到 `-1`。`-difference` 中的 `-` 只有一个操作数，是表示相反数的一元运算符（unary operator），得到 `1`。

这两次运算分别把结果用于初始化 `difference` 和 `opposite`，不会修改参与运算的已有对象。最终 `shape_count` 为 `3`，`next_count` 为 `4`，`difference` 为 `-1`，`opposite` 为 `1`。

> [!IMPORTANT] 运算符与操作数
> **运算符规定需要执行的运算，操作数是参与运算的表达式；一元、二元分别表示具有一个、两个操作数。**运算符的含义由表达式结构、操作数类型和相应语言规则共同确定，不能只凭符号外形判断。

下表用于按任务定位本章说明，具体规则与失败边界可通过类别链接查阅，不必在这里逐项背诵全部符号：

| 类别 | 运算符 | 作用 |
| --- | --- | --- |
| [算术运算](02-arithmetic-operations-and-result-types.md#二元算术运算符) | `+`、`-`、`*`、`/`、`%` | 计算数值结果 |
| [赋值与状态修改](04-assignment-and-object-state.md#赋值表达式) | `=`、`+=`、`-=`、`*=`、`/=`、`%=`、`++`、`--` | 修改已有对象 |
| [比较运算](05-comparison-and-logical-operations.md#比较运算符comparison-operators) | `==`、`!=`、`<`、`<=`、`>`、`>=` | 产生布尔判断 |
| [逻辑运算](05-comparison-and-logical-operations.md#逻辑运算符logical-operators) | `!`、`&&`、`\|\|` | 反转或组合布尔判断 |

## 表达式语句（Expression Statement）

表达式可以出现在初始化器中，也可以作为语句单独执行。下面是另一个独立示例：

```cpp
int shape_count{3};
shape_count = 4;
```

第二行中的 `shape_count = 4` 是赋值表达式，末尾加上分号后，构成表达式语句（expression statement）。执行这条语句时，表达式会被求值，`shape_count` 改为保存 `4`；整个表达式的结果没有继续交给其他代码使用，修改仍然发生。

第一行的 `int shape_count{3};` 则是声明：`3` 是初始化器使用的表达式，`{3}` 是初始化器，整条声明定义并初始化对象。声明中可以包含表达式，不代表声明本身就是表达式。

> [!IMPORTANT] 表达式、声明与表达式语句
> **表达式在语句位置后接分号，可以构成表达式语句；变量声明属于另一种语法结构。**分号结束相应结构，不能据此把声明当成表达式语句。表达式语句的结果可以不被继续使用，副作用仍会完成。

## 参考资料

- [C++23 工作草案：表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.pre)
- [C++23 工作草案：值计算与副作用](https://timsong-cpp.github.io/cppwp/n4950/intro.execution#7)
- [C++23 工作草案：赋值表达式的结果与修改](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：一元运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.op)
- [C++23 工作草案：表达式语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.expr)
