---
title: 字符串对象与字符序列（String Objects and Character Sequences）
date: 2026-09-15
order: 1
---

# 字符串对象与字符序列（String Objects and Character Sequences）

`"front"` 可以提供一个固定的传感器位置名称。要保存程序生成的名称、修改其中的内容，或者让一份名称独立于来源继续存在，就需要一个管理文本的对象。`std::string` 提供的正是这种拥有关系：对象保存自己的字符序列，并负责这段序列所需的存储。

## 字面量包含什么

普通字符串字面量（ordinary string literal）`"front"` 的类型是 `const char[6]`：五个可见字符之后，还有一个值为零的 `char`。这个字符称为空字符（null character），可以写成 `'\0'`；它与表示数字的字符 `'0'` 不同，也与表示空指针的 `nullptr` 不同。

| 下标 | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| 元素 | `'f'` | `'r'` | `'o'` | `'n'` | `'t'` | `'\0'` |

有些文本接口把从起点读到的第一个空字符当作终点。对 `"front"`，这个空字符紧跟在五个字母之后。空字符串字面量 `""` 只含一个空字符，因此它的类型是 `const char[1]`。

字符串字面量对象具有静态存储期（static storage duration），其存储持续整个程序运行期；这些字符不可修改。这个性质属于字面量对象，用它构造出的其他对象仍遵循各自的生命周期。

## 用字符串对象拥有文本

头文件 `<string>` 提供 `std::string` 类型。它管理一段连续的 `char` 序列，允许内容和长度发生变化；对象销毁时，也会释放自己管理的动态存储（如果使用了动态存储）。使用者不必手动安排字符数组和释放操作。

在 `std::string label{"front"}` 中，字面量数组[转换为指向首元素的指针](../20-fixed-size-sequences-and-contiguous-ranges/deep-dives/01-built-in-arrays-and-pointer-conversion.md#转换产生首元素指针数组仍然存在)，类型为 `const char*`。接收这个指针的构造函数以第一个 `'\0'` 为终点，把它之前的五个字符复制到 `label` 中。`std::string empty{}` 则构造一个长度为零的字符串。

`size()` 返回内容中的 `char` 数量，返回类型是无符号整数类型 `std::string::size_type`。`empty()` 判断内容长度是否为零。下标落在内容范围内时，`label[index]` 给出相应字符的引用。对于可修改的字符串，可以通过这个引用原位改写字符。`std::cout << label` 按 `label` 的长度输出内容。

下面的程序用 `label` 复制构造 `saved`，并让 `first` 绑定到 `label` 的首字符。程序把首字符改成大写后，再输出原字符串、副本和通过引用读到的字符。

```cpp
#include <iostream>
#include <string>

int main() {
    std::string label{"front"};
    const std::string saved{label};
    const char& first{label[0]};

    label[0] = 'F';

    std::cout << label << ' ' << label.size() << '\n';
    std::cout << saved << ' ' << saved.size() << '\n';
    std::cout << first << '\n';

    const std::string empty{};
    std::cout << empty.size() << ' ' << empty.empty() << '\n';
}
```

程序输出如下。

```text
Front 5
front 5
F
0 1
```

`label` 和 `saved` 各自保存五个字符。赋值改写了 `label` 中的首字符，`saved` 保留原来的内容。`first` 仍引用被改写的字符，所以第三行输出 `F`。最后一行的 `0` 是空字符串的长度，`1` 是 `empty.empty()` 返回的 `true` 的默认输出形式。

> [!IMPORTANT] 字符串副本与字符引用
> 复制字符串得到一份独立拥有的字符序列，原字符串修改或销毁后，副本仍可使用。字符引用借用原字符串里的字符，在引用有效期间读到的是该字符的当前值。

保存下标 `0` 只记下一个编号。`label[0]` 和 `saved[0]` 各自访问所选字符串的首字符。用保存的下标访问内容时，要根据所选字符串当前的长度核对范围。

## 长度统计的是 char 元素

`"front"` 中每个字母各用一个 `char`，所以这里的内容长度恰好等于可见字母数。这个对应关系不能直接推广到所有文本。

[字符与文本编码](../01-objects-types-and-variables/06-characters-and-text-encoding.md#unicode-与-utf-8)区分了编码单元与人所看到的字符。在 8 位字节、普通字符串字面量采用 UTF-8 的环境中，字面量 `"中"` 含三个编码单元和一个结尾空字符。`const std::string text{"中"}` 复制前面三个 `char`，所以 `text.size()` 为 `3`。

下标访问也采用同样的单位。对 UTF-8 文本随意替换或切断某个 `char`，可能破坏一个字符的完整编码；`std::string` 不会替调用者验证这一点。

## 内容边界与结尾空字符

> [!IMPORTANT] 字符串内容与结尾标记
> 内容下标从 `0` 开始，严格小于 `size()`。`size()` 只统计内容中的 `char`，内容中的空字符也照常计数。`std::string` 在紧接内容的下标 `size()` 处另外保存一个 `'\0'` 作为结尾标记。

在 C++23 中，`operator[]` 也允许读取下标恰好等于 `size()` 的位置。下面的程序读取两个字符串各自的结尾标记。

```cpp
#include <iostream>
#include <string>

int main() {
    const std::string label{"front"};
    const std::string empty{};

    std::cout << (label[label.size()] == '\0') << '\n';
    std::cout << (empty[0] == '\0') << '\n';
}
```

程序输出两行 `1`。`label` 的结尾标记在下标 `5`。空字符串的长度是 `0`，所以 `empty[0]` 也读到了结尾标记。

> [!WARNING]
> 在 C++23 中，用 `operator[]` 访问大于 `size()` 的下标，或者把结尾标记改成非零值，都会引发未定义行为。需要增加内容时，应使用能改变字符串长度的操作。

要复制一段含空字符的内容，可以用[显式长度指定复制范围](deep-dives/01-null-terminated-text-and-pointer-interfaces.md#显式长度保留内容中的空字符)。

## 参考

- [C++23 草案 N4950：字符串字面量](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
- [C++23 草案 N4950：字符串要求与构造](https://timsong-cpp.github.io/cppwp/n4950/basic.string)
- [C++23 草案 N4950：字符串长度](https://timsong-cpp.github.io/cppwp/n4950/string.capacity)
- [C++23 草案 N4950：字符访问](https://timsong-cpp.github.io/cppwp/n4950/string.access)
- [C++23 草案 N4950：字符串输入输出](https://timsong-cpp.github.io/cppwp/n4950/string.io)
