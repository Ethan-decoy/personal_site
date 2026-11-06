---
title: 比较交换与重试（Compare-Exchange and Retry）
date: 2026-10-08
order: 4
---

# 比较交换与重试（Compare-Exchange and Retry）

“当前值小于新读数就更新最大值”需要把判断与条件更新连接起来。独立 load 后 store，即使都原子，也可能让较小结果覆盖较大结果。

## 失败时 expected 更新为当前观察

比较交换（Compare-and-Exchange，CAS）比较 atomic 当前值与调用方的 expected：匹配则写入 desired 并返回 true；不匹配则把观察值写回 expected 并返回 false。

`compare_exchange_weak` 还允许伪失败，因此通常置于重试循环。下面只在新读数更大时更新：

```cpp
#include <atomic>
#include <iostream>
#include <thread>

void update_max(std::atomic<int>& target, int value) {
    int observed = target.load(std::memory_order::relaxed);
    while (observed < value &&
           !target.compare_exchange_weak(
               observed, value, std::memory_order::relaxed, std::memory_order::relaxed)) {
    }
}

int main() {
    std::atomic<int> maximum{0};
    std::jthread first{[&] { update_max(maximum, 220); }};
    std::jthread second{[&] { update_max(maximum, 230); }};
    first.join();
    second.join();
    std::cout << maximum.load() << '\n'; // 230
}
```

失败时，`observed` 接收此次比较交换读取到的值，循环用它重新判断是否还需更新。看一条具体路径：两方最初都读取到 0，但提交 230 的线程先成功。

| 阶段 | 220 的调用方所持 `observed` | 原子 `maximum` | 220 的下一项判断 |
| --- | ---: | ---: | --- |
| 两方完成初次读取 | 0 | 0 | 0 小于 220，可以尝试提交 |
| 230 先成功提交 | 0 | 230 | 本地观察仍是旧值，尚不知道这次变化 |
| 220 用 expected=0 尝试 CAS | 230 | 230 | 比较失败；不写入 220，将实际观察到的 230 写回 `observed` |
| 回到循环条件 | 230 | 230 | 230 不小于 220，停止；短路求值跳过下一次 CAS |

停止不表示 220 被写入过，而是新观察已经证明没有必要再提交它。失败返回的 `observed` 是下一次判断的输入，不能重复使用最初的 0。

弱 CAS 也可能伪失败：当前值仍等于 expected，返回 false，写回的观察值仍与原值相同。这时若 `observed < value` 仍成立，循环继续尝试；不能将每次失败都解释成其他线程提交了更大值。本例只维护一个整数最大值，未借它发布其他数据。

## 重试不能假定没有额外副作用

循环中的分配、日志或外部修改可能执行多次。业务副作用须放在可证明次数和提交关系的位置，不能仅因最后 CAS 成功就忽略失败尝试。

成功与失败可分别指定内存序；失败分支是读取，不能使用 release 或 acq_rel。具体同步仍依赖操作观察到的值和整体协议。

> [!TIP]
> 明确 expected 的输入输出角色、失败后的重新计算和副作用次数。CAS 处理一项条件更新，不自动解决对象回收、地址重用或多字段事务。

## 参考资料

- [C++23 工作草案：比较交换](https://timsong-cpp.github.io/cppwp/n4950/atomics.types.operations)
