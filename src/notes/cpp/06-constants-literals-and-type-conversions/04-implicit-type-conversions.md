---
title: 隐式类型转换（Implicit Type Conversions）
date: 2026-08-27
order: 4
---

# 隐式类型转换（Implicit Type Conversions）

## 语境要求另一种类型

表达式产生的值并不总是与使用位置要求的类型相同：

```cpp
double measured_temperature_c{-3.8};
int displayed_temperature_c{0};

displayed_temperature_c = measured_temperature_c;
```

赋值左侧是 `int` 对象，右侧表达式产生 `double` 值。语言允许在这里把右侧的值转换为 `int`，再写入 `displayed_temperature_c`。代码没有显式写出转换操作，因此这是一次**隐式类型转换（implicit type conversion）**。

当前这些内建类型之间由语言直接规定的隐式转换，属于标准转换（standard conversion）。

转换产生的是一个符合目标类型要求的值。它不会把 `measured_temperature_c` 对象变成 `int`，也不会修改其中保存的 `-3.8`。

**语境决定需要的目标类型，转换作用于这一次求值使用的值，源对象的类型保持不变。**

## 转换会出现在哪里

在当前已经认识的语言结构中，隐式转换主要出现在以下位置：

| 语境 | 当前标量类型中的目标 |
| --- | --- |
| 运算符的操作数 | 运算符规则要求的共同类型 |
| 对象初始化 | 被初始化对象的类型 |
| 赋值 | 左侧对象的类型 |
| 按值传递的函数调用 | 对应形参的类型 |
| `return` 语句 | 函数返回类型 |
| 条件与循环的条件 | 按条件语境转换为 `bool` |

按值传参时，实参表达式用于初始化形参对象；`return` 表达式则用于建立函数的返回结果。二者都可能发生转换，但都不应描述成“给形参或返回类型赋值”。

```cpp
double pressure_to_kpa(double pressure_pa) {
    return pressure_pa / 1'000.0;
}

long measured_pressure_pa{240'000L};
double measured_pressure_kpa{pressure_to_kpa(measured_pressure_pa)};
```

调用函数时，`measured_pressure_pa` 的 `long` 值被转换为 `double`，再初始化形参 `pressure_pa`。源对象仍然是保存 240000 的 `long` 对象。

运算符内部如何寻找共同类型，已经在[通常算术转换](../02-expressions-and-operators/03-usual-arithmetic-conversions.md)中建立；这里关注的是同一种“目标类型要求”怎样出现在初始化、赋值、函数边界和条件语境中。

## 当前数值类型的转换结果

隐式转换由语言规则完成，不代表它一定保持原值的全部信息：

| 转换方向 | 结果与边界 |
| --- | --- |
| 整数 → 整数 | 值能表示时保持不变；否则得到目标类型中与源值模 2 的 N 次方同余的唯一值，其中 N 是目标类型的宽度 |
| 浮点数 → 整数 | 丢弃小数部分，向零截断；截断后的值无法由目标类型表示时，行为未定义 |
| 整数 → 浮点数 | 能精确表示时保持原值；范围内但无法精确表示时，由实现选择相邻的较低或较高可表示值；超出目标范围时，行为未定义 |
| 浮点数 → 浮点数 | 能精确表示时保持原值；无法精确表示但仍在目标范围内时，由实现选择相邻可表示值；超出目标范围时，行为未定义 |
| 算术类型 → `bool` | 零转换为 `false`，其他值转换为 `true` |

第一段示例中的 `-3.8` 转换为 `int` 时会向零截断，因此 `displayed_temperature_c` 得到 `-3`，不是四舍五入后的 `-4`。

整数之间的越界转换与浮点数转整数的越界转换不能混为一谈。前者按照目标整数类型的模规则得到确定结果；后者在截断结果无法表示时会产生未定义行为。

## 能转换不等于应该转换

隐式转换回答的是“语言是否允许在此处产生目标类型的值”，并不回答以下问题：

- 丢失小数是否符合业务含义；
- 精度变化是否能够接受；
- 原值是否处于目标类型可表示的范围；
- 非零数值是否真的等价于业务上的“成立”。

例如，整数条件能够按照零与非零转换为 `bool`，但 `if (remaining_attempts > 0)` 通常比 `if (remaining_attempts)` 更准确地表达业务判断。

**语言允许的转换只是类型规则的一部分，不是正确性证明。**

## 参考资料

- [C++23 工作草案：标准转换](https://timsong-cpp.github.io/cppwp/n4950/conv.general)
- [C++23 工作草案：整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)
- [C++23 工作草案：浮点数与整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)
- [C++23 工作草案：浮点转换](https://timsong-cpp.github.io/cppwp/n4950/conv.double)
- [C++23 工作草案：布尔转换](https://timsong-cpp.github.io/cppwp/n4950/conv.bool)
