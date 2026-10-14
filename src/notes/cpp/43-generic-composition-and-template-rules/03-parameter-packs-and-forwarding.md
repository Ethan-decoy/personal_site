---
title: 参数包与多实参转发（Parameter Packs and Multi-Argument Forwarding）
date: 2026-10-08
order: 3
---

# 参数包与多实参转发（Parameter Packs and Multi-Argument Forwarding）

单实参包装已经能保留一次调用的值类别。要包装不同参数数量的操作，接口还需要表示“一组数量可变的实参”。

## 参数包表示一组参数，展开生成实参列表

模板参数包（Template Parameter Pack）`typename... Args` 接收零个或多个类型；函数形参包（Function Parameter Pack）`Args&&... args` 对应一组形参。

包展开（Pack Expansion）`std::forward<Args>(args)...` 对每一对类型与形参形成转发表达式，再生成调用的实参列表。它不是一个在运行时取下标的数组。

`std::invocable<Function, Args...>` 在 `<concepts>` 中检查这些类型能否形成相应统一调用，不承诺无副作用或执行成功。

```cpp
#include <concepts>
#include <functional>
#include <iostream>
#include <memory>
#include <utility>

template <typename Function, typename... Args>
    requires std::invocable<Function, Args...>
decltype(auto) invoke_forward(Function&& operation, Args&&... args) {
    return std::invoke(std::forward<Function>(operation), std::forward<Args>(args)...);
}

int adjusted(int value, int offset) {
    return value + offset;
}

int main() {
    std::cout << invoke_forward(adjusted, 220, 10) << '\n'; // 230
    int offset{10};
    auto owner = std::make_unique<int>(220);
    const int combined = invoke_forward(
        [](int& adjustment, std::unique_ptr<int> value) {
            ++adjustment;
            return *value + adjustment;
        },
        offset,
        std::move(owner));
    std::cout << combined << '\n';                            // 231
    std::cout << offset << ' ' << (owner == nullptr) << '\n'; // 11 1
}
```

先展开第一次调用 `invoke_forward(adjusted, 220, 10)`。它的 Args 包依次包含两个 int；代入形参模式后，得到两个 int&& 形参。下面用 `first_arg` 和 `second_arg` 分别指代它们，仅作推演记法：

| 对应位置 | Args 的这一项 | 实际形参类型 | 在调用中生成的实参表达式 |
| --- | --- | --- | --- |
| `220` 对应的第一项 | `int` | `int&&` | `std::forward<int>(first_arg)` |
| `10` 对应的第二项 | `int` | `int&&` | `std::forward<int>(second_arg)` |

展开后的两个表达式分别成为 adjusted 的两个实参，结果为 `220 + 10 = 230`。**包展开按位置配对类型与形参，再逐项生成表达式；并不存在一份能在运行时整体取下标的包对象。**

第二次调用让同一包内的两项承担不同关系。`offset` 是左值，相应 Args 项推导为 int&，forward 后仍借用原整数；Lambda 因此把它改为 `11`。独占拥有者则作为将亡值传入，相应 Args 项为 `std::unique_ptr<int>`，forward 后用于初始化 Lambda 的按值形参，转交拥有责任。所以结果为 `231`，原 owner 随后为空。

每项 args 都是有名字的左值表达式，需要分别按自己的 Args 转发。若把展开式改成 `std::move(args)...`，会把每一项都作为右值交出，原本应保留的 offset 左值关系也会改变；它将不能绑定本例 Lambda 的 int& 形参。

## 数量与关系仍有编译期要求

`sizeof...(Args)` 得到包长度，结果是编译期常量。空包可以展开为零个实参；被调用目标还须能接受无参调用。

同一个展开模式同时包含多个包时，相应展开长度必须一致。展开解决语法结构，是否能构造、重载是否唯一及借用寿命仍按实际表达式检查。

> [!WARNING]
> 转发不会延长临时对象生命周期。包装器返回目标的引用结果时，仍要检查目标引用的是调用方对象、短暂实参还是局部值；参数数量变多不改变这项边界。

## 参考资料

- [C++23 工作草案：参数包与展开](https://timsong-cpp.github.io/cppwp/n4950/temp.variadic)
- [C++23 工作草案：invocable](https://timsong-cpp.github.io/cppwp/n4950/concept.invocable)
