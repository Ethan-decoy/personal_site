---
title: 连续范围与 span 借用（Contiguous Ranges and Borrowing with span）
date: 2026-09-15
order: 2
---

# 连续范围与 span 借用（Contiguous Ranges and Borrowing with span）

计算一组压力读数的平均值时，函数只在计算期间读取样本。这里的读数以千帕（kPa）为单位，可能来自记录固定位置读数的 `std::array`，也可能来自持续采样得到的 `std::vector`。

接收 `const std::vector<double>&` 可以直接读取 `vector` 中的读数。要用同一个函数处理数组和 `vector`，可以让参数接收计算所需的连续元素范围。

## 将连续元素作为一段范围交给函数

连续存储（contiguous storage）表示同类型元素按次序紧邻排列，中间没有额外的元素间隙。`std::array<double, N>` 和 `std::vector<double>` 都以这种方式保存元素。从中选取连续的一段，可以用“从哪里开始”和“共有多少个元素”确定。

标准库在 `<span>` 中提供 `std::span`，用来表达对连续对象序列的借用。本章把这种非拥有视图（non-owning view）简称为视图。

> [!IMPORTANT] 视图借用一段已有元素
> `std::span` 用起始位置和元素数量描述一段连续的访问范围。创建、复制和销毁视图只涉及这份范围记录。元素的存储与生命周期仍由拥有者管理，通过视图访问时，所借用的元素必须仍然有效。

本章使用下面两种写法。模板实参中的元素类型决定如何访问元素，元素数量由各个视图对象记录。

| 类型 | 经由这份视图访问元素 |
| --- | --- |
| `std::span<double>` | 可以读取和修改 `double` 元素 |
| `std::span<const double>` | 可以读取元素，不能经由这份视图修改它们 |

因此，同一个 `std::span<const double>` 类型可以描述三个读数，也可以描述四个读数。

## 从拥有者建立视图

从容器建立覆盖整个序列的视图时，来源须提供连续元素和元素数量。用 `std::array<double, N>` 或 `std::vector<double>` 构造本节的视图，初始长度正是来源当时的元素数量。只读视图可以借用可修改或只读的 `double` 元素，可写视图要求来源提供可修改的 `double` 元素。

`size()` 返回视图描述的元素数量。访问 `view[i]` 时，下标 `i` 须同时满足 `0 <= i` 和 `i < view.size()`。如果视图只覆盖前两个读数，`view[2]` 就会越界，即使拥有者还保存着第三个读数。C++23 中，超出视图范围的下标访问具有未定义行为。

下面的程序从数组和 `vector` 建立视图。它通过可写视图更新数组的第二个读数，再通过只读视图读取范围长度和第一个读数。

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

输出为 `243` 和 `4 230`。`writable[1]` 指定的就是 `fixed_samples[1]`，赋值更新的是原数组中的元素。`readable` 借用的是 `recorded_samples` 中原有的四个读数。

这里的 `recorded_samples` 是 `const` 对象，以它构造 `std::span<double>` 会因元素只读而编译失败。视图借用的是现有元素本身，因此用 `std::vector<int>` 构造 `std::span<const double>` 也会因元素类型不匹配而编译失败。

## 按值接收视图，借用调用方的数据

函数参数写成 `std::span<const double> samples`，表示按值接收一份只读视图。函数体通过这份视图读取调用方维持的那组元素。

按值的 `std::vector<double>` 形参本身是元素的拥有者。以同类型的 `vector` 左值传参会复制元素。以非 `const` 的同类型 `vector` 将亡值传参时，形参由移动构造建立。

`std::span<const double> empty{};` 创建一份空视图。它的 `size()` 为零，`empty()` 返回 `true`。空视图没有有效下标，范围 `for` 不执行循环体。空视图可以作为实参，怎样处理空输入由接口决定。下面的平均值函数用 `empty()` 检查范围，遇到空输入时抛出自定义异常 `no_pressure_samples`。

对于非空范围，函数用范围 `for` 累加读数。示例使用少量有限的压力读数，每一步累加结果都在 `double` 的可表示范围内。`size()` 返回无符号数量类型 `size_type` 的值。累加结果 `total` 是 `double`，相除时[通常算术转换](../02-expressions-and-operators/03-usual-arithmetic-conversions.md#转换的是参与运算的值)会把元素数量转换为 `double`。示例用 `static_cast<double>` 明示这一步。

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

每次循环只把当前元素的 `double` 值复制到局部变量 `value`。要通过循环变量修改可写元素，可以用 `double&` 将它绑定到原元素。

## 范围长度不能代替有效期

`size()` 查询的是视图记录的元素数量。通过视图访问之前，还须确认所借用的元素仍然有效。拥有者修改或销毁后的判断见[范围借用的有效期与接口边界](05-range-lifetimes-and-interface-boundaries.md#重新分配会使旧范围失效)。

## 参考资料

- [C++23 工作草案：span 的连续借用模型](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
- [C++23 工作草案：span 的构造与复制](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 工作草案：span 的数量查询](https://timsong-cpp.github.io/cppwp/n4950/span.obs)
- [C++23 工作草案：span 的元素访问](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 工作草案：调用时的形参初始化](https://timsong-cpp.github.io/cppwp/n4950/expr.call#6)
