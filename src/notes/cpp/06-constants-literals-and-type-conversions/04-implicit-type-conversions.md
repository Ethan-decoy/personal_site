---
title: 隐式类型转换（Implicit Type Conversions）
date: 2026-08-14
---

# 隐式类型转换（Implicit Type Conversions）

程序中的一个值有时需要以另一种类型参与后续过程。例如，将 `int` 值存入 `double` 对象、把 `double` 实参交给 `int` 形参，或者直接把一个整数用作条件，都要求程序在原类型与目标类型之间建立联系。

**当源代码没有明确写出转换运算，而是由当前语境和语言规则自动完成转换时，这个过程称为隐式类型转换（implicit type conversion）。**

## 转换的是值，而不是源对象

**隐式转换以一个已有值为起点，产生目标类型的值。提供原值的对象不会因此改变类型，也不会被替换成另一个对象：**

```cpp
int item_count{3};
double measured_count{0.0};
measured_count = item_count;
```

赋值时，`item_count` 提供 `int` 值 `3`。这个值隐式转换为 `double` 值 `3.0`，随后存入已有的 `double` 对象 `measured_count`。执行结束后，`item_count` 仍然是保存整数 `3` 的 `int` 对象。

**转换也不会在两个对象之间建立联系。以后修改 `item_count`，不会自动修改已经创建的 `measured_count`。**

## 隐式转换出现的语境

**只要某个语境要求一种确定的类型，而当前表达式产生的是另一种类型，就可能需要隐式转换。对于目前接触过的语言结构，常见位置包括：**

| 语境 | 转换目标由什么决定 |
|---|---|
| 初始化 | 被创建对象的数据类型 |
| 赋值 | 左操作数所指对象的数据类型 |
| 按值传参 | 对应形参的数据类型 |
| 返回 | 函数声明的返回类型 |
| 算术与比较 | 相应运算符为操作数确定的共同类型 |
| 条件 | `bool` |

下面几处都把 `double` 值转换为 `int`：

```cpp
int preserve_integer(int value) {
    return value;
}

int whole_part(double value) {
    return value;
}

double measurement{21.8};

int initialized = measurement;                 // 初始化

int assigned{0};
assigned = measurement;                        // 赋值

int passed{preserve_integer(measurement)};      // 建立形参
int returned{whole_part(measurement)};          // 建立返回结果
```

**`int initialized = measurement;` 是一条包含初始化器的声明，其中的 `=` 表示复制初始化（copy-initialization），不是在对象创建后执行赋值。**其余位置虽然使用了不同语法，但都需要根据既定的目标类型转换表达式的值。

**语言只会执行相应语境允许的转换。能够找到合法的隐式转换时，程序可以继续建立目标值；没有允许的转换时，程序不合法。**列表初始化还会额外拒绝其中被语言归类为窄化的转换，参见[窄化与显式类型转换](05-narrowing-and-explicit-type-conversions.md)。

## 数值提升（Numeric Promotions）

**数值提升（numeric promotion）是一组不会丢失原值的标准转换。它们把转换等级较低的基本数值类型提升为语言运算中更常使用的类型。**

### 整数提升（Integral Promotions）

整数提升的适用类型与目标类型决策已经在[通常算术转换](../02-expressions-and-operators/03-usual-arithmetic-conversions.md#整数提升integral-promotions)中建立。放在完整转换体系中看，关键区别是：语言把这些保留原值、面向更常用整数类型的转换归类为提升；运算符可以要求操作数先提升，再继续决定共同类型或执行运算。

### 浮点提升（Floating-Point Promotion）

标准浮点类型中的 `float` 可以提升为 `double`。`double` 的可表示值集合包含 `float` 的可表示值集合，因此这种转换保留原值：

```cpp
float measured_pressure{2.4F};
double precise_pressure{measured_pressure};
```

**“提升”不是所有较小类型在任何表达式中都会自动变大的统称。是否需要提升，仍然由所在语境或运算符规则决定；例如两个 `float` 操作数相加时，结果仍然采用 `float`，不会仅仅因为存在浮点提升规则就自动改用 `double`。**

## 数值转换（Numeric Conversions）

提升之外，**基本数值类型之间还存在更一般的数值转换。这些转换可以改变可表示范围或精度，因此不保证完整保留原值。**

### 整数类型之间

一个整数值转换到另一种整数类型时，如果目标类型能够表示原值，转换结果与原值相等。否则，C++23 以目标类型宽度对应的 $2^N$ 为模，得到与原值同余且能够由目标类型表示的唯一结果。

**这是整数类型转换结果的定义，不是有符号整数算术溢出的规则；有符号整数运算的数学结果超出结果类型的表示范围时，行为仍然未定义，参见[有符号整数溢出](../02-expressions-and-operators/02-arithmetic-operations-and-result-types.md#有符号整数溢出与无符号算术)。**

`bool` 采用标准布尔转换。第一章已经建立算术零值与非零值转换为 `bool` 的结果；反向转换时，`false` 产生整数 `0`，`true` 产生整数 `1`。

整数符号属性不同所造成的结果，已经在[通常算术转换](../02-expressions-and-operators/03-usual-arithmetic-conversions.md#有符号与无符号整数共同运算)中结合表达式说明。

### 整数类型与浮点类型之间

**整数转换为浮点类型时，目标类型会尽可能产生数值相等的结果。原值位于目标类型的可表示范围内、却不能被精确表示时，实现会选择相邻的较低值或较高值，具体选择由实现定义（implementation-defined）。由实现定义表示具体选择由实现决定，但实现必须记录并说明自己的选择。原值超出目标浮点类型的可表示范围时，行为未定义。**

**浮点数转换为整数时，小数部分会被丢弃，结果向零截断。截断后的值不能由目标整数类型表示时，行为未定义。**

### 浮点类型之间

浮点值转换为另一种浮点类型时，能够精确表示的值保持不变。原值处在目标类型两个相邻可表示值之间时，实现会从二者中选择一个，具体选择由实现定义；原值不属于这两种情况时，行为未定义。

**从 `float` 到 `double` 的转换属于前面所述的浮点提升；从 `double` 到 `float` 则是浮点转换，可能损失精度或超出目标类型的范围。**

## 通常算术转换中的隐式转换

算术或比较运算的两个操作数类型不同时，相应运算符会通过通常算术转换（usual arithmetic conversions）确定共同类型，再把两个操作数的值转换到这个共同类型。**转换只影响本次运算使用的值，不会修改原对象或改变其类型。完整决策过程参见[通常算术转换](../02-expressions-and-operators/03-usual-arithmetic-conversions.md)。**

## 条件语境中的布尔转换

**`if`、`while`、`for` 和 `do-while` 的条件会把相应表达式按布尔语境求值；需要时，这个语境产生一个供条件使用的 `bool` 值，不会修改原对象或改变其类型。**条件表达式参见[条件语句](../04-control-flow/01-conditional-statements.md#条件表达式)，逻辑运算符 `!`、`&&` 和 `||` 参见[比较与逻辑运算](../02-expressions-and-operators/05-comparison-and-logical-operations.md#逻辑运算符logical-operators)。

## 允许转换不等于保留信息

**隐式转换描述的是语言能够在没有显式转换语法的情况下建立目标值，不是编译器对数值范围和业务含义作出的安全证明。提升能够保留原值，一般数值转换却可能丢失精度、改变数值，甚至在超出目标范围时产生未定义行为。**

编译器可以针对可疑的隐式转换发出警告，但语言允许的程序并不要求编译器一定警告。**目标类型与源类型不同时，仍应确认转换后的范围和精度符合数据含义。**

相关语言规则可参阅 C++23 工作草案中的[整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom)、[浮点提升](https://timsong-cpp.github.io/cppwp/n4950/conv.fpprom)、[整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)、[浮点转换](https://timsong-cpp.github.io/cppwp/n4950/conv.double)、[浮点数与整数之间的转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)与[布尔转换](https://timsong-cpp.github.io/cppwp/n4950/conv.bool)。
