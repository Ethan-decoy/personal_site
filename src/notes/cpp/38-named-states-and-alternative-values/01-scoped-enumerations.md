---
title: 作用域枚举与有限状态（Scoped Enumerations and Finite States）
date: 2026-10-08
order: 1
---

# 作用域枚举与有限状态（Scoped Enumerations and Finite States）

“正在读取”“已完成”“失败”是三种含义不同的状态。用整数 `0`、`1`、`2` 表示它们时，接口只能看到数值，很难判断这个数是否属于状态、次数还是错误码。

## enum class 建立独立的状态类型

枚举（Enumeration）是带有具名常量的独立类型。作用域枚举（Scoped Enumeration）用 `enum class` 声明，枚举项通过 `类型名::枚举项` 使用，不会隐式转成整数。

```cpp
#include <iostream>

enum class read_state { pending, ready, failed };

bool can_read(read_state state) {
    return state == read_state::ready;
}

int main() {
    const read_state state{read_state::ready};
    std::cout << can_read(state) << '\n';              // 1
    std::cout << can_read(read_state::failed) << '\n'; // 0
}
```

`read_state` 与 `int`、其他枚举类型各自独立。`can_read(1)` 编译失败；调用方必须表达一项状态，而不是传入一个恰好具有同样数值的整数。

> [!IMPORTANT]
> 枚举把状态含义放进类型和名称中，能限制无意的整数混用。它不自动验证状态转换是否合法，也不保证所有枚举对象都只取已命名的枚举项。

## 底层数值和业务状态分别判断

每项枚举都具有底层整数值。未指定时，第一项从 `0` 开始，后续项通常递增；作用域枚举默认底层类型为 `int`。也可以明确指定，例如 `enum class read_state : unsigned int`。

对固定底层类型的枚举，类型的可表示值并不限于列出的枚举项。`static_cast<read_state>(99)` 可以得到没有名字的枚举值；它不会自动报告“无效状态”。

外部数据应先验证编码，再形成业务状态。例如这是可独立编译的声明与函数片段：

```cpp
#include <optional>

enum class read_state { pending, ready, failed };

std::optional<read_state> decode_state(int code) {
    switch (code) {
    case 0:
        return read_state::pending;
    case 1:
        return read_state::ready;
    case 2:
        return read_state::failed;
    default:
        return std::nullopt;
    }
}
```

这里显式定义协议编码，不依赖未来调整枚举顺序时数值仍碰巧相同。

## 状态名称不替代状态转换规则

“从 `pending` 可以进入 `ready` 或 `failed`，从 `failed` 是否允许重试”仍然是业务规则，应在操作接口中验证。枚举解决状态身份，类负责维护状态与数据之间的不变式。

当不同状态各自携带不同数据时，单独的枚举加上多个同时存在的成员可能产生矛盾组合；[多种可能值的模型](03-variant-and-active-alternatives.md#一个对象保存当前选中的一种值)可以将状态与相应数据绑定起来。

> [!PRACTICE]
> 有独立含义的有限状态默认使用作用域枚举。只在与既有整数协议协作时明确编码转换，并在边界处验证；不要因为底层是整数就允许接口接收任意数值。

## 参考资料

- [C++23 工作草案：枚举声明与底层类型](https://timsong-cpp.github.io/cppwp/n4950/dcl.enum)
