---
title: 变量、声明与初始化（Variables, Declarations, and Initialization）
date: 2026-08-25
---

# 变量、声明与初始化（Variables, Declarations, and Initialization）

## 变量（Variable）

程序经常需要在后续代码中继续找到同一个对象。最直接的方式，是在声明对象时为它引入一个名称。

下面沿用圆 A 的横向位置。除完整程序外，本篇代码片段均放在 `main` 函数体内，需要连续执行的部分由正文说明：

```cpp
double circle_x{20.0};
```

本章只讨论最常见的一类变量（variable）：**由声明引入，并能够通过名称直接指代的对象。**这里的对象是变量，`circle_x` 是变量名（variable name）；名称用于找到对象，本身不是对象保存的值。

## 变量名与标识符（Variable Names and Identifiers）

在 C++ 源代码中，变量名由标识符（identifier）表示。由英文字母、数字和下划线组成的标识符能够满足本章需求，但第一个字符不能是数字：

```text
circle_x        合法
circle2_x       合法
other_circle_x  合法

2nd_circle_x    不合法：以数字开头
circle-x        不合法：包含连字符
```

标识符不能使用 C++ 关键字（keyword），例如 `double`、`int`、`class` 和 `return` 已经具有语言规定的含义。C++ 区分大小写，因此 `circle_x`、`Circle_x` 和 `CIRCLE_X` 是三个不同的标识符。

C++ 允许符合相应规则的 Unicode 字符出现在标识符中，但本笔记统一使用英文标识符。语言还为实现、编译器和标准库保留了部分以下划线开头或包含双下划线的名称；自定义名称不以下划线开头，也不包含双下划线，可以避开这些容易误用的保留规则。

## 声明（Declaration）

**本章使用的变量声明（declaration）向程序引入变量名，并说明这个变量具有怎样的类型。**它的基本结构可以写成：

```text
data_type variable_name;
```

例如：

```cpp
double circle_x;
```

整个 `double circle_x;` 是一条声明：`double` 指定对象的数据类型，`circle_x` 是声明引入的名称。这条声明同时是定义（definition）：它不仅引入名称，还实际定义了相应对象。**声明是更广的概念；每个定义都是声明，但并非每个声明都是定义。**

最后的 `;` 是分号（semicolon），用于明确标记这条声明的结束。C++ 通常将换行视为普通空白，不能依靠换行结束声明。

## 初始化（Initialization）

变量声明可以带有初始化器（initializer）：

```text
data_type variable_name{initial_value};
```

例如：

```cpp
double circle_x{20.0};
```

**对象创建过程中，根据声明形式与初始化器建立初始状态的过程称为初始化（initialization）。**这里的 `{20.0}` 是初始化器，初始值是 `20.0`。初始化完成后，`circle_x` 已经处于可以记录圆 A 中心横向位置的明确状态。

把花括号初始化器直接写在变量名之后，称为直接列表初始化（direct-list-initialization）。C++ 还具有其他初始化形式；本章统一采用这种写法，不在第一次创建变量时横向展开全部语法分类。

**初始化属于对象开始存在的过程，不是对象创建完成后再执行的一次赋值。**

## 初始化与赋值（Initialization and Assignment）

初始化器可以读取另一个对象当前保存的值。这里保留一份起始横向位置，再创建另一个对象记录当前位置：

```cpp
double starting_x{20.0};
double current_x{starting_x};
```

执行第二行时，`starting_x` 提供当时保存的 `double` 值 `20.0`，这个值用于初始化新对象 `current_x`。两条声明结束后，程序中存在两个彼此独立的对象；它们最初具有相同的值，却不是同一个对象。

```cpp
current_x = 35.0;
```

这次操作是赋值（assignment）：它改变已经存在的 `current_x`，不会创建新对象，也不会改变对象的类型。最终，`starting_x` 仍然保存 `20.0`，`current_x` 保存 `35.0`。

**在这里的 `double` 对象初始化中，新对象取得源对象当时的值，随后彼此独立；赋值只改变已经存在的对象。**这种数值初始化不会在两个对象之间建立自动同步关系。

## 为对象提供明确的初始状态

下面的程序在 `main` 函数内定义一个没有显式初始化器的普通局部 `double` 对象：

```cpp
int main() {
    double circle_x;
    double observed_x{circle_x}; // 未定义行为：读取不确定值
    return 0;
}
```

> [!WARNING]
> 这里的声明不会为 `circle_x` 设置数值，对象保留不确定值（indeterminate value）。在有效赋值替换这个不确定值之前读取它，会在 C++23 中产生未定义行为（undefined behavior）：语言不再规定程序必须怎样表现。对象已经存在，不代表它已经具有可读取的确定值。

在同样的函数体语境中，先赋值再读取则可以成立：

```cpp
double circle_x;
circle_x = 20.0;
double observed_x{circle_x}; // 正确：读取已经写入的 20.0
```

这里的赋值直接写入 `20.0`，不需要先读取目标对象原先的值；最后一行才读取已经确定的数值。但当初值已经能够确定时，直接初始化更清楚：

```cpp
double circle_x{20.0};
```

这样，对象从生命周期开始就具有明确状态，不需要额外追踪“是否已经赋过值”。上述读取边界也适用于函数内以相同方式定义的普通局部 `int` 对象；不能据此推断所有省略初始化器的声明具有相同后果，具体初始状态仍取决于对象类型和声明位置。

## 基本编码习惯

### 让名称表达数据的含义

变量名的清楚程度取决于语境。小范围示例中，`value`、`source`、`target` 等短名可以直接说明当前角色；需要区分两个圆各自的横向位置时，可以用 `circle_x` 与 `other_circle_x` 说明各自的角色。名称应补足当前语境缺少的信息，不必重复已经明确的类型或业务背景。

### 保持一致的命名风格

当前笔记的自有名称统一使用蛇形命名法（snake case，`snake_case`）：单词小写，并用下划线分隔，例如 `circle_x`。这与 C++ 标准库的命名传统及 C++ Core Guidelines 的 NL.10 建议一致。

命名风格属于项目约定，C++ 语言没有规定唯一形式；进入已有代码库时，应当遵循项目已经建立的规则。

### 每条声明只引入一个变量

C++ 允许在一条声明中引入多个变量：

```cpp
double circle_x{20.0}, other_circle_x{35.0};
```

更清晰的写法是让每条声明只引入一个变量：

```cpp
double circle_x{20.0};
double other_circle_x{35.0};
```

每个变量的数据类型、名称和初始化器因而具有独立位置，阅读、修改和代码审查都更加直接。

## 参考资料

- [C++23 工作草案：标识符](https://timsong-cpp.github.io/cppwp/n4950/lex.name)
- [C++23 工作草案：声明与定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：不确定值](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)
- [C++ Core Guidelines：NL.10 优先使用 underscore_style 名称](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#nl10-prefer-underscore_style-names)
