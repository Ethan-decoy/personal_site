---
title: 迭代器位置与半开区间（Iterator Positions and Half-Open Ranges）
date: 2026-09-17
order: 1
---

# 迭代器位置与半开区间（Iterator Positions and Half-Open Ranges）

遍历一组采样值时，范围 `for` 可以直接提供每个元素。若需要保存“处理到了哪里”，或者把“从这里开始、到那里之前”的一段元素交给某个操作，就需要显式表示遍历位置。

迭代器（iterator）把遍历所需的操作组织成接口，使处理元素的代码不必围绕某一种容器的下标编写。本篇用 `std::vector<double>` 建立具体模型：**迭代器表示遍历位置，能够访问当前元素、推进到下一个位置，并与结束位置比较。**

## 从容器取得起点与终点

包含 `<vector>` 后，`std::vector<double>::iterator` 是该容器提供的一种迭代器类型。这里的 `::iterator` 指定类型名称，与 `::size_type` 的写法类似；它不是某个元素，也不是容器的成员函数。

对于可修改的 `std::vector<double> samples`，成员函数 `begin()` 和 `end()` 都返回这种类型的位置值：

| 调用 | 结果表示什么 |
| --- | --- |
| `samples.begin()` | 第一个元素的位置；容器为空时等于 `samples.end()` |
| `samples.end()` | 紧接最后一个元素之后的尾后位置（past-the-end position） |

`end()` 不表示最后一个元素，也不表示值为零的元素。它提供的是停止边界；空序列的起点和终点相等，仍然没有元素可以访问。

取得这些位置不会复制采样值，也不会转移容器的所有权。迭代器可以由指针或类类型实现，使用时依据公开操作，不假定它的具体表示。

## 比较位置、访问元素、推进位置

对这里仍然有效的迭代器，基本操作如下：

| 表达式 | 含义与条件 |
| --- | --- |
| `current == finish`、`current != finish` | 比较位置是否相同，用于判断是否到达当前区间的终点 |
| `*current` | 解引用，访问当前位置的元素；对于这里的可写迭代器，结果为 `double&` |
| `++current` | 把当前位置推进一个元素；从最后一个元素可以推进到尾后位置 |

尾后位置不能解引用，也不能继续递增。比较的两个位置应当来自同一有效序列；两个容器的元素类型相同，不意味着可以混用它们的起点与终点。

下面用显式位置遍历三个采样值，再观察空序列的两个边界。

`current` 是能够重新赋值和递增的位置对象。`finish` 前的 `const` 只表示这个局部位置不再改变；它并没有把容器变成只读。

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0, 250.0};
    std::vector<double>::iterator current{samples.begin()};
    const std::vector<double>::iterator finish{samples.end()};

    while (current != finish) {
        std::cout << *current << '\n';
        ++current;
    }

    const std::vector<double> empty{};
    std::cout << (empty.begin() == empty.end()) << '\n';
}
```

输出为 `240`、`245`、`250` 和 `1`，各占一行。循环先判断边界，再读取元素，最后推进位置；到达 `finish` 后，下一次判断结束循环，不会访问或越过尾后位置。循环期间没有改变容器的元素数量或存储，因此保存的边界持续有效。

## 两个位置组成半开区间

用起点 `first` 和终点 `last` 描述的半开区间写作 **`[first, last)`**。对这里的迭代器，两端必须是同一序列中的有效位置，并且从 `first` 出发，经过有限次合法递增能够到达 `last`。

如果 `first == last`，零次递增就已到达终点，区间为空。否则，区间包含从 `first` 所指的元素开始、位于 `last` 之前的所有元素。同一段元素也可以用起点偏移和数量来表示。[用偏移和数量选取子范围](../20-fixed-size-sequences-and-contiguous-ranges/04-subranges-and-interval-boundaries.md#用起点偏移与数量选出一段元素)

`[samples.begin(), samples.end())` 覆盖全部采样值。如果用 `245.0` 的位置作为 `first`，用 `250.0` 的位置作为 `last`，区间只包含 `245.0`。访问这个值后递增一次就到达 `last`，遍历在读取 `250.0` 前停止。若两个端点都取 `245.0` 的位置，就得到位于容器中间的空区间。

> [!IMPORTANT] 半开区间的停止边界
> 遍历有效的 `[first, last)` 时，从 `first` 开始。**每次先比较当前位置与 `last`，尚未到达时才访问元素并递增。** 如果起点就等于终点，循环体一次也不执行。

> [!WARNING] 区间端点须属于同一序列且终点可达
> 如果用 `250.0` 的位置作为起点、`245.0` 的位置作为终点，递增无法到达终点。把两个独立容器的边界配成一对也违反端点要求。将这样的无效区间交给要求有效区间的标准库算法，会导致未定义行为。

## 位置仍然依赖原数据

迭代器表示访问关系，不拥有元素。容器销毁或某次操作使旧位置失效后，保存下来的迭代器不能继续用于访问、推进或判断原区间是否结束。仅仅写了 `current != finish`，不能证明参与比较的位置本身仍然有效。

`vector` 重新分配时，旧元素迭代器和旧尾后迭代器都会失效。[追加元素怎样影响引用](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md#追加元素怎样影响引用)

用 `samples.push_back(255.0)` 成功追加一个值后，先前保存的 `finish` 会失效。若追加后的数量仍在原容量内，指向原有元素的迭代器保持有效。再次遍历时应取得当前的 `end()`，并确认起点仍然有效。[容器修改与迭代器有效性](04-container-mutation-and-iterator-validity.md#修改数值与改变序列结构)

> [!PRACTICE] 需要控制遍历位置时显式使用迭代器
> 只需依次处理全部元素时，范围 `for` 更直接。需要保存某个位置、限定一段区间，或接收操作返回的位置时，再显式使用迭代器。选择取决于要表达的关系，不必为了使用迭代器而改写已有的简单循环。

## 参考资料

- [C++23 工作草案：迭代器、尾后位置与合法区间](https://timsong-cpp.github.io/cppwp/n4950/iterator.requirements.general)
- [C++23 工作草案：容器的迭代器类型及 begin、end](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
- [C++23 工作草案：vector 的接口与连续存储](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：vector 追加与迭代器失效](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers#2)
