---
title: deque 与两端访问（Deque and Access at Both Ends）
date: 2026-10-08
order: 2
---

# deque 与两端访问（Deque and Access at Both Ends）

一个序列需要不断从前端移除、向后端追加，同时偶尔按下标读取。vector 的前端删除需要后继元素补位；`std::deque` 为双端操作提供另一份契约。

## 双端操作和随机访问可以同时存在

双端队列（Double-Ended Queue）`std::deque<T>` 位于 `<deque>`。它支持随机访问和两端添加、删除，但不保证整个元素范围连续。

```cpp
#include <deque>
#include <iostream>

int main() {
    std::deque<int> pending{220, 230};
    pending.push_front(210);
    pending.push_back(240);
    pending.pop_front();
    std::cout << pending.front() << ' ' << pending.back() << '\n'; // 220 240
    std::cout << pending[1] << '\n';                               // 230
}
```

`push_front` 在前端添加元素，`pop_front` 删除前端元素；pop 要求非空，且不返回被删除的值。需要该值时先读取或移动出来，再删除。

## 成本取决于修改位置

设 deque 有 n 个元素；中间修改位置或范围之前有 a 个元素，之后有 b 个元素。下面的界限描述操作次数随规模的增长，不是实际耗时：

| 操作 | 成本契约 |
| --- | --- |
| 下标访问、随机访问迭代器的位置运算 | 常数成本 `O(1)`，不随访问位置增长 |
| 两端插入单个元素 | 常数成本 `O(1)`，只调用一次元素构造函数 |
| 两端删除单个元素 | 常数成本 `O(1)`，销毁被删除元素，不要求其余元素补位 |
| 中间插入单个元素 | `O(1 + min(a, b))`，最坏为 `O(n)` |
| 中间删除 k 个元素 | `O(k + min(a, b))`；析构次数为 k，对已有元素的赋值次数不超过 a、b 中的较小者 |

因此，持续从前端取出、向后端加入的序列，不必每次都承担 vector 前端删除的后继元素补位成本。中间修改仍可能随元素数量增长，不能把“双端高效”推广到所有位置。

这里的常数成本不承诺固定延迟，也不意味着插入时不会分配存储。元素构造、析构和分配本身的成本，仍会影响实际耗时。

## 位置和元素访问可以有不同有效期

在两端插入会使 deque 的迭代器失效，但按该操作契约，不使已有元素的引用失效。中间插入或删除则有更广的失效边界，不能套用端部操作结论。

deque 的下标访问不表示可以得到一份横跨全部元素的 span。随机访问是位置运算能力，连续存储是对象地址关系。

> [!PRACTICE]
> 同时需要两端操作和随机访问时考虑 deque。需要向外提供连续缓冲区时，vector 的契约更直接；不要凭“两种都有下标”就认为可互换。

## 参考资料

- [C++23 工作草案：deque](https://timsong-cpp.github.io/cppwp/n4950/deque)
- [C++23 工作草案：deque 修改与失效](https://timsong-cpp.github.io/cppwp/n4950/deque.modifiers)
