---
title: 备选项切换与失败状态（Alternative Transitions and Failure State）
date: 2026-10-08
order: 5
---

# 备选项切换与失败状态（Alternative Transitions and Failure State）

将整数结果换成一个复杂对象，需要结束原备选项，再构造新备选项。如果构造抛出异常，“这次操作没有完成”不一定意味着原值还在。

## 无当前值是异常切换产生的状态

`valueless_by_exception()` 判断 variant 是否因异常而没有当前值。在这种状态下，`index()` 返回 `std::variant_npos`，`get_if` 得到空指针，`get` 和 `visit` 抛出 `std::bad_variant_access`。

下面让移动构造明确抛出异常，以显示一项保证会产生该状态的操作：**不同备选项之间的移动赋值**。`emplace<T>(args...)` 销毁当前项并用实参直接构造选定的 `T`；这里先用不抛出的普通构造形成源对象。

`std::runtime_error` 是 `<stdexcept>` 中用于报告运行时失败的异常类型。它的构造实参是诊断文本，`what()` 可以读取这份文本；本例用它表示移动构造失败。

```cpp
#include <iostream>
#include <stdexcept>
#include <utility>
#include <variant>

struct fragile_reading {
    explicit fragile_reading(int value) : pressure_kpa{value} {}
    fragile_reading(const fragile_reading&) = delete;

    fragile_reading(fragile_reading&&) {
        throw std::runtime_error{"move failed"};
    }

    fragile_reading& operator=(fragile_reading&&) = default;
    int pressure_kpa;
};

int main() {
    std::variant<int, fragile_reading> source{0};
    source.emplace<fragile_reading>(220);
    std::variant<int, fragile_reading> target{7};

    try {
        target = std::move(source);
    } catch (const std::runtime_error&) {
        std::cout << target.valueless_by_exception() << '\n'; // 1
    }

    target = 230;
    std::cout << std::get<int>(target) << '\n'; // 230
}
```

目标原来保存整数，操作改为移动构造 `fragile_reading`；移动构造失败后没有新当前值。随后成功赋入整数，可以重新形成正常备选项。

## 不能将一次观察推广成全部异常保证

不同操作的保证不同。某些更换类型的赋值可以先建立临时值，以保留旧项；某些 `emplace` 失败允许进入无当前值状态。不能从“某次抛出后旧值仍在”推出 variant 总有强异常保证，也不能把所有异常都说成必定失去当前值。

同时，“同一备选项的赋值抛出”还要检查那个类型自身的赋值契约。variant 保存着该项，不代表该项的业务状态完全没有改变。

> [!WARNING]
> 无当前值不是自动添加的业务备选项。需要表达“尚未读取”时使用具名状态或 `monostate`；需要处理异常切换失败时，检查操作保证和恢复路径，不能把它静默解释为正常缺失。

## 类型设计影响切换可靠性

备选类型的移动构造是否抛出，会影响切换方式和保证。优先让普通值类型使用已成立的复制、移动和资源成员组合，而不是额外写一份脆弱的移动逻辑。

如果接口的主要含义是成功值与错误值，专用[结果类型](../39-explicit-results-and-error-contracts/01-expected-success-and-error.md#成功与错误是互斥的正常结果)通常更便于说明这两项角色。

## 参考资料

- [C++23 工作草案：variant 赋值](https://timsong-cpp.github.io/cppwp/n4950/variant.assign)
- [C++23 工作草案：variant 修改与访问状态](https://timsong-cpp.github.io/cppwp/n4950/variant.mod)
- [C++23 工作草案：标准异常类型](https://timsong-cpp.github.io/cppwp/n4950/std.exceptions)
