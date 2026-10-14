---
title: 共享结果与重复观察（Shared Results and Repeated Observation）
date: 2026-10-08
order: 4
---

# 共享结果与重复观察（Shared Results and Repeated Observation）

多个消费者要观察同一次计算，不等于每个消费者都应重新执行任务。shared_future 共享已经建立的结果状态。

## 多个入口访问同一结果

`std::shared_future<T>` 位于 `<future>`。`future::share()` 将单消费者入口转成可复制的共享结果入口；对普通对象 T，其 get 返回保存值的 const 引用，可以重复观察。

```cpp
#include <future>
#include <iostream>

int main() {
    std::promise<int> producer;
    auto first = producer.get_future().share();
    const auto second = first;
    producer.set_value(220);

    std::cout << first.get() + second.get() << '\n';      // 440
    std::cout << (&first.get() == &second.get()) << '\n'; // 1
}
```

没有复制计算，也没有由两次 get 产生两份独立整数结果。引用依赖共同状态的寿命，不能释放全部相关状态后仍继续使用。

## 共享结果不自动保护内部目标

T 若保存可修改指针或共享对象，const 结果引用不提供目标的同步。多消费者应按结果实际类型检查可观察状态与并发访问关系。

`std::packaged_task` 也是 <future> 中的设施，将可调用目标和一次结果通道组合，执行它时完成结果；它本身不自动创建线程。调度关系与结果关系仍由外部组织。

> [!PRACTICE]
> 一份计算供多处读取时，用共享结果维持明确身份。需要每个消费者独立修改的快照时，另外复制相应值，并评估成本；不要把共享入口当成深复制。

## 参考资料

- [C++23 工作草案：shared_future](https://timsong-cpp.github.io/cppwp/n4950/futures.shared.future)
- [C++23 工作草案：packaged_task](https://timsong-cpp.github.io/cppwp/n4950/futures.task)
