---
title: 定义边界与 inline（Definition Boundaries and inline）
date: 2026-09-22
order: 3
---

# 定义边界与 inline（Definition Boundaries and inline）

头文件经 `#include` 进入各个翻译单元，因此放进头文件的内容可能在程序中出现多次。普通函数体不能随意这样重复，类定义却经常必须由多个源文件共同使用。

决定能否放入头文件的，是**相应实体的定义规则**。仅凭“它是定义”或者“头文件已经有包含保护”，都不足以判断。

## 单一定义规则先区分两种重复

单一定义规则（one-definition rule，ODR）规定哪些实体需要定义，以及定义可以出现多少次、必须满足什么一致性条件。

对本篇使用的普通函数和类，先分清两个层次：

| 重复的位置 | 当前需要遵循的规则 |
| --- | --- |
| 同一翻译单元内 | 同一个函数或类不能被定义两次 |
| 不同翻译单元之间 | 具有外部链接的函数默认只能在程序中有一份定义；同一个类则可以在满足一致性条件时分别定义 |

[包含保护](02-headers-and-include-guards.md#包含保护记录本次预处理是否已经见过头文件)处理第一种重复：同一份头文件沿两条路径进入当前翻译单元时，只保留一次正文。它不会阻止头文件分别进入另外两个翻译单元。

**多次一致的声明与多次定义也不同。**多写一次 `int adjust_pressure(int);` 不会增加函数体；多写一次带函数体的定义，则必须接受定义数量的约束。

## 类定义为各个使用位置提供同一种类型

调用者如果要创建 `reading` 对象、使用其成员，就需要知道这个类的完整定义。可以让同一个头文件同时提供类型定义和操作声明。

下面是一个独立的三文件程序。

`reading.hpp`：

```cpp
#ifndef CPP_NOTES_READING_HPP
#define CPP_NOTES_READING_HPP

namespace workshop {
struct reading {
    int pressure_kpa;
};

int pressure_margin(const reading& value, int target_kpa);
} // namespace workshop

#endif
```

`reading.cpp`：

```cpp
#include "reading.hpp"

namespace workshop {
int pressure_margin(const reading& value, int target_kpa) {
    return value.pressure_kpa - target_kpa;
}
} // namespace workshop
```

`main.cpp`：

```cpp
#include "reading.hpp"

#include <iostream>

int main() {
    const workshop::reading value{220};
    std::cout << workshop::pressure_margin(value, 240) << '\n';
}
```

构建并运行：

```sh
g++ -std=c++23 main.cpp reading.cpp -o reading_demo
```

输出为 `-20`，表示测量值比目标低 `20 kPa`。

两个翻译单元都取得 `workshop::reading` 的类定义。这里的名称具有外部链接，各处描述的是**同一个类类型**；不会因为类定义出现在两个翻译单元中，就产生两个彼此不同的 `reading` 类型。

对这里不涉及模块的类定义，跨翻译单元重复定义需要保持一致。当前代码使用同一个头文件，使每处定义具有相同的词法记号（token）序列；类定义中的名称也具有相同含义。成员类型 `int` 不会因为包含者不同而改变。

这种允许重复的范围不能套到普通函数上：类定义可以按规则同时出现，`pressure_margin` 的普通函数体则只保留在 `reading.cpp` 中。

## 把普通函数体搬进头文件会发生什么

若把 `reading.cpp` 中的函数体搬到 `reading.hpp`，替换原来的函数声明，头文件中的对应片段会变成：

```cpp
int pressure_margin(const reading& value, int target_kpa) {
    return value.pressure_kpa - target_kpa;
}
```

此片段仍位于 `namespace workshop` 内，且使用前面的 `reading` 定义。让 `reading.cpp` 只保留 `#include "reading.hpp"`，`main.cpp` 保持不变。

现在，两个翻译单元各有一份同一普通函数的定义。包含保护在各自内部都正常工作，整个程序仍然违反 ODR。常见工具链会在链接时报告重复符号或多重定义；语言并不要求这类跨翻译单元违规总能得到诊断。

删掉其中一个包含并不是合适的接口修复：使用该类型和函数的源文件仍然需要相应声明。应当决定函数定义究竟由一个实现文件提供，还是采用允许在头文件中共享定义的形式。

## inline 允许按条件共享同一个函数的定义

内联函数（inline function）由 `inline` 等语言规定的方式声明。对当前头文件中的函数，可以在定义前加上 `inline`：

```cpp
inline int pressure_margin(const reading& value, int target_kpa) {
    return value.pressure_kpa - target_kpa;
}
```

用这段定义替换 `reading.hpp` 内的函数声明，`reading.cpp` 仍只包含该头文件。此时原来的构建命令就可以形成合法程序，输出仍为 `-20`。

对于这里具有外部链接的 inline 函数：

- 可以在不同翻译单元中具有符合 ODR 一致性要求的定义。
- 各处仍然表示同一个函数，`inline` 本身不把它变成每个翻译单元独有的函数。
- 使用该函数的翻译单元需要能够取得定义；将完整定义放在共用头文件中，能够满足当前组织方式的要求。

因此，不能只把 `inline int pressure_margin(const reading& value, int target_kpa);` 这一条声明放入头文件，再把唯一的 inline 定义留在另一个 `.cpp`，期待调用者仅通过链接取得定义。这不满足 inline 函数对定义可达的要求。使用统一的头文件，也能让各处声明保持一致的 inline 属性。

`inline` 名称容易让人想到把函数体展开到调用处的内联展开（inline expansion）。实现可以选择这种优化，但**写了 inline 不保证展开，未写 inline 也不禁止优化器展开**。无论实际采用什么机器代码组织方式，源程序都必须满足相应定义规则。

> [!IMPORTANT]
> 在当前多文件模型中，inline 的关键作用是允许符合条件的同一函数定义出现在多个翻译单元中。它既不免除定义一致性，也不承诺某种性能结果。

## 类内定义的成员函数为什么能留在头文件中

在本章这种普通头文件的组织方式下，直接定义在类体内的成员函数隐式具有 inline 属性。例如，将前面 `reading.hpp` 中的结构体替换为：

```cpp
struct reading {
    int pressure_kpa;

    int margin_to(int target_kpa) const {
        return pressure_kpa - target_kpa;
    }
};
```

`margin_to` 直接在类体内提供函数体，可以随着一致的类定义进入多个翻译单元，不需要再手写 `inline`。这里的 `const` 仍然表达[成员函数不会通过当前对象修改普通成员](../10-class-interfaces-and-encapsulation/02-const-member-functions-and-read-only-access.md#函数体受到同一项约束)的接口含义。

如果把这个成员函数改为类内只有声明，再在类外定义，**仅仅“它是成员函数”不会使类外定义自动具有 inline 属性**。普通类外定义可以放进一个 `.cpp`；若要把这种类外定义放在共享头文件中，就需要在当前形式下显式声明为 inline。

本节限定在普通头文件程序；不能把这条隐式 inline 结论不加条件地套到所有模块组织形式。

## 定义一致不只是看起来做了同样的事

跨翻译单元共享类或 inline 函数定义时，不能让不同文件各自维护一个“意思差不多”的版本。对当前示例，保持一致至少要关注：

- 定义的记号序列一致，而不只是几组输入的输出相同。例如一边写 `value.pressure_kpa - target_kpa`，另一边写 `-(target_kpa - value.pressure_kpa)`，不能据此当作同一份定义。
- 定义中的名称查找以及相关操作保持一致。即使函数体文本相同，其中的调用也不能在不同翻译单元选中不同函数。

例如一个 inline 函数体含有 `adjust_pressure(220.0)`：若一处只看得到 `int` 参数版本，另一处还看得到 `double` 参数版本，就可能经重载决议选中不同函数。相同文本并没有给出相同含义。

标准另有少量允许名称指向不同常量对象等精细例外；它们不构成随意混用定义的依据。让头文件自身包含所需声明、保持编译配置一致，比依赖包含者预先提供的不同环境更容易维持正确性。

> [!WARNING]
> 跨翻译单元的 ODR 违规可能没有诊断。程序能够编译链接，甚至某次输出符合预期，都不能证明这些定义允许共存。

> [!PRACTICE]
> 普通接口函数可以由头文件声明、一个源文件定义，让调用者只依赖接口。适合随接口提供的短小函数可以定义为 inline；选择依据是定义是否需要向各个翻译单元提供，以及由此带来的实现依赖和重新编译范围，不能只凭“inline 会更快”作决定。

## 参考资料

- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
- [C++23 工作草案：inline 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.inline)
- [C++23 工作草案：成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct)
