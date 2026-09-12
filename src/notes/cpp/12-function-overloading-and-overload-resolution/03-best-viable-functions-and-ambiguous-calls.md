---
title: 最佳可行函数与重载歧义（Best Viable Functions and Ambiguous Calls）
date: 2026-08-29
order: 3
---

# 最佳可行函数与重载歧义（Best Viable Functions and Ambiguous Calls）

一次调用经过候选函数查找和可行性筛选后，仍可能留下多个可行函数。C++ 会为每个实参建立初始化对应形参所需的隐式转换序列（implicit conversion sequence），并比较这些序列，从中寻找最佳可行函数（best viable function）。本篇示例只涉及标准转换，因此相应序列都属于标准转换序列（standard conversion sequence）。

最佳可行函数不是源码中声明得更早、目标类型占用更多存储，或者开发者主观上认为“更接近”的函数。**只有某个可行函数按照语言规则明确优于所有其他可行函数时，重载决议才会选择它。**若不存在唯一最佳函数，调用就具有歧义，程序不合法。

## 标准转换序列的匹配等级

在当前已经建立的算术类型和标准转换范围内，匹配质量首先分为三个等级：

| 匹配等级 | 当前范围内的典型情形 |
| --- | --- |
| 精确匹配（Exact Match） | `int` 实参匹配 `int` 形参 |
| 提升（Promotion） | `short` 提升为 `int`，`float` 提升为 `double` |
| 转换（Conversion） | `int` 转换为 `long`，`int` 转换为 `double` |

它们的优先关系是：

```text
Exact Match
    优于
Promotion
    优于
Conversion
```

例如：

```cpp
int pressure_code(int pressure_kpa);
int pressure_code(long pressure_kpa);
int pressure_code(double pressure_kpa);

int exact_value{220};
short promoted_value{220};
float floating_value{220.5F};

const int first{pressure_code(exact_value)};
const int second{pressure_code(promoted_value)};
const int third{pressure_code(floating_value)};
```

`exact_value` 已经是 `int`，因此第一条调用对 `pressure_code(int)` 是精确匹配。

`promoted_value` 从 `short` 到 `int` 属于整数提升；转换为 `long` 或 `double` 只能得到 Conversion 等级，因此第二条调用仍然选择 `pressure_code(int)`。

`floating_value` 从 `float` 到 `double` 属于浮点提升；转换为整数类型只能得到 Conversion 等级，因此第三条调用选择 `pressure_code(double)`。

**比较的是标准规定的转换序列等级，不是转换结果是否符合业务需要。**Exact Match 也不必表示机器层面完全没有任何处理；附章[标准转换序列与重载排序](deep-dives/01-standard-conversion-sequences-and-overload-ranking.md)进一步拆解这些等级的组成。

## 相同等级不保证存在更好选择

两个转换处于相同等级时，C++ 不会根据目标类型的大小、精度或业务含义自行猜测：

```cpp
int select_pressure(long pressure_kpa);
int select_pressure(double pressure_kpa);

const int selected{select_pressure(220)}; // 错误：调用存在歧义
```

整数字面量 `220` 具有 `int` 类型。从 `int` 到 `long` 和从 `int` 到 `double` 都属于 Conversion 等级；当前两条转换序列之间没有规则能够确定唯一更好的候选。

编译器不会因为 `long` 仍是整数类型就选择第一个函数，也不会因为 `double` 能表示小数就选择第二个函数。重载决议只使用语言已经规定的匹配关系，不推测参数的业务用途。

## 多个实参必须整体比较

函数具有多个形参时，每个实参都会产生一条对应的转换序列。对于本篇使用的普通函数，并且只涉及标准转换时，函数 A 要优于函数 B，需要满足：

- A 对每个实参的匹配都不比 B 差；
- A 至少对一个实参的匹配明确优于 B。

例如：

```cpp
int combine_readings(int pressure_kpa, double temperature_c);
int combine_readings(double pressure_kpa, int temperature_c);

const int combined{combine_readings(220, 36.0)};
```

第一个候选对两个实参都是精确匹配；第二个候选需要分别执行 `int` 到 `double` 和 `double` 到 `int` 的转换，因此第一项函数是唯一最佳候选。

若两个实参都是 `int`，结果则不同：

```cpp
const int combined{combine_readings(220, 36)}; // 错误：调用存在歧义
```

| 候选函数 | 第一个实参 | 第二个实参 |
| --- | --- | --- |
| `combine_readings(int, double)` | Exact Match | Conversion |
| `combine_readings(double, int)` | Conversion | Exact Match |

第一项函数只在第一个实参上更好，第二项函数只在第二个实参上更好。重载决议不会给各项转换分配分数再求和，也不会采用“更好的参数更多就获胜”的规则，因此两者都不能成为唯一最佳函数。

## 返回结果的去向不参与选择

普通函数调用先根据函数名称、实参和候选函数的形参类型完成重载决议。调用结果随后怎样使用，不会反过来帮助选择函数：

```cpp
int estimate_pressure(int pressure_kpa);
double estimate_pressure(double pressure_kpa);

double stored_result{};
stored_result = estimate_pressure(220);
```

实参 `220` 是 `int`，因此 `estimate_pressure(int)` 获得精确匹配并被选中。它先产生一个 `int` 结果，这个结果随后才在赋值过程中转换为 `double`。

`stored_result` 的类型不会使调用提前选择返回 `double` 的重载。**重载决议先确定调用目标；返回结果的使用属于外围表达式的后续语义。**

## 选择依据是表达式的静态类型

重载决议观察的是实参表达式的静态类型（static type）和值类别，不会根据对象在运行时恰好保存的数值改变选择：

```cpp
int classify_pressure(int pressure_kpa);
int classify_pressure(double pressure_kpa);

double measurement{220.0};
const int first{classify_pressure(measurement)};

measurement = 220.75;
const int second{classify_pressure(measurement)};
```

虽然 `measurement` 第一次调用时保存的数值没有小数部分，它仍然是 `double` 对象。两次名称表达式都以 `double` 类型参与调用，因此两次都选择 `classify_pressure(double)`。

**普通函数重载在编译期间根据表达式的类型、值类别和转换关系完成选择；运行期间不会重新检查数值，再改为调用另一个重载。**

## 参考资料

- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：隐式转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++23 工作草案：标准转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.scs)
