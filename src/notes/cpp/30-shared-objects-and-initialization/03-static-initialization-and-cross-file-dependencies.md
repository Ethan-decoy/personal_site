---
title: 静态初始化与跨文件依赖（Static Initialization and Cross-File Dependencies）
date: 2026-09-22
order: 3
---

# 静态初始化与跨文件依赖（Static Initialization and Cross-File Dependencies）

`extern` 声明能够让两个文件使用同一个对象，却没有说明哪个对象必须先完成初始化。如果一个对象的初值来自另一个对象，仅仅让两个名称都可见，仍然可能得到不符合预期的初始状态。

判断这种依赖，需要先区分：哪些初始状态由程序开始时的静态初始化建立，哪些还需要执行初始化过程。本篇讨论普通源文件程序中的命名空间变量，不涉及并发执行、模板或模块带来的额外顺序规则。

## 静态存储期对象先建立哪些初始状态

静态初始化（static initialization）包含两种情况：

- **常量初始化（constant initialization）**：初始化满足语言规定的常量求值条件，初始状态可在静态初始化阶段建立。
- **零初始化（zero-initialization）**：未进行常量初始化时，先按类型建立零初始化状态；对于本篇使用的 `int`，这个状态是数值 `0`。

其余初始化属于动态初始化（dynamic initialization）。这里的“动态”指初始化类别，与是否通过动态分配取得内存无关。

以下是可以放在一个源文件全局命名空间中的独立片段：

```cpp
int read_target_pressure() {
    return 240;
}

int inspection_count;
int pressure_step_kpa{5};
const int target_pressure_kpa{read_target_pressure()};
```

三个对象都具有静态存储期，但初始化的判断不同：

| 对象 | 初始化关系 |
| --- | --- |
| `inspection_count` | 没有显式初始化器，零初始化使其值为 `0` |
| `pressure_step_kpa` | 使用整数常量 `5`，满足常量初始化条件 |
| `target_pressure_kpa` | 普通函数调用不满足常量表达式要求，通常需要在零初始化后执行动态初始化 |

`target_pressure_kpa` 的 `const` 只限制初始化完成后的修改，不会使 `read_target_pressure()` 自动成为常量表达式。[编译器能够算出结果与语言允许常量求值](../06-constants-literals-and-type-conversions/03-constant-expressions-and-constexpr.md#容易计算不等于常量表达式)是两回事。

实现可以在标准允许的条件下提前完成本来需要动态初始化的工作，因此不能靠观察生成代码，认定所有普通函数调用都一定在运行时发生。不过，**程序可以依赖所有静态初始化先于动态初始化，不能依赖某项可选的提前处理恰好发生。**

这套零初始化规则针对当前静态存储期对象。不能由 `inspection_count` 的初始值为 `0`，推断函数内没有初始化器的普通自动存储期 `int` 也自动得到 `0`。

> [!IMPORTANT]
> 判断初始化是否需要执行计算，不能只看有没有 const，也不能只看表达式是否简单。先按语言规则判断静态初始化能建立什么状态，再判断剩余动态初始化依赖谁已经完成。

## 同一翻译单元中的定义顺序可以表达依赖

下面是一个完整程序。`make_target_pressure` 是普通函数，两个命名空间对象按定义顺序提供初始化关系：

```cpp
#include <iostream>

namespace workshop {
int make_target_pressure() {
    return 240;
}

int target_pressure_kpa{make_target_pressure()};
int startup_margin{220 - target_pressure_kpa};
} // namespace workshop

int main() {
    std::cout << workshop::startup_margin << '\n';
}
```

程序输出 `-20`。对于本例同一翻译单元中的普通非 inline 变量，需要进行的动态初始化按照定义出现的顺序进行。`startup_margin` 计算时，前面的 `target_pressure_kpa` 已完成所需初始化。

这里依靠的是**对象定义的顺序**。把不提供定义的 `extern` 声明写得更早，不等于把该对象的初始化移到了前面。若把上例的实际定义顺序反过来，仅靠前向声明让代码通过名称检查，就不能继续推断得到相同初始值。

## 跨文件声明不会建立初始化先后关系

现在把两份对象定义放入不同翻译单元。下面四个文件组成一个完整程序。

`settings.hpp`：

```cpp
#ifndef CPP_NOTES_SETTINGS_HPP
#define CPP_NOTES_SETTINGS_HPP

namespace workshop {
extern int target_pressure_kpa;
extern int startup_margin;
} // namespace workshop

#endif
```

`settings.cpp`：

```cpp
#include "settings.hpp"

namespace workshop {
int make_target_pressure() {
    return 240;
}

int target_pressure_kpa{make_target_pressure()};
} // namespace workshop
```

`report.cpp`：

```cpp
#include "settings.hpp"

namespace workshop {
int startup_margin{220 - target_pressure_kpa};
}
```

`main.cpp`：

```cpp
#include "settings.hpp"

#include <iostream>

int main() {
    std::cout << workshop::target_pressure_kpa << '\n';
    std::cout << workshop::startup_margin << '\n';
}
```

使用 GCC 构建：

```sh
g++ -std=c++23 main.cpp settings.cpp report.cpp -o startup_demo
```

`settings.hpp` 保证两边谈论同一对象，但没有为两个翻译单元中的动态初始化指定固定的先后顺序。不能依赖第二行必然输出 `-20`：

- 若 `startup_margin` 计算时，`target_pressure_kpa` 已完成取得 `240` 的初始化，差值为 `-20`。
- 若此时目标对象仍处于零初始化建立的 `0`，差值为 `220`。目标稍后取得 `240`，也不会自动重算已经初始化过的 `startup_margin`。

这里特意使用 `int`，是为了能够讨论已经建立的零值。**不能将这段推理套到尚未完成构造的 std::string、std::vector 等类对象上，认为它们此时就是可正常操作的空对象。**零初始化不代替类对象所需的构造。

一次运行得到 `-20`，不足以证明程序拥有所需的顺序保证。修改链接输入顺序等因素可能暴露问题，但排列构建命令中的源文件并不是可移植的初始化依赖声明。

动态初始化也不必一律发生在 `main` 第一条语句之前。实现可以按规则延迟某些非局部对象的动态初始化，并在规定的使用边界前完成它；这种延迟仍不能给任意两个跨文件初始化器建立所希望的依赖。对本例，`main` 中的直接读取会满足相应初始化要求，风险发生在 `startup_margin` 初始化时对另一个对象状态的依赖。

> [!WARNING]
> 声明可见、定义存在、链接成功，都不能单独证明初始化依赖成立。需要另一对象已经取得最终初始状态时，应当为这个先后关系提供明确依据。

## constinit 将静态初始化要求写进定义

如果目标压力本来就是固定初值，并不需要执行读取工作，可以让它接受静态初始化。`constinit` 是声明说明符；在这里对静态存储期变量使用它，就要求该变量接受静态初始化。若定义需要动态初始化，程序就不合法。

在刚才的 `settings.cpp` 中，将目标变量的定义替换为：

```cpp
constinit int target_pressure_kpa{240};
```

此片段仍位于 `namespace workshop` 中。头文件中的 `extern int target_pressure_kpa;` 可以保持不变：`constinit` 没有改变对象的 `int` 类型，初始化定义已经明确写出要求。

这里即使不写 `constinit`，`int target_pressure_kpa{240};` 也会进行常量初始化。加入 `constinit`，是把静态初始化要求交给编译器检查：以后若把初始化器改成需要动态初始化的形式，编译就会失败。

目标对象的 `240` 在静态初始化中建立，而 `startup_margin` 对这个可修改对象的读取不属于常量表达式。因而它执行所需的动态初始化时，可以依赖目标已经取得 `240`，不再依赖这两个源文件之间的动态初始化顺序。

`constinit` **不隐含 const，也不使变量自动成为可用于常量表达式的对象**。上面的 `int` 仍可在 `main` 中赋新值；`constinit` 检查的是初始化安排，而不是后续是否修改。

若仍保留普通函数调用，下面是该定义的错误替代形式：

```cpp
constinit int target_pressure_kpa{make_target_pressure()}; // 错误：需要动态初始化
```

即使 `make_target_pressure` 的函数体只返回 `240`，编译器也很容易算出结果，这个普通函数调用仍不满足相应要求。实现可能提前处理的优化，不能替代 `constinit` 要求的语言保证。

对本例的整数对象，选择依据可以直接表述为：

| 需要表达的约束 | 相应形式 |
| --- | --- |
| 初始化后不允许通过普通操作修改，但初值可以来自运行期计算 | `const int` |
| 初值必须满足常量表达式要求，并形成可用于相应常量求值的对象 | `constexpr int` |
| 静态存储期对象必须接受静态初始化，但后续仍允许修改 | `constinit int` |

## 运行期依赖应由执行流程安排

如果设置必须来自真正的运行期操作，给定义加 `constinit` 并不能替程序完成这项工作。可以在 `main` 中先取得设置，再构造依赖设置的对象，用普通语句顺序表达依赖，并向其他操作传递引用。

这也把初始化失败放回可处理的调用流程中。**命名空间对象的初始化若让异常逃出，会触发程序终止，不能期待 main 函数体中的 try/catch 接住它。**这一边界即使在实现延迟动态初始化时也成立。

> [!PRACTICE]
> 初值能够静态建立时，可以用 constexpr 表达常量，或用 constinit 约束可修改对象的初始化。必须执行运行期工作时，优先让明确的拥有者按顺序创建对象；若确实需要通过共同入口在首次使用时建立对象，再采用[局部静态对象的按需初始化](04-local-static-objects-and-initialization-on-use.md#需要动态初始化时在第一次经过声明时完成)。

## 参考资料

- [C++23 工作草案：静态初始化](https://timsong-cpp.github.io/cppwp/n4950/basic.start.static)
- [C++23 工作草案：非局部变量的动态初始化](https://timsong-cpp.github.io/cppwp/n4950/basic.start.dynamic)
- [C++23 工作草案：constinit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constinit)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
