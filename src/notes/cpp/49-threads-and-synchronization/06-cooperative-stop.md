---
title: 合作停止与等待结束（Cooperative Stop and Completion）
date: 2026-10-08
order: 6
---

# 合作停止与等待结束（Cooperative Stop and Completion）

“请求停止”不等于“目标已经停止”。线程需要在合适的位置观察请求，退出后再由 join 确认资源不再被访问。

## stop_token 观察共同停止状态

`std::stop_token` 位于 `<stop_token>`，可以检查停止请求。jthread 的可调用入口支持该形参时，构造器会传入关联的 token。

`std::condition_variable_any` 提供支持 token 的等待形式，能让未满足业务条件的等待因停止请求退出。

```cpp
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <stop_token>
#include <thread>

int main() {
    std::mutex mutex;
    std::condition_variable_any ready;
    bool available{false};
    bool cancelled{false};

    std::jthread worker{[&](std::stop_token stop) {
        std::unique_lock lock{mutex};
        const bool satisfied = ready.wait(lock, stop, [&] { return available; });
        cancelled = !satisfied;
    }};
    worker.request_stop();
    worker.join();
    std::cout << cancelled << '\n'; // 1
}
```

available 始终为 false，等待因停止请求结束。返回结果表示谓词是否成立；通用流程不能把“等待返回”直接当作业务数据可用。

## 请求不能强制中断任意操作

`stop_requested()` 返回是否已有请求；它不会自动打断普通文件读取或任意用户函数。需要可停止的操作接口或适当检查点。

停止状态不自动保护业务数据，request_stop 也不等于 join。析构请求若目标忽略它，仍可能等待很久。

> [!PRACTICE]
> 任务明确停止检查点、被取消时保持的状态和最终完成责任。先请求，再按协议退出，最后确认完成；资源释放依赖完成事实，不只依赖请求已发出。

## 参考资料

- [C++23 工作草案：停止机制](https://timsong-cpp.github.io/cppwp/n4950/thread.stoptoken)
- [C++23 工作草案：可停止的条件变量等待](https://timsong-cpp.github.io/cppwp/n4950/thread.condition.condvarany)
