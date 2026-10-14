---
title: 连续存储与指针运算（Contiguous Storage and Pointer Arithmetic）
date: 2026-09-15
order: 2
---

# 连续存储与指针运算（Contiguous Storage and Pointer Arithmetic）

连续范围可以用“从哪里开始、包含多少个元素”来描述。当接口只提供一个元素指针时，程序怎样定位后面的元素，又怎样判断一个指针是否已经超出允许范围？

指针运算（pointer arithmetic）提供了沿同一数组定位元素的规则。它按元素位置计算，适用范围由真实对象关系决定；一个地址数值能够算出来，并不表示对应的指针运算合法。本篇先建立这层规则，再解释如何把指针与数量接入 `std::span`。

## 从连续范围取得元素指针

对于本篇使用的 `std::array<double, N>`、`std::vector<double>` 和 `std::span<double>`，成员函数 `data()` 提供底层连续元素的指针。范围非空时，返回值指向其第一个元素。调用 `data()` 不复制元素，不转移所有权，也不延长元素的生命周期。

`array`、`vector` 的可修改对象通过 `data()` 提供 `double*`，对应的 `const` 对象提供 `const double*`。`span` 则延续[视图与元素的两层只读关系](../03-copying-views-and-element-access.md#视图对象的只读与元素的只读)：`std::span<double>` 的 `data()` 返回 `double*`，即使视图对象本身带有 `const`；`std::span<const double>` 返回 `const double*`。

范围为空时，其中没有可访问的元素；但 `data()` 仍可能保留一个位置，例如截取出的空子范围可以保留指向原序列某个元素的指针。因此，应使用 `empty()` 或 `size()` 判断范围是否包含元素，不能只检查 `data() != nullptr`。原始指针能否解引用，取决于它是否指向仍然有效的对象，空范围本身不提供这项保证。

## 偏移按元素位置计算

如果数组至少有三个元素，且 `first` 指向首元素，那么 `first + 1` 指向第二个元素，`first + 2` 指向第三个元素。整数表示跨过多少个元素，不是跨过多少个字节；程序不需要手工乘上元素大小。

对于包含 `N` 个元素的数组，`first + N` 表示紧接最后一个元素之后的位置，称为尾后指针（past-the-end pointer）。它可以作为范围终点，但那里没有属于该数组的元素可供解引用。

以四个元素为例：

| 表达式 | 结果所表示的位置 | 能否通过结果访问该数组元素 |
| --- | --- | --- |
| `first`、`first + 0` | 第一个元素 | 可以 |
| `first + 2` | 第三个元素 | 可以 |
| `first + 4` | 尾后位置 | 不可以 |
| `first + 5`、`first - 1` | 超出允许形成的位置 | 运算本身具有未定义行为 |

更一般地，指针已位于第 `i` 个元素时，加上 `k` 表示位置 `i + k`，减去 `k` 表示位置 `i - k`。计算结果必须位于同一数组从首元素到尾后位置的范围内。已经取得尾后指针后，也可以在这个界限内向前移动，例如 `finish - 1` 指向非空数组的最后一个元素。

> [!WARNING]
> 指针越过允许范围的运算，并不需要等到解引用才出错。对四元素数组的首元素指针计算 `first + 5` 就已经具有未定义行为；先越界再减回来，也不能恢复这段计算的合法性。

## 指针差给出元素间隔

同一数组内的两个元素位置，包括尾后位置，可以相减得到它们之间的元素间隔。尾后指针减去首元素指针得到元素数量，反向相减则得到负数。

指针差的结果类型是 `<cstddef>` 中的 `std::ptrdiff_t`，一种有符号整数类型。差值需要能由该类型表示；对于极大的范围，如果差值超出它的范围，即使两个位置属于同一数组，相减仍具有未定义行为。

下面的完整程序把偏移与指针差放在同一个四元素序列中观察：

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

调用者必须已经保证：从该起点开始确实存在这么多个可借用元素，形成的范围合法，并且这些元素在使用视图时仍然存活。这个构造函数不会追踪指针来自哪个容器，再替调用者核验数量。

下面从四元素数组中间借用两个元素：

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

程序输出 `250` 和 `260`。`first + 1` 指向第二个元素，从这里借用两个元素仍在原数组范围内。若把数量改成 `4`，终点就会超过原数组的尾后位置；构造时已经违反前提，不能等到遍历过程中再靠下标检查补救。

数量为零时表示空范围，不访问任何元素；起点可以是合法的范围终点，也可以是相应类型的空指针。零长度不会把任意失效指针变成可安全使用的位置。没有具体起点需要保留时，直接默认构造空 `span` 更清楚。

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
