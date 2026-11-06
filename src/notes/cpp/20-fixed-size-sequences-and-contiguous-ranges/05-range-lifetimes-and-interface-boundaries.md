---
title: 范围借用的有效期与接口边界（Range Lifetimes and Interface Boundaries）
date: 2026-09-15
order: 5
---

# 范围借用的有效期与接口边界（Range Lifetimes and Interface Boundaries）

`span` 让函数能够访问一段连续元素，却不负责维持这些元素的生命周期。视图变量仍在作用域内，只说明视图自身还存在；要继续访问采样值，还要检查原来的元素是否仍然有效，以及视图记录的范围是否仍然适用。

这与[单个对象的借用](../19-dynamic-objects-and-exclusive-ownership/03-borrowing-and-access-validity.md#读取地址没有取得清理责任)遵循同一条关系：保存访问方式，不等于接管目标的生命周期。范围还额外保存了数量，因此需要区分元素的当前状态与视图记录的边界。

## 元素可以更新，范围数量不会自动跟随

从一个具名 `vector` 建立 `span` 时，视图记录当时的起点与元素数量。它没有保存“每次访问都重新查询这个容器”的规则。容器后来增加了元素，旧视图也不会自动扩大。

下面先为至少三个元素预留容量，再建立包含两个元素的只读视图。随后追加第三个元素，并修改原来的第一个元素：

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

在预留和追加都成功的正常路径上，程序输出 `2 3`、`242` 和 `3`。这次追加没有超过预留的容量，原来的两个元素仍然有效，所以 `first_batch` 可以继续访问它们。第一个元素的值变为 `242`，视图也读到这个新值；其记录的数量仍然是二，不包含新追加的 `250`。

`current_batch` 在追加之后重新从容器建立，所以记录三个元素。`reserve(3)` 只保证容量至少为三，示例不依赖实际容量恰好等于三。

> [!IMPORTANT]
> 视图借用的是元素，保存的是一组访问边界。元素值发生变化时，视图能够观察到变化；拥有者的元素数量变化时，已有视图不会自动更新自己的数量。需要当前整个序列时，应从仍然有效的拥有者重新建立视图。

## 重新分配会使旧范围失效

容量内追加可以保留已有元素的访问关系，重新分配则不能。[vector 的存储规则](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md#追加元素怎样影响引用)规定：如果追加前已经满足 `size() == capacity()`，成功追加就需要重新分配。旧元素的指针和引用随之失效，依赖这些位置的旧 `span` 也不能继续用于访问。

`reserve` 同样可能触发重新分配：请求数量大于原容量时，成功调用会更换存储。因此，示例把预留放在建立视图之前；先建立视图，再扩大容量，不能保留同样的安全结论。

对于指向当前已有元素的非空视图，可以据此区分几个操作：

| 操作 | 旧视图与原元素的关系 |
| --- | --- |
| 给已有元素赋值 | 访问关系保留，读取到的值可能变化 |
| 在剩余容量内向 `vector` 末尾追加 | 原元素访问仍然有效，旧视图的数量保持不变 |
| `vector` 成功重新分配存储 | 原元素访问失效，旧视图不能继续访问元素 |
| 只销毁某个视图对象 | 不销毁元素，其他视图是否有效仍取决于元素本身 |
| 拥有者销毁它管理的元素 | 对这些元素的借用失效，无论视图自身是否仍然存在 |

从旧视图取得的[子范围](04-subranges-and-interval-boundaries.md#用起点偏移与数量选出一段元素)也借用同一组元素。它没有复制数据，因而不会通过缩短范围避开整块元素存储的重新分配。

失效不会把已有视图自动改成空范围。`size()` 和 `empty()` 只描述视图记录的数量，不能检测元素是否已经销毁。不能用“数量仍然为二”或“视图非空”证明访问安全，也不能通过运行失效后的读取来判断某次重新分配是否影响了视图。

## 返回局部拥有者的视图会留下悬空访问

按值返回 `span`，能够把视图对象交给调用者，却不会连同元素一起返回。下面是一个独立的错误函数；它可以通过类型检查，错误在于返回后元素已经不存在：

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

这项成立条件依赖元素拥有者，不依赖中间经过多少个视图。若调用者改为传入临时 `vector` 所建立的只读视图，再把返回结果保存下来，临时序列仍会在调用所在的完整表达式结束时销毁，函数不会替它延长寿命。

> [!PRACTICE]
> 函数只在调用过程中处理已有连续数据时，按值接收 `span` 可以直接表达借用，调用者需要保证这段数据在整个处理期间有效。函数要返回子范围或保存视图供之后使用时，接口还应明确借用来源，以及拥有者必须维持有效的时间。
>
> 函数负责生成独立结果时，应按值返回拥有数据的 `array` 或 `vector`。调用者取得拥有者之后，再根据访问需要建立视图；返回一个视图不能替代结果数据的交付。

固定长度也不免除生命周期判断。`array` 的元素属于数组对象本身，将它移动构造到另一个数组会建立另一组元素；已经建立的视图仍然指向源数组的元素，不会自动改为借用目标数组。安排借用时，应跟踪实际被访问的对象，而不是只看某份数值是否已经交给了其他变量。

## 参考资料

- [C++23 工作草案：span 的非拥有模型](https://timsong-cpp.github.io/cppwp/n4950/span.overview)
- [C++23 工作草案：span 的构造、复制与赋值](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
- [C++23 工作草案：span 的数量查询](https://timsong-cpp.github.io/cppwp/n4950/span.obs)
- [C++23 工作草案：span 的子范围](https://timsong-cpp.github.io/cppwp/n4950/span.sub)
- [C++23 工作草案：vector 的容量与重新分配](https://timsong-cpp.github.io/cppwp/n4950/vector.capacity)
- [C++23 工作草案：vector 的追加与失效规则](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers)
- [C++23 工作草案：临时对象的销毁](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：array 的隐式特殊成员函数](https://timsong-cpp.github.io/cppwp/n4950/array.cons)
