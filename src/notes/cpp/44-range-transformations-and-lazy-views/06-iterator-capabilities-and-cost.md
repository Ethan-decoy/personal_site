---
title: 迭代能力与算法成本（Iterator Capabilities and Algorithm Cost）
date: 2026-10-08
order: 6
---

# 迭代能力与算法成本（Iterator Capabilities and Algorithm Cost）

同样写作“迭代器”，并不意味着每种位置都可以常数时间跳转或反复遍历。算法要求和成本需要结合迭代能力判断。

## 能力层级限制合法操作

`<iterator>` 中的迭代器概念（Iterator Concept）描述遍历能力。下面是本章需要的区别：

| 能力 | 关键保证 |
| --- | --- |
| input_iterator | 可读取并向前推进；不能统一假定多次独立遍历 |
| forward_iterator | 增加多遍遍历保证，位置副本可用于相应独立遍历 |
| bidirectional_iterator | 增加向后推进 |
| random_access_iterator | 增加规定的常数时间偏移与位置距离操作 |
| contiguous_iterator | 在随机访问基础上建立连续对象地址关系 |

对普通 vector<int> 的迭代器，随机访问与连续性都成立。filter 筛选位置后，即使基础数据连续，也不能把“下一个匹配项”当作下一块连续地址，或假定能够常数时间跳过任意数量的匹配项。

## 比较次数和推进次数分别统计

有序查找在某些前向范围中仍能用对数数量的比较，却需要线性规模的迭代器推进。`std::distance` 在随机访问位置上可以直接求差，在一般前向位置上可能逐步计数。

例如，已知当前范围有 8 项，索引从 0 开始。要比较索引 4 的中间项，先得取得那个位置：

| 可用能力 | 取得中间位置的工作 | 随后的值比较 |
| --- | --- | --- |
| 随机访问 | 从 `first` 作 `first + 4`，偏移具有常数时间保证 | 比较该位置的值 |
| 仅前向访问 | 复制起点位置，再逐步递增 4 次 | 同样只比较该位置的值 |

这一次比较之前，两种范围已经付出了不同的定位成本。缩小候选范围能减少需要比较的中间项数量，但不会为前向迭代器增加直接跳转能力；获取初始距离也可能需要推进。于是，**比较次数的对数界与推进次数的线性界可以同时成立**。这里仅解释一次中点定位，不承诺某个库实现完整查找的固定操作次数。

对有序映射，容器成员查找利用自身索引组织；把全部条目交给通用迭代器算法，不自动保留这份内部定位能力。

> [!IMPORTANT]
> 算法复杂度约束的是具体操作次数，并依赖可用迭代能力。少量比较不等于少量遍历，连续来源也不等于适配结果仍连续。

## 参考资料

- [C++23 工作草案：迭代器概念](https://timsong-cpp.github.io/cppwp/n4950/iterator.concepts)
- [C++23 工作草案：distance](https://timsong-cpp.github.io/cppwp/n4950/iterator.operations)
- [C++23 工作草案：lower_bound](https://timsong-cpp.github.io/cppwp/n4950/lower.bound)
