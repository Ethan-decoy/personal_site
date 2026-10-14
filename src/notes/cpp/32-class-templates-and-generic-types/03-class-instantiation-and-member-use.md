---
title: 类模板实例化与成员使用（Class Template Instantiation and Member Use）
date: 2026-09-27
order: 3
---

# 类模板实例化与成员使用（Class Template Instantiation and Member Use）

`reading<T>` 可以声明多项成员操作，但某个具体类型不一定满足每一项操作的要求。判断 `reading<int>` 或 `reading<std::unique_ptr<int>>` 能否使用，需要分开看：当前是否需要完整的类类型，成员声明是否成立，以及实际需要哪些成员定义。

这里通过示例中的普通成员函数，区分类的隐式实例化（implicit instantiation）与所需成员定义的实例化。

## 类类型完整与成员函数有定义是两层要求

写出类模板特化的名字，不一定已经需要知道这个类的全部组成。下面是可以放在命名空间作用域的声明片段：

```cpp
template <typename T> class reading;

reading<int>* pointer{nullptr};
```

第一行只声明类模板，没有给出类定义；第二行定义的是指针对象，并没有建立 `reading<int>` 对象。此处可以使用尚不完整的类类型，因而不需要实例化它的类定义。

如果在该片段后直接写 `reading<int> current{220};`，就会失败：建立对象需要完整的类类型，但这里只提供了声明。

**当上下文需要完整的类类型，或者类是否完整会影响程序含义时，类模板特化才需要隐式实例化。** 定义一个该类型的对象、取得它的大小、查找它有哪些成员，都可能提出这种需要。单独声明一个指向它的指针则不一定需要。

类的隐式实例化会检查它的成员组成。对于这里的普通非删除成员函数，会实例化成员声明，但不会仅因类变得完整，就把每个函数体都一起实例化。类具有多大的对象表示、有哪些可访问成员，与某项成员函数的具体实现是否适用于 `T`，仍是不同的问题。

## 对象可以建立，不代表每项成员操作都成立

下面是完整程序。`reading` 通过构造函数保存一个 `T`，并声明一个按值返回结果的 `value()`：

```cpp
#include <iostream>
#include <memory>
#include <utility>

template <typename T> class reading {
  public:
    explicit reading(T value) : stored{std::move(value)} {}

    T value() const {
        return stored;
    }

  private:
    T stored;
};

int main() {
    const reading<int> pressure{220};
    const reading<std::unique_ptr<int>> owned{std::make_unique<int>(240)};

    std::cout << pressure.value() << '\n';
}
```

程序合法，输出 `220`。`owned` 确实保存着一个独占拥有者，离开作用域时由成员负责销毁所拥有的整数；程序没有读取这份拥有关系的副本。

对 `reading<std::unique_ptr<int>>`，这里分别需要：

| 当前用途 | 需要成立的内容 |
| --- | --- |
| 定义 `owned` 对象 | 类的成员组成合法，`stored` 可以具有 `std::unique_ptr<int>` 类型 |
| 调用带参构造函数 | 能初始化按值形参，并通过 `std::move(value)` 移动构造成员 |
| `owned` 离开作用域 | 外层对象和它的拥有者成员可以正常销毁 |
| 尚未使用的 `value()` | 声明中的返回类型合法；这里不需要实例化其函数体 |

现在只在上述程序的 `main` 中、输出语句前加入以下错误语句：

```cpp
const auto copy{owned.value()}; // 错误：所需的成员定义尝试复制 unique_ptr。
```

该调用需要 `reading<std::unique_ptr<int>>::value()` 的定义。实例化函数体时，`return stored;` 要从 `const std::unique_ptr<int>` 左值构造返回结果，而 `std::unique_ptr` 的[复制构造已被删除](../19-dynamic-objects-and-exclusive-ownership/02-transferring-ownership-and-object-identity.md#禁止复制的是拥有关系)，所以程序编译失败。

错误出在按值读取的实现要求，不在 `reading<std::unique_ptr<int>>` 这个类能否保存成员。构造函数可以移动拥有关系，`value()` 却试图复制拥有关系；两项操作对同一种 `T` 提出的条件不同。

> [!IMPORTANT]
> 一个类模板特化可以支持其中一部分成员操作。对本篇这些普通非删除成员函数，未使用的函数体不必仅因建立对象而实例化，但实际需要的每项成员定义都必须对当前模板实参成立。

这里的“需要定义”是编译期语义要求，不是等程序运行到调用语句才尝试检查。把 `owned.value()` 放进普通的 `if (false)` 分支，也不能免除[函数体的操作要求](../31-function-templates-and-type-deduction/04-instantiation-and-operation-requirements.md#普通-if-不会隐藏不成立的操作)。

同样，按需实例化不会替类型补出缺失的操作。`reading` 没有声明 `reset()`，调用 `owned.reset()` 就找不到这个成员；`std::unique_ptr` 不能复制，也不会因为外面套了一层模板而获得复制能力。

## 非法的成员声明不能靠不调用来隐藏

函数体可以等需要定义时再实例化，不代表成员声明也都可以推迟。下面的完整程序刻意保留错误：

```cpp
template <typename T> class reference_source {
  public:
    T& get();
};

int main() {
    reference_source<void> source; // 错误：实例化成员声明时形成 void&。
}
```

`reference_source<int>` 中的声明可以成为 `int& get();`。换成 `void` 后，返回类型却需要形成 `void&`，而引用不能指向 `void`。

建立 `source` 要求完整的 `reference_source<void>`，这就需要实例化类及其成员声明。即使程序从未调用 `get()`，即使模板中根本没有写 `get()` 的函数体，非法返回类型仍然阻止这个对象定义。

如果把 `main` 中的对象定义改成 `reference_source<void>* source{nullptr};`，这条指针声明本身不要求该类完整，因此不会因它而检查上述成员声明。差别在于当前上下文需要什么，不在于编译器是否先看见了模板名字。

## 从失败位置判断当前检查的是哪一层

面对类模板的诊断，可以沿着实际用途查找条件：

1. 当前仅仅命名某个特化，还是需要完整的类类型？只有指针声明与真正建立对象提出的要求不同。
2. 需要完整类类型时，成员的数据类型和函数声明能否在代入模板实参后成立？`void&` 属于这一层错误。
3. 需要某项成员定义时，函数体中的初始化、访问和返回是否成立？`return stored;` 尝试复制独占拥有者属于这一层错误。

这三个问题是在解释当前程序的语义依赖，不是承诺编译器一定按三轮、三种固定文字给出诊断。模板定义本身仍要通过语法和非依赖部分的检查；[没有使用某项操作不能证明模板定义本身正确](../31-function-templates-and-type-deduction/04-instantiation-and-operation-requirements.md#定义本身仍然需要接受检查)。

## 参考资料

- [C++23 工作草案：类与成员的隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：模板定义与名称解析](https://timsong-cpp.github.io/cppwp/n4950/temp.res.general)
- [C++23 工作草案：引用声明的类型限制](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：独占拥有者的复制限制](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.general)
