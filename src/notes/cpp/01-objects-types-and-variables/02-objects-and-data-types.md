---
title: 对象与数据类型（Objects and Data Types）
date: 2026-08-10
---

# 对象与数据类型（Objects and Data Types）

## 对象（Object）

例如，模拟汽车时需要记住左前轮当前的气压。C++ 中可以写成：

```cpp
double front_left_pressure{2.4};
```

先不急着拆解其中的语法，只看这行代码执行后发生了什么：程序中出现了一份能够持续保存轮胎气压的数据。它当前保存 `2.4`，以后还可以发生变化：

```cpp
front_left_pressure = 1.8;
```

数值从 `2.4` 变成了 `1.8`，但保存气压的那份数据仍然是原来的那一份。由此可以先建立对象最重要的直觉：

> 对象不是某个具体数值，而是程序运行期间实际存在、能够保存状态的一份独立实体。它的值可以改变，而对象本身仍然存在。

## 数据类型（Data Type）

写好的 C++ 源代码最初只是保存在硬盘或固态硬盘中的文本文件。它经过编译和链接后成为可执行程序（Executable Program），但此时仍然只是一个尚未运行的文件。当我们启动它时，操作系统会为它建立运行环境，并将当前需要执行的指令和使用的数据装入主内存（Main Memory）中。处理器不断读取并执行这些指令，同时读取和修改其中的数据，程序才真正运行起来。

主内存由大量可以被电子电路读取和写入的存储单元组成。在数字电路中，半导体晶体管可以用于控制电流或访问存储单元。电路会把不同范围的电压或电荷状态归入两个容易区分的状态，并分别记为 `0` 和 `1`。真实的电压和电荷可以连续变化，但只区分两种状态更容易抵抗电气噪声，也更容易构造稳定的运算与存储电路。这种使用两种状态表示信息的方式称为 binary（二进制）。

binary 表示中的每一位称为比特（`bit`），它的值只能是 `0` 或 `1`。一个比特只能区分两种状态，因此计算机会让多个比特共同构成比特组合（bit patterns），以表示更多信息。现代通用计算机通常将连续的 8 个比特组织成一个字节（`byte`），一个字节因而可以形成 $2^8=256$ 种不同的 bit patterns。内存地址通常以字节为基本单位标识存储位置，C++ 也使用字节作为衡量对象大小的基本单位。

虽然各种数据最终都会以比特的形式存入内存，但它们所表达的信息并不相同。轮胎数量只能是整数，轮胎气压可能带有小数，发动机只有启动和停止两种状态，车辆名称则由文字组成。它们需要表示的内容、可以进行的操作以及占用的存储空间都不一样。如果程序只看到一串没有说明的比特，就无法知道这些比特代表数量、气压、状态还是文字。不同的数据类型正是为了建立这种区别：它们告诉程序一组比特应当表示什么，以及可以按照什么规则使用。

回到最初的代码：

```cpp
double front_left_pressure{2.4};
```

`double` 位于对象名称的前面，它是 `front_left_pressure` 的数据类型。`double` 属于浮点类型（floating-point type），可以表示一定范围内带有小数部分的数值。它告诉编译器应当按照 `double` 的规则为这个对象安排存储，并怎样解释和处理其中保存的数据。因此，`front_left_pressure` 从创建开始就是一个 `double` 对象；将它的值从 `2.4` 改为 `1.8`，改变的是对象当前保存的值，而不是对象的数据类型。

下面的表格只列出当前需要认识的常用基本类型。表中的存储大小和表示范围来自采用 8-bit byte 的两种主流 64 位实现，用于观察类型与存储之间的关系，并不是 C++ 对所有平台作出的固定规定。

| C++ 类型 | Windows x64 / MSVC | Linux x86-64 / GCC、Clang | 对应实现中的表示范围 |
|---|---:|---:|---:|
| `bool` | 1 byte | 1 byte | `false`、`true` |
| `char` | 1 byte | 1 byte | `−128～127` 或 `0～255`，由实现决定 |
| `signed char` | 1 byte | 1 byte | `−128～127` |
| `unsigned char` | 1 byte | 1 byte | `0～255` |
| `short` | 2 bytes | 2 bytes | `−32,768～32,767` |
| `unsigned short` | 2 bytes | 2 bytes | `0～65,535` |
| `int` | 4 bytes | 4 bytes | `−2,147,483,648～2,147,483,647` |
| `unsigned int` | 4 bytes | 4 bytes | `0～4,294,967,295` |
| `long` | 4 bytes | 8 bytes | Windows： $[-2^{31},\,2^{31}-1]$；Linux： $[-2^{63},\,2^{63}-1]$ |
| `unsigned long` | 4 bytes | 8 bytes | Windows： $[0,\,2^{32}-1]$；Linux： $[0,\,2^{64}-1]$ |
| `long long` | 8 bytes | 8 bytes | $[-2^{63},\,2^{63}-1]$ |
| `unsigned long long` | 8 bytes | 8 bytes | $[0,\,2^{64}-1]$ |

### int（Integer）

数学中的整数可以无限延伸，但 C++ 对象能够使用的存储空间是有限的，因此整数类型只能表示一个有限区间。以表格中的主流平台为例，一个 `int` 通常占用 4 bytes，也就是 32 bits，共有 $2^{32}$ 种不同的比特组合。`int` 默认是有符号类型，这些组合被用来表示 $-2^{31}$ 到 $2^{31}-1$ 之间的整数。只要数值处于这个范围内，每一个整数都可以被精确表示。

#### 有符号与无符号整数（Signed and Unsigned Integers）

整数是否需要表示负数，决定了有限的 bit patterns 如何对应数值。C++ 的整数类型分为有符号类型（signed integer type）与无符号类型（unsigned integer type）。`int` 与 `signed int` 表示同一种类型，可以表示负数、零和正数；`unsigned int` 只表示零和正数。两者通常占用相同的存储空间，区别不在于拥有多少个 bits，而在于这些 bits 所表示的数值范围。

### char（Character）

在理解 `char` 之前，先思考一个更基础的问题：内存只能保存由 `0` 和 `1` 构成的 bit patterns，那么字母 `A` 应当怎样存入内存？

假设只使用一个 bit，可以自行约定 `0` 代表 `A`，`1` 代表 `B`；如果还要表示 `C`，就需要增加 bit，从而获得更多 bit patterns。但这些组合本身并不具有字符含义：一个程序可以规定 `00` 代表 `A`，另一个程序也可以把它解释成 `B`。为了让不同程序和设备能够正确交换文本，必须共同约定字符与数值之间的映射关系，这种规则称为字符编码（character encoding）。

为了解决这种共同约定的问题，20 世纪 60 年代形成了 ASCII（American Standard Code for Information Interchange，美国信息交换标准代码）。ASCII 使用 7 bits 定义了 128 个编码值，范围是 0 到 127，并统一规定了控制字符（control characters）、空格、数字字符、英文字母和常用标点各自对应的数值。例如，数字字符 `0` 对应 48，大写字母 `A` 对应 65，小写字母 `a` 对应 97。当不同系统都遵循 ASCII 时，数值 65 就会被一致地解释为字符 `A`。

| ASCII 编码值 | 内容 |
|---|---|
| `0～31`、`127` | 控制字符 |
| `32` | 空格 |
| `33～47`、`58～64`、`91～96`、`123～126` | 常用标点与符号 |
| `48～57` | 数字字符 `0～9` |
| `65～90` | 大写字母 `A～Z` |
| `97～122` | 小写字母 `a～z` |

完整的 7-bit ASCII 编码表与 bit 排列方式可参阅 [RFC 20：ASCII format for Network Interchange](https://www.rfc-editor.org/rfc/rfc20.html)。

有了字符编码，便可以回到 C++ 中的 `char`。`char` 是 `character` 的缩写，也是 C++ 的一种整数类型，一个 `char` 对象占用一个 byte。它本身不保存字符的形状，也不携带任何字符编码信息，只保存一个整数值。例如：

```cpp
char letter{'A'};
```

`'A'` 是字符字面量（character literal）；在采用 ASCII 兼容编码的常见实现中，它对应的数值是 65，因此 `letter` 实际保存的是编码值 65。

`char`、`signed char` 和 `unsigned char` 是三种不同的类型。在常见的 8-bit byte 实现中，`signed char` 通常表示 −128 到 127，`unsigned char` 表示 0 到 255；普通 `char` 采用其中哪一种数值范围，由具体实现决定。ASCII 的编码值都位于 0 到 127，因此无论普通 `char` 是否有符号，都能够完整表示 ASCII。

ASCII 的 128 个编码值足以表示基础英文字母、数字和符号，却无法容纳中文以及世界上其他书写系统。单纯增加更多 bits 只能扩大可用编号的数量；如果不同系统仍然采用各自的字符映射，交换文本时依然可能得到不同结果。因此，需要一套能够统一收录不同语言文字和符号的字符标准。Unicode（统一码）为收录的字符分配唯一的码点（code point），例如字符 `A` 的码点是 `U+0041`，字符 `中` 的码点是 `U+4E2D`。Unicode 在这里解决的是“一个字符使用哪个编号”的问题，并不要求这些编号必须以固定数量的 bytes 存入内存。

Unicode 码点需要经过具体的编码方式才能写入内存。UTF-8（8 位 Unicode 转换格式，8-bit Unicode Transformation Format）使用 1 到 4 bytes 编码一个码点，并完整保留 ASCII：0 到 127 仍使用原来的单个 byte。超出 ASCII 范围的字符则需要多个 bytes，例如字符 `中` 在 UTF-8 中需要三个 bytes。在常见的 8-bit byte 实现中，每个 UTF-8 byte 可以由一个 `char` 对象保存。因此，`char` 保存的是一个编码单元（code unit），不一定是一个完整字符。

<span id="floating-point-basics"></span>

### 浮点数（Floating-Point Numbers）

`float`、`double` 和 `long double` 是 C++ 中常用的浮点类型，用于表示带有小数部分或者跨越较大数量级的数值。浮点类型只拥有有限数量的 bit patterns，因此只能表示有限个离散数值。表示范围（range）描述类型能够覆盖多大或多小的数量级；表示精度（precision）描述能够保留多少位有效数字（significant digits），并不表示小数点后固定拥有多少位。

| C++ 类型 | Windows x64 / MSVC | Linux x86-64 / GCC、Clang | 常见有限数值范围 | 常见十进制有效精度 |
|---|---:|---:|---:|---:|
| `float` | 4 bytes | 4 bytes | 约 $[-3.40\times10^{38},\,3.40\times10^{38}]$ | 约 6～7 位 |
| `double` | 8 bytes | 8 bytes | 约 $[-1.80\times10^{308},\,1.80\times10^{308}]$ | 约 15～16 位 |
| `long double` | 8 bytes | 16 bytes | Windows 与 `double` 相同；Linux 约为 $\pm1.19\times10^{4932}$ | Windows 约 15～16 位；Linux 约 18 位 |

主流实现通常采用二进制浮点表示，因此无法精确表示 `0.1` 等部分十进制小数，只能通过舍入（rounding）保存附近的可表示值；浮点运算的结果也可能再次发生舍入。这不是计算机“算错了”，而是有限表示能力带来的必然结果。

一般计算通常优先使用 `double`，它比 `float` 提供更高的常见精度。只有在存储空间、内存带宽、硬件接口或既有数据格式明确要求时，才需要优先考虑 `float`；`long double` 的大小与精度则需要结合具体平台判断。

> 附章：[浮点数的表示与运算（Floating-Point Representation and Arithmetic）](deep-dives/01-floating-point-representation-and-arithmetic.md)

<span id="floating-point-continue"></span>

### bool（Boolean）

有些数据并不表示数量、字符或者测量值，而只需要回答一个问题：发动机是否正在运行、车门是否已经关闭、当前数据是否有效。这样的状态只有“是”和“否”两种可能，可以使用布尔类型（Boolean type）`bool` 表示。

```cpp
bool engine_running{false};
```

这行代码创建了一个 `bool` 对象 `engine_running`，当前值为 `false`，表示发动机没有运行。状态发生变化时，可以修改它保存的值：

```cpp
engine_running = true;
```

`true` 和 `false` 是 C++ 的两个布尔字面量（Boolean literals）。赋值后，`engine_running` 仍然是原来的 `bool` 对象，只是当前值从 `false` 变成了 `true`。

C++ 还规定了整数与 `bool` 之间的转换规则。整数 `0` 转换为 `false`，任何非零整数都转换为 `true`：

```cpp
bool active{false};

active = 0;   // active == false
active = 7;   // active == true
active = -3;  // active == true
```

赋入 `7` 或 `-3` 后，`active` 不会保存原来的整数，只会保存转换后的逻辑值 `true`。反过来，将 `bool` 转换为整数时，`false` 转换为 `0`，`true` 转换为 `1`。因此，“零为假、非零为真”描述的是转换规则，并不表示 `bool` 可以保存任意整数。

在 C++ 的类型分类中，`bool` 属于整数类型的一部分，但它是一个独立的类型，其语义范围只有：

```text
false
true
```

因此，`bool` 不应被理解成一个范围很小的普通整数。它表达的是一个判断是否成立，而不是参与计数或测量的数值。

两个逻辑值理论上只需要一个 bit 就能区分，但一个可以独立寻址的 C++ 对象通常至少占用一个 byte。因此，在表格列出的主流实现中，`bool` 通常占用 1 byte。存储空间包含多少 bits，与这个类型在语言层面拥有多少个有效值，是两件不同的事情。

`bool` 适合表示真正只有两种状态的信息。如果“未知”“尚未检查”或者“发生故障”也是具有独立含义的状态，那么单独一个 `bool` 就无法完整表达这些情况。
