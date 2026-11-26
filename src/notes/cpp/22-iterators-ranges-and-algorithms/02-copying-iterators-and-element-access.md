---
title: 迭代器的复制与读写权限（Copying Iterators and Controlling Element Access）
date: 2026-09-17
order: 2
---

# 迭代器的复制与读写权限（Copying Iterators and Controlling Element Access）

保存当前遍历位置之后，继续推进另一个位置，是否会带着前者一起移动？给迭代器加上 `const`，限制的是位置，还是所指元素？对 `std::vector<double>` 的迭代器，这两个问题都要分别看位置对象和它访问的元素。

## 位置副本独立，访问的数据相同

> [!IMPORTANT] 位置副本与原元素
> 复制一个有效的 `vector` 迭代器会得到独立的位置对象。两份起初表示同一位置，若该位置指向元素，解引用任一份都访问这个原元素。合法递增其中一份时，另一份仍保存原来的位置。

用 `current` 初始化 `saved` 后，两者都指向首元素。执行 `++current` 后，`saved` 仍指向首元素。随后通过 `*saved` 给首元素赋值。

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0, 250.0};
    std::vector<double>::iterator current{samples.begin()};
    const std::vector<double>::iterator saved{current};

    ++current;
    *saved = 241.0;

    std::cout << *saved << ' ' << *current << '\n';
    std::cout << samples[0] << '\n';
}
```

输出 `241 245` 和 `241`。`current` 已经推进到第二个元素，`saved` 仍指向首元素。通过 `*saved` 写入的值也可以从 `samples[0]` 读到。

若要独立保存首元素的值，可以在第一个程序的 `main` 中紧接 `*saved = 241.0;` 声明 `const double value{*saved};`。此时 `value` 得到 `241.0`，以后首元素改值时仍保留这个数值。若要保留访问原元素的关系，可以保存迭代器或引用，并在访问前确认该关系仍然有效。

## 只读迭代器与不可改变的位置

`std::vector<double>::const_iterator` 是该容器的只读迭代器类型（constant iterator）。在有效的元素位置上解引用 `const_iterator`，会得到用于读取原元素的 `const double&`。

可修改容器的 `begin()`、`end()` 返回 `iterator`，`const` 容器的这两个成员则返回 `const_iterator`。如果容器本身可修改，但当前处理只需要读取，可以调用 `cbegin()` 和 `cend()`：它们返回只读迭代器，分别表示同样的起点与尾后位置。

`iterator` 可以转换为同一容器类型的 `const_iterator`，缩小访问权限；反向转换不成立。转换不复制元素，也不会改变原容器是否可修改。

| 位置变量的类型 | 类型是否允许递增和重新赋值 | 类型是否允许通过解引用修改元素 |
| --- | --- | --- |
| `std::vector<double>::iterator` | 可以 | 可以 |
| `const std::vector<double>::iterator` | 不可以 | 可以 |
| `std::vector<double>::const_iterator` | 可以 | 不可以 |
| `const std::vector<double>::const_iterator` | 不可以 | 不可以 |

执行 `++` 或 `*` 还要求迭代器位于有效的元素位置。即使把 `end()` 的结果保存到非 `const` 的变量中，递增或解引用这个尾后位置也会违反前置条件。给非 `const` 的迭代器变量重新赋值时，可以用有效的新位置替换已有位置。

这里也分两层判断，分别看位置对象本身和通过它访问元素的权限。[指针本身和所指对象的 const](../07-object-addresses-and-pointers/06-pointers-and-const-qualification.md#const-可以约束两个不同层次) · [视图对象和元素的只读关系](../20-fixed-size-sequences-and-contiguous-ranges/03-copying-views-and-element-access.md#视图对象的只读与元素的只读)

下面用 `fixed` 保留首元素的位置，并通过它修改首元素。`reader` 从同一位置开始读取，再前进到下一个元素。

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0};
    const std::vector<double>::iterator fixed{samples.begin()};
    std::vector<double>::const_iterator reader{samples.cbegin()};

    *fixed = 241.0;
    std::cout << *reader << '\n';

    ++reader;
    samples[1] = 246.0;
    std::cout << *reader << '\n';
}
```

程序输出 `241` 和 `246`。`fixed` 一直位于首元素，`*fixed = 241.0` 写入的值由仍在首元素位置的 `reader` 读到。接着 `reader` 前进到第二个元素，`samples[1]` 的赋值把它读到的值改为 `246`。

在两个迭代器声明后分别插入 `++fixed;` 和 `*reader = 247.0;`，两次编译都会失败。第一句试图推进 `const` 的位置对象。第二句试图通过 `const double&` 写入元素。

> [!IMPORTANT] 位置限定与元素访问权限
> **`const iterator` 固定位置对象，`const_iterator` 提供对元素的只读访问。** 两层权限分别判断。只读迭代器在有效的元素位置读取原元素，也能读到经其他合法路径写入的值。

## 复制与只读都不延长有效期

给位置加上 `const`，或者多保存一份副本，都不会使原元素延长生命周期。若 `vector` 的重新分配使旧元素位置失效，所有指向这些旧元素的副本都会受到影响；只读迭代器也没有额外的存储稳定保证。

同样，从函数返回局部容器的 `begin()`，只是把位置值带出了函数。局部容器随后销毁，返回的迭代器不能用于读取原元素。需要独立保留数据时，应当返回拥有数据的值；确需返回位置时，必须有继续存活的来源维持它。

> [!PRACTICE]
> 查找或检查元素而不修改时，`cbegin()`、`cend()` 能把只读意图落实到取得的位置类型上。需要修改找到的元素时，才从可修改容器取得 `iterator`。两种方式都需要维持来源及位置的有效性。

## 参考资料

- [C++23 工作草案：容器迭代器、只读迭代器与访问接口](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
- [C++23 工作草案：可重复遍历迭代器的位置副本保证](https://timsong-cpp.github.io/cppwp/n4950/forward.iterators)
- [C++23 工作草案：输入迭代器的解引用与递增前提](https://timsong-cpp.github.io/cppwp/n4950/input.iterators#tab:inputiterator)
- [C++23 工作草案：vector 重新分配与失效](https://timsong-cpp.github.io/cppwp/n4950/vector.capacity)
