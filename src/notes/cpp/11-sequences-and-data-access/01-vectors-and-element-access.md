---
title: 序列对象与元素访问（Sequence Objects and Element Access）
date: 2026-09-11
order: 1
---

# 序列对象与元素访问（Sequence Objects and Element Access）

压力采样得到的多个数值属于同一组数据。为每个数值单独声明变量，会让读取第几个值、处理全部值等操作依赖一串不同的名称。**序列（sequence）把元素按照位置组织起来，让同一种访问方式适用于整组数据。**

## 用元素类型组成容器类型

`std::vector` 是标准库提供的类模板（class template）：它根据元素类型提供相应的容器类型。写在尖括号中的 `double` 指定元素类型，`std::vector<double>` 整体就是“保存 `double` 元素的序列容器”这一具体类型的名称。这里的 `<` 和 `>` 属于类型写法，不是比较运算。

容器（container）负责管理它保存的元素对象。使用 `std::vector` 需要包含头文件 `<vector>`；创建容器对象时，可以在花括号中依次给出元素的初始值。

下面用 `samples` 保存三个单位为 kPa 的采样值。成员函数 `size()` 返回当前元素数量，`empty()` 返回是否没有元素；方括号 `[]` 提供下标访问（subscript access），下标从 `0` 开始，因此第二个元素使用 `samples[1]` 访问：

```cpp
#include <iostream>
#include <vector>

int main() {
    const std::vector<double> samples{240.0, 245.0, 250.0};

    std::cout << samples.size() << '\n';
    std::cout << samples.empty() << '\n';
    std::cout << samples[1] << '\n';
}
```

`samples` 是一个容器对象，其中有三个依次保存 `240.0`、`245.0` 和 `250.0` 的 `double` 元素。花括号给出的是元素内容；空花括号 `std::vector<double> samples{};` 则创建一个没有元素的序列。

程序使用的三个公开操作分别是：

| 表达式 | 含义 | 本例结果 |
| --- | --- | --- |
| `samples.size()` | 返回当前元素数量 | `3` |
| `samples.empty()` | 返回序列是否没有元素 | `false` |
| `samples[1]` | 访问下标为 `1` 的元素 | 指定保存 `245.0` 的元素 |

本例三个元素的下标依次是 `0`、`1`、`2`。程序输出三行，分别是 `3`、`0` 和 `245`；这里 `false` 按默认输出形式显示为 `0`。

## 元素数量决定有效下标

下标必须小于当前元素数量。`size()` 返回的是数量，不是最后一个有效下标；空序列连下标 `0` 都没有。

`size()` 的返回类型名为 `std::vector<double>::size_type`，是容器公开的无符号整数类型。类除了公开成员函数，也可以公开类型名称；这里的 `::size_type` 指定 `std::vector<double>` 类作用域中的类型名，不是读取某个对象的数据成员。

下面的片段可以替换上述 `main` 函数体：

```cpp
std::vector<double> samples{240.0, 245.0, 250.0};
const std::vector<double>::size_type index{1};

if (index < samples.size()) {
    samples[index] = 247.0;
    std::cout << samples[index] << '\n';
}
```

`index` 与元素数量使用同一种无符号整数类型，条件为当前下标提供了范围检查。条件成立时，赋值修改的是第二个元素，序列仍有三个元素，输出为 `247`。

> [!WARNING]
> 在 C++23 中，`std::vector` 的 `[]` 要求调用者保证下标有效。访问 `samples[samples.size()]` 已经越过末尾；空序列上的 `samples[0]` 同样越界。这些访问具有未定义行为，不能依赖它们返回零或自动报告错误。

使用无符号类型也不意味着下标天然有效。它不能表示负值，但仍能保存大于或等于 `size()` 的值。把负整数转换为无符号类型，也不能替代范围检查。应当检查实际下标，而不是只检查类型。

## 下标访问可以保留元素身份

`samples[index]` 指定已有元素，能够用于读取、赋值，也能用于绑定引用。下面的片段放在声明了非空、非 `const` 的 `samples` 的函数体内：

```cpp
double& first{samples[0]};
first = 242.0;

const std::vector<double>& read_only{samples};
const double& observed{read_only[0]};
```

`first` 绑定第一个元素，赋值后 `samples[0]` 保存 `242.0`。`read_only` 提供对同一容器的只读访问，通过它取得的元素也只能只读访问，因此 `observed` 使用 `const double&`。

这里没有因为引用绑定而创建另一份序列，也没有创建另一个采样值对象。相反，`const double value{samples[0]};` 会创建一个独立的 `double`，用当前元素值初始化它。

> [!IMPORTANT]
> 序列对象、它管理的元素，以及从元素读取出来的独立值，是不同的对象。下标访问保留元素身份；是否建立一个独立值，取决于如何使用这个访问结果。

本篇只修改既有 `double` 元素的值，这不会改变元素身份。容器能够改变元素数量，但保存的元素引用还必须遵守[序列存储与引用有效性](04-sequence-storage-and-reference-validity.md)中的条件；容器仍然存在，并不保证它曾经管理的每个元素都仍然有效。

## 参考资料

- [C++23 工作草案：vector 概览与公开接口](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：序列容器的下标访问](https://timsong-cpp.github.io/cppwp/n4950/sequence.reqmts#118)
- [C++23 工作草案：容器的数量类型与查询操作](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
