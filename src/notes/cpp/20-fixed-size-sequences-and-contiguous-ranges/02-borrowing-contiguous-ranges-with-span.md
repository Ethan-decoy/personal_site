---
title: 连续范围与 span 借用（Contiguous Ranges and Borrowing with span）
date: 2026-09-15
order: 2
---

# 连续范围与 span 借用（Contiguous Ranges and Borrowing with span）

计算一组压力读数的平均值，需要访问其中的元素，但不需要负责保存它们。读数可能来自固定位置的 `std::array`，也可能来自持续采样得到的 `std::vector`。

接收 `const std::vector<double>&` 已经能够避免复制容器，但这个参数仍然要求调用方提供 `vector`。如果计算只依赖连续元素及其数量，可以让参数直接表达这段访问范围。

## 将连续元素作为一段范围交给函数

连续存储（contiguous storage）表示同类型元素按次序紧邻排列，中间没有额外的元素间隙。`std::array<double, N>` 和 `std::vector<double>` 都以这种方式保存元素。从中选取连续的一段，可以用“从哪里开始”和“共有多少个元素”确定。

标准库在 `<span>` 中提供 `std::span`，用来表达对连续对象序列的借用。它是一种非拥有视图（non-owning view）：提供对已有数据的访问，本身不承担这份数据的保存与销毁责任。本章简称为视图。

本章使用 `std::span<double>` 和 `std::span<const double>` 两种写法。它们都是具体的类类型，尖括号中的类型说明如何访问元素：

| 类型 | 经由这份视图访问元素 |
| --- | --- |
| `std::span<double>` | 可以读取和修改 `double` 元素 |
| `std::span<const double>` | 可以读取元素，不能经由这份视图修改它们 |

这两种写法把元素数量保存在视图对象中，数量不写入类型。因而，同一个 `std::span<const double>` 类型可以描述三个读数，也可以描述四个读数。

> [!IMPORTANT]
> `span` 表达的是一段已有元素的访问范围，可以理解为记录起始位置和元素数量。创建或复制它不会复制这些元素，也不会取得元素的所有权；销毁视图不会销毁被借用的元素。

这里描述的是判断行为所需的关系，不要求依赖 `span` 的具体内存布局。

## 从拥有者建立视图

可以用已经存在的 `std::array` 或 `std::vector` 初始化一个元素类型兼容的 `span`。这样的构造会借用整个现有序列，初始长度等于来源当时的元素数量。

下面的程序分别借用固定数组与动态序列。`size()` 返回视图描述的元素数量，`operator[]` 从零开始访问其中的元素。

```cpp
#include <array>
#include <iostream>
#include <span>
#include <vector>

int main() {
    std::array<double, 3> fixed_samples{240.0, 242.0, 244.0};
    const std::vector<double> recorded_samples{230.0, 234.0, 238.0, 242.0};

    std::span<double> writable{fixed_samples};
    std::span<const double> readable{recorded_samples};

    writable[1] = 243.0;

    std::cout << fixed_samples[1] << '\n';
    std::cout << readable.size() << ' ' << readable[0] << '\n';
}
```

输出为 `243` 和 `4 230`。`writable[1]` 指定的就是 `fixed_samples[1]`，赋值修改的是原数组中的元素。`readable` 借用四个已有读数，不会为它们再分配一组元素存储。

只读视图可以借用可修改或不可修改的 `double` 序列；可写视图需要来源允许修改。例如，用这里的 `recorded_samples` 构造 `std::span<double>` 会无法编译，因为来源是 `const` 对象。

“元素类型兼容”也不意味着逐个进行数值转换。`std::vector<int>` 不能直接交给 `std::span<const double>`：视图借用的仍是原有对象，不会将一组 `int` 转换为另一组 `double`。

## 按值接收视图，借用调用方的数据

函数参数写成 `std::span<const double> samples`，表示按值接收一份只读视图。传递的是访问范围，函数体内的读取仍然落在调用方维持的那组元素上；这与按值接收 `std::vector<double>` 并复制整组数据的含义不同。

`span` 可以用于范围 `for`。`empty()` 判断它描述的元素数量是否为零，`size()` 的结果使用该类型提供的无符号数量类型 `size_type`。计算平均值时，需要先排除空范围，再将数量显式转换为 `double` 参与除法。

下面的完整程序将“空范围不能计算平均值”设为接口的失败契约，用自定义的空异常类型 `no_pressure_samples` 表示这项失败。示例只处理少量有限的压力读数，累加结果也在 `double` 的可表示范围内。

```cpp
#include <array>
#include <iostream>
#include <span>
#include <vector>

struct no_pressure_samples {};

double average_pressure(std::span<const double> samples) {
    if (samples.empty()) {
        throw no_pressure_samples{};
    }

    double total{};

    for (const double value : samples) {
        total += value;
    }

    return total / static_cast<double>(samples.size());
}

int main() {
    const std::array<double, 3> fixed_samples{240.0, 242.0, 244.0};
    const std::vector<double> recorded_samples{230.0, 234.0, 238.0, 242.0};

    std::cout << average_pressure(std::span<const double>{fixed_samples}) << '\n';
    std::cout << average_pressure(std::span<const double>{recorded_samples}) << '\n';
}
```

程序输出 `242` 和 `236`。调用处显式写出 `std::span<const double>{...}`，表明从相应拥有者建立借用范围，再交给同一个计算函数。函数不需要根据数组长度或拥有者类型编写不同版本。

这里每次循环中的 `const double value` 是一个元素值的局部副本，复制的是当前这个小数值；它不会使整个序列被复制。若函数需要修改原元素，则可以接收 `std::span<double>`，并在范围循环中使用 `double&`。

## 范围长度不能代替有效期

`std::span<const double> empty{};` 创建一份空视图，`size()` 为零，范围 `for` 不执行循环体。空范围可以正常传递与查询；是否接受它，取决于具体接口。上述平均值函数选择抛出异常，其他函数也可以赋予空输入明确的正常结果。

对非空视图，下标仍必须小于其 `size()`。C++23 的 `span::operator[]` 不提供越界抛异常的保证，超出所描述范围的访问具有未定义行为，即使拥有者在那段范围外还保存着其他元素。

> [!WARNING]
> `span` 保存数量，不负责让目标元素继续存在。拥有者销毁或元素存储失效后，即使 `size()` 仍显示原来的数量，也不能继续访问这些元素。只读限定同样不会延长它们的生命周期。

借用期间需要由调用方维持有效的元素，并遵守会使访问失效的操作边界；具体判断见[范围有效期与接口边界](05-range-lifetimes-and-interface-boundaries.md#重新分配会使旧范围失效)。

> [!PRACTICE]
> 函数只需要同步处理一段连续元素时，按值接收 `span` 可以表达“不复制整组数据，也不取得所有权”的接口。读取使用 `span<const T>`，需要修改原元素时使用 `span<T>`。
>
> 如果操作本身需要追加元素，参数就需要表达能够增减元素的拥有者，例如 `std::vector<T>&`。如果需要保存独立快照，则应当建立拥有元素的结果对象。是否使用视图取决于操作需要承担的责任。

## 参考资料

- [C++23 工作草案：span 的连续借用模型](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
- [C++23 工作草案：span 的构造与复制](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 工作草案：span 的数量查询](https://timsong-cpp.github.io/cppwp/n4950/span.obs)
- [C++23 工作草案：span 的元素访问](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
