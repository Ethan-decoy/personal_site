---
title: 值访问与缺失处理（Value Access and Fallbacks）
date: 2026-09-19
order: 2
---

# 值访问与缺失处理（Value Access and Fallbacks）

`std::optional` 让接口保留了“没有值”这一结果。使用结果时，还需要决定：确认有值后继续访问、让缺失抛出异常，还是用一个备用值继续处理。选择不同的访问方式，也会决定得到的是所含对象的引用还是一个独立值。

## 访问的是所含对象

对有值的 `std::optional<T>`，`*result` 访问其中的 `T` 对象；若 `T` 有成员，`result->member` 可以直接访问它的成员，作用相当于 `(*result).member`。例如，`std::optional<std::string>` 有值时，`result->size()` 取得所含字符串的长度。

本篇讨论具名的左值 `optional`。通过普通左值解引用，得到 `T&`；通过 `const` 左值解引用，得到 `const T&`。**解引用本身不复制所含对象。**用 `T&` 接收结果建立引用，用 `T` 接收结果才会构造副本；这与普通对象的引用和复制规则一致。

`*` 和 `->` 都要求调用时已经有值。`if (result)` 可以建立进入分支时的有值条件；在访问发生之前，也必须保持这个条件成立。

头文件 `<optional>` 还提供成员函数 `value()`。它在有值时返回所含对象的引用，在无值时抛出 `std::bad_optional_access` 异常；这个异常类型也声明在 `<optional>` 中。对这里的左值，返回引用同样随 `optional` 的 `const` 限定而变化。

| 访问方式 | 有值时 | 无值时 |
| --- | --- | --- |
| `*result` | 访问所含对象 | 违反有值前提，具有未定义行为 |
| `result->member` | 访问所含对象的成员 | 违反有值前提，具有未定义行为 |
| `result.value()` | 访问所含对象 | 抛出 `std::bad_optional_access` |

下面通过引用修改名称，同时保留一份独立副本；随后对一个无值结果调用 `value()`，捕获它明确约定的异常。

```cpp
#include <iostream>
#include <optional>
#include <string>

int main() {
    std::optional<std::string> name{std::string{"front-left"}};

    if (name) {
        const std::string copied_name{*name};
        std::string& stored_name{*name};
        stored_name = "rear";

        std::cout << *name << '\n';
        std::cout << copied_name << '\n';
        std::cout << name->size() << '\n';
    }

    const std::optional<std::string> missing{};
    try {
        std::cout << missing.value() << '\n';
    } catch (const std::bad_optional_access&) {
        std::cout << "no sensor name\n";
    }
}
```

输出为：

```text
rear
front-left
4
no sensor name
```

`stored_name` 引用所含字符串，因此对它赋值也改变了通过 `name` 看到的内容。`copied_name` 是独立字符串，不随这次修改变化。最后的异常来自 `value()` 的状态检查，不能据此推断 `*missing` 也会抛出相同异常。

> [!IMPORTANT]
> 访问所含对象与复制它是两件事。`*`、`->` 和 `value()` 都可以直接访问原对象；其中只有 `value()` 约定在无值时抛出异常。通过访问取得的引用仍然依赖所含对象的生命周期。

## 备用值产生独立的结果

成员函数 `value_or(fallback)` 表示“有值就采用它，否则采用备用值”。它返回一个 `T` 值：对这里的左值 `optional`，有值时复制所含值，无值时用备用参数转换得到结果。`T` 必须能够复制构造，备用参数也必须能够隐式转换成 `T`，不能因为预计只走其中一条分支就省去另一条分支的类型要求。

因此，`value_or` 不返回所含对象的引用，也不会把备用值填入原来无值的 `optional`。得到结果之后修改这个独立值，不会通过引用改写原对象。

例如，压力读数缺失时，当前程序约定采用 `240 kPa`。下面的函数用一行输出标记“计算备用值”这件事发生的时机：

```cpp
#include <iostream>
#include <optional>

int default_pressure_kpa() {
    std::cout << "computing fallback\n";
    return 240;
}

int main() {
    const std::optional<int> measured{245};
    const std::optional<int> missing{};

    std::cout << measured.value_or(default_pressure_kpa()) << '\n';
    std::cout << missing.value_or(default_pressure_kpa()) << '\n';
    std::cout << missing.has_value() << '\n';
}
```

输出为：

```text
computing fallback
245
computing fallback
240
0
```

第一次调用已经有 `245`，但仍然打印了 `computing fallback`。原因是 `value_or` 是普通函数调用：传入的实参表达式必须先求值，函数才能从已有值和备用参数之间选择。它不会像 `&&` 或条件运算符那样按需要决定是否求值某个表达式。最后的 `0` 也说明，采用备用值没有改变 `missing` 的无值状态。

> [!WARNING]
> `result.value_or(make_fallback())` 即使已经有值，也会调用 `make_fallback()`。如果计算成本较高，或者其中的日志、配置读取等操作只应在缺失时发生，应当使用分支控制调用时机。

对上面的整数例子，`measured ? *measured : default_pressure_kpa()` 只会求值被选中的一侧；也可以用 `if` 分别处理有值与缺失。是否需要分支，取决于备用表达式的成本和行为，而不只是写法长短。

## 缺失策略由当前用途决定

已经通过分支确认有值时，可以直接使用 `*` 或 `->`。若当前接口选择把无值访问作为异常报告，`value()` 提供相应的检查。若业务明确规定缺失时采用某个值，`value_or` 可以直接表达这个选择。

这些操作都不能替代业务含义的判断。采用 `240 kPa` 之后，结果中的一个整数已经无法说明它来自实际测量还是备用设置。若这个区别会影响告警或记录，就应当保留原来的 `optional` 状态，或者在分支中分别处理。

> [!PRACTICE]
> 在真正需要一个确定值、且缺失策略已经明确的位置选择备用值。若“未测量”“字段不存在”等缺失本身需要继续传递，就保留 `optional`；过早填入零、空字符串或其他默认值，会再次丢失引入可选值时希望保留的区别。

## 参考资料

- [C++23 工作草案：optional 的访问、异常检查与备用值](https://timsong-cpp.github.io/cppwp/n4950/optional.observe)
