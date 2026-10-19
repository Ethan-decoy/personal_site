---
title: 受限访问与容器适配器（Restricted Access and Container Adaptors）
date: 2026-10-08
order: 4
---

# 受限访问与容器适配器（Restricted Access and Container Adaptors）

有些任务只允许按规则取下一项，不需要暴露全部序列。容器适配器（Container Adaptor）在底层容器上限制接口，使调用方按对应次序访问。

## 栈、队列与优先队列提供不同入口

`std::stack` 位于 `<stack>`，按后进先出访问 top；`std::queue` 位于 `<queue>`，按先进先出访问 front；同一头文件中的 `std::priority_queue` 访问比较关系规定的优先项。

`push` 添加项，`pop` 删除当前可取项且不返回它。top、front 和 pop 都需要非空前提。

```cpp
#include <iostream>
#include <queue>

int main() {
    std::queue<int> pending{};
    pending.push(220);
    pending.push(230);
    std::cout << pending.front() << '\n'; // 220
    pending.pop();
    std::cout << pending.front() << '\n'; // 230

    std::priority_queue<int> urgent{};
    urgent.push(220);
    urgent.push(240);
    urgent.push(230);
    std::cout << urgent.top() << '\n'; // 240
    urgent.pop();
    std::cout << urgent.top() << '\n'; // 230
}
```

默认整数优先队列先给最大值。指定 std::greater 等不同严格弱序关系，可以改变优先方向；比较器须在当前元素上给出有效且一致的严格弱序。已经入队的元素若因外部状态变化而改变相对优先级，原来的堆关系就可能不再满足新比较结果，不能仍凭旧组织取得正确优先项。

相同优先级也不自动保留入队先后。需要按先到先取处理并列项时，必须把这项业务规则明确放进组织方式或比较依据；严格弱序要求与稳定排序保留等价元素次序，是两项不同的契约。

## 限制接口不等于没有底层成本

priority_queue 通常用堆组织关系，top 是常数访问，push 和 pop 涉及对数规模的比较，底层容器增长还可能分配。它不提供按任意键查找或修改已有项的统一接口。

这些适配器不直接公开普通遍历入口。若业务需要频繁检查任意项、稳定身份或取消指定任务，应选择匹配的组织方式，不能只因名字含“队列”就强行套用。

> [!PRACTICE]
> 次序属于业务规则时，用受限接口减少误用。容器选择同时检查访问方向、位置稳定性、连续性、成本和拥有关系；标准库容器介绍不替代一般算法设计与数据结构证明。

## 参考资料

- [C++23 工作草案：容器适配器](https://timsong-cpp.github.io/cppwp/n4950/container.adaptors)
- [C++23 工作草案：priority_queue](https://timsong-cpp.github.io/cppwp/n4950/priority.queue)
