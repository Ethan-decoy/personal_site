---
title: 视图的复制与元素访问（Copying Views and Accessing Elements）
date: 2026-09-15
order: 3
---

# 视图的复制与元素访问（Copying Views and Accessing Elements）

`std::array` 拥有自己的元素，复制数组会建立另一组元素。`std::span` 保存的是对一段连续元素的访问关系。对它进行复制、赋值或添加 `const` 时，需要分清：操作改变的是视图对象，还是它所访问的元素？

这里使用的 `std::span<double>` 和 `std::span<const double>` 都在运行期间记录范围长度；视图的基本构造与访问契约见[借用连续范围](02-borrowing-contiguous-ranges-with-span.md#从拥有者建立视图)。

## 复制视图会保留同一段访问关系

用一个 `span` 初始化另一个同类型 `span`，新视图保存相同的起点和元素数量。两个视图是不同对象，但它们访问同一组元素。通过其中一个可写视图修改元素，另一个视图也会读到修改后的值。

给已经存在的 `span` 赋值，则把它记录的范围改为右侧视图的范围。这个过程不对原范围中的元素逐个赋值，也不销毁那些元素。

示例中的 `const std::span<double>` 固定视图所记录的范围，但仍允许修改其中的 `double` 元素。

下面的程序把两种操作放在一起。`samples` 和 `backup` 分别拥有三项、两项压力读数，单位为 kPa；两个数组都存活到 `main` 结束。

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

输出为：

```text
251 251
2 310
3 261
```

第一次修改通过 `alias` 到达 `samples` 的第二项，因此 `current` 和数组本身都读到 `251`。随后给 `current` 赋值，它开始访问 `backup`，长度也变成了 `2`。

`alias` 仍然记录最初的范围，所以最后一次修改仍然落在 `samples` 中。**复制视图建立的是一份独立的范围记录；以后改变其中一份记录，不会同步改变其他视图记录的范围。**

> [!IMPORTANT]
> 复制或赋值 `span`，复制的是访问范围。复制或赋值拥有元素的数组，才会相应复制或赋值元素。`span` 的复制与赋值所需时间不随元素数量增长。

若真实需求是让另一组数组元素取得相同的值，就应当对拥有元素的对象实施相应复制，或明确地逐项赋值。把指向目标数组的 `span` 赋值为指向源数组的 `span`，只会更换观察范围。

## 视图对象的只读与元素的只读

上面的 `alias` 声明为 `const std::span<double>`，仍能修改元素。这里的 `const` 限制视图对象本身：不能再给 `alias` 赋值，让它改为记录另一段范围。它记录的元素类型仍是 `double`，所以 `alias[index]` 仍提供可修改的元素引用。

`std::span<const double>` 中的 `const` 则限制元素访问。通过它取得的元素引用是 `const double&`，不能用这个入口修改元素；视图对象本身若不是 `const`，仍然可以改为记录另一段范围。

| 声明形式 | 能否给视图赋值，更换范围 | 能否通过视图修改元素 |
| --- | --- | --- |
| `std::span<double>` | 能 | 能 |
| `const std::span<double>` | 不能 | 能 |
| `std::span<const double>` | 能 | 不能 |
| `const std::span<const double>` | 不能 | 不能 |

可写视图可以用来构造只读元素视图，保留相同的起点和数量。这个转换增加访问限制，不复制元素；反过来不能借助普通的 `span` 构造去掉元素的 `const`。

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

输出为 `245` 和 `310`，各占一行。`observed` 最初仍然观察 `samples`，所以能读到另一个入口写入的 `245`。赋值之后，它改为观察 `backup`；这个数组本身是 `const`，只能建立只读元素视图。

在这个 `main` 中，以下两条语句分别违反不同层次的限制，均无法编译：

```cpp
writable = std::span<double>{samples}; // 错误：不能给 const 视图对象赋值
observed[0] = 315.0;                   // 错误：不能通过 const double& 修改元素
```

> [!WARNING]
> `std::span<const double>` 提供只读访问，不会让可修改的源数组整体变成只读，也不是元素值的快照。其他合法入口仍可修改源元素，视图随后读取的是它们当时的值。

## 参数类型表达哪一层限制

函数按值接收 `span`，得到的是自己的范围记录。修改这份记录不会改变调用方的视图，但通过它访问的元素仍属于调用方维持的对象。

因此，只读取压力数据的函数使用 `std::span<const double>` 参数。需要就地修改数据的函数使用 `std::span<double>` 参数。把后者写成 `const std::span<double>`，只会限制函数内部重新给形参赋值，并不能把函数变成只读元素的接口。

> [!PRACTICE]
> 判断一次操作的成本与影响时，先看类型的值代表什么。按值传入 `span` 能低成本地传递一段借用范围，但函数是否修改数据，仍由元素访问类型和函数行为决定。

## 参考资料

- [C++23 草案：span 的复制、赋值与转换构造](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 草案：span 的元素访问](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 草案：span 的职责与操作复杂度](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
