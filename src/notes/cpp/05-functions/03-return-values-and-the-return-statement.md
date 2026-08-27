---
title: 返回值与函数结束（Return Values and Function Completion）
date: 2026-08-27
---

# 返回值与函数结束（Return Values and Function Completion）

调用函数会使控制进入函数体，`return` 语句（return statement）则结束当前调用，并把控制交还给调用位置。返回类型决定调用是否产生可供外层表达式使用的值，以及这个值具有什么类型。

## 返回表达式建立调用结果

下面的函数计算目标气压与实测气压之间的差值：

```cpp
int calculate_pressure_difference_kpa(int target_pressure_kpa, int measured_pressure_kpa) {
    int difference_kpa{target_pressure_kpa - measured_pressure_kpa};

    return difference_kpa;
}
```

执行 `return difference_kpa;` 时，名称表达式读取局部对象当前保存的值。这个值用于建立本次调用的 `int` 结果，随后函数结束：

```cpp
int pressure_difference_kpa{calculate_pressure_difference_kpa(220, 205)};
```

调用表达式产生 `15`，并用它初始化 `pressure_difference_kpa`。

**返回的是由表达式建立的调用结果，不是把函数内的局部对象带到调用者作用域。**`difference_kpa` 仍然是函数体中的局部对象；调用结果建立之后，它会按照已经建立的作用域与生命周期规则销毁。外层得到的整数值不依赖这个局部对象继续存在。

返回结果的建立先于因离开函数作用域而发生的局部对象销毁，因此不能把这一过程理解成“先销毁局部对象，再从中读取返回值”。

## return 结束整个函数调用

`return` 不只结束附近的条件分支或循环，而是发起从当前函数返回的控制转移。返回结果建立并完成离开相关作用域所要求的对象销毁后，控制交还调用者；函数体中位于实际返回路径之后的语句不再执行。

这个性质可以用来处理已经能够确定结果的路径：

```cpp
int clamp_pressure_kpa(int pressure_kpa) {
    if (pressure_kpa < 0) {
        return 0;
    }

    if (pressure_kpa > 300) {
        return 300;
    }

    return pressure_kpa;
}
```

输入小于 `0` 时，第一个 `return` 使本次调用直接得到 `0`，后面的条件和语句不再执行。输入大于 `300` 时，第二个 `return` 产生 `300`。只有前两条路径都没有返回时，最后一条语句才会执行。

函数可能包含多条 `return` 语句，但一次具体调用只会沿实际执行路径到达其中一条；实际到达哪一条，由这次调用经历的控制流决定。

## 不提供值结果的函数

返回类型 `void` 表示调用不会产生可供调用者继续使用的值。这样的函数仍然可以执行语句、改变自己的局部状态，并在完成后把控制交还给调用位置：

```cpp
void run_local_countdown(int remaining_steps) {
    if (remaining_steps <= 0) {
        return;
    }

    while (remaining_steps > 0) {
        --remaining_steps;
    }
}
```

无操作数的 `return;` 可以提前结束 `void` 函数。调用沿函数体执行到末尾时，也会正常结束，效果等价于执行 `return;`：

```cpp
run_local_countdown(3);
```

这条调用没有可用于初始化其他对象的值，但控制仍会在函数结束后返回下一条语句。**`void` 表示没有值结果，不表示函数没有执行，也不表示控制不会返回调用位置。**

## 非 void 函数不能遗漏结果

本篇讨论的普通非 `void` 辅助函数中，如果某条实际执行路径到达函数体末尾却没有返回值，程序会产生未定义行为：

```cpp
int calculate_pressure_deficit_kpa(int pressure_kpa) {
    if (pressure_kpa < 200) {
        return 200 - pressure_kpa;
    }
}
```

当 `pressure_kpa >= 200` 时，控制能够到达右花括号，却没有建立 `int` 结果。编译器通常能够警告这种问题，但语言规则并不要求它必然表现为编译错误。

不能让控制流直接越过非 `void` 辅助函数的末尾；能够正常返回调用者的路径必须在此前执行带结果的 `return`：

```cpp
int calculate_pressure_deficit_kpa(int pressure_kpa) {
    if (pressure_kpa < 200) {
        return 200 - pressure_kpa;
    }

    return 0;
}
```

返回类型不是对函数结果的注释，而是调用边界的一部分。**声明返回 `int` 的普通函数不能让控制流直接越过函数体末尾；正常返回调用者时必须建立 `int` 结果。声明返回 `void` 的函数则不向调用者提供值结果。**

相关语言规则可参阅 C++23 工作草案中的[返回语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)与[跳转语句及作用域退出](https://timsong-cpp.github.io/cppwp/n4950/stmt.jump)。
