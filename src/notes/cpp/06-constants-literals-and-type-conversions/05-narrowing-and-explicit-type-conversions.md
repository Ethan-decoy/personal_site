---
title: 窄化与显式类型转换（Narrowing and Explicit Type Conversions）
date: 2026-08-14
---

# 窄化与显式类型转换（Narrowing and Explicit Type Conversions）

数值类型之间的隐式转换有时无法保留原值。C++ 的列表初始化会拒绝其中一组容易改变范围或精度的转换；程序确实需要主动执行这类转换时，则可以使用显式类型转换说明意图。

## 列表初始化中的窄化转换

窄化转换（narrowing conversion）是列表初始化规则定义的一组隐式转换。对于当前接触的基本数值类型，它们包括：

- 从浮点类型转换为整数类型；
- 对目前介绍的标准浮点类型，从浮点类型转换为转换等级更低的浮点类型，但常量表达式满足范围要求时除外；
- 从整数类型转换为浮点类型，但常量表达式能够精确往返转换时除外；
- 从整数类型转换为不能表示源类型全部值的另一种整数类型，但常量表达式的实际值能够由目标类型表示时除外。

列表初始化既包括直接列表初始化，也包括复制列表初始化：

```cpp
int direct{5};
int copied = {5};
```

两种形式都会检查窄化。初始化器中的值如果需要在最外层经过窄化转换才能建立目标对象，程序不合法：

```cpp
int first{3.8};       // 错误：浮点类型转换为整数类型
int second = {3.8};   // 错误：复制列表初始化同样拒绝窄化
```

即使浮点值在数学上恰好是整数，浮点类型到整数类型仍然属于窄化：

```cpp
int exact{3.0};  // 错误：double 到 int
```

列表初始化关注的不只是这一次运行得到的数值，还包括源类型和目标类型之间是否可能丢失信息。对于整数类型之间的转换，常量表达式的实际值能够由目标类型表示时，可以使用例外规则：

```cpp
char first_code{65};

int runtime_code{65};
char second_code{runtime_code};  // 错误：int 的全部取值不能由 char 表示
```

字面量 `65` 是常量表达式，并且能够由 `char` 表示，所以第一行不需要被判定为窄化。`runtime_code` 当前虽然也保存 `65`，但它不是常量表达式；语言不能根据某一时刻的运行时状态应用这项例外。

整数转换为浮点类型时，常量表达式还必须能够由目标类型精确表示，并在转换回原整数类型后得到原值。浮点类型转换到等级更低的浮点类型时，C++23 对常量表达式采用范围条件：只要转换后的值位于目标类型的可表示范围内，即使不能精确表示，也不属于列表初始化所拒绝的窄化转换。

```cpp
float approximation{0.1};  // C++23：允许，常量值在 float 的可表示范围内

double measurement{0.1};
float recorded{measurement};  // 错误：measurement 不是常量表达式
```

这里的“允许”只说明列表初始化规则不会拒绝第一行，并不表示 `float` 必然能够精确表示十进制小数 `0.1`。

## 列表初始化只检查直接需要的转换

花括号不会检查并撤销初始化表达式内部已经发生的信息损失。列表初始化看到的是完整表达式最终产生的类型：

```cpp
int distance{9};
int segments{4};

int quotient{distance / segments};
```

`distance / segments` 先按照两个 `int` 操作数执行整数除法，产生 `int` 值 `2`。外层以同类型的结果初始化 `quotient`，不需要窄化；整数除法已经丢弃的小数部分不会被列表初始化找回。

同样，实参在建立按值形参时完成的转换，以及返回表达式为建立函数返回值而完成的转换，都早于外层列表初始化；外层只检查函数调用表达式最终产生的类型。参见[实参与形参的类型](../05-functions/02-parameters-and-arguments.md#实参与形参的类型)与[返回表达式的类型转换](../05-functions/03-return-values-and-the-return-statement.md#返回表达式的类型转换)。

## 语言诊断与编译器警告

```cpp
double temperature{21.8};
int displayed{0};
```

| 写法 | 语境 | 语言规则 | 编译器警告 |
|---|---|---|---|
| `int direct{temperature};` | 直接列表初始化 | 程序不合法，必须诊断 | 不以可选警告代替诊断 |
| `int copied_list = {temperature};` | 复制列表初始化 | 程序不合法，必须诊断 | 不以可选警告代替诊断 |
| `int copied = temperature;` | 复制初始化 | 语言允许 | 可以选择警告 |
| `displayed = temperature;` | 赋值 | 语言允许 | 可以选择警告 |

复制初始化与复制列表初始化中的 `=` 都是初始化语法的一部分，不是赋值运算符。

项目可以启用额外警告并把警告视为错误；由此导致的构建失败属于项目策略，不能与语言规定的“不合法并且必须诊断”混为一谈。

## 使用 static_cast 明确转换意图

如果程序确实决定采用一种允许的数值转换，可以使用 `static_cast` 明确写出目标类型：

```text
static_cast<target_type>(expression)
```

`static_cast` 是 C++ 的命名转换运算符，不是函数。对于当前讨论的算术类型，它会对括号内的表达式求值，并产生转换到目标类型后的值：

```cpp
double temperature{21.8};
int whole{static_cast<int>(temperature)};
```

`static_cast<int>(temperature)` 明确产生 `int` 值 `21`。外层花括号随后以 `int` 值初始化 `int` 对象，不再需要隐式执行 `double` 到 `int` 的窄化转换，因此程序合法。

转换仍然只作用于表达式产生的值。`temperature` 没有被修改，也没有从 `double` 对象变成 `int` 对象。

## 浮点数转换为整数

浮点数转换为整数时会向零截断（truncation towards zero），不是向下取整，也不是四舍五入：

```cpp
int positive{static_cast<int>(7.9)};   // 7
int negative{static_cast<int>(-7.9)};  // -7
```

截断后的数学值必须能够由目标整数类型表示，否则行为未定义。在采用常见 32 位 `int` 的实现中，`1.0e100` 远远超出 `int` 的表示范围：

```cpp
double measurement{1.0e100};
int result{static_cast<int>(measurement)};  // 在这种实现中，行为未定义
```

`static_cast` 不会自动执行范围检查，也不会把超出范围的值限制在 `int` 的最大值或最小值。非有限浮点值同样无法产生目标整数类型可表示的截断结果。在执行这类转换之前，程序必须已经确认原值符合目标整数类型的范围以及相应业务约束。

## 转换发生的位置决定运算方式

显式转换产生的值可以继续作为其他表达式的操作数。转换写在运算之前还是之后，会直接改变本次运算采用的类型：

```cpp
int distance{9};
int segments{4};

double after{
    static_cast<double>(distance / segments)
};

double before{
    static_cast<double>(distance) / segments
};
```

`after` 的初始化器先执行整数除法，得到 `int` 值 `2`，随后才将结果转换为 `double` 值 `2.0`。已经被整数除法丢弃的小数部分无法由后续转换恢复。

`before` 的初始化器先把 `distance` 提供的值转换为 `double` 值 `9.0`。通常算术转换随后使 `segments` 的值也以 `double` 参与除法，最终得到 `2.25`。

## 显式意图不等于转换安全

`static_cast` 表示程序员主动要求一种语言允许的转换，使转换位置与目标类型在源代码中清晰可见。它不保证转换保留原值，不验证数值范围，也不证明转换符合业务含义。

使用显式数值转换之前仍需确认：

- 丢失小数或精度确实符合数据含义；
- 原值位于目标类型允许的范围内；
- 转换发生在正确的求值阶段；
- 目标类型不是为了掩盖更早的类型选择错误而临时使用。

如果程序从一开始就需要保存小数或更大的数值范围，选择能够表达该数据的数据类型通常比事后反复转换更准确。列表初始化适合在创建基本类型对象时阻止意外窄化；确实需要有损转换时，`static_cast` 则把这项决定留在明确的位置接受审阅。

相关语言规则可参阅 C++23 工作草案中的[列表初始化与窄化转换](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)、[`static_cast`](https://timsong-cpp.github.io/cppwp/n4950/expr.static.cast)以及[浮点数与整数之间的转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)。这项实践也与 [C++ Core Guidelines ES.46](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es46-avoid-lossy-narrowing-truncating-arithmetic-conversions) 和 [ES.49](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es49-if-you-must-use-a-cast-use-a-named-cast) 的建议一致。
