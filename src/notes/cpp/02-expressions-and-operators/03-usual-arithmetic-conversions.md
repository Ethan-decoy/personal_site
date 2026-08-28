---
title: 通常算术转换（Usual Arithmetic Conversions）
date: 2026-08-25
---

# 通常算术转换（Usual Arithmetic Conversions）

二元算术运算经常遇到类型不同的操作数：一个对象可能是 `int`，另一个对象可能是 `double`；两个整数也可能具有不同宽度或不同符号属性。运算符需要先确定一套共同的类型规则，才能对两个值执行同一次运算。

**许多接受算术类型操作数的二元运算符，会通过通常算术转换（usual arithmetic conversions）确定共同类型，再让两个操作数以该类型参与运算。**对于本章讨论的基本算术运算，这个共同类型也是表达式结果的类型。

## 转换的是参与运算的值

```cpp
int item_count{3};
double item_weight{2.5};

double total_weight{item_count * item_weight};
```

求值 `item_count * item_weight` 时，`item_count` 提供的 `int` 值 `3` 转换为 `double` 值 `3.0`，再与 `2.5` 相乘。乘法产生 `double` 值 `7.5`，用于初始化 `total_weight`。

**转换只影响这次运算使用的值，不会修改源对象，也不会改变源对象的类型。**求值结束后，`item_count` 仍然是保存整数 `3` 的 `int` 对象。

这些转换由语言规则自动完成，源代码中没有单独写出转换操作，因此属于隐式转换（implicit conversion）。通常算术转换描述的是一组特定语境中的隐式转换，而不是所有隐式转换的总称。

## 浮点类型参与运算

一个操作数采用标准浮点类型、另一个采用整数类型时，整数值转换为相应的浮点类型：

| 操作数类型 | 共同类型 |
| --- | --- |
| `int` 与 `double` | `double` |
| `long` 与 `float` | `float` |
| `long long` 与 `long double` | `long double` |

**整数转换为浮点类型并不保证原值一定能够被精确表示。**例如，某些较大的整数超出 `float` 的有效精度后，转换结果只能是附近的可表示浮点值。共同类型能够扩大数量级或允许小数运算，不等于自动保留全部信息。

两个标准浮点操作数类型不同时，转换等级较低的一方转换为等级较高的一方：

```text
float < double < long double
```

因此，`float` 与 `double` 共同运算时采用 `double`，`double` 与 `long double` 共同运算时采用 `long double`。具体类型能提供多少范围和精度，仍取决于相应 C++ 实现。

## 整数提升（Integral Promotions）

只有整数类型参与运算时，等级低于 `int` 的常见整数类型首先进行整数提升（integral promotions）：

- `bool` 提升为 `int`；
- `char`、`signed char`、`unsigned char`、`short` 和 `unsigned short`，在 `int` 能够表示其全部值时提升为 `int`，否则提升为 `unsigned int`。

`wchar_t`、`char8_t`、`char16_t` 与 `char32_t` 使用更长的候选序列。语言选择其中第一个能够表示源类型全部值的类型：

```text
int
unsigned int
long
unsigned long
long long
unsigned long long
源字符类型的底层类型（underlying type）
```

```cpp
short front_count{120};
short rear_count{8};

int total_count{front_count + rear_count};
```

两个 `short` 操作数在加法前都提升为 `int`，因此表达式 `front_count + rear_count` 的类型是 `int`，而不是 `short`。

**整数提升不是“结果超出小类型范围时才临时发生”的补救措施，而是相应运算求值前固定执行的类型规则。**即使两个值都很小，表达式仍然采用提升后的类型。

## 相同符号属性的整数共同运算

整数提升完成后，如果两个操作数类型相同，共同类型就是该类型。如果类型不同但具有相同的符号属性，则转换等级较低的一方转换为等级较高的一方。

标准有符号整数类型的转换等级依次为：

```text
signed char < short < int < long < long long
```

每个标准无符号整数类型与对应的有符号整数类型具有相同等级。转换等级由语言规定，不等于对象占用的 byte 数；即使某个实现中的 `int` 与 `long` 大小相同，`long` 的等级仍然高于 `int`。

## 有符号与无符号整数共同运算

整数提升后，如果一个操作数采用有符号整数类型 `S`，另一个采用无符号整数类型 `U`，共同类型按下面的顺序确定：

1. `U` 的转换等级不低于 `S` 时，`S` 转换为 `U`；
2. `S` 的等级更高，并且能够表示 `U` 的全部值时，`U` 转换为 `S`；
3. 否则，两个操作数都转换为与 `S` 对应的无符号整数类型。

最常见的边界出现在 `int` 与 `unsigned int` 共同运算时。二者具有相同等级，因此 `int` 值转换为 `unsigned int`：

```cpp
int adjustment{-1};
unsigned int count{0};

unsigned int result{count + adjustment};
```

求值加法之前，`adjustment` 提供的 `-1` 转换为与它模 $2^N$ 同余的 `unsigned int` 值，也就是该类型的最大可表示值。加法随后按照无符号规则执行，`result` 最终得到同一个最大值。

**这里没有发生有符号整数溢出；真正改变计算含义的是运算前的共同类型转换。**源代码表面上的负数在进入无符号运算后，已经不再以负值参与计算。

## 共同类型决定运算边界

通常算术转换结束后，后续运算完全受到共同类型的表示范围和算术规则约束：

- 共同类型是有符号整数时，无法表示的数学结果会产生未定义行为；
- 共同类型是无符号整数时，运算采用模运算；
- 共同类型是浮点类型时，结果可能因有限精度而舍入。

**不能只查看最终接收结果的对象类型来判断运算是否安全。**表达式在哪种类型中求值，必须先从操作数与通常算术转换推导出来。

普通数量运算应尽量让参与同一次运算的整数具有一致的符号属性。不同类型的数据来自外部接口时，应先确认可表示范围与业务含义，而不是让有符号与无符号转换悄然决定结果。

## 参考资料

- [C++23 工作草案：通常算术转换](https://timsong-cpp.github.io/cppwp/n4950/expr.arith.conv)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom)
- [C++23 工作草案：整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)
