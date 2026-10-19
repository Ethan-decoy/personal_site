---
title: 原子入口与目标寿命（Atomic Access and Target Lifetime）
date: 2026-10-08
order: 5
---

# 原子入口与目标寿命（Atomic Access and Target Lifetime）

原子地读取一个地址，只证明地址值的相应读取合法，不证明被指对象在稍后的解引用期间仍然存在。入口同步和目标回收是两项责任。

## 原子裸指针不拥有目标

`atomic<T*>` 可以同步指针值；另一线程仍可能在读取后销毁目标。一次 acquire 也不会让对象永久存活，回收协议必须证明没有其他有效访问仍在进行。

地址可能经历 A→B→A；比较再次相同的地址，不证明中间没有换过对象身份。这类 ABA 问题需要按实际算法分析，不能由 CAS 的原子性消除。

## 原子 shared_ptr 同时取得一份责任

`std::atomic<std::shared_ptr<T>>` 是 C++20 起提供的专门形式，需要标准库支持这一特化。load 取得共享拥有者，使相应目标在所保存快照期间维持生命周期。

```cpp
#include <atomic>
#include <iostream>
#include <memory>

int main() {
    std::atomic<std::shared_ptr<const int>> current{};
    current.store(std::make_shared<const int>(220));
    const auto snapshot = current.load();
    current.store(std::make_shared<const int>(230));

    std::cout << *snapshot << ' ' << *current.load() << '\n'; // 220 230
}
```

替换当前入口没有销毁仍由 snapshot 维持的旧值。这里目标是 const int，发布后按不可变快照使用；若目标可修改，仍须另有数据同步。

> [!IMPORTANT]
> 原子拥有者的 load 连接入口读取与取得共享责任。它不统一承诺无锁，不代替目标内部的同步，也不意味着旧目标在 store 当刻必然销毁。

## 参考资料

- [C++23 工作草案：原子 shared_ptr](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.atomic.shared)
