---
title: 变量、声明与初始化（Variables, Declarations, and Initialization）
date: 2026-08-25
---

# 变量、声明与初始化（Variables, Declarations, and Initialization）

## 变量（Variable）

程序经常需要在后续代码中继续找到同一个对象。最直接的方式，是在声明对象时为它引入一个名称。

```cpp
double front_left_pressure{2.5};
```

本章只讨论最常见的一类变量（variable）：**由声明引入，并能够通过名称直接指代的对象。**这里的对象是变量，`front_left_pressure` 是变量名（variable name）；名称用于找到对象，本身不是对象保存的值。

## 变量名与标识符（Variable Names and Identifiers）

在 C++ 源代码中，变量名由标识符（identifier）表示。由英文字母、数字和下划线组成的标识符能够满足本章需求，但第一个字符不能是数字：

```text
front_left_pressure  合法
pressure2            合法
rear_tire_pressure   合法

2nd_pressure         不合法：以数字开头
front-left-pressure  不合法：包含连字符
```

标识符不能使用 C++ 关键字（keyword），例如 `double`、`int`、`class` 和 `return` 已经具有语言规定的含义。C++ 区分大小写，因此 `pressure`、`Pressure` 和 `PRESSURE` 是三个不同的标识符。

C++ 允许符合相应规则的 Unicode 字符出现在标识符中，但本笔记统一使用英文标识符。语言还为实现、编译器和标准库保留了部分以下划线开头或包含双下划线的名称；自定义名称不以下划线开头，也不包含双下划线，可以避开这些容易误用的保留规则。

## 声明（Declaration）

**本章使用的变量声明（declaration）向程序引入变量名，并说明这个变量具有怎样的类型。**它的基本结构可以写成：

```text
data_type variable_name;
```

例如：

```cpp
double front_left_pressure;
```

整个 `double front_left_pressure;` 是一条声明：`double` 指定对象的数据类型，`front_left_pressure` 是声明引入的名称。这条声明同时是定义（definition）：它不仅引入名称，还实际定义了相应对象。**声明是更广的概念；每个定义都是声明，但并非每个声明都是定义。**

最后的 `;` 是分号（semicolon），用于明确标记这条声明的结束。C++ 通常将换行视为普通空白，不能依靠换行结束声明。

## 初始化（Initialization）

变量声明可以带有初始化器（initializer）：

```text
data_type variable_name{initial_value};
```

例如：

```cpp
double front_left_pressure{2.5};
```

**对象创建过程中，根据声明形式与初始化器建立初始状态的过程称为初始化（initialization）。**这里的 `{2.5}` 是初始化器，初始值是 `2.5`。初始化完成后，`front_left_pressure` 已经处于可以表达左前轮气压的明确状态。

把花括号初始化器直接写在变量名之后，称为直接列表初始化（direct-list-initialization）。C++ 还具有其他初始化形式；本章统一采用这种写法，不在第一次创建变量时横向展开全部语法分类。

**初始化属于对象开始存在的过程，不是对象创建完成后再执行的一次赋值。**

## 初始化与赋值（Initialization and Assignment）

初始化器可以读取另一个对象当前保存的值：

```cpp
int starting_count{12};
int remaining_count{starting_count};
```

执行第二行时，`starting_count` 提供当时保存的 `int` 值 `12`，这个值用于初始化新对象 `remaining_count`。两条声明结束后，程序中存在两个彼此独立的对象；它们最初具有相同的值，却不是同一个对象。

```cpp
remaining_count = 9;
```

这次操作是赋值（assignment）：它改变已经存在的 `remaining_count`，不会创建新对象，也不会改变对象的类型。最终，`starting_count` 仍然保存 `12`，`remaining_count` 保存 `9`。

**在这里的 `int` 对象初始化中，新对象取得源对象当时的值，随后彼此独立；赋值只改变已经存在的对象。**这种数值初始化不会在两个对象之间建立自动同步关系。

## 为对象提供明确的初始状态

下面的声明没有显式初始化器：

```cpp
double front_left_pressure;
```

这段代码在语法上成立，却没有表达程序希望对象从什么值开始。**省略初始化器不能被普遍理解为“自动初始化为零”；具体初始状态取决于对象类型和声明所处的上下文。**在能够确定初始状态时，应当把初始化器直接写在声明中：

```cpp
double front_left_pressure{2.5};
```

这样，变量从生命周期开始就具有明确含义，也不会留下“对象已经存在，但当前是否可以读取”这一额外状态。

## 基本编码习惯

### 让名称表达数据的含义

变量名不仅要符合标识符的语法规则，还应当让读者知道变量保存的是什么。`value`、`data` 或 `x` 虽然都是合法名称，却无法说明其中保存的是轮胎气压、剩余数量还是其他数据；`front_left_pressure` 能够直接表达数据的业务含义。

### 保持一致的命名风格

多个单词组成的变量名通常采用以下形式：

| 风格 | 示例 | 组合方式 |
| --- | --- | --- |
| 小驼峰命名法（lower camel case） | `frontLeftPressure` | 第一个单词小写，后续单词首字母大写 |
| 蛇形命名法（snake case） | `front_left_pressure` | 所有单词小写，并使用下划线分隔 |
| 大驼峰命名法（Pascal case） | `FrontLeftPressure` | 每个单词的首字母大写 |

C++ 没有规定唯一的命名风格，成熟项目也采用不同约定。当前笔记的自有名称统一使用 `snake_case`，与 C++ 标准库的命名传统保持一致。[C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#nl10-prefer-underscore_style-names) 在没有既有项目规范时也建议优先使用 `underscore_style`；进入已有代码库时，应当遵循项目已经建立的规则。

### 每条声明只引入一个变量

C++ 允许在一条声明中引入多个变量：

```cpp
double front_left_pressure{2.5}, rear_left_pressure{2.75};
```

更清晰的写法是让每条声明只引入一个变量：

```cpp
double front_left_pressure{2.5};
double rear_left_pressure{2.75};
```

每个变量的数据类型、名称和初始化器因而具有独立位置，阅读、修改和代码审查都更加直接。
