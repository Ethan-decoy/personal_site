---
title: list 与稳定元素位置（List and Stable Element Positions）
date: 2026-10-08
order: 3
---

# list 与稳定元素位置（List and Stable Element Positions）

如果已经定位到一项，需要在其附近插入或删除，同时保持其他元素的访问稳定，链式容器（Linked Container）提供不同于连续序列的契约。它不自动让“查找到那一项”变快。

## list 在已知位置修改链接关系

`std::list<T>` 在 `<list>` 中提供双向遍历。单项插入在给定位置前完成，已有其他元素的迭代器和引用保持有效；删除使被删除项的访问失效。

```cpp
#include <iostream>
#include <list>

int main() {
    std::list<int> values{220, 230};
    const int& first = values.front();
    auto position = values.begin();
    ++position;

    values.insert(position, 225);
    values.erase(position);
    std::cout << first << '\n'; // 220
    for (int value : values) {
        std::cout << value << ' ';
    }
    std::cout << '\n'; // 220 225
}
```

position 原本指向 230，插入后仍指向它；删除之后不能再使用该位置。first 指向未删除的 220，保持有效。

## 常数修改不包括任意位置查找

“在给定位置插入一项”的常数元素操作成本，不包括遍历到那个位置。list 没有普通下标访问，也不支持要求随机访问的 std::sort；其成员 sort 提供符合自身组织的排序操作。

list 还提供 `splice` 在规定条件下转移节点关系，但必须核对分配器兼容、转移形式及相应复杂度，不应把全部转移都称作无条件常数。

`std::forward_list` 是只提供前向遍历的链式容器，其修改接口围绕前驱位置，不具有 list 的全部操作；选择它应来自确切访问需求。

> [!TIP]
> 分别计入定位、修改、分配和遍历成本。大量随机访问、紧密遍历或简单尾部增长通常仍以 vector 为起点；稳定位置需求真实存在时，再考虑链式关系。

## 参考资料

- [C++23 工作草案：list](https://timsong-cpp.github.io/cppwp/n4950/list)
- [C++23 工作草案：节点转移](https://timsong-cpp.github.io/cppwp/n4950/list.ops)
