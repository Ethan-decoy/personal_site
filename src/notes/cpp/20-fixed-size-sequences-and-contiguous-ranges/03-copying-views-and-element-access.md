---
title: 视图的复制与元素访问（Copying Views and Accessing Elements）
date: 2026-09-15
order: 3
---

# 视图的复制与元素访问（Copying Views and Accessing Elements）

`std::array` 拥有自己的元素。复制构造在新数组中建立一组元素，复制赋值作用于目标数组中已有的元素。`std::span` 保存的是对一段连续元素的访问关系。复制、赋值或声明 `const` 时，视图记录和它访问的元素分别会受到什么影响？

本节使用的 `std::span<double>` 和 `std::span<const double>` 都由视图对象记录元素数量。视图的构造和下标访问条件见[借用连续范围](02-borrowing-contiguous-ranges-with-span.md#从拥有者建立视图)。

## 复制视图会保留同一段访问关系

> [!IMPORTANT] 复制视图建立独立的范围记录
> 复制构造 `span` 会建立一份新的范围记录，起点和元素数量取自源视图。给已有视图赋值时，用右侧视图的起点和数量更新左侧视图的记录。其他视图各自保留自己的记录。

`span` 的复制构造和复制赋值只处理范围记录，时间复杂度都是常数。两个视图借用同一个有效元素时，通过其中一个可写视图更新该元素，另一个视图也能读到更新后的值。

下面的程序用 `samples` 和 `backup` 分别保存三项和两项压力读数，单位为千帕（kPa）。两个数组都存活到 `main` 结束。`alias` 是一个 `const std::span<double>`，它保留初始化时的范围，通过下标访问取得的仍是 `double&`。

```cpp
#include <array>
#include <iostream>
#include <span>

int main() {
    std::array<double, 3> samples{240.0, 250.0, 260.0};
    std::array<double, 2> backup{310.0, 320.0};
    std::span<double> current{samples};
    const std::span<double> alias{current};

    alias[1] = 251.0;
    std::cout << current[1] << ' ' << samples[1] << '\n';

    current = std::span<double>{backup};
    alias[2] = 261.0;
    std::cout << current.size() << ' ' << current[0] << '\n';
    std::cout << alias.size() << ' ' << samples[2] << '\n';
}
```

程序依次输出下面三行。

```text
251 251
2 310
3 261
```

第一次修改通过 `alias` 到达 `samples` 的第二项，因此 `current` 和数组本身都读到 `251`。随后给 `current` 赋值，它开始访问 `backup`，长度也变成了 `2`。

`alias` 仍借用 `samples` 的三个元素，所以通过它写入的 `261` 落在 `samples[2]`。

对非空数组进行整数组复制赋值，要求源和目标的数组类型相同，并且元素支持复制赋值。本例的两个数组长度不同，`backup = samples` 会编译失败。若要复制部分读数，应明确源范围和目标位置，并在可用的元素范围内逐项赋值。

## 视图对象的只读与元素的只读

上面的 `alias` 带有顶层 `const`，这个限定作用于视图对象本身，禁止通过赋值更换它记录的范围。`operator[]` 是 `const` 成员函数，可以在 `alias` 上调用。返回的引用由模板实参决定，这里的元素类型是 `double`，所以 `alias[index]` 得到 `double&`。

`std::span<const double>` 的元素类型是 `const double`，下标访问得到 `const double&`。这种限定提供只读元素访问。可赋值的视图对象仍然可以改为记录另一段范围。

| 声明形式 | 能否给视图赋值，更换范围 | 能否通过视图修改元素 |
| --- | --- | --- |
| `std::span<double>` | 能 | 能 |
| `const std::span<double>` | 不能 | 能 |
| `std::span<const double>` | 能 | 不能 |
| `const std::span<const double>` | 不能 | 不能 |

用可写视图构造只读元素视图时，新视图保留相同的起点和数量，继续借用原来的元素。反过来，用 `std::span<const double>` 构造 `std::span<double>` 会因元素的 `const` 限定而编译失败。

```cpp
#include <array>
#include <iostream>
#include <span>

int main() {
    std::array<double, 2> samples{240.0, 250.0};
    const std::array<double, 2> backup{310.0, 320.0};
    const std::span<double> writable{samples};
    std::span<const double> observed{writable};

    writable[0] = 245.0;
    std::cout << observed[0] << '\n';

    observed = std::span<const double>{backup};
    std::cout << observed[0] << '\n';
}
```

输出为 `245` 和 `310`，各占一行。`observed` 最初借用 `samples`，所以能读到经由 `writable` 写入的 `245`。赋值后，它改为借用 `const` 数组 `backup`，读到该数组的第一个值 `310`。

在 `observed` 的声明之后、`writable[0] = 245.0;` 之前，分别插入下面的一条语句来验证失败。此时两个视图都借用可修改的 `samples`。第一条给视图赋值，第二条给元素赋值，各自违反一层 `const` 限制。

```cpp
writable = std::span<double>{samples}; // 错误：不能给 const 视图对象赋值
observed[0] = 315.0;                   // 错误：不能通过 const double& 修改元素
```

> [!WARNING]
> `std::span<const double>` 的只读限制只作用于这份访问入口。其他合法入口仍可修改可写的源元素。只要借用继续有效，从视图读到的就是元素的当前值，把视图当成读数快照可能读到后来更新的值。

## 参数类型表达哪一层限制

函数按值接收 `span` 时，形参有自己的范围记录。给形参赋值只会更新这份记录。

形成函数类型时，[按值形参的顶层 `const`](../12-function-overloading-and-overload-resolution/01-overloaded-functions-and-overload-sets.md#按值参数的顶层-const-不形成重载)会被去掉。因此 `void update(std::span<double> samples);` 和 `void update(const std::span<double> samples);` 声明的是同一个函数。函数定义若采用后一种写法，形参本身不能重新赋值，仍能通过它取得 `double&`。`std::span<const double>` 的 `const` 属于元素类型，形成的形参类型不同，通过它取得的是 `const double&`。

> [!PRACTICE] 按元素访问需求选择形参
> 函数只读取被借用的元素时，用 `std::span<const T>` 作形参。需要就地修改这些元素时，用 `std::span<T>`。

## 参考资料

- [C++23 草案：span 的复制、赋值与转换构造](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 草案：span 的元素访问](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 草案：span 的职责与操作复杂度](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
- [C++23 草案：形成函数类型时的形参限定](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
