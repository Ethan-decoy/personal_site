---
title: 条件变量与状态等待（Condition Variables and State Waiting）
date: 2026-10-08
order: 5
---

# 条件变量与状态等待（Condition Variables and State Waiting）

线程需要等待“数据已经准备好”，不是等待一条容易错过的通知。条件变量（Condition Variable）将等待与受锁保护的状态判断结合起来。

## 谓词决定是否可以继续

`std::condition_variable` 位于 `<condition_variable>`。`std::unique_lock` 位于 `<mutex>`，可保持并暂时释放锁，适合等待接口。

`wait(lock, predicate)` 检查谓词；条件未满足时释放锁并等待，被唤醒后重新取得锁并检查。

```cpp
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <thread>

int main() {
    std::mutex mutex;
    std::condition_variable ready;
    std::optional<int> stored;
    int result{};

    std::jthread worker{[&] {
        std::unique_lock lock{mutex};
        ready.wait(lock, [&] { return stored.has_value(); });
        result = *stored;
    }};
    {
        const std::lock_guard lock{mutex};
        stored = 220;
    }
    ready.notify_one();
    worker.join();
    std::cout << result << '\n'; // 220
}
```

即使 notify 发生在 worker 真正等待之前，worker 检查到 stored 已存在，也可继续。若只等待一条通知而不保存状态，就不能提供这项关系。

## 唤醒不证明条件已经成立

等待允许伪唤醒（Spurious Wakeup）；多个等待者也可能竞争数据。无谓词 wait 需要调用方循环检查条件，不能醒来就无条件使用。

notify 不自动保护数据，不保存一份永久事件。状态修改与读取由同一个互斥量排序；通知只促进等待者重新判断。

> [!IMPORTANT]
> 等待协议的核心是状态、锁和谓词，通知是使等待者有机会重查的信号。等待对象与数据也须存活到全部等待者结束。

## 参考资料

- [C++23 工作草案：condition_variable](https://timsong-cpp.github.io/cppwp/n4950/thread.condition.condvar)
