---
title: 用迭代器区间查找元素（Finding Elements in Iterator Ranges）
date: 2026-09-17
order: 3
---

# 用迭代器区间查找元素（Finding Elements in Iterator Ranges）

在一组采样值中找到指定读数，只需要知道从哪里开始、到哪里停止，以及怎样比较当前元素。拥有数据的对象可以是动态序列，也可以是固定数组；这项查找过程不需要重新实现各自的存储管理。

标准库的算法（algorithm）把这类操作提供为可复用接口。迭代器负责表达访问位置，区间负责限定处理范围，算法则完成查找等工作。本篇用一次按值查找建立这三者的配合方式。

## 查找返回位置，缺失返回区间终点

头文件 `<algorithm>` 提供 `std::find`。`std::find(first, last, value)` 在半开区间 `[first, last)` 中查找第一个与 `value` 相等的元素。若 `it` 表示当前检查的位置，匹配条件就是 `*it == value`。

`std::find` 是函数模板（function template）。编译器从实参推导端点的迭代器类型和目标值类型。两个端点必须使用同一种迭代器类型并组成有效区间，返回类型也与端点相同。只要 `*it == value` 合法且结果能用于真假判断，元素和目标值就可以使用不同类型。例如，`double` 元素可以与 `int` 目标值比较。

| 情况 | 返回位置 | 调用方如何处理 |
| --- | --- | --- |
| 区间内有匹配元素 | 区间中第一个匹配的位置 | 可以按该迭代器的权限读取或修改元素 |
| 区间内没有匹配元素 | `last` | 处理“没有找到”的分支 |
| 区间为空 | `last`，也等于 `first` | 不访问元素，结果同样是没有找到 |

> [!IMPORTANT] 查找结果与本次区间的终点
> 在返回位置和终点仍然有效时，把结果 `found` 与**本次传入的 `last`** 比较。`found == last` 表示未命中。确认 `found != last` 后，再按结果迭代器的权限访问匹配元素。

`std::find` 在这里读取原有的采样值。下面先查找动态序列 `samples`，命中后通过可写迭代器修改第一个匹配值。对 `const` 数组 `reference`，`begin()`、`end()` 返回只读迭代器，因此查找结果也提供只读访问。

```cpp
#include <algorithm>
#include <array>
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0, 245.0, 250.0};
    const std::vector<double>::iterator found{std::find(samples.begin(), samples.end(), 245.0)};
    if (found != samples.end()) {
        *found = 246.0;
    }

    for (const double value : samples) {
        std::cout << value << '\n';
    }

    const std::array<double, 3> reference{240.0, 245.0, 250.0};
    const std::array<double, 3>::const_iterator match{
        std::find(reference.begin(), reference.end(), 245.0)};
    if (match != reference.end()) {
        std::cout << *match << '\n';
    }
}
```

前四行打印更新后的 `samples`，依次为 `240`、`246`、`245` 和 `250`。两个 `245.0` 中，先匹配的是第二个元素，`*found = 246.0;` 更新了这一项。最后一行 `245` 来自 `reference` 中命中的元素。

这些示例直接查找写入的整值 `double`，使用普通的精确相等比较。`std::find` 不会替浮点测量值引入容差，也不会猜测业务中的“足够接近”意味着什么。

## 子区间的终点也承担缺失标记

查找范围不必覆盖整个容器。若只允许检查前两个采样值，可以把第三个元素的位置作为 `last`；第三个元素不参与比较，即使它恰好等于目标值。

下面在三个元素的容器中只查找前两个：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<double> samples{240.0, 245.0, 250.0};
    std::vector<double>::const_iterator last{samples.cbegin()};
    ++last;
    ++last;

    const std::vector<double>::const_iterator found{std::find(samples.cbegin(), last, 250.0)};
    if (found == last) {
        std::cout << "not found in range\n";
    }

    std::cout << (last != samples.cend()) << '\n';
    std::cout << *last << '\n';
}
```

输出为：

```text
not found in range
1
250
```

第一行来自 `found == last` 的未命中分支。后两行显示 `last` 与 `samples.cend()` 不同，并且指向值为 `250.0` 的第三个元素。这个元素位于查找区间之外。

如果改用 `found != samples.cend()` 判断是否命中，比较结果会是 `true`。这时读取 `*found` 恰好会得到目标值 `250.0`，程序就会把区间之外的元素误报为匹配结果。

## 算法统一操作，不接管存储

`std::find` 最多进行与区间元素数量相同次数的相等比较。最坏情况下需要检查全部元素，工作量随范围长度增长；统一接口并不意味着自动获得更快的搜索方式。

调用方必须保证区间有效。用不同容器的位置作为端点，或从 `first` 递增无法到达 `last`，都违反区间的前提。将这样的区间传给 `std::find` 会导致未定义行为。[半开区间的成立条件](01-iterator-positions-and-half-open-ranges.md#两个位置组成半开区间)

查找返回后，来源销毁或修改使该位置失效，同样不能继续读取结果。`std::find` 不会为了保存结果而延长容器或元素的生命周期，也不会在容器改变后重新查找同一个值。

文本成员函数 `text.find('=')` 用下标表示查找位置，缺失时返回 `npos`。`std::find` 返回迭代器，缺失时返回本次传入的 `last`。判断是否找到元素时，按所用接口的返回约定检查结果。[文本查找的位置与缺失标记](../21-text-ownership-and-borrowing/04-searching-and-selecting-text.md#查找结果同时表达位置与缺失)

> [!PRACTICE] 查找后按需复制数值或保留位置
> 操作就是“在这段元素中找第一个相等值”时，标准算法直接表达了意图。需要独立保存查到的数值，可以在确认成功后复制该值；需要继续操作原元素时，保留位置并维持它的有效期。对于已有明确下标语义的文本成员接口，也无需只为统一写法而强行改用迭代器。

## 参考资料

- [C++23 工作草案：find 的比较、返回值与复杂度](https://timsong-cpp.github.io/cppwp/n4950/alg.find)
- [C++23 工作草案：算法接口与迭代器要求](https://timsong-cpp.github.io/cppwp/n4950/algorithms.requirements)
- [C++23 工作草案：无效区间的后果](https://timsong-cpp.github.io/cppwp/n4950/iterator.requirements.general#12)
- [C++23 工作草案：array 的类型与迭代器接口](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
