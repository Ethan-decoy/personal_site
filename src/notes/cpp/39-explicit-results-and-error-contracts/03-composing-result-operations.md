---
title: 结果操作的组合（Composing Result Operations）
date: 2026-10-08
order: 3
---

# 结果操作的组合（Composing Result Operations）

一条处理流程可能先验证压力，再校准，再生成报告。每一步都手写成功判断是准确的；当流程重复出现时，可以用 expected 的组合操作保留“失败则跳过后续成功处理”的关系。

## and_then 连接可能失败的下一步

`and_then` 在当前成功时把成功值交给可调用对象，要求该调用返回另一个 expected；当前失败时不调用它，直接传播错误。对 `expected<T, E>`，所返回 expected 的错误类型也须是 `E`。

`transform` 用一次普通计算改变成功值类型，保留错误类型；它的回调返回计算所得值，而不是另一份 expected。

```cpp
#include <expected>
#include <iostream>

enum class read_error { out_of_range };

std::expected<int, read_error> validate(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{read_error::out_of_range};
    }
    return value;
}

std::expected<int, read_error> calibrate(int value) {
    return validate(value + 10);
}

int main() {
    const auto accepted =
        validate(220).and_then(calibrate).transform([](int value) { return value / 10; });
    std::cout << *accepted << '\n'; // 23

    int calls{0};
    const auto rejected = validate(700).and_then([&calls](int value) {
        ++calls;
        return calibrate(value);
    });
    std::cout << rejected.has_value() << ' ' << calls << '\n'; // 0 0

    int reports{0};
    const auto calibration_rejected =
        validate(495).and_then(calibrate).transform([&reports](int value) {
            ++reports;
            return value / 10;
        });
    std::cout << calibration_rejected.has_value() << ' ' << reports << '\n'; // 0 0
}
```

`calibrate` 的输入已由 `validate` 限制到 `0–500`，加 `10` 不会发生整数溢出；新的数值仍需再次验证业务上限。这项前提来自当前调用流程，不是 expected 自动提供的数值保护。

三次调用让失败的进入位置分别显现：

| 原始输入 | 初次验证 | 校准步骤 | 后续成功变换 |
| --- | --- | --- | --- |
| 220 | 成功值 220 | 校准为 230，再验证成功 | 计算 23 |
| 700 | 立即失败 | 不调用；`calls` 保持 0 | 没有成功值可继续处理 |
| 495 | 成功值 495 | 得到 505，业务上限验证失败 | `transform` 不调用；`reports` 保持 0 |

495 的路径说明：前一步成功，只表示可以进入下一步，不保证下一步也成功。`and_then` 接受可能失败的新结果，后续 `transform` 只在它持有成功值时计算；错误沿链传播，不会把 505 当作已接受的压力继续生成报告。

> [!IMPORTANT]
> 组合操作决定哪条状态路径调用哪个函数，不能代替被调用函数自身的前提、计算正确性或副作用契约。

## 错误路径也可以有明确变换

`or_else` 只在失败时调用回调，回调须返回成功类型相同的 expected，可以改变错误类型或进行恢复。`transform_error` 只变换错误值，成功类型保持不变。

| 操作 | 何时调用回调 | 回调的主要结果 |
| --- | --- | --- |
| `and_then` | 成功 | 下一份 expected，错误类型保持 |
| `transform` | 成功 | 新的成功值 |
| `or_else` | 失败 | 下一份 expected，成功类型保持 |
| `transform_error` | 失败 | 新的错误值 |

恢复操作需要真实策略。例如设备断开时返回一个旧缓存值，应当让接口说明读数可能不是最新值，而不是把错误路径伪装成普通成功。

## 组合不隔离异常与借用

回调抛出的异常正常传播；这些操作不会统一捕获后填入 `E`。回调怎样接收值，也受 expected 的 `const` 与值类别影响。对右值调用组合操作，可以将当前值以右值访问交出；回调是否实际移动仍由它执行的操作决定。

> [!PRACTICE]
> 状态传播规则清楚、成功处理是连续变换时，组合操作有助于保留主线。存在重试、清理或多个分支的流程，普通条件语句通常更容易表达，没必要把所有控制流压成一条链。

## 参考资料

- [C++23 工作草案：expected 组合操作](https://timsong-cpp.github.io/cppwp/n4950/expected.object.monadic)
