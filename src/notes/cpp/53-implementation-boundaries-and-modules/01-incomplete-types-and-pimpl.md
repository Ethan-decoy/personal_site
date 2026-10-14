---
title: 不完整类型与隐藏表示（Incomplete Types and Hidden Representation）
date: 2026-10-08
order: 1
---

# 不完整类型与隐藏表示（Incomplete Types and Hidden Representation）

头文件需要声明接口，不一定需要公开全部状态表示。私有实现指针（Pointer to Implementation，Pimpl）把实现对象留在源文件，使接口依赖与表示依赖分别组织。

## unique_ptr 可以声明入口，销毁需要完整类型

unique_ptr 可以持有指向不完整类的入口；使用默认删除器实际销毁时，需要满足完整类型要求。因此拥有者的析构和相关重置操作，应在实现类型已经完整的位置定义。

下面三块分别保存为 pressure-store.hpp、pressure-store.cpp、main.cpp，共同组成完整程序。

```cpp
#pragma once
#include <memory>

class pressure_store {
  public:
    pressure_store();
    ~pressure_store();
    pressure_store(const pressure_store&) = delete;
    pressure_store& operator=(const pressure_store&) = delete;
    pressure_store(pressure_store&&) noexcept;
    pressure_store& operator=(pressure_store&&) noexcept;
    int read() const;

  private:
    struct implementation;
    std::unique_ptr<implementation> state;
};
```

```cpp
#include "pressure-store.hpp"

#include <cassert>
#include <memory>

struct pressure_store::implementation {
    int pressure_kpa{220};
};

pressure_store::pressure_store() : state{std::make_unique<implementation>()} {}
pressure_store::~pressure_store() = default;
pressure_store::pressure_store(pressure_store&&) noexcept = default;
pressure_store& pressure_store::operator=(pressure_store&&) noexcept = default;

int pressure_store::read() const {
    assert(state != nullptr);
    return state->pressure_kpa;
}
```

```cpp
#include "pressure-store.hpp"

#include <iostream>

int main() {
    const pressure_store source;
    std::cout << source.read() << '\n'; // 220
}
```

类外先定义嵌套 implementation，再定义相应拥有者操作。read 的前提是有实现对象；移走责任后的对象仍可析构、赋值，但不承诺可直接 read。

## 隐藏表示有真实成本

Pimpl 减少头文件中实现依赖，并可在相应 ABI 条件下减少某些表示变化的影响，但引入动态对象和访问间接性。默认复制被禁止，需要复制语义时必须明确是复制实现值还是共享实现身份。

> [!PRACTICE]
> 对稳定外部接口、实现依赖较重的类型考虑隐藏表示。小值类型若直接成员已经清楚，额外分配和间接访问未必有收益。

## 参考资料

- [C++23 工作草案：unique_ptr 与不完整类型](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr)
- [C++23 工作草案：默认删除器](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.dltr.dflt)
