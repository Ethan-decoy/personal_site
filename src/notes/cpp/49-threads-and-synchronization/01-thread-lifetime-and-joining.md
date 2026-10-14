---
title: 线程生命周期与等待完成（Thread Lifetime and Joining）
date: 2026-10-08
order: 1
---

# 线程生命周期与等待完成（Thread Lifetime and Joining）

并发执行（Concurrent Execution）使多个任务的执行时间段可能重叠；并行（Parallel Execution）进一步表示它们实际同时执行。无论运行在几个核心上，资源和结果都需要明确的完成关系。

## jthread 以对象管理执行责任

`std::jthread` 位于 `<thread>`，构造时启动一个执行线程（Thread）。它拥有对应线程的管理责任，不能复制，可以移动。`join()` 等待线程完成，并建立完成与等待返回之间的同步关系。

```cpp
#include <iostream>
#include <thread>

int main() {
    int result{};
    std::jthread worker{[&result] { result = 220; }};
    worker.join();
    std::cout << result << '\n'; // 220
}
```

result 在启动之前创建，并保持到工作线程结束。join 返回后读取，能够观察线程完成前的这项写入；无需把每个跨线程结果都改成 atomic。

线程创建可能失败；线程入口中未捕获的异常不能自动传播到创建线程，会导致终止。

## 管理对象仍须满足结束前提

可加入（Joinable）表示管理对象关联一个尚未加入或分离的线程，不等于该线程此刻仍在执行。已执行结束但未 join 的线程仍可 joinable。

jthread 析构时若可加入，会请求停止并 join。停止是合作请求，不保证函数立即退出，因此析构可能等待；已经手动 join 后不再重复等待。

`std::thread` 的析构契约不同：可加入时析构会调用 terminate。`detach()` 分离管理关系后，局部管理对象不再保证执行目标在作用域结束前完成。

> [!WARNING]
> 分离线程仍借用局部变量时，变量可能先销毁。jthread 也要求依赖资源的声明顺序与结束责任成立；把 join 放在错误时刻不能修复已经发生的无效访问。

## 参考资料

- [C++23 工作草案：jthread](https://timsong-cpp.github.io/cppwp/n4950/thread.jthread.class)
- [C++23 工作草案：线程完成与 join](https://timsong-cpp.github.io/cppwp/n4950/thread.thread.member)
