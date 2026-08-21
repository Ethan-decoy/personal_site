---
title: 指针类型、指针值与间接访问（Pointer Types, Pointer Values, and Indirection）
date: 2026-08-19
---

# 指针类型、指针值与间接访问

对象的地址能够定位对象所占存储的起点，但程序还需要一种能够保存这段定位关系的值。**C++ 的指针类型（pointer type）用于表示这种关系；指针对象则可以在程序运行期间保存并更换相应的指针值。**

```cpp
int engine_temperature{78};
int* temperature_pointer{&engine_temperature};
```

**第二行没有复制 `engine_temperature`，也没有把整数 `78` 当成地址。它创建了另一个对象 `temperature_pointer`，并让这个新对象保存一个指向 `engine_temperature` 的指针值。**

## 从对象地址得到指针值

在当前讨论的内建类型中，**前缀一元 `&` 是取地址运算符（address-of operator）：**

```cpp
&engine_temperature
```

**它的操作数是 `engine_temperature`。对这个表达式求值，会产生一个指向该对象的指针值；由于目标对象的类型是 `int`，结果的类型是 `int*`，读作“指向 `int` 的指针”。**

**取地址运算不会读取 `engine_temperature` 当前保存的 `78`，不会复制它的对象表示，也不会在原对象旁边额外创建地址。对象原本就占用一段能够被定位的存储；`&engine_temperature` 产生的是在 C++ 类型系统中指向该对象的值。**

```text
engine_temperature
    int 对象，当前值为 78
              │
              │ &engine_temperature
              ▼
    指向 engine_temperature 的 int* 值
```

**指针值不是写在源码中的对象名称。名称 `engine_temperature` 由编译器解析，而指针值可以在程序运行期间保存、复制和改变，使代码能够在不直接写出目标名称的位置继续找到同一个对象。**

## 指针对象、指针值与目标对象

**`temperature_pointer` 是一个指针对象（pointer object）。与 `int` 对象保存整数值类似，它具有自己的类型、存储、生命周期和当前值；只是它当前保存的是指针值（pointer value）。**

**当一个指针值指向某个对象时，该对象常称为被指向对象（pointee）。下面三个概念必须分别理解：**

- `engine_temperature` 是类型为 `int` 的被指向对象；
- `temperature_pointer` 是类型为 `int*` 的指针对象；
- `temperature_pointer` 当前保存的指针值指向 `engine_temperature`。

指针对象本身同样需要存储，因此它也拥有自己的地址。假设两个对象在某次运行中分别位于下面的位置：

```text
地址 0x1000                                  地址 0x2000
┌────────────────────────┐                  ┌────────────────────────┐
│ engine_temperature     │                  │ temperature_pointer    │
│ 类型：int              │◀─────────────────│ 类型：int*             │
│ 当前值：78             │    指针值指向     │ 当前值：指向左侧对象   │
└────────────────────────┘                  └────────────────────────┘
```

`0x1000` 与 `0x2000` 只是帮助观察关系的假设地址。重点是：**指针对象自己的存储位置，与它保存的指针值所标识的位置不是同一件事。`temperature_pointer` 位于右侧，却可以保存指向左侧对象的值。**

## 指针类型包含目标类型

用 `T` 表示某种对象类型，可以从 `T` 构造“指向 `T` 的指针”这一复合类型（compound type），通常写作 `T*`：

```cpp
int sample_count{12};
int* count_pointer{&sample_count};

double room_pressure{101.3};
double* pressure_pointer{&room_pressure};
```

`count_pointer` 的类型是 `int*`，`pressure_pointer` 的类型是 `double*`。`int*` 与 `double*` 是不同的指针类型；**目标类型不是对地址附加的注释，而是指针类型自身的一部分。**

```cpp
double room_pressure{101.3};
int* wrong_pointer{&room_pressure}; // 错误：double* 不能直接初始化 int*
```

目标类型决定程序通过指针间接访问时准备指定哪种对象，并让编译器能够检查明显不相容的指向关系。**它仍不能单独证明某次间接访问一定成立；本篇示例中的指针值都直接取自类型匹配且仍然存在的对象。**

## 声明中的星号

下面的声明可以按完整结构理解：

```cpp
int* temperature_pointer{&engine_temperature};
```

| 代码部分 | 语法作用 | 含义 |
| --- | --- | --- |
| `int` | 类型说明 | 被指向对象的类型是 `int` |
| `*temperature_pointer` | 指针声明符 | 声明名称 `temperature_pointer` 为指针对象 |
| `{&engine_temperature}` | 初始化式 | 用指向 `engine_temperature` 的值初始化指针对象 |

**在声明语法中，`*` 属于指针声明符（pointer declarator）。它参与说明被声明名称的类型，不会对某个指针值执行运算，也不会访问被指向对象。**

空格不决定星号的语法含义，下面三种写法声明的是相同类型：

```cpp
int* first_pointer{&engine_temperature};
int *second_pointer{&engine_temperature};
int * third_pointer{&engine_temperature};
```

本文统一采用第一种形式，把 `int*` 作为“指向 `int` 的指针”整体阅读。不过，C++ 的声明符仍然分别作用于每一个名称，这会形成一个常见陷阱：

```cpp
int first_value{10};
int second_value{20};

int* first_pointer{&first_value}, second_copy{second_value};
```

这一行中，`first_pointer` 是 `int*` 指针对象，`second_copy` 却是普通 `int` 对象。**星号只属于 `first_pointer` 的声明符。每行只声明一个对象，可以直接消除这种歧义：**

```cpp
int* first_pointer{&first_value};
int* second_pointer{&second_value};
```

## 表达式中的星号

**当一元 `*` 出现在表达式中并作用于指针值时，它是间接运算符（indirection operator），工程交流中也常称为解引用运算符（dereference operator）：**

```cpp
int engine_temperature{78};
int* temperature_pointer{&engine_temperature};

int temperature_snapshot{*temperature_pointer};
```

求值 `temperature_pointer` 会取得它当前保存的指针值；`*temperature_pointer` 再通过这个值指定它所指向的 `int` 对象，也就是原来的 `engine_temperature`。

这里最重要的不是把 `*` 背成“读取指针所指向的值”。**`*temperature_pointer` 首先指定一个已经存在的对象，是否读取这个对象的当前值取决于整个表达式怎样使用它：**

```cpp
int temperature_snapshot{*temperature_pointer}; // 读取目标对象的 78
*temperature_pointer = 81;                       // 修改目标对象
```

第一行需要一个 `int` 值来初始化 `temperature_snapshot`，因此读取被指定对象当时保存的 `78`。第二行把同一个表达式放在赋值左侧，它负责指定要修改的对象，最终改变的是 `engine_temperature`：

| 对象 | 类型 | 最终状态 |
| --- | --- | --- |
| `engine_temperature` | `int` | 保存 `81` |
| `temperature_pointer` | `int*` | 仍然指向 `engine_temperature` |
| `temperature_snapshot` | `int` | 保存此前读取的副本 `78` |

**间接访问没有创建第二个 `engine_temperature`。直接写对象名称和通过指针使用 `*`，只是指定同一个对象的两条不同路径。**

## 同一个星号的不同语法角色

**`*` 的意义由完整语法结构决定，不能脱离位置单独判断：**

| 完整形式 | 所在语境 | `*` 的作用 |
| --- | --- | --- |
| `int* pointer_name` | 声明 | 指针声明符，参与声明指针对象 |
| `*pointer_name` | 一元表达式 | 间接运算，通过指针值指定目标对象 |
| `left * right` | 二元表达式 | 乘法运算，计算两个操作数的乘积 |

因此，**不能把声明 `int* pointer_name` 解释成“先有 `pointer_name`，再对它解引用”。声明正在引入这个名称，此处的星号属于声明语法；只有表达式中的一元 `*pointer_name` 才执行间接访问。**

## 取地址与间接访问的关系

取地址与间接访问可以形成一条完整路径：

```text
engine_temperature 对象
          │
          │ &engine_temperature
          ▼
指向该对象的 int* 值
          │
          │ 保存到 temperature_pointer
          ▼
temperature_pointer 指针对象
          │
          │ *temperature_pointer
          ▼
再次指定 engine_temperature 对象
```

**在当前示例的前提下，`*(&engine_temperature)` 指定的仍然是 `engine_temperature`：**

```cpp
*(&engine_temperature) = 82;
```

`&engine_temperature` 先产生指向该对象的指针值，一元 `*` 再沿这个值指定原对象，赋值最终把 `engine_temperature` 改为 `82`。这不是把整数地址编码后再机械解码，而是 C++ 对取地址和间接访问规定的对象关系。

## 复制指针值

指针值可以用于初始化另一个同类型指针对象：

```cpp
int retry_limit{4};

int* selected_limit{&retry_limit};
int* copied_selection{selected_limit};
```

现在存在两个彼此独立的指针对象，但它们保存的值都指向同一个 `retry_limit`：

```text
selected_limit ───────┐
                      ├──▶ retry_limit
copied_selection ─────┘
```

**复制的是指针值，也就是当前的指向关系；没有复制被指向的 `int` 对象。通过任意一个指针修改目标，另一条路径再次读取时都能观察到同一个对象的新值：**

```cpp
*copied_selection = 6;

int observed_value{*selected_limit}; // observed_value == 6
```

## 重新指向

可修改的指针对象可以接收另一个相同类型的指针值：

```cpp
int morning_limit{4};
int evening_limit{7};

int* selected_limit{&morning_limit};
int* copied_selection{selected_limit};

selected_limit = &evening_limit;
```

**赋值只替换 `selected_limit` 当前保存的指针值，不会移动或复制任何 `int` 对象，也不会自动修改 `copied_selection`：**

| 时刻 | `selected_limit` 指向 | `copied_selection` 指向 |
| --- | --- | --- |
| 完成复制后 | `morning_limit` | `morning_limit` |
| 重新赋值后 | `evening_limit` | `morning_limit` |

这与普通对象的初始化和赋值模型一致：**初始化创建新的指针对象，赋值改变已有指针对象保存的值。指针的特殊之处在于，它的值表达的是与另一个对象之间的指向关系。**

## 指针不是普通整数

调试器经常把指针值显示成类似 `0x000001F4A1201000` 的十六进制文本，**但指针类型与整数类型是不同的类型类别。指针值的表示（value representation）由实现定义，C++ 不要求所有平台使用相同的位宽或编码方式。**

因此，不能仅凭 `int*` 推断：

- 指针对象一定占用 8 bytes；
- 指针内部只是保存一个普通无符号整数；
- 不同目标类型的指针具有相同表示；
- 地址的打印结果包含判断间接访问是否成立所需的全部信息。

当指针值指向对象时，它表示该对象的地址，但 C++ 同时通过指针类型和对象规则约束如何使用这个值。**把指针简单记成“装地址的整数变量”，会丢失最重要的类型与对象语义。**

## 裸指针这一称呼

使用 `T*` 形式声明的内建指针（built-in pointer），在工程交流中常称为裸指针（raw pointer）。**`raw` 不是 C++ 关键字，也不会形成另一种类型；`int*` 的语言类型仍然是“指向 `int` 的指针”。**

**“裸指针”只是在需要与其他封装形式区分时使用的工程称呼，不能代替对具体目标类型、指针值和被指向对象的分析。**

## 核心结论

- 指针对象是具有自身存储、生命周期和当前值的对象；它与被指向对象彼此独立。
- `&object` 中的 `&` 是取地址运算符，产生具有目标类型信息的指针值，不读取对象当前保存的值。
- `T* pointer_name` 中的 `*` 属于指针声明符；`*pointer_name` 中的一元 `*` 才执行间接访问。
- 间接访问首先指定被指向对象；表达式所在语境再决定读取对象的值还是修改对象。
- 复制指针值只复制指向关系，重新给指针赋值只改变该指针对象当前指向的目标。
- 指针不是普通整数；它的机器表示由实现定义，源码应依赖语言规定的类型与对象关系。

相关标准条款：[复合类型 basic.compound](https://timsong-cpp.github.io/cppwp/n4950/basic.compound)、[指针声明符 dcl.ptr](https://timsong-cpp.github.io/cppwp/n4950/dcl.ptr)、[一元运算符 expr.unary.op](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.op)。
