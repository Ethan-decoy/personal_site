---
title: 连续存储与指针运算（Contiguous Storage and Pointer Arithmetic）
date: 2026-09-15
order: 2
---

# 连续存储与指针运算（Contiguous Storage and Pointer Arithmetic）

连续范围可以用起点和元素数量描述。元素指针提供访问位置。要判断可以从这个位置移动多远，还需要知道指针所属数组的边界和当前位置。

指针运算（pointer arithmetic）按同一数组中的元素位置计算。用指针和数量构造 `std::span` 时，也需要根据原范围的边界判断可以借用哪些元素。

## 从连续范围取得元素指针

对于本篇使用的 `std::array<double, N>`、`std::vector<double>` 和 `std::span<double>`，成员函数 `data()` 提供底层连续元素的指针。范围非空时，返回值指向其第一个元素。调用 `data()` 不复制元素，不转移所有权，也不延长元素的生命周期。

`array`、`vector` 的可修改对象通过 `data()` 提供 `double*`，对应的 `const` 对象提供 `const double*`。`span` 则延续[视图与元素的两层只读关系](../03-copying-views-and-element-access.md#视图对象的只读与元素的只读)：`std::span<double>` 的 `data()` 返回 `double*`，即使视图对象本身带有 `const`；`std::span<const double>` 返回 `const double*`。

范围为空时，其中没有可访问的元素；但 `data()` 仍可能保留一个位置，例如截取出的空子范围可以保留指向原序列某个元素的指针。因此，应使用 `empty()` 或 `size()` 判断范围是否包含元素，不能只检查 `data() != nullptr`。原始指针能否解引用，取决于它是否指向仍然有效的对象，空范围本身不提供这项保证。

## 偏移按元素位置计算

指针的偏移按元素计。数组至少有三个元素，且 `first` 指向首元素时，`first + 1` 指向第二个元素，`first + 2` 指向第三个元素。

如果 `first` 指向一个含有 `N` 个元素的数组的首元素，`first + N` 得到尾后指针（past-the-end pointer），定位紧接最后一个元素之后的边界。

> [!IMPORTANT] 指针偏移受同一数组边界约束
> 对指向数组元素或尾后位置的元素指针，把距同一数组首元素的零基偏移记为 `i`，数组的元素数量记为 `N`。加上或减去整数 `k` 之前，须确认数学位置 `i + k` 或 `i - k` 落在 `[0, N]` 内。`[0, N)` 中的位置对应数组元素，解引用还要求该元素仍然有效。位置 `N` 表示尾后边界。

在含有四个元素的数组中，从首元素指针 `first` 可推得下面这些位置。

| 表达式 | 结果所表示的位置 | 能否通过结果访问该数组元素 |
| --- | --- | --- |
| `first`、`first + 0` | 第一个元素 | 可以 |
| `first + 2` | 第三个元素 | 可以 |
| `first + 4` | 尾后位置 | 不可以 |
| `first + 5`、`first - 1` | 超出允许形成的位置 | 运算本身具有未定义行为 |

若 `finish` 是非空数组的尾后指针，`finish - 1` 从位置 `N` 回到 `N - 1`，指向最后一个元素。

> [!WARNING]
> 指针越过允许范围的运算，并不需要等到解引用才出错。对四元素数组的首元素指针计算 `first + 5` 就已经具有未定义行为；先越界再减回来，也不能恢复这段计算的合法性。

## 指针差给出元素间隔

指向同一数组的元素或尾后位置的两个指针可以相减，结果以元素数计。对于非空数组，尾后指针减去首元素指针得到元素数量，反向相减得到相应的负数。

指针差的结果类型是 `<cstddef>` 中的 `std::ptrdiff_t`，一种有符号整数类型。差值需要能由该类型表示；对于极大的范围，如果差值超出它的范围，即使两个位置属于同一数组，相减仍具有未定义行为。

本节的压力读数以千帕（kPa）为单位。下面的程序用四项读数展示指针偏移和指针差。

```cpp
#include <array>
#include <cstddef>
#include <iostream>

int main() {
    const std::array<double, 4> samples{240.0, 250.0, 260.0, 270.0};
    const double* const first{samples.data()};
    const double* const second{first + 1};
    const double* const finish{first + samples.size()};
    const std::ptrdiff_t remaining{finish - second};

    std::cout << *second << '\n';
    std::cout << *(finish - 1) << '\n';
    std::cout << remaining << '\n';
}
```

程序输出 `250`、`270`、`3`，各占一行。从第二个元素开始，到尾后位置之前，共有三个元素；`finish` 自身没有被解引用，访问的是回退一步后的最后一个元素。

对于这里的有效元素指针，内置下标写法 `first[i]` 与 `*(first + i)` 表达同一个元素访问。这解释了为什么指针也能使用下标，同时说明：**能写下标不代表指针保存了数量，也不代表访问会检查边界。**

## 相邻地址不构成共同数组

两个独立局部变量即使碰巧相邻，也不能通过从第一个变量的指针不断偏移来遍历它们。类中的两个相邻成员也不因此成为同一个数组。允许的运算依赖它们属于哪个对象，不能只从地址的数值距离判断。

对于这种指针运算，一个不属于数组元素的独立对象按一个元素的数组处理。因此，`&sample + 1` 可以形成它的尾后位置，但不能通过这个位置访问另一个独立变量；继续计算 `&sample + 2` 则超出允许范围。

同样，来自两个不同非空数组的元素指针不能相减来“测量两个数组之间的距离”，这种相减具有未定义行为。即使类型相同、数值上看似相邻，也不满足同一数组的前提。

这些运算还依赖原对象仍然有效。`vector` 扩容导致元素迁移后，旧 `data()` 指针就不能继续用于访问或计算原来的元素范围。连续存储说明的是当前元素的排列，不能让旧借用跳过[失效与生命周期规则](../05-range-lifetimes-and-interface-boundaries.md#重新分配会使旧范围失效)。

## 指针与数量可以组成视图，但数量由调用者保证

`std::span<const double>{pointer, count}` 可以从元素指针和数量构造一个只读视图。`pointer` 指定起点，`count` 指定要借用的连续元素数量；构造不复制元素，也不取得所有权。

构造前置条件是 `[pointer, pointer + count)` 为合法范围。先从拥有者或接口约定确认起点及从该位置起的剩余元素数，再用剩余数量核对 `count`。核对通过后才构造视图。元素须在视图的使用期间保持有效。

若从长度为 `size` 的范围按偏移 `offset` 取得起点，可以复用[子范围的边界检查顺序](../04-subranges-and-interval-boundaries.md#检查数量时避免先计算终点)。先确认 `offset <= size`，再确认 `count <= size - offset`。通过两项检查后再计算起始指针。

下面的程序取四项读数中的中间两项。偏移 `1` 对应第二项，从这个位置起还有 `4 - 1 = 3` 项，足以借用两项。

```cpp
#include <array>
#include <iostream>
#include <span>

int main() {
    const std::array<double, 4> samples{240.0, 250.0, 260.0, 270.0};
    const double* const first{samples.data()};
    const std::span<const double> middle{first + 1, 2};

    for (const double value : middle) {
        std::cout << value << '\n';
    }
}
```

程序输出 `250` 和 `260`。若把借用数量改成 `4`，请求会超过从第二项起的剩余数量，构造时就会违反前置条件。

数量为零时得到空范围，起点仍须合法。可以保留有效的元素位置或尾后位置，也可以使用相应元素指针类型的空指针。例如，类型为 `const double*` 的空指针加 `0` 仍为空指针，可以作为空范围的两端。没有具体起点需要保留时，可以直接默认构造空 `span`。

> [!PRACTICE]
> 从整个容器借用时，直接用容器构造 `span`，可以避免手工配错起点与数量。截取现有视图时，先按 `subspan` 的前提检查偏移与数量，再截取视图，更容易保持边界关系。当接口本身提供指针与数量时，需要在接入处核对真实范围，再把二者组成视图；组成视图以后，生命周期责任仍然存在。

## 参考资料

- [C++23 工作草案：array 的 data 接口](https://timsong-cpp.github.io/cppwp/n4950/array.members)
- [C++23 工作草案：vector 的 data 接口](https://timsong-cpp.github.io/cppwp/n4950/vector.data)
- [C++23 工作草案：span 的元素访问与 data 接口](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 工作草案：指针加减与指针差](https://timsong-cpp.github.io/cppwp/n4950/expr.add)
- [C++23 工作草案：指针值、尾后位置与对象关系](https://timsong-cpp.github.io/cppwp/n4950/basic.compound)
- [C++23 工作草案：内置下标表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.sub)
- [C++23 工作草案：从指针与数量构造 span](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
