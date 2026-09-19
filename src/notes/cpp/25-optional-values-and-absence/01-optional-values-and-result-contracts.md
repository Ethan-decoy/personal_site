---
title: 可选值与返回契约（Optional Values and Result Contracts）
date: 2026-09-19
order: 1
---

# 可选值与返回契约（Optional Values and Result Contracts）

从 `sensor=front-left` 中选取 `=` 后的文本，可以返回 `string` 或 `string_view`。但如果接口还要区分“没有找到分隔符”和“分隔符后没有字符”，只返回空文本就不够了：`sensor` 与 `sensor=` 应当得到不同的结果。

这与文本长度无关，而是返回契约多了一个维度：**结果是否存在，以及存在时的值是什么。** 可选值（optional value）把这两件事一起表达，调用者不必猜测某个普通值是否另有含义。

## 无值是独立状态

头文件 `<optional>` 提供 `std::optional<T>`。这里的 `T` 指定可能保存的值类型，例如 `std::optional<int>` 可以含有一个 `int` 对象，也可以不含有值；`std::optional<std::string>` 则可以含有一个字符串对象，也可以无值。

默认构造的 `optional` 无值；用一个 `T` 值构造它，会建立有值状态。同一头文件中的 `std::nullopt` 是明确表示无值的标记，因此 `std::optional<int>{}` 与 `std::optional<int>{std::nullopt}` 都没有所含的整数。它不是整数 `0`，也不是空指针。

成员函数 `has_value()` 返回 `bool`，报告当前是否有值。`optional` 还提供[显式布尔转换](../14-user-defined-conversions-and-explicit-interfaces/03-conversion-functions-and-target-type-results.md#explicit-operator-bool允许条件判断不提供普通隐式转换)，所以 `if (result)` 也检查同一件事；它不继续检查内部值是真还是假。

确认有值后，`*result` 才能访问所含对象。这里的 `*` 是 `optional` 提供的运算符接口，不代表 `result` 本身是指针；对无值的 `optional` 使用它不满足前提，在 C++23 中具有未定义行为。

```cpp
#include <iostream>
#include <optional>

int main() {
    const std::optional<int> missing{};
    const std::optional<int> zero{0};
    const std::optional<bool> disabled{false};

    std::cout << missing.has_value() << '\n';
    if (zero) {
        std::cout << zero.has_value() << ' ' << *zero << '\n';
    }
    if (disabled) {
        std::cout << disabled.has_value() << ' ' << *disabled << '\n';
    }
}
```

输出依次为 `0`、`1 0`、`1 0`。`zero` 中确实有整数，只是整数值为 `0`；`disabled` 中确实有布尔值，只是它为 `false`。因此两个 `if` 都会进入。

`optional<bool>` 可以区分“未提供开关设置”“明确关闭”“明确开启”。是否需要这三种情况由接口决定；如果业务只有开与关，普通 `bool` 就足够。

> [!IMPORTANT]
> `optional<T>` 的有值状态不由 `T` 的内容决定。整数 `0`、布尔值 `false`、空字符串都可以是实际存在的结果；无值表示连这个 `T` 对象都没有。

## 返回类型保留缺失与空内容的区别

将[字段选择函数](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md#返回视图时明确字符留在哪里)的契约改为：没有 `=` 时无结果；存在 `=` 时返回其后的文本，即使文本长度为零。本例只选择第一个 `=` 后的部分，不校验字段名称，也不把后续的 `=` 当作错误。

函数返回 `std::optional<std::string>`，表示可能缺失的、拥有自身字符的字符串。`return std::nullopt;` 构造无值结果；`return std::string{...};` 则利用 `optional` 从所含类型构造的接口，把字符串作为有值结果返回。

```cpp
#include <iostream>
#include <optional>
#include <string>
#include <string_view>

std::optional<std::string> field_value(std::string_view field) {
    const std::string_view::size_type separator{field.find('=')};
    if (separator == std::string_view::npos) {
        return std::nullopt;
    }

    return std::string{field.substr(separator + 1)};
}

void print_field(std::string_view field) {
    const std::optional<std::string> result{field_value(field)};
    if (result) {
        std::cout << '[' << *result << "]\n";
    } else {
        std::cout << "missing\n";
    }
}

int main() {
    print_field("sensor");
    print_field("sensor=");
    print_field("sensor=front-left");
}
```

输出为 `missing`、`[]` 和 `[front-left]`。方括号让已经存在的空字符串也能被看见。

| 输入 | 返回状态 | 所含字符串 |
| --- | --- | --- |
| `sensor` | 无值 | 不存在 |
| `sensor=` | 有值 | 空字符串 |
| `sensor=front-left` | 有值 | `front-left` |

`find` 返回的 `npos` 是[查找接口约定的缺失标记](../21-text-ownership-and-borrowing/04-searching-and-selecting-text.md#查找结果同时表达位置与缺失)。函数先检查它，再计算子串起点；找到的 `=` 即使是最后一个字符，后面的零长度子串也有效。

输入通过 `string_view` 借用，结果则在输入仍有效时建立独立的 `string`。函数返回后，结果中的字符不再依赖原来的输入文本。这项独立性来自所含的 `string`，而 `optional` 负责在它之外保留“是否存在”的区别。

## 无值具体表示什么，由接口约定

`nullopt` 只表达无值，不记录为什么无值。本例明确把它解释为“没有 `=`”；如果函数还会拒绝非法字段名、非法单位等输入，就要决定这些情况能否统一归为无结果。调用者需要区分原因时，仅有 `optional` 还不足以承载完整信息。

返回类型也不承诺整个调用不会抛异常。例如，为结果建立 `string` 可能需要分配字符存储，分配失败仍可以通过异常传播。**无值是函数约定的一种正常返回状态，不是自动捕获所有失败的容器。**

> [!PRACTICE]
> 当“可能没有结果”是接口的一部分，而普通 `T` 的取值都应保留原意时，返回 `optional<T>` 可以把缺失要求直接写进类型。缺失是否适合继续执行、采用默认值或报告错误，由调用场景决定。
>
> 需要的是原序列中的位置时，迭代器及其终点约定仍然合适；需要交付一个可缺失的独立值时，再选择相应的 `optional<T>`。不必给已有清晰语义的位置结果额外套一层。

## 参考资料

- [C++23 工作草案：optional 的所含值与存在状态](https://timsong-cpp.github.io/cppwp/n4950/optional.optional)
- [C++23 工作草案：空构造与从值构造](https://timsong-cpp.github.io/cppwp/n4950/optional.ctor)
- [C++23 工作草案：存在检查与值访问](https://timsong-cpp.github.io/cppwp/n4950/optional.observe)
