---
title: 仅移动的可调用包装器（Move-Only Callable Wrappers）
date: 2026-10-08
order: 5
---

# 仅移动的可调用包装器（Move-Only Callable Wrappers）

一项后台操作可能独占持有资源。它能把资源转移给另一个任务，却不能复制成两个拥有者。包装器的能力应当保持这种关系。

## move_only_function 不要求目标可复制

`std::move_only_function` 是 C++23 在 `<functional>` 中提供的可调用包装器。它可以保存符合签名的仅移动目标；包装器本身不能复制，可以移动。

下面通过 Lambda 的捕获初始化将独占拥有者移入闭包，再将闭包移入包装器。

```cpp
#include <functional>
#include <iostream>
#include <memory>
#include <utility>

int main() {
    auto owner = std::make_unique<int>(220);
    auto read = [resource = std::move(owner)]() { return *resource; };

    std::move_only_function<int()> operation = std::move(read);
    auto transferred = std::move(operation);
    if (transferred) {
        std::cout << transferred() << '\n'; // 220
    }
}
```

资源的拥有关系沿移动链传递，没有复制所指整数作为另一份资源。最后包装器销毁时，其闭包成员负责销毁资源。

## 签名还能表达调用限定

与 function 相比，move_only_function 的签名可以表达 `const`、引用限定和 `noexcept`，例如 `std::move_only_function<int() const>` 要求目标能从相应只读访问调用。

引用限定符（Ref-Qualifier）区分通过哪种值类别的对象调用成员：签名中的 `&` 要求左值包装器，`&&` 要求右值包装器。例如 `std::move_only_function<int() &&>` 使用 `std::move(operation)()` 满足调用入口；这次调用本身不等于把包装器移动给另一个拥有者。

这些限定限制“怎样调用目标”，不自动限制目标经指针访问的外部对象。`noexcept` 签名则要求相应调用满足不抛出关系。

> [!WARNING]
> 调用空 move_only_function 违反其调用前提。它没有 function 那项“空调用抛出 bad_function_call”的保证；不能把两种包装器的失败契约混为一谈。

移动后的对象只按该设施保证的有效状态继续使用；不要将 source 的内容或剩余业务能力作为调度逻辑前提。需要调用时先检查目标是否存在。

> [!PRACTICE]
> 操作携带独占资源、或接口本来禁止复制任务时，移动包装器可以让类型契约保持一致。需要共享一份任务状态与允许复制任务是两项不同选择，不应为满足 function 而无条件改用共享所有权。

## 参考资料

- [C++23 工作草案：move_only_function](https://timsong-cpp.github.io/cppwp/n4950/func.wrap.move)
- [C++23 工作草案：移动包装器调用前提](https://timsong-cpp.github.io/cppwp/n4950/func.wrap.move.inv)
