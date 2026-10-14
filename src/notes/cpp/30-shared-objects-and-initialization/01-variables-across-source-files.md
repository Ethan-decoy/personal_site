---
title: 跨文件变量与对象身份（Variables and Object Identity across Source Files）
date: 2026-09-22
order: 1
---

# 跨文件变量与对象身份（Variables and Object Identity across Source Files）

多个源文件可以通过一致的声明调用同一个函数，也可能需要访问同一个对象。例如，设置操作修改目标压力，计算操作随后读取更新后的目标；这里需要保留的是**同一个对象的状态**，而不是在每个文件中各存一份初值相同的变量。

[声明可见与实体身份](../29-headers-and-multi-file-programs/01-declarations-across-source-files.md#声明可见与实体相同是两件事)仍是两项不同要求。对于变量，还要分清哪条声明只是让对象可被使用，哪条声明实际提供了对象的定义。

## 用 extern 声明对象，用一处定义提供它

在当前命名空间作用域中，下面这条声明介绍一个类型为 `int` 的对象，但不定义它：

```cpp
namespace workshop {
extern int target_pressure_kpa;
}
```

这里的 `extern` 使没有初始化器的变量声明能够只提供名称和类型。对于这个首次声明的普通命名空间变量，它的名称具有外部链接（external linkage），不同翻译单元中的对应声明能够指向同一个对象。

下面三个文件组成完整程序，放在同一目录中。

`settings.hpp` 集中提供变量和函数的声明：

```cpp
#ifndef CPP_NOTES_SETTINGS_HPP
#define CPP_NOTES_SETTINGS_HPP

namespace workshop {
extern int target_pressure_kpa;
int pressure_margin(int measured_kpa);
} // namespace workshop

#endif
```

`settings.cpp` 包含共用声明，并提供变量与函数的定义：

```cpp
#include "settings.hpp"

namespace workshop {
int target_pressure_kpa{240};

int pressure_margin(int measured_kpa) {
    return measured_kpa - target_pressure_kpa;
}
} // namespace workshop
```

`main.cpp` 先使用初始设置，再修改设置：

```cpp
#include "settings.hpp"

#include <iostream>

int main() {
    std::cout << workshop::pressure_margin(220) << '\n';

    workshop::target_pressure_kpa = 250;
    std::cout << workshop::pressure_margin(220) << '\n';
}
```

使用 GCC 构建并运行：

```sh
g++ -std=c++23 main.cpp settings.cpp -o settings_demo
```

程序依次输出 `-20` 和 `-30`。`main.cpp` 修改的对象，正是 `settings.cpp` 中 `pressure_margin` 随后读取的对象。包含头文件没有复制它，`extern` 声明也没有创建第二份状态。

`extern` 并不要求定义一定放在“另一个文件”。声明和定义可以像 `settings.cpp` 一样在同一翻译单元中出现；它也不代表对象属于操作系统或其他程序。这里讨论的始终是当前程序内部的声明关系。

## 没有初始化器也可能是定义

变量与函数的声明形式不能机械类比。以下各行分别表示在 `namespace workshop` 中采用的写法，用于比较含义，不应把这些定义全部写入同一程序：

| 写法 | 当前含义 |
| --- | --- |
| `extern int target_pressure_kpa;` | 声明已有接口所指的对象，不提供定义 |
| `int target_pressure_kpa{240};` | 定义对象，并给出初始值 |
| `int target_pressure_kpa;` | 仍是对象定义，不能当成函数原型那样的非定义声明 |
| `extern int target_pressure_kpa{240};` | 带有初始化器，仍然是定义；不能借 extern 在多个文件重复放置 |

因此，把 `int target_pressure_kpa{240};` 直接放进共享头文件，再让两个源文件包含，通常会为同一个具有外部链接的普通变量提供两份定义。即使初始值完全相同，也违反[单一定义规则](../29-headers-and-multi-file-programs/03-definition-boundaries-and-inline.md#单一定义规则先区分两种重复)。

反过来，如果始终只有 `extern` 声明，却没有提供当前程序使用的对象定义，通常会在链接时遇到未定义符号。声明让使用位置知道对象的类型，不能代替完整程序所需的定义。

> [!IMPORTANT]
> 对本例中的普通跨文件变量，头文件放不带初始化器的 extern 声明，一个源文件提供定义。每个使用位置取得声明，完整程序则共同使用那一个对象。

## 命名空间对象具有静态存储期

`target_pressure_kpa` 没有定义在某次函数调用的代码块内。本篇这些命名空间变量的对象具有静态存储期（static storage duration）：**与对象关联的存储在程序运行期间持续可用，不随某次函数调用结束而释放。**

这与[自动存储期](../03-blocks-scope-and-lifetime/03-automatic-storage-duration-and-local-object-lifetime.md#自动存储期automatic-storage-duration)的局部对象不同。`pressure_margin` 每次调用都会重新接收自己的 `measured_kpa` 形参，却一直访问同一个 `target_pressure_kpa`，不会在返回时销毁它。

“静态存储期”也不意味着“值不能变化”。示例中的对象是可修改的 `int`，所以可以从 `240` 改为 `250`。是否允许修改，由类型和访问方式决定。

存储期还不能代替初始化与销毁规则。本例以整数常量 `240` 初始化的对象，在执行 `main` 中的语句前已经取得这个初值；不能据此推断任意命名空间类对象在任意访问时都已完成构造。对于这类对象，必须同时判断[初始化的先后关系](03-static-initialization-and-cross-file-dependencies.md#跨文件声明不会建立初始化先后关系)。

正常从 `main` 返回时，已经构造的静态存储期类对象会进入程序结束时的销毁过程；它们不随某个普通调用退出而销毁，也不保证在程序异常终止时仍完成清理。

## 存储期与链接属性分别决定不同关系

同样放在命名空间作用域中，对象可以维持相同的存储期，却采用不同的跨文件身份。

例如，将下面片段放在一个实现文件的全局命名空间中：

```cpp
namespace workshop {
namespace {
int target_pressure_kpa{240};
}
} // namespace workshop
```

匿名命名空间使该名称具有[内部链接](../29-headers-and-multi-file-programs/05-internal-linkage-and-private-helpers.md#匿名命名空间让辅助函数属于当前翻译单元)。其他翻译单元不能靠对应的同名声明指向它，但对象仍具有静态存储期。

对于这里的普通变量，写成命名空间作用域的 `static int target_pressure_kpa{240};` 也能建立内部链接。这项作用与把变量放在函数内部时的存储期选择需要分别判断。

| 需要判断的问题 | 看哪项关系 |
| --- | --- |
| 当前表达式能否找到变量声明 | 作用域、声明位置与名称查找 |
| 不同翻译单元中的声明是否指向同一对象 | 链接属性与对应声明 |
| 对象关联的存储是否随一次调用结束而释放 | 存储期 |
| 当前位置能否正确使用对象当前状态 | 初始化、生命周期与相应操作的要求 |

> [!WARNING]
> 把共享头文件中的变量改成 static，可能使重复定义诊断消失，但各翻译单元会获得各自的对象。若一个文件修改的设置必须由另一个文件读取，这种改法已经改变了程序需要的状态关系。

## 共享状态应当来自实际需要

示例让变量直接作为接口，是为了看清声明与同一对象之间的关系。如果目标压力具有有效范围等约束，可以只公开修改和读取操作，将存储保留在实现文件内，由接口维护约束。

同一个对象可被多个地方修改，也会使各次操作相互影响。如果两次独立测量任务需要不同配置，让它们都使用同一命名空间变量，就无法自然表达两份独立状态。

> [!PRACTICE]
> 真正需要程序内共同使用一份设置时，才选择共享对象。若状态属于某次任务或某个设备，就让相应对象拥有状态，并通过参数把它交给需要的操作；存放位置应表达状态的归属，而不只是让调用时少写一个参数。

## 参考资料

- [C++23 工作草案：声明与定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def)
- [C++23 工作草案：存储类说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.stc)
- [C++23 工作草案：程序与链接属性](https://timsong-cpp.github.io/cppwp/n4950/basic.link)
- [C++23 工作草案：静态存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.static)
- [C++23 工作草案：程序结束时的销毁](https://timsong-cpp.github.io/cppwp/n4950/basic.start.term)
