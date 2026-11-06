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

末尾的空字符提供了一个结束标记，使某些接口能够从起点逐个读取，直到遇到它。它没有给文本额外增加一个可见字母。空字面量 `""` 也有这个标记，因此它的类型是 `const char[1]`。

字符串字面量对象具有静态存储期（static storage duration），其存储持续整个程序运行期；这些字符不可修改。这个性质属于字面量对象，用它构造出的其他对象仍遵循各自的生命周期。

## 用字符串对象拥有文本

头文件 `<string>` 提供 `std::string` 类型。它管理一段连续的 `char` 序列，允许内容和长度发生变化；对象销毁时，也会释放自己管理的动态存储（如果使用了动态存储）。使用者不必手动安排字符数组和释放操作。

`std::string label{"front"}` 从字面量起点复制到第一个空字符之前，得到五个字符的内容。`label` 管理自己的序列，修改它不会修改字面量。`std::string empty{}` 则建立一个内容长度为零的字符串对象。

访问接口围绕这段内容定义：`size()` 返回其中的 `char` 数量，结果类型为无符号整数类型 `std::string::size_type`；`empty()` 返回内容是否为空。对内容范围内的下标，`label[index]` 访问相应字符，非 `const` 字符串允许通过它修改字符。`std::cout << label` 按字符串记录的长度输出内容。

复制字符串会建立独立的字符序列。下面的完整程序先保存副本，再修改原对象的第一个字符：

```cpp
#include <iostream>
#include <string>

int main() {
    std::string label{"front"};
    const std::string saved{label};
    const std::string empty{};

    label[0] = 'F';

    std::cout << label << ' ' << label.size() << '\n';
    std::cout << saved << ' ' << saved.size() << '\n';
    std::cout << empty.size() << ' ' << empty.empty() << '\n';
}
```

输出：

```text
Front 5
front 5
0 1
```

`label` 和 `saved` 各自保存五个字符，修改前者不会改变后者。最后一行的 `1` 是 `true` 的默认输出形式，表示 `empty` 没有内容字符。

> [!IMPORTANT]
> `std::string` 的值是它拥有的字符序列。复制字符串得到独立的文本；保存字符位置或引用则只是在借用原对象中的字符。这两种关系决定了来源修改、销毁后，手里的文本还能否独立使用。

## 长度统计的是 char 元素

`"front"` 中每个字母各用一个 `char`，所以这里的内容长度恰好等于可见字母数。这个对应关系不能直接推广到所有文本。

[字符与文本编码](../01-objects-types-and-variables/06-characters-and-text-encoding.md#unicode-与-utf-8)区分了编码单元与人所看到的字符：例如，在一个字节为 8 位、普通字符串字面量采用 UTF-8 编码的环境中，`std::string text{"中"}` 的 `size()` 是 `3`。字符串记录的是三个 `char` 元素，不会自动把它们合计为一个汉字。

下标访问也采用同样的单位。对 UTF-8 文本随意替换或切断某个 `char`，可能破坏一个字符的完整编码；`std::string` 不会替调用者验证这一点。

## 内容边界与结尾空字符

字符串内容的下标范围是 `0 <= index < size()`。此外，`std::string` 保证在紧接内容的位置存在值为零的字符，这个结尾标记不计入 `size()`。

在 C++23 中，字符串的 `operator[]` 特别允许读取 `index == size()` 的位置，取得这个空字符。因此，空字符串没有内容字符，但读取它的下标 `0` 仍能取得结尾标记：

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

输出两行 `1`。这里读取的是标记，不能由此推断下标访问能够增加字符串长度。

> [!WARNING]
> 对 `std::string`，下标大于 `size()` 是未定义行为；把 `size()` 位置的字符改成非零值，同样是未定义行为。这个位置不是预留的追加槽位。普通内容操作仍应限定在小于 `size()` 的下标内，不能照搬其他序列类型的边界规则。

字符串也可以把空字符保存为内容的一部分；这种情况下，内部空字符会计入长度，末尾标记仍位于 `size()` 位置。构造时是否只读到第一个空字符，取决于使用的接口，而不是 `std::string` 无法保存它。需要与按结束标记读取的接口交接时，可以查阅[空终止文本与指针接口](deep-dives/01-null-terminated-text-and-pointer-interfaces.md#显式长度保留内容中的空字符)。

## 参考

- [C++23 草案 N4950：字符串字面量](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
- [C++23 草案 N4950：字符串要求与构造](https://timsong-cpp.github.io/cppwp/n4950/basic.string)
- [C++23 草案 N4950：字符串长度](https://timsong-cpp.github.io/cppwp/n4950/string.capacity)
- [C++23 草案 N4950：字符访问](https://timsong-cpp.github.io/cppwp/n4950/string.access)
- [C++23 草案 N4950：字符串输入输出](https://timsong-cpp.github.io/cppwp/n4950/string.io)
