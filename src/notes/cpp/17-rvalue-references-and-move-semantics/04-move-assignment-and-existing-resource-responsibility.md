---
title: 移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）
date: 2026-09-05
order: 4
---

# 移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）

移动构造初始化新对象。移动赋值（move assignment）更新已有对象。假设目标负责前轮登记，源负责后轮登记。如果直接用后轮的计数指针覆盖前轮的指针，前轮登记就会漏掉一次解除。

> [!IMPORTANT] 移动赋值更新已有对象的资源责任
> **移动赋值要处理目标原有的资源责任，并让源与目标都处于类型约定的有效状态。**本例中，对两个不同的登记对象赋值时，目标有旧登记才解除，源有登记才转交。目标保留自己的身份，源进入空状态。

## 结束旧责任，再接收新责任

移动赋值运算符（move assignment operator）的常见形式是 `T& operator=(T&& source)`。它修改已有对象，通常返回目标对象的左值引用，保持赋值表达式可以继续表示目标的语义。

`registration` 的 `counter` 借用调用方的计数对象。指针非空时，对象承担一次解除登记的责任。指针为空时，对象没有登记需要解除。类型定义见[前篇的登记示例](03-move-construction-and-resource-transfer.md#让源对象能够处于无责任状态)。

在两个不同对象之间交接时，目标原有登记所借用的计数必须活到赋值时解除旧登记。转交的登记继续借用源对象原先的计数，该计数必须存活到最终承担者解除这项登记。

在前篇第一个程序的 `registration` 类中，把下面的声明放在 `public` 部分已删除的复制赋值声明之后。

```cpp
registration& operator=(registration&& source);
```

在类定义之后、`main` 之前放置下面的函数定义。

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

对不同的源与目标，如果目标有旧登记，先递减它借用的计数以解除登记。接下来，目标取得源的 `counter`，源的指针被清空。接收的指针为空时，目标也进入空状态。`return *this` 让赋值表达式仍然指代目标对象。

保留 `<iostream>`、`<utility>`、补充后的类定义和移动赋值定义，用下面的 `main` 替换前篇程序中的 `main`。

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

`front_count` 和 `rear_count` 都在两个登记对象的外层作用域。赋值时，`front_count` 仍然有效，可以递减它来解除前轮登记。接手后轮登记时，`rear_count` 仍为 `1`，并且存活到目标析构并递减它之后。

| 时点 | `target` 负责的登记 | `source` 负责的登记 | `front_count` | `rear_count` |
| --- | --- | --- | ---: | ---: |
| 两个对象构造后 | 前轮 | 后轮 | 1 | 1 |
| 移动赋值后 | 后轮 | 无，处于空状态 | 0 | 1 |
| 离开内层作用域后 | 对象已销毁 | 对象已销毁 | 0 | 0 |

因此，赋值后的计数输出是 `0 1`，按 `target`、`source` 排列的活动状态是 `1 0`。离开内层作用域时，空的源对象不解除登记，目标对象解除后轮登记，最后输出 `0 0`。

## 本例自移动时保留原登记

在上面的 `target = std::move(source);` 之后、第一条输出语句之前插入下面两行。此时 `target` 承担后轮登记。

```cpp
registration& alias{target};
target = std::move(alias);
```

`alias` 绑定到 `target`，因此这次赋值的源与目标是同一个对象，称为自移动赋值（self-move assignment）。如果同一个对象也走解除并交接的流程，第一步就会解除它持有的后轮登记。

`this != &source` 通过对象地址判断源与目标是否相同。自移动时，函数跳过交接并返回原对象，让 `target` 继续承担后轮登记。因此插入两行后，三行输出仍然是 `0 1`、`1 0`、`0 0`。保留原登记是 `registration` 的约定。

两个不同的登记对象也可以借用同一个计数，各自代表一次已经递增的登记。此时对它们执行移动赋值，仍要解除目标原来的登记，使计数从 `2` 降到 `1`。如果根据计数指针相等来判定自移动，就会错误跳过这次交接。

## 空状态也参与赋值

对两个不同的对象赋值时，如果目标为空而源处于活动状态，目标直接接收登记。如果源为空而目标处于活动状态，目标解除旧登记后变为空。两边都为空时，赋值后仍然都为空。

空状态符合 `registration` 的类不变式。移后处于空状态的对象可以再次通过赋值接收登记。

## 参考资料

- [C++23 工作草案：复制与移动赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++ Core Guidelines：移动赋值应安全处理自移动](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-move-self)
