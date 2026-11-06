---
title: 多把锁与死锁（Multiple Locks and Deadlock）
date: 2026-10-08
order: 4
---

# 多把锁与死锁（Multiple Locks and Deadlock）

转移余额要同时维护两个对象。若一个线程先锁 A 再锁 B，另一个先锁 B 再锁 A，双方可能各等对方释放资源，形成死锁（Deadlock）。

## scoped_lock 共同取得一组锁

`std::scoped_lock` 位于 `<mutex>`，用规定的避免死锁加锁策略取得多把锁，再以 RAII 释放。它不允许把同一普通 mutex 当作两份独立资源重复传入。

```cpp
#include <iostream>
#include <limits>
#include <mutex>
#include <thread>

struct account {
    int credits{100};
    std::mutex mutex{};
};

bool transfer(account& from, account& to, int amount) {
    if (&from == &to) {
        return false;
    }
    const std::scoped_lock lock{from.mutex, to.mutex};
    if (amount <= 0 || from.credits < amount ||
        to.credits > std::numeric_limits<int>::max() - amount) {
        return false;
    }
    from.credits -= amount;
    to.credits += amount;
    return true;
}

int main() {
    account first{};
    account second{};
    std::jthread a{[&] { transfer(first, second, 10); }};
    std::jthread b{[&] { transfer(second, first, 20); }};
    a.join();
    b.join();
    std::cout << first.credits << ' ' << second.credits << '\n'; // 110 90
}
```

两个方向都使用相同的组合锁契约，检查与修改处于同一临界区。对象保持非负余额，本例两个转移都可完成；范围检查避免目的余额加法溢出。

## 避免当前组合冲突不等于所有等待都安全

scoped_lock 不解决在持锁期间等待一个必须取得该锁的线程，也不解决资源之外的循环依赖。把任务 join 放在工作线程需要的锁范围内，仍可能死锁。

> [!PRACTICE]
> 多资源操作使用统一的取得策略，减少嵌套调用中的未知锁依赖，并让等待发生在不会阻塞完成条件的位置。锁顺序和任务依赖应一起审查。

## 参考资料

- [C++23 工作草案：scoped_lock](https://timsong-cpp.github.io/cppwp/n4950/thread.lock.scoped)
- [C++23 工作草案：多锁取得](https://timsong-cpp.github.io/cppwp/n4950/thread.lock.algorithm)
