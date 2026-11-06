---
title: main 函数与程序入口（The main Function and Program Entry）
date: 2026-08-27
---

# main 函数与程序入口（The main Function and Program Entry）

辅助函数完成一次具体工作，`main` 则组织程序的主要执行过程：调用所需功能、输出结果，并在结束时向运行环境报告状态。

以下讨论常见桌面与服务器环境中的托管实现（hosted implementation）。在这种实现中，运行环境按 C++ 的入口规则调用 `main`；进入函数体后，声明、表达式、控制流与普通函数调用仍遵循已经建立的规则。

## 用户主控制流的入口

下面是完整程序。运费函数计算基本费与附加费之和，`main` 调用它、输出结果并返回成功状态；金额仍按整数元记录，使用非负的小整数：

```cpp
#include <iostream>

int calculate_shipping_fee(int fee, int surcharge) {
    fee += surcharge;
    return fee;
}

int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n'; // 15
    return 0;
}
```

在通常的程序启动过程中，[可执行程序需要被加载并得到运行所需的准备](../00-introduction/03-source-file-to-executable.md#生成可执行文件之后还需要加载)，实现随后按约定进入 `main`。程序中的辅助函数调用，则由 `main` 等函数体内的调用表达式发起。开篇的执行关系可以概括为：

```text
完成进入 main 所需的启动准备
    → 进入 main
    → 调用运费函数，取得 15
    → 输出 15
    → main 正常返回 0
    → 完成其余正常终止处理，向运行环境报告状态
```

运行库准备、某些非局部对象的初始化等，可以发生在进入 `main` 函数体之前；这些初始化的具体时机遵循各自的规则。`main` 正常返回后，也还会进行相应的终止处理。因此，不能把函数体第一条语句当成整个程序执行的第一条机器指令。

> [!IMPORTANT] main 是托管程序的主控制流入口
> **在托管实现中，`main` 是运行环境按 C++ 规则进入用户主控制流的指定函数。**它的入口地位不由源码排列位置决定；启动工作和某些用户代码的初始化可以先于它执行，正常返回后也仍有终止处理。

独立实现（freestanding implementation），例如某些裸机环境，是否要求程序提供 `main` 由实现规定。为这类目标编写程序时，应查目标环境的启动约定，不能直接套用托管程序的全部入口要求。

## main 的特殊声明

当前采用标准保证支持的无参数形式。下面本身也是一份独立完整程序，运行时没有输出，并以成功状态结束：

```cpp
int main() {
    return 0;
}
```

全局作用域（global scope）是整个程序最外层的命名空间作用域。作为托管程序入口的 `main` 属于这个作用域，并显式声明返回类型为 `int`；完整程序恰好提供一个这样的入口函数。

把同名函数放进其他命名空间，不能用它充当这个全局入口。这里限制的是具有特殊入口身份的函数，并不是说标识符 `main` 在所有作用域中都被禁止使用。

标准还支持接收程序启动参数的形式；无参数形式足以完成这里的计算、输出与状态报告。需要处理启动参数时，应按相应的参数表示与入口规范选择形式，不能任意改变返回类型。

下面的错误入口定义只用于编译诊断检查：

```cpp
void main() { // 错误：入口 main 必须返回 int
}
```

入口 `main` 也不能作为程序主动使用的普通接口。下面的错误定义尝试再次调用它，同样只做诊断检查，不运行：

```cpp
int main() {
    return main(); // 错误：程序不能调用入口 main
}
```

> [!IMPORTANT] 入口 main 的声明与使用限制
> **托管程序恰好提供一个属于全局作用域、返回类型显式为 `int` 的入口 `main`。**无参数的 `int main()` 是标准保证支持的一种形式；程序不能像使用普通函数接口那样调用这个入口，也不能通过自调用使它递归执行。

## 返回程序终止状态

开篇程序有两个不同的整数结果：运费函数返回 `15`，用于初始化 `shipping_fee`；`main` 返回 `0`，用于报告程序的终止状态（termination status）。`std::cout` 输出的是前一个值，后一个值不会因为执行 `return` 就自动显示在屏幕上。

执行 `main` 中的 `return` 时，先由返回表达式建立整数结果，随后离开函数体，按作用域退出规则结束其中仍然存活的普通自动存储期局部对象的生命周期，再进入程序的正常终止处理。返回的整数用于向运行环境报告状态，具体怎样传递和呈现由实现约定。

`0` 表示成功终止。需要明确表达失败时，可以包含标准头文件 `<cstdlib>`，使用它提供的预处理宏（macro）`EXIT_FAILURE`；同一头文件也提供成功状态宏 `EXIT_SUCCESS`。它们展开为实现提供的整数常量，写名称时不加 `std::`。通常按名称所表达的成功或失败含义使用；需要与外部状态码协议对接时，再核对实现给出的具体数值与环境的呈现约定：

| 返回值 | 标准规定的含义 |
| --- | --- |
| `0` 或 `EXIT_SUCCESS` | 成功终止 |
| `EXIT_FAILURE` | 失败终止 |
| 其他整数值 | 返回给环境的状态由实现规定 |

> [!IMPORTANT] 终止状态与程序输出各自独立
> **从 `main` 正常返回的整数用于报告终止状态，不会自动成为程序输出。`0` 或 `EXIT_SUCCESS` 表示成功，`EXIT_FAILURE` 表示失败；其他整数值的状态含义由实现规定。**判断一次运行的结果时，应分别查看程序输出的内容和报告给环境的状态。

例如，在开篇程序的头文件包含处增加 `#include <cstdlib>`，保留运费函数，用下面的定义替换 `main`。这个程序对固定测试输入检查运费是否为预期的 `15`：

```cpp
int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};

    if (shipping_fee != 15) {
        std::cout << "shipping fee check failed\n";
        return EXIT_FAILURE;
    }

    std::cout << shipping_fee << '\n';
    return 0;
}
```

原来的输入产生 `15`，程序输出该值并报告成功。若只把调用中的附加费 `10` 改成 `9`，仍保留预期值 `15`，计算得到的 `14` 就无法通过这项固定检查：

| 测试情形 | 程序输出 | 返回的终止状态 |
| --- | --- | --- |
| 使用 `calculate_shipping_fee(5, 10)` | `15` | `0`，成功 |
| 改为 `calculate_shipping_fee(5, 9)`，预期值仍为 `15` | `shipping fee check failed` | `EXIT_FAILURE`，失败 |

失败路径的 `return` 会结束当前 `main`，不会继续执行后面的正常结果输出。这里用失败状态报告检查结果，不依赖某个自选整数在所有环境中都被解释成相同含义。

`main` 还有一条特殊规则。下面这份独立完整程序没有输出，也以成功状态结束：

```cpp
int main() {}
```

> [!IMPORTANT] main 到达函数体末尾等价于返回 0
> **控制流到达 `main` 的函数体末尾，效果等价于执行 `return 0;`。**这项特例不能推广到本章的普通 `int` 辅助函数：若实际执行路径到达这类函数的末尾，仍会产生未定义行为，不会自动得到整数 `0`。

显式保留 `return 0;` 可以直接表达成功完成这条路径的意图，而省略它并不影响上述 `main` 的合法性。普通辅助函数的返回路径仍按[非 void 函数的结果要求](03-return-values-and-the-return-statement.md#非-void-函数不能遗漏结果)判断。

## 参考资料

- [C++23 工作草案：main 函数](https://timsong-cpp.github.io/cppwp/n4950/basic.start.main)
- [C++23 工作草案：启动与终止](https://timsong-cpp.github.io/cppwp/n4950/basic.start)
- [C++23 工作草案：标准库终止状态](https://timsong-cpp.github.io/cppwp/n4950/support.start.term)
- [C++23 工作草案：cstdlib 头文件与状态宏](https://timsong-cpp.github.io/cppwp/n4950/cstdlib.syn)
