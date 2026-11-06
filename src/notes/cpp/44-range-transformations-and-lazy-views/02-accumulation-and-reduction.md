---
title: 累积与归约的契约（Accumulation and Reduction Contracts）
date: 2026-10-08
order: 2
---

# 累积与归约的契约（Accumulation and Reduction Contracts）

把多个读数合成一个结果，需要决定结果类型和组合次序。初始值不仅是一个数，还会影响中间计算怎样保存。

## accumulate 按迭代顺序更新累积值

`std::accumulate` 在 `<numeric>` 中接收起点、终点和初始值，按顺序将每项纳入累积结果。初始值的类型决定累积对象的类型。

```cpp
#include <array>
#include <iostream>
#include <numeric>

int main() {
    const std::array values{220.5, 230.5};
    const auto truncated = std::accumulate(values.begin(), values.end(), 0);
    const auto preserved = std::accumulate(values.begin(), values.end(), 0.0);

    std::cout << truncated << ' ' << preserved << '\n'; // 450 451
}
```

整数初始值让每次累积结果回到 int，`220.5` 与 `230.5` 的小数分别丢失；double 初始值则保存本例的小数结果。不能只在最后把 truncated 转成 double 来恢复已经丢掉的信息。

自定义累积操作可以逐项更新一个结果对象，仍须检查其数值范围、状态与异常保证。

## reduce 允许不同的组合分组

`std::reduce` 也是 `<numeric>` 的归约（Reduction）设施，但允许重新分组、重排组合。即使未提供并行执行策略，也不能依赖它严格复制 accumulate 的左到右次序。

数学整数加法具有熟悉的结合性质，程序中的有符号溢出却仍然不合法；浮点加法舍入使重新分组可能改变结果。减法或依赖顺序的状态更新通常不能直接换成 reduce。

> [!TIP]
> 要求稳定逐项累积顺序时使用 accumulate。允许不同分组的归约须检查运算、实际取值和结果类型共同构成的契约，而不是只看操作名叫“求和”。

## 成本还包括每次操作

对 n 个元素执行 n 次左右的组合，不代表所有任务都只花同一种成本。复制大型累积对象、构造文本或查找映射的每步成本，还须计入当前分析。

> [!PRACTICE]
> 先选择足以保存中间结果的类型，再决定是否允许重排。性能测量需要相同输入和相同结果要求；不能把改变数值语义的速度差当作无代价优化。

## 参考资料

- [C++23 工作草案：accumulate](https://timsong-cpp.github.io/cppwp/n4950/accumulate)
- [C++23 工作草案：reduce](https://timsong-cpp.github.io/cppwp/n4950/reduce)
