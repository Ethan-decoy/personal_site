---
title: 内存资源与分配生命周期（Memory Resources and Allocation Lifetime）
date: 2026-10-08
order: 1
---

# 内存资源与分配生命周期（Memory Resources and Allocation Lifetime）

一些短期对象共同经历“收集、处理、整体结束”的阶段，逐项分配策略可能成为工程约束。内存资源（Memory Resource）将存储取得策略与容器元素语义分开。

## pmr 容器借用分配资源

`<memory_resource>` 提供 `std::pmr::monotonic_buffer_resource`，按资源契约累积取得存储，通常不在每次单项释放时归还，而在整体 release 或资源结束时释放。

`std::pmr::vector<T>` 是使用对应多态分配器的 vector 类型。下面让资源先创建、容器后创建，销毁时容器先结束：

```cpp
#include <iostream>
#include <memory_resource>
#include <vector>

int main() {
    std::pmr::monotonic_buffer_resource resource;
    std::pmr::vector<int> readings{&resource};
    readings.push_back(220);
    readings.push_back(230);
    std::cout << readings[0] << ' ' << readings[1] << '\n'; // 220 230
}
```

容器仍维护元素构造销毁、size、capacity 和再分配失效规则。resource 不是保存业务值的另一份容器。

## 资源寿命必须覆盖使用与释放

容器保存的是对资源的关系，不自动共同拥有 resource。把容器移出资源作用域，或在容器仍需要存储时调用 release，都可能破坏生命周期。

批量释放存储也不替每个活跃对象执行析构；先结束对象责任，再结束存储责任。选择资源还需检查对齐、上游分配与并发访问契约。

> [!PRACTICE]
> 只有测量与阶段生命周期支持时再改变分配策略。优化分配不能削弱对象销毁、借用有效期或接口可复制性，默认容器仍是清楚的起点。

## 参考资料

- [C++23 工作草案：多态分配资源](https://timsong-cpp.github.io/cppwp/n4950/mem.res)
- [C++23 工作草案：monotonic_buffer_resource](https://timsong-cpp.github.io/cppwp/n4950/mem.res.monotonic.buffer)
