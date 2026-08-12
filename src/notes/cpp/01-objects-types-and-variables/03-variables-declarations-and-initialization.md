---
title: 变量、声明与初始化（Variables, Declarations, and Initialization）
date: 2026-08-11
---

# 变量、声明与初始化（Variables, Declarations, and Initialization）

## 变量（Variable）

程序运行时实际存在并保存数据的是对象，而源代码需要通过名称来指代它。先从最常见的情况开始：一条声明引入一个具有名称的对象。这个对象称为变量（variable），代码中用来指代它的名称称为变量名（variable name）。

### 变量名与标识符（Variable Names and Identifiers）

在 C++ 源代码中，变量名由标识符（identifier）表示。为了先建立一套简单、通用的写法，可以使用英文字母、数字和下划线组成标识符，但第一个字符不能是数字：

```text
front_left_pressure  合法
pressure2            合法
rear_tire_pressure   合法

2ndPressure          不合法：以数字开头
front-left-pressure  不合法：包含连字符
```

标识符不能使用 C++ 关键字（keyword），例如 `double`、`int`、`class` 和 `return` 都已经具有语言规定的含义，不能再作为变量名。

C++ 区分大小写，因此 `pressure`、`Pressure` 和 `PRESSURE` 是三个不同的标识符。现代 C++ 也允许符合规则的 Unicode 字符出现在标识符中，但当前笔记统一使用英文标识符。

C++ 还为编译器和标准库保留了部分以下划线开头或包含双下划线的标识符。为了避开这些与使用位置有关的规则，自定义变量名不以下划线开头，也不包含双下划线。

语法合法只表示编译器能够接受这个名称，并不代表它足够清晰。如何让变量名准确表达数据含义，属于后面的编码习惯。

> 随着后续内容引入更多需要命名的程序元素，笔记会在相应位置继续补充适合它们的命名习惯；这里先只讨论变量名。

## 声明（Declaration）

声明（declaration）是 C++ 用来向程序引入名称并说明其含义的语法结构。对于当前讨论的变量，声明的基本结构可以写成：

```text
data_type variable_name;
```

其中的单词只是表示各部分作用的占位名称，并不是能够直接编译的 C++ 代码。例如：

```cpp
double front_left_pressure;
```

整个 `double front_left_pressure;` 是一条变量声明。它说明 `front_left_pressure` 是变量名，其数据类型是 `double`。

最后的 `;` 是分号（semicolon），用于明确标记这条声明的结束。C++ 通常将换行视为普通空白，因此不能依靠换行结束声明，分号是这条声明不可缺少的语法组成部分。

这条声明没有显式提供初始化器。实际编写代码时，通常应当让变量在创建时就具有明确的初始值。

## 初始化（Initialization）

为了让变量从创建开始就具有明确的状态，可以在变量声明中加入初始化器（initializer）：

```text
data_type variable_name{initial_value};
```

例如：

```cpp
double front_left_pressure{2.0};
```

整个 `double front_left_pressure{2.0};` 仍然是一条变量声明，但这条声明包含初始化器 `{2.0}`。其中，`2.0` 是提供给变量的初始值。

变量创建时，根据初始化器建立其初始状态的过程称为初始化（initialization）。初始化完成后，`front_left_pressure` 保存的值就是 `2.0`。

这里使用花括号，并将初始化器直接写在变量名之后，因此这种形式称为直接列表初始化（direct-list-initialization）。初始化是变量创建过程的一部分，并不是变量创建之后再执行的另一项操作。

### 没有显式初始化器时

考虑下面的代码：

```cpp
double front_left_pressure;
double recorded_pressure{front_left_pressure};
```

对于这里讨论的普通局部变量，第一行虽然创建了 `front_left_pressure`，却没有为它提供明确的初始值；它不会因此自动保存 `0.0`。第二行试图读取这个尚无确定值的对象，因而不能被安全使用。

运行时可能偶然观察到某个不可预测的数值，但将它称为“随机初始值”并不准确。程序并没有按照随机规则生成一个合法值；真正的问题是，它读取了一个尚未建立确定值的对象。

## 基本编码习惯

### 声明变量时立即初始化

在能够确定初始状态时，应当把初始化器直接写在声明中：

```cpp
double front_left_pressure{2.0};
```

这样，变量从创建开始就具有明确的值，读者也能在同一处看到它的数据类型、名称和初始状态。立即初始化从源头消除了变量已经存在、却还不能被安全读取的状态。

### 让名称表达数据的含义

变量名不仅要符合标识符的语法规则，还应当让读者知道变量保存的是什么。`value`、`data` 或 `x` 虽然都是合法名称，却无法说明其中保存的是轮胎气压、剩余数量还是其他数据；相比之下，`front_left_pressure` 能够直接表达这份数据描述的是左前轮气压。

### 保持一致的命名风格

变量名常常需要由多个单词共同表达含义，但标识符中不能包含空格。C++ 并没有规定唯一的命名风格，常见写法主要有：

| 风格 | 示例 | 组合方式 |
|---|---|---|
| 小驼峰命名法（lower camel case） | `frontLeftPressure` | 第一个单词小写，后续单词首字母大写 |
| 蛇形命名法（snake case） | `front_left_pressure` | 所有单词小写，并使用下划线分隔 |
| 大驼峰命名法（Pascal case） | `FrontLeftPressure` | 每个单词的首字母都大写 |

这些写法在语法上都合法，而且至今都在成熟的 C++ 生态中使用。Google 与 Chromium 的普通变量采用 `snake_case`，Qt 采用 `lowerCamelCase`，LLVM 则采用 `PascalCase`。这些选择分别属于各项目完整命名体系的一部分，不能脱离项目语境将其中一种称为唯一的现代写法。

当前笔记的自有变量统一采用蛇形命名法，与 C++ 标准库的命名传统保持一致。[C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#nl10-prefer-underscore_style-names) 在没有其他约束时，也将 `underscore_style` 作为默认建议；进入已有项目时，则应优先遵循项目已经建立的命名规范。随着后续内容引入类型、函数和其他程序元素，笔记会再分别说明它们的命名规则。

### 每条声明只引入一个变量

C++ 允许在一条声明中引入多个同类型变量：

```cpp
double front_left_pressure{2.0}, rear_left_pressure{2.1};
```

但更清晰的写法是让每条声明只引入一个变量：

```cpp
double front_left_pressure{2.0};
double rear_left_pressure{2.1};
```

这样，每个变量的数据类型、名称和初始化器都独占一行，阅读、修改和代码审查会更加直接。随着后续章节引入更复杂的数据类型与声明形式，这项习惯也能避免多个声明符挤在同一行所产生的理解困难。
