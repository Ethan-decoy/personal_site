---
title: 谓词与按条件查找（Predicates and Conditional Search）
date: 2026-09-17
order: 2
---

# 谓词与按条件查找（Predicates and Conditional Search）

`std::find` 用相等比较寻找一个指定值。若要查找“第一个超过上限的压力样本”，目标就不是某个预先知道的数值，而是一条需要对每个元素作出的判断。

接收输入并给出真假判断的操作称为谓词（predicate）。本篇的谓词只接收一个读数，直接返回 `bool`：`true` 表示这个读数符合条件，`false` 表示不符合。谓词描述的是操作承担的角色，不是一种固定的类名。

## 算法提供元素，谓词提供判断

头文件 `<algorithm>` 提供 `std::find_if`。调用 `std::find_if(first, last, pred)`，在有效半开区间 `[first, last)` 中寻找第一个使 `pred(element)` 为真的元素。

这里传给谓词的是元素，概念上相当于 `pred(*current)`，不是迭代器 `current`。返回值仍是迭代器：找到时返回第一个匹配位置，找不到或区间为空时返回本次传入的 `last`。

两个端点需要具有相同的迭代器类型，且组成[合法区间](../22-iterators-ranges-and-algorithms/01-iterator-positions-and-half-open-ranges.md#两个位置组成半开区间)。谓词必须能够接受该区间的元素并产生可作真假判断的结果；直接返回 `bool` 就满足这里的结果要求。端点、谓词的类型由函数模板从实参确定，不需要手写模板实参。

下面把[保存上限的函数对象](01-function-objects-and-call-operators.md)交给算法。读数按值传入 `operator()`，复制一个 `double`，不会修改原元素。

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

struct above_limit {
    double limit_kpa;

    bool operator()(double value) const {
        return value > limit_kpa;
    }
};

int main() {
    const std::vector<double> samples{240.0, 248.0, 252.0};
    const above_limit check{245.0};
    const std::vector<double>::const_iterator found{
        std::find_if(samples.cbegin(), samples.cend(), check)};

    if (found != samples.cend()) {
        std::cout << *found << '\n';
    }

    const above_limit higher_limit{260.0};
    const std::vector<double>::const_iterator missing{
        std::find_if(samples.cbegin(), samples.cend(), higher_limit)};
    std::cout << (missing == samples.cend()) << '\n';
}
```

输出 `248` 和 `1`。第一项查找中，`240.0` 不满足条件，`248.0` 是第一个匹配；`252.0` 也超过上限，却不是返回结果。第二项查找没有任何匹配，因此返回 `samples.cend()`。

传入的是 `check`，让算法可以对元素调用它。若写成 `check(248.0)`，会先得到一个 `bool`；算法随后无法再用这个真假值判断每个元素，因此不满足接口要求。

> [!IMPORTANT]
> 区间决定检查哪些元素，谓词决定一个元素是否符合条件，算法决定如何组织操作和返回结果。改变谓词不会改变 `find_if` 的“第一个匹配或区间终点”契约。

## 判断只读取元素，不改动遍历结构

`find_if` 本身不修改序列。传入的谓词也不能通过参数修改被判断的元素；对于较大的类对象，可以按 `const T&` 接收，保留只读访问并避免复制。

谓词还必须维持算法正在使用的区间。例如，在判断期间对同一个 `vector` 执行 `push_back` 或 `erase`，可能使算法保存的当前位置或结束位置失效。即使谓词最后正确返回了 `bool`，也不能补救被破坏的遍历边界。

> [!WARNING]
> “判断当前元素”不提供修改容器结构的时机。需要删除找到的元素时，先让查找完成，再按容器接口删除；不能在算法仍使用旧区间时从谓词内部改变它。

## 算法接收对象，但不保证使用原对象

这里的 `find_if` 按值接收谓词，执行过程中还允许复制函数对象。`above_limit` 的副本各自保存同样的上限，每次调用只读取配置，所以这些复制不改变判断结果。

若在函数对象内部记录调用次数，再期待查找结束后从传入的原对象读到次数，这个接口就不能提供所需保证。算法可能更新的是副本；也不应把“第几次调用”当作元素的稳定身份。

这是接口的状态传递规则，不表示函数对象不能有状态。保存不变的上限就是状态；关键是接收方复制它之后，行为是否仍然符合预期。

`find_if` 最多进行与区间元素数量相同次数的谓词调用。单次判断成本固定时，最坏工作量随区间长度线性增长；如果一次判断本身要扫描长文本，总成本还包括这部分工作。

> [!PRACTICE]
> 将“某个元素是否符合条件”写成只读取元素和稳定配置的谓词，便于单独理解，也能安全承受算法对它的复制。需要按固定步骤累计状态、执行多种操作时，明确写出的循环可能更容易表达控制流。

## 参考资料

- [C++23 工作草案：find_if 的返回值与复杂度](https://timsong-cpp.github.io/cppwp/n4950/alg.nonmodifying#alg.find)
- [C++23 工作草案：谓词要求与算法对函数对象的复制](https://timsong-cpp.github.io/cppwp/n4950/algorithms.requirements)
