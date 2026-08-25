---
title: 整数类型（Integer Types）
date: 2026-08-25
---

# 整数类型（Integer Types）

## 有限存储中的整数

数学中的整数可以向正负方向无限延伸，计算机对象能够使用的存储空间却是有限的。一个整数类型只有有限数量的 bit patterns，因此只能表示有限范围内的整数。

```cpp
int wheel_count{4};
```

`int` 是 C++ 最常用的整数类型。在当前主流的 Windows x64 与 Linux x86-64 实现中，一个 `int` 通常占用 4 bytes，也就是 32 bits，可以形成 $2^{32}$ 种不同的 bit patterns。相应的有符号范围通常是 $[-2^{31},\,2^{31}-1]$，也就是 `−2,147,483,648～2,147,483,647`。

**整数类型能够表示的范围由它采用的位宽与有无符号共同决定；相同的类型名称并不保证在所有 C++ 实现中占用完全相同的 byte 数。**

## 标准整数类型

C++ 规定了标准整数类型之间的最低表示能力和相对大小，同时允许目标平台的数据模型决定具体大小。下表描述采用 8-bit byte 的两种主流 64 位实现，不是所有平台的统一规定；`long` 的差异来自目标平台约定，不能只凭编译器名称判断。

| C++ 类型 | Windows x64 常见实现 | Linux x86-64 常见实现 | 对应实现中的表示范围 |
| --- | ---: | ---: | ---: |
| `short` | 2 bytes | 2 bytes | `−32,768～32,767` |
| `unsigned short` | 2 bytes | 2 bytes | `0～65,535` |
| `int` | 4 bytes | 4 bytes | `−2,147,483,648～2,147,483,647` |
| `unsigned int` | 4 bytes | 4 bytes | `0～4,294,967,295` |
| `long` | 4 bytes | 8 bytes | Windows： $[-2^{31},\,2^{31}-1]$；Linux： $[-2^{63},\,2^{63}-1]$ |
| `unsigned long` | 4 bytes | 8 bytes | Windows： $[0,\,2^{32}-1]$；Linux： $[0,\,2^{64}-1]$ |
| `long long` | 8 bytes | 8 bytes | $[-2^{63},\,2^{63}-1]$ |
| `unsigned long long` | 8 bytes | 8 bytes | $[0,\,2^{64}-1]$ |

标准至少保证 `short` 具有 16 bits 的表示能力，`int` 不小于 `short`，`long` 至少具有 32 bits 的表示能力，`long long` 至少具有 64 bits 的表示能力。需要固定宽度或与外部二进制格式交互时，不能仅凭 `int`、`long` 的名称猜测具体大小。

## 有符号与无符号整数（Signed and Unsigned Integers）

标准整数类型分为有符号整数类型（signed integer type）与无符号整数类型（unsigned integer type）。`int` 与 `signed int` 是同一种类型，可以表示负数、零和正数；`unsigned int` 只表示零和正数。单独写出的 `signed` 和 `unsigned` 分别是 `signed int` 与 `unsigned int` 的简写。

**每一对相应的标准有符号与无符号整数类型具有相同的对象表示大小和对齐要求，区别在于这些 bit patterns 对应怎样的值和算术规则。**在常见的 32-bit 实现中，`int` 的范围是 `−2,147,483,648～2,147,483,647`，`unsigned int` 的范围则是 `0～4,294,967,295`。

无符号算术以该类型可表示值的数量为模。数学结果越过范围边界时，会重新映射到可表示范围内；这是一项确定的语言规则。相对地，有符号整数运算的数学结果超出结果类型范围时会产生未定义行为，C++ 不保证它回绕到另一端。

普通计数、差值和算术通常优先使用有符号整数。无符号类型适合明确需要模运算、bit patterns 或外部接口规定无符号表示的场景。**无符号类型扩大了非负范围，却不能表达“业务上绝不允许负数”这一约束。**

相关语言规则可参阅 C++23 工作草案中的[基本类型](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)。
