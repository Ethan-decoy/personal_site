---
title: 范围 for 与保存的遍历边界（Range-Based for and Saved Traversal Boundaries）
date: 2026-09-17
order: 1
---

# 范围 for 与保存的遍历边界（Range-Based for and Saved Traversal Boundaries）

范围 for 把“取得位置、检查末尾、前进一步”放进了语言提供的循环形式中。它省去了显式管理迭代器的代码，但遍历仍然依赖这些位置持续有效。

本文只分析对具名 `std::vector<double>` 的遍历：容器在整个循环期间存活，循环直接访问其中已有的元素。借助这样的具体展开，可以解释每轮变量的初始化，以及追加元素为何会破坏循环原先取得的边界。

## 具名容器的遍历可以怎样展开

包含 `<vector>` 且函数体中已有 `std::vector<double> samples` 时，下面的片段会为每项压力读数增加 `5.0` kPa：

```cpp
for (double& value : samples) {
    value += 5.0;
}
```

对这个具体循环，可以用已建立的引用与迭代器语义写出等价的遍历过程。先绑定原容器，取得起点和结束位置，再逐项解引用。以下是完整程序；中间的代码块对应上面的范围 for。

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0, 250.0};

    {
        std::vector<double>& range{samples};
        std::vector<double>::iterator current{range.begin()};
        const std::vector<double>::iterator last{range.end()};

        for (; current != last; ++current) {
            double& value{*current};
            value += 5.0;
        }
    }

    for (const double value : samples) {
        std::cout << value << ' ';
    }
    std::cout << '\n';
}
```

输出为：

```text
245 250 255
```

`range` 是原容器的引用，不会复制整份序列。`current` 和 `last` 在进入循环前取得；每轮先比较位置，未到末尾才执行 `*current`，循环体结束后再通过 `++current` 前进。空容器的起点等于末尾，因此第一次比较就会结束循环。

这里显式写出类型，并把没有再赋值的 `last` 声明为 `const`，用于呈现当前具名容器的遍历行为；这不是适用于所有范围表达式的完整语言展开规则。`break` 仍直接退出循环，`continue` 则转入循环的递增步骤。

## 每轮变量由当前元素初始化

展开中的 `double& value{*current}` 说明了范围 for 每轮声明的作用。解引用取得当前元素，随后按照变量声明决定是建立局部副本，还是绑定元素本身。

| 范围 for 中的声明 | 对当前元素的处理 | 修改的影响 |
| --- | --- | --- |
| `double value` | 用元素值初始化独立的局部对象 | 修改 `value` 不会写回元素 |
| `double& value` | 将引用绑定到当前元素 | 给 `value` 赋值会修改元素 |
| `const double& value` | 通过只读引用访问当前元素 | 不能经由 `value` 修改元素 |

因此，若把示例的声明改为 `double value`，每轮仍能计算出增加后的数值，但容器中的读数保持不变。范围 for 不会在本轮结束时自动把局部值写回。

本例读取单个 `double` 的成本很低，打印时使用 `const double value` 已经足够。选择引用的理由应当来自当前操作：需要修改原元素时绑定可写引用，需要访问较大对象而不复制时可以使用只读引用；不能仅凭循环形式推断复制了多少数据。

## 保存的末尾不会随容器增长更新

展开中，`last` 在循环开始前取得，后续比较使用的都是这份位置记录。每轮不会重新调用 `end()`，也不会在容器修改后自动重新建立遍历范围。

假设 `samples` 原来有三项，容量足以容纳第四项。进入范围 for 后，循环已经保存了三项之后的结束位置。如果在循环体中调用 `samples.push_back(255.0)`，这次追加即使没有重新分配，也会让原结束位置失效。已有元素的引用和迭代器可以保留，并不意味着保存的 `last` 仍然有效。

若循环随后继续，它仍会把当前位置与这个已经失效的结束位置比较。原末尾如今恰好出现了一个新元素，也不能使旧的结束迭代器重新获得可用保证。这里的问题发生在遍历所需的位置关系上，不能靠增加 `reserve` 的数量修复。

> [!IMPORTANT]
> 遍历是否还能继续，需要同时检查当前元素位置和结束边界。`vector` 在容量内追加会保留已有元素的访问关系，但会使旧结束迭代器失效；缓存了旧末尾的范围 for 因而不能按原方式继续遍历。

只需读取或修改已有读数时，范围 for 能直接表达任务。若还要追加新数据，可以先完成本次遍历，再追加，并在下一次遍历时重新取得边界。需要一边查找一边删除时，则使用[删除操作返回的位置](../04-container-mutation-and-iterator-validity.md#删除一个元素后从返回的位置继续)继续推进；该返回值描述修改后的序列，不能让范围 for 继续沿用原先保存的位置。

## 参考资料

- [C++23 草案：范围 for 的起止位置与每轮初始化](https://timsong-cpp.github.io/cppwp/n4950/stmt.ranged)
- [C++23 草案：vector 插入操作与位置失效](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers#2)
