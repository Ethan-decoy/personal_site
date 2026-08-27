---
title: 显式类型转换（Explicit Type Conversions）
date: 2026-08-27
order: 6
---

# 显式类型转换（Explicit Type Conversions）

## 把转换意图写进表达式

如果程序确实需要把一个值转换成另一种类型，可以显式写出目标类型：

```cpp
double measured_temperature_c{21.8};
int whole_temperature_c{static_cast<int>(measured_temperature_c)};
```

`static_cast<目标类型>(表达式)` 是 C++ 核心语言提供的显式转换写法，不属于 `std`，也不需要包含头文件。上面的 `static_cast<int>(measured_temperature_c)` 先产生一个 `int` 类型的结果，再用它初始化 `whole_temperature_c`。

外层花括号接收到的已经是 `int` 值，因此这里没有在列表初始化边界发生 `double` 到 `int` 的窄化。真正的数值转换发生在 `static_cast` 表达式内部。

**`static_cast` 表示程序员明确要求进行这次转换；它不表示转换已经被证明安全。**

## 数值规则没有改变

`static_cast` 只把转换请求显式写出来，不会为同一种算术转换创造新的数值规则。浮点数转换为整数仍然向零截断：

```cpp
int positive{static_cast<int>(7.9)};   // 7
int negative{static_cast<int>(-7.9)};  // -7
```

它不会四舍五入，也不会自动改成最接近的整数。

如果截断后的值无法由目标整数类型表示，转换会产生未定义行为。无穷、NaN 以及远超目标整数范围的有限浮点值同样不能安全地转换为该整数类型。

```cpp
double enormous_value{1.0e100};
int result{static_cast<int>(enormous_value)};  // 执行到这里会产生未定义行为
```

写出 `static_cast` 不会执行范围检查、饱和到类型边界或提供失败结果。范围是否满足要求，仍然是转换前必须建立的条件。

## 转换位置决定运算类型

显式转换发生在表达式的哪个位置，会直接影响先进行哪一种运算：

```cpp
int distance_m{9};
int segment_count{4};

double converted_after_division_m{static_cast<double>(distance_m / segment_count)};

double converted_before_division_m{static_cast<double>(distance_m) / segment_count};
```

第一个初始化式先计算两个 `int` 操作数的除法，得到 `int` 值 2，然后再把 2 转换为 `double`，最终结果是 2.0。

第二个初始化式先把 `distance_m` 的值转换为 `double`。除法随后按照通常算术转换使用浮点类型计算，得到 2.25。

**信息一旦在整数除法中被丢弃，之后再转换为 `double` 也无法恢复。**

## 显式不等于合理

显式转换使代码审阅者能够看见转换意图，但合理性仍取决于程序语义。进行算术类型转换前，至少需要确认：

- 目标类型是否符合数据接下来的职责；
- 精度或小数部分的丢失是否符合业务含义；
- 原值是否处于目标类型具有定义行为的范围内；
- 转换是否位于会丢失信息的运算之前。

如果源类型与目标类型本来就一致，不需要为了显得明确而添加 `static_cast`。如果转换本身暴露了数据模型不匹配，也不应使用显式转换掩盖设计问题。

在当前算术类型范围内，`static_cast` 提供的是**可见的转换意图**，不是额外的安全保证。

## 参考资料

- [C++23 工作草案：static_cast](https://timsong-cpp.github.io/cppwp/n4950/expr.static.cast)
- [C++23 工作草案：浮点数与整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)
- [C++23 工作草案：乘法与除法运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.mul)
