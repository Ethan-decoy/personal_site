---
title: 删除与映射元素的有效性（Erasure and Map Element Validity）
date: 2026-09-19
order: 5
---

# 删除与映射元素的有效性（Erasure and Map Element Validity）

按编号找到一台传感器后，程序可能暂时保留它的迭代器，同时登记另一台传感器或删除其他记录。原来的访问能否继续使用，取决于容器对这些修改提供的保证。

`map` 的插入和删除不会像 `vector` 的中间删除那样要求后继元素向前补位。对于仍然保留的元素，已有迭代器、引用和指针可以继续访问同一个对象；删除该元素本身时，这些访问关系才会失效。

## 删除其他键，不改变已有元素的访问关系

成员函数 `erase(key)` 删除键与参数比较等价的元素，返回删除数量。对键唯一的 `map`，返回值只有 `0` 或 `1`：没有对应键时不作修改，也不把“没有找到”当作异常。结果类型是该容器的 `size_type`，与 `size()` 的结果类型相同。

这里按键确定删除目标，仍然遵循容器的比较规则。对本篇采用默认整数顺序的 `map<int, int>`，键等价就是整数相等；不能把这种关系推广为所有自定义比较规则都使用 `==`。

插入新元素不会使既有元素的迭代器、引用和指针失效；`erase` 只使被删元素的这些访问关系失效。下面保留编号 `102` 对应的访问，再插入 `103`、删除 `101`：

```cpp
#include <iostream>
#include <map>

int main() {
    std::map<int, int> readings{{101, 240}, {102, 245}, {104, 250}};
    const auto selected{readings.find(102)};
    int& pressure_kpa{selected->second};

    readings.try_emplace(103, 248);
    const auto removed{readings.erase(101)};
    const auto missing{readings.erase(999)};

    pressure_kpa = 246;
    std::cout << removed << ' ' << missing << '\n';
    std::cout << selected->first << ' ' << selected->second << '\n';
}
```

输出为 `1 0` 和 `102 246`。初始化已经明确包含 `102`，因此本例可以直接从查找结果取得引用。插入 `103` 与删除 `101` 都没有删除 `102`；`pressure_kpa` 仍然引用它的映射值，赋值后通过原迭代器也能读到 `246`。

这项保证不要求预留容量，也不依赖某次运行中地址恰好没有变化。它属于 `map` 插入与删除的接口契约，不能套用[连续序列删除后的失效规则](../22-iterators-ranges-and-algorithms/04-container-mutation-and-iterator-validity.md#删除一个元素后从返回的位置继续)。

> [!IMPORTANT]
> 对 `map` 的插入与删除，要检查被借用的元素是否仍被保留。插入别的键、删除别的元素，不会使这项元素访问失效；删除它本身后，原迭代器和借用不能再用于访问它。

位置保持有效也不意味着遍历内容被冻结。上例插入 `103` 后，从 `102` 继续向后遍历会遇到这条新记录；旧迭代器仍然有效，不代表后续遍历只处理插入前的那组元素。

## 删除当前位置后，接住返回的后继

已经取得要删除的位置时，可以调用 `erase(position)`。这个重载要求 `position` 是当前容器中有效、可以解引用的位置，不能传入 `end()`，也不能使用其他容器的迭代器。位置可以是 `iterator` 或 `const_iterator`；删除由非 `const` 的容器对象执行。

它返回一个 `iterator`，指向被删元素在原遍历次序中的后继；若没有后继，则返回 `end()`。这里返回的是继续遍历的位置，不是删除数量。后继元素本身仍在原处，函数并没有把它移动到被删元素的位置。

下面按业务规则删除负数压力记录。输入包括相邻的两条负数记录，以及最后一条负数记录：

```cpp
#include <iostream>
#include <map>

int main() {
    std::map<int, int> readings{{101, 240}, {102, -2}, {103, -3}, {104, 245}, {105, -4}};
    auto position{readings.begin()};

    while (position != readings.end()) {
        if (position->second < 0) {
            position = readings.erase(position);
        } else {
            ++position;
        }
    }

    for (const auto& entry : readings) {
        std::cout << entry.first << ' ' << entry.second << '\n';
    }
}
```

输出为：

```text
101 240
104 245
```

删除 `102` 返回 `103` 的位置，下一轮就能继续检查这条相邻记录。删除末尾的 `105` 返回 `end()`，循环随后结束。只有保留当前元素时才递增；删除后如果再递增返回的位置，会跳过尚未检查的后继，或者错误地递增结束迭代器。

赋值语句先完成删除并取得返回值，再用有效结果替换原来的迭代器值。它不需要在删除后读取旧位置。空映射不会进入循环；全部元素都被删除时，最后一次返回的 `end()` 也能正常结束循环。

> [!WARNING]
> 其他元素的位置仍然有效，并不能挽救指向被删元素的迭代器。执行 `erase(position)` 后，不能再对旧 `position` 解引用、递增或拿它与 `end()` 比较；应接收返回位置，或者从容器重新取得有效位置。

按键删除还要定位键，成本随元素数量按对数量级增长；已经知道位置时，可以直接使用位置重载。这里不需要像 `vector` 那样通过后继元素的赋值维持连续存储，因此不能把连续序列反复删除时的补位成本照搬过来。

## 元素稳定不替它管理的资源作保证

`clear()` 删除所有元素，返回类型是 `void`；完成后容器仍然存在，但 `size()` 为零。原来指向元素的迭代器、引用和指针全部失效，因为它们的目标已经被销毁。容器自身销毁时，同样不能再沿用这些访问关系。

复制构造另一个 `map` 则会建立另一组元素。原来的迭代器仍然属于原容器，不会因为副本含有相同的键和值，就自动转去访问副本。是否保留原容器，仍然决定原借用能否继续使用。

还要区分映射元素和映射值内部的资源。例如，`map<int, string>` 中某个元素仍被保留，迭代器也仍然有效，但给它的 `second` 重新赋入文本，可能使先前借用的字符范围失效。此时继续通过迭代器读取当前字符串，与继续使用旧 `string_view` 是两种不同的操作；字符借用仍须遵守[字符串修改后的有效性要求](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md#修改字符串后不沿用旧借用的有效性假设)。

> [!PRACTICE]
> 需要按唯一键持续增删、按键顺序遍历，并在修改其他记录时保留已有元素访问，`map` 提供了直接的接口保证。若数据主要连续扫描，或者集中建立后只需排序查询，`vector` 的连续存储与相应算法也可能更适合。选择时同时考虑更新方式、访问有效性和实际数据规模；对数级查找并不保证程序在所有场景下都更快。

## 参考资料

- [C++23 工作草案：关联容器的删除、返回位置与访问有效性](https://timsong-cpp.github.io/cppwp/n4950/associative.reqmts)
- [C++23 工作草案：容器的复制与销毁要求](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
- [C++23 工作草案：字符串修改与字符访问失效](https://timsong-cpp.github.io/cppwp/n4950/string.require)
