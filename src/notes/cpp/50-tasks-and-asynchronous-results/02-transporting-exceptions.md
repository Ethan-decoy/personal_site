---
title: 跨任务传递异常（Transporting Exceptions across Tasks）
date: 2026-10-08
order: 2
---

# 跨任务传递异常（Transporting Exceptions across Tasks）

异常不会从任意线程入口自动跳到创建线程。显式结果通道可以保存异常，并在消费者取得结果时重新抛出。

## exception_ptr 保存异常对象关系

`std::current_exception()` 位于 `<exception>`，在相应处理语境中取得当前异常的 `std::exception_ptr`。`promise::set_exception` 将它存入共同结果状态。

```cpp
#include <exception>
#include <future>
#include <iostream>
#include <stdexcept>
#include <thread>
#include <utility>

int main() {
    std::promise<int> producer;
    auto result = producer.get_future();
    std::jthread worker{[producer = std::move(producer)]() mutable {
        try {
            throw std::runtime_error{"read failed"};
        } catch (...) {
            producer.set_exception(std::current_exception());
        }
    }};

    try {
        std::cout << result.get() << '\n';
    } catch (const std::runtime_error& error) {
        std::cout << error.what() << '\n'; // read failed
    }
    worker.join();
}
```

生产者已在自己的线程中处理传播，并完成通道；消费者 get 重新抛出保存的异常。不会借用一个早已退出处理块的局部异常引用。

## 业务错误与异常通道分别说明

`future<expected<T, E>>` 可以表示异步操作的业务成功或失败。future 就绪后取得的 expected 仍须检查；异常路径则可能使 get 抛出。

> [!PRACTICE]
> 结果入口的就绪、成功值、业务错误、异常和取消各自有明确含义。不要让消费者仅凭“等待已结束”就无条件解引用 expected，或假定所有异常都已被转成 E。

## 参考资料

- [C++23 工作草案：异常指针](https://timsong-cpp.github.io/cppwp/n4950/propagation)
- [C++23 工作草案：promise 完成错误状态](https://timsong-cpp.github.io/cppwp/n4950/futures.promise)
