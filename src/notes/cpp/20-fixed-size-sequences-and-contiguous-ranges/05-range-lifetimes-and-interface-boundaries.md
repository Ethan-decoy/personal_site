---
title: 范围借用的有效期与接口边界（Range Lifetimes and Interface Boundaries）
date: 2026-09-15
order: 5
---

# 范围借用的有效期与接口边界（Range Lifetimes and Interface Boundaries）

`span` 让函数访问一段连续元素，元素的生命周期由拥有者管理。使用视图时，要确认所借用的元素仍然有效，也要核对视图记录的范围是否涵盖本次操作需要的元素。

与[单个对象的借用](../19-dynamic-objects-and-exclusive-ownership/02-transferring-ownership-and-object-identity.md#读取地址没有取得清理责任)一样，视图依赖拥有者维持被借用对象的有效期。范围借用还要记录元素数量。

## 元素可以更新，范围数量不会自动跟随

> [!IMPORTANT] 视图长度与元素有效性分别判断
> `span` 记录所选范围的起点和元素数量。只要所借用的元素仍然有效，通过视图就能读到它们更新后的值。拥有者增加或删除元素时，已有视图的 `size()` 仍返回自己记录的数量。需要借用当前整个序列时，应从拥有者重新建立视图。

本节的压力读数以千帕（kPa）为单位。下面先调用 `reserve(3)`，成功后容量至少为三，再为已有两项建立只读视图。随后成功追加一项时，总数仍在容量内，原来的两个元素依然可以通过该视图访问。

```cpp
#include <iostream>
#include <span>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0};
    samples.reserve(3);
    const std::span<const double> first_batch{samples};

    samples.push_back(250.0);
    samples[0] = 242.0;

    std::cout << first_batch.size() << ' ' << samples.size() << '\n';
    std::cout << first_batch[0] << '\n';

    const std::span<const double> current_batch{samples};
    std::cout << current_batch.size() << '\n';
}
```

程序依次输出 `2 3`、`242` 和 `3`。追加后，`samples` 有三个元素，`first_batch` 仍只借用原有的两项。第一个读数经由 `samples[0]` 改为 `242` 后，从 `first_batch[0]` 也能读到这个值。`current_batch` 在追加后建立，覆盖当时的三项读数。

## 重新分配会使旧范围失效

容量内追加可以保留已有元素的访问关系，重新分配则不能。[vector 的存储规则](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md#追加元素怎样影响引用)规定：如果追加前已经满足 `size() == capacity()`，成功追加就需要重新分配。旧元素的指针和引用随之失效，依赖这些位置的旧 `span` 也不能继续用于访问。

`reserve` 同样可能触发重新分配：请求数量大于原容量时，成功调用会更换存储。因此，示例把预留放在建立视图之前；先建立视图，再扩大容量，不能保留同样的安全结论。

对于指向当前已有元素的非空视图，可以据此区分几个操作：

| 操作 | 旧视图与原元素的关系 |
| --- | --- |
| 给已有元素赋值 | 访问关系保留，读取到的值可能变化 |
| 在剩余容量内向 `vector` 末尾追加 | 原元素访问仍然有效，旧视图的数量保持不变 |
| `vector::pop_back()` 删除旧视图覆盖的尾元素 | 被删除的元素寿命结束，旧视图仍记录原来的数量 |
| `vector` 成功重新分配存储 | 原元素访问失效，旧视图不能继续访问元素 |
| 只销毁某个视图对象 | 不销毁元素，其他视图是否有效仍取决于元素本身 |
| 拥有者销毁它管理的元素 | 对这些元素的借用失效，无论视图自身是否仍然存在 |

从旧视图取得的[子范围](04-subranges-and-interval-boundaries.md#用起点偏移与数量选出一段元素)也借用同一组元素。它没有复制数据，因而不会通过缩短范围避开整块元素存储的重新分配。

例如，在建立 `current_batch` 后调用 `samples.pop_back()`，第三项读数就会被销毁。即使容量保持原值，`current_batch.size()` 也仍返回 `3`，遍历这三项会访问寿命已结束的元素。

`size()` 和 `empty()` 查询的是视图记录的数量。能否访问这些元素，要根据容器修改的失效规则和元素的实际生命周期判断。

## 返回局部拥有者的视图会留下悬空访问

按值返回 `span` 会把范围记录交给调用者。下面的返回表达式在语言层面成立，编译器也可能发出悬空借用的警告。

```cpp
#include <array>
#include <span>

std::span<const double> make_sample_view() {
    const std::array<double, 3> samples{240.0, 245.0, 250.0};
    return std::span<const double>{samples};
}
```

返回表达式建立了指向局部 `samples` 元素的视图。离开函数时，局部数组及其元素被销毁，调用者得到悬空视图（dangling view）。通过它读取元素具有未定义行为。

返回类型中的 `const` 限制修改权限，不延长元素的生命周期。把局部 `array` 换成局部 `vector`，也不会改变这项错误；两者都在函数退出时销毁自己管理的元素。

临时拥有者具有同样的边界。下面是包含 `<span>` 和 `<vector>` 后可放入函数体的错误用法；声明本身允许成立，但声明结束后就不能通过 `view` 访问元素：

```cpp
const std::span<const double> view{std::vector<double>{240.0, 245.0, 250.0}};
```

这里的临时 `vector` 在整条声明的完整表达式结束时销毁。`span<const double>` 允许从这种临时序列建立只读访问，却不接管其存储，也不把临时对象的生命周期延长到 `view` 的作用域末尾。编译器能够检查是否存在合适的构造方式，不代表它已经证明这次借用会一直有效。

## 返回调用方所提供数据的子范围

返回视图适合表达“从已有数据中选出一段”。函数需要说明结果借用哪些元素，以及由谁维持它们有效。

下面的 `after_first` 返回去掉第一个元素后的范围；输入为空时返回原来的空范围。它只改变选取边界，不创建新的采样数据：

```cpp
#include <array>
#include <iostream>
#include <span>

std::span<const double> after_first(std::span<const double> samples) {
    if (samples.empty()) {
        return samples;
    }

    return samples.subspan(1);
}

int main() {
    const std::array<double, 3> samples{240.0, 245.0, 250.0};
    const std::span<const double> selected{after_first(std::span<const double>{samples})};

    for (const double value : selected) {
        std::cout << value << '\n';
    }
}
```

程序输出 `245` 和 `250`。被借用的数组位于 `main` 中，直到遍历结束仍然存在。`after_first` 的形参也是一个独立视图，形参视图的销毁不会影响数组元素；返回的子视图可以继续借用这些元素。

给上例补上 `<vector>`，将下面的片段放在 `main` 的末尾。调用 `after_first` 时，从临时 `vector` 隐式构造 `std::span<const double>` 形参，再通过返回的子视图读取原序列的第二项。调用和读取都在同一完整表达式内完成。

```cpp
const double next{after_first(std::vector<double>{240.0, 245.0})[0]};
std::cout << next << '\n';
```

读取发生时临时 `vector` 仍然有效。复制出的 `next` 是独立的 `double` 对象，在临时 `vector` 销毁后输出 `245`。

在相同语境中，如果把上面两行换成下面的声明，保存的是返回的视图。

```cpp
const std::span<const double> saved{after_first(std::vector<double>{240.0, 245.0})};
```

临时 `vector` 在这条声明的完整表达式结束时销毁。到下一条语句时，`saved` 已经悬空，再通过它读取元素会导致未定义行为。

> [!PRACTICE] 按接口责任选择借用或拥有
> 函数只在调用期间处理已有连续数据时，可以按值接收 `span`，调用方负责维持元素在处理期间有效。需要增减调用方容器中的元素时，可使用 `std::vector<T>&` 这类能够修改容器的形参。
>
> 返回子范围或保存视图供后续使用时，接口应说明视图借用哪段数据，以及这些元素须保持有效到何时。交付独立结果或快照时，按值返回拥有元素的 `std::array` 或 `std::vector`。调用方拿到结果后可以从中建立视图。

固定长度也不免除生命周期判断。`array` 的元素属于数组对象本身，将它移动构造到另一个数组会建立另一组元素；已经建立的视图仍然指向源数组的元素，不会自动改为借用目标数组。安排借用时，应跟踪实际被访问的对象，而不是只看某份数值是否已经交给了其他变量。

## 参考资料

- [C++23 工作草案：span 的非拥有模型](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
- [C++23 工作草案：span 的构造、复制与赋值](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 工作草案：span 的数量查询](https://timsong-cpp.github.io/cppwp/n4950/span.obs)
- [C++23 工作草案：span 的子范围](https://timsong-cpp.github.io/cppwp/n4950/span.sub)
- [C++23 工作草案：vector 的容量与重新分配](https://timsong-cpp.github.io/cppwp/n4950/vector.capacity)
- [C++23 工作草案：vector 的增删与失效规则](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers)
- [C++23 工作草案：序列容器销毁尾元素](https://timsong-cpp.github.io/cppwp/n4950/sequence.reqmts)
- [C++23 工作草案：临时对象的销毁](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：array 的隐式特殊成员函数](https://timsong-cpp.github.io/cppwp/n4950/array.cons)
