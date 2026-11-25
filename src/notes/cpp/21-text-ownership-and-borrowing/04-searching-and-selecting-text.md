---
title: 文本查找与片段选取（Searching and Selecting Text）
date: 2026-09-15
order: 4
---

# 文本查找与片段选取（Searching and Selecting Text）

记录 `sensor=front-left` 中，等号左侧说明字段的用途，右侧保存传感器名称。处理这种记录，可以先定位分隔符，再用子视图选出两侧文本。查找负责提供位置，子串操作负责构造范围，而字段是否符合要求由程序判断。

这里约定第一个 `=` 是分隔符，左侧必须恰好是 `sensor`，右侧必须非空；右侧如果还有 `=`，它属于名称内容。这个约定足以说明当前的定位与选取过程，不涉及转义、空白清理或更复杂的文本格式。

## 查找结果同时表达位置与缺失

`std::string_view` 的成员函数 `find('=')` 从当前视图开头查找第一个等号。找到时返回它的下标；没有找到时返回 `std::string_view::npos`。

返回类型是无符号整数类型 `std::string_view::size_type`。`npos` 是这个类型的最大值，被接口用作**无位置标记**；它不是一个可以拿来访问字符的下标。判断是否找到，应当把结果与 `npos` 比较。

| 文本 | 查找结果 | 是否找到了等号 | 若直接转为 bool |
| --- | --- | --- | --- |
| `"=front-left"` | `0` | 找到了，在开头 | `false` |
| `"sensor=front-left"` | `6` | 找到了，在中间 | `true` |
| `"sensor"` | `npos` | 没找到 | `true` |

`if (text.find('='))` 看似在问“有没有等号”，实际测试的是返回的整数是否非零。它会漏掉开头的等号，又把缺失结果当成成功。表中的两端输入使这个错误不再隐藏在恰好成立的中间位置上。

> [!IMPORTANT] 查找结果的下标与缺失标记
> `find` 查找成功时返回下标，`0` 也是有效位置。返回 `npos` 表示缺失。使用结果作为下标前，先检查是否等于 `npos`。

## 先确认位置，再建立两侧范围

找到等号后，把它的下标记作 `separator`，把单个等号占用的字符数记作 `separator_width`，值为 `1`。左侧用 `text.substr(0, separator)` 选取，右侧用 `text.substr(separator + separator_width)` 选取。两个子视图都借用原字符，并遵循[起点检查与截短规则](03-string-views-and-borrowed-text.md#子串改变观察范围)。

查找成功时，`separator` 严格小于 `text.size()`，加上等号的宽度最多到达末尾。等号是最后一个字符时，右侧范围合法，长度为零。等号是第一个字符时，左侧范围的长度为零。这两种情况能否被接受，由字段格式的约定决定。

比较键名时可以直接写 `key == "sensor"`：字符串视图支持与普通字符串字面量比较字符序列，双方长度相等且对应字符全部相等时，结果才为 `true`。对应的 `!=` 判断内容不相等。这里比较的是当前文本内容，遵循大小写精确匹配，不比较来源地址。

下面的 `print_sensor_field` 在校验通过时打印名称并返回 `true`。校验失败时返回 `false`，由 `report_sensor_field` 报告无效字段。两个函数都按值接收视图，只在调用期间读取字符，因此调用者需要让输入视图借用的字符在这段时间内保持可读。

```cpp
#include <iostream>
#include <string>
#include <string_view>

bool print_sensor_field(const std::string_view text) {
    const std::string_view::size_type separator{text.find('=')};
    if (separator == std::string_view::npos) {
        return false;
    }

    constexpr std::string_view::size_type separator_width{1};
    const std::string_view key{text.substr(0, separator)};
    const std::string_view value{text.substr(separator + separator_width)};
    if (key != "sensor" || value.empty()) {
        return false;
    }

    std::cout << value << '\n';
    return true;
}

void report_sensor_field(const std::string_view text) {
    if (!print_sensor_field(text)) {
        std::cout << "invalid field\n";
    }
}

int main() {
    const std::string record{"sensor=front-left"};
    report_sensor_field(std::string_view{record});
    report_sensor_field(std::string_view{"=front-left"});
    report_sensor_field(std::string_view{"sensor="});
    report_sensor_field(std::string_view{"sensor"});
    report_sensor_field(std::string_view{"sensor=front=left"});
}
```

输出为：

```text
front-left
invalid field
invalid field
invalid field
front=left
```

三个无效输入分别对应键名为空、值为空和没有分隔符。它们是程序通过返回值报告的字段错误，没有调用越界操作，也没有依靠异常来识别格式。

最后一个输入保留了名称内部的等号，因为程序明确只用第一个等号划分字段。这说明查到分隔符并不等于完成了所有文本校验：需要拒绝哪些内容，应当由实际格式的规则决定。

## 位置标记不能提前参与运算

若从示例中省略缺失检查，输入 `"sensor"` 时，`separator` 就是 `npos`。左侧的 `text.substr(0, separator)` 会把请求数量截短到文本长度，所以 `key` 是整段 `"sensor"`。在 `size_type` 不发生整型提升的常见实现中，`separator + separator_width` 按无符号规则回绕到 `0`，右侧的 `text.substr(0)` 也得到整段 `"sensor"`。

此时 `key` 恰好是 `"sensor"`，`value` 也非空，后续的字段检查都会通过。`print_sensor_field` 因此误把这条记录判为有效，打印 `sensor` 并返回 `true`。

> [!WARNING]
> 先识别并处理 `npos`，再计算起点和选取字段。回绕后的起点和截短后的数量可能让两次 `substr` 都成功，使缺少分隔符的输入通过字段检查。

这套下标仍以 `char` 为单位。当前示例的名称与分隔符均由基本字符组成；对多字节编码的文本，任意数字位置不一定落在完整字符的边界，`substr` 也不会自动修复被截断的编码。

> [!PRACTICE]
> 调用期间源字符可读、函数只需查看字段时，可用 `std::string_view` 在原文本中完成查找、比较和选取，省去字段复制。需要独立保存名称时，可以在 `print_sensor_field` 的字段检查通过后、`value` 仍在作用域内且源字符可读时，用 `std::string{value}` [建立拥有副本](03-string-views-and-borrowed-text.md#需要独立文本时建立拥有值)。

## 参考资料

- [C++23 草案：字符串视图的查找与无位置标记](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 草案：字符串视图的内容比较](https://timsong-cpp.github.io/cppwp/n4950/string.view.comparison)
- [C++23 草案：无符号整数运算](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
