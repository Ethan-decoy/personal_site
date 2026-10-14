---
title: promise 与结果通道（Promise and Future Result Channels）
date: 2026-10-08
order: 1
---

# promise 与结果通道（Promise and Future Result Channels）

线程管理对象负责执行的结束；结果通道负责传递值或异常。这两项责任可以相关，但不能用“拿到了结果”替代“线程已不再访问任何资源”。

## 共同状态连接生产者与消费者

`std::promise<T>` 与 `std::future<T>` 位于 `<future>`。promise 完成共同状态，future 等待并取得结果。`get_future()` 取得对应单消费者入口；`set_value` 设置值并使状态就绪。

```cpp
#include <future>
#include <iostream>
#include <thread>
#include <utility>

int main() {
    std::promise<int> producer;
    auto result = producer.get_future();
    std::jthread worker{[producer = std::move(producer)]() mutable { producer.set_value(220); }};

    std::cout << result.get() << '\n'; // 220
    worker.join();
    std::cout << result.valid() << '\n'; // 0
}
```

get 必要时等待，取得一次结果后使该 future 不再关联可取结果状态。`wait()` 只等待就绪，不取走结果；无有效状态时不能随意调用需要有效状态的操作。

## 就绪意味着通道完成

设置结果之前的相关操作与等待就绪后的观察建立同步关系。但生产者可以在 set_value 之后继续执行，因此 get 返回不等于线程全部结束。

一个 promise 通常只能取得一次 future，并只能完成一次状态；重复操作有相应 future_error。尚未完成状态就销毁生产者，会使消费者得到 broken_promise 错误，而不是无限保持“也许还有值”。

> [!IMPORTANT]
> 通道维护结果责任，join 维护执行结束关系。按接口明确哪一项完成后可以释放哪份资源，不将两者合并成模糊的“任务完成”。

## 参考资料

- [C++23 工作草案：future](https://timsong-cpp.github.io/cppwp/n4950/futures.unique.future)
- [C++23 工作草案：promise](https://timsong-cpp.github.io/cppwp/n4950/futures.promise)
