---
title: 输出范围与逐项变换（Output Ranges and Element Transformation）
date: 2026-10-08
order: 1
---

# 输出范围与逐项变换（Output Ranges and Element Transformation）

算法可以读输入区间，却不会自动为一个普通输出迭代器扩容。把结果写到哪里、那里是否已经有对象，是独立的存储契约。

## 普通输出位置要求足够的现有元素

`<algorithm>` 中的 `std::ranges::transform` 将输入范围的每项交给操作，把结果逐项写到输出位置。输出迭代器每次赋值后向前推进。

```cpp
#include <algorithm>
#include <iostream>
#include <iterator>
#include <vector>

int main() {
    const std::vector<int> source{220, 230};
    std::vector<int> target(source.size());
    std::ranges::transform(source, target.begin(), [](int value) { return value + 10; });

    std::vector<int> appended{};
    std::ranges::transform(
        source, std::back_inserter(appended), [](int value) { return value + 10; });

    std::cout << target[0] << ' ' << target[1] << '\n';     // 230 240
    std::cout << appended[0] << ' ' << appended[1] << '\n'; // 230 240
}
```

target 按数量构造，已经有两个元素对象。`reserve` 只准备容量，不能代替这项构造；对 size 为零的容器使用 begin 作为普通写入位置，没有可赋值的元素。

## 插入迭代器把赋值转换为追加

`std::back_inserter` 在 `<iterator>` 中创建尾插入迭代器（Back Insert Iterator），对它赋值会调用目标容器的 `push_back`。容器因此负责新增元素，仍可能分配、迁移或抛异常。

`std::ranges::copy` 逐项复制输入到输出，也遵循输出位置的相应契约。用插入迭代器不代表复制免费，也不保证旧迭代器保持有效。

> [!WARNING]
> 从一个 vector 读取，同时向同一个 vector 尾插，可能使算法已保存的输入位置因再分配或末尾改变而失效。输出接口能扩容，不保证输入接口仍合法。

对适合原地逐项变换的情况，可以让输出从输入起点开始；错位重叠等更广情形不能从这个特例推出保证，还须满足相应算法的条件。

## 参考资料

- [C++23 工作草案：transform](https://timsong-cpp.github.io/cppwp/n4950/alg.transform)
- [C++23 工作草案：copy](https://timsong-cpp.github.io/cppwp/n4950/alg.copy)
- [C++23 工作草案：尾插入迭代器](https://timsong-cpp.github.io/cppwp/n4950/back.insert.iterator)
