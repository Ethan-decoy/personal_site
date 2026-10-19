---
title: 行为借用与有效期（Borrowed Callables and Lifetimes）
date: 2026-10-08
order: 6
---

# 行为借用与有效期（Borrowed Callables and Lifetimes）

包装器可以拥有一份行为对象，也可以保存对外部行为的访问入口。这两种形式在复制后看起来都能调用，但状态身份和有效期不同。

## ref 明确保留外部对象身份

`std::ref(object)` 在 `<functional>` 中创建 `std::reference_wrapper`，它是可复制的引用包装器，保存对现有对象的借用。`std::cref` 对应只读借用。

下面把引用包装器存入 function。复制 function 复制的是借用入口，不是外部计数器。

```cpp
#include <functional>
#include <iostream>

struct next_reading {
    int value{220};

    int operator()() {
        return value++;
    }
};

int main() {
    next_reading source{};
    std::function<int()> first = std::ref(source);
    auto second = first;

    std::cout << first() << ' ' << second() << ' ' << source() << '\n'; // 220 221 222
}
```

三次调用都修改同一个 `source`。若直接使用 `first = source` 初始化，则存入的是 source 的副本，复制包装器也形成另一份目标副本。

> [!IMPORTANT]
> 复制可调用包装器是否形成独立状态，取决于存入目标怎样表达身份。引用包装器和引用捕获都保留借用关系，包装器寿命不会延长被借用对象的寿命。

## 延迟执行要按执行时刻审查借用

“创建回调时对象还在”不足以保证“执行回调时对象还在”。保存回调、返回回调或把它交给别的执行线程，都可能使执行越过局部变量的生命周期。

捕获 `this` 通常保存当前对象的访问入口，并不复制整个对象，也不自动让该对象存活。需要独立快照时应明确复制所需值；需要共同维持对象生命周期时，接口须采用已成立的共享拥有关系。

这里不能机械地改成“全部按值捕获”：复制一个指针或视图仍然只是复制借用入口；复制大对象还可能改变成本与业务时效。

## 选择入口时同时考虑能力与责任

| 需求 | 常用接口起点 |
| --- | --- |
| 无捕获状态的普通函数入口 | 函数指针 |
| 当前调用，具体目标类型可保留 | 受约束的模板 |
| 保存可复制的不同目标 | function |
| 保存仅移动的不同目标 | move_only_function |
| 明确借用已有行为对象 | 引用或 reference_wrapper，配合有效期契约 |

> [!PRACTICE]
> 回调接口同时说明签名、是否保存、是否复制以及何时调用。调用次数、重入和并发要求也属于契约，不能由“可调用”这个概念自动推导。

## 参考资料

- [C++23 工作草案：reference_wrapper](https://timsong-cpp.github.io/cppwp/n4950/refwrap)
- [C++23 工作草案：Lambda 捕获](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.capture)
