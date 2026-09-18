---
title: 函数对象与调用运算符（Function Objects and Call Operators）
date: 2026-09-17
order: 1
---

# 函数对象与调用运算符（Function Objects and Call Operators）

判断压力样本是否超过上限，需要当前读数，也需要上限值。普通函数可以把这两项都作为参数；如果希望先保存一份上限配置，再反复接收读数，就可以把配置与判断行为放进同一个对象。

这样的对象既有状态，也能使用 `check(value)` 的形式调用。**把行为表示为对象，就能像传递其他对象一样，把一项带有配置的操作交给另一段代码。**

## 让对象支持调用表达式

类可以提供名为 `operator()` 的成员函数，它称为函数调用运算符（function call operator）。其中的 `()` 是运算符名称的一部分；在 `bool operator()(double value) const` 中，后面的 `(double value)` 才是形参列表。

下面的 `above_limit` 保存压力上限，调用时判断传入读数是否严格大于它：

```cpp
#include <iostream>

struct above_limit {
    double limit_kpa;

    bool operator()(double value) const {
        return value > limit_kpa;
    }
};

int main() {
    const above_limit check{245.0};
    const above_limit higher_limit{250.0};

    std::cout << check(248.0) << '\n';
    std::cout << higher_limit(248.0) << '\n';
    std::cout << check.operator()(248.0) << '\n';
}
```

输出依次为 `1`、`0`、`1`。

`check{245.0}` 初始化对象的成员，保存本次配置。`check(248.0)` 则调用这个对象的 `operator()`：`value` 接收 `248.0`，函数体读取 `check.limit_kpa`，返回 `bool`。显式写成 `check.operator()(248.0)` 也会调用同一个成员函数。

末尾的 `const` 与[普通 const 成员函数](../10-class-interfaces-and-encapsulation/02-const-member-functions-and-read-only-access.md)含义相同：当前调用只读取对象中的配置，因此也能通过 `const above_limit` 调用。它不表示返回值是常量，也不要求参数本身是 `const`。

这种能够像函数一样调用的对象称为函数对象（function object）。本篇使用具有 `operator()` 的类对象；这里的“函数对象”描述调用能力，不表示对象变成了普通函数。

## 对象保存配置，参数提供本次输入

`check` 和 `higher_limit` 具有同一种类型、使用同一段成员函数代码，但成员值不同，所以同一个读数会得到不同结果。它们不需要各自定义一份新函数。

| 表达式中的部分 | 当前职责 |
| --- | --- |
| `check` | 指定本次使用哪个对象，以及它保存的上限 |
| `(248.0)` | 提供本次调用的读数 |
| `check(248.0)` 的结果 | 表示该读数是否超过这份上限 |

如果把 `check` 复制为另一个 `above_limit`，成员 `double` 按值复制，新对象保存独立的配置。调用运算符没有改变类对象原有的复制、生命周期或 `const` 规则。

函数对象也不必返回 `bool`。返回数值的校准操作、返回文本的格式化操作，同样可以提供调用接口。能否写成 `object(arguments)` 由调用接口决定；具体结果和副作用由被调用函数决定。

> [!IMPORTANT]
> 对象成员保存跨调用保留的状态，调用参数提供本次输入。`operator()` 把两者组合为一次操作；复制对象与调用对象仍然是两件事。

## 传递操作与立即调用不同

表达式 `check` 指定已有的函数对象，`check(248.0)` 则立即执行判断，得到一个 `bool`。需要把判断规则交给其他代码时，传递的是对象；传递某次调用结果，只能交付那一次的真假值。

这种区别也是函数对象作为接口的用途：接收方负责决定何时调用、传入哪个读数，调用方负责提供判断规则和配置。

> [!PRACTICE]
> 配置和行为具有清楚的领域含义，或者要在多处复用时，可以为函数对象定义具名类型。只有一个直接调用点、也不需要传递操作时，普通函数仍然清晰；不必为所有函数都建立一个类。

## 参考资料

- [C++23 工作草案：函数调用运算符](https://timsong-cpp.github.io/cppwp/n4950/over.call)
- [C++23 工作草案：函数对象](https://timsong-cpp.github.io/cppwp/n4950/function.objects)
