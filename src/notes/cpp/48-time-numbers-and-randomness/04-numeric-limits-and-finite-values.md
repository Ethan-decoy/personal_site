---
title: 数值界限与有限值（Numeric Limits and Finite Values）
date: 2026-10-08
order: 4
---

# 数值界限与有限值（Numeric Limits and Finite Values）

一个数值可以在类型中表示，不一定满足业务需要。类型界限、有限性与舍入规则要分别检查。

## limits 描述实现的类型属性

`std::numeric_limits<T>` 位于 `<limits>`，提供最大值、有效位数和特殊值支持等属性。对浮点类型，`min()` 通常是最小的正规正数，`lowest()` 才是最低的有限值；不能把整数 min 的直觉直接套上去。

`<cmath>` 中的 `std::isfinite` 判断浮点值是否有限。以下示例以支持 quiet NaN 的 double 实现为前提，用 static_assert 明确约束：

```cpp
#include <cmath>
#include <iostream>
#include <limits>

int main() {
    static_assert(std::numeric_limits<double>::has_quiet_NaN);
    const double missing = std::numeric_limits<double>::quiet_NaN();
    std::cout << std::isfinite(220.0) << ' ' << std::isfinite(missing) << '\n'; // 1 0
    std::cout << (std::numeric_limits<double>::lowest() < 0.0) << '\n';         // 1
}
```

NaN 与普通值比较具有不同关系，不能只靠“小于下限或大于上限”拒绝所有无效读数。业务不接受 NaN 或无穷时，先检查有限性，再检查范围。

## 数值工具不统一防止溢出

有符号整数溢出不因使用标准算法或 math 函数而变成合法。绝对值也须可表示，例如对某些类型最小负值求绝对值不能放回同一有符号类型。

浮点 epsilon 描述靠近一的分辨属性，不是所有量级、单位和算法都适用的统一误差阈值。误差策略须结合输入规模、运算过程与业务容差。

> [!PRACTICE]
> 数值接口明确单位、可接受特殊值和范围，算法明确中间表示与误差策略。将类型限制作为实现事实，将业务容差作为独立约定。

## 参考资料

- [C++23 工作草案：numeric_limits](https://timsong-cpp.github.io/cppwp/n4950/numeric.limits)
- [C++23 工作草案：浮点分类](https://timsong-cpp.github.io/cppwp/n4950/c.math)
