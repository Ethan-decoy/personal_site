---
title: 迭代器的复制与读写权限（Copying Iterators and Controlling Element Access）
date: 2026-09-17
order: 2
---

# 迭代器的复制与读写权限（Copying Iterators and Controlling Element Access）

保存当前遍历位置之后，继续推进另一个位置，是否会带着前者一起移动？给迭代器加上 `const`，限制的是位置，还是所指元素？这些问题需要把迭代器对象与它访问的元素分开判断。

本篇使用 `std::vector<double>` 的迭代器。它的有效副本可以各自推进；复制迭代器只复制位置，不复制容器或元素，也不会让两个局部变量变成彼此的引用。

## 位置副本独立，访问的数据相同

若 `current` 从 `samples.begin()` 取得位置，再用它初始化 `saved`，两者最初表示同一个元素。执行 `++current` 只改变 `current`，`saved` 仍留在首元素；通过 `*saved` 赋值则修改容器中的首元素。

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

输出 `241 245` 和 `241`。当前位置的推进与原元素的赋值分别作用于不同对象；保存位置没有产生一份独立的 `double`。

需要保存当前数值时，可以在有效位置上声明 `const double value{*saved};`，它读取元素并建立独立的小值。需要保留访问原元素的关系时，才保存迭代器或引用。独立的 `value` 不再依赖原元素的存储；迭代器或引用仍然依赖原元素及其访问关系保持有效。

## 只读迭代器与不可改变的位置

`std::vector<double>::const_iterator` 是该容器的只读迭代器类型（constant iterator）。对它解引用得到 `const double&`，不能通过它修改元素；只要迭代器对象本身没有 `const`，仍然可以赋值和递增。

可修改容器的 `begin()`、`end()` 返回 `iterator`，`const` 容器的这两个成员则返回 `const_iterator`。如果容器本身可修改，但当前处理只需要读取，可以调用 `cbegin()` 和 `cend()`：它们返回只读迭代器，分别表示同样的起点与尾后位置。

`iterator` 可以转换为同一容器类型的 `const_iterator`，缩小访问权限；反向转换不成立。转换不复制元素，也不会改变原容器是否可修改。

| 位置变量的类型 | 能否推进或重新赋值该变量 | 能否通过解引用修改 double 元素 |
| --- | --- | --- |
| `std::vector<double>::iterator` | 可以 | 可以 |
| `const std::vector<double>::iterator` | 不可以 | 可以 |
| `std::vector<double>::const_iterator` | 可以 | 不可以 |
| `const std::vector<double>::const_iterator` | 不可以 | 不可以 |

表中元素访问始终以位置有效且可以解引用为前提。这里的两层限制与[指针本身和所指对象的 const](../07-object-addresses-and-pointers/06-pointers-and-const-qualification.md)、[视图对象和元素的只读关系](../20-fixed-size-sequences-and-contiguous-ranges/03-copying-views-and-element-access.md)一致。

下面固定一个可写位置，再用只读位置依次观察元素：

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

输出 `241` 和 `246`。`fixed` 的位置没有改变，但它仍能访问可修改元素；`reader` 能够推进，只是不能通过它写入。原容器通过其他合法路径修改元素后，`reader` 会观察到新值。

在这个程序中添加 `++fixed` 会因修改 `const` 位置对象而编译失败；添加 `*reader = 247.0` 则会因尝试通过只读引用赋值而编译失败。两者不是同一种限制。

> [!IMPORTANT]
> `const iterator` 固定的是位置，`const_iterator` 限制的是元素访问权限。只读迭代器不保存快照，也不会把所有其他访问路径一并变成只读。

## 复制与只读都不延长有效期

给位置加上 `const`，或者多保存一份副本，都不会使原元素延长生命周期。若 `vector` 的重新分配使旧元素位置失效，所有指向这些旧元素的副本都会受到影响；只读迭代器也没有额外的存储稳定保证。

同样，从函数返回局部容器的 `begin()`，只是把位置值带出了函数。局部容器随后销毁，返回的迭代器不能用于读取原元素。需要独立保留数据时，应当返回拥有数据的值；确需返回位置时，必须有继续存活的来源维持它。

> [!PRACTICE]
> 查找或检查元素而不修改时，`cbegin()`、`cend()` 能把只读意图落实到取得的位置类型上。需要修改找到的元素时，才从可修改容器取得 `iterator`。两种方式都需要维持来源及位置的有效性。

## 参考资料

- [C++23 工作草案：容器迭代器、只读迭代器与访问接口](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
- [C++23 工作草案：可重复遍历迭代器的位置副本保证](https://timsong-cpp.github.io/cppwp/n4950/forward.iterators)
- [C++23 工作草案：vector 重新分配与失效](https://timsong-cpp.github.io/cppwp/n4950/vector.capacity)
