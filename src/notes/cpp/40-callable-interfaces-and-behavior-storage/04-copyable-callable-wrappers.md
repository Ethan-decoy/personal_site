---
title: 可复制的可调用包装器（Copyable Callable Wrappers）
date: 2026-10-08
order: 4
---

# 可复制的可调用包装器（Copyable Callable Wrappers）

运行时选择的回调可能是普通函数，也可能是捕获了状态的 Lambda。具体类型不同，却都需要同一种调用接口。`std::function` 用固定签名保存这样的目标。

## 固定签名保存不同目标

`std::function<int(int)>` 在 `<functional>` 中表示“接收 int、返回 int”的可调用包装器（Callable Wrapper）。包装器拥有其存入的目标对象，用调用运算符执行目标；目标不必具有相同的具体类型。

```cpp
#include <functional>
#include <iostream>

int unchanged(int value) {
    return value;
}

int main() {
    std::function<int(int)> operation = unchanged;
    std::cout << operation(220) << '\n'; // 220

    operation = [offset = 10](int value) { return value + offset; };
    std::cout << operation(220) << '\n'; // 230

    std::function<int()> next = [value = 220]() mutable { return value++; };
    auto copied = next;
    std::cout << next() << ' ' << copied() << ' ' << next() << '\n'; // 220 220 221
}
```

Lambda 的捕获初始化为目标形成状态。复制 `next` 会复制闭包对象，所以本例两个计数器分别从 `220` 开始。若捕获内容是指针、引用或共享拥有者，复制那些成员仍然保留相应的共享关系，不会把它们访问的所有对象也复制一遍。

这种以统一接口保存不同具体类型的做法称为类型擦除（Type Erasure）。使用它不要求先实现内部调度结构，但应知道调用和存储可能引入间接性与分配成本。

## 空状态与复制要求是接口契约

默认构造的 function 没有目标。条件判断或 `operator bool` 检查目标是否存在；调用空 function 抛出 `std::bad_function_call`。

目标须满足相应调用签名，并且可复制。捕获了独占拥有者而不能复制的闭包，不能因为“我只打算调用一次”就放入 function；包装器的复制能力是类型接口的一部分。

`const std::function` 的调用运算符仍可执行具有可变状态的目标。包装器 const 并不等于捕获状态和外部对象都不会改变，也不提供线程安全。

> [!WARNING]
> 拥有闭包对象不等于拥有闭包借用的目标。保存引用捕获的 Lambda 后，外部局部变量退出作用域，包装器仍然存在也无法使引用恢复有效。

## 返回引用必须真的来自存活对象

`std::function<const int&()>` 要求能提供相应引用结果。C++23 拒绝直接由只返回临时整数的目标构造这种包装器；但一个内部本来就错误地返回悬空引用的函数，仍不能由包装器自动修复。

> [!PRACTICE]
> 需要稳定、可复制的运行时回调类型时使用 function。调用方保持具体类型、无需长期保存时，模板可以避免不必要的擦除；目标只有移动能力时，应选择相应的移动包装器。

## 参考资料

- [C++23 工作草案：function](https://timsong-cpp.github.io/cppwp/n4950/func.wrap.func)
