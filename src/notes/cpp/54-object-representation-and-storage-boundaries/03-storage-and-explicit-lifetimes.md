---
title: 存储与显式对象生命周期（Storage and Explicit Object Lifetimes）
date: 2026-10-08
order: 3
---

# 存储与显式对象生命周期（Storage and Explicit Object Lifetimes）

取得足够空间与构造一个对象是两项动作。普通变量、容器和 RAII 将它们连接起来；底层工具有时需要显式管理这段边界。

## construct_at 建立对象，destroy_at 结束对象

`std::construct_at` 与 `std::destroy_at` 位于 `<memory>`。前者在合法地址构造对象并返回目标指针，后者调用相应销毁操作，不负责释放外层存储。

下面是机制示例。alignas 为存储提供 reading 所需对齐；应用代码通常直接使用对象或拥有型容器。

```cpp
#include <cstddef>
#include <iostream>
#include <memory>

struct reading {
    explicit reading(int value) : pressure_kpa{value} {}
    ~reading() {
        std::cout << "destroy " << pressure_kpa << '\n';
    }
    int pressure_kpa;
};

int main() {
    alignas(reading) std::byte storage[sizeof(reading)];
    reading* const value{std::construct_at(reinterpret_cast<reading*>(storage), 220)};
    std::cout << value->pressure_kpa << '\n'; // 220
    std::destroy_at(value);                   // destroy 220
}
```

返回指针指向已经开始生命周期的 reading。destroy 后存储仍在，但不能继续读取该 reading。外层字节数组不会替手动构造的对象自动履行析构责任。

## 重用地址不代表同一对象持续存在

在同一存储重建对象，需要满足大小、对齐与生命周期条件。旧入口能否自动指向新对象受透明替换（Transparent Replacement）规则约束，基类或潜在重叠子对象等情形不能一律套用。

`std::launder` 可以在满足前提时取得指向已有对象的合适入口，不能凭空创建对象、修复不足对齐或恢复已释放存储。

> [!IMPORTANT]
> 底层资源有取得存储、构造、销毁和释放四项责任。异常路径也须保持匹配；局部机制示例不意味着应用接口应普遍手写这套流程。

## 参考资料

- [C++23 工作草案：对象生命周期与替换](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：construct_at](https://timsong-cpp.github.io/cppwp/n4950/specialized.construct)
- [C++23 工作草案：destroy_at](https://timsong-cpp.github.io/cppwp/n4950/specialized.destroy)
