---
title: main 函数与程序入口（The main Function and Program Entry）
date: 2026-08-27
---

# main 函数与程序入口（The main Function and Program Entry）

此前的函数都由程序中的调用表达式进入。常见桌面与服务器环境使用托管实现（hosted implementation）；在这种实现中，运行环境完成必要的启动工作后，会按照 C++ 规定调用一个具有特殊地位的函数：`main`。

## 用户主控制流的入口

一个完整程序可以先定义辅助函数，再由 `main` 组织主要执行过程：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa) {
    return pressure_kpa + 5;
}

int main() {
    int adjusted_pressure_kpa{calculate_adjusted_pressure_kpa(215)};

    if (adjusted_pressure_kpa != 220) {
        return 1;
    }

    return 0;
}
```

运行环境不是通过源码中的普通调用表达式进入 `main`。它在完成程序启动所需的工作后，按照语言与实现约定调用这个函数。随后，函数体仍然遵循已经建立的声明、表达式、控制流与函数调用规则。

因此，`main` 适合被理解为**托管实现进入用户主控制流的指定函数**，而不是机器执行的第一条指令。运行库准备等实现工作可能发生在进入它的函数体之前。

## main 的特殊声明

当前采用 `main` 的无参数形式：

```cpp
int main() {
    return 0;
}
```

`main` 必须具有 `int` 返回类型，并且属于全局作用域（global scope）。全局作用域是整个程序最外层的命名空间作用域；`main` 不能放在更内层的命名空间或函数体中。完整程序恰好定义一个这样的入口函数。

```cpp
void main() { // 错误：标准 C++ 不允许 void 返回类型
}
```

`main` 虽然具有函数定义的外形，却不是供程序主动使用的普通接口。C++23 不允许程序像调用普通函数一样调用它，因此也不能通过调用 `main()` 形成递归。

## 返回程序终止状态

从 `main` 执行 `return` 会结束这个函数，正常销毁其中仍然存活的自动存储期对象，并把返回值作为程序终止状态交给运行环境。

`0` 表示程序成功终止。其他状态值怎样呈现给用户或调用程序，由运行环境解释；前面的完整示例用 `1` 区分内部检查没有得到预期结果的路径。

`main` 还有一条只属于它的规则：控制流到达函数体末尾，效果等价于执行 `return 0;`。

```cpp
int main() {}
```

这个程序仍然以成功状态结束。**不能把这条特例推广到当前讨论的普通非 `void` 函数：如果控制流到达这类函数的函数体末尾，程序会产生未定义行为；凡是正常返回调用者的路径，都必须通过 `return` 建立结果。**显式保留 `return 0;` 可以直接表达程序在此处成功完成。

`main` 把完整程序连接到外部运行环境：辅助函数由程序中的调用表达式进入，`main` 则由托管实现按照特殊规则调用。进入函数体之后，它仍然使用与其他函数相同的代码块、局部对象和控制流模型；特殊之处集中在入口身份、声明限制与终止状态上。

## 参考资料

- [C++23 工作草案：main 函数](https://timsong-cpp.github.io/cppwp/n4950/basic.start.main)
