---
title: 借用范围与算法结果（Borrowed Ranges and Algorithm Results）
date: 2026-10-08
order: 5
---

# 借用范围与算法结果（Borrowed Ranges and Algorithm Results）

算法在函数调用期间可以安全读完一个临时 vector，但返回指向其中元素的迭代器没有长期有效目标。ranges 的部分结果类型专门阻止这类入口逃逸。

## dangling 表示不能交出有效位置

`std::ranges::borrowed_range<R>` 是 `<ranges>` 中的概念，描述从范围取得的迭代器是否依赖当前范围入口的寿命。`R` 是范围算法根据实参推导的类型，可能包含引用。**引用形参结束与原容器销毁，需要分别判断。**

| 传给算法的实参 | 推导的 `R` | 查找结果与实际寿命 |
| --- | --- | --- |
| 具名左值 `std::vector<int>` | `std::vector<int>&` | 返回迭代器；引用形参结束不会销毁原容器，使用结果仍须保持容器和位置有效 |
| 临时 `std::vector<int>` | `std::vector<int>` | 返回 `std::ranges::dangling`；临时容器在包含调用的完整表达式结束时销毁 |

下面验证临时容器的结果类型：

```cpp
#include <algorithm>
#include <concepts>
#include <ranges>
#include <vector>

int main() {
    auto result = std::ranges::find(std::vector<int>{220, 230}, 230);
    static_assert(std::same_as<decltype(result), std::ranges::dangling>);
}
```

查找本身照常执行，临时容器在调用期间存在；`result` 的类型却是 `dangling`，刻意不提供元素访问。这阻止调用方在临时容器销毁之后，经返回位置访问其中的元素。

## borrowed 不表示拥有或绝对安全

span、string_view 等访问入口类型可以满足相应 borrowed 关系：销毁那份入口对象通常不销毁目标。目标数据自身是否还活着，仍由外部生命周期决定。

借用范围标记不防止原容器再分配、删除元素，也不会验证一个 span 原本是否悬空。它判断的是迭代器与范围入口的寿命关系；目标数据的寿命和位置失效仍要另行检查。

> [!TIP]
> 先判断算法是否允许返回位置，再判断位置所访问的实际对象能否维持到使用结束。结果类型拦截一类错误，不替调用方完成整份生命周期证明。

## 参考资料

- [C++23 工作草案：borrowed_range](https://timsong-cpp.github.io/cppwp/n4950/range.range)
- [C++23 工作草案：dangling 与借用结果](https://timsong-cpp.github.io/cppwp/n4950/range.dangling)
