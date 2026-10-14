---
title: 值模板参数与默认实参（Value Template Parameters and Default Arguments）
date: 2026-09-27
order: 4
---

# 值模板参数与默认实参（Value Template Parameters and Default Arguments）

一个读数的表示可以由 `T` 决定；一批读数还可能有另一个固定条件：每批必须包含多少个元素。如果这个数量属于接口约定，就可以像 `std::array<T, N>` 一样，把数量也写进类型。

这里的两个模板实参承担不同职责：`T` 传入类型，`N` 传入值。C++23 将后一类参数称为**非类型模板参数（non-type template parameter）**。这里用 `std::size_t` 表示数量。

## 用值决定固定批次的类型

`std::array` 的[元素数量本来就是类型的一部分](../20-fixed-size-sequences-and-contiguous-ranges/01-fixed-size-sequences-and-array-objects.md#元素数量写在类型中)。下面的完整程序直接组合它，给这组数据一个“读数批次”的含义：

```cpp
#include <array>
#include <cstddef>
#include <iostream>
#include <utility>

template <typename T, std::size_t N> class reading_batch {
  public:
    explicit reading_batch(std::array<T, N> values) : stored{std::move(values)} {}

    std::size_t size() const {
        return N;
    }

    const std::array<T, N>& values() const {
        return stored;
    }

  private:
    std::array<T, N> stored;
};

int main() {
    const reading_batch<int, 3> first{{220, 225, 230}};
    const reading_batch<int, 4> expanded{{220, 225, 230, 235}};

    std::cout << first.size() << ' ' << expanded.size() << '\n';
    std::cout << first.values()[0] << '\n';
}
```

输出为 `3 4` 和 `220`。模板参数列表中的 `std::size_t N` 声明了一个类型已经确定的值参数。形成 `reading_batch<int, 3>` 时，`T` 对应 `int`，`N` 对应值 `3`，成员因此具有类型 `std::array<int, 3>`。

尖括号里的 `3` 在选择具体类型时使用；对象初始化中的 `{220, 225, 230}` 则提供这一批元素的值。构造函数接收的是已经具有固定长度的数组。`size()` 返回 `N`，不会通过统计当前元素值来决定长度。

`values()` 返回成员数组的只读引用，借用的有效期受所属批次对象的生命周期限制。这里的 `first` 在整个输出过程中都仍然存在。

## 长度改变，具体类型也改变

`reading_batch<int, 3>` 和 `reading_batch<int, 4>` 是两个不同类型。它们的区别已经进入成员类型和接口，不能把长度当成同一个类里可以随意修改的普通数据成员。

把以下声明放进上面的 `main`，位于 `first` 之后：

```cpp
const reading_batch<int, 1 + 2> same{first};
```

这次复制成立。对于这里的整数值参数，比较的是转换到参数类型后的值，而不是实参表达式的拼写；`1 + 2` 和 `3` 都为 `N` 提供相同的值，所以两处指向同一个具体类。

改成下面的声明则会编译失败：

```cpp
const reading_batch<int, 4> wrong{first}; // 错误：没有从三元素批次构造四元素批次的接口
```

这份类定义没有声明不同长度之间的转换。即使前三个元素可以保留，也不能据此推断第四个元素应取什么值，或要求编译器自动补齐。

> [!IMPORTANT]
> 对 `reading_batch<T, N>`，类型参数 `T` 与数量参数 `N` 共同决定具体类型。相同类型的两个对象可以存放不同读数；改变 `N` 则是在选择另一个类型，不能通过修改某个对象来完成。

## 数量必须能用于常量表达式

这里的 `N` 必须由能按规则转换为 `std::size_t` 的常量表达式提供。可以使用字面量、合适的常量计算，也可以使用 `constexpr` 对象。以下片段可以放入原程序的 `main`：

```cpp
constexpr std::size_t batch_size{3};
const reading_batch<int, batch_size> batch{{220, 225, 230}};

std::cout << batch.size() << '\n';
```

输出为 `3`。`batch_size` 的值在选择类型时已经可用；`batch` 本身仍是普通对象，读数的保存和访问不因此变成编译期操作。

只有 `const` 并不足以满足这个条件。下面是一个应放在类定义之后、`main` 之前的错误函数定义：

```cpp
void collect(std::size_t count) {
    const std::size_t fixed{count};
    const reading_batch<int, fixed> batch{{220, 225, 230}}; // 错误：fixed 不是可用的常量表达式
}
```

普通函数参数 `count` 是调用时传入的值。`fixed` 的 `const` 只禁止初始化后修改它，没有把这个运行期来源变成可以决定模板实参的常量表达式。即使某次调用写作 `collect(3)`，这个函数定义仍然不成立。

把上面 `main` 中的 `constexpr` 声明替换为 `const std::size_t batch_size{3};` 后，`batch_size` 仍可以用于这里的模板实参：满足条件的 `const` 整数对象可以用于常量表达式。判断依据是[初始化方式和常量表达式规则](../06-constants-literals-and-type-conversions/03-constant-expressions-and-constexpr.md#const-整数对象的精确边界)，并非只检查有没有 `constexpr` 这个关键字。

> [!PRACTICE]
> 如果数量是协议或接口固定的一部分，把它写进类型可以阻止不同长度的批次混用。如果数量来自用户输入，或者同一个对象需要改变长度，就应考虑 `std::vector` 这类运行期确定长度的表示；给输入值加上 `const` 无法把它变成模板实参。

## 默认实参省略的是类型配置

假设当前采集接口通常使用整数读数、每批三个元素，可以为两个模板参数提供**默认模板实参（default template argument）**。只需把原类定义前的模板参数列表替换为：

```cpp
template <typename T = int, std::size_t N = 3>
```

保留原来的类体后，下面的声明可以放入 `main`：

```cpp
const reading_batch<> ordinary{{220, 225, 230}};
const reading_batch<double> precise{{220.5, 225.5, 230.5}};
const reading_batch<double, 4> wide{{220.5, 225.5, 230.5, 235.5}};
```

三项分别采用 `reading_batch<int, 3>`、`reading_batch<double, 3>` 和 `reading_batch<double, 4>`。空尖括号 `<>` 表示两个位置都使用默认实参；只写 `<double>` 时，显式选择 `T`，省略的 `N` 使用 `3`。默认实参不产生额外的类，`reading_batch<>` 与 `reading_batch<int, 3>` 表示相同类型。

在这里这种普通类模板参数列表中，一旦某个参数开始提供默认实参，后续参数也需要有默认实参。因此可以只给最后的 `N` 提供默认值，却不能只给前面的 `T` 提供默认值而让 `N` 必须填写。

`N = 3` 决定的是缺省采用哪一种固定长度，三个元素仍由对象的初始化实参提供。原构造函数要求传入数组，所以下面的语句仍然编译失败：

```cpp
const reading_batch<> empty{}; // 错误：具体类已确定，但没有无参构造函数
```

**默认模板实参用于补齐模板参数，选择具体类；能否省略构造实参，则由该类的构造接口决定。**省略类型配置，不等于省略对象初始化所需的值。

## 参考资料

- [C++23 工作草案：模板参数与默认模板实参](https://timsong-cpp.github.io/cppwp/n4950/temp.param)
- [C++23 工作草案：非类型模板实参](https://timsong-cpp.github.io/cppwp/n4950/temp.arg.nontype)
- [C++23 工作草案：模板实参的类型等价关系](https://timsong-cpp.github.io/cppwp/n4950/temp.type)
- [C++23 工作草案：常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
