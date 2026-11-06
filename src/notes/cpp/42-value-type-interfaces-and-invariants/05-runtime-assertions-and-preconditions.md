---
title: 运行期断言与接口前提（Runtime Assertions and Preconditions）
date: 2026-10-08
order: 5
---

# 运行期断言与接口前提（Runtime Assertions and Preconditions）

编译期断言检查常量条件，运行期断言（Runtime Assertion）用于诊断执行期间应成立的内部条件。它不是处理外部输入失败的返回机制。

## assert 验证调用方已经承诺的条件

`<cassert>` 中的 `assert(condition)` 是宏。启用时检查条件，失败则输出诊断并终止程序；它不抛出一个可由普通 catch 恢复的异常。

```cpp
#include <array>
#include <cassert>
#include <iostream>
#include <span>

int latest(std::span<const int> values) {
    assert(!values.empty());
    return values.back();
}

int main() {
    const std::array values{220, 230};
    std::cout << latest(values) << '\n'; // 230
}
```

`span::back()` 访问最后一个元素，要求范围非空。本例 latest 的接口前提就是非空；assert 帮助在调试时发现调用违约，不把空输入变成一项可恢复结果。

## 关闭断言后前提仍然存在

包含头文件时若定义 `NDEBUG`，assert 检查会被禁用。`latest` 在这种构建中依然不能读取空范围。断言不是“发布版不需要前提”的许可。

不要在断言表达式中完成必需副作用，例如读取文件、递增计数或初始化对象；禁用断言会同时跳过这些操作，改变程序语义。

> [!IMPORTANT]
> 断言诊断程序内部违反约定的情况。外部数据可能合法地失败时，必须执行真实检查，并返回错误或按异常契约处理；不能将必需验证只放在可关闭的断言里。

## 内部不变式也需要真正维护

断言可以验证完成一次修改后状态是否仍符合不变式，但不会修复状态。类型接口仍须限制操作，并在异常和提前退出时保持已承诺的保证。

> [!PRACTICE]
> 将“调用前必须成立”“操作正常返回后保证成立”和“外部输入可能不满足”分别说明。断言适合前两项的开发期诊断，错误结果适合第三项的正常控制流。

## 参考资料

- [C++23 工作草案：assert](https://timsong-cpp.github.io/cppwp/n4950/assertions)
