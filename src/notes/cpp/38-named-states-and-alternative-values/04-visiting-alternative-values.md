---
title: 访问全部可能值（Visiting Alternative Values）
date: 2026-10-08
order: 4
---

# 访问全部可能值（Visiting Alternative Values）

对 variant 按类型逐项判断容易漏掉新增备选项。访问（Visitation）把“当前保存哪种值”交给库分派，调用方提供每种值对应的操作。

## visit 将当前值交给可调用对象

`std::visit(visitor, value)` 调用 `visitor`，把 variant 当前保存的值作为实参。`visitor` 可以是函数对象：不同的 `operator()` 重载对应不同类型。

下面先定义两种具名结果，再给出完整的访问接口。故障文本存入对象，不借用短命字符数据。

```cpp
#include <iostream>
#include <string>
#include <variant>

struct reading {
    int pressure_kpa;
};

struct failure {
    std::string message;
};

struct print_result {
    void operator()(const reading& value) const {
        std::cout << value.pressure_kpa << '\n';
    }

    void operator()(const failure& value) const {
        std::cout << value.message << '\n';
    }
};

int main() {
    std::variant<reading, failure> result{reading{220}};
    std::visit(print_result{}, result); // 220
    result = failure{"disconnected"};
    std::visit(print_result{}, result); // disconnected
}
```

`print_result{}` 是一个无额外状态的函数对象。`visit` 接到 `reading` 时，重载选择整数读数的处理；接到 `failure` 时，选择故障处理。这里两个重载都返回 `void`。

## 接口必须覆盖所有备选项

普通 `std::visit` 要求：对每一种可能的实参类型，调用都合法，而且产生相同的返回类型与值类别。即使当前对象一直保存 `reading`，缺少 `failure` 的可用处理也会使这一访问表达式编译失败。

这项要求能让新增备选项影响相关处理位置。一个不加区分、接受任意类型的泛型 Lambda 也可能合法，但它若对不认识的类型静默忽略，就失去这项业务完整性。

> [!IMPORTANT]
> 运行时只执行当前备选项的处理；编译期却必须证明全部可能项的处理接口成立。当前值不替未发生的分支提供合法性。

`std::visit<R>` 可以明确要求结果转换成 `R`；这与普通形式要求所有分支原样产生相同结果不同。使用该形式仍须保证每个处理能够形成所要求的结果。

## 引用和移动关系仍然属于实际调用

给 `visit` 的 variant 是左值时，它通常将当前值作为左值交给处理；只读 variant 则提供只读访问。`std::move(result)` 可以让处理取得右值访问，但不会自动保证被保存对象已被移动，也不会让 variant 变为空。

从处理函数返回借用，必须保证它所指当前值的生命周期。随后切换备选项或销毁 variant，都可能使这项借用失效。

多个 variant 一起访问时，处理必须覆盖其可能类型组合；组合数量会增长。只有实际问题需要交叉组合时才使用，避免为了消除一个 `if` 制造难以维护的分支矩阵。

## 参考资料

- [C++23 工作草案：variant 访问](https://timsong-cpp.github.io/cppwp/n4950/variant.visit)
