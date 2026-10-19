---
title: 生成失败与消费边界（Generator Failure and Consumption Boundaries）
date: 2026-10-08
order: 4
---

# 生成失败与消费边界（Generator Failure and Consumption Boundaries）

延迟执行改变异常出现的时刻。成功创建一个 generator 不证明所有后续读数都能成功产出。

## 异常在驱动执行的位置报告

```cpp
#include <generator>
#include <iostream>
#include <stdexcept>

std::generator<int> readings() {
    co_yield 220;
    throw std::runtime_error{"read failed"};
}

int main() {
    auto source = readings();
    try {
        for (const int value : source) {
            std::cout << value << '\n';
        }
    } catch (const std::runtime_error& error) {
        std::cout << error.what() << '\n'; // 先输出 220，再输出 read failed
    }
}
```

本例错误发生在推进到第二项时，捕获范围围绕消费过程。只围绕 `readings()` 调用，不能捕获后来遍历中的异常；状态分配等创建时失败则属于另一时刻。

## 已产出的副作用不会自动撤回

消费者已经保存或输出了 220，后来失败不会回滚这一行为。若任务要求全部数据有效才提交结果，应先形成独立结果并验证，再完成外部提交。

业务缺失也可作为每项 expected 等值表达，但须明确是一项正常产出还是生成流程中止。不要把异常中断伪装成普通“没有更多值”。

> [!PRACTICE]
> 消费接口说明单遍性、错误出现时刻和部分结果策略。需要重复遍历或稳定快照时，明确物化；需要取消时，规定放弃继续后的状态拥有者和清理责任。

## 参考资料

- [C++23 工作草案：generator 的异常报告](https://timsong-cpp.github.io/cppwp/n4950/coro.generator)
