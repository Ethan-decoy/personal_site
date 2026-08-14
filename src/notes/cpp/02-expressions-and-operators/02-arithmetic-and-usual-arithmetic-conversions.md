---
title: 算术运算与通常算术转换（Arithmetic Operations and Usual Arithmetic Conversions）
date: 2026-08-12
---

# 算术运算与通常算术转换（Arithmetic Operations and Usual Arithmetic Conversions）

## 基本算术运算

C++ 提供了一组算术运算符，用于让数值参与基本数学运算：

| 运算符 | 运算 | 示例 | 结果 |
|---|---|---|---|
| `+` | 加法 | `8 + 4` | `12` |
| `-` | 减法 | `8 - 4` | `4` |
| `*` | 乘法 | `8 * 4` | `32` |
| `/` | 除法 | `8 / 4` | `2` |
| `%` | 取余 | `8 % 3` | `2` |

前四种运算与通常的数学直觉基本一致；`%` 计算整数除法得到的余数。运算符 `/` 和 `%` 的具体结果还与操作数的数据类型有关，需要分别说明。

## 算术表达式的类型

算术运算中的数值并不脱离数据类型存在。每个操作数都有自己的类型，运算符据此确定运算方式；表达式经过求值后，所得结果同样具有确定的类型。

```cpp
int left{8};
int right{4};
int total{left + right};
```

`left` 和 `right` 都是 `int` 对象。表达式 `left + right` 读取二者当前保存的值，执行 `int` 加法，得到 `int` 类型的结果 `12`。该结果随后用于初始化 `total`。

在这类算术表达式中，表达式先按照操作数的类型完成求值，所得结果再用于初始化或赋值。接收结果的对象不会反过来改变此前采用的运算规则。

## 通常算术转换（Usual Arithmetic Conversions）

C++ 将整数类型和浮点类型统称为算术类型（arithmetic types）。许多接受算术类型操作数的二元运算符，会按照通常算术转换（usual arithmetic conversions）为两个操作数确定共同类型，再以该类型完成运算。对于本篇讨论的算术运算符，这个共同类型也是表达式结果的类型。通常算术转换在隐式转换体系中的位置，参见[通常算术转换中的隐式转换](../06-constants-literals-and-type-conversions/04-implicit-type-conversions.md#通常算术转换中的隐式转换)。

### 浮点类型参与运算

一个操作数是浮点类型、另一个是整数类型时，整数值转换为浮点操作数的类型：

| 表达式中的类型 | 共同类型 |
|---|---|
| `int` 与 `double` | `double` |
| `long` 与 `float` | `float` |
| `long long` 与 `long double` | `long double` |

两个浮点操作数类型不同时，浮点转换等级较低的一方转换为等级较高的一方。三种标准浮点类型的等级依次为：

```text
float < double < long double
```

因此，`float` 与 `double` 共同运算时采用 `double`，`double` 与 `long double` 共同运算时采用 `long double`。

### 整数类型参与运算

只有整数类型参与运算时，较小的整数类型首先进行整数提升（integral promotions）：

- `bool` 提升为 `int`；
- `char`、`signed char`、`unsigned char`、`short` 和 `unsigned short` 等等级低于 `int` 的类型，在 `int` 能表示其全部取值时提升为 `int`，否则提升为 `unsigned int`。

整数提升完成后：

- 两个操作数类型相同，共同类型就是该类型；
- 两者同为有符号或同为无符号类型，转换等级较低的一方转换为等级较高的一方；
- 一方有符号、另一方无符号时，需要同时比较转换等级与可表示范围。

标准有符号整数类型的转换等级依次为：

```text
signed char < short < int < long < long long
```

每个无符号整数类型与其对应的有符号整数类型具有相同等级。即使某个平台上的 `int` 和 `long` 占用相同的存储空间，`long` 的转换等级仍然高于 `int`。

有符号类型与无符号类型混合时，可以令二者分别为 `S` 和 `U`：

1. `U` 的等级不低于 `S`，共同类型为 `U`；
2. `S` 的等级更高，并且能够表示 `U` 的全部取值，共同类型为 `S`；
3. 否则，共同类型为与 `S` 对应的无符号类型。

这些规则对应 [C++ 工作草案中的通常算术转换](https://eel.is/c%2B%2Bdraft/expr.arith.conv) 与[整数提升](https://eel.is/c%2B%2Bdraft/conv.prom)。

## 共同类型与求值过程

共同类型确定后，操作数提供的值按照这个类型参与运算，运算结果也具有该类型。对象自身的类型不会因为参与一次算术运算而改变。

```cpp
int distance{9};
int segments{4};
double precise_segments{4.0};

int rough{distance / segments};
double precise{distance / precise_segments};
```

两个表达式的求值过程分别为：

| 表达式 | 操作数类型 | 共同类型 | 执行的运算 | 结果 |
|---|---|---|---|---|
| `distance / segments` | `int`、`int` | `int` | 整数除法 | `int` 值 `2` |
| `distance / precise_segments` | `int`、`double` | `double` | 浮点除法 | `double` 值 `2.25` |

求值 `distance / precise_segments` 时，`distance` 提供的 `int` 值 `9` 按照共同类型转换为 `double` 值 `9.0`，再与 `4.0` 相除。转换只作用于这次运算所使用的值；`distance` 仍然是保存整数 `9` 的 `int` 对象。

## 整数除法与取余

运算符 `/` 可以用于整数和浮点数，`%` 只接受整数操作数。通常算术转换完成后，如果 `/` 的两个操作数采用整数类型，执行的就是整数除法。

```cpp
int positive_quotient{7 / 3};   // 2
int negative_quotient{-7 / 3};  // -2
```

整数除法产生的数学商如果带有小数部分，小数部分会被直接丢弃，结果向零截断（truncation towards zero），而不是四舍五入。因此，`7 / 3` 得到 `2`，`-7 / 3` 得到 `-2`。

运算符 `%` 得到同一次整数除法的余数。当商能够由结果类型表示时，商与余数满足：

```text
(a / b) * b + a % b == a
```

```cpp
int positive_remainder{7 % 3};   // 1
int negative_remainder{-7 % 3};  // -1
```

在有符号整数运算中，非零余数的符号与被除数相同。

整数除数为零时，`/` 和 `%` 都会产生未定义行为（undefined behavior）。如果数学商无法由结果类型表示，这两个运算同样会产生未定义行为。相关规则可参阅 [C++ 工作草案中的乘法类运算符](https://eel.is/c%2B%2Bdraft/expr.mul)。

## 整数溢出与无符号回绕（Integer Overflow and Unsigned Wraparound）

通常算术转换确定共同类型后，算术运算还受到该类型可表示范围的约束。数学结果超出范围时，不能统一理解为“溢出后回绕”：有符号整数溢出会产生未定义行为，无符号整数则按照模运算规则得到确定结果。

### 有符号整数溢出

有符号整数运算的数学结果如果无法由结果类型表示，这种情况称为有符号整数溢出（signed integer overflow），程序会产生未定义行为（undefined behavior）。假设 `int` 的最大可表示值为 `M`，那么采用 `int` 运算的 `M + 1` 已经超出范围。

C++ 不保证这个结果回绕为 `int` 的最小值。即使某次运行表现出回绕，也不能将其作为程序可以依赖的语言规则。

### 无符号整数回绕

宽度为 $N$ 的无符号整数类型可以表示从 $0$ 到 $2^N-1$ 的值，其算术运算以 $2^N$ 为模进行。超出上界的部分会从 `0` 继续计算，低于 `0` 的结果则从最大值一端继续计算。

```cpp
unsigned int zero{0};
unsigned int one{1};
unsigned int result{zero - one};
```

`zero - one` 的数学结果是 `-1`，但 `unsigned int` 不表示负数。按照模 $2^N$ 运算，`result` 得到 $2^N-1$，即 `unsigned int` 的最大可表示值。

按照 C++ 标准的术语，无符号算术不会溢出；这里的“回绕”描述的是模运算结果跨越表示范围端点的现象。这种行为由语言明确定义，但结果仍可能违背程序原本表达的数量含义。

### 有符号与无符号类型共同运算

通常算术转换可能使整个表达式采用无符号整数类型。例如，`int` 与 `unsigned int` 具有相同的转换等级，共同类型是 `unsigned int`：

```cpp
int adjustment{-1};
unsigned int count{0};
unsigned int result{count + adjustment};
```

求值加法之前，`adjustment` 提供的 `int` 值 `-1` 转换为与它模 $2^N$ 同余的 `unsigned int` 值，即 $2^N-1$。加法随后按照无符号整数规则执行，因此 `result` 得到 `unsigned int` 的最大可表示值。

这里仍然发生了隐式转换（implicit conversion）：源代码没有单独写出转换操作，而是通常算术转换在表达式求值过程中将 `-1` 转换为 `unsigned int`。`adjustment` 对象本身没有改变，发生转换的是这次运算所使用的值。

表达式 `count + adjustment` 的结果类型已经是 `unsigned int`，因此用它直接列表初始化同类型的 `result` 时，不需要在初始化的最外层再进行类型转换，也就不会因窄化而报错。列表初始化对窄化的限制，不会取消已在初始化表达式内部发生的转换。

相关规则可参阅 [C++ 工作草案中的基本类型](https://eel.is/c%2B%2Bdraft/basic.fundamental)、[算术表达式](https://eel.is/c%2B%2Bdraft/expr.pre)、[整数转换](https://eel.is/c%2B%2Bdraft/conv.integral) 与[列表初始化](https://eel.is/c%2B%2Bdraft/dcl.init.list)。

### 整数类型的选择

普通的数量运算通常优先使用有符号整数类型。无符号整数表达的是以 $2^N$ 为模的算术规则，而不是对“这个数不应为负”的约束；如果业务并不需要回绕，仅仅改用无符号类型并不能防止无效的负数进入程序，反而可能让减法和边界判断产生意外结果。

参与同一次运算或比较的整数应尽量采用一致的符号属性。不同符号属性的数据来自不同接口时，应在进入运算前确认它们的范围与类型关系，而不是让通常算术转换悄然决定结果。这与 [C++ Core Guidelines ES.100](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es100-dont-mix-signed-and-unsigned-arithmetic) 和 [ES.102](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es102-use-signed-types-for-arithmetic) 的建议一致。
