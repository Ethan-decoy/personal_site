---
title: 暂停状态与销毁责任（Suspended State and Destruction Responsibility）
date: 2026-10-08
order: 2
---

# 暂停状态与销毁责任（Suspended State and Destruction Responsibility）

协程暂停后，已构造局部对象仍可能存在。暂停状态需要拥有者；放弃继续执行时，也必须结束这些对象的生命周期。

## 析构暂停状态会销毁已构造对象

协程状态（Coroutine State，常称协程帧）保存跨暂停点仍需的参数、局部状态和协议对象。它可能需要动态分配，也可能按实现条件消去分配，不能统一宣称“协程一定没有堆成本”。

```cpp
#include <generator>
#include <iostream>

struct resource_trace {
    ~resource_trace() {
        std::cout << "released\n";
    }
};

std::generator<int> readings() {
    resource_trace resource;
    co_yield 220;
    std::cout << "completed\n";
}

int main() {
    {
        auto source = readings();
        auto position = source.begin();
        std::cout << *position << '\n'; // 220
    } // released；没有执行 completed
}
```

销毁 generator 结束暂停状态，销毁已经存在的 resource。它不会为了清理而自动把余下函数体完整跑完；清理责任应放在 RAII 中。

## 参数和捕获仍有不同拥有关系

按值参数形成协程状态中的相应对象；引用、指针和视图参数仍然借用外部目标。调用返回一个状态对象，不让被借用实参自动活到最终恢复时。

协程 Lambda 的捕获通常位于闭包对象中。闭包先销毁而协程以后继续访问捕获，会失效；“按值捕获”不等于捕获自动独立搬进协程帧。将所需值作为明确的按值协程参数传入，通常更容易证明寿命。

> [!WARNING]
> 生命周期要覆盖最后一次恢复或状态销毁。函数已经返回、对象曾在创建时存活，都不足以证明跨暂停借用有效。

## 参考资料

- [C++23 工作草案：协程状态与销毁](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.coroutine)
- [C++23 工作草案：generator 生命周期](https://timsong-cpp.github.io/cppwp/n4950/coro.generator)
