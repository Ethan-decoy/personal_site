---
title: 条件变量与状态等待（Condition Variables and State Waiting）
date: 2026-10-08
order: 5
---

# 条件变量与状态等待（Condition Variables and State Waiting）

线程需要等待“数据已经准备好”，不是等待一条容易错过的通知。条件变量（Condition Variable）将等待与受锁保护的状态判断结合起来。

## 谓词决定是否可以继续

`std::condition_variable` 位于 `<condition_variable>`。`std::unique_lock` 位于 `<mutex>`；下面的构造形式先取得锁，随后可以按等待接口的要求暂时释放并重新取得它。

`wait(lock, predicate)` 在持锁时检查谓词。条件未满足时，**释放锁与进入等待是一项不可分割的动作**；被唤醒后重新取得锁，再检查谓词，成立后才返回。

```cpp
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <optional>
#include <thread>

int main() {
    std::mutex mutex{};
    std::condition_variable ready{};
    std::optional<int> stored{};
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

沿这个例子，可以分两种时机理解为什么不会在检查与等待之间漏掉状态变化：

- 主线程先取得锁并保存 `stored = 220`：worker 随后取得锁时，谓词已经成立，无须等待；即使通知早已发出，也不影响这次判断。
- worker 先取得锁并检查到 `stored` 为空：主线程此时不能取得同一把锁来修改状态。worker 通过 wait 解锁并进入等待后，主线程才能取得锁、保存数据，随后解锁并发出通知。

同一把锁保护了“检查状态到解锁”的关系，wait 又把“解锁与进入等待”连接成不可分割的动作。主线程不能插入这段过程，先修改状态并通知完毕，再让 worker 带着旧判断进入等待。若把解锁和等待拆成两个独立动作，就会留下这种漏掉通知的空隙。

## 唤醒不证明条件已经成立

等待允许伪唤醒（Spurious Wakeup）；多个等待者也可能竞争数据。无谓词 wait 需要调用方循环检查条件，不能醒来就无条件使用。

notify 不自动保护数据，不保存一份永久事件。状态修改与读取由同一个互斥量排序；通知只促进等待者重新判断。

> [!IMPORTANT]
> 等待协议的核心是状态、锁和谓词，通知是使等待者有机会重查的信号。等待对象与数据也须存活到全部等待者结束。

## 参考资料

- [C++23 工作草案：condition_variable](https://timsong-cpp.github.io/cppwp/n4950/thread.condition.condvar)
