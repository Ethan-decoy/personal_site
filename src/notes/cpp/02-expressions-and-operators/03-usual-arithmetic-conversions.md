---
title: 通常算术转换（Usual Arithmetic Conversions）
date: 2026-08-25
---

# 通常算术转换（Usual Arithmetic Conversions）

二元算术运算经常遇到类型不同的操作数：一个对象可能是 `int`，另一个对象可能是 `double`；两个整数也可能具有不同宽度或不同符号属性。运算符需要先确定一套共同的类型规则，才能对两个值执行同一次运算。

**许多接受算术类型操作数的二元运算符，会通过通常算术转换（usual arithmetic conversions）确定共同类型，再让两个操作数以该类型参与运算。**对于本章讨论的基本算术运算，这个共同类型也是表达式结果的类型。

以下讨论整数类型与 `float`、`double`、`long double` 三种标准浮点类型。除完整程序外，各个 C++ 片段均独立放在 `main` 函数体内；标为错误的片段用于说明编译诊断。

## 转换的是参与运算的值

计算总重量时，数量可以采用整数类型，单件重量则采用浮点类型：

```cpp
int item_count{3};
double item_weight{2.5};

double total_weight{item_count * item_weight};
```

求值 `item_count * item_weight` 时，`item_count` 提供的 `int` 值 `3` 转换为 `double` 值 `3.0`，再与 `2.5` 相乘。乘法产生 `double` 值 `7.5`，用于初始化 `total_weight`。

> [!IMPORTANT] 共同类型作用于参与运算的值
> **通常算术转换只改变这次运算使用的值，不会修改源对象，也不会改变源对象的类型。**求值结束后，`item_count` 仍然是保存整数 `3` 的 `int` 对象；转换得到的 `double` 值用于乘法。

这些转换由语言规则自动完成，源代码中没有单独写出转换操作，因此属于隐式转换（implicit conversion）。通常算术转换描述的是一组特定语境中的隐式转换，而不是所有隐式转换的总称。

> [!IMPORTANT] 确定共同类型的判断顺序
> **先区分浮点与整数；只有整数参与时，先提升，再判断共同类型。**
>
> 1. 有标准浮点类型参与时，整数值转换为该浮点类型；两个标准浮点类型则在 `float`、`double`、`long double` 的顺序中采用位置靠后的类型。
> 2. 只有整数参与时，先分别执行整数提升（integral promotions），把 `bool`、`short` 等类型转换为规则规定的整数类型。
> 3. 再检查提升后的类型：类型相同就采用该类型；类型不同时，依据符号属性选择相应规则，继续确定共同类型。
>
> 共同类型确定后，才按该类型的规则执行运算；接收结果的对象类型不参与上述判断。

## 浮点类型参与运算

一个操作数采用标准浮点类型、另一个采用整数类型时，整数值转换为相应的浮点类型：

| 操作数类型 | 共同类型 |
| --- | --- |
| `int` 与 `double` | `double` |
| `long` 与 `float` | `float` |
| `long long` 与 `long double` | `long double` |

两个标准浮点操作数类型相同时，共同类型就是该类型；类型不同时，依据浮点转换等级（floating-point conversion rank）确定转换方向。这是语言规定的类型次序，标准浮点类型的等级由低到高为：

```text
float < double < long double
```

因此，`float` 与 `double` 共同运算时采用 `double`，`double` 与 `long double` 共同运算时采用 `long double`。具体类型能提供多少范围和精度，仍取决于相应 C++ 实现。

### 共同类型不保证保留整数的全部信息

**整数转换为浮点类型时，能精确表示就保留原值；处于目标范围内但不能精确表示时，转换结果由实现规定为相邻的较低或较高可表示值。**超出目标浮点类型可表示范围的整数转换，在 C++23 中产生未定义行为，不能一律当作普通舍入。

仍然计算数量乘以单件重量。把数量改为较大的 `long long` 整数，单件重量用 `float` 保存为 `1`，最终仍用 `double` 接收总重量。**本例假设 `float` 采用 binary32 格式，具有 24 位二进制有效精度；整数到 `float` 的转换采用就近取偶（round to nearest, ties to even），乘法按 binary32 精度求值，不保留额外中间精度：**

```cpp
long long item_count{16777217};
float item_weight{1};

double total_weight{item_count * item_weight};
```

在这些前提下，求值过程为：

| 步骤 | 使用的类型与值 |
| --- | --- |
| 确定共同类型 | 整数与 `float` 共同运算，采用 `float` |
| 转换数量值 | `16777217` 转换为 `float` 值 `16777216` |
| 执行乘法 | 两个 `float` 值 `16777216` 与 `1` 相乘，结果为 `16777216` |
| 初始化总重量 | 乘法结果转换为 `double`，`total_weight` 保存 `16777216.0` |

binary32 在这里相邻的可表示值是 `16777216` 与 `16777218`，整数 `16777217` 恰好位于中间；就近取偶选择保留的二进制有效数末位为 `0` 的一侧，得到 `16777216`。随后乘以 `1` 不会恢复丢失的差值，最终存入 `double` 也不能恢复它。源对象 `item_count` 仍然保存整数 `16777217`。

这里没有超出 binary32 的数值范围，损失发生在整数值转换为 `float` 时。共同类型由操作数类型决定，不会因为某个整数无法精确表示就自动改用 `double`。实际依赖这种转换之前，应核对实现的浮点格式、整数到浮点的取舍规则及求值精度；这组具体数值不代表所有 C++ 实现的统一结果。

## 整数提升（Integral Promotions）

只有整数类型参与运算时，先分别检查整数提升。它让 `bool`、`char`、`short` 等类型按固定规则采用相应的整数类型参与运算。常见规则是：

- `bool` 提升为 `int`，`false` 对应 `0`，`true` 对应 `1`；
- `char`、`signed char`、`unsigned char`、`short` 和 `unsigned short`，在 `int` 能够表示其全部值时提升为 `int`，否则提升为 `unsigned int`。

例如，前后两组物品的数量都用 `short` 保存：

```cpp
short front_count{120};
short rear_count{8};

int total_count{front_count + rear_count};
```

两个 `short` 操作数在加法前都提升为 `int`，因此表达式 `front_count + rear_count` 的类型是 `int`，而不是 `short`。

> [!IMPORTANT] 先提升，再用提升后的类型判断
> **整数提升先于共同类型的判断；即使两个操作数原来的类型相同，也不能跳过提升。**提升规则根据源类型的全部取值范围确定，不等到本次结果超出小类型范围才发生。这里两个值都很小，仍然分别从 `short` 提升为 `int`，再用 `int` 相加。

`front_count` 与 `rear_count` 仍然是两个 `short` 对象，分别保存 `120` 和 `8`；相加得到的 `int` 值 `128` 用于初始化 `total_count`。`int`、`long`、`long long` 及其无符号对应类型不因整数提升而改变。

`wchar_t`、`char8_t`、`char16_t` 与 `char32_t` 的提升候选范围更广，查阅时可见[文末补充](#补充其他字符类型的整数提升)。

## 相同符号属性的整数共同运算

整数提升完成后，如果两个操作数类型相同，共同类型就是该类型。如果类型不同但具有相同的符号属性，则依据整数转换等级（integer conversion rank）选择共同类型，等级较低的一方转换为等级较高的一方。

整数转换等级是语言规定的整数类型次序，与前面的浮点转换等级分别用于相应规则。查阅标准有符号整数类型时，可以按以下顺序比较等级：

```text
signed char < short < int < long < long long
```

每个标准无符号整数类型与对应的有符号整数类型具有相同等级。转换等级由语言规定，不等于对象占用的 byte 数；即使某个实现中的 `int` 与 `long` 大小相同，`long` 的等级仍然高于 `int`。

前组数量采用 `int`，后组数量采用 `long`，相加时需要在这两个类型之间确定共同类型：

```cpp
int front_count{120};
long rear_count{8};

long total_count{front_count + rear_count};
```

这两个类型都不需要整数提升，且都是有符号类型。`long` 的等级高于 `int`，因此 `front_count` 提供的 `int` 值 `120` 转换为 `long`，再与 `long` 值 `8` 相加。表达式的类型是 `long`，结果为 `128`。这个类型选择在 `int` 与 `long` 大小相同的实现中也成立。

## 有符号与无符号整数共同运算

整数提升后，如果一个操作数采用有符号整数类型 `S`，另一个采用无符号整数类型 `U`，共同类型按下面的顺序确定：

> [!IMPORTANT] 混合符号先比较等级，再检查范围
> 1. `U` 的转换等级不低于 `S` 时，共同类型为 `U`，`S` 的值转换为 `U`。
> 2. `S` 的等级更高，并且能够表示 `U` 的全部值时，共同类型为 `S`，`U` 的值转换为 `S`。
> 3. 否则，共同类型为与 `S` 对应的无符号整数类型，两个操作数的值都转换为该类型。
>
> **范围条件检查的是类型的全部取值，不是本次对象恰好保存的值。**等级更高的有符号类型，也不一定能够表示无符号类型的全部值。

最常见的边界出现在 `int` 与 `unsigned int` 共同运算时。二者具有相同等级，因此 `int` 值转换为 `unsigned int`：

```cpp
int adjustment{-1};
unsigned int count{0};

unsigned int result{count + adjustment};
```

求值加法之前，`adjustment` 提供的 `-1` 先转换为 `unsigned int`。设 `unsigned int` 的位宽为 $N$，它的范围就是 $0$ 到 $2^N-1$；$-1+2^N=2^N-1$ 落在这个范围内，并且与 $-1$ 模 $2^N$ 同余，因此转换得到该类型的最大可表示值。加法随后按照无符号规则执行，`count` 提供的 `0` 与这个最大值相加，`result` 最终得到同一个最大值。

**这里没有发生有符号整数溢出；真正改变计算含义的是运算前的共同类型转换。**源代码表面上的负数在进入无符号运算后，已经不再以负值参与计算。

### 花括号检查初始化时的转换

`unsigned int result{count + adjustment};` 使用了花括号，但仍然允许上述运算。原因是 `count + adjustment` 已经按共同类型 `unsigned int` 求值，得到的也是 `unsigned int`；再用它初始化同类型的 `result`，不需要从有符号类型转换。

花括号初始化会拒绝语言规定的窄化转换（narrowing conversion）。与之对照，下面这个独立片段不能通过编译：

```cpp
int adjustment{-1};
unsigned int direct{adjustment}; // 错误：列表初始化需要窄化转换
```

这里直接用 `int` 变量提供的值初始化 `unsigned int`。目标类型不能表示源类型的全部值，这次初始化需要窄化转换，因此花括号初始化拒绝它。

> [!IMPORTANT] 花括号不会追查表达式内部的转换
> **在这里的数值初始化中，花括号检查表达式结果到目标对象的初始化转换，不会阻止表达式内部按自身规则先进行的转换。**加法内部的 `int` 到 `unsigned int` 转换，与加法结果到 `result` 的初始化，是两个不同位置的类型转换判断。

窄化属于语言规定的转换分类，完整类别与常量表达式例外见[列表初始化与窄化](../06-constants-literals-and-type-conversions/05-list-initialization-and-narrowing.md#窄化是标准定义的分类)。判断当前加法时，仍需先确定加法的共同类型。

### 等级更高仍需检查范围

如果有符号类型的等级更高，还需要继续检查可表示范围。将 `adjustment` 改成 `long`，其等级始终高于 `unsigned int`；但等级高不保证能容纳对方的全部值：

```cpp
#include <iostream>

int main() {
    long adjustment{-1};
    unsigned int count{0};
    std::cout << adjustment + count << '\n';
    return 0;
}
```

这里 `S` 是 `long`，`U` 是 `unsigned int`。下面明确假定 `int` 与 `unsigned int` 都为 32 位，对照两种常见实现条件：

| 实现前提 | `long` 能否表示全部 `unsigned int` 值 | 共同类型与转换 | 输出 |
| --- | --- | --- | ---: |
| `long` 为 64 位（如 LP64） | 能，最大值大于 $2^{32}-1$ | 第 2 支：`count` 的值转为 `long`，在 `long` 中计算 $-1+0$ | -1 |
| `long` 为 32 位（如 LLP64） | 不能，有符号最大值为 $2^{31}-1$ | 第 3 支：共同类型为 `unsigned long`，`-1` 转为 $2^{32}-1$ | 4294967295 |

同一源码在这些明确前提下走不同分支，差别来自类型范围，而非这次 `count` 恰好为零。规则检查的是能否表示该类型的**全部值**。两个源对象仍分别是 `long` 和 `unsigned int`，转换发生在参与运算的值上；其他实现也应按实际等级与范围判断。

表中的 LP64、LLP64 是常见数据模型（data model）的名称，描述实现对几种基本类型位宽的约定。迁移代码或依赖这段输出之前，应从目标工具链文档核对 `int`、`unsigned int` 与 `long` 的实际位宽和范围，再应用相同规则；数据模型名称可在需要确认实现规格时查阅。

## 共同类型决定运算边界

> [!IMPORTANT] 先确定共同类型，再判断运算边界
> **先根据操作数确定共同类型，再按该类型求值，最后才把结果用于初始化或赋值。**接收结果的对象类型不能反向改变前面的运算规则：
>
> - 共同类型是有符号整数时，加、减、乘等运算无法表示数学结果，会产生未定义行为。
> - 共同类型是无符号整数时，运算采用以 $2^N$ 为模的规则，$N$ 是该类型的位宽。
> - 共同类型是浮点类型时，操作数转换及运算结果都可能受有限精度影响；较宽的接收类型不能恢复已经丢失的信息。

除法与取余还须满足除数非零、整数商可表示等[有效条件](02-arithmetic-operations-and-result-types.md#除法与取余的失败边界)。浮点表达式的具体求值精度与中间舍入也依赖实现及编译配置；前面的 binary32 对照已把这些条件写在示例之前。

普通数量运算应尽量让参与同一次运算的整数具有一致的符号属性。不同类型的数据来自外部接口时，应先确认可表示范围与业务含义，而不是让有符号与无符号转换悄然决定结果。

## 补充：其他字符类型的整数提升

`wchar_t`、`char8_t`、`char16_t` 与 `char32_t` 各自具有底层类型（underlying type）：它是提供相同值范围与表示的整数类型，字符类型本身仍是独立类型。

这些字符类型进行整数提升时，依次考察以下候选，选择第一个能够表示底层类型全部值的类型：

```text
int
unsigned int
long
unsigned long
long long
unsigned long long
```

如果没有候选满足要求，就提升为源字符类型的底层类型。确定提升结果后，再按照前面的共同类型规则参与后续运算。

使用这些字符类型参与算术时，可按上述候选顺序查阅，并结合目标实现的底层类型与范围判断；这里同样检查类型的全部值，不只检查当前字符对应的整数值。

## 参考资料

- [C++23 工作草案：通常算术转换](https://timsong-cpp.github.io/cppwp/n4950/expr.arith.conv)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom)
- [C++23 工作草案：转换等级](https://timsong-cpp.github.io/cppwp/n4950/conv.rank)
- [C++23 工作草案：整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)
- [C++23 工作草案：整数与浮点转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)
- [C++23 工作草案：列表初始化与窄化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：浮点表达式的中间精度](https://timsong-cpp.github.io/cppwp/n4950/expr.pre#6)
