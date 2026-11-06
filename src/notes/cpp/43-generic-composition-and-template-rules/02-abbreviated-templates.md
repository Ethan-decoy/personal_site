---
title: 缩写模板与约束位置（Abbreviated Templates and Constraint Placement）
date: 2026-10-08
order: 2
---

# 缩写模板与约束位置（Abbreviated Templates and Constraint Placement）

对一项只接受整数类型的普通操作，完整模板声明可能显得冗长。缩写函数模板（Abbreviated Function Template）允许在形参位置使用 auto，同时保留模板推导和约束的含义。

## 形参中的 auto 引入模板参数

`std::integral` 是 `<concepts>` 中检查整数类型的概念。`std::integral auto value` 为一个推导出的类型参数加上该约束；它不表示把所有实参先转换成 int。

```cpp
#include <concepts>
#include <iostream>

bool nonnegative(std::integral auto value) {
    return value >= 0;
}

int main() {
    std::cout << nonnegative(220) << ' ' << nonnegative(-1) << '\n'; // 1 0
}
```

该函数会针对实际整数类型形成实例。`nonnegative(220.0)` 不能靠浮点到整数转换绕过约束。

两个独立的 `auto` 形参引入两个独立类型参数，不自动要求类型相同。需要相同类型关系时，明确的 `template<typename T>` 和两个 `T` 形参常更清楚。

## 约束表达形式不替代语义检查

`std::integral` 包括 bool 和字符等整数类型；它不直接表达“这是一份压力”或“范围在 0–500”。概念检查类型条件，业务范围仍在普通控制流中处理。

`auto&`、`const auto&`、`auto&&` 保留相应推导、借用与转发规则。缩写只是接口写法，不将所有参数统一变成按值复制。

> [!PRACTICE]
> 单个操作要求容易在形参处表达时，缩写模板便于查阅。参数之间有复杂关系、需要命名类型或多项组合约束时，完整模板声明有助于把关系写清楚。

## 参考资料

- [C++23 工作草案：缩写函数模板](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：整数概念](https://timsong-cpp.github.io/cppwp/n4950/concepts.arithmetic)
