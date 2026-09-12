---
title: 移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）
date: 2026-09-05
order: 4
---

# 移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）

移动构造的目标是一个正在初始化的新对象。移动赋值（move assignment）的目标则已经存在，而且可能正在负责另一项登记。如果只把源指针写入目标成员，目标原来承担的登记责任就会丢失，没有对象再负责结束它。

## 结束旧责任，再接收新责任

移动赋值运算符（move assignment operator）的常见形式是 `T& operator=(T&& source)`。它修改已有对象，通常返回目标对象的左值引用，保持赋值表达式可以继续表示目标的语义。

沿用[移动构造中的 `registration` 定义](03-move-construction-and-resource-transfer.md#让源对象能够处于无责任状态)：`counter` 非空表示承担一次解除登记的责任，为空表示没有责任。为允许这两种状态的对象接收另一项责任，在类定义的 `public` 部分增加以下声明：

```cpp
registration& operator=(registration&& source);
```

然后在类定义之后给出函数定义：

```cpp
registration& registration::operator=(registration&& source) {
    if (this != &source) {
        if (counter != nullptr) {
            --(*counter);
        }

        counter = source.counter;
        source.counter = nullptr;
    }

    return *this;
}
```

当源对象与目标对象不同时，这个操作先解除目标原有的登记，再接收源对象的登记，最后将源对象设为空。整个过程中，目标对象没有销毁或重新构造；它的身份保持不变，改变的是它承担的责任。

使用上述类和移动赋值定义，并包含 `<iostream>` 与 `<utility>`，可以运行下面的 `main`：

```cpp
int main() {
    int front_count{0};
    int rear_count{0};

    {
        registration target{front_count};
        registration source{rear_count};

        target = std::move(source);

        std::cout << front_count << ' ' << rear_count << '\n';
        std::cout << target.is_active() << ' ' << source.is_active() << '\n';
    }

    std::cout << front_count << ' ' << rear_count << '\n';
}
```

两个对象构造完成后，前后两项计数各为 `1`。赋值先结束目标的前轮登记，使前轮计数变为 `0`；后轮登记只是更换责任承担者，计数仍为 `1`。因此前两行输出分别是 `0 1` 和 `1 0`。

离开作用域时，源对象为空，不解除登记；目标对象解除接收到的后轮登记。最后一行输出 `0 0`。

## 自移动需要保住同一份责任

源对象和目标对象可能通过不同名称表示同一个对象。在上面 `target` 仍然存活的内层代码块中，可以出现这样的调用：

```cpp
registration& alias{target};
target = std::move(alias);
```

这称为自移动赋值（self-move assignment）。如果无条件先解除目标登记，就会同时解除源对象唯一持有的那项登记；随后的指针写入与清空无法凭空恢复已经结束的责任。

`this != &source` 比较的是两个类对象的身份。它让当前实现对自移动保持原状，不改变登记数量，也不改变活动状态。这是该类型选择的明确行为，不是语言自动补上的保护。

不能把这项检查换成“两个成员指针是否相等”。两个不同的登记对象可以指向同一个活动计数，各自代表一次已经递增的登记；将其中一个移动赋值给另一个时，仍然需要解除目标原来的那一次登记，使总数从 `2` 变成 `1`。

## 空状态也参与赋值

如果目标为空而源对象处于活动状态，移动赋值直接接收责任，没有旧登记需要解除。如果源对象为空而目标处于活动状态，目标结束旧登记后变为空；两边都为空时，赋值后仍然都为空。

这些行为使移动后的对象可以再次接收新责任。空状态不是一种必须躲开所有成员函数的损坏状态，而是当前接口明确支持的状态。

> 对于本篇直接承担登记责任的类型，移动赋值需要同时满足目标旧责任的结束、源责任的交接，以及双方操作后状态的有效性。只完成指针赋值，不能构成正确的责任转移。

## 参考资料

- [C++23 工作草案：复制与移动赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++ Core Guidelines：移动赋值应安全处理自赋值](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-move-self)
