---
title: async 与执行策略（Async and Execution Policy）
date: 2026-10-08
order: 3
---

# async 与执行策略（Async and Execution Policy）

std::async 同时建立执行与结果关系，但执行策略决定调用何时、在哪里发生。默认形式不能保证创建一个立即运行的新线程。

## async 与 deferred 分别规定执行时机

`std::async` 位于 `<future>`。`std::launch::async` 请求异步执行，`std::launch::deferred` 保存调用并延迟到相应等待或取值操作执行。

```cpp
#include <future>
#include <iostream>

int main() {
    auto first = std::async(std::launch::async, [] { return 220; });
    auto second = std::async(std::launch::async, [] { return 230; });
    std::cout << first.get() + second.get() << '\n'; // 450
}
```

两个入口先建立，再取得结果；线程启动仍可能失败，异常也可在 get 中报告。默认策略允许库在异步与延迟之间选择，不能据此保证并行或指定线程数量。

## 结果生命周期可能带来等待

来自 async 策略的共同状态有专门的结束关系：释放最后相关拥有关系时，可能等待异步执行完成。上面的 first、second 保存了结果入口，两个任务先建立，等待发生在后面的 get 等位置；任务可以重叠，但仍不保证实际同时执行。

对照时，把上一个完整程序中 main 的三条语句替换为下面两条，调用目标仍分别返回 220 和 230，只改变结果入口的保留方式：

```cpp
static_cast<void>(std::async(std::launch::async, [] { return 220; }));
static_cast<void>(std::async(std::launch::async, [] { return 230; }));
```

`static_cast<void>` 在这里表示有意丢弃返回值。它不延长临时 future 的寿命，两条语句也不再取回结果值。等待位置可以沿语句逐项确定：

| 执行位置 | 结果入口与任务的关系 |
| --- | --- |
| 第一项 async 调用返回 | 返回临时 future，关联第一项异步任务 |
| 第一条语句的分号处 | 临时 future 析构，释放最后相关状态；第一项任务若仍在执行，需要等它完成 |
| 开始第二条语句 | 已经结束第一条语句，才建立第二项任务 |
| 第二条语句的分号处 | 第二个临时 future 同样在这里结束相应责任 |

因此，连续写出两次 async 并不足以让两项任务重叠。保存结果入口与丢弃临时入口，改变了等待发生在哪里；第一条语句的结束已经把后续任务启动挡在第一项完成之后。

这不是所有 promise 产生的 future 都具备的统一析构契约。future 本身也不是一个通用线程池或任务调度器。

> [!WARNING]
> 保存引用捕获的异步调用时，目标仍须活到执行结束。必须同时检查策略、等待位置和结果对象的销毁；默认策略的不确定性不能作为寿命保证。

## 参考资料

- [C++23 工作草案：async](https://timsong-cpp.github.io/cppwp/n4950/futures.async)
