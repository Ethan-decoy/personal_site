---
title: 可修改闭包与状态复制（Mutable Closures and State Copying）
date: 2026-09-17
order: 1
---

# 可修改闭包与状态复制（Mutable Closures and State Copying）

按值捕获既可以保存只读配置，也可以建立由闭包自己维护的状态。例如，一个操作每次被调用时递增自己保存的计数，不需要修改创建它的函数中的原变量。

这要求改变默认的调用权限。本篇以[按值捕获](../03-lambda-expressions-and-value-captures.md)和[引用捕获](../04-reference-captures-and-lifetimes.md)的区别为前提，只讨论本章这种显式列出捕获对象和普通参数的 Lambda。

## 可修改调用不再是默认的 const 成员函数

在形参列表之后、返回类型之前加入 `mutable`，如 `[count]() mutable -> int { ... }`，会让这里的闭包调用运算符不再是 `const` 成员函数。它因而可以修改从可修改局部对象按值捕获的副本。

`()` 表示这次调用没有参数。`mutable` 改变的是调用权限，不会把按值捕获改成引用捕获，也不会使外部原对象与内部副本同步。

下面分别观察调用期间保留的状态，以及复制闭包后的状态：

```cpp
#include <iostream>

int main() {
    int count{0};
    auto next = [count]() mutable -> int {
        ++count;
        return count;
    };

    std::cout << next() << '\n';
    auto copy{next};

    std::cout << next() << '\n';
    std::cout << copy() << '\n';
    std::cout << next() << '\n';
    std::cout << count << '\n';
}
```

输出依次为 `1`、`2`、`2`、`3`、`0`。

第一次 `next()` 把其成员中的计数从 `0` 增至 `1`。这时复制 `next`，`copy` 保存的是当前的 `1`，不是重新读取外部的 `0`。此后两个闭包各自递增，所以第二次调用 `next` 和第一次调用 `copy` 都得到 `2`；再次调用 `next` 得到 `3`，外部 `count` 始终为 `0`。

> [!IMPORTANT]
> 捕获决定状态如何进入闭包，`mutable` 决定调用能否修改闭包自己的可修改状态，复制构造则复制当时的状态。三者分别处理不同关系；`mutable` 不提供共享状态。

## mutable 不会移除已有的 const

示例中的 `next`、`copy` 没有写成 `const auto`，因为调用需要可修改对象。把 `next` 的声明改为 `const auto next = [count]() mutable -> int { ... };` 后，再执行 `next()` 会编译失败：这个有捕获的闭包不能通过 `const` 对象调用其非 `const` 的 `operator()`。

同样，若外部声明是 `const int count{0};`，用 `[count]` 捕获会保留该副本的 `const` 限定。即使加了 `mutable`，函数体中的 `++count` 仍然不合法。允许修改对象，不等于允许修改它包含的 `const` 成员。

引用捕获不需要靠 `mutable` 才能修改外部可修改对象：`[&count]` 访问的是原来的 `count`，默认调用的 `const` 不会扩大到这个引用目标。它同时保留了原目标必须继续有效的要求。

## 直接调用同一对象，与把对象交给算法不同

本例显式调用 `next`，所以每次都更新这个局部对象。如果把维护计数的闭包交给 `find_if`，算法[按值接收并可以继续复制谓词](../02-predicates-and-conditional-search.md#算法接收对象但不保证使用原对象)。算法中的调用不保证集中在某一个可由调用方观察的闭包副本上。

因此，不能通过给谓词加上 `mutable`，就把它当作算法遍历进度的可靠存放处。`mutable` 只解决“这个副本能不能改”，没有解决“算法会调用哪个副本、需要返回哪份状态”。

> [!PRACTICE]
> 操作本身需要私有的跨调用状态，并由调用方明确持有和调用同一个对象时，可修改闭包可以简洁表达这种关系。交给查找、筛选算法的判断规则，则优先保留稳定配置；需要明确累计过程时，用直接可见的循环或具有相应结果契约的接口表达。

## 参考资料

- [C++23 工作草案：闭包调用运算符的 const 与 mutable](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.closure)
- [C++23 工作草案：按值捕获成员的类型与初始化](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.capture)
- [C++23 工作草案：算法可以复制函数对象](https://timsong-cpp.github.io/cppwp/n4950/algorithms.requirements)
