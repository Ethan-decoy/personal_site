---
title: 结果值与资源所有权（Result Values and Resource Ownership）
date: 2026-10-08
order: 2
---

# 结果值与资源所有权（Result Values and Resource Ownership）

expected 是保存结果的对象。它是否能复制、是否拥有资源、借用能保持多久，仍然由成功类型和错误类型决定，不能从“包装器”三个字推出一个共同答案。

## 成功值可以是独占拥有者

下面的接口成功时创建并返回独占的压力来源，失败时返回错误。调用方先判断状态，再使用拥有者指向的对象。

```cpp
#include <expected>
#include <iostream>
#include <memory>
#include <utility>

struct pressure_source {
    explicit pressure_source(int value) : pressure_kpa{value} {}
    int pressure_kpa;
};

enum class source_error { invalid_setting };

std::expected<std::unique_ptr<pressure_source>, source_error> make_source(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{source_error::invalid_setting};
    }
    return std::make_unique<pressure_source>(value);
}

int main() {
    auto result = make_source(220);
    if (!result) {
        return 1;
    }

    auto owner = std::move(*result);
    std::cout << owner->pressure_kpa << '\n';  // 220
    std::cout << result.has_value() << '\n';   // 1
    std::cout << (*result == nullptr) << '\n'; // 1
}
```

`*result` 是其中的 `unique_ptr`；`std::move(*result)` 使它参与移动初始化。转移之后，result 仍然是**成功状态**，其中的拥有者变为空。移动值不自动把成功结果改成错误。

本例 result 不能普通复制，因为其成功值不能复制。若成功类型和错误类型都满足相应复制要求，expected 才具有相应复制能力。

> [!WARNING]
> 成功状态只证明当前存在一个 `T` 对象，不证明那个对象满足所有业务条件。成功的 expected 可以保存空指针、空容器或移动后的值，须按 `T` 自身的契约继续判断。

## 没有成功数据可以使用 void

有些操作只报告成功或失败，不需要返回额外数据。`std::expected<void, E>` 为此提供成功状态；默认构造的 `{}` 表示成功，不创建一份 `void` 数据。

这是独立的声明与函数片段：

```cpp
#include <expected>

enum class setting_error { out_of_range };

std::expected<void, setting_error> validate_pressure(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{setting_error::out_of_range};
    }
    return {};
}
```

这种返回类型比“返回 bool，再通过其他位置写错误码”更容易保持一次操作的结果完整性。

## 返回借用不会延长目标生命周期

expected 的成功类型不能是引用类型；如果返回指针或视图，它保存的是访问入口，不会因此拥有目标。例如成功保存 `string_view` 仍然需要目标字符在调用方使用期间存活，并且未因修改而失效。

赋值切换成功与错误状态时，原状态中的对象可能被销毁。指向那份对象的访问入口不能跨状态切换继续使用。

## 参考资料

- [C++23 工作草案：expected 的对象模型与构造](https://timsong-cpp.github.io/cppwp/n4950/expected.object.general)
- [C++23 工作草案：void 成功类型](https://timsong-cpp.github.io/cppwp/n4950/expected.void)
