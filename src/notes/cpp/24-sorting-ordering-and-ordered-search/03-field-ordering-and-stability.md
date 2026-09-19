---
title: 字段排序与稳定性（Field Ordering and Stability）
date: 2026-09-18
order: 3
---

# 字段排序与稳定性（Field Ordering and Stability）

一批压力记录包含传感器编号和读数。按压力从低到高排列后，相同压力的记录仍可能来自不同传感器：它们应当保留收到时的先后，还是继续按编号排列？这需要在比较规则和排序算法中作出明确选择。

## 排序关键字决定哪些记录等价

用于决定记录顺序的字段称为排序关键字（sort key）。下面用 `sample` 表示一条记录，其中 `sensor_id` 保存传感器编号，`pressure_kpa` 保存以千帕为单位的整数读数。按压力排序时，比较器只比较 `pressure_kpa`。

比较器的两个形参采用 `const sample&`：调用时只读取两条记录，不复制或修改它们。返回 `left.pressure_kpa < right.pressure_kpa`，表示左侧记录的压力更低，应排在右侧记录之前。

对于编号为 `3` 和 `1`、读数同为 `245` 的两条记录，无论以哪个方向比较压力，结果都是 `false`。它们在这个规则下[比较等价](02-comparators-and-strict-weak-ordering.md#比较等价不要求值完全相同)，但编号不同，不能因此说两条记录的全部状态相同。

`std::sort` 保证结果符合比较规则，却不保证等价记录保留原有先后。即使某次运行恰好保留了顺序，也不能把这个结果当成接口承诺。

## 稳定排序保留等价记录的输入次序

稳定排序（stable sorting）在排序的同时保留等价元素在输入区间中的相对次序。它保留的是本次排序开始时的先后，并不会从记录内容推断接收时间。

`std::stable_sort` 声明在 `<algorithm>` 中。这里使用 `std::stable_sort(first, last, comp)`：前两个参数指定要重排的半开区间 `[first, last)`，第三个参数提供比较器。它与 `std::sort` 一样需要可写的随机访问区间，元素满足相同的[构造、赋值与交换要求](01-sorting-and-element-positions.md#排序需要怎样的区间)，比较器在该区间的值上满足严格弱序；返回类型为 `void`，成功完成后结果直接保存在原区间中。

它不会为容器增加或删除元素。额外的保证是：对于 `comp(a, b)` 与 `comp(b, a)` 都为 `false` 的两条输入记录，谁原先在前，排序后仍在前。

## 次关键字明确同一组内的顺序

如果要求“压力相同就按传感器编号从小到大排列”，编号便成为次关键字（secondary key），压力是先比较的主关键字（primary key）。比较器应先判断压力是否不同：不同时直接由压力决定；只有压力相同时，才比较编号。

此时编号为 `3` 和 `1`、压力同为 `245` 的两条记录已不再比较等价，编号 `1` 必须在前。使用 `std::sort` 就能表达这个要求。若压力与编号都相同，完整比较器仍将它们视为等价；是否还要保留这些记录的输入次序，仍取决于需求。

下面从同一份输入复制出两个容器，分别展示保留输入次序和按次关键字排列：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

struct sample {
    int sensor_id;
    int pressure_kpa;
};

int main() {
    const std::vector<sample> source{{3, 245}, {2, 240}, {1, 245}, {4, 240}};

    const auto by_pressure = [](const sample& left, const sample& right) -> bool {
        return left.pressure_kpa < right.pressure_kpa;
    };
    std::vector<sample> stable{source};
    std::stable_sort(stable.begin(), stable.end(), by_pressure);

    const auto by_pressure_then_id = [](const sample& left, const sample& right) -> bool {
        if (left.pressure_kpa != right.pressure_kpa) {
            return left.pressure_kpa < right.pressure_kpa;
        }
        return left.sensor_id < right.sensor_id;
    };
    std::vector<sample> ordered{source};
    std::sort(ordered.begin(), ordered.end(), by_pressure_then_id);

    for (const sample& value : stable) {
        std::cout << value.sensor_id << ' ';
    }
    std::cout << '\n';

    for (const sample& value : ordered) {
        std::cout << value.sensor_id << ' ';
    }
    std::cout << '\n';
}
```

输出两行编号序列：

```text
2 4 3 1
2 4 1 3
```

两种结果中，`240` 的记录都在 `245` 的记录之前。第一行的 `3` 仍在 `1` 前面，因为两者按压力比较等价，稳定排序保留了输入次序。第二行则由次关键字决定 `1` 在 `3` 前面。

`source` 保持不变，是因为两次排序操作的是分别复制出的容器。稳定排序本身仍会重排传入区间，不负责保存原数据的另一份副本。

> [!IMPORTANT]
> 比较器决定哪些记录等价；稳定性决定这些等价记录是否保留输入时的相对次序。加入次关键字会改变比较规则，不能与“保留输入次序”互相替代。

## 多字段比较不能简单用或连接

把规则写成 `left.pressure_kpa < right.pressure_kpa || left.sensor_id < right.sensor_id`，会让编号比较越过压力的优先级。

例如 `a` 为编号 `3`、压力 `240`，`b` 为编号 `1`、压力 `245`。按这个错误表达式比较 `a` 与 `b`，压力分支得到 `true`；反过来比较 `b` 与 `a`，编号分支也得到 `true`。它同时要求两条记录排在对方前面，已经违反严格弱序，不能传给排序算法。

正确比较器中的 `if` 使优先级直接可见：压力不同时，立即按压力返回结果；压力相同时，编号才参与判断。这里用 `!=` 判断等价成立，是因为关键字为整数，采用普通的 `<` 比较。若关键字改为其他比较规则，应按那个规则判断等价，不能一律用对象自身的 `==` 或 `!=` 替代。

## 根据所需顺序选择算法

> [!PRACTICE]
> 输入已按接收先后排列，且同一压力下仍需保留这个先后时，按压力使用 `std::stable_sort` 能保留这层信息。若希望输入先后改变时仍按编号决定同一压力下的顺序，应把编号写入比较器。

稳定性也有成本。对这里的三参数 `std::stable_sort` 调用，C++23 在可用额外内存足够时给出 $O(n\log n)$ 次比较的保证；额外内存不足时，比较次数上界放宽为 $O(n\log^2 n)$。这里的 $n$ 是区间元素数，描述的是比较次数，不是完整运行时间。性能敏感时还应考虑临时存储以及记录移动的成本，不能仅凭算法名称判断哪一种更快。

## 参考资料

- [C++23 工作草案：排序中的比较关系与等价](https://timsong-cpp.github.io/cppwp/n4950/alg.sorting)
- [C++23 工作草案：稳定算法的语义](https://timsong-cpp.github.io/cppwp/n4950/algorithm.stable)
- [C++23 工作草案：stable_sort 的前提与复杂度](https://timsong-cpp.github.io/cppwp/n4950/stable.sort)
