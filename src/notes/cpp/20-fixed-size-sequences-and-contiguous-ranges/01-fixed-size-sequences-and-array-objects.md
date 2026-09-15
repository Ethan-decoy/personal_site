---
title: 固定长度序列与数组对象（Fixed-Size Sequences and Array Objects）
date: 2026-09-15
order: 1
---

# 固定长度序列与数组对象（Fixed-Size Sequences and Array Objects）

一台设备有三个固定的压力采样位置，每次记录都包含三个读数。读数会改变，位置数量却是数据结构的一部分。`std::vector<double>` 能保存这些值，但它的类型也允许追加元素，不能直接表达“这份记录始终有三个元素”。

固定长度序列（fixed-size sequence）把数量作为对象结构的一部分。标准库在 `<array>` 中提供 `std::array`，让这一组元素能够作为一个完整对象初始化、复制和赋值。

## 元素数量写在类型中

`std::array<double, 3>` 是一个具体类型，表示保存三个 `double` 元素的数组对象。尖括号中的第一个模板实参是元素类型，第二个模板实参是数量值。模板实参（template argument）既可以提供类型，也可以像这里一样提供编译时确定的值。

在 `std::array<T, N>` 这个写法中，`T` 和 `N` 分别代指元素类型与数量；使用时需要换成实际类型和编译时确定的非负整数。例如，`constexpr unsigned int sensor_count{3};` 可以作为数量来源，再声明 `std::array<double, sensor_count>`。运行时读入的数量不能用于决定这个类型的 `N`。

`std::array<double, 3>` 和 `std::array<double, 4>` 是不同类型。数量相同但元素类型不同，也会得到不同类型。

下面的程序创建三个读数，更新中间一个，再按顺序读取全部元素。`size()` 返回元素数量，`operator[]` 按从零开始的下标访问元素；范围 `for` 可以直接遍历整个数组对象。

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

程序依次输出 `3`、`240`、`243`、`244`。`samples[1]` 指定第二个元素，赋值改变这个元素的值，不改变数组的长度。

> [!IMPORTANT]
> `std::array<T, N>` 拥有恰好 `N` 个元素，`size()` 始终为 `N`。固定的是元素数量；元素能否修改，还取决于对象及访问方式是否具有 `const` 限定。

`std::array` 没有用于追加元素的 `push_back`，也不需要通过 `reserve` 预留容量。`std::vector` 的预留容量只是允许容纳更多元素的存储余量；数组类型中的 `N` 已经是对象实际包含的元素数量。

## 初始化值不足，不会缩短数组

`std::array` 支持聚合初始化（aggregate initialization）：花括号中的值按顺序初始化元素。对于这里的 `double` 元素，没有显式提供的值会按空初始化列表初始化，得到 `0.0`。

下面的片段可以放入包含 `<array>` 和 `<iostream>` 的 `main` 中：

```cpp
const std::array<double, 3> partial{240.0};
const std::array<double, 3> zeros{};

std::cout << partial.size() << ' ' << partial[0] << ' ' << partial[1] << ' ' << partial[2] << '\n';
std::cout << zeros.size() << ' ' << zeros[0] << '\n';
```

输出为 `3 240 0 0` 和 `3 0`。`partial` 仍然有三个元素，`zeros` 也有三个元素；空花括号表示这里没有逐项给出初值，不表示数组没有元素。提供超过三个初值则无法编译。

> [!WARNING]
> 对普通局部对象，`std::array<double, 3> samples;` 省略初始化器后，三个 `double` 元素没有确定的初值。在赋值前读取它们的值具有未定义行为。需要初始零值时使用 `samples{}`；其他元素类型的初始化效果应按该类型的规则判断。

## 元素随数组对象一起存在

数组对象自身保存这些元素，元素的存储属于数组对象的一部分。局部数组离开作用域时，其元素也被销毁；数组作为类成员时，元素随这个数组成员一起管理。

这与 `std::vector` 的存储关系不同：`vector` 对象管理另外取得的元素存储。`std::array` 为自身的这组元素提供存储，不需要再为它们单独进行动态分配。元素自身是否另管资源，则取决于元素类型。

数组对象也可以是动态对象或其他对象的成员。因此，`std::array` 表达的是固定数量和元素归属，不能用“它一定在栈上”代替这个模型。

完整对象的复制与赋值，作用于对应元素：

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

程序先输出 `240 250`，再输出 `240 240`。复制构造为 `snapshot` 建立独立的三个元素；之后的赋值把 `source` 的各个元素值赋给 `snapshot` 中已经存在的对应元素。整个过程没有让两个数组共用同一组 `double` 元素。

数组的移动也依照[成员逐项移动](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md)的关系进行。它不会像接管 `vector` 的独立存储那样，把这一整组元素的存储从源对象转交给目标对象；具体可用性与成本取决于元素类型和数量。对 `double` 数组使用 `std::move`，不能因此省去传递各个元素值的工作。

## 空数组与下标边界

`std::array<double, 0>` 是合法类型，表示不含元素的数组对象。它的 `size()` 为零，`empty()` 为 `true`，范围 `for` 不执行循环体。`empty()` 查询的就是元素数量是否为零。

对于任意长度 `N`，有效下标都必须小于 `N`。`N == 0` 时没有任何有效下标；不能因为数组对象本身存在，就读取 `samples[0]`。C++23 中 `operator[]` 不提供越界抛异常的保证，越界访问具有未定义行为。

> [!PRACTICE]
> 如果元素数量在编译时确定，并且这个数量就是数据结构的一部分，`std::array` 能直接表达约束。数量来自运行时或需要增减时，`std::vector` 更符合需求，即使某个具体对象创建后恰好不再改变长度。
>
> 两者都拥有元素，按值复制都可能涉及整组数据。函数只需要读取一组连续元素时，可以通过[连续范围借用](02-borrowing-contiguous-ranges-with-span.md)表达访问需求，让接口不必绑定某一种拥有者类型。

## 参考资料

- [C++23 工作草案：array 的固定长度与聚合性质](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
- [C++23 工作草案：array 的构造、复制与赋值](https://timsong-cpp.github.io/cppwp/n4950/array.cons)
- [C++23 工作草案：聚合初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：零长度的 array](https://timsong-cpp.github.io/cppwp/n4950/array.zero)
