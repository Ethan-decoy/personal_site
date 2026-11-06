---
title: 修改后的访问有效性与容器选择（Mutation Validity and Container Choice）
date: 2026-09-21
order: 4
---

# 修改后的访问有效性与容器选择（Mutation Validity and Container Choice）

按编号找到一条读数后，程序可能继续登记其他传感器。对于 `unordered_map`，新增元素可能引发重哈希，因此不能直接沿用 [`map` 插入后迭代器仍然有效的保证](../26-keyed-data-and-ordered-maps/05-erasure-and-map-access-validity.md#删除其他键不改变已有元素的访问关系)。

这里需要分开判断两件事：原元素是否仍然存在，以及原来的遍历位置是否还有效。重哈希会重新组织桶与遍历关系，但不会销毁保留的元素。

## 重哈希后，引用可以保留，迭代器重新获取

**重哈希使原有迭代器失效，但不会使指向元素的指针和引用失效。** 这也包括通过元素取得的映射值引用，例如指向 `second` 的 `int&`。引用仍然访问同一个整数，旧迭代器却不能继续用于解引用、递增或与 `end()` 比较。

调用 `reserve` 或 `rehash` 后，不沿用旧迭代器的有效性假设；需要位置时，重新调用 `find`。下面先保留压力值的引用，再为更多记录准备桶：

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<int, int> readings{{10, 240}, {20, 245}};
    const auto selected{readings.find(10)};
    int& pressure_kpa{selected->second};

    readings.reserve(100);
    pressure_kpa = 241;

    const auto current{readings.find(10)};
    std::cout << pressure_kpa << '\n';
    std::cout << current->first << ' ' << current->second << '\n';
}
```

输出为 `241` 和 `10 241`。初始化已经包含键 `10`，`reserve` 也没有删除它，所以两次查找都能成功。程序在 `reserve` 后只沿用引用，并通过重新查找取得迭代器，不再读取旧的 `selected`。正确性不依赖实现选了多少个桶，也不依赖本次调用是否实际改变了桶数。

> [!IMPORTANT]
> `unordered_map` 的元素访问和遍历位置具有不同的稳定性。插入和重哈希保留已有元素的指针与引用；迭代器还受桶组织变化的影响。元素地址仍然有效，不能证明旧迭代器也能继续使用。

## 预留发生在取得迭代器之前

新增元素时，容器可能为满足最大负载因子而重哈希。判断一次插入是否保证保留迭代器，可以使用下面的条件：

$$
N+n\leq zB
$$

这里，$N$ 是插入前的元素数量，$n$ 是这次实际新增的元素数量，$B$ 是插入前的桶数，$z$ 是当前最大负载因子。满足这个条件时，插入不会使已有迭代器失效；条件不满足时，就不能依赖这项保证。$n$ 不是插入函数的调用次数，也不包括因键已存在而未新增的记录。

实际使用时，通常不必在每次插入前计算公式。已知接下来最多保存多少个元素，就先调用 `reserve`，再取得需要保留的迭代器。在不降低最大负载因子、不另行调整桶数的前提下，只要总元素数没有超过这次预留的数量，后续插入就处于保证范围内。

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<int, int> readings{{10, 240}};
    readings.reserve(3);
    const auto selected{readings.find(10)};

    readings.try_emplace(20, 245);
    readings.try_emplace(30, 250);

    std::cout << selected->first << ' ' << selected->second << '\n';
    std::cout << readings.size() << '\n';
}
```

输出为 `10 240` 和 `3`。`reserve(3)` 为总共三个元素准备桶，包含已经存在的那一个。`selected` 在预留完成后取得；随后只新增两个元素，因此这里可以继续使用它。把 `reserve(3)` 移到取得 `selected` 之后，就不能再用这条推理保证旧位置有效。

也要区分新增元素与修改已有值。`try_emplace` 遇到已有等价键时不作修改；`insert_or_assign` 遇到已有等价键时只给映射值赋值；访问已有键的 `[]` 也不会新增元素。这些分支不会因为增加元素数量而触发重哈希，但同一个调用换成缺失键时，插入分支就需要重新判断。

## 迭代器有效，不代表遍历内容被冻结

即使预留足够，迭代器可以继续使用，也不能把正在进行的遍历当作插入前元素集合的快照。新记录可能改变后续会遇到哪些元素；无序容器没有按键顺序，更不能通过新键的大小推测它会出现在当前位置之前还是之后。

> [!WARNING]
> 边遍历同一个 `unordered_map` 边插入，既要处理可能的迭代器失效，也要定义是否处理新插入的记录。若业务要求只处理原有记录，可以先把待新增内容收集到另一个容器，结束遍历后再统一插入；仅调用 `reserve` 不能建立“只遍历原有记录”的保证。

删除则有不同的契约。`erase` 只使指向被删元素的迭代器、引用和指针失效，其他元素的访问仍然有效，剩余元素之间的相对遍历顺序也保留。

`erase(key)` 返回删除数量，对 `unordered_map` 是 `0` 或 `1`。`erase(position)` 要求传入当前容器中有效、可解引用的位置，不能传入 `end()`；它返回被删元素在原遍历次序中的后继，没有后继时返回 `end()`。这里的“后继”是遍历关系，不表示数值更大的键。

因此，按条件遍历删除时，可以继续采用[删除分支接收返回位置、保留分支才递增](../26-keyed-data-and-ordered-maps/05-erasure-and-map-access-validity.md#删除当前位置后接住返回的后继)的方式：执行 `position = readings.erase(position)` 后，从新位置继续检查，而不是对被删位置再执行 `++position`。

## 元素稳定仍有对象范围

`clear()` 删除所有元素，返回 `void`。完成后容器仍然存在，但原来指向元素的迭代器、引用和指针全部失效。容器销毁后同样如此；重哈希保留引用的保证不能延长元素的生命期。

映射值内部的借用也要单独判断。例如，`unordered_map<int, std::string>` 的某个元素保持有效，给它的字符串重新赋值仍可能使旧字符指针和旧 `string_view` 失效。元素的稳定性保证没有覆盖字符串所管理的字符；这部分仍受[字符串修改后的有效性规则](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md#修改字符串后不沿用旧借用的有效性假设)约束。

## 根据访问方式选择容器

`map`、`unordered_map` 与 `vector` 的区别不只在查找复杂度。它们也决定数据如何遍历、哪些访问可以跨越修改保留，以及程序是否需要额外维持顺序。

| 主要需求 | 可以优先考虑的组织方式 |
| --- | --- |
| 按唯一键反复查找和更新，不需要键顺序，能够提供一致且分布合适的哈希 | `unordered_map`；保存迭代器跨越插入时还需安排预留或重新查找 |
| 按键顺序遍历、按边界查询，或需要插入后始终保留已有元素的迭代器 | `map` |
| 主要连续扫描，或集中建立后进行排序与查找 | `vector` 与对应算法；持续插入时需考虑顺序维护及访问失效 |

> [!PRACTICE]
> 平均常数级查找给出了随元素数量增长的成本模型，不等于每次查找都比对数级查找快。键的哈希与比较成本、数据分布、内存占用以及实际增删频率都会影响结果。先选择满足顺序和有效性要求的容器，再用实际数据验证性能；不要为了复杂度符号更小而放弃程序需要的接口保证。

## 参考资料

- [C++23 工作草案：无序关联容器的重哈希、插入与删除有效性](https://timsong-cpp.github.io/cppwp/n4950/unord.req)
- [C++23 工作草案：无序映射的插入与赋值](https://timsong-cpp.github.io/cppwp/n4950/unord.map.modifiers)
- [C++23 工作草案：字符串修改与字符访问失效](https://timsong-cpp.github.io/cppwp/n4950/string.require)
