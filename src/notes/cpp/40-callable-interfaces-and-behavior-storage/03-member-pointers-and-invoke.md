---
title: 成员指针与统一调用（Member Pointers and Unified Invocation）
date: 2026-10-08
order: 3
---

# 成员指针与统一调用（Member Pointers and Unified Invocation）

普通函数指针已经是完整调用入口。非静态成员函数还需要一个对象：同一个 `read` 可以读取不同来源的状态。因此它使用成员指针（Pointer to Member），与普通指针分别建模。

## 成员指针描述操作，对象提供状态

`int (sensor::*)() const` 表示“sensor 的只读无参成员函数，返回 int”的指针类型。`int sensor::*` 表示 sensor 的整数数据成员指针。它们不独立持有某个 sensor。

`std::invoke` 在 `<functional>` 中提供统一调用：普通可调用对象按正常形式调用，成员函数指针额外接收目标对象，数据成员指针则得到对应成员访问。

```cpp
#include <functional>
#include <iostream>

struct sensor {
    int pressure_kpa;

    int read() const {
        return pressure_kpa;
    }
};

using reader = int (sensor::*)() const;

int main() {
    sensor value{220};
    const reader operation = &sensor::read;
    int sensor::* const field = &sensor::pressure_kpa;

    std::cout << (value.*operation)() << '\n';          // 220
    std::cout << std::invoke(operation, value) << '\n'; // 220
    std::invoke(field, value) = 230;
    std::cout << value.read() << '\n'; // 230
}
```

`.*` 将成员指针应用到对象；目标是对象指针时，对应语法是 `->*`。成员函数调用仍要跟随参数列表。

本例 `field` 自身是只读指针对象，它指向的成员类型是 `int`，所以通过非 const 的 `value` 取得的成员访问仍可修改。若目标对象是 const，得到的访问也受它的只读限制。

## 统一形式不会改变调用关系

`std::invoke` 可以接受对象、相应对象指针以及引用包装器等支持的入口，但不会因此取得对象所有权。目标必须在访问期间存活，成员指针也不能是空值。

对虚成员函数的调用仍遵循虚分派；对于普通成员函数则按所指定操作执行。invoke 统一写法，不把所有调用都变成运行时多态。

> [!PRACTICE]
> 泛型工具需要同时接受普通函数对象和成员操作时，invoke 可以集中处理调用形式。普通业务代码直接调用 `object.read()` 已足够清楚时，不必改成更间接的成员指针接口。

## 参考资料

- [C++23 工作草案：成员指针运算](https://timsong-cpp.github.io/cppwp/n4950/expr.mptr.oper)
- [C++23 工作草案：INVOKE 与 invoke](https://timsong-cpp.github.io/cppwp/n4950/func.invoke)
