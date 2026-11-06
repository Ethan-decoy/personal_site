---
title: 宽松顺序与顺序一致性（Relaxed Order and Sequential Consistency）
date: 2026-10-08
order: 3
---

# 宽松顺序与顺序一致性（Relaxed Order and Sequential Consistency）

每个 atomic 对象有其修改顺序，但不同对象之间不自动形成一份共同时间线。选择内存序，先说明需要连接什么关系。

## relaxed 保留原子值，不发布其他对象

`memory_order::relaxed` 保留对应原子操作的不可分割性和单对象顺序，不为其他普通数据建立发布关系。独立统计计数可以使用它，最终读取由 join 等另外的关系排序。

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<int> count{0};
    std::jthread first{[&] { count.fetch_add(1, std::memory_order::relaxed); }};
    std::jthread second{[&] { count.fetch_add(1, std::memory_order::relaxed); }};
    first.join();
    second.join();
    std::cout << count.load(std::memory_order::relaxed) << '\n'; // 2
}
```

这里不通过计数值去推导某个普通数据已经可读。最终结果还依赖两次线程完成与 join 的关系，不能删除它们后保留相同结论。

## 默认 seq_cst 提供更强的共同顺序

默认的 `memory_order::seq_cst` 是顺序一致（Sequentially Consistent）原子顺序。**全部采用这项顺序的原子操作，必须能排进同一份总序，并满足线程内的先后关系与读取规则。**这份总序可以连接不同的原子对象；只有各对象自己的修改顺序还不够。

下面两个线程各自先写一个原子对象，再读取另一个。两个普通结果变量分别只由一个工作线程写入，main 在两次 join 后才读取它们。

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<int> x{0};
    std::atomic<int> y{0};
    int first_observed{0};
    int second_observed{0};
    const auto order = std::memory_order::seq_cst;

    std::jthread first{[&] {
        x.store(1, order);
        first_observed = y.load(order);
    }};
    std::jthread second{[&] {
        y.store(1, order);
        second_observed = x.load(order);
    }};
    first.join();
    second.join();
    std::cout << first_observed << ' ' << second_observed << '\n';
}
```

在这份全部采用 seq_cst 的程序中，读取须符合总序中该对象此前最后一次修改。若两个读取都得到初始值 0，就要求：

1. 第一个线程中，写 x 在读 y 之前。
2. 读 y 得到 0，要求它在写 y 为 1 之前。
3. 第二个线程中，写 y 在读 x 之前。
4. 读 x 得到 0，要求它在写 x 为 1 之前。

这些条件连成“写 x → 读 y → 写 y → 读 x → 写 x”的循环，无法排成总序。因此输出可以是 `0 1`、`1 0` 或 `1 1`，**不能是 `0 0`**。

保持其余代码相同，把 order 改为 `std::memory_order::relaxed`，两个原子对象仍各自有修改顺序，但不再要求上述四次操作排成这份共同总序，`0 0` 便是语言允许的结果。它不保证在每台机器、每次运行中出现；没有观察到它，不能证明宽松顺序排除了它。

这仍不意味着所有普通访问都自动安全：没有适当同步的普通竞争不能由附近存在一个 seq_cst 计数器修复。混用更弱顺序时，也不能继续按“所有操作都在统一顺序中”推演。

> [!PRACTICE]
> 先用清楚的互斥或默认原子契约建立正确性。弱化顺序要给出仍然成立的具体同步证明，并用真实负载验证收益；不是根据直觉删掉几个看似多余的参数。

## 参考资料

- [C++23 工作草案：内存序](https://timsong-cpp.github.io/cppwp/n4950/atomics.order)
