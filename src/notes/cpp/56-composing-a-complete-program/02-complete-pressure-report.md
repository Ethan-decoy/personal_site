---
title: 完整的压力报告程序（A Complete Pressure Report Program）
date: 2026-10-08
order: 2
---

# 完整的压力报告程序（A Complete Pressure Report Program）

本程序使用上一节的 pressure-domain.hpp。输入 readings.txt 每行是一个完整十进制整数，不允许空行、前导空白或单位后缀；至少需要一项有效读数。成功时替换 pressure-report.txt。

## 输入验证完成后再建立输出副作用

`std::istream&` 接收输入流接口，不取得其文件资源责任。处理函数保存结果值，临时 line 的字符借用只用于本次解析。

```cpp
#include "pressure-domain.hpp"

#include <charconv>
#include <cstddef>
#include <expected>
#include <format>
#include <fstream>
#include <iostream>
#include <optional>
#include <span>
#include <string>
#include <string_view>
#include <system_error>
#include <vector>

enum class input_error { invalid_number, trailing_text, out_of_range, read_failed };

struct input_failure {
    input_error kind;
    std::size_t line;
};

std::expected<pressure, input_error> parse_pressure(std::string_view text) {
    if (text.empty()) {
        return std::unexpected{input_error::invalid_number};
    }
    int value{};
    const char* const end{text.data() + text.size()};
    const auto parsed = std::from_chars(text.data(), end, value);
    if (parsed.ec == std::errc::result_out_of_range) {
        return std::unexpected{input_error::out_of_range};
    }
    if (parsed.ec != std::errc{}) {
        return std::unexpected{input_error::invalid_number};
    }
    if (parsed.ptr != end) {
        return std::unexpected{input_error::trailing_text};
    }
    const auto accepted = pressure::make(value);
    if (!accepted) {
        return std::unexpected{input_error::out_of_range};
    }
    return *accepted;
}

std::expected<std::vector<pressure>, input_failure> read_pressures(std::istream& input) {
    std::vector<pressure> values{};
    std::string line{};
    std::size_t number{};
    while (std::getline(input, line)) {
        ++number;
        const auto value = parse_pressure(line);
        if (!value) {
            return std::unexpected{input_failure{value.error(), number}};
        }
        values.push_back(*value);
    }
    if (input.bad() || !input.eof()) {
        return std::unexpected{input_failure{input_error::read_failed, number + 1}};
    }
    return values;
}

std::optional<double> mean_pressure(std::span<const pressure> values) {
    if (values.empty()) {
        return std::nullopt;
    }
    double total{};
    for (const pressure& value : values) {
        total += value.read();
    }
    return total / static_cast<double>(values.size());
}

int main() {
    std::ifstream input{"readings.txt"};
    if (!input) {
        std::cerr << "open input failed\n";
        return 1;
    }
    const auto values = read_pressures(input);
    if (!values) {
        std::cerr << "input error at line " << values.error().line << '\n';
        return 2;
    }
    const auto mean = mean_pressure(*values);
    if (!mean) {
        std::cerr << "no readings\n";
        return 3;
    }

    const auto report = std::format("mean={:.1f} kPa", *mean);
    std::ofstream output{"pressure-report.txt"};
    if (!output) {
        return 4;
    }
    output << report << '\n';
    output.close();
    if (!output) {
        return 5;
    }
    std::cout << report << '\n';
}
```

输入两行 220、230 时，终端与报告文件均得到 `mean=225.0 kPa`。输入第二行不合法时，在打开输出文件之前报告第 2 行错误，不会因这一验证失败截断旧报告。

沿两行 `220`、`501` 追踪一次失败，就能将各层接口用于实际判断：

| 经过的边界 | 本次得到的事实 | 交给下一层的结果 |
| --- | --- | --- |
| 第一行解析与保存 | `220` 是完整整数，领域工厂接受它 | `values` 暂时拥有一项合法 `pressure` |
| 第二行文本解析 | `getline` 成功；`from_chars` 完整解析出整数 501 | 语法成立，继续交给领域工厂；这还不证明压力合法 |
| 领域验证 | 501 超出 `pressure` 的 0–500 范围 | `parse_pressure` 返回 `input_error::out_of_range`，没有新的 `pressure` |
| 集合读取 | 错误来自当前第 2 行 | 包装成 `input_failure` 后返回；函数内仅含 220 的部分 `values` 随退出销毁 |
| 应用入口 | `values` 这份 expected 持有错误，未持有成功集合 | 打印第 2 行错误并返回 2，跳过均值、格式化及输出文件创建 |

这次文本读取与整数解析都成功，失败发生在领域条件。部分有效记录没有作为成功集合交给调用者。输入验证路径已经结束，程序因此尚未触及旧报告；输出阶段自身的失败保证仍需另查。

## 成功与失败保留实际边界

输入错误保留类别与行号；应用入口示例只打印行号，具体展示可以按 kind 分支。字符串和容器分配异常仍可传播，expected 只表达这里明确转换的输入失败。

均值采用 double 近似计算；大量记录仍受浮点累积与输出舍入影响，不承诺精确十进制算术。记录长度、总数量和资源限额属于生产接口需要明确的额外条件。

> [!WARNING]
> 输入验证完成后再写输出，避免了一类无谓截断；输出阶段失败仍可能留下部分新文件。要承诺原子替换或持久化，必须另建相应平台协议，不能把这一程序宣传为完整事务。

## 参考资料

- [C++23 工作草案：完整字符解析](https://timsong-cpp.github.io/cppwp/n4950/charconv.from.chars)
- [C++23 工作草案：文件输出与关闭](https://timsong-cpp.github.io/cppwp/n4950/ofstream)
