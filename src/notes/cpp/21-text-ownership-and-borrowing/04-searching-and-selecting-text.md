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

> [!IMPORTANT]
> `find` 返回的是“下标或 `npos`”。先判断是否等于 `npos`，确认成功之后，结果才具有字符位置的含义。

## 先确认位置，再建立两侧范围

若等号位于 `separator`，左侧文本是 `text.substr(0, separator)`，右侧文本是 `text.substr(separator + 1)`。这里的 `substr` 返回借用原字符的视图，其[起点检查与截短规则](03-string-views-and-borrowed-text.md#子串改变观察范围)仍然适用。

找到的是单个等号，因此成功时必有 `separator < text.size()`，加一最多到达末尾。等号位于末尾时，右侧子视图合法但为空；等号位于开头时，左侧子视图为空。这两种情况是否被接受，是字段规则需要决定的事情。

比较键名时可以直接写 `key == "sensor"`：字符串视图支持与普通字符串字面量比较字符序列，双方长度相等且对应字符全部相等时，结果才为 `true`。对应的 `!=` 判断内容不相等。这里比较的是当前文本内容，遵循大小写精确匹配，不比较来源地址。

下面的 `print_sensor_field` 在字段符合约定时打印名称并返回 `true`；不符合时返回 `false`，由调用方决定如何报告。所有子视图只在函数调用期间使用，不保存到外部。

```cpp
#include <iostream>
#include <string>
#include <string_view>

bool print_sensor_field(std::string_view text) {
    const std::string_view::size_type separator{text.find('=')};
    if (separator == std::string_view::npos) {
        return false;
    }

    const std::string_view key{text.substr(0, separator)};
    const std::string_view value{text.substr(separator + 1)};
    if (key != "sensor" || value.empty()) {
        return false;
    }

    std::cout << value << '\n';
    return true;
}

void report_sensor_field(std::string_view text) {
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

如果省略缺失检查，直接写 `text.substr(text.find('=') + 1)`，对于没有等号的 `"sensor"`，就会把 `npos + 1` 当作起点。在 `size_type` 不发生整型提升的常见实现中，`npos + 1` 按无符号规则回绕为零，调用就变成 `text.substr(0)`，返回整段文本。程序可能完全不报错，却把原记录误当成等号右侧的内容。

同样，`text.substr(0, separator)` 中的数量若恰好为 `npos`，会按子串的截短规则取到末尾；它也不会替调用者识别“查找失败”。

> [!WARNING]
> 查找失败必须在位置运算和子串选取之前处理。`substr` 能检查起点，却不知道一个数来自合法位置还是查找的失败标记；无符号回绕与数量截短还可能把错误藏成一次合法调用。

这套下标仍以 `char` 为单位。当前示例的名称与分隔符均由基本字符组成；对多字节编码的文本，任意数字位置不一定落在完整字符的边界，`substr` 也不会自动修复被截断的编码。

> [!PRACTICE]
> 来源在整个处理期间保持有效、函数只需查看若干片段时，可以用 `string_view` 完成查找、比较和选取，避免为每个字段复制字符。若选出的名称需要脱离来源独立保存，在确认结果后用 `std::string{value}` 建立拥有值；这个复制承担的是保存责任。

## 参考资料

- [C++23 草案：字符串视图的查找与无位置标记](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 草案：字符串视图的内容比较](https://timsong-cpp.github.io/cppwp/n4950/string.view.comparison)
- [C++23 草案：无符号整数运算](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
