---
title: 排序与元素位置（Sorting and Element Positions）
date: 2026-09-18
order: 1
---

# 排序与元素位置（Sorting and Element Positions）

压力读数按采集先后存入序列，记录的是时间顺序。若要从低到高展示这些读数，需要让已有元素按另一条规则重新排列。排序（sorting）解决的就是这个问题：保留这些值，改变它们在指定区间中的先后。

本篇用 `int` 保存以整千帕计的读数。对于整数，默认排序使用 `<` 确定先后；排序完成后，数值按非递减顺序排列，重复值可以相邻出现，不会被删除。

## 排序需要怎样的区间

头文件 `<algorithm>` 提供 `std::sort`。调用 `std::sort(first, last)`，会重排有效[半开区间](../22-iterators-ranges-and-algorithms/01-iterator-positions-and-half-open-ranges.md#两个位置组成半开区间) `[first, last)` 内的元素；`last` 本身不属于要排序的范围。返回类型是 `void`，排序结果保存在原区间中。

这个接口比逐项查找需要更强的位置操作能力：两个端点必须是同一种随机访问迭代器（random access iterator）。随机访问意味着能够直接按偏移取得位置、计算位置之间的间隔，而不必反复递增，逐个跨过中间元素。

对于这种迭代器，`first + n` 表示向后偏移 `n` 个元素位置，`last - first` 得到有符号的元素间隔数；这些操作具有常量时间的复杂度要求，操作成本不随跨越的距离增长。偏移结果仍须留在允许的范围内，尾后位置仍然不能解引用。`std::vector` 和 `std::array` 的迭代器都具备这种能力；不能把它当作所有迭代器都有的操作。

**能取得位置还不够，元素本身也必须能被重排**：这里要求元素能够从同类型右值完成构造和赋值，并支持交换，也能通过迭代器修改。`vector<int>` 的可写迭代器满足这些要求；通过 `cbegin()`、`cend()` 得到的[只读迭代器](../22-iterators-ranges-and-algorithms/02-copying-iterators-and-element-access.md#只读迭代器与不可改变的位置)不能交给 `sort` 来修改元素。

这些要求不意味着类必须具有移动构造函数和移动赋值运算符；符合条件的[复制操作也可能接收右值](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#没有移动操作也可能接收右值)，完成算法所需的构造与赋值。

## 排序改变位置中的值

下面保存第一个位置，再对整个序列排序：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> samples{250, 240, 245};
    const auto first_position{samples.begin()};

    std::cout << *first_position << '\n';
    std::sort(samples.begin(), samples.end());
    std::cout << *first_position << '\n';

    for (const int value : samples) {
        std::cout << value << '\n';
    }
}
```

前两行分别输出 `250`、`240`；随后遍历输出 `240`、`245`、`250`。`sort` 返回时，这些整数已经重新排列，`samples` 的元素数量和容量没有改变。

在这个正常完成的 `vector<int>` 排序中，`first_position` 仍是有效的第一个位置。它不负责追踪原来的数值 `250`：排序之后，第一个位置保存的是 `240`。保存指向该元素位置的指针或引用，也有同样的区别。

> [!IMPORTANT]
> 排序改变的是元素在区间中的排列。位置仍可访问，不表示它仍代表排序前的那份数据；需要保留采集顺序或记录身份时，不能只依赖旧位置。

排序也可以只作用于容器中的一段合法区间，区间外的元素不参与重排。空区间或只有一个元素的区间本来就有序，同样可以传入。

## 排序的成本与保留原次序

若区间有 `n` 个元素，`std::sort` 的比较次数为 $O(n\log n)$。这里的大 O 记号描述规模增大时的增长上界，不是某次调用的精确次数，更不是运行秒数；`log n` 可以直观理解为把规模反复减半所需的次数。因而这种增长比逐一比较所有元素对所产生的平方级增长更慢。

实际时间还受到单次比较和元素移动成本的影响。整数的比较、搬移很简单；若元素是更复杂的类对象，同样数量的操作可能需要不同的时间。这个比较次数保证也不表示实现完全不需要辅助存储。

排序直接改写原范围。若原来的采集顺序仍有用途，可以先复制容器，再重排副本。下面是放在函数体内、已有 `samples` 时的片段：

```cpp
auto ordered{samples};
std::sort(ordered.begin(), ordered.end());
```

`ordered` 拥有独立的元素，排序它不会重排 `samples`；代价是额外保存并复制这些数据。

> [!PRACTICE]
> 先确定“原来的次序是否仍是数据的一部分”。只需要排序结果时，可以重排原序列；采集顺序和数值顺序都需要保留时，显式保存副本更容易表达这两个用途，也应把复制与存储成本计入选择。

## 参考资料

- [C++23 工作草案：sort 的前提、效果与复杂度](https://timsong-cpp.github.io/cppwp/n4950/sort)
- [C++23 工作草案：随机访问迭代器的操作与复杂度](https://timsong-cpp.github.io/cppwp/n4950/random.access.iterators)
- [C++23 工作草案：排序与比较关系](https://timsong-cpp.github.io/cppwp/n4950/alg.sorting.general)
