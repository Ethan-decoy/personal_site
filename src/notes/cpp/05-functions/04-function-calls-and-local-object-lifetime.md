---
title: 函数调用与局部对象生命周期（Function Calls and Local Object Lifetime）
date: 2026-08-14
---

# 函数调用与局部对象生命周期（Function Calls and Local Object Lifetime）

一次函数调用会依次涉及实参求值、形参初始化、函数体执行、返回结果建立，以及局部对象生命周期的结束。

## 一次完整的函数调用

考虑下面的函数与调用：

```cpp
int reduce_pressure(int pressure, int amount) {
    int result{pressure - amount};
    return result;
}

int current_pressure{
    reduce_pressure(240, 20)
};
```

程序执行到 `reduce_pressure(240, 20)` 时，大致经历以下过程：

1. 实参 `240` 和 `20` 分别完成求值；
2. 对应的实参结果用于初始化按值形参 `pressure` 和 `amount`；
3. 控制流进入函数体，局部对象 `result` 被初始化为 `220`；
4. `return result;` 读取 `result` 的值，并建立本次函数调用的 `int` 结果；
5. 程序离开函数体，本次执行路径上已经创建、具有自动存储期（automatic storage duration）的局部对象结束生命周期；
6. 控制流回到调用位置，调用结果用于初始化 `current_pressure`。

这里按照逻辑关系列出步骤，并不表示两个实参必定从左向右求值。C++23 只保证每个参数初始化完整完成之后才会开始另一个参数初始化，具体先完成哪一个没有固定顺序。

## 函数体中的局部对象

函数体是一条复合语句，会建立块作用域。声明在函数体或其嵌套代码块中、具有自动存储期的局部对象，执行到声明并完成初始化后开始存在，离开相应代码块时销毁。

```cpp
int calculate_pressure(int pressure, int reduction) {
    int reduced_pressure{pressure - reduction};
    int validated_pressure{reduced_pressure};
    return validated_pressure;
}
```

`reduced_pressure` 先完成初始化，`validated_pressure` 后完成初始化。执行 `return` 离开函数体时，返回结果先根据 `validated_pressure` 建立；随后，这些具有自动存储期的局部对象按照初始化顺序的相反顺序销毁：先销毁 `validated_pressure`，再销毁 `reduced_pressure`。

因此，从普通局部 `int` 对象的值建立返回结果是安全的：返回结果已经独立建立，局部对象随后结束生命周期，不会让调用者失去已经得到的整数值。

提前 `return` 同样会离开当前函数。程序只会销毁这条实际执行路径上已经完成初始化、且其作用域正在被离开的局部对象；尚未执行到的声明不会创建对象。

## 参数对象的生命周期

按值形参也是本次调用拥有的对象。它们在进入函数体之前由实参完成初始化，可以在函数体中使用，并只服务于这一次调用。

参数对象属于某一次具体调用；调用完成后，程序不能再把它们当作仍可由该次调用使用的对象。

## 每次调用彼此独立

同一个函数可以被调用多次，每次调用都会建立属于自己的按值参数，以及本次执行路径所需、具有自动存储期的局部对象：

```cpp
int first_pressure{
    reduce_pressure(240, 20)
};

int second_pressure{
    reduce_pressure(180, 10)
};
```

第一次调用中的 `pressure`、`amount` 和 `result`，与第二次调用中同名的对象彼此独立。第一次调用产生 `220`，第二次调用产生 `170`；一个调用内部对参数或局部对象的修改不会自动进入另一次调用。

这也是函数能够被反复使用的基础：函数定义只有一份，但每次执行都会拥有自己的调用状态。

## 嵌套调用

函数体中可以继续调用另一个函数，因此尚未完成的调用可能暂时等待更内层的调用返回：

```cpp
int double_pressure(int pressure) {
    return pressure * 2;
}

int calculate_pressure(int pressure) {
    int doubled{double_pressure(pressure)};
    return doubled + 10;
}

int result{calculate_pressure(100)};
```

调用 `calculate_pressure(100)` 后，外层调用先建立自己的参数对象 `pressure`。初始化 `doubled` 时又调用 `double_pressure(pressure)`，于是 `calculate_pressure` 暂时等待：

```text
calculate_pressure(100)
    └─ double_pressure(100)
           └─ 返回 200
    └─ doubled 初始化为 200
    └─ 返回 210
```

内层调用产生 `200` 并结束后，外层调用从原来的调用位置继续，使 `doubled` 保存 `200`，最终产生结果 `210`。

## 调用栈与栈帧

栈（stack）可以先理解为一种后进先出（Last In, First Out，LIFO）的组织方式：最后进入的内容最先离开。尚未结束的函数调用通常按照这种方式组织，因此形成调用栈（call stack）。

从执行模型看，每次调用都拥有属于自己的状态，例如返回后继续执行的位置、参数对象和仍然存活的局部对象。这份与一次具体调用对应的状态通常称为栈帧（stack frame）。

以上面的嵌套调用为例，执行 `double_pressure` 时，可以用下面的模型理解当前尚未完成的调用：

```text
调用栈顶部
┌────────────────────────┐
│ double_pressure 的栈帧 │
├────────────────────────┤
│ calculate_pressure     │
│ 的栈帧                 │
└────────────────────────┘
调用栈底部
```

`double_pressure` 最后进入调用栈，因此最先返回。它对应的栈帧离开后，程序恢复尚未完成的 `calculate_pressure`。这就是后进先出在嵌套函数调用中的直接表现。

这里使用调用栈和栈帧建立函数调用顺序的直觉。它们在常见实现中的具体内存布局，以及编译器如何改变这种布局，将在底层调用机制中深入说明。

相关语言规则可参阅 C++23 工作草案中的[函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)、[自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)与[返回过程中的销毁顺序](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)。
