---
title: 字符与文本编码（Characters and Text Encoding）
date: 2026-08-25
---

# 字符与文本编码（Characters and Text Encoding）

## 从 bit patterns 到字符

内存只能保存由 `0` 和 `1` 构成的 bit patterns，那么字母 `A` 应当怎样存入内存？

假设只使用一个 bit，可以自行约定 `0` 代表 `A`，`1` 代表 `B`；如果还要表示 `C`，就需要增加 bit，从而获得更多 bit patterns。但这些组合本身不具有字符含义：一个程序可以规定 `00` 代表 `A`，另一个程序也可以把它解释成 `B`。

**为了让不同程序和设备正确交换文本，必须共同约定字符与数值之间的映射关系，这种规则称为字符编码（character encoding）。**

## ASCII

20 世纪 60 年代形成的 ASCII（American Standard Code for Information Interchange，美国信息交换标准代码）使用 7 bits 定义了 128 个编码值，范围是 0 到 127。它统一规定了控制字符（control character）、空格、数字字符、英文字母和常用标点各自对应的数值。

例如，数字字符 `0` 对应 48，大写字母 `A` 对应 65，小写字母 `a` 对应 97。当不同系统都遵循 ASCII 时，数值 65 就会被一致地解释为字符 `A`。

| ASCII 编码值 | 内容 |
| --- | --- |
| `0～31`、`127` | 控制字符 |
| `32` | 空格 |
| `33～47`、`58～64`、`91～96`、`123～126` | 常用标点与符号 |
| `48～57` | 数字字符 `0～9` |
| `65～90` | 大写字母 `A～Z` |
| `97～122` | 小写字母 `a～z` |

完整的 7-bit ASCII 编码表与 bit 排列方式可参阅 [RFC 20：ASCII format for Network Interchange](https://www.rfc-editor.org/rfc/rfc20.html)。

## char

`char` 是 `character` 的缩写，也是 C++ 的一种整型。一个 `char` 对象占用一个 C++ byte。**它本身不保存字符的形状，也不携带字符编码信息，只保存一个能够由 `char` 表示的值。**这个值是否被解释为编码单元，由文本编码和程序语境决定。

```cpp
char letter{'A'};
```

`'A'` 表示字符 `A`。普通字符字面量采用的编码由具体实现决定；在当前常见的 ASCII 兼容环境中，它对应的数值是 65。

`char`、`signed char` 和 `unsigned char` 是三种不同的类型。在常见的 8-bit byte 实现中，它们通常具有以下大小和范围：

| C++ 类型 | 常见大小 | 常见表示范围 |
| --- | ---: | ---: |
| `char` | 1 byte | `−128～127` 或 `0～255`，由实现决定 |
| `signed char` | 1 byte | `−128～127` |
| `unsigned char` | 1 byte | `0～255` |

普通 `char` 的数值范围采用有符号形式还是无符号形式，由实现决定；但 `char` 始终独立于 `signed char` 和 `unsigned char`。ASCII 编码值都位于 0 到 127，因此无论普通 `char` 采用哪种范围，都能够完整表示 ASCII。

## Unicode 与 UTF-8

ASCII 足以表示基础英文字母、数字和符号，却无法容纳中文以及世界上其他书写系统。单纯增加更多 bits 只能扩大编号数量；如果不同系统仍然采用各自的字符映射，交换文本时依然可能得到不同结果。

Unicode（统一码）建立统一的码点（code point）空间，并为收录的抽象字符分配码点。例如，字符 `A` 的码点是 `U+0041`，字符 `中` 的码点是 `U+4E2D`。**Unicode 解决“文本元素使用哪个编号”的问题，但不规定这个编号必须以固定数量的 bytes 存入内存。**

码点需要通过具体编码写入内存。UTF-8（8-bit Unicode Transformation Format，8 位 Unicode 转换格式）使用 1 到 4 个 8-bit 编码单元表示一个码点，并完整保留 ASCII：0 到 127 仍然使用原来的单个 byte，超出 ASCII 范围的码点则需要多个 bytes。例如，字符 `中` 在 UTF-8 中需要三个 bytes。

在常见的 8-bit byte 实现中，每个 UTF-8 编码单元都可以存入一个 `char` 对象。因此，**UTF-8 文本中的一个 `char` 通常只保存一个编码单元，不保证对应完整码点，更不保证对应用户看到的完整字符。**

## 其他字符类型

C++23 还提供 `wchar_t`、`char8_t`、`char16_t` 和 `char32_t` 等内建字符类型。`char8_t` 是专门表示 UTF-8 编码单元的独立类型，与 `char` 不是同一种类型；其余类型用于表达其他编码单元和接口约定。

**任何一种字符类型都不能被普遍理解为“一个对象恰好保存一个用户看到的字符”。**一个码点可能需要多个编码单元，一个用户感知字符也可能由多个码点共同构成；字符、码点、编码单元和实际 bytes 必须分别判断。

Unicode 的字符与码点模型可参阅 [The Unicode Standard](https://www.unicode.org/standard/standard.html)，UTF-8 的编码规则可参阅 [RFC 3629](https://www.rfc-editor.org/rfc/rfc3629.html)。
