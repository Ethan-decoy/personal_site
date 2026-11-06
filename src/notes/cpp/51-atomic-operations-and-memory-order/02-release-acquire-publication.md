---
title: 发布与取得关系（Release-Acquire Publication）
date: 2026-10-08
order: 2
---

# 发布与取得关系（Release-Acquire Publication）

生产者先保存普通数据，再发布“已经准备好”。消费者观察标志后能否读取数据，取决于原子标志是否连接了两边的访问，而不只是标志读取不会撕裂。

## 观察对应发布才能建立同步

内存序（Memory Order）规定原子操作参与怎样的顺序关系。release 写入可以与读取其值或规定释放序列的 acquire 操作同步，从而连接此前写入与之后读取。

`atomic::wait(old, order)` 等待观察值不同于 old，通知使等待者有机会重查；通知本身不代替发布关系。

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    int stored{};
    std::atomic<bool> ready{false};
    std::jthread producer{[&] {
        stored = 220;
        ready.store(true, std::memory_order::release);
        ready.notify_one();
    }};

    ready.wait(false, std::memory_order::acquire);
    std::cout << stored << '\n'; // 220
    producer.join();
}
```

这里只有一次 false 到 true 的发布。wait 返回时通过 acquire 观察到该发布，普通 stored 的写入因此先发生于读取。不是“任意 atomic 操作都刷新所有普通数据”。

## 发布不允许随后任意修改

生产者发布后若继续无同步改写 stored，消费者同时读取仍可能竞争。一次发布适合明确的交接或不可变快照；重复写入需要新的协议。

store 不能使用只适用于取得的 acquire，load 也不能使用 release。acq_rel 适用于相应读改写；参数不是可随意粘贴的“更快选项”。

> [!WARNING]
> 将标志改成 relaxed 会丢掉这里所需的发布连接。观察到 true 本身不足以让普通数据访问安全，硬件上的一次正确运行不能补出语言保证。

wait 还可能看不到短暂的 A→B→A 变化，不能充当记录所有事件的队列。

## 参考资料

- [C++23 工作草案：原子顺序与发布](https://timsong-cpp.github.io/cppwp/n4950/atomics.order)
- [C++23 工作草案：原子等待](https://timsong-cpp.github.io/cppwp/n4950/atomics.wait)
