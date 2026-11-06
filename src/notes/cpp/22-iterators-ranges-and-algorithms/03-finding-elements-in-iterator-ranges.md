---
title: 用迭代器区间查找元素（Finding Elements in Iterator Ranges）
date: 2026-09-17
order: 3
---

# 用迭代器区间查找元素（Finding Elements in Iterator Ranges）

在一组采样值中找到指定读数，只需要知道从哪里开始、到哪里停止，以及怎样比较当前元素。拥有数据的对象可以是动态序列，也可以是固定数组；这项查找过程不需要重新实现各自的存储管理。

标准库的算法（algorithm）把这类操作提供为可复用接口。迭代器负责表达访问位置，区间负责限定处理范围，算法则完成查找等工作。本篇用一次按值查找建立这三者的配合方式。

## 查找返回位置，缺失返回区间终点

头文件 `<algorithm>` 提供 `std::find`。调用 `std::find(first, last, value)` 在半开区间 `[first, last)` 中查找第一个与 `value` 相等的元素，返回相应迭代器；没有匹配时，返回传入的 `last`。

`std::find` 通过函数模板（function template）让同一项操作适用于不同的迭代器和目标值类型。这里直接传入三个实参，编译器据此确定所需类型，不需要手写模板实参。两个端点必须使用同一种迭代器类型并组成合法区间，元素与目标值必须能够合法地使用 `==` 做相等判断。返回类型与端点的迭代器类型相同。

| 情况 | 返回位置 | 调用方如何处理 |
| --- | --- | --- |
| 区间内有匹配元素 | 区间中第一个匹配的位置 | 可以按该迭代器的权限读取或修改元素 |
| 区间内没有匹配元素 | `last` | 处理“没有找到”的分支 |
| 区间为空 | `last`，也等于 `first` | 不访问元素，结果同样是没有找到 |

`std::find` 不会修改这里的采样序列，也不复制整个容器。返回值仍然是原元素的位置；调用方随后是否修改元素，由迭代器的访问权限与后续代码决定。

下面先在动态序列中修改第一次匹配，再对固定数组执行同一种查找。`std::array<double, 3>` 也提供 `begin()`、`end()` 及 `const_iterator`：对于这里的 `const` 数组，两个成员返回只读位置，遵循相同的起止规则。

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

输出依次为 `240`、`246`、`245`、`250`、`245`。动态序列有两个 `245.0`，只修改了第一个：这是算法返回“第一个匹配”的结果。固定数组也使用同一个算法名称，但返回的位置属于数组自身，没有先把它转换成 `vector`。

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

`last` 指向第三个元素，所以它在整个容器中仍可解引用，值恰好为 `250.0`；但该元素在查找区间之外。程序打印 `*last` 是为了观察边界指向哪里，没有把它当成本次找到的结果。

如果错误地用 `found != samples.cend()` 判断成功，这里会得到 `true`，从而把范围之外的第三个元素误认为匹配结果。程序甚至可能正常输出目标值，因此不能仅凭输出看起来正确就认定查找范围也正确。

> [!IMPORTANT]
> 查找是否成功，要把结果与**本次传入的终点**比较。整个容器的尾后位置只是终点的一种选择；缩小查找范围后，缺失标记也随之改变。

## 算法统一操作，不接管存储

`std::find` 最多进行与区间元素数量相同次数的相等比较。最坏情况下需要检查全部元素，工作量随范围长度增长；统一接口并不意味着自动获得更快的搜索方式。

位置由调用方传入，合法性也由调用方保证。端点来源不一致或前后颠倒时，算法不能知道正确范围应该是什么；这违反[有效区间的前提](01-iterator-positions-and-half-open-ranges.md#两个位置组成半开区间)，不会转化成正常的“没有找到”。

查找返回后，来源销毁或修改使该位置失效，同样不能继续读取结果。`std::find` 不会为了保存结果而延长容器或元素的生命周期，也不会在容器改变后重新查找同一个值。

文本接口中的[成员 find](../21-text-ownership-and-borrowing/04-searching-and-selecting-text.md#查找结果同时表达位置与缺失)与这里的算法返回形式不同：`text.find('=')` 返回下标或 `npos`；`std::find(first, last, value)` 返回迭代器或本次的 `last`。识别缺失结果，要跟随所使用的接口，不能因为名称相同就混用判断规则。

> [!PRACTICE]
> 操作就是“在这段元素中找第一个相等值”时，标准算法直接表达了意图。需要独立保存查到的数值，可以在确认成功后复制该值；需要继续操作原元素时，保留位置并维持它的有效期。对于已有明确下标语义的文本成员接口，也无需只为统一写法而强行改用迭代器。

## 参考资料

- [C++23 工作草案：find 的比较、返回值与复杂度](https://timsong-cpp.github.io/cppwp/n4950/alg.nonmodifying#alg.find)
- [C++23 工作草案：算法接口与迭代器要求](https://timsong-cpp.github.io/cppwp/n4950/algorithms.requirements)
- [C++23 工作草案：array 的类型与迭代器接口](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
