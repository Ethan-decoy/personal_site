---
title: 容器修改与迭代器有效性（Container Mutation and Iterator Validity）
date: 2026-09-17
order: 4
---

# 容器修改与迭代器有效性（Container Mutation and Iterator Validity）

找到一个压力样本以后，可以通过迭代器修改它，也可能需要从序列中删除它。这两种操作对位置的影响不同：给现有元素赋值只改变数值，删除却会改变序列的排列和结束位置。继续处理之前，需要判断手中的迭代器是否仍然有效。

## 修改数值与改变序列结构

对 `std::vector<double>`，通过有效迭代器执行 `*cursor = 250.0`，只给当前位置的 `double` 赋值。元素数量、存储位置和结束位置都不改变，已有迭代器仍然有效。

[追加与预留容量](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md#已知数量时预留容量)则可能改变元素存储。把这些规则用于迭代器时，还要单独考虑 `end()`：它表示当前序列的结束边界，并不指向某个可以被保留的元素。

下面只讨论 `vector<double>` 上成功完成的操作：

| 操作与条件 | 已有元素的迭代器 | 原来的结束迭代器 |
| --- | --- | --- |
| 给已有 `double` 元素赋值 | 保持有效 | 保持有效 |
| `reserve(count)`，请求不超过原容量 | 保持有效 | 保持有效 |
| `reserve(count)`，请求超过原容量 | 全部失效 | 失效 |
| `push_back(value)`，追加后仍在原容量内 | 保持有效 | 失效 |
| `push_back(value)`，追加后超出原容量 | 全部失效 | 失效 |

重新分配会更换元素存储，旧迭代器不会自动跟随元素。即使没有重新分配，追加也改变了序列的结束边界，不能继续把原来的 `end()` 当作有效位置使用。

这里的失效是指原位置不再受容器的有效性保证支持。**失效迭代器不能继续用于解引用、递增或比较**；把它与当前 `end()` 比较，并不能检测它是否有效。需要继续操作时，可以从容器重新取得位置，再赋给原来的迭代器变量。

> [!WARNING]
> `reserve` 能为一段不超过容量的追加保留已有元素位置，却不能保留追加前的结束迭代器。提前缓存 `end()`，再一边追加一边用这个旧边界控制循环，仍然错误。

这些是 `vector` 的保证，不能只凭同样拥有连续存储就套用于 `string`；字符串修改的[字符访问失效规则](../21-text-ownership-and-borrowing/02-text-comparison-and-composition.md#字符串增长与存储变化)允许更广泛的失效。

## 删除一个元素后，从返回的位置继续

`vector` 的成员函数 `erase(position)` 删除指定位置的一个元素。`position` 必须是这个容器中仍然有效、可以解引用的位置，因此不能是 `end()`。它既可以由 `iterator` 给出，也可以由 `const_iterator` 给出；这里只用位置确定删除对象，实际修改由非 `const` 容器执行。

成功调用后，`size()` 减少一，后面的元素向前补齐，保留元素的相对次序不变。函数返回一个 `iterator`：如果被删元素原来有后继，返回该后继在删除后的位置；如果删掉的是最后一个元素，返回新的 `end()`。

对 `vector`，删除位置以及其后的旧迭代器和引用都会失效，包括旧的结束迭代器；删除位置之前的迭代器和引用保持有效。删除不需要重新分配，也会产生这类失效。

下面从压力样本中找到第一个值为 `-2.0` 的元素并删除，再读取删除后紧接着的元素。比较 `cursor != samples.end()` 是为了确认 `find` 确实找到了元素；删除之后再次检查，则是为了确认返回的位置仍然指向元素：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, -2.0, -3.0, 245.0};
    std::vector<double>::iterator cursor{std::find(samples.begin(), samples.end(), -2.0)};

    if (cursor != samples.end()) {
        cursor = samples.erase(cursor);
        if (cursor != samples.end()) {
            std::cout << *cursor << '\n';
        }
    }

    std::cout << samples.size() << '\n';
}
```

输出：

```text
-3
3
```

删除后序列为 `{240.0, -3.0, 245.0}`。调用前的 `cursor` 已经失效，赋值用 `erase` 返回的有效位置替换它。赋值右侧先完成删除并取得返回值，不需要在删除后读取旧迭代器才能完成更新。

> [!IMPORTANT]
> `erase` 返回的是删除之后可继续处理的位置。它既解决了旧位置失效的问题，也指出下一个尚未处理的元素；若返回新的 `end()`，就已经没有后继元素。

## 连续删除时，删除分支不再递增

假设当前记录的是绝对压力，业务规则要求剔除所有负值样本。删除一个样本后，后继会补到它原来的位置，所以应该直接检查 `erase` 返回的位置；只有保留当前样本时，才通过 `++cursor` 前进。

下面特意包含相邻的两个负值以及末尾的负值，分别体现连续删除和删除到末尾的行为：

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, -2.0, -3.0, 245.0, -4.0};
    std::vector<double>::iterator cursor{samples.begin()};

    while (cursor != samples.end()) {
        if (*cursor < 0.0) {
            cursor = samples.erase(cursor);
        } else {
            ++cursor;
        }
    }

    for (const double value : samples) {
        std::cout << value << '\n';
    }
}
```

输出：

```text
240
245
```

保留 `240.0` 后，迭代器前进到 `-2.0`。删除 `-2.0` 返回指向 `-3.0` 的位置，下一轮直接检查并删除 `-3.0`；若在删除后还额外递增，就会跳过这个紧邻的负值。删除最后的 `-4.0` 时，返回值是新的 `end()`，下一次条件检查自然结束循环，不能再递增这个结束位置。

循环每轮都重新调用 `samples.end()`，因此没有使用删除前缓存的结束迭代器。循环体内的解引用只发生在 `cursor != samples.end()` 已经成立之后；即使输入为空，或者所有样本都被删除，这个边界关系也成立。

## 删除的成本来自后继元素补位

`vector` 需要维持连续存储。删除中间一个元素时，会把后继元素依次向前赋值，最后结束原末尾元素的生命周期。对本篇的 `double`，这是数值赋值；对于类类型，可能涉及移动赋值和析构。它不是简单地留下一个空洞，也不等于只销毁指定位置上的对象。

因此，删除越靠前，通常需要处理的后继越多。若对含有 `n` 个元素的序列反复删除第一个元素，后继赋值次数会累计为 `(n - 1) + (n - 2) + ... + 1`，即 `n * (n - 1) / 2`。这样的工作量随元素数量按平方增长；一次正确的逐项遍历，不代表整个删除过程只需线性工作量。

> [!PRACTICE]
> 少量定位删除可以直接使用 `erase`，需要继续遍历时接住它的返回值。若任务是从大量样本中筛选出一份结果，也可以顺序读取输入，把保留的样本追加到另一个 `vector`，避免反复移动原序列的后继元素，代价是需要另一份存储。是否保留原序列、删除比例与数据规模，会影响这一选择。

## 参考资料

- [C++23 工作草案：vector 修改操作与迭代器失效](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers)
- [C++23 工作草案：vector 容量与预留](https://timsong-cpp.github.io/cppwp/n4950/vector.capacity)
- [C++23 工作草案：序列容器删除操作的前置条件与返回值](https://timsong-cpp.github.io/cppwp/n4950/sequence.reqmts)
