---
title: 等价元素区间与比较方向（Equivalent Ranges and Comparison Direction）
date: 2026-09-18
order: 5
---

# 等价元素区间与比较方向（Equivalent Ranges and Comparison Direction）

读数序列可能含有多个相同值，按某个字段排序的记录也可能形成同键的一组。若要处理整组数据，只知道第一个匹配位置还不够，还需要知道这组元素到哪里结束。

在按同一严格弱序排好的区间中，[比较等价](02-comparators-and-strict-weak-ordering.md#比较等价不要求值完全相同)的元素相邻。分别找到这一组的起点和尾后位置，就能用一个半开区间表示整组。

## 两个边界使用相反方向的比较

头文件 `<algorithm>` 提供带比较器的 `std::lower_bound(first, last, target, comp)` 和 `std::upper_bound(first, last, target, comp)`。它们只读取区间，返回迭代器，不修改元素；没有对应边界元素时，返回传入的 `last`。

两者都要求端点类型相同，支持[前向迭代器的多遍遍历](04-lower-bound-and-search-preconditions.md#查找的是分界位置)，并组成有效区间；`vector` 的迭代器满足要求。本篇让整个区间事先按 `comp` 定义的严格弱序排列，这同时满足两个算法的分区前提。

| 算法 | 返回的位置 | 默认升序整数中的含义 |
| --- | --- | --- |
| `lower_bound` | 第一个使 `comp(element, target)` 为假的位置 | 第一个不小于目标的元素 |
| `upper_bound` | 第一个使 `comp(target, element)` 为真的位置 | 第一个大于目标的元素 |

这里的 `element` 表示区间中的元素，不是迭代器。`lower_bound` 越过所有“应在目标前面”的元素；`upper_bound` 越过所有“不应在目标后面”的元素，直到遇到目标应排在它前面的那个元素。

从最低前提看，`lower_bound` 要求 `comp(element, target)` 为真的元素在前、为假的在后；`upper_bound` 要求 `!comp(target, element)` 为真的元素在前、为假的在后。整体按同一规则有序，使这两种分区对每个合法查询目标都成立，并让两个边界围住完整的等价组。

> [!IMPORTANT]
> 在按同一比较关系有序的区间中，`[lower, upper)` 恰好包含与目标比较等价的元素。`lower` 是这组的起点，`upper` 是这组之后的位置；名字中的“下”和“上”描述顺序边界，不固定表示数值更小或更大。

## 降序中的右边界可以是更小的值

下面先按数值降序排序，再把同一先后规则交给两次查找：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> samples{245, 240, 250, 245};
    const auto before{[](int left, int right) { return left > right; }};
    std::sort(samples.begin(), samples.end(), before);

    const int target{245};
    const auto lower{std::lower_bound(samples.cbegin(), samples.cend(), target, before)};
    const auto upper{std::upper_bound(samples.cbegin(), samples.cend(), target, before)};

    for (auto current{lower}; current != upper; ++current) {
        std::cout << *current << '\n';
    }
    if (upper != samples.cend()) {
        std::cout << *upper << '\n';
    }
}
```

排序后的序列是 `250, 245, 245, 240`。循环输出两个 `245`；最后一行输出 `240`，它是右边界指向的元素，不属于匹配区间。

在本例中，`before(element, target)` 等于 `element > target`，所以左边界越过 `250`，停在第一个 `245`。右边界检查的是 `before(target, element)`，即 `target > element`，直到 `240` 才为真。

若保持同一序列和比较器，只改变目标，边界如下：

| 目标 | 左边界指向 | 右边界指向 | 等价区间 |
| --- | --- | --- | --- |
| `245` | 第一个 `245` | `240` | 两个 `245` |
| `247` | 第一个 `245` | 第一个 `245` | 空区间，位于序列内部 |
| `260` | `250` | `250` | 空区间，位于开头 |
| `230` | `cend()` | `cend()` | 空区间，位于结尾 |

没有等价元素时，两个边界相同，未必都等于容器终点；输入为空时，它们都等于传入的终点。如果整段元素都与目标等价，两个边界分别是 `first` 和 `last`。

## 命中由比较等价决定

只需要判断是否存在等价元素时，不必为了得到真假结果再求右边界。整体有序的前提下，`lower_bound` 已保证：若返回位置 `lower` 不是 `last`，则 `comp(*lower, target)` 为假。再确认反方向 `comp(target, *lower)` 也为假，就建立了比较等价。

因此，存在性的判断可写成 `lower != last && !comp(target, *lower)`。先判断是否为终点，才能安全访问 `*lower`；这里的 `last` 和 `comp` 指本次查找使用的终点与比较器。对于整数 `<` 或 `>`，等价对应数值相等，可以使用 `*lower == target`；按记录的某个字段比较时，不能机械改成整个对象的相等比较。

如果已经求出了两个边界，`lower != upper` 就表示存在等价元素；之后可以直接遍历 `[lower, upper)` 处理整组。

> [!WARNING]
> 排序与边界查找必须使用一致的先后关系。把降序数据交给默认升序查找，或在比较器中改变参与排序的字段，都可能破坏分区前提；这时返回结果不再有可依赖的保证。要求一致的是比较关系，不是必须使用同一个函数对象实例。

两次边界查找各需要对数级比较。在 `vector` 上定位边界的移动成本也为对数级；找到后逐个处理 `k` 个等价元素，仍需访问这 `k` 个元素。快速定位范围不等于整组处理也能省去遍历。

## 参考资料

- [C++23 工作草案：lower_bound 的比较方向与返回边界](https://timsong-cpp.github.io/cppwp/n4950/lower.bound)
- [C++23 工作草案：upper_bound 的比较方向与返回边界](https://timsong-cpp.github.io/cppwp/n4950/upper.bound)
- [C++23 工作草案：二分查找算法的前提与成本](https://timsong-cpp.github.io/cppwp/n4950/alg.binary.search)
