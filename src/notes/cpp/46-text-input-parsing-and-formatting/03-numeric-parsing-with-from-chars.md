---
title: 数值解析与完整消费（Numeric Parsing and Complete Consumption）
date: 2026-10-08
order: 3
---

# 数值解析与完整消费（Numeric Parsing and Complete Consumption）

“开头能读出一个整数”不等于“整段输入是合法整数”。解析接口还要检查有没有剩余字符，以及数值是否能在目标类型中表示。

## from_chars 返回位置和错误

`std::from_chars` 位于 `<charconv>`，分析给定字符半开区间，将成功值写入目标对象。返回结果包含 `ptr`（停止位置）和 `ec`（错误）。

`std::errc` 是 `<system_error>` 中的错误枚举；`std::errc{}` 表示没有该项错误。解析不依赖流的区域设置、不自动跳过前导空白，也不抛出异常。

```cpp
#include <charconv>
#include <expected>
#include <iostream>
#include <string_view>
#include <system_error>

enum class parse_error { invalid_number, out_of_range, trailing_text };

std::expected<int, parse_error> parse_integer(std::string_view text) {
    if (text.empty()) {
        return std::unexpected{parse_error::invalid_number};
    }
    int value{};
    const char* end = text.data() + text.size();
    const auto result = std::from_chars(text.data(), end, value);
    if (result.ec == std::errc::result_out_of_range) {
        return std::unexpected{parse_error::out_of_range};
    }
    if (result.ec != std::errc{}) {
        return std::unexpected{parse_error::invalid_number};
    }
    if (result.ptr != end) {
        return std::unexpected{parse_error::trailing_text};
    }
    return value;
}

int main() {
    std::cout << *parse_integer("220") << '\n';               // 220
    std::cout << parse_integer("220kPa").has_value() << '\n'; // 0
    std::cout << parse_integer(" 220").has_value() << '\n';   // 0
}
```

空输入先处理，随后形成有效范围。成功但 ptr 未到 end，表示只有前缀匹配；这不是 from_chars 失败，而是当前接口要求完整整数的额外规则。

## 数字语法与业务范围分别验证

整数形式默认使用十进制，允许相应有符号目标的负号，但不接受普通前导加号。指定其他进制仍须遵守规定范围和前缀规则。

from_chars 接受的 int 可能为负数或超过压力业务上限。完整数字解析之后，还须按压力契约验证 0–500；语法、可表示范围和业务范围是三层检查。

> [!TIP]
> 依次检查输入边界、解析错误、停止位置和业务范围。只查看输出整数或只查看错误码，都可能遗漏接口实际要求。

## 参考资料

- [C++23 工作草案：from_chars](https://timsong-cpp.github.io/cppwp/n4950/charconv.from.chars)
