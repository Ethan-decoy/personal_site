---
title: 序列对象与元素访问（Sequence Objects and Element Access）
date: 2026-09-11
order: 1
---

# 序列对象与元素访问（Sequence Objects and Element Access）

压力记录可以按采样先后组织成一组数据。为每个值单独声明变量，读取第二次采样、修正某次记录等操作就要依赖一串不同的名称。序列（sequence）按位置组织元素，使同一种访问方式能够用于这一组数据中的不同位置。

每批采样的数量可能不同，也可能在运行过程中继续增加，因此适合用 `std::vector` 管理这些记录。示例中的三个初值只确定这次创建时的元素数量，不会把容器类型固定为三项。

## 用元素类型组成容器类型

`std::vector` 是标准库提供的类模板（class template）：它根据元素类型提供相应的容器类型。写在尖括号中的 `double` 指定元素类型，`std::vector<double>` 整体就是一种具体容器类型的名称。这里的 `<` 和 `>` 属于类型写法，不是比较运算。

容器（container）负责管理它保存的元素对象。使用 `std::vector` 需要包含头文件 `<vector>`；像下面这样创建序列时，可以在花括号中按顺序给出元素初值。

下面的完整程序用 `samples` 保存三次采样，单位为千帕（kPa）。成员函数 `size()` 返回当前元素数量，`empty()` 返回是否没有元素；方括号 `[]` 提供下标访问（subscript access）。下标从 `0` 开始，因此第二次采样使用 `samples[1]` 访问。程序只读取这一份记录，所以容器声明为 `const`：

```cpp
#include <iostream>
#include <vector>

int main() {
    const std::vector<double> samples{240.0, 250.0, 245.0};

    std::cout << samples.size() << '\n';
    std::cout << samples.empty() << '\n';
    std::cout << samples[1] << '\n';
}
```

`samples` 管理三个 `double` 元素，它们按初值列表的顺序保存 `240.0`、`250.0`、`245.0`，对应下标 `0`、`1`、`2`。第二个值比第三个大，并不会让它们交换位置；当前顺序表达的是采样先后，没有自动按数值大小排序。

> [!IMPORTANT] 容器类型、序列对象与元素
> **对本节的 `std::vector<double>`，容器类型规定元素为 `double`，容器对象管理一组实际存在的 `double` 元素对象。**元素数量是具体容器当前状态的一部分，不由这个类型名固定为三。
>
> 序列为空时，容器对象仍然存在，只是没有元素。容器对象与它管理的元素对象需要分别辨认。

这里花括号中的三个数分别提供元素初值；作为对照，`const std::vector<double> empty_samples{};` 创建的是一个没有元素的容器对象。

程序使用的三个公开操作分别是：

| 表达式 | 含义 | 本例结果 |
| --- | --- | --- |
| `samples.size()` | 返回当前元素数量 | `3` |
| `samples.empty()` | 返回序列是否没有元素 | `false` |
| `samples[1]` | 访问下标为 `1` 的元素 | 指定保存 `250.0` 的元素 |

程序输出三行，分别是 `3`、`0` 和 `250`；这里 `false` 按默认输出形式显示为 `0`。

## 元素数量决定有效下标

> [!IMPORTANT] 元素数量与有效下标
> **对 `std::vector<double>`，下标必须指定当前已经存在的元素。**元素数量为 `n` 且 `n > 0` 时，有效下标为 `0` 到 `n - 1`；`n == 0` 时没有任何有效下标。
>
> `size()` 返回的是元素数量，不是最后一个有效下标。三个元素的最后一个有效下标是 `2`，不是 `3`。

`size()` 的返回类型名为 `std::vector<double>::size_type`，是容器公开的无符号整数类型。类除了公开成员函数，也可以公开类型名称；这里的 `::size_type` 指定 `std::vector<double>` 类作用域中的类型名，不是读取某个对象的数据成员。

保留头文件，把开篇 `main` 的函数体替换为下面的片段。这次需要修改元素，所以使用非 `const` 的容器对象：

```cpp
std::vector<double> samples{240.0, 250.0, 245.0};
const std::vector<double>::size_type index{1};

if (index < samples.size()) {
    samples[index] = 247.0;
    std::cout << samples[index] << '\n';
}
```

`index` 与元素数量使用同一种无符号整数类型。本例中 `1 < 3` 成立，赋值把第二个元素从 `250.0` 改为 `247.0`，序列仍有三个元素，输出为 `247`。若条件不成立，这个 `if` 的语句块不执行，也就不会发生其中的下标访问。

> [!WARNING] 越界访问具有未定义行为
> 在 C++23 中，`std::vector` 的 `[]` 要求调用者保证下标有效。访问 `samples[samples.size()]` 已经越过末尾；空序列上的 `samples[0]` 同样越界。这些访问具有未定义行为，不能依赖它们返回零、自动建立元素或自动报告错误。

使用无符号类型也不意味着下标天然有效。它不能表示负值，但仍能保存大于或等于 `size()` 的值。把负整数转换为无符号类型，也不能替代范围检查。应当检查实际下标，而不是只检查类型。

## 下标访问可以保留元素身份

对本节的 `std::vector<double>`，有效下标访问指定已有元素，可以用于读取、赋值或绑定引用。通过可修改路径访问时，下标操作按 `double&` 返回；通过只读路径访问时，按 `const double&` 返回。

保留上一段修改第二个元素的 `main`，把下面片段接在 `if` 语句之后、`main` 的右花括号之前。这里的 `samples` 非空且允许修改，所以 `samples[0]` 指定有效的第一个元素：

```cpp
double& first{samples[0]};
first = 242.0;

const std::vector<double>& read_only{samples};
const double& observed{read_only[0]};
const double value{samples[0]};

first = 244.0;

std::cout << samples[0] << ' ' << observed << ' ' << value << '\n';
```

`first` 绑定第一个元素，先把它改为 `242.0`。`read_only` 是访问同一容器的只读引用，`observed` 再通过这条路径绑定同一个元素。这些引用绑定都没有复制容器或元素；`value` 则是新建的独立 `const double` 对象，初始化时读取元素保存的 `242.0`。

随后，`first = 244.0;` 修改原元素，几个访问结果随之分开：

| 执行完成的位置 | `samples[0]` | 经 `observed` 读取 | `value` 保存的值 |
| --- | ---: | ---: | ---: |
| `value` 初始化后 | `242.0` | `242.0` | `242.0` |
| `first = 244.0;` 后 | `244.0` | `244.0` | `242.0` |

这个片段新增的一行输出是 `244 244 242`。只读引用仍然访问原元素，因此能读到经另一条可写路径更新后的值；独立对象 `value` 保留自己的 `242.0`。

> [!IMPORTANT] 元素引用与独立对象
> **对本节 `std::vector<double>` 的有效下标访问会指定已有元素：直接绑定引用保留该元素身份，用元素值初始化新的 `double` 对象则建立独立对象。**应区分元素对象、访问它的引用，以及保存独立状态的新对象。
>
> 只读引用限制经当前路径修改元素，不会把元素冻结在绑定时的旧值。通过其他允许的路径改变元素后，只读引用读取的是同一元素的当前值。

这里仅给已有 `double` 元素赋新值，不改变元素数量或存储位置，因此元素身份和这些引用保持有效。容器能够改变元素数量，但保存的元素引用还必须遵守[序列存储与引用有效性](04-sequence-storage-and-reference-validity.md#追加元素怎样影响引用)中的条件；容器仍然存在，并不保证它曾经管理的每个元素都仍然有效。

## 参考资料

- [C++23 工作草案：vector 概览与公开接口](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：序列容器的下标访问](https://timsong-cpp.github.io/cppwp/n4950/sequence.reqmts#118)
- [C++23 工作草案：容器的数量类型与查询操作](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts)
