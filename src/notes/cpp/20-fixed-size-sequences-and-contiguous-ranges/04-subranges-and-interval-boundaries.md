---
title: 子范围与区间边界（Subranges and Interval Boundaries）
date: 2026-09-15
order: 4
---

# 子范围与区间边界（Subranges and Interval Boundaries）

一次采样可能包含预热阶段、有效测量阶段和收尾阶段。处理有效测量数据时，函数只需要访问中间的一段元素。拥有者可以继续保存完整记录，调用方则用更小的 `span` 表达本次允许处理的范围。

这里的**子范围（subrange）**由原范围中选出的连续元素组成。子视图记录自己的起点和数量，继续借用选中的原有元素。

## 用起点偏移与数量选出一段元素

`span` 的成员函数 `subspan(offset, count)` 返回一个新视图。`offset` 表示从当前视图开头跳过多少项，`count` 用来指定要选取多少项。两个参数都使用 `span` 的无符号数量类型 `size_type`，也就是 `std::size_t`。

省略 `count`，也就是写成 `subspan(offset)` 时，第二个参数使用默认值 `std::dynamic_extent`。这个标记等于 `size_type` 的最大值，表示从偏移位置取到当前视图的末尾。显式传入该标记也有同样的效果。

两种用法都先要求 `offset <= size()`。明确给定数量时，还须满足 `count <= size() - offset`，选取的长度为 `count`。取到末尾时，选取的长度为 `size() - offset`。

> [!IMPORTANT] 子范围按自身起点编号
> 子视图记录自己的起点和长度。非空子视图的首元素下标是 `0`，子视图内合法的下标 `i` 对应原视图的 `offset + i`。处理函数收到子视图后，按这份视图自身的起点和长度访问元素。

> [!WARNING]
> 在 C++23 中，调用 `subspan` 时，偏移超过当前视图的长度，或者明确请求的数量超过剩余长度，都会导致未定义行为。需要以异常报告越界时，应在调用前自行检查参数。

子视图沿用原视图的元素类型。`std::span<double>` 的子视图仍可以修改元素，`std::span<const double>` 的子视图提供只读元素访问。

下面的五项压力读数以千帕（kPa）为单位。示例取出中间三项，并修改这段范围的第一项和最后一项。

```cpp
#include <array>
#include <iostream>
#include <span>

int main() {
    std::array<double, 5> samples{230.0, 240.0, 250.0, 260.0, 270.0};
    const std::span<double> all{samples};
    const std::span<double> middle{all.subspan(1, 3)};

    middle[0] = 241.0;
    middle[2] = 261.0;
    std::cout << all[0];
    for (const double value : all.subspan(1)) {
        std::cout << ' ' << value;
    }
    std::cout << '\n';

    const std::span<double> tail{all.subspan(3)};
    std::cout << tail.size() << ' ' << tail[0] << '\n';

    const std::span<double> empty{all.subspan(all.size(), 0)};
    std::cout << empty.size() << '\n';
}
```

程序依次输出下面三行。

```text
230 241 250 261 270
2 261
0
```

`middle[0]` 对应 `all[1]`。`middle[2]` 和 `tail[0]` 都对应 `all[3]`，因此从 `tail[0]` 可以读到经由 `middle[2]` 写入的 `261`。

## 末尾位置可以表示空范围

对于长度为 `5` 的范围，合法元素下标是 `0` 到 `4`。建立子范围时可以用偏移 `5` 表示末尾边界，并从这里选取零项。

用区间记号可以把中间三项写成 `[1, 4)`：包含起点 `1`，不包含终点 `4`。这种表示称为**左闭右开区间（half-open interval）**。它使元素数量恰好等于终点减起点，也能自然表示 `[5, 5)` 这样的空范围。

| 对长度为 5 的视图进行调用 | 结果 |
| --- | --- |
| `subspan(1, 3)` | 原下标 `1`、`2`、`3`，新长度为 `3` |
| `subspan(3)` | 原下标 `3`、`4`，新长度为 `2` |
| `subspan(5, 0)` 或 `subspan(5)` | 合法空范围，长度为 `0` |
| `subspan(5, 1)` | 起点合法，但没有一项剩余元素，不满足前置条件 |
| `subspan(6, 0)` | 起点越过末尾，即使数量为零也不满足前置条件 |

空范围的元素数量为零，因此 `empty[0]` 越界。

## 检查数量时避免先计算终点

运行期输入来自有符号整数或比 `size_type` 更宽的整数类型时，先确认原始值非负并且能用 `size_type` 表示，再转换。区间检查使用的是转换后的偏移和数量。

直接判断 `offset + count <= size()` 可能放过越界请求。如果加法在 `size_type` 中进行，和超出该无符号类型的表示范围时会回绕为较小的结果。

把当前视图的长度记为 `size`。表达式 `offset <= size && count <= size - offset` 先检查偏移。根据 `&&` 的短路规则，只有 `offset <= size` 成立时才计算 `size - offset` 并检查请求的数量。

看一个相加检查确实会误判的输入。设当前无符号数量类型的最大值为 `M`，并假定它不发生整型提升，加法仍在该无符号类型内进行。范围长度为 `5`，偏移为 `2`，实际选取数量却为 `M - 1`：

| 检查方式 | 本次计算 | 判断结果 |
| --- | --- | --- |
| 先相加 `offset + count <= size` | `2 + (M - 1)` 的数学结果为 `M + 1`，按该类型的模规则回绕为 `0`；`0 <= 5` | 错误通过 |
| 先核对偏移，再核对剩余数量 | `2 <= 5` 成立；剩余数量为 `5 - 2 = 3`，`M - 1 <= 3` 不成立 | 正确拒绝 |

`M` 由当前实现的 `size_type` 决定。标准接口把 `M` 用作取到末尾的标记，所以反例用 `M - 1` 表示一个明确的数量请求。

下面的 `checked_subspan` 明确把 `count` 解释为实际元素数量。它先检查边界，失败时抛出自定义的空异常类型 `invalid_interval`，成功后才调用标准库的 `subspan`。这里的异常来自这层检查函数。

```cpp
#include <array>
#include <iostream>
#include <span>

struct invalid_interval {};

std::span<double> checked_subspan(std::span<double> samples,
                                  std::span<double>::size_type offset,
                                  std::span<double>::size_type count) {
    const bool fits{offset <= samples.size() && count <= samples.size() - offset};
    if (!fits) {
        throw invalid_interval{};
    }
    return samples.subspan(offset, count);
}

int main() {
    std::array<double, 5> samples{230.0, 240.0, 250.0, 260.0, 270.0};
    const std::span<double> all{samples};

    try {
        const std::span<double> selected{checked_subspan(all, 1, 3)};
        selected[0] = 245.0;
        std::cout << samples[1] << '\n';

        checked_subspan(all, 4, 2);
    } catch (const invalid_interval&) {
        std::cout << "invalid interval\n";
    }
}
```

程序先输出 `245`，随后输出 `invalid interval`。第二次请求从下标 `4` 开始取两项，但只剩一项，因此在建立非法子范围之前就被拒绝。

返回的子视图继续借用 `main` 中数组 `samples` 的元素。`checked_subspan` 的同名形参只是一份视图，形参销毁时只结束这份视图的生命周期。区间检查确认选取边界，调用方负责让原数组在使用返回视图期间保持有效。

如果要从运行期给出的偏移取到末尾，先检查 `offset <= size()`，通过后再调用 `subspan(offset)`。

> [!PRACTICE]
> 处理一段数据的函数可以只接收子范围，从而把每次调用的访问范围放在入口处说明。子范围检查负责选取是否越界，函数自身仍需遵守该范围的元素下标限制，拥有者则负责维持这些元素的有效期。

## 参考资料

- [C++23 草案：span 的子视图及边界前置条件](https://timsong-cpp.github.io/cppwp/n4950/span.sub)
- [C++23 草案：动态长度标记的定义](https://timsong-cpp.github.io/cppwp/n4950/span.syn)
- [C++23 草案：span 的元素访问前置条件](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 草案：标准库前置条件的违反](https://timsong-cpp.github.io/cppwp/n4950/structure.specifications)
- [C++23 草案：无符号整数运算](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
- [C++23 草案：整数类型之间的转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)
