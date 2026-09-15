---
title: 子范围与区间边界（Subranges and Interval Boundaries）
date: 2026-09-15
order: 4
---

# 子范围与区间边界（Subranges and Interval Boundaries）

一次采样可能包含预热阶段、有效测量阶段和收尾阶段。处理有效测量数据时，函数只需要访问中间的一段元素。拥有者可以继续保存完整记录，调用方则用更小的 `span` 表达本次允许处理的范围。

这里的**子范围（subrange）**仍由原范围中的连续元素组成。建立子范围只改变起点和数量，不复制元素，也不改变原视图。

## 用起点偏移与数量选出一段元素

`span` 的成员函数 `subspan(offset, count)` 返回一个新的视图。`offset` 表示从当前范围开头跳过多少项，`count` 表示选取多少项；两者都使用 `span` 的无符号数量类型 `size_type`。

当 `count` 表示实际选取数量时，需要同时满足：

- `offset <= size()`：起点不能越过当前范围末尾。
- `count <= size() - offset`：选取数量不能超过从起点到末尾剩余的数量。

新的视图保留原来的元素访问限制。对 `std::span<double>` 调用该函数得到 `std::span<double>`；对 `std::span<const double>` 调用则得到 `std::span<const double>`。

如果需要从 `offset` 一直取到当前范围末尾，可以使用单参数形式 `subspan(offset)`。这时仍要求 `offset <= size()`，返回视图的长度为 `size() - offset`。

下面的五项压力读数以 kPa 为单位。示例取出中间三项，并通过子范围修改其中的第一项和最后一项。

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
    for (const double value : all) {
        std::cout << value << ' ';
    }
    std::cout << '\n';

    const std::span<double> tail{all.subspan(3)};
    std::cout << tail.size() << ' ' << tail[0] << '\n';

    const std::span<double> empty{all.subspan(all.size(), 0)};
    std::cout << empty.size() << '\n';
}
```

输出为：

```text
230 241 250 261 270
2 261
0
```

子范围中的下标从零重新开始。`middle[0]` 对应 `all[1]`，`middle[2]` 对应 `all[3]`；`tail[0]` 同样对应 `all[3]`。因此，几个视图可以覆盖重叠的元素，先通过 `middle` 写入的 `261` 会被 `tail` 读到。

> [!IMPORTANT]
> 子范围的下标相对于它自己的起点。取得子范围之后，传给处理函数的起点和长度已经缩小；函数仍然从下标 `0` 开始处理，不应再次加上原来的偏移。

## 末尾位置可以表示空范围

对于长度为 `5` 的范围，合法元素下标是 `0` 到 `4`。但建立子范围时，偏移 `5` 仍可以作为边界，表示从所有元素之后开始选取零项。

用区间记号可以把中间三项写成 `[1, 4)`：包含起点 `1`，不包含终点 `4`。这种表示称为**左闭右开区间（half-open interval）**。它使元素数量恰好等于终点减起点，也能自然表示 `[5, 5)` 这样的空范围。

| 对长度为 5 的视图进行调用 | 结果 |
| --- | --- |
| `subspan(1, 3)` | 原下标 `1`、`2`、`3`，新长度为 `3` |
| `subspan(3)` | 原下标 `3`、`4`，新长度为 `2` |
| `subspan(5, 0)` 或 `subspan(5)` | 合法空范围，长度为 `0` |
| `subspan(5, 1)` | 起点合法，但没有一项剩余元素，不满足前置条件 |
| `subspan(6, 0)` | 起点越过末尾，即使数量为零也不满足前置条件 |

空范围不允许访问任何元素，`empty[0]` 仍然越界。“能够用末尾位置表示边界”与“末尾位置有一个元素”是两件事。

> [!WARNING]
> C++23 的 `subspan` 要求调用方满足边界前置条件。违反条件会导致未定义行为，不能把它当成会抛出异常的区间检查函数，也不能依据一次运行中的断言或输出推断安全性。

## 检查数量时避免先计算终点

若偏移和数量来自运行期输入，直接判断 `offset + count <= size()` 并不稳妥。`size_type` 是无符号整数类型，两个数相加可能超出它能表示的范围，回绕为较小的结果，从而错误地通过检查。

正确顺序是先确定 `offset` 没有超过长度，再计算剩余数量。表达式 `offset <= size && count <= size - offset` 使用 `&&` 的短路规则：前半段不成立时，后半段不求值，因此也不会在 `offset` 过大时执行无符号减法。

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

返回的 `span` 仍然借用 `samples` 中的元素。局部形参 `samples` 是一份视图，函数返回时销毁这份视图不会销毁原数组；真正的数组在调用方 `main` 中，使用返回值期间仍然存活。区间检查只能确认选取边界，不能替调用方延长数组的生命周期。

标准接口为数量保留了 `std::dynamic_extent` 这一特殊标记，含义是从偏移位置取到末尾；省略第二个实参时便使用该含义。它不是实际元素数量。本文的检查函数只接受实际数量，需要取到末尾时直接使用已介绍的单参数形式即可。

> [!PRACTICE]
> 处理一段数据的函数可以只接收子范围，从而把每次调用的访问范围放在入口处说明。子范围检查负责选取是否越界，函数自身仍需遵守该范围的元素下标限制，拥有者则负责维持这些元素的有效期。

## 参考资料

- [C++23 草案：span 的子视图及边界前置条件](https://timsong-cpp.github.io/cppwp/n4950/span.sub)
- [C++23 草案：span 的元素访问前置条件](https://timsong-cpp.github.io/cppwp/n4950/span.elem)
- [C++23 草案：标准库前置条件的违反](https://timsong-cpp.github.io/cppwp/n4950/structure.specifications)
- [C++23 草案：无符号整数运算](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
