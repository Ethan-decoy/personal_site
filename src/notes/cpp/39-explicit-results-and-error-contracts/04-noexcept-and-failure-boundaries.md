---
title: noexcept 与失败边界（Noexcept and Failure Boundaries）
date: 2026-10-08
order: 4
---

# noexcept 与失败边界（Noexcept and Failure Boundaries）

“函数返回错误结果”和“函数不会让异常逃出”是两项不同契约。`noexcept` 表达后者，不能从返回类型是 expected 或 bool 推导出来。

## noexcept 约束异常能否逃出调用

异常说明（Exception Specification）位于函数参数列表等声明部分之后。`noexcept` 等同于 `noexcept(true)`，表示不抛出异常；`noexcept(false)` 允许异常传播。普通函数未写这项说明时通常也是允许传播。

```cpp
#include <expected>
#include <iostream>

enum class read_error { out_of_range };

std::expected<int, read_error> validate(int value) noexcept {
    if (value < 0 || value > 500) {
        return std::unexpected{read_error::out_of_range};
    }
    return value;
}

int main() {
    const auto result = validate(700);
    std::cout << result.has_value() << '\n'; // 0
    static_assert(noexcept(validate(700)));
}
```

这里保存整数或枚举、判断与构造结果都不需要抛出。失败由错误状态返回，与 `noexcept` 同时成立。

如果异常从不抛出函数逃出，程序调用 `std::terminate` 终止；调用方的普通 `catch` 不能把这一越界行为当作正常传播恢复。函数内部自行捕获并处理异常仍可以合法。

> [!WARNING]
> noexcept 不是“请编译器帮我捕获异常”，也不检查业务成功。它是函数对异常边界的承诺；承诺错误时，后果是终止，而不是产生另一份错误结果。

## noexcept 表达式检查形式上的抛出可能性

`noexcept(expression)` 是另一项用法：作为不求值的运算符，得到表达式在异常说明规则下是否不抛出的布尔结果。本例的 `static_assert` 检查声明承诺，不执行一次验证调用。

一个实际总返回常数、却未声明不抛出的普通函数，其调用仍可能得到 `noexcept(...) == false`。编译器不是在这里证明函数体所有执行路径。

调用表达式的实参构造也要算入检查。一个函数声明不抛出，不代表“构造可能抛出的实参，再调用它”的整个表达式不抛出。

## 接口关系不能随意削弱异常承诺

覆盖一个不抛出的虚函数时，派生类覆盖也必须满足不抛出要求；不能扩大调用方通过基类接口观察到的异常范围。允许抛出的基类接口则可以由不抛出的覆盖实现。

默认生成的某些特殊成员操作会根据成员和基类的相应操作形成异常说明。移动操作的不抛出性质会影响容器的迁移策略；应检查真实成员契约，而不是为了“更快”无条件填写 `noexcept`。

> [!PRACTICE]
> 分别记录操作的业务失败结果、异常传播和失败后的状态保证。可能进行文本分配、外部访问或调用用户行为的函数，应依据实际行为判断是否能承诺不抛出。

## 参考资料

- [C++23 工作草案：异常说明](https://timsong-cpp.github.io/cppwp/n4950/except.spec)
- [C++23 工作草案：noexcept 运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.noexcept)
- [C++23 工作草案：终止处理](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
