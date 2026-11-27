---
title: 固定长度序列与数组对象（Fixed-Size Sequences and Array Objects）
date: 2026-09-15
order: 1
---

# 固定长度序列与数组对象（Fixed-Size Sequences and Array Objects）

一台设备有三个固定的压力采样位置，每次记录都包含三个以千帕（kPa）为单位的读数。读数可以更新，位置数量是记录结构的一部分。怎样让类型本身规定一份记录始终包含三个元素？

固定长度序列（fixed-size sequence）把数量作为对象结构的一部分。标准库在 `<array>` 中提供 `std::array`，用一个数组对象保存这组元素。

## 元素数量写在类型中

`std::array<double, 3>` 是一个具体类型，表示保存三个 `double` 元素的数组对象。尖括号中的两个模板实参（template argument）分别提供元素类型和数量。

> [!IMPORTANT] 数组类型决定元素数量
> 在 `std::array<T, N>` 中，`T` 是元素类型，`N` 是元素数量。每个数组对象都拥有恰好 `N` 个元素，`size()` 始终返回 `N`。改变 `T` 或 `N` 会得到不同类型。能否修改元素还取决于元素类型和访问时的 `const` 限定。

数量参数的类型是 `std::size_t`。用整数指定长度时，该值须在编译期确定，并且能无窄化地转换为 `std::size_t`。例如，用 `constexpr unsigned int sensor_count{3};` 声明数量后，`std::array<double, sensor_count>` 与 `std::array<double, 3>` 是同一类型。

`operator[]` 按从零开始的下标访问元素。有效下标 `i` 须同时满足 `0 <= i` 和 `i < size()`，在三个元素的数组中就是 `0`、`1` 和 `2`。C++23 中，越界使用 `operator[]` 会导致未定义行为。

下面的程序用 `samples[1]` 更新第二个读数，再用范围 `for` 按顺序读取全部元素。

```cpp
#include <array>
#include <iostream>

int main() {
    std::array<double, 3> samples{240.0, 242.0, 244.0};
    samples[1] = 243.0;

    std::cout << samples.size() << '\n';

    for (const double value : samples) {
        std::cout << value << '\n';
    }
}
```

程序依次输出 `3`、`240`、`243`、`244`。第二个元素的值更新为 `243`，三个采样位置仍各有一个读数。

需要追加元素时，可以使用 `std::vector` 的 `push_back`。对 `std::vector` 调用 `reserve(3)` 是为至少三个元素预留容量。`std::array<double, 3>` 的长度 `3` 表示对象实际拥有的元素数量。

## 初始化值不足，不会缩短数组

`std::array` 支持聚合初始化（aggregate initialization）。花括号中的初值按顺序初始化元素。对于这里的 `double` 元素，未显式提供初值的元素按空初始化列表初始化，得到 `0.0`。

下面的片段可以放入包含 `<array>` 和 `<iostream>` 的程序的 `main` 函数中。

```cpp
const std::array<double, 3> record{240.0};
const std::array<double, 3> zeros{};

std::cout << record.size() << ' ' << record[0] << ' ' << record[1] << ' ' << record[2] << '\n';
std::cout << zeros.size() << ' ' << zeros[0] << '\n';
```

输出依次为 `3 240 0 0` 和 `3 0`。`record` 的第一个元素使用给出的初值，其余两个元素补足为零。`zeros` 的三个元素都按空初始化列表初始化。两个数组的元素数量都由类型中的 `3` 决定，给出超过三个初值会编译失败。

> [!WARNING] 读取未初始化的 double 元素会导致未定义行为
> 对自动存储期的局部数组，写成 `std::array<double, 3> samples;` 时，三个 `double` 元素的值不确定。在 C++23 中，给某个元素写入值之前读取它的值会导致未定义行为。需要从三个零值开始时，使用 `std::array<double, 3> samples{};`。其他元素类型的初始化效果由各自的规则决定。

## 元素随数组对象一起存在

元素按下标顺序连续存放，它们的存储是数组对象的一部分。销毁数组对象时，它的元素也随之销毁。

`std::vector` 对象管理另外取得的元素存储。`std::array` 对象自身提供元素的存储，元素是否另外管理资源取决于元素类型。

数组对象可以是局部对象、动态对象或其他对象的成员。元素存放的位置随数组对象的位置而定。

对于非空数组，复制构造用源数组的对应元素初始化目标元素，复制赋值用源元素给已经存在的目标元素赋值。这两项操作分别要求元素支持相应的复制操作。下面用 `double` 元素演示先复制一份读数快照，再用原记录更新这份快照。

```cpp
#include <array>
#include <iostream>

int main() {
    const std::array<double, 3> source{240.0, 242.0, 244.0};
    std::array<double, 3> snapshot{source};
    snapshot[0] = 250.0;

    std::cout << source[0] << ' ' << snapshot[0] << '\n';

    snapshot = source;
    std::cout << source[0] << ' ' << snapshot[0] << '\n';
}
```

程序先输出 `240 250`。两个数组各有自己的元素，修改 `snapshot[0]` 只更新快照的第一个读数。随后赋值把 `source` 的读数写入 `snapshot` 中已有的元素，程序输出 `240 240`。

上例的 `source` 带有 `const`。若包含 `<utility>` 后改用 `std::move(source)` 初始化 `snapshot`，所得将亡值仍[保留 `const` 限定](../17-rvalue-references-and-move-semantics/02-std-move-and-expression-category-conversion.md#转换不会移除-const)。这里可以绑定到复制构造函数的 `const` 左值引用形参，因此选中复制构造。

实际调用数组的移动构造时，也按[成员逐项移动的规则](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#默认移动把成员分别交给相应操作)从源数组的对应元素初始化目标元素。源、目标两组元素各自位于所属的数组对象中。对 `double`，目标元素从对应的源元素取得读数值。

例如，`std::array<std::unique_ptr<int>, 1>` 支持移动构造和移动赋值。当源元素拥有动态对象时，移动会把所有权转交给目标元素，两个数组仍各有一个所有者元素。由于元素的复制操作已删除，这个数组的复制构造和复制赋值也不可用。

## 空数组与下标边界

`std::array<double, 0> empty_samples{};` 创建一个合法的空数组对象。它的 `size()` 为零，`empty()` 为 `true`，范围 `for` 不执行循环体。空数组没有任何有效下标，使用 `empty_samples[0]` 也会越界。

> [!PRACTICE] 按长度约束选择 array 或 vector
> 如果元素数量在编译时确定，并且这个数量就是数据结构的一部分，`std::array` 能直接表达约束。数量来自运行时或需要增减时，`std::vector` 更符合需求，即使某个具体对象创建后恰好不再改变长度。
>
> 两者都拥有元素，按值复制都可能涉及整组数据。函数只需要读取一组连续元素时，可以通过[连续范围借用](02-borrowing-contiguous-ranges-with-span.md#按值接收视图借用调用方的数据)表达访问需求，让接口不必绑定某一种拥有者类型。

## 参考资料

- [C++23 工作草案：array 的固定长度与聚合性质](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
- [C++23 工作草案：非类型模板实参](https://timsong-cpp.github.io/cppwp/n4950/temp.arg.nontype#2)
- [C++23 工作草案：序列容器的下标访问条件](https://timsong-cpp.github.io/cppwp/n4950/sequence.reqmts)
- [C++23 工作草案：array 的构造、复制与赋值](https://timsong-cpp.github.io/cppwp/n4950/array.cons)
- [C++23 工作草案：聚合初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：零长度的 array](https://timsong-cpp.github.io/cppwp/n4950/array.zero)
