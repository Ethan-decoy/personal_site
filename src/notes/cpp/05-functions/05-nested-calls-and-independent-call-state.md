---
title: 嵌套调用与独立调用状态（Nested Calls and Independent Call State）
date: 2026-08-27
---

# 嵌套调用与独立调用状态（Nested Calls and Independent Call State）

函数体中可以继续调用其他函数。外层调用尚未完成时，执行过程进入内层调用；内层调用正常完成后，再回到原来的调用位置继续执行。由此，程序中可以同时存在多次尚未结束的调用。

## 调用可以发生在另一次调用中

下面两个函数把一次计算拆成两层：

```cpp
int calculate_pressure_with_margin_kpa(int pressure_kpa) {
    int safety_margin_kpa{5};
    return pressure_kpa + safety_margin_kpa;
}

int calculate_operating_pressure_kpa(int pressure_kpa) {
    int pressure_with_margin_kpa{calculate_pressure_with_margin_kpa(pressure_kpa)};

    return pressure_with_margin_kpa + 10;
}
```

执行下面的调用时：

```cpp
int operating_pressure_kpa{calculate_operating_pressure_kpa(200)};
```

执行关系依次是：

1. 外层调用创建自己的形参 `pressure_kpa`，值为 `200`；
2. 外层函数调用 `calculate_pressure_with_margin_kpa`；
3. 内层调用创建另一份形参 `pressure_kpa`，值同样为 `200`；
4. 内层调用创建 `safety_margin_kpa`，并产生结果 `205`；
5. 内层调用结束，外层调用用结果初始化 `pressure_with_margin_kpa`；
6. 外层调用继续执行，并产生最终结果 `215`。

内层函数执行期间，外层函数只是暂停在调用表达式中。外层形参还没有离开作用域，已经创建的局部对象也会继续存在。

## 独立的是调用状态

函数定义只有一份，但每次正在进行的调用都有自己的形参，以及本次进入代码块时创建的普通自动存储期局部对象。

前面的嵌套调用中，外层与内层都拥有名为 `pressure_kpa` 的形参，但它们属于不同调用。内层形参的创建和销毁不会替换外层形参；控制回到外层后，外层仍能继续读取自己的对象。

外层和内层即使执行同一个函数，各自的形参与普通局部对象仍属于不同调用。**同一个函数的代码可以被多次执行；彼此独立的是各次调用中的状态，而不是函数定义本身。**

## 函数可以调用自身

函数直接调用自身称为递归（recursion）。函数名在进入函数体之前已经完成声明，因此这种递归调用不需要额外的前向声明。每次递归调用仍然遵循普通调用规则，并创建属于这一层调用的状态：

```cpp
int sum_remaining_steps(int remaining_steps) {
    if (remaining_steps <= 0) {
        return 0;
    }

    return remaining_steps + sum_remaining_steps(remaining_steps - 1);
}
```

调用 `sum_remaining_steps(3)` 时，最外层结果依赖 `sum_remaining_steps(2)`，后者又依赖 `sum_remaining_steps(1)`，直到 `sum_remaining_steps(0)` 直接返回 `0`。

随后，各层尚未完成的加法按调用关系逐层得到结果：

```text
sum_remaining_steps(0) -> 0
sum_remaining_steps(1) -> 1 + 0 = 1
sum_remaining_steps(2) -> 2 + 1 = 3
sum_remaining_steps(3) -> 3 + 3 = 6
```

四次调用分别拥有值为 `3`、`2`、`1` 和 `0` 的形参对象。内层调用结束不会覆盖外层形参；控制回到外层后，外层仍然能够使用自己的 `remaining_steps`。

## 递归必须能够停止继续调用

上例中的 `remaining_steps <= 0` 是终止条件。它让某一层调用不再产生新的递归调用，而是直接返回确定结果；外层调用才有机会逐层完成。

下面的函数没有任何能够正常返回的执行路径：

```cpp
int repeat_without_progress(int remaining_steps) {
    return repeat_without_progress(remaining_steps);
}
```

每一层都会再次进行完全相同的调用。C++ 不会自动替递归推导终止条件，也不保证这种程序以某种固定异常或诊断结束。

递归深度还会受到实现可用资源限制。语言没有规定可移植的最大递归层数，也没有规定资源耗尽时统一产生某个可捕获异常。**可靠的递归不仅需要写出终止条件，还需要保证输入沿实际执行路径持续接近这个条件。**

本篇描述的是 C++ 语义上的嵌套调用关系。实现通常怎样保存尚未完成的调用，可继续参阅附章[调用栈与栈帧](deep-dives/01-call-stack-and-stack-frames.md)。

相关语言规则可参阅 C++23 工作草案中的[程序执行](https://timsong-cpp.github.io/cppwp/n4950/intro.execution)、[函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)与[自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)。
