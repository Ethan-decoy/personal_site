---
title: 文本比较与组合（Text Comparison and Composition）
date: 2026-09-15
order: 2
---

# 文本比较与组合（Text Comparison and Composition）

判断两个传感器名称是否相同，关心的是字符序列；把位置名称接到 `"sensor="` 后面，关心的是组合后的文本。`std::string` 的比较和拼接围绕这样的文本值工作，字符指针上的运算则仍遵循指针规则。选择哪种表达式，首先取决于手中的类型表达了什么。

## 相同文本不要求相同地址

两个 `std::string` 使用 `==` 比较时，只有长度相同、对应位置的 `char` 都相同，结果才为 `true`。字符串也可以直接与普通字符串字面量比较，例如 `label == "front"`；字面量一侧的文本取到第一个空字符之前。

这种比较不会自动忽略大小写，也不会判断两段不同的编码是否在显示时看起来一样。它判断的是当前保存的字符序列。

下面的完整程序让两份相同内容存放在不同的字符数组中，以便区分文本相等与指针相等。数组中的结尾空字符使字符串构造能够找到内容的结束位置：

```cpp
#include <iostream>
#include <string>

int main() {
    const char first_text[3]{'o', 'k', '\0'};
    const char second_text[3]{'o', 'k', '\0'};
    const char* const first{first_text};
    const char* const second{second_text};
    const std::string left{first};
    const std::string right{second};

    std::cout << (first == second) << '\n';
    std::cout << (left == right) << '\n';
}
```

输出：

```text
0
1
```

数组在初始化指针时[转换为指向首元素的指针](../20-fixed-size-sequences-and-contiguous-ranges/deep-dives/01-built-in-arrays-and-pointer-conversion.md#转换产生首元素指针数组仍然存在)。`first` 和 `second` 指向不同数组中的元素，所以不相等；`left` 和 `right` 都拥有两个字符 `'o'`、`'k'`，所以文本相等。

> [!IMPORTANT] 指针相等与文本相等
> 两个 `const char*` 用 `==` 比较指针值。两个 `std::string` 用 `==` 比较各自保存的字符序列。相同的文本可以存放在不同地址。

这里特意使用两个独立的数组，没有用两个相同字面量的地址作为证据。实现允许复用字符串字面量的存储，不能靠字面量地址比较推断它们的内容是否相同。

## 修改现有文本与生成组合结果

`std::string` 的 `+=` 在左侧字符串末尾追加字符。右侧是另一个字符串时，按它的长度追加全部内容。右侧是普通字符串字面量时，追加从开头到第一个空字符之前的内容。右侧是单个 `char` 时，追加一个元素。左侧字符串的长度随追加的字符数量增加。

> [!IMPORTANT] 修改原字符串与生成新字符串
> `+=` 改写左侧字符串，表达式返回该字符串的引用。两个左值字符串用 `+` 拼接时，结果是一个独立拥有组合文本的 `std::string`，两个原对象各自保留原值。

下面的程序用 `prefix + location` 生成组合文本。`make_entry` 通过 `const std::string&` 读取同一个位置名称，在局部字符串 `result` 上依次追加名称和分号，最后按值返回。

```cpp
#include <iostream>
#include <string>

std::string make_entry(const std::string& location) {
    std::string result{"sensor="};
    result += location;
    result += ';';
    return result;
}

int main() {
    const std::string location{"front"};
    const std::string prefix{"sensor="};
    const std::string joined{prefix + location};
    const std::string entry{make_entry(location)};

    std::cout << joined << '\n';
    std::cout << entry << '\n';
    std::cout << prefix << ' ' << location << '\n';
    std::cout << (joined == "sensor=front") << '\n';
}
```

输出：

```text
sensor=front
sensor=front;
sensor= front
1
```

`joined` 保存 `sensor=front`，`entry` 保存 `sensor=front;`。两者都拥有各自的文本。`prefix` 和 `location` 仍保留原来的内容。函数中的 `return result;` 直接按值交付局部构造的文本，适用[返回局部对象的规则](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md#不要为普通局部返回额外添加移动转换)。

包含 `<utility>` 后，可以把拼接表达式写成 `std::move(prefix) + location`，让 `location` 仍作为左值参与。`std::move` 保留 `prefix` 的 `const` 限定，因此本例仍选择左侧参数为 `const std::string&` 的重载，`prefix` 保留原值。

若把 `prefix` 声明为可修改的字符串，同一个表达式会选择左侧参数为 `std::string&&` 的重载，效果等同于先向 `prefix` 追加 `location`，再从 `prefix` 移动构造结果。正常返回后，`prefix` 仍然有效，内容未指定。

## 字面量不会自行变成字符串运算

`"sensor=" + "front"` 不是字符串拼接表达式。两个操作数都是数组，在这里会转换为指针；内置运算不允许把两个指针相加，而表达式中也没有 `std::string` 操作数来选择字符串的拼接运算。

如果需要组合这些内容，可以明确建立字符串，例如 `std::string{"sensor="} + "front"`。这里左侧的类型给出了文本拼接所需的语义。仅仅把变量命名为 `text` 或 `name`，并不会改变运算规则。

## 字符串增长与存储变化

`std::string` 也区分[元素数量与容量](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md#容器对象与连续元素存储)。`size()` 统计已有的 `char`，`capacity()` 给出当前存储能容纳的内容字符总数，两者均返回 `std::string::size_type`。额外的结尾空字符由字符串另行维护。读写字符时仍使用[由长度确定的下标边界](01-string-objects-and-character-sequences.md#内容边界与结尾空字符)。

追加后的长度超过原容量时，字符串需要更大的字符存储。发生重新分配时，已有内容也要存入新空间，原来的字符指针和引用随之失效。容量的初值和增长幅度由实现选择。

> [!WARNING] 容量足够时字符指针和引用也可能失效
> 即使剩余容量足够，`std::string` 的追加和整串赋值等操作仍允许使原有字符的指针和引用失效。继续使用旧的访问关系前，要按具体操作核对有效性。通过有效下标原位改写已有字符会保留这些访问关系。

### 已知结果长度时预留容量

在 C++23 中，`reserve(count)` 请求预留至少能容纳 `count` 个内容字符的容量，返回类型为 `void`。正常返回时，文本与 `size()` 保持原值。请求超过原容量时会重新分配，新容量至少达到 `count`。原容量足够时，保留原有存储和容量。

记录的最终长度等于前缀长度、位置名称长度和分号占用的一个字符之和。下面的函数可替换前面完整程序中的 `make_entry`，使用其中已包含的 `<string>`。

```cpp
std::string make_entry(const std::string& location) {
    std::string result{"sensor="};
    constexpr std::string::size_type separator_size{1};
    const std::string::size_type final_size{result.size() + location.size() + separator_size};
    result.reserve(final_size);
    result += location;
    result += ';';
    return result;
}
```

传入 `"front"` 时，计划长度为 `7 + 5 + 1`，共十三个字符。预留成功后，容量至少为十三，`result` 的内容仍是 `sensor=`，长度仍为七。两次追加完成后才得到长度为十三的 `sensor=front;`。是否因预留发生重新分配，取决于调用前的容量。

需要访问构造后的字符时，应在预留和追加完成后，从结果对象取得指针或引用。`reserve` 或 `+=` 因长度上限或分配失败而抛出异常时，该次操作保持调用前的字符串值。

> [!PRACTICE] 按结果长度估算预留容量
> 能估算连续追加后的长度时，可以在开始前一次预留，减少因容量不足而重新分配的机会。估计偏高可能多占用存储，实际长度超出预留容量时仍需扩展存储。

## 参考

- [C++23 草案 N4950：字符串比较](https://timsong-cpp.github.io/cppwp/n4950/string.cmp)
- [C++23 草案 N4950：字符串修改操作](https://timsong-cpp.github.io/cppwp/n4950/string.modifiers)
- [C++23 草案 N4950：字符串拼接](https://timsong-cpp.github.io/cppwp/n4950/string.op.plus)
- [C++23 草案 N4950：字符串容量与预留](https://timsong-cpp.github.io/cppwp/n4950/string.capacity)
- [C++23 草案 N4950：字符串操作的异常与失效规则](https://timsong-cpp.github.io/cppwp/n4950/string.require)
- [C++23 草案 N4950：字符串字面量的存储](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
