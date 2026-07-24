---
title: 对象、类型与值
date: 2026-07-23
---

# 对象、类型与值

## 对象、初始化与赋值

- **对象**：程序运行时具有类型和生命周期、用于保存状态的实体；某些初始化形式不会给普通局部标量建立可安全读取的确定值。
- **初始化**：创建对象时发生的过程；采用的初始化形式决定是否以及怎样建立初始值。
- **赋值**：改变已有对象的值；不会创建新对象，也不会改变其类型。

```cpp
int tickets{4};
int backup{tickets};
tickets = 9;
```

第二行读取 `tickets` 当时的值，创建独立对象 `backup`。最后 `tickets == 9`、`backup == 4`。复制得到的是当时值的快照，不是两个对象之间会自动同步的连接。

### 常见初始化写法

| 写法 | 初始化形式 | 普通局部 `int` 的结果 |
| --- | --- | --- |
| `int x;` | 默认初始化 | 值不确定，不能在赋值前读取 |
| `int x{5};` | 直接列表初始化 | `x == 5` |
| `int x = {5};` | 复制列表初始化 | `x == 5` |
| `int x(5);` | 直接初始化 | `x == 5` |
| `int x = 5;` | 复制初始化 | `x == 5` |

## 类型与窄化

`double` 可以表示小数，`int` 只能表示整数。把 `21.8` 转成 `int` 会丢失小数部分，得到 `21`，这种转换会缩小可表达的信息范围。

现代 C++ 通常优先使用花括号初始化：

```cpp
int count{3};
```

列表初始化会拒绝明显的窄化：

```cpp
int count{3.8}; // 编译错误
```

下面两种写法在语言层面允许转换，编译器可能给出警告：

```cpp
int count = 3.8; // count == 3
count = 6.9;     // count == 6
```

赋值不会改变对象的类型。右侧的值会先转换为 `int`，再写入始终为 `int` 的 `count`。最初用于初始化的花括号只约束那次初始化，不会自动保护以后写出的普通赋值 `count = 6.9`。

列表赋值本身仍会检查窄化：

```cpp
count = {6.9}; // 编译错误
```

### 语言规则与构建策略

```cpp
int a{temperature};
```

如果 `temperature` 是 `double`，语言规则要求编译器诊断这次窄化。

```cpp
int b = temperature;
```

这种转换被语言允许。编译器通常会警告；若项目把警告视为错误，构建也会失败，但那是项目策略，不是这条语句本身违反了语言规则。

“语言允许转换”不表示任意输入都安全。浮点数会先朝零截断；若截断后的值无法由 `int` 表示，隐式浮点数转整数同样会产生未定义行为。

### 显式表达转换意图

```cpp
double temperature{21.8};
int whole{static_cast<int>(temperature)};
```

`static_cast<int>` 先产生 `int` 值，因此外层花括号不再发生窄化。浮点数转整数会朝零截断，而不是四舍五入：

```cpp
static_cast<int>(7.9)   // 7
static_cast<int>(-7.9)  // -7
```

显式转换只表示程序员主动接受转换，并不自动保证安全。使用前仍要确认丢失小数符合含义，而且原值处于目标整数类型可表示的范围内。

若截断后的值无法由目标整数类型表示，浮点数转整数会产生未定义行为。写出 `static_cast` 不能消除这个风险。

## 表达式先计算，再转换结果

赋值目标的类型不会反过来决定右侧表达式怎样计算。表达式先根据操作数类型完成计算，结果之后才转换并赋给目标对象。

```cpp
int points{7};
int players{2};

double average{};
average = points / players;
```

两个操作数都是 `int`，所以先执行整数除法，得到 `3`；随后才转换为 `double`。最终 `average == 3.0`。

若希望执行浮点除法，必须在除法发生前转换至少一个操作数：

```cpp
double precise{
    static_cast<double>(points) / players
};
```

这次执行浮点除法，最终 `precise == 3.5`。

### 转换位置决定结果

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

- `after == 2.0`：先执行整数除法，再转换结果。
- `before == 2.25`：先转换操作数，再执行浮点除法。

整数除法已经丢失的小数部分，无法通过事后转换找回。

## 有符号与无符号整数

`int` 能表示负数，`unsigned int` 只表示非负值。无符号整数不是“更安全的正整数”；其算术按模运算进行，越过边界后会环绕。

设 `Umax` 是 `unsigned int` 的最大值：

```cpp
unsigned int count{0u};
count = count - 1u;
```

结果不是 `-1`，而是 `Umax`。这是定义明确的无符号环绕。

### 混合比较的转换陷阱

对应的 `int` 与 `unsigned int` 参与比较时，负的 `int` 可能先转换为 `unsigned int`：

```cpp
int position{-2};
unsigned int limit{3u};

bool before_limit{position < limit};
```

这里通常算术转换会把 `position` 转成对应的 `unsigned int`。`-2` 转换后的值是 `Umax - 1`，因此 `before_limit == false`。

如果业务允许负值，通常应让双方都使用能表达负数的类型：

```cpp
int position{-2};
int limit{3};

bool before_limit{position < limit}; // true
```

关键不是机械禁止 `unsigned`，而是让类型匹配数据的真实范围，并避免无意混合有符号与无符号算术。

## 当前 `static_cast` 的学习边界

目前只用 `static_cast` 表达基础数值转换，例如在除法前转成 `double`，或明确接受浮点数向整数截断。

类层次、指针和其他转换形式不在本页范围内。会写 `static_cast` 不表示所有显式转换都安全或合适。
