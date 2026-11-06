---
title: 类模板与成员约束（Constraining Class Templates and Members）
date: 2026-09-27
order: 5
---

# 类模板与成员约束（Constraining Class Templates and Members）

一个压力记录类可以要求所有数据源都能读取数值，同时只让带编号的数据源提供编号查询。这是两项不同的准入条件：前者决定类模板接受哪些类型，后者决定具体成员能否用于当前类型。

把要求写在合适的位置，可以让普通数据源继续使用基本接口，也能在调用额外操作时明确检查额外能力。

## 类的基本要求与成员的额外要求

下面的完整程序沿用两个概念（concept）：`pressure_source` 检查通过 `const T&` 调用 `read()` 后，结果能否满足 `std::convertible_to<double>`；`identified_source` 在它的基础上，再要求 `channel_id()` 返回 `int`。

```cpp
#include <concepts>
#include <iostream>
#include <utility>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

template <typename T>
concept identified_source = pressure_source<T> && requires(const T& value) {
    { value.channel_id() } -> std::same_as<int>;
};

template <typename T>
    requires pressure_source<T>
class pressure_record {
  public:
    explicit pressure_record(T value) : stored{std::move(value)} {}

    double value() const {
        return stored.read();
    }

    int channel_id() const
        requires identified_source<T>
    {
        return stored.channel_id();
    }

  private:
    T stored;
};

struct basic_sensor {
    double read() const {
        return 240.0;
    }
};

struct numbered_sensor {
    double read() const {
        return 245.0;
    }

    int channel_id() const {
        return 7;
    }
};

int main() {
    const pressure_record<basic_sensor> basic{basic_sensor{}};
    const pressure_record<numbered_sensor> numbered{numbered_sensor{}};

    std::cout << basic.value() << '\n';
    std::cout << numbered.value() << ' ' << numbered.channel_id() << '\n';
}
```

输出为：

```text
240
245 7
```

`template <typename T>` 后面的 requires 子句（requires-clause）约束整个类模板：`T` 必须满足 `pressure_source`。两个传感器类型都满足它，因此都能作为 `pressure_record` 的模板实参。

成员函数 `channel_id()` 的约束放在参数列表和 `const` 之后、函数体之前。这称为尾置 requires 子句（trailing requires-clause），约束的是当前成员函数。它使用所属类的参数 `T`，不需要额外写一层 `template`，也没有把 `channel_id()` 变成另有模板参数的成员模板。

示例中的两种传感器都是普通对象类型。构造函数按值接收传感器对象，再通过 `std::move(value)` 初始化 `stored`；这里继续遵守[初始化形参与初始化成员是两步](../32-class-templates-and-generic-types/02-construction-and-member-interfaces.md#初始化形参与初始化成员是两步)的规则。约束并没有接管成员的构造过程，也没有替成员补出缺失的构造能力。

## 类模板约束在形成类型名字时就需要满足

在上述程序的 `main` 中加入下面的声明，会编译失败：

```cpp
pressure_record<int>* pointer{nullptr}; // 错误：int 不满足 pressure_source。
```

`int` 没有 `read()` 成员，类模板的约束不满足。错误并不需要等到建立 `pressure_record<int>` 对象，更不需要等到调用它的 `value()`。

这与[指针声明不一定需要完整类类型](../32-class-templates-and-generic-types/03-class-instantiation-and-member-use.md#类类型完整与成员函数有定义是两层要求)并不冲突。当前声明确实不需要完整的类定义，但在这里形成 `pressure_record<int>` 这个类型名字，就已经要求类模板的约束满足。`int` 是已确定的模板实参，不能借助外面的 `*` 绕过这项条件。

**类模板约束筛选的是这个模板能够接受的实参；类是否需要完整、哪项成员定义需要实例化，是进一步使用时的其他问题。**

## 成员约束不满足，只阻止这项调用

保留最初的完整程序，只在 `main` 中增加以下调用，同样会编译失败，但失败位置不同：

```cpp
std::cout << basic.channel_id() << '\n'; // 错误：basic_sensor 不满足 identified_source。
```

`basic_sensor` 已经满足整个类的 `pressure_source` 约束。`basic` 可以建立，`basic.value()` 也可以调用；缺少 `channel_id()` 只使 `identified_source<basic_sensor>` 为假。

进行重载决议（overload resolution）时，带有关联约束的函数需要先满足这些约束，才能成为可行函数（viable function）。这里的 `pressure_record<basic_sensor>::channel_id()` 约束不满足，所以不能用于这次调用。没有其他可行的同名操作，调用就失败了。

> [!IMPORTANT]
> 不满足约束的成员声明仍属于这个类模板特化，只是在当前调用中不具备可行性。不能把成员约束理解成任意删除类中的声明，也不能认为一项成员约束不满足就会使整个类失效。

对这里的普通非删除成员函数，建立 `basic` 不需要实例化 `channel_id()` 的函数体；尝试上述调用时，约束又已经阻止它入选。因此，程序不必先进入函数体，才在 `stored.channel_id()` 上发现基本传感器没有编号。

这些用法可以按要求的位置直接区分：

| 用法 | 结果与原因 |
| --- | --- |
| `pressure_record<int>*` | 类模板约束不满足，类型名字不能在这里成立 |
| `basic.value()` | 类模板约束满足，基本读取接口可以使用 |
| `basic.channel_id()` | 类类型成立，但当前成员约束不满足，调用失败 |
| `numbered.channel_id()` | 类模板与当前成员的约束都满足，调用返回编号 |

如果把 `identified_source<T>` 放到整个类模板上，基本传感器连 `pressure_record<basic_sensor>` 都不能使用。这只有在“每条记录都必须带编号”的设计中才合适；当前接口把读数作为共同能力，把编号查询作为附加能力，因此分别约束。

## 类外定义保留两处约束

当成员改为[在类外定义](../32-class-templates-and-generic-types/02-construction-and-member-interfaces.md#类外定义仍属于同一个类模板)时，类模板本身的约束和当前成员的约束都应保留。可以把最初程序中的 `pressure_record` 类定义替换为以下声明与定义，其他代码保持不变：

```cpp
template <typename T>
    requires pressure_source<T>
class pressure_record {
  public:
    explicit pressure_record(T value) : stored{std::move(value)} {}

    double value() const {
        return stored.read();
    }

    int channel_id() const
        requires identified_source<T>;

  private:
    T stored;
};

template <typename T>
    requires pressure_source<T>
int pressure_record<T>::channel_id() const
    requires identified_source<T>
{
    return stored.channel_id();
}
```

类外定义开头的 `template <typename T>` 与 `requires pressure_source<T>` 对应所属类模板；末尾的 `requires identified_source<T>` 对应类内已经声明的成员。只保留其中一处，不能准确重述这项成员所属的模板及其调用条件。

声明与定义之间应保持约束的写法和位置一致，不要在挪动函数体时顺手改写成看似逻辑等价的另一种表达式。约束参与声明的匹配，编译器并不通过一般性的逻辑证明来替作者判断各种改写是否等价。

## 成员约束不能修复非法声明

成员调用受约束，不代表成员声明中所有依赖类型都能推迟到调用时再检查。建立完整的类模板特化，仍然需要它的成员声明合法。

例如，若一个类模板成员声明的返回类型写作 `T&`，将 `T` 代入为 `void` 会形成非法的 `void&`。即使给该成员加上对 `void` 不满足的尾置 requires 子句，也不能用它隐藏非法返回类型。原因仍是[类实例化需要检查成员声明](../32-class-templates-and-generic-types/03-class-instantiation-and-member-use.md#非法的成员声明不能靠不调用来隐藏)，而函数是否可调用属于另一层判断。

约束的位置应与要求的范围对应：全类的基本能力放在类模板上，某项额外操作的能力放在成员上；成员声明和实际需要的定义，则继续遵守模板实例化与普通 C++ 类型规则。

## 参考资料

- [C++23 工作草案：受约束模板名字的有效性](https://timsong-cpp.github.io/cppwp/n4950/temp.names#8)
- [C++23 工作草案：受约束声明与关联约束](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.decl)
- [C++23 工作草案：成员声明、定义与隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：可行函数需要满足关联约束](https://timsong-cpp.github.io/cppwp/n4950/over.match.viable#3)
- [C++23 工作草案：类外成员定义](https://timsong-cpp.github.io/cppwp/n4950/temp.class)
- [C++23 工作草案：模板声明与约束的等价性](https://timsong-cpp.github.io/cppwp/n4950/temp.over.link)
