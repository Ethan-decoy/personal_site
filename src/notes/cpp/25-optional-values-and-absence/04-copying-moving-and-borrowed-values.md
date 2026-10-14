---
title: 可选值的复制、移动与借用（Copying, Moving, and Borrowing Optional Values）
date: 2026-09-19
order: 4
---

# 可选值的复制、移动与借用（Copying, Moving, and Borrowing Optional Values）

`optional<string>` 和 `optional<string_view>` 都可以按值返回，也都可以复制。但前者保存拥有字符的字符串，后者保存借用字符的视图。`optional` 增加了“可能没有值”这一层状态，所含类型原有的数据关系仍然存在。

## 复制和移动作用于所含对象

复制构造 `optional<T>` 时，源无值，目标也无值；源有值，目标就从源所含的 `T` 对象复制构造自己的 `T`。因此，复制 `optional<string>` 会得到独立的字符串，修改副本中的文字不会改变源。

移动构造也按照源是否有值选择分支。源有值时，目标使用 `std::move(*source)` 构造自己的 `T`；源无值时，目标无值。**移动不会自动让源 optional 变成无值状态。**

```cpp
#include <iostream>
#include <optional>
#include <string>
#include <utility>

int main() {
    std::optional<std::string> source{std::string{"front-left"}};
    std::optional<std::string> copy{source};
    *copy = "rear-right";

    std::cout << *source << ' ' << *copy << '\n';

    const std::optional<std::string> target{std::move(source)};
    std::cout << source.has_value() << ' ' << target.has_value() << ' ' << *target << '\n';
}
```

程序输出 `front-left rear-right` 和 `1 1 front-left`。最初的构造已经保证 `source` 有值，复制后 `copy` 也有值，所以这里可以直接解引用。移动成功后，`target` 中的字符串取得原来的文本，`source` 中仍有一个字符串对象。

源字符串此时保持有效，但其内容未指定，不能把“源仍有值”理解为“原来的文字还在”，也不能断言它已经变成空字符串。如果业务要求使用后不再保留一个可选值，应在完成移动后明确调用 `source.reset()`。

> [!IMPORTANT]
> 需要分别判断 optional 是否含有对象，以及这个对象处于什么状态。移动保留源的有值标志，所含对象的移动后状态由 `T` 的契约决定；`has_value()` 不负责判断内容是否仍符合原来的业务含义。

`optional` 也不会替所含类型补上复制能力。若 `T` 不能复制构造，`optional<T>` 的复制构造同样不可用，即使待复制的对象碰巧处于无值状态。操作是否可用由类型决定，不由这一次运行中的有值标志决定。

移动中的 `std::move(*source)` 提供右值来源，实际选中的操作仍取决于 `T`。[能够接收右值不要求一定存在移动构造函数](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#没有移动操作也可能接收右值)，也不保证发生资源转交或获得固定的性能收益。

## 复制视图结果仍然借用原来的字符

`string_view` 的复制只建立另一份范围记录，字符仍由来源维持。把它放进 `optional` 后，复制的是可选状态和视图对象，不会顺带建立独立字符存储。

下面的 `field_value_view` 返回第一个 `=` 后的子视图，不校验字段名称。没有 `=` 时返回 `nullopt`；存在 `=` 时返回有值结果，包括长度为零的视图。这保留了“缺少分隔符”和“值为空文本”的区别，同时把字符留在输入来源中。

```cpp
#include <iostream>
#include <optional>
#include <string>
#include <string_view>

std::optional<std::string_view> field_value_view(std::string_view field) {
    const std::string_view::size_type separator{field.find('=')};
    if (separator == std::string_view::npos) {
        return std::nullopt;
    }

    return field.substr(separator + 1);
}

int main() {
    std::string field{"sensor=front-left"};
    const std::optional<std::string_view> borrowed{field_value_view(std::string_view{field})};
    const std::optional<std::string_view> copy{borrowed};

    field[7] = 'F';
    if (borrowed && copy) {
        std::cout << *borrowed << ' ' << *copy << '\n';
    }

    const std::optional<std::string_view> empty_value{field_value_view("sensor=")};
    const std::optional<std::string_view> missing{field_value_view("sensor")};
    if (empty_value) {
        std::cout << empty_value.has_value() << ' ' << empty_value->size() << ' '
                  << missing.has_value() << '\n';
    }
}
```

程序输出 `Front-left Front-left` 和 `1 0 0`。返回表达式中的 `string_view` 被用来构造有值的 `optional<string_view>`；调用所在的声明完成后，函数形参视图已销毁，字符却仍由 `main` 中的 `field` 维持。`borrowed` 与 `copy` 保存两份视图，都观察相同字符，因此也都能看到原位修改后的大写 `F`。这种修改通过有效下标替换已有字符，不改变原来的访问关系。

`empty_value` 借用的是字符串字面量，字面量的字符在程序运行期间一直存在。它含有长度为零的视图；`missing` 则没有视图对象，两者可以直接通过有值标志区分。

> [!WARNING]
> `optional<string_view>` 的 `has_value()` 为真，只能证明其中存在视图对象。原字符已经销毁或发生了使借用失效的存储变化时，它不会自动变为无值；继续通过这个视图读取字符仍然不安全。

因此，[返回视图所要求的来源有效期](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md#返回视图时明确字符留在哪里)没有改变：不能借用函数内的局部字符串，也不能把临时字符串所产生的结果保存到临时对象销毁之后再读取。复制或移动外层 `optional` 都不会延长字符的生命周期。

C++23 不允许使用 `optional<T&>` 直接保存“可选引用”。这里的 `optional<string_view>` 成立，是因为 `string_view` 本身是对象类型；它按值保存的内容恰好是一段字符的借用关系。

## 返回类型同时表达缺失与数据关系

返回 `optional<string>` 适合表达“可能得到一份独立文本”；返回 `optional<string_view>` 适合表达“可能在已有文本中选出一段”。二者对无值状态的表达相同，调用方承担的生命周期责任不同。

> [!PRACTICE]
> 结果需要独立保存，或调用方难以维持原字符的有效期时，选择拥有字符的结果。借用来源明确、存储在使用期间保持有效，且接口本来就要表达原文本中的范围时，可以返回可选视图，并写明借用来源。

## 参考资料

- [C++23 工作草案：optional 的复制与移动构造](https://timsong-cpp.github.io/cppwp/n4950/optional.ctor)
- [C++23 工作草案：optional 的所含对象与类型要求](https://timsong-cpp.github.io/cppwp/n4950/optional.optional)
- [C++23 工作草案：string_view 的范围与失效关系](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
