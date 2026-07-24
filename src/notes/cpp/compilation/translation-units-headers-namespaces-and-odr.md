---
title: 翻译单元、头文件、命名空间与 ODR
date: 2026-07-23
---

# 翻译单元、头文件、命名空间与 ODR

多文件程序的关键不只是把代码分进不同文件，而是理解每个源文件会独立形成翻译单元，最后再通过链接组成程序。

源码怎样成为目标文件和可执行程序，见[从源码到可执行程序](./source-to-executable.md)。本篇只讨论多文件结构中的可见性、声明、定义和一次定义规则。

## 每个源文件形成一个翻译单元

预处理器会展开当前 `.cpp` 直接或间接包含的头文件。预处理完成后，这个整体称为翻译单元：

```text
main.cpp 及其包含内容  -> 一个翻译单元 -> main.o
price.cpp 及其包含内容 -> 一个翻译单元 -> price.o

main.o + price.o -> 链接后的程序
```

不同 `.cpp` 会分别预处理和编译。一个翻译单元中可见的声明，不会因为存在于那里就自动对另一个翻译单元可见。

`#include "price.hpp"` 不是在运行时连接头文件。它在预处理时把头文件提供的内容引入当前翻译单元。

## 声明与定义

声明告诉编译器一个名称及其类型：

```cpp
int final_price(int base_price, int discount);
extern int tax_rate;
```

这里及后续的 `final_price` 示例约定 `0 <= discount && discount <= base_price`，因此减法结果可由 `int` 表示。

定义为函数提供函数体，或为对象提供存储：

```cpp
int final_price(int base_price, int discount)
{
    return base_price - discount;
}

int tax_rate{10};
```

定义同时也是声明，但声明不一定是定义。这里给出的命名空间作用域 `int tax_rate;` 是定义，而没有初始化器的 `extern int tax_rate;` 不是定义。

## 公共接口放在头文件

需要被多个翻译单元调用的函数，可以在头文件中声明：

```cpp
// price.hpp
#pragma once

namespace price
{
int final_price(int base_price, int discount);
}
```

实现放在一个源文件中：

```cpp
// price.cpp
#include "price.hpp"

namespace price
{
int final_price(int base_price, int discount)
{
    return base_price - discount;
}
}
```

调用方看到声明后就能完成名称查找和类型检查。最终链接时，程序仍需要找到与该声明相匹配的定义。

头文件不是所有函数的登记册。只在一个 `.cpp` 内使用的实现细节不必进入公共头文件。

## 普通函数的一次定义规则

对于本阶段常见的普通非 `inline`、具有外部链接的函数：

- 声明可以通过同一头文件出现在多个翻译单元；
- 如果程序使用了这个函数，整个程序需要且只需要一份定义；
- 缺少定义通常表现为未定义符号；
- 多份定义通常表现为重复符号。

这是一次定义规则（One Definition Rule，ODR）的基础应用。“使用了”在完整规则中涉及 odr-use；当前可以先理解为程序确实需要该函数或对象的定义。

模板、`inline` 函数、类内定义和某些常量具有不同的多翻译单元规则。它们不是“ODR 不适用”，而是 ODR 对允许出现的定义及其一致性另有要求。

链接器消息的阅读和最小复现方法见[失败阶段与最小复现](../diagnostics/failure-stages-and-minimal-reproduction.md)。

## 内部 helper 可以留在实现文件

只服务于一个实现文件的 helper 可以放进匿名命名空间：

```cpp
// price.cpp
namespace
{
int clamp_discount(int discount)
{
    return discount < 0 ? 0 : discount;
}
}
```

匿名命名空间中的名称具有内部链接，每个包含这一定义的翻译单元拥有自己的实体。命名空间作用域的 `static` 函数也可以获得内部链接，但现代 C++ 中通常更偏向匿名命名空间。

这样的 helper 不需要在公共头文件中声明。把内部 helper 留在 `.cpp`，可以缩小接口并减少其他翻译单元对实现细节的依赖。

如果把内部链接的定义写进头文件，每个包含它的翻译单元可能得到独立实体。这样可以满足链接规则，却不代表它就是清晰、必要的公共头文件设计。

## `#pragma once` 的边界

```cpp
#pragma once
```

它被主流编译器广泛支持，用来避免同一头文件在一个翻译单元中被重复包含。它不是标准 C++ 语句，而是常见的预处理器扩展。

标准写法是 include guard：

```cpp
#ifndef PRICE_HPP
#define PRICE_HPP

namespace price
{
int final_price(int base_price, int discount);
}

#endif
```

两者解决的是单个翻译单元内的重复包含，不会阻止头文件分别进入多个翻译单元。因此，它们不能让普通外部链接函数的多份定义自动变得合法。

## 头文件应当可以独立包含

如果头文件的声明直接使用 `std::optional`，该头文件自己就应包含 `<optional>`：

```cpp
#pragma once

#include <optional>

std::optional<int> accepted_measurement(int measurement);
```

不能要求调用者碰巧先包含 `<optional>`，否则头文件能否编译会依赖包含顺序。

一个简单的独立包含检查文件可以只有：

```cpp
#include "measurement.hpp"
```

如果它能够独立编译，说明该头文件至少没有遗漏当前接口直接需要的依赖。

## 实现文件先包含自己的头文件

在许可证注释或工具链要求预置的配置头、预编译头之后，实现文件通常把对应头文件作为第一个普通依赖包含：

```cpp
#include "measurement.hpp"

#include <algorithm>
```

这样可以尽早暴露头文件缺少直接依赖的问题，也能捕获一部分签名或命名空间不匹配。它不能证明所有问题都不存在；例如某些不匹配可能形成另一个重载，直到链接时才暴露。

头文件应包含接口自身直接需要的依赖；实现文件还应包含实现代码直接使用的其他依赖。不要依靠另一个头文件偶然传递包含。

## 命名空间贯穿声明、定义与调用

命名空间为名称提供范围：

```cpp
namespace inventory
{
// 前置条件：0 <= sold && sold <= stock
int remaining_after_sale(int stock, int sold);
}
```

这个函数的完整名称是 `inventory::remaining_after_sale`。定义必须定义同一个限定名称。常见写法是在相同命名空间块中定义：

```cpp
namespace inventory
{
int remaining_after_sale(int stock, int sold)
{
    return stock - sold;
}
}
```

也可以改用下面这段作为替代定义，在外围命名空间作用域写出限定名；它不能与上面的定义同时出现：

```cpp
int inventory::remaining_after_sale(int stock, int sold)
{
    return stock - sold;
}
```

调用方也要指向同一个名称：

```cpp
int remaining{
    inventory::remaining_after_sale(10, 3)
};
```

如果在全局命名空间写未限定的 `int remaining_after_sale(...)`，它会形成另一个名称，并不是 `inventory::remaining_after_sale` 的定义。

## `.hpp` 与 `.h`

C++ 语言不强制头文件使用哪一种扩展名。`.hpp` 常用于强调这是 C++ 头文件，`.h` 也很常见。团队一致性比扩展名本身更重要。

## 多文件结构检查

1. 公共函数是否在头文件声明，并在 `.cpp` 中定义？
2. 普通非 `inline` 外部链接函数是否避免了多份定义？
3. 只供单个实现文件使用的 helper 是否留在 `.cpp`？
4. 实现文件是否把自己的头文件作为第一个普通依赖包含？
5. 头文件是否直接包含接口所需的依赖？
6. include guard 或 `#pragma once` 是否防止单个翻译单元内重复包含？
7. 声明、定义和调用是否指向同一个限定名称？
8. 构建目标是否包含了提供定义的源文件或库？
