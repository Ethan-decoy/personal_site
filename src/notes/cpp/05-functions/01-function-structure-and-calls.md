---
title: 函数的结构与调用（Function Structure and Calls）
date: 2026-08-14
---

# 函数的结构与调用（Function Structure and Calls）

## 将行为组织成函数

此前的代码已经能够创建对象、求值表达式，并通过条件与循环改变执行过程。实际程序还需要将一组共同完成某项工作的语句，组织成可以明确调用的执行单元。**C++ 使用函数（function）表达这样的单元。**

**普通命名函数为一段行为提供名称，并明确这段行为需要哪些信息、能够产生什么结果。**使用函数的代码只需通过名称发起调用，不必在每个使用位置重新写出相同的实现。

## 函数的基本结构

普通命名函数的定义可以概括为：

```text
return_type function_name(parameter_list) {
    statement_sequence
}
```

### 返回类型

`return_type` 表示返回类型（return type）：函数正常完成一次调用时，能够向调用位置提供哪种类型的结果。例如，返回类型写作 `int`，表示函数产生一个 `int` 类型的结果。

**返回类型是函数对调用者公开的信息。调用者可以据此使用结果，而不必先了解函数体怎样完成计算。**

### 函数名

`function_name` 表示函数名（function name），用于指代并调用这个函数。函数名同样由标识符表示，需要遵守标识符规则，并优先采用能够表达行为的 `snake_case` 名称，例如 `add`、`calculate_pressure` 或 `is_pressure_valid`。

**函数名应当说明函数完成什么工作，而不是复述实现细节。随着程序逐渐扩大，一个准确的名称能够让调用代码直接呈现意图。**

### 参数列表

`parameter_list` 是参数列表（parameter list），位于函数名之后的一对圆括号中。它可以包含零个或多个参数声明，多个参数之间使用逗号分隔。**参数描述函数完成工作时需要由调用者提供的信息。**

圆括号中没有任何参数声明时，表示函数不接收实参：

```text
function_name()
```

### 函数体

花括号及其内部内容构成函数体（function body）。这里的一对花括号构成一条[复合语句](../03-blocks-scope-and-lifetime/01-compound-statements-block-scope-and-local-object-lifetime.md)，`statement_sequence` 表示其中由零条或多条完整语句组成的语句序列。

函数体规定这项工作具体怎样完成。**右花括号 `}` 已经结束函数定义，因此普通函数定义之后不需要再写分号。**

## 一个完整的函数定义

下面的函数接收两个 `int`，并产生二者相加后的结果：

```cpp
int add(int left, int right) {
    return left + right;
}
```

将它与通用结构对应起来：

| 代码 | 在函数定义中的作用 |
|---|---|
| `int` | 返回类型 |
| `add` | 函数名 |
| `int left, int right` | 参数列表 |
| `{ return left + right; }` | 函数体 |

`return left + right;` 表示这次调用将产生两个参数相加后的结果。

函数体描述调用这个函数时需要执行的语句。**函数定义出现在源文件中，只是在定义一段行为，并不意味着其中的语句会按照书写位置立即执行。只有发生函数调用（function call）时，程序才会进入相应的函数体；函数执行结束后，再回到调用发生的位置继续执行。**

## 调用函数

调用普通命名函数时，写出函数名以及紧随其后的一对圆括号：

```text
function_name(argument_list)
```

圆括号中的 `argument_list` 是实参列表（argument list），用于提供这次调用所需的信息。调用前面定义的 `add` 可以写作：

```cpp
add(2, 3)
```

整个 `add(2, 3)` 是一个函数调用表达式（function call expression）。**当程序执行到这个表达式时，控制流进入 `add` 的函数体；函数正常完成后，控制流回到调用发生的位置，并由调用表达式产生 `int` 结果 `5`。**

函数调用表达式可以继续作为其他语法结构的一部分。例如，在另一个函数体中，可以用它的结果初始化对象：

```cpp
int total{add(2, 3)};
```

这里的分号结束整条变量声明。函数调用表达式本身是 `add(2, 3)`，不包含这个分号。如果将调用单独写成一条表达式语句，则同样需要由分号结束：

```cpp
add(2, 3);
```

**函数定义与函数调用由此承担不同职责：定义描述一项行为，调用才要求程序执行这项行为。**

相关语言规则可参阅 C++23 工作草案中的[函数声明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)、[函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)与[函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)。
