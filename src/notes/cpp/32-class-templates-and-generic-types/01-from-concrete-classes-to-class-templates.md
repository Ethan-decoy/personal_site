---
title: 从具体类到类模板（From Concrete Classes to Class Templates）
date: 2026-09-27
order: 1
---

# 从具体类到类模板（From Concrete Classes to Class Templates）

一份压力读数可以用整数保存，也可以用浮点数保存。如果记录的结构与操作含义相同，只是所保存的值类型不同，就可以让这个类型成为参数。

[函数模板](../31-function-templates-and-type-deduction/01-from-concrete-functions-to-templates.md#用类型参数描述函数)描述一组相关函数；类模板（class template）描述一组相关类类型的成员结构与操作。它让我们可以编写这组类型共同遵循的定义。

## 将成员的类型变成参数

只保存整数读数时，可以在命名空间作用域中定义：

```cpp
struct reading {
    int value;
};
```

这里用 `value` 保存以 kPa 为单位的读数。如果还要保存带小数的读数，可以把上面的定义替换为：

```cpp
template <typename T> struct reading {
    T value;
};
```

`template <typename T>` 为紧随其后的类声明引入类型参数 `T`，`T value;` 用这个参数指定成员类型。`struct` 声明的也是类类型，因此同样可以用于定义类模板；它与 `class` 的默认访问权限区别仍然成立。

`reading<int>` 将 `T` 确定为 `int`，其中的 `value` 是 `int` 成员；`reading<double>` 将 `T` 确定为 `double`，其中的 `value` 就是 `double` 成员。这些写法和已经使用过的 `std::vector<int>`、`std::vector<double>` 一样，由模板名称与具体模板实参共同指定类型。

## 模板、具体类型与对象是三个层次

下面是完整程序：

```cpp
#include <iostream>

template <typename T> struct reading {
    T value;
};

int main() {
    const reading<int> first{220};
    const reading<int> second{240};
    const reading<double> precise{220.5};

    std::cout << first.value << ' ' << second.value << '\n';
    std::cout << precise.value << '\n';
}
```

输出为：

```text
220 240
220.5
```

当前 `reading` 没有自行声明构造函数，只有公开数据成员，仍按已有的[聚合初始化](../09-structures-and-object-composition/03-aggregate-initialization-and-default-member-initializers.md#初始化器按成员声明顺序对应)规则建立对象。花括号里的数值初始化成员，不是再次提供模板实参。

| 层次 | 本例 | 决定什么 |
| --- | --- | --- |
| 类模板 | `reading` | 用参数描述相关类型的共同结构 |
| 类模板特化（class template specialization） | `reading<int>`、`reading<double>` | 给定模板实参对应的具体类类型 |
| 对象 | `first`、`second`、`precise` | 程序中的独立对象，各自保存状态 |

这里的“特化”指模板与具体实参对应的类型，不表示已经为它手写了一套特殊实现。当前各类型都由同一份模板定义实例化而来。

`first` 和 `second` 属于同一个 `reading<int>` 类型，数值不同不会产生新的类类型。`precise` 属于另一个类型 `reading<double>`。程序需要这些对象时，编译器根据相应模板实参形成所需的类定义；不需要先为所有可能的 `T` 形成一份定义。

> [!IMPORTANT]
> 模板实参决定具体类型，对象初始化决定本次保存的值。创建另一个 `reading<int>` 对象，不是再设计一种类型；把 `int` 改成 `double`，才改变了所使用的类模板特化。

`T` 也不是每个对象在运行时携带的一项“类型选项”。`reading<int>` 的成员类型已经确定；随后给 `value` 赋值，不会把这个成员变成 `double`。

## 成员可转换，不代表外围类型可以自动转换

`int` 可以转换为 `double`，但 `reading<int>` 与 `reading<double>` 仍然是两个不同的类类型。类模板不会自动为它们建立相互转换的接口。

在上面程序的 `main` 中，下面一行无法编译：

```cpp
const reading<double> converted{first}; // 错误：不能用 reading<int> 初始化 double 成员
```

这仍是聚合初始化：唯一的成员是 `double value`，初始化器却是整个 `reading<int>` 对象。该对象没有提供转换成 `double` 的操作，编译器也不会自行取出它的 `value` 成员。

若当前意图是读取整数值，再用它建立浮点读数，可以明确写出这层关系：

```cpp
const reading<double> converted{static_cast<double>(first.value)};
```

这里先取得成员值并显式转换，再初始化目标对象。它没有改变来源对象，也没有让两种 `reading` 变成同一个类型。需要直接接受另一种读数对象时，应由类接口明确规定这种构造或转换的含义。

## 类型参数统一结构，成员契约仍然有效

写出 `T value;` 仍要求它能形成合法的数据成员。模板参数不是绕过普通类型规则的通道：例如 `void` 不能成为这种数据成员的类型，因此不能按这份定义创建 `reading<void>` 对象。

同样，若 `T` 是 `std::string`，成员就按字符串的规则构造、复制和销毁；若 `T` 是借用类型，复制成员仍然保留相应的借用关系。把对象放进类模板，不会自动改变成员原来的所有权契约。

> [!PRACTICE]
> 适合参数化的是含义稳定、主要差异来自成员类型的结构。若不同数据实际上需要不同的单位约束、有效状态或操作，不应只因成员数量相同就合并成一个模板。这里的 `reading<T>` 只表达“保存一份读数”，没有替业务定义单位转换或有效范围。

## 参考资料

- [C++23 工作草案：类模板及其成员结构](https://timsong-cpp.github.io/cppwp/n4950/temp.class.general)
- [C++23 工作草案：模板实参与类型身份](https://timsong-cpp.github.io/cppwp/n4950/temp.type)
- [C++23 工作草案：类模板的隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：聚合初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
