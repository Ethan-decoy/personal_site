---
title: UndefinedBehaviorSanitizer
date: 2026-07-23
---

# UndefinedBehaviorSanitizer

UndefinedBehaviorSanitizer（UBSan）在程序实际运行时检查一部分未定义行为。它提供触发点证据，不是完整的正确性证明。

## 构建与运行

常见 Clang 命令可以写成一行：

```text
clang++ -std=c++23 -g -O1 -fsanitize=undefined -fno-sanitize-recover=all main.cpp -o app-ubsan
```

`-fsanitize=undefined` 启用一组检查。`-fno-sanitize-recover=all` 要求在首次报告后停止，便于把报告与触发输入对应起来。

具体检查集合、报告格式和运行库支持取决于编译器、版本与平台。GCC 和 Clang 的可用选项也不应自动推广到其他工具链。

## UBSan 能帮助发现什么

常见检查包括某些：

- 有符号整数溢出；
- 整数除以零；
- 无效移位；
- 对齐错误；
- 不合法的对象或类型操作。

它不会替你判断业务结果是否符合规格，也不会检查所有内存安全、并发和生命周期问题。没有执行到的危险路径也不会产生报告。

## 整数除法有两个危险条件

对 `int` 而言，除数为零不是唯一问题。若 `INT_MIN / -1` 的数学结果无法由 `int` 表示，该除法同样具有未定义行为。

```cpp
#include <limits>
#include <optional>

std::optional<int> checked_divide(int value, int divisor)
{
    if (divisor == 0)
    {
        return std::nullopt;
    }

    if (
        value == std::numeric_limits<int>::min() &&
        divisor == -1
    )
    {
        return std::nullopt;
    }

    return value / divisor;
}
```

这里先排除所有会使该 `int` 除法无效的输入，才执行 `/`。`std::optional` 如何表达“合法但没有结果”，见[结果契约与 optional](../functions/result-contracts-and-optional.md)。

这个函数只处理 `int` 除法的两个表示问题。它没有自动定义应用程序是否允许负数、是否需要余数，或失败时应向用户显示什么；这些仍属于接口规格。

## 如何阅读一次干净运行

一次没有报告的运行只支持以下结论：

```text
在这个构建、这些输入和实际执行路径中，
UBSan 没有报告它当前启用并能够检测的问题。
```

它不能证明所有输入安全，也不能证明未执行分支、工具不支持的错误类别或业务逻辑不存在问题。

## 保留可复现证据

记录编译器版本、完整构建命令、触发输入、第一条 sanitizer 报告和调用栈。修复后保留能执行原危险路径的回归检查，并再次运行相同 sanitizer 配置。
