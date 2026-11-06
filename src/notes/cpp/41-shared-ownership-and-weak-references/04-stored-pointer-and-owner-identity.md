---
title: 访问指针与所有权身份（Stored Pointer and Ownership Identity）
date: 2026-10-08
order: 4
---

# 访问指针与所有权身份（Stored Pointer and Ownership Identity）

shared_ptr 一般访问它所管理的对象，但“当前访问哪个地址”和“维持哪份销毁责任”可以不同。区分这两项，才能理解子对象共享入口，以及为什么不能从裸地址重复创建拥有者。

## 别名构造共享责任而改变访问入口

别名构造（Aliasing Construction）`shared_ptr<T>(owner, pointer)` 与 owner 共享所有权，却将 `pointer` 作为解引用和 `get()` 返回的访问入口。

```cpp
#include <iostream>
#include <memory>

struct reading {
    reading(int pressure, int count) : pressure_kpa{pressure}, sample_count{count} {}
    int pressure_kpa;
    int sample_count;
};

int main() {
    auto owner = std::make_shared<reading>(220, 3);
    std::shared_ptr<int> pressure{owner, &owner->pressure_kpa};

    owner.reset();
    std::cout << *pressure << '\n'; // 220，reading 仍被共同责任维持
    pressure.reset();               // 最后责任释放，销毁的是完整 reading
}
```

pressure 访问整数成员，最后释放时维护的是完整 reading 的销毁责任，不是对那个成员单独执行删除。

这一构造要求提供的访问目标在使用期间有效。库不会检查 pointer 是否真的是 owner 所维持对象中的成员；若提供一个无关短寿命地址，所有权计数也救不了借用。

## 相同地址不证明相同所有权组

将 `first.get()` 再传给一个新的 `shared_ptr<T>` 裸指针构造，会建立另一组独立销毁责任，而不是找到并加入 first 的控制块。两组都尝试销毁同一资源会违反销毁契约。

> [!WARNING]
> 取得 get() 是取得访问指针，不是取得可重新声明的拥有权。已有拥有者应通过复制、移动或符合语义的别名构造传递责任；不能从裸地址重新制造另一份责任。

同样，从 `this` 直接构造新的 shared_ptr 不会自动接入对象已有的所有权组。[从对象取得自身共享责任](05-shared-self-and-callbacks.md#shared_from_this加入已经存在的所有权组)需要专门的关联。

## 参考资料

- [C++23 工作草案：shared_ptr 构造](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.shared.const)
