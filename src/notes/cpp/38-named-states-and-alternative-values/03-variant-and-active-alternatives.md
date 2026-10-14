---
title: variant 与当前可能值（Variant and Active Alternatives）
date: 2026-10-08
order: 3
---

# variant 与当前可能值（Variant and Active Alternatives）

读取得到一个压力值，或者得到一份故障说明。如果同时保存整数、故障文本和一个状态标记，代码还必须保证它们不互相矛盾。

`std::variant` 在 `<variant>` 中提供一种带类型区分的联合值（Discriminated Union）：从列出的备选类型中保存当前选中的一种。

## 一个对象保存当前选中的一种值

`std::variant<int, std::string>` 表示“当前有一个整数或一个字符串”，不表示两个成员始终同时存在。这里将整数约定为压力，字符串约定为故障说明。

`std::get_if<T>(&value)` 检查当前类型：匹配时返回指向所保存值的指针，不匹配时返回 `nullptr`。本例每个类型只出现一次，因此可以按类型选择。

```cpp
#include <iostream>
#include <string>
#include <variant>

int main() {
    std::variant<int, std::string> result{220};

    if (const auto* pressure = std::get_if<int>(&result)) {
        std::cout << *pressure << '\n'; // 220
    }

    result = std::string{"disconnected"};
    if (const auto* pressure = std::get_if<int>(&result)) {
        std::cout << *pressure << '\n';
    } else {
        std::cout << *std::get_if<std::string>(&result) << '\n'; // disconnected
    }
}
```

第二次赋值改变当前备选项：原整数不再是可访问的当前值，字符串对象开始承担结果。保存指向旧备选项的指针不能跨这种切换继续使用。

> [!IMPORTANT]
> variant 把“当前类型”和“当前值”作为一个整体维护。访问之前必须匹配当前备选项；列出的其他类型不是隐藏在旁边、随时都能读取的成员。

## 检查访问与要求访问不同

`std::get<int>(result)` 返回对当前整数的引用；若当前保存字符串，则抛出 `std::bad_variant_access`。`std::holds_alternative<int>(result)` 只返回当前是否为整数。

`result.index()` 返回当前备选项从 `0` 开始的序号。本例整数是 `0`，字符串是 `1`。序号依赖模板参数顺序，通常不适合直接充当持久化协议编码。

默认构造会默认构造第一个备选项：`std::variant<int, std::string> result;` 保存值为零的整数。若第一个类型不能默认构造，这个默认构造也不可用。

## 相同表示不等于相同含义

如果两个可能结果都使用 `int`，例如“压力”和“错误码”，`variant<int, int>` 可以按序号访问，但按 `int` 访问无法唯一识别是哪一项。更清楚的方式是分别设计具名结构体，把单位和角色放入类型。

如果确实需要一个无数据的具名状态，`std::monostate` 是 `<variant>` 中的空状态类型，可以作为第一备选项。它仍然是一项正常值，不是构造失败的异常状态。

> [!PRACTICE]
> 可能类型集合在接口中确定、各类型具有不同数据和处理方式时，variant 可以维持明确的值语义。需要开放地增加实现并经共同对象接口使用时，多态类表达的是另一种扩展关系。

更换备选项涉及销毁和构造；如果构造抛出异常，某些操作可能让 variant 进入[无当前值状态](05-variant-transitions-and-failure.md#无当前值是异常切换产生的状态)。它不能被误当作业务设计中的正常空值。

## 参考资料

- [C++23 工作草案：variant 的模型](https://timsong-cpp.github.io/cppwp/n4950/variant)
- [C++23 工作草案：访问当前备选项](https://timsong-cpp.github.io/cppwp/n4950/variant.get)
