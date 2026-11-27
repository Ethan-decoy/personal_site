---
title: 字符串视图与文本借用（String Views and Borrowed Text）
date: 2026-09-15
order: 3
---

# 字符串视图与文本借用（String Views and Borrowed Text）

只读取一个传感器名称时，函数需要的是一段字符及其长度。若参数是 `const std::string&`，它必须绑定到字符串对象。传入普通字符串字面量时，调用会先构造一个临时的 `std::string`。

**字符串视图（string view）**用来表达对一段连续字符的只读借用。头文件 `<string_view>` 提供的 `std::string_view` 是处理 `char` 序列的具体类型，可以借用字符串对象、字符串字面量或其中的一段。它沿用[连续范围视图的模型](../20-fixed-size-sequences-and-contiguous-ranges/02-borrowing-contiguous-ranges-with-span.md#将连续元素作为一段范围交给函数)：记录访问起点和长度，不拥有这些字符。

## 视图保存范围，字符由来源维持

用具名的 `std::string` 构造 `std::string_view` 时，视图从字符串内容的起点借用 `size()` 个 `char`。内容中的 `'\0'` 照常计数，额外的结尾空字符位于范围之外。直接传入普通字符串字面量时，构造函数接收字面量的首元素指针，长度取第一个 `'\0'` 之前的字符数。默认构造的 `std::string_view{}` 表示空范围。

视图的 `size()` 返回范围中的 `char` 数量，`empty()` 判断数量是否为零。在合法下标处，`view[index]` 返回 `const char&`。把视图对象声明为 `const`，会固定这个视图记录的起点和长度。

> [!IMPORTANT] 复制视图与借用字符
> 复制视图只复制起点和长度。两个视图各自保存范围，最初借用同一段字符。给一个可修改的视图赋值，只更新它自己的记录。视图提供只读访问，读取时依赖借用的字符仍然有效。

下面的 `print_text` 按值接收视图，用 `std::cout << text` 输出范围内的字符。它只在调用期间读取文本，调用者要让借用的字符有效到读取完成。

```cpp
#include <iostream>
#include <string>
#include <string_view>

void print_text(std::string_view text) {
    std::cout << text << '\n';
}

int main() {
    std::string label{"front-left"};
    std::string_view current{label};
    const std::string_view alias{current};

    label[0] = 'F';
    print_text(alias);

    current = std::string_view{"rear-right"};
    print_text(current);
    print_text(alias);
}
```

程序输出如下。

```text
Front-left
rear-right
Front-left
```

`alias` 复制了 `current` 的范围，起初两个视图都借用 `label` 的字符。`label[0] = 'F'` 通过有效下标原位改写字符，已有的访问关系保持有效，所以第一次调用通过 `alias` 读到 `Front-left`。

给 `current` 赋值后，它借用字面量 `"rear-right"`。右侧的临时视图在赋值语句结束时销毁，具有静态存储期的字面量仍然提供字符。`alias` 保留自己的范围记录，最后一次调用仍通过它读到 `Front-left`。

> [!WARNING] 字符串视图的有效下标小于 size()
> `std::string_view` 的元素下标必须小于视图的 `size()`。即使视图借用了整个字符串的内容，字符串的额外结尾空字符也在视图范围之外。在 C++23 中，`view[view.size()]` 是未定义行为。

## 子串改变观察范围

视图的成员函数 `substr(pos, count)` 以 `pos` 为起点，选取最多 `count` 个字符。它返回的是一个新视图，其中的**子串（substring）**仍借用原来的字符。`pos` 和 `count` 都使用无符号数量类型 `std::string_view::size_type`。

判断结果时，先核对起点。起点合法时，剩余长度为 `size() - pos`。省略 `count` 时，选取全部剩余字符。

| 起点 | 结果 |
| --- | --- |
| `pos > size()` | 抛出 `std::out_of_range` |
| `pos == size()` | 返回末尾位置的空视图 |
| `pos < size()` | 从 `pos` 开始，长度取 `count` 与剩余长度的较小值 |

对于合法起点，请求零个字符同样得到空视图。结果非空时，子视图的下标 `0` 对应原视图的下标 `pos`。

下面的 `label` 有十个内容字符。下标 `0` 到 `4` 对应 `front`，下标 `6` 到 `9` 对应 `left`。最后一次调用使用了越过末尾的起点，程序捕获 `<stdexcept>` 中定义的 `std::out_of_range` 类型的异常。

```cpp
#include <iostream>
#include <stdexcept>
#include <string_view>

int main() {
    const std::string_view label{"front-left"};

    std::cout << label.substr(0, 5) << '\n';
    std::cout << label.substr(6, 100) << '\n';
    std::cout << label.substr(label.size()).empty() << '\n';
    std::cout << label.substr(6, 0).empty() << '\n';

    try {
        std::cout << label.substr(label.size() + std::string_view::size_type{1}) << '\n';
    } catch (const std::out_of_range&) {
        std::cout << "invalid position\n";
    }
}
```

程序输出如下。

```text
front
left
1
1
invalid position
```

下标 `6` 起只剩四个字符，因此把数量 `100` 截短后得到 `left`。第三行判空的视图从末尾开始，第四行判空的视图来自合法起点处的零长度请求。最后一次调用因起点越界进入异常处理。

> [!WARNING] subspan 的数量前置条件
> `std::string_view::substr` 会把超长的数量截短。对 `std::span::subspan(offset, count)`，传入具体数量时，合法起点之后必须有足够的元素。请求数量超过剩余长度会违反前置条件，在 C++23 中导致未定义行为。[连续子范围的边界](../20-fixed-size-sequences-and-contiguous-ranges/04-subranges-and-interval-boundaries.md#用起点偏移与数量选出一段元素)

## 需要独立文本时建立拥有值

对具名字符串 `source` 调用 `source.substr(pos, count)`，同样先检查起点并按剩余长度截短。结果是独立拥有选中字符的 `std::string`。

从视图出发，可以用 `std::string{view}` 复制范围内的字符。构造期间，视图借用的整个范围都须可读。构造完成后，新字符串独立保存这份内容。

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string source{"front-left"};
    const std::string_view all{source};
    const std::string_view part{all.substr(6)};
    const std::string from_view{part};
    const std::string from_source{source.substr(6)};

    source[6] = 'L';
    std::cout << part << '\n';
    std::cout << from_view << '\n';
    std::cout << from_source << '\n';
}
```

`source[6] = 'L'` 原位改写已有字符，`part` 的借用仍然有效，所以第一行输出 `Left`。两个拥有字符串分别保存了构造时的内容，后两行都输出 `left`。

> [!IMPORTANT] 子串结果的拥有与借用
> 对 `std::string` 调用 `substr`，结果独立拥有选中的字符。对 `std::string_view` 调用 `substr`，结果继续借用原字符。需要让文本独立于来源存活，或者保留当时的内容时，可以建立拥有副本。

字符串销毁或修改使字符访问失效时，依赖这些字符的视图也失去了读取条件。修改后怎样判断旧视图能否继续读取，见[文本借用的有效期与接口边界](05-text-lifetimes-and-interface-boundaries.md#修改字符串后不沿用旧借用的有效性假设)。

## 参考资料

- [C++23 草案：字符串视图的构造、访问与子串](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 草案：字符串到视图的转换](https://timsong-cpp.github.io/cppwp/n4950/string.accessors#7)
- [C++23 草案：字符串视图的输出](https://timsong-cpp.github.io/cppwp/n4950/string.view.io)
- [C++23 草案：字符串的子串操作](https://timsong-cpp.github.io/cppwp/n4950/string.substr)
- [C++23 草案：从视图构造字符串](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
- [C++23 草案：span 的子范围前置条件](https://timsong-cpp.github.io/cppwp/n4950/span.sub#15)
- [C++23 草案：标准异常类型](https://timsong-cpp.github.io/cppwp/n4950/std.exceptions)
