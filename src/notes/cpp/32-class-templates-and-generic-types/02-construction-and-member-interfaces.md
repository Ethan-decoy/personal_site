---
title: 类模板的构造与成员接口（Construction and Member Interfaces of Class Templates）
date: 2026-09-27
order: 2
---

# 类模板的构造与成员接口（Construction and Member Interfaces of Class Templates）

让成员类型成为参数之后，仍然需要决定如何建立对象、怎样读取状态，以及复制和移动是否成立。类模板继续使用普通类的构造与成员规则，只是其中部分类型由模板实参确定。

## 构造函数接收已经确定的成员类型

下面把 `reading<T>` 改为通过成员接口访问状态。示例以 `int` 和 `std::string` 作为 `T`，通过构造函数保存值，再用 `value()` 取得一份独立结果：

```cpp
#include <iostream>
#include <string>
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

    const std::string text{"220 kPa"};
    const reading<std::string> description{text};
    std::string result{description.value()};
    result += " confirmed";

    std::cout << pressure.value() << '\n';
    std::cout << description.value() << '\n';
    std::cout << result << '\n';
}
```

输出为：

```text
220
220 kPa
220 kPa confirmed
```

`reading<int>` 的构造形参是 `int`，成员 `stored` 也是 `int`；`reading<std::string>` 的这两处类型则都是 `std::string`。当前 `value()` 是普通成员函数，返回类型由它所属的具体类确定：它没有一套独立的类型参数，不会在每次调用时重新推导 `T`。

构造函数在类内写作 `reading(T value)`，不写返回类型，也不写 `reading<T>(T value)`。这里沿用[构造函数的特殊声明形式](../10-class-interfaces-and-encapsulation/04-constructors-and-member-initialization.md#创建对象时调用构造函数)，模板实参由它所属的类确定。`explicit` 继续限制这项构造参与隐式转换，不影响示例中的直接列表初始化。

## 初始化形参与初始化成员是两步

在这两种实例中，构造函数按值接收 `T value`，随后通过 `std::move(value)` 初始化 `stored`。对 `description{text}` 而言：

1. `text` 是一个 `const std::string` 左值，用它复制构造形参 `value`。
2. 形参 `value` 是具名对象；`std::move(value)` 让它作为将亡值参与成员初始化，此处调用字符串的移动构造。
3. 构造函数返回后，形参销毁；`description.stored` 保存自己的字符串。

因此 `description` 不借用 `text` 的字符。`text` 的后续生命周期不控制这份字符串成员的有效期。

`std::move` 本身仍然只是[改变表达式的值类别](../17-rvalue-references-and-move-semantics/02-std-move-and-expression-category-conversion.md#一个只改变表达式类别的标准库工具)。对 `int`，成员取得数值；对类类型，究竟调用移动构造还是可接受该表达式的其他构造函数，由该类型的接口与重载选择决定。如果没有可用操作，这条构造路径就不成立。

> [!PRACTICE]
> 按值接收再移入成员，适合当前“接收一份值并保存”的接口：左值输入通常先复制到形参，右值输入可以利用移动。不过它仍可能多出一次成员移动；这是清晰的基础接口，不意味着所有类型和性能条件下都应采用同一种构造方式。

## 按值读取具有自己的操作要求

本例中，`T` 分别为 `int` 和 `std::string`，因此这两种实例的 `value()` 按值返回结果，而不返回对 `stored` 的引用。修改 `result` 不会改变 `description` 保存的字符串。

在这两种实例中，`const` 成员函数通过只读对象访问 `stored`，`return stored;` 从 `const T` 左值构造返回结果。对字符串，这需要复制；不能仅因为返回的是类成员，就把它作为可移出的资源。

这项要求与“可以把一个 `T` 保存进来”不同。一个类型可以支持移动构造，却不支持从 `const T` 左值复制。这样的类型可能满足当前构造函数的需要，却不满足 `value()` 的函数体要求；[成员定义的实例化](03-class-instantiation-and-member-use.md#对象可以建立不代表每项成员操作都成立)决定何时检查这一差别。

> [!IMPORTANT]
> 类模板的每项操作继续具有具体契约。构造要能初始化成员，按值读取要能建立结果；把两项操作写在同一个模板里，不会使它们的条件自动相同。

本例的按值读取避免把成员的借用传给调用者，但复制成本由 `T` 决定。如果实际接口需要返回引用，仍必须明确外层对象的有效期以及从临时对象取得借用的风险；模板不会延长成员的生命周期。

## 类外定义仍属于同一个类模板

若希望让类内只显示接口，可以把上面完整程序中的类定义替换为以下声明与定义，其他代码保持不变：

```cpp
template <typename T> class reading {
  public:
    explicit reading(T value);
    T value() const;

  private:
    T stored;
};

template <typename T> reading<T>::reading(T value) : stored{std::move(value)} {}

template <typename T> T reading<T>::value() const {
    return stored;
}
```

每项类外定义前的 `template <typename T>` 都为当前定义引入类型参数。`reading<T>::` 说明定义属于由同一组参数指定的类，`T reading<T>::value() const` 则同时写明返回类型、成员归属和只读限定。

这里的 `template <typename T>` 不是把 `value` 变成一个另有参数的成员模板，而是补齐它所依附的类模板参数。构造函数的类外形式是 `reading<T>::reading(T value)`；`explicit` 保留在类内声明中，不在类外定义处重复。

**写在类外与藏进单独的实现文件是两件事。** 使用方隐式实例化所需成员定义时，仍要满足[模板定义的可见性](../31-function-templates-and-type-deduction/06-template-definitions-and-multi-file-programs.md#声明说明怎样调用定义提供怎样实例化)。常见组织方式是把类定义和这些成员定义一起放在头文件中；挪出类的大括号只改变源码的组织位置，不自动建立普通非模板函数那样的声明、实现分离。

## 默认复制与移动沿用成员语义

这份 `reading<T>` 只声明了普通带参构造函数，没有手写复制、移动和析构函数。它满足[隐式声明移动操作的条件](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#什么时候会隐式声明移动操作)，也有相应的隐式复制操作；这些操作是否可用，仍由成员决定。

在上述程序的 `main` 中，可以使用：

```cpp
reading<std::string> source{std::string{"240 kPa"}};
const reading<std::string> copy{source};
const reading<std::string> target{std::move(source)};

std::cout << copy.value() << ' ' << target.value() << '\n';
```

这段代码输出 `240 kPa 240 kPa`。复制 `copy` 时，默认复制构造复制字符串成员；移动 `target` 时，默认移动构造移动该成员。它们没有调用接收 `std::string` 的业务构造函数，因为这里传入的是整个 `reading<std::string>` 对象。

`source` 移动后的字符串仍遵守标准库的有效但未指定状态契约，不应断言它一定为空。若将 `T` 换成不可复制的成员类型，相应的外层默认复制也可能被定义为删除；模板不会替成员制造复制能力。

这类组合不需要手写一套泛型复制、移动和清理逻辑。让已经正确管理状态的成员承担操作，再检查这些操作是否符合外层的业务约束，与设计普通类时的判断相同。

## 参考资料

- [C++23 工作草案：类模板与类外成员定义](https://timsong-cpp.github.io/cppwp/n4950/temp.class)
- [C++23 工作草案：构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.ctor)
- [C++23 工作草案：复制与移动构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：隐式实例化与定义要求](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
