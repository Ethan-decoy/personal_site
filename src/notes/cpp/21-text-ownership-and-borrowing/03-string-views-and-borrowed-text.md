---
title: 字符串视图与文本借用（String Views and Borrowed Text）
date: 2026-09-15
order: 3
---

# 字符串视图与文本借用（String Views and Borrowed Text）

只读取一个传感器名称时，函数需要的是一段字符及其长度。把它复制成新的 `std::string`，会额外建立一份拥有字符的对象；限制函数只能接收 `const std::string&`，又会把接口绑定在某一种拥有者上。

**字符串视图（string view）**用来表达对一段连续字符的只读借用。头文件 `<string_view>` 提供的 `std::string_view` 是处理 `char` 序列的具体类型，可以借用字符串对象、字符串字面量或其中的一段。它沿用[连续范围视图的模型](../20-fixed-size-sequences-and-contiguous-ranges/02-borrowing-contiguous-ranges-with-span.md)：记录访问起点和长度，不拥有这些字符。

## 视图保存范围，字符由来源维持

用具名的 `std::string` 构造 `std::string_view`，视图覆盖字符串的全部字符，长度与字符串的 `size()` 相同。用普通字符串字面量构造时，从开头借用到第一个 `\0` 之前，不包含终止空字符。默认构造的 `std::string_view{}` 则表示空范围。

视图的 `size()` 返回范围中的 `char` 数量，`empty()` 判断数量是否为零。合法元素下标满足 `index < size()`；`view[index]` 提供 `const char&`，因此无论视图对象本身有没有 `const`，都不能通过它修改字符。

给视图对象加上 `const`，额外限制的是重新赋值、更换所记录的范围。**只读借用不会把来源变成只读，也不会保存来源内容的快照。**

下面的 `print_text` 按值接收视图。传参只复制范围记录，不复制字符。`std::cout << text` 按视图的长度输出其中的字符；函数不保存这份借用，调用期间来源必须有效。

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

输出为：

```text
Front-left
rear-right
Front-left
```

`alias` 最初复制了 `current` 的范围，两个视图都借用 `label`。通过字符串自身修改首字符后，视图读到的也随之改变。随后对 `current` 赋值，只让它改为借用另一段文本；`alias` 仍然指向原字符，`label` 也没有被赋成 `"rear-right"`。

> [!WARNING]
> `std::string_view` 的下标条件始终是 `index < size()`。即使来源是保证末尾带有 `\0` 的 `std::string`，`view[view.size()]` 仍是未定义行为；字符串对象自身的末尾访问特例不能套用到视图上。

## 子串改变观察范围

视图的成员函数 `substr(pos, count)` 返回从下标 `pos` 开始、最多包含 `count` 个字符的新视图。这里的**子串（substring）**仍借用原字符；建立它不会修改来源或原视图。只传起点的 `substr(pos)` 则取到当前视图末尾。

`pos` 和 `count` 使用无符号数量类型 `std::string_view::size_type`。子视图的下标从零重新开始，它的第一个字符对应原视图的 `pos` 位置。

这个接口会检查起点。若 `pos > size()`，它抛出 `std::out_of_range`；这是头文件 `<stdexcept>` 中表示实参超出允许范围的标准异常类型，可以用 `catch (const std::out_of_range&)` 捕获。若起点合法，只是 `count` 大于剩余长度，则返回剩余部分。

| 起点与数量 | 结果 |
| --- | --- |
| `pos < size()`，数量未超出剩余长度 | 借用指定数量的字符 |
| `pos <= size()`，数量超出剩余长度 | 数量缩短为 `size() - pos` |
| `pos == size()` | 返回空视图 |
| `pos > size()` | 抛出 `std::out_of_range`，不返回视图 |

下面的字符串字面量包含十个有效字符。索引 `0` 到 `4` 是 `front`，索引 `6` 到 `9` 是 `left`。

```cpp
#include <iostream>
#include <stdexcept>
#include <string_view>

int main() {
    const std::string_view label{"front-left"};

    std::cout << label.substr(0, 5) << '\n';
    std::cout << label.substr(6, 100) << '\n';
    std::cout << label.substr(label.size()).empty() << '\n';

    try {
        std::cout << label.substr(label.size() + 1) << '\n';
    } catch (const std::out_of_range&) {
        std::cout << "invalid position\n";
    }
}
```

输出依次为 `front`、`left`、`1` 和 `invalid position`。数量 `100` 被缩短为剩余的四个字符；起点恰好等于长度时得到空视图；起点越过末尾时，检查失败并进入异常处理。

> [!TIP]
> `string_view::substr` 接受“最多取多少字符”，数量过大会截短。`span::subspan` 的实际数量参数要求范围足够长，不能按这里的截短规则使用。相似的选取形式，仍需以各自的边界契约为准。

## 需要独立文本时建立拥有值

对具名字符串 `source` 调用 `source.substr(pos, count)`，得到的是新的 `std::string`，它独立拥有选中的字符。它对起点与数量的处理遵循上面的规则，但结果类型和所有权不同。

如果已经有一个视图，也可以用 `std::string{view}` 显式构造拥有值。构造期间按视图长度复制字符，完成后新字符串不再借用来源。此时来源必须仍然有效；把已经悬空的视图包装成字符串，不能补救之前失去的访问条件。

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

输出为 `Left`、`left` 和 `left`。`part` 继续观察来源；另外两个字符串保存了构造时的值。对当前的只读处理而言，视图避免了字符复制；需要让结果独立存活或保持当前内容时，这份复制则建立了必要的隔离。

> [!IMPORTANT]
> `string.substr(...)` 建立拥有字符的字符串，`view.substr(...)` 建立借用字符的视图。选择哪一种，取决于结果是否需要独立保存字符，而不只取决于两次调用的文本是否相同。

视图不会延长字符串的生命周期，复制视图或取得子视图也不会改变这一点。字符串销毁或操作使原字符访问失效后，视图不能再用于读取；具体边界见[文本借用的有效期与接口选择](05-text-lifetimes-and-interface-boundaries.md)。

## 参考资料

- [C++23 草案：字符串视图的构造、访问与子串](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 草案：字符串视图与输出](https://timsong-cpp.github.io/cppwp/n4950/string.view)
- [C++23 草案：字符串的子串操作](https://timsong-cpp.github.io/cppwp/n4950/string.substr)
- [C++23 草案：从视图构造字符串](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
- [C++23 草案：标准异常类型](https://timsong-cpp.github.io/cppwp/n4950/std.exceptions)
