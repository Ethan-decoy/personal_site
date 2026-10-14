---
title: 原子值与复合操作（Atomic Values and Compound Operations）
date: 2026-10-08
order: 1
---

# 原子值与复合操作（Atomic Values and Compound Operations）

互斥量可以保护一组状态关系；原子操作（Atomic Operation）为特定对象提供不可分割的相应访问。它们并不自动让一个函数中的所有步骤形成事务。

## atomic 按接口操作一个值

`std::atomic<T>` 位于 `<atomic>`。`load` 读取，`store` 写入，整数类型的 `fetch_add` 将读、加、写组成一次原子读改写，并返回此前值。

```cpp
#include <atomic>
#include <iostream>
#include <thread>

int main() {
    std::atomic<int> count{0};
    std::jthread first{[&] { count.fetch_add(1); }};
    std::jthread second{[&] { count.fetch_add(1); }};
    first.join();
    second.join();
    std::cout << count.load() << '\n'; // 2
}
```

两次增加不会像无同步的普通 ++ 一样形成数据竞争。若改成独立 load、算加法、store，这些操作各自原子，但两个线程仍可能覆盖彼此的更新。

保留原子 `count`，假定每个线程改为执行下面的片段：

```cpp
const int observed = count.load();
count.store(observed + 1);
```

即使使用默认的内存序，也允许以下执行顺序：

| 步骤 | first 线程 | second 线程 | `count` |
| --- | --- | --- | ---: |
| 1 | `load()` 读到 0，保存自己的 `observed` | 尚未读取 | 0 |
| 2 | 暂未写入 | `load()` 也读到 0，保存自己的 `observed` | 0 |
| 3 | 根据已读到的 0，`store(1)` | 暂未写入 | 1 |
| 4 | 已完成 | 根据自己的 0，`store(1)` | 1 |

每次访问都遵守原子接口，但读取与随后写入之间可以插入别的线程操作，因此两次业务增加只留下结果 1。这里没有普通对象的数据竞争，问题是**一次增加被拆成了两项独立原子操作**。

`fetch_add(1)` 则把读、加、写放进同一次读改写：对这个计数器，两次成功执行分别将 0 变为 1、再将 1 变为 2。应选择能覆盖当前业务更新的操作边界，而不只检查每个访问是否原子。

> [!IMPORTANT]
> 原子性属于所执行的相应操作，不会扩散成任意复合逻辑。多字段不变式需要更完整的协议，通常先考虑互斥保护。

## 原子不等于无锁或最快

某种 atomic 是否无锁取决于类型与实现，可以检查 `is_lock_free()`。即使无锁，多核之间的共享访问也有代价，不保证任一线程无等待完成或公平调度。

atomic 不能普通复制；“取得数值副本”用 load，而不是复制同步对象身份。对象本身仍要在全部访问期间存活。

## 参考资料

- [C++23 工作草案：原子操作](https://timsong-cpp.github.io/cppwp/n4950/atomics)
