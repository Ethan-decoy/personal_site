---
title: 结果契约与 optional
date: 2026-07-23
---

# 结果契约与 `optional`

函数不仅要算出结果，还要说明哪些调用被允许、合法调用何时没有结果，以及成功结果与输入之间是什么关系。

参数与副作用的选择见[函数接口设计](function-interface-design.md)。本页只讨论调用契约和结果状态。

## `std::optional<int>` 表达两个状态

使用前包含头文件：

```cpp
#include <optional>
```

`std::optional` 是 C++17 起提供的标准库类型。`std::optional<int>` 可以处于：

- 有值状态：内部保存一个 `int`；
- 无值状态：内部没有 `int`。

```cpp
std::optional<int> present{3};
std::optional<int> absent{std::nullopt};
```

在返回类型为 `std::optional<int>` 的函数中，返回一个 `int` 会构造有值结果，返回 `std::nullopt` 会构造无值结果。因此“有值且值为 `0`”与“无值”完全不同。

## 完整契约回答三个问题

对于可能没有结果的函数，契约至少区分：

1. **前置条件**：调用前必须成立，由调用方保证；
2. **无结果条件**：调用合法，但在哪些情况下没有结果；
3. **成功结果关系**：有结果时，值如何由输入决定。

```cpp
// 前置条件：5 <= base_score && base_score <= 95
// 无结果：adjustment < -5 || adjustment > 5
// 有结果：result.value() == base_score + adjustment
std::optional<int> adjusted_score_if_accepted(
    int base_score,
    int adjustment
);
```

`base_score` 的范围由调用方保证。任意 `adjustment` 都可以传入，但超出闭区间 `[-5, 5]` 时没有结果。

这个范围也保证成功时的加法结果位于 `[0, 100]`，不会超出 `int` 的最小保证范围。

## 前置条件与合法无结果不同

只接受有效调用的函数可以声明前置条件：

```cpp
// 前置条件：group_count > 0
int items_per_group(int total_items, int group_count)
{
    return total_items / group_count;
}
```

调用方有义务在调用前保证 `group_count > 0`。注释不会自动执行检查；若传入 `0`，整数除以零会产生未定义行为。

另一个接口可以把非正除数纳入合法输入，并报告没有结果。它具有不同名称，避免与前一个只靠返回类型区分；C++ 不能仅按返回类型重载函数：

```cpp
std::optional<int> items_per_group_if_valid(
    int total_items,
    int group_count
)
{
    if (group_count <= 0) {
        return std::nullopt;
    }

    return total_items / group_count;
}
```

这两个函数表达不同契约。不能一边声称某输入绝对不允许调用，一边又把它描述为函数承诺处理的普通失败分支。

## 不要用可能合法的整数充当失败标记

若任意 `int` 都可作为被除数，正常商可能为 `-1`：

```cpp
// quotient(-3, 2) 的合法结果是 -1
```

因此用 `-1` 同时表示失败会产生歧义。下面的接口把“无结果”与所有整数结果分开：

```cpp
std::optional<int> quotient(
    int dividend,
    int positive_divisor
)
{
    if (positive_divisor <= 0) {
        return std::nullopt;
    }

    return dividend / positive_divisor;
}
```

正除数也排除了 `INT_MIN / -1` 这一有符号除法溢出情况。

## 读取前检查状态

```cpp
#include <iostream>
#include <optional>

std::optional<int> result{quotient(7, 2)};

if (result.has_value()) {
    std::cout << result.value() << '\n';
} else {
    std::cout << "no result\n";
}
```

`has_value()` 返回是否有值，`value()` 取得其中的值。空状态调用 `.value()` 会抛出 `std::bad_optional_access`。

当前安全模式是先检查，再读取。`optional` 也能在条件中判断状态，但不应把它当作内部整数值。

## 结果契约必须覆盖算术范围

只验证业务关系还不够。若结果类型无法表示数学结果，整数运算仍可能溢出。

下面的函数把“时间颠倒”和“时长无法由 `int` 表示”都定义为合法的无结果状态：

```cpp
#include <limits>
#include <optional>

std::optional<int> elapsed_time(
    int start_time,
    int end_time
)
{
    if (end_time < start_time) {
        return std::nullopt;
    }

    const int maximum{std::numeric_limits<int>::max()};

    if (start_time < 0 && end_time > maximum + start_time) {
        return std::nullopt;
    }

    return end_time - start_time;
}
```

当 `start_time < 0` 时，检查式 `maximum + start_time` 本身仍在 `int` 范围内。通过检查后，`end_time - start_time` 才能安全计算。

这里负的 `start_time` 本身不是错误。契约关心先后关系以及结果能否由返回类型表示。

## 乘法也需要结果范围契约

下面的接口接受任意两个 `int`。负尺寸或面积超出 `int` 范围时返回无结果：

```cpp
#include <limits>
#include <optional>

std::optional<int> rectangle_area(int width, int height)
{
    if (width < 0 || height < 0) {
        return std::nullopt;
    }

    const int maximum{std::numeric_limits<int>::max()};

    if (height != 0 && width > maximum / height) {
        return std::nullopt;
    }

    return width * height;
}
```

除法检查位于乘法之前，避免先计算一个无法表示的乘积。成功时，结果严格等于数学意义上的 `width × height`。

## 结果契约检查清单

1. 前置条件是否只描述调用方必须保证的内容？
2. 合法无结果是否与违反前置条件明确区分？
3. 无结果条件是否覆盖所有相应边界？
4. 成功结果与输入的关系是否明确？
5. 中间运算和最终结果是否都能由类型表示？
6. 失败标记是否可能与合法业务值冲突？
7. 调用方是否先检查 `optional`，再读取值？

清楚的契约让调用方知道什么能传、什么可能失败，以及拿到结果后能够依赖什么。
