---
title: 互斥量与临界区（Mutexes and Critical Sections）
date: 2026-10-08
order: 3
---

# 互斥量与临界区（Mutexes and Critical Sections）

一次读取、修改和验证共同维持一个状态时，需要让它们成为受保护的整体，而不是分别保护一条机器指令。

## 同一互斥量排序受保护访问

`std::mutex` 位于 `<mutex>`，提供独占加锁与解锁。临界区（Critical Section）是持有同一互斥量期间执行的受保护操作。

`std::lock_guard` 用 RAII 持有锁，构造时加锁，析构时解锁。异常或提前退出仍结束锁责任。

```cpp
#include <iostream>
#include <mutex>
#include <thread>

int main() {
    int count{};
    std::mutex mutex;
    const auto increment = [&] {
        const std::lock_guard lock{mutex};
        ++count;
    };

    std::jthread first{increment};
    std::jthread second{increment};
    first.join();
    second.join();
    std::cout << count << '\n'; // 2
}
```

两次更新通过同一个 mutex 互相排序；最后读取则发生在两个 join 之后。所有并发读写都须服从协议，只锁写而让其他线程无锁读，仍可能竞争。

> [!IMPORTANT]
> 锁保护的是所有参与者共同遵守的一组访问，不是变量获得的一项永久属性。必须保护“读取条件并完成修改”的完整逻辑关系。

## 锁的范围影响正确性与等待

持锁期间调用未知回调，可能重入当前操作或等待另一把锁。普通 mutex 不允许同一线程再次独占锁定它；过长的 I/O 也可能扩大其他线程等待。

复制或移动一个含 mutex 的对象并不会自动保留同步身份，mutex 自身也不能普通复制移动。状态与其保护关系需要稳定管理。

## 参考资料

- [C++23 工作草案：mutex](https://timsong-cpp.github.io/cppwp/n4950/thread.mutex.class)
- [C++23 工作草案：lock_guard](https://timsong-cpp.github.io/cppwp/n4950/thread.lock.guard)
