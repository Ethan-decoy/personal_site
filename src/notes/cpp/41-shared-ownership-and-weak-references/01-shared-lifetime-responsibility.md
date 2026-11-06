---
title: 共享生命周期的责任（Shared Lifetime Responsibility）
date: 2026-10-08
order: 1
---

# 共享生命周期的责任（Shared Lifetime Responsibility）

独占拥有者可以将资源转交，却只能有一份销毁责任。当几个独立组件都必须让同一对象继续存活，且无法指定其中某个固定组件负责它的全程生命周期时，才需要共享所有权（Shared Ownership）。

## 多个拥有者共同维持一份对象

`std::shared_ptr<T>` 在 `<memory>` 中表示共享拥有者。复制它增加同一所有权组中的拥有者，不复制目标对象。最后一个共享拥有者释放责任时，所管理对象被销毁。

`std::make_shared<T>(args...)` 构造目标并建立这组责任：

```cpp
#include <iostream>
#include <memory>

struct pressure_source {
    explicit pressure_source(int value) : pressure_kpa{value} {}

    ~pressure_source() {
        std::cout << "destroy " << pressure_kpa << '\n';
    }

    int pressure_kpa;
};

int main() {
    auto first = std::make_shared<pressure_source>(220);
    auto second = first;
    std::cout << first.use_count() << '\n'; // 2
    first.reset();
    std::cout << second->pressure_kpa << '\n'; // 220
    second.reset();                            // destroy 220
}
```

`reset()` 让这个拥有者释放当前责任；其他拥有者仍能维持对象。`use_count()` 返回当前共享拥有者计数，弱引用不计入其中。

这组责任通常由控制块（Control Block）维护，记录拥有关系及销毁方式。复制 shared_ptr 的成本主要是维护这份共享责任，不是复制整个目标；它仍有计数管理和可能的同步成本。

> [!IMPORTANT]
> shared_ptr 共享的是对象的生命周期责任，不是对象的值快照。复制拥有者后，经任一入口修改同一对象，其他入口会观察到该对象的变化。

## 接口只在需要维持寿命时传递责任

读取一个保证在调用期间存活的对象，`const T&` 通常已足够。按值接收 shared_ptr 表示被调用方取得一份共享责任，适合保存到调用结束之后；它不只是“更安全的引用”。

`const shared_ptr<T>` 只限制拥有者对象的改绑，不使目标 `T` 只读。需要只读目标接口时使用 `shared_ptr<const T>`，并审查是否还有其他可修改入口。

## 共享寿命不等于线程安全

不同 shared_ptr 对象可以在标准规定的并发范围内管理同一所有权组。它们指向的对象是否允许同时修改，仍须由该对象的同步契约决定。同一个 shared_ptr 变量被并发读写，也不能仅凭共享计数就保证安全。

`use_count() == 1` 不是可靠的并发排他访问协议，更不证明不存在裸指针、引用或其他非拥有访问。

> [!PRACTICE]
> 先确定谁需要让对象存活到何时。若一个拥有者加借用就能清楚表达责任，维持独占关系；确有独立共同拥有者时再共享，避免为绕开生命周期设计而扩大可修改共享状态。

## 参考资料

- [C++23 工作草案：shared_ptr](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.shared)
