---
title: 变量、声明与初始化（Variables, Declarations, and Initialization）
date: 2026-08-25
---

# 变量、声明与初始化（Variables, Declarations, and Initialization）

## 变量（Variable）

声明对象时可以为它引入一个名称，后续代码便能通过这个名称继续访问同一个对象。

用 `circle_x` 保存圆 A 的横向位置。除完整程序外，代码片段均放在 `main` 函数体内；注明接续时沿用前面的声明，其余示例各自独立：

```cpp
double circle_x{20.0};
```

这里定义的 `double` 对象是一个变量（variable），`circle_x` 是它的变量名（variable name）。

> [!IMPORTANT] 变量、变量名与对象
> **对于这样的具名对象，变量是对象，变量名是用于指代它的名称。**通过名称可以访问同一个对象；对象当前保存的值与名称是不同概念。

## 变量名与标识符（Variable Names and Identifiers）

在 C++ 源代码中，变量名由标识符（identifier）表示。用英文字母、数字和下划线组成标识符时，第一个字符不能是数字：

```text
circle_x        合法
circle2_x       合法
other_circle_x  合法

2nd_circle_x    不合法：以数字开头
circle-x        不合法：包含连字符
```

标识符不能使用 C++ 关键字（keyword），例如 `double`、`int`、`class` 和 `return` 已经具有语言规定的含义。`circle_x`、`Circle_x` 和 `CIRCLE_X` 则是三个不同的标识符。

> [!IMPORTANT] 标识符的基本规则
> **使用英文字母、数字和下划线组成标识符时，首字符不能是数字，关键字不能用作标识符；C++ 区分大小写。**拼写或大小写不同的名称，需要分别辨认。

C++ 允许符合相应规则的 Unicode 字符出现在标识符中，但本笔记统一使用英文标识符。语言还为实现、编译器和标准库保留了部分以下划线开头或包含双下划线的名称；自定义名称不以下划线开头，也不包含双下划线，可以避开这些容易误用的保留规则。

## 声明（Declaration）

变量声明（declaration）引入变量名，并说明变量的类型。例如：

```cpp
double circle_x{20.0};
```

这条声明使程序能够通过 `circle_x` 使用一个 `double` 对象。它同时是定义（definition）：不仅引入名称与类型，还负责建立相应对象。

最后的 `;` 是分号（semicolon），用于结束这条声明；换行不能代替分号。

声明也可以只提供名称与类型，把对象的定义留给其他位置。下面这份独立完整程序把位置对象定义在 `main` 外，`main` 可以通过它的名称访问它：

```cpp
extern double circle_x; // 只声明，不在这一行定义对象
double circle_x{20.0};  // 定义同一个对象，并给出初值

int main() {
    circle_x = 35.0;
    return 0;
}
```

第一行带有 `extern` 且没有初始化器，只声明 `circle_x` 的名称与类型，不在这一行定义对象。第二行提供这个对象的定义；两行对应同一个变量，`main` 中的赋值修改的就是这个对象。需要读取或修改这个对象时，程序中必须有相应定义，单纯的声明不能代替定义。

> [!IMPORTANT] 声明与定义的关系
> **这里的变量声明提供名称与类型信息，相应定义还负责建立数值对象。**每个定义都是声明，但并非每个声明都是定义。

## 初始化（Initialization）

在 `double circle_x{20.0};` 中，`{20.0}` 是初始化器（initializer），给出初始值 `20.0`。对象创建过程中建立初始状态的过程称为初始化（initialization）。

这里使用的带初值声明可以写成：

```text
data_type variable_name{initial_value};
```

其中 `data_type`、`variable_name` 与 `initial_value` 分别对应类型、变量名和提供初值的内容。初始化完成后，`circle_x` 已经保存了横向位置 `20.0`。

把花括号初始化器直接写在变量名之后，称为直接列表初始化（direct-list-initialization）。这是 C++ 的一种初始化形式。

声明、定义与初始化描述的是不同作用。同一条 `double circle_x{20.0};` 既引入名称与类型，又定义对象，还用初始化器为它建立初值。

## 初始化与赋值（Initialization and Assignment）

初始化器可以读取另一个对象当前保存的值。这里保留一份起始横向位置，再创建另一个对象记录当前位置：

```cpp
double starting_x{20.0};
double current_x{starting_x};
```

执行第二行时，`starting_x` 提供当时保存的 `double` 值 `20.0`，这个值用于初始化新对象 `current_x`。两条声明结束后，程序中存在两个彼此独立的对象；它们最初具有相同的值，却不是同一个对象。

在这两条声明之后继续执行：

```cpp
current_x = 35.0;
```

这次操作是赋值（assignment）：它改变已经存在的 `current_x`，不会创建新对象，也不会改变对象的类型。最终，`starting_x` 仍然保存 `20.0`，`current_x` 保存 `35.0`。

> [!IMPORTANT] 初始化与赋值的区别
> **初始化在对象创建时建立初始状态；赋值修改已经存在的对象。**在这里的 `double` 对象初始化中，新对象取得源对象当时的值，随后彼此独立，不会因读取了另一个对象的值就建立自动同步关系。

## 为对象提供明确的初始状态

省略初始化器也可以定义变量。下面的程序在 `main` 函数内定义一个没有显式初始化器的普通局部 `double` 对象，再尝试读取它：

```cpp
int main() {
    double circle_x;
    double observed_x{circle_x}; // 未定义行为：读取不确定值
    return 0;
}
```

> [!WARNING]
> 这里的 `double circle_x;` 确实定义了对象，但没有为它设置数值，对象保留不确定值（indeterminate value）。在有效赋值替换这个不确定值之前读取它，会在 C++23 中产生未定义行为（undefined behavior）：语言不再规定程序必须怎样表现。对象已经存在，不代表它已经具有可读取的确定值。

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

- [C++23 工作草案：变量与名称](https://timsong-cpp.github.io/cppwp/n4950/basic.pre)
- [C++23 工作草案：标识符](https://timsong-cpp.github.io/cppwp/n4950/lex.name)
- [C++23 工作草案：声明与定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：不确定值](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)
- [C++ Core Guidelines：NL.10 优先使用 underscore_style 名称](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#nl10-prefer-underscore_style-names)
