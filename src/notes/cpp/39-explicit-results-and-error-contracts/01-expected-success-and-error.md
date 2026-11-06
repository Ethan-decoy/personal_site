---
title: expected 的成功与错误（Expected Success and Error）
date: 2026-10-08
order: 1
---

# expected 的成功与错误（Expected Success and Error）

“没有读数”和“读取失败，原因是设备断开”并不相同。`optional<T>` 只表达值是否存在；需要将失败原因作为正常结果传回时，可以使用 `<expected>` 中的 `std::expected<T, E>`。

这里 `T` 是成功值类型，`E` 是错误类型。两者都是接口的一部分。

## 成功与错误是互斥的正常结果

`std::unexpected<E>` 包装一项错误，用于构造 expected 的错误状态。它不是抛异常的操作；名称表示结果不符合成功预期。

```cpp
#include <expected>
#include <iostream>

enum class read_error { out_of_range };

std::expected<int, read_error> accept_pressure(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{read_error::out_of_range};
    }
    return value;
}

int main() {
    const auto accepted = accept_pressure(0);
    if (accepted) {
        std::cout << *accepted << '\n'; // 0 是成功值
    }

    const auto rejected = accept_pressure(700);
    if (!rejected && rejected.error() == read_error::out_of_range) {
        std::cout << "out of range\n";
    }
}
```

条件判断检查成功状态，不检查成功值是否非零。`*accepted` 访问其中的整数，`rejected.error()` 访问错误。这里不是用特殊的负数或零混入成功值集合。

> [!IMPORTANT]
> expected 表达“有成功值，或有错误值”。成功值为零、空字符串等仍然可以是成功；判断状态和判断值的业务含义是两项操作。

## 访问形式保留各自的前提

`has_value()` 和条件判断都能检查成功状态。`operator*`、`operator->` 要求当前成功；`error()` 要求当前失败。违反这些前提在 C++23 中不是自动抛出一项可恢复错误。

`value()` 提供带检查的成功访问；当前失败时抛出 `std::bad_expected_access<E>`，其中保存错误值。它把显式结果路径转成异常路径，不是恢复策略。

`value_or(fallback)` 在失败时产生备用成功值，但错误原因会从这项表达式的结果中消失。调用实参仍按普通调用求值，即使成功，构造备用值的表达式也不因此自动跳过。

## 它能表达错误，不保证操作完全不抛异常

成功值或错误值的构造、复制、内存分配都可能抛异常。返回 `expected<std::string, E>` 并不自动使函数成为不抛出函数。

接口应说明哪些失败作为 `E` 返回，哪些异常允许传播。例如“压力越界”是当前函数的正常失败结果；标准库资源分配失败并没有在本例中被转换成 `read_error`。

> [!PRACTICE]
> 调用方需要就地检查并根据失败原因分支时，expected 能把结果契约放在返回类型中。值缺失只需一项状态时使用 optional；跨多层调用的异常传播仍可按已有的资源与恢复模型组织。

## 参考资料

- [C++23 工作草案：expected](https://timsong-cpp.github.io/cppwp/n4950/expected)
- [C++23 工作草案：expected 观察操作](https://timsong-cpp.github.io/cppwp/n4950/expected.object.obs)
