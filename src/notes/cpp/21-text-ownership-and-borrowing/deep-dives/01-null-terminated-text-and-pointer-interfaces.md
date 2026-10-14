---
title: 空终止文本与指针接口（Null-Terminated Text and Pointer Interfaces）
date: 2026-09-15
order: 1
---

# 空终止文本与指针接口（Null-Terminated Text and Pointer Interfaces）

`std::string` 与 `std::string_view` 都记录字符数量，处理子串时可以保留“从哪里开始、到哪里结束”的信息。但有些文本接口只接收一个字符指针，并从起点一直读取到第一个 `\0`。把视图的 `data()` 交给这样的接口，原有长度不会跟着传过去。

本篇以文本拥有关系、子串和借用有效期为前提，解释这两种边界约定如何相接。关键是分清**由数量决定的范围终点，与由首个空字符决定的文本终点**。

## 空字符为指针接口标记终点

空终止字符串（null-terminated string），也称 C 风格字符串（C-style string），用一段连续字符加上末尾的空字符表示文本。对于这里的 `char`，结束标记是 `\0`：它的数值为零，不是可见的字符 `'0'`，也不是空指针 `nullptr`。

按这项约定读取时，第一个 `\0` 之前的字符构成文本；这个结束标记本身不计入文本长度。指针只标识起点，读取者需要沿着字符序列寻找标记。调用者必须保证从起点到这个标记都能合法读取，且在读取期间保持有效。

普通字符串字面量 `"sensor"` 自带末尾的 `\0`，可以为这样的读取提供终点。但一个 `char` 数组并不会仅凭元素类型自动获得这个性质。

`std::cout << pointer` 在 `pointer` 为 `const char*` 时使用文本输出规则：从指针指定的位置读取到第一个 `\0`，输出标记前的字符；这里不会把字符指针当作普通地址打印。这个输出接口还要求指针非空。

下面是在已包含 `<iostream>` 的程序中、可放入 `main` 的错误片段。声明本身有效，输出语句也能通过类型检查，但不能执行它来观察“会输出多少字符”：

```cpp
const char letters[2]{'A', 'B'};
std::cout << letters; // Error: no null terminator exists within this array.
```

数组转换为首元素指针后，输出操作不知道数组只有两个元素。查找结束标记会越过数组允许读取的范围，产生未定义行为；不能依赖相邻存储中碰巧出现零值。

## string 的末尾由拥有者维护

`std::string` 保存自己的字符数量，并在 `size()` 对应的位置维护一个额外的 `\0`。例如，值为 `"sensor"` 的字符串有六个内容字符，`size()` 为 `6`，位置 `6` 存放结束标记。这个额外字符不属于内容计数。

成员函数 `c_str()` 返回指向这段存储的 `const char*`，可供只读的空终止文本接口使用。`data()` 同样提供连续字符的起点；在本笔记采用的 C++23 中，它也保证 `data()[size()]` 为 `\0`。两者的区别不在于是否具有末尾标记，而在于提供的访问权限：

| 来源与调用 | 返回类型 | 允许的访问 |
| --- | --- | --- |
| `string` 的 `c_str()` | `const char*` | 读取字符与末尾标记 |
| `const string` 的 `data()` | `const char*` | 读取字符与末尾标记 |
| 可修改 `string` 的 `data()` | `char*` | 修改已有内容字符，保留末尾的空字符 |

通过可修改的 `data()` 改写已有字符不会自动改变字符串的 `size()`。不能把 `data()[size()]` 改为非零字符，也不能用所得指针向已有内容范围之后任意写入。需要改变长度时，应使用字符串自身提供的操作。

这些指针都借用 `string` 的存储，没有建立副本。字符串销毁或修改操作使原存储失效后，先前取得的指针也不能继续用于读取。即使字符串仍然存在，也应根据[修改操作的失效规则](../05-text-lifetimes-and-interface-boundaries.md#修改字符串后不沿用旧借用的有效性假设)判断旧指针是否有效。

## 视图的终点不一定放着空字符

`std::string_view::data()` 返回 `const char*`，保留视图的起点。它既不复制字符，也不会在视图终点添加 `\0`。从拥有者中截取子串，只改变借用范围，不改变拥有者的字符。

与字符指针的输出不同，`std::cout << view` 会按照 `view.size()` 输出整个视图。直接输出 `std::string` 也使用字符串记录的数量。下面让这两种终点约定在同一份数据上显现：

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    const std::string owner{"sensor=front"};
    const std::string_view all{owner};
    const std::string_view prefix{all.substr(0, 6)};

    std::cout << prefix << '\n';
    std::cout << prefix.data() << '\n';
}
```

程序先输出 `sensor`，再输出 `sensor=front`。第一行使用视图记录的六个字符；第二行只收到字符指针，继续读到整个 `owner` 末尾的 `\0`。前缀结束处的实际字符是 `'='`，没有因为 `substr` 而变成结束标记。

第二行在这个程序中仍然合法：`owner` 一直存活，后续字符及其末尾标记都属于有效存储。问题是它丢失了前缀的长度约定，输出了不同的文本。若来源存储根本不包含可合法读取的结束标记，同样的写法才会越界读取。

> [!IMPORTANT]
> `data()` 只交付指针，不交付视图长度。把它交给空终止文本接口，必须另外确认可读取的 `\0` 在哪里，以及从起点到第一个 `\0` 的内容是否正好是需要传递的文本。视图有效，不等于这个指针满足另一种接口的终点约定。

## 显式长度保留内容中的空字符

字符序列本身可以包含空字符。普通字符串字面量 `"AB\0CD"` 包含 `'A'`、`'B'`、`'\0'`、`'C'`、`'D'`，以及字面量自动添加的末尾 `\0`；显式写出的空字符不会取消最后那个标记。

从字符指针构造 `std::string` 时，只提供指针的形式先寻找第一个 `\0`，据此确定要复制的数量。若希望把内容中的空字符也保留下来，可以同时提供起点与数量：`std::string{pointer, count}` 复制这 `count` 个字符，不再以其中的 `\0` 决定长度。

这项构造要求调用者保证 `[pointer, pointer + count)` 是有效的可读取范围。`count` 不会让构造函数自动识别原数组的真实长度，也不要求这个范围之后另有一个可读取的字符；新的字符串会为自己的内容维护末尾标记。

```cpp
#include <iostream>
#include <string>

int main() {
    const std::string shortened{"AB\0CD"};
    const std::string complete{"AB\0CD", 5};

    std::cout << shortened.size() << ' ' << complete.size() << '\n';
    std::cout << (complete[2] == '\0') << ' ' << (complete[4] == 'D') << '\n';
    std::cout << (complete.data()[complete.size()] == '\0') << '\n';
}
```

程序输出 `2 5`、`1 1` 和 `1`。`shortened` 只保存 `AB`；`complete` 保存五个内容字符，其中位置 `2` 的空字符计入长度，位置 `4` 的 `D` 也仍然存在。位置 `5` 则是 `complete` 为自身维护的末尾标记，不计入 `size()`。

`std::string_view` 也提供这两种边界形式：`std::string_view{"AB\0CD"}` 借用首个空字符之前的两个字符，`std::string_view{"AB\0CD", 5}` 借用显式指定的五个字符。指针加数量的形式同样要求真实范围有效，并由来源维持字符的生命周期；它不会像 `string` 那样复制元素或补上结束标记。

这也解释了为什么终止符与内容中的空字符需要分开判断：`complete.c_str()` 确实提供了合法的空终止读取起点，但只认首个 `\0` 的接口仍然只会把 `AB` 当作文本。字符串中保存着五个字符，无法改变接收方约定的结束方式。

## 在接口边界建立合适的拥有者

接收方能够处理显式长度时，优先保留 `string_view` 或按接口约定一起提供指针与数量。如果接收方要求只读的空终止文本，可以先[从视图建立拥有副本](../03-string-views-and-borrowed-text.md#需要独立文本时建立拥有值)，再使用它的 `c_str()`。

下面的片段可接在前缀示例的 `main` 中：

```cpp
const std::string owned{prefix};
std::cout << owned.c_str() << '\n';
```

它输出 `sensor`。`owned` 按视图长度复制六个字符，并在自己的位置 `6` 放置 `\0`。调用期间，`owned` 负责维持这段存储；若接收方要保存指针供之后使用，还必须让拥有者在那段时间内继续有效。

这项适配解决了子范围缺少末尾标记的问题，但不会删除内容中的空字符。从含有空字符的视图建立 `std::string` 会完整复制这些字符；随后交给空终止接口，文本仍然在首个 `\0` 处结束。需要完整传递这些字符时，应选择支持显式长度的接口，或者遵循双方约定的内容转换规则。

空视图同样需要核对接口约定。默认构造的 `string_view` 的 `data()` 是空指针；从现有文本截取的空子串也可以保留内部位置。`empty()` 为真只说明视图不包含字符；数据指针仍可能指向拥有者中的已有字符，不能仅根据视图为空就认定那个位置是空终止文本的起点。

因此，不能把 `std::cout << empty_view.data()` 当作普遍成立的“输出空文本”方式。直接输出空视图不会输出内容字符；需要空终止表示时，从有效的空视图建立空 `std::string`，它的 `c_str()` 指向自身的末尾 `\0`，可作为非空的空文本指针使用。其他指针接口是否接受 `nullptr`，仍由各自契约决定。

> [!PRACTICE]
> 接入文本指针接口时，先确认长度由谁决定，再确认原字符的有效期。按数量处理的接口需要有效范围；按首个空字符处理的接口需要合法的结束标记，并且不能用这项约定完整表达内容中的空字符。复制为 `string` 可以提供独立存储与末尾标记，不能替接收方改变文本格式。

## 参考资料

- [C++23 工作草案：字符串字面量与末尾空字符](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
- [C++23 工作草案：string 的连续存储与末尾标记](https://timsong-cpp.github.io/cppwp/n4950/basic.string.general)
- [C++23 工作草案：string 的 c_str 与 data](https://timsong-cpp.github.io/cppwp/n4950/string.accessors)
- [C++23 工作草案：string 的指针、数量与视图构造](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
- [C++23 工作草案：string_view 的构造与长度](https://timsong-cpp.github.io/cppwp/n4950/string.view.cons)
- [C++23 工作草案：string_view 的 data 与访问边界](https://timsong-cpp.github.io/cppwp/n4950/string.view.access)
- [C++23 工作草案：字符指针的流输出](https://timsong-cpp.github.io/cppwp/n4950/ostream.inserters.character)
- [C++23 工作草案：string 的流输出](https://timsong-cpp.github.io/cppwp/n4950/string.io)
- [C++23 工作草案：string_view 的流输出](https://timsong-cpp.github.io/cppwp/n4950/string.view.io)
