---
title: 浮点类型（Floating-Point Types）
date: 2026-08-25
---

# 浮点类型（Floating-Point Types）

整数类型适合表示轮胎数量，却不能直接表示 `2.4` 这样的气压。C++ 提供 `float`、`double` 和 `long double` 三种标准浮点类型（floating-point type），用于表示带有小数部分或跨越较大数量级的数值。

```cpp
double front_left_pressure{2.4};
```

## 范围与精度

浮点类型只拥有有限数量的 bit patterns，因此只能表示有限个离散数值。**表示范围（range）描述类型能够覆盖的数量级；表示精度（precision）描述能够保留多少位有效数字（significant digits），并不表示小数点后固定拥有多少位。**

C++23 没有为三种浮点类型规定统一的 byte 数和 IEEE 754 格式。下表描述当前主流 Windows x64 与 Linux x86-64 实现中的常见情况：

| C++ 类型 | Windows x64 常见实现 | Linux x86-64 常见实现 | 常见最大有限值数量级 | 有效数折算的十进制精度（约） |
| --- | ---: | ---: | ---: | ---: |
| `float` | 4 bytes | 4 bytes | 约 $3.40\times10^{38}$ | 约 6～7 位 |
| `double` | 8 bytes | 8 bytes | 约 $1.80\times10^{308}$ | 约 15～16 位 |
| `long double` | 8 bytes | 16 bytes | Windows 与 `double` 相同；Linux 约 $1.19\times10^{4932}$ | Windows 约 15～16 位；Linux 约 18 位 |

这些数值描述常见实现，不是仅凭类型名称就能推导出的跨平台保证。表中的十进制位数用于说明二进制有效数大致能够承载多少十进制有效数字，不是固定的小数位数或统一的往返转换保证。特别是 `long double`，大小与实际精度必须结合具体编译器、目标平台和实现配置判断。

## 可表示值与舍入

主流实现通常采用二进制浮点表示。部分十进制小数无法写成有限长度的二进制小数，因此 `0.1` 等数值通常只能保存为附近的可表示值；浮点运算的结果也可能再次发生舍入（rounding）。

**浮点数不是“能够精确保存任意实数的小数类型”，而是在有限存储中覆盖较大数量级的一组离散值。**这不是处理器偶然算错，而是有限 bit patterns 无法与无限多个实数一一对应的结果。

一个浮点对象保存的是相应类型能够表示的值，而不是源代码中十进制写法所表达的无限精确数学实数。判断浮点计算是否满足需求，需要同时考虑数值范围、有效精度和运算过程中发生的舍入。

## 有限值以外的类别

采用 IEEE 754 的常见实现还能够表示正零与负零、正无穷与负无穷，以及 NaN（Not a Number，非数）。这些是同一种浮点类型中的不同数值类别，不是额外的数据类型；具体支持仍取决于 C++ 实现采用的浮点格式。

## 类型选择

一般浮点计算通常优先使用 `double`，它在主流实现中比 `float` 提供更高精度。只有存储空间、内存带宽、硬件接口或既有数据格式提出明确约束时，才需要优先考虑 `float`；选择 `long double` 时，则不能假设它一定比 `double` 提供更多有效精度。

二进制小数怎样形成、IEEE 754 怎样组织符号位、指数域与小数域，以及普通值和特殊值怎样由 bit patterns 分类，参见附章：[二进制浮点数的表示（Binary Floating-Point Representation）](deep-dives/01-binary-floating-point-representation.md)。

## 参考资料

- [C++23 工作草案：浮点类型](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
