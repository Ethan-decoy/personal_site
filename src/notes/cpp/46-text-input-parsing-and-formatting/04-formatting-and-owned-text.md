---
title: 格式化与拥有型文本（Formatting and Owned Text）
date: 2026-10-08
order: 4
---

# 格式化与拥有型文本（Formatting and Owned Text）

生成报告时，数值类型、输出精度和文本结构都应明确。`std::format` 将格式规则与实参组合成一份拥有型 string，不修改某个流的长期格式状态。

## 替换字段明确输出形式

`std::format` 位于 `<format>`，格式中的 `{}` 是替换字段（Replacement Field），`{:.1f}` 表示按固定小数形式保留一位小数，`{:04d}` 表示十进制整数按宽度四使用零填充。

```cpp
#include <format>
#include <iostream>

int main() {
    const double pressure_kpa{220.5};
    const int sequence{7};
    const auto text = std::format("reading {:04d}: {:.1f} kPa", sequence, pressure_kpa);
    std::cout << text << '\n'; // reading 0007: 220.5 kPa
}
```

格式中的普通花括号需要写作 `{{` 与 `}}`。格式化后的 text 独立保存结果，不借用上述实参。

通常的 format 接口要求格式与类型在编译期可检查；例如将整数格式用于不支持它的文本类型，不是运行时悄悄转换成预期值。

## 运行时格式需要运行时检查

C++23 可以用 `std::vformat` 配合 `std::make_format_args` 处理运行时字符串。参数包视图不拥有全部实参，应在这些实参仍有效时完成调用；不宜把临时形成的参数入口长期保存。

运行时格式不合法可能抛出 `std::format_error`；生成 string 还可能有分配失败。format 不因产生文本就自动不抛出。

区域设置（Locale）影响部分文本与数值格式。普通 format 不自动继承某个流的全局格式状态；需要本地化时应明确选择相应接口与格式选项，机器协议则维持规定格式。

> [!PRACTICE]
> 人可读报告的精度和机器可解析格式分开定义。位数变化影响展示和往返结果，不能将“看起来够短”当作所有数值保存场景的统一要求。

使用 format 需要标准库支持该设施；编译器语言模式与库实现进度分别核对。

## 参考资料

- [C++23 工作草案：格式化函数](https://timsong-cpp.github.io/cppwp/n4950/format.functions)
- [C++23 工作草案：标准格式语法](https://timsong-cpp.github.io/cppwp/n4950/format.string.std)
