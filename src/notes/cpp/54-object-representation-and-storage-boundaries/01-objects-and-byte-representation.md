---
title: 对象与字节表示（Objects and Byte Representation）
date: 2026-10-08
order: 1
---

# 对象与字节表示（Objects and Byte Representation）

类型解释对象能怎样使用；存储中的字节描述对象如何表示。能够观察字节，不意味着能把任意字节解释成另一个类型的对象。

## 对象表示不等于业务格式

对象表示（Object Representation）是对象所占存储的字节序列；值表示（Value Representation）是其中参与表示值的位。填充（Padding）不一定参与值表示，也不应作为稳定业务数据。

`std::byte` 位于 `<cstddef>`，用于表达原始字节。`std::as_bytes` 位于 `<span>`，形成相应对象范围的只读字节视图。

```cpp
#include <cstddef>
#include <iostream>
#include <span>

int main() {
    int value{220};
    const auto bytes = std::as_bytes(std::span{&value, 1});
    std::cout << (bytes.size() == sizeof(value)) << '\n'; // 1
}
```

字节视图仍借用 value，不复制它，也不延长寿命。C++ 的一个字节是 char 的存储单位，不能跨实现无条件假定总为八位。

## 相同值不保证所有字节相同

填充、布局、字节序及指针表示受实现条件影响。不能将任意类对象的原始表示直接保存成跨版本文件格式，也不能用全部字节相等代替类型的业务相等。

即使类成员当前全是整数，加入成员、改变工具链或平台，都可能改变对象表示。协议应明确字段及编码，而不是把当前 sizeof 当作长期格式。

> [!IMPORTANT]
> 字节访问是存储视角，类型访问是对象语义。观察或复制字节必须保留类型、生命周期与表示有效性条件，不能绕过构造和接口不变式。

## 参考资料

- [C++23 工作草案：对象与值表示](https://timsong-cpp.github.io/cppwp/n4950/basic.types)
- [C++23 工作草案：字节视图](https://timsong-cpp.github.io/cppwp/n4950/span.objectrep)
