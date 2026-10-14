---
title: 键值关联与映射对象（Key-Value Associations and Map Objects）
date: 2026-09-19
order: 1
---

# 键值关联与映射对象（Key-Value Associations and Map Objects）

保存一组压力读数时，`vector` 可以记录样本的排列。如果任务变成“根据传感器编号取得它的当前读数”，用于识别记录的就不再是序列下标，而是编号。编号为 `30` 的传感器，不要求位于第 `30` 个元素。

把编号称为键（key），把与它关联的压力称为映射值（mapped value），就得到一组键值关联。若每个编号只保留一份当前读数，需要同时维护两件事：按编号找到记录，以及避免同一编号出现多条当前记录。

## 容器按照键组织关联

头文件 `<map>` 提供 `std::map<Key, T>`：`Key` 指定键类型，`T` 指定映射值类型。例如，`std::map<int, int>` 可以用一个整数编号关联一个整数压力值，`std::map<int, std::string>` 则可以用编号关联文本。

这是一种关联容器（associative container）。它根据键的比较关系组织元素，遍历顺序也由该关系决定。**对于比较等价的键，`map` 最多保存一个元素。** 在本篇使用的默认整数比较中，比较等价就是整数相等，遍历按照键从小到大进行。

因此，键为 `10` 和 `30` 的两条记录可以直接共存，不必建立中间编号的记录；两个不同编号也完全可以对应相同的压力值。唯一性约束作用于键，不作用于映射值。

`std::map<int, int> readings{};` 建立空容器。用 `{{30, 250}, {10, 240}}` 初始化时，每个内层 `{键, 映射值}` 建立一条关联，外层花括号给出整组初始元素。源码中的列出顺序不决定之后的遍历顺序。

## 一个元素同时保存键和值

为了把两项数据组成一个对象，标准库提供了头文件 `<utility>` 中的 `std::pair<A, B>`。它有两个公开数据成员：`first` 的类型是 `A`，`second` 的类型是 `B`。例如，`std::pair<int, int>{10, 240}` 把 `10` 放进 `first`，把 `240` 放进 `second`。

`map<Key, T>` 的元素类型是 `std::pair<const Key, T>`。对于 `map<int, int>`，每个元素因此具有以下结构：

| 成员 | 类型 | 本例中的含义 |
| --- | --- | --- |
| `entry.first` | `const int` | 用于识别记录的传感器编号 |
| `entry.second` | `int` | 该传感器当前的压力值 |

键在元素中带有 `const`，因为直接改键可能破坏容器已经建立的顺序和唯一性。通过普通可修改迭代器或范围循环取得元素时，可以修改其压力值，不能给 `entry.first` 重新赋一个编号。

下面按编号输出三条关联。`size()` 报告元素数量，也就是当前记录了多少个不同的键；范围循环中的引用避免复制每个元素：

```cpp
#include <iostream>
#include <map>
#include <utility>

int main() {
    const std::map<int, int> readings{{30, 250}, {10, 240}, {20, 245}};

    for (const std::pair<const int, int>& entry : readings) {
        std::cout << entry.first << ' ' << entry.second << '\n';
    }
    std::cout << readings.size() << '\n';
}
```

输出依次为 `10 240`、`20 245`、`30 250` 和 `3`。程序没有调用排序算法，容器已经按键组织好这些记录；压力值并不参与这里的顺序。

循环也可以写成 `for (const auto& entry : readings)`，由类型推导保留对元素的只读引用。若容器可修改，使用 `auto& entry` 可以修改 `entry.second`，键本身仍为 `const`。不能因为变量名 `entry` 没写 `const`，就认为它的每个成员都可修改。

> [!IMPORTANT]
> `map` 的一个元素是一条关联，包含不可直接改写的键和对应的映射值。遍历得到的是这整条关联；键决定它如何被识别和排列，映射值保存这条关联的数据。

## 有序遍历不等于下标访问

`begin()` 和 `end()` 仍组成[半开区间](../22-iterators-ranges-and-algorithms/01-iterator-positions-and-half-open-ranges.md#两个位置组成半开区间)：前者指向第一个元素，后者表示末尾之后的位置；空容器的两者相等。`cbegin()`、`cend()` 提供只读位置。迭代器解引用得到元素，`position->second` 则访问该元素的映射值，作用相当于 `(*position).second`。

`map` 支持双向迭代器（bidirectional iterator）：`++position` 前进到比较顺序中的下一项，`--position` 可以退到前一项。前进时不能从 `end()` 继续递增；后退时必须确实存在前驱，不能递减 `begin()`。非空容器可以从 `end()` 后退到最后一个元素，空容器则不可以。

它不提供 `vector` 那样的随机访问能力，不能用 `position + 3` 跳过三个元素，也不能把两个位置相减求出距离。有序说明的是元素之间的先后关系，不表示它们具有连续存储，也不表示可以通过键直接计算存储地址。

同样，编号和“当前排在第几个”是不同信息。增加一个更小的键可能改变某条记录前面有多少项，却不改变它的编号。

> [!PRACTICE]
> 需要按稳定的业务标识维护一份当前数据，并按键遍历时，`map` 能让容器负责维护关联与唯一性。若任务本来是记录一串样本、保留到达顺序或允许同一编号多次出现，序列仍然更直接；应先确定数据关系，再选择容器。

## 参考资料

- [C++23 工作草案：map 的唯一键、元素类型与迭代器](https://timsong-cpp.github.io/cppwp/n4950/map.overview)
- [C++23 工作草案：pair 的成员与构造](https://timsong-cpp.github.io/cppwp/n4950/pairs.pair)
- [C++23 工作草案：关联容器的比较关系与遍历顺序](https://timsong-cpp.github.io/cppwp/n4950/associative.reqmts)
