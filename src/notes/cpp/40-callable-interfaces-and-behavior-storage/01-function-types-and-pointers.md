---
title: 函数类型与函数指针（Function Types and Function Pointers）
date: 2026-10-08
order: 1
---

# 函数类型与函数指针（Function Types and Function Pointers）

一个函数可以接收数据，也可以接收“怎样处理数据”。函数指针（Function Pointer）提供一种直接入口：保存某个函数的调用地址，用同一签名调用不同函数。

## 先读函数类型，再读指针

函数类型（Function Type）包含返回类型、形参类型和有关限定。`using reader = int(int);` 为“接收一个整数并返回整数的函数类型”命名；`reader*` 才是指向这种函数的指针。

```cpp
#include <iostream>

using reader = int(int);

int unchanged(int value) {
    return value;
}

int calibrated(int value) {
    return value + 10;
}

int apply(int value, reader* operation) {
    return operation(value);
}

int main() {
    reader* operation = &unchanged;
    std::cout << apply(220, operation) << '\n'; // 220
    operation = &calibrated;
    std::cout << apply(220, operation) << '\n'; // 230
}
```

`operation(value)` 经函数指针调用，也可以写成 `(*operation)(value)`。函数名在相应语境中可以转换为函数指针，因此 `operation = calibrated;` 也成立。

本例的 `apply` 要求非空函数入口。函数指针可以为 `nullptr`，通过空指针调用没有合法目标；若允许缺失行为，接口需要先检查并定义缺失时的处理。

> [!IMPORTANT]
> 函数指针保存调用入口，不保存每次调用的局部变量，也不附带一份捕获状态。签名兼容与目标非空分别决定能否安全调用。

## 类型相似不代表调用签名相同

`int(double)` 与 `int(int)` 是不同函数类型。即使两种调用中整数和浮点数有隐式转换，也不能因此随意改写函数指针类型。

`noexcept` 也是函数类型的一部分：指向不抛出函数的指针可以转换成允许抛出的对应函数指针；反向转换不能凭希望成立。实际函数的异常承诺仍必须真实。

重载函数名需要结合目标指针类型选择具体重载。若目标类型仍不能唯一确定，取地址也会编译失败。

## Lambda 的状态决定能否用函数指针承载

没有捕获的普通 Lambda 可以在相应签名要求下转换成函数指针。捕获了修正量的 Lambda 同时需要入口和状态，不能用一份普通函数指针完整表示。

具体类型已知且只需当前调用时，模板形参可以直接接收函数对象。需要在运行时替换并保存不同类型的行为时，则要建立[可调用包装器](04-copyable-callable-wrappers.md#固定签名保存不同目标)。

## 参考资料

- [C++23 工作草案：函数声明与函数类型](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数到指针转换](https://timsong-cpp.github.io/cppwp/n4950/conv.func)
- [C++23 工作草案：Lambda 闭包转换](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.closure)
