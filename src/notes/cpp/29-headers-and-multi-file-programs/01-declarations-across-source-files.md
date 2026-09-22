---
title: 跨源文件的声明与定义（Declarations and Definitions across Source Files）
date: 2026-09-22
order: 1
---

# 跨源文件的声明与定义（Declarations and Definitions across Source Files）

函数调用需要先看到声明，却不必在调用处看到函数体。[声明与定义的区别](../05-functions/04-function-declarations-and-definitions.md#在定义之前提供声明)因而不仅能够调整同一文件中的书写顺序，还能让调用者与实现分别放进不同的源文件。

本章使用普通源文件和 `#include` 组织程序。先让两个源文件共同完成一次调用，便能看清：编译当前文件需要什么，组合完整程序又需要什么。

## 调用者和实现分别放在两个文件

把以下两个文件保存在同一目录。

`main.cpp`：

```cpp
#include <iostream>

namespace workshop {
int adjust_pressure(int pressure_kpa);
}

int main() {
    std::cout << workshop::adjust_pressure(220) << '\n';
}
```

`pressure.cpp`：

```cpp
namespace workshop {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}
} // namespace workshop
```

在该目录使用 GCC 驱动程序构建：

```sh
g++ -std=c++23 main.cpp pressure.cpp -o pressure_demo
```

`-std=c++23` 选择语言版本，`-o` 指定输出文件名称。运行程序输出 `225`；Linux、macOS 通常使用 `./pressure_demo`，Windows PowerShell 中相应可执行文件通常使用 `.\pressure_demo.exe`。

命令接收两个源文件，但**不会把两个源文件按参数顺序拼成一份 C++ 源码**。它们分别形成翻译单元（translation unit），各自接受编译，再组合编译产物。

分析 `main.cpp` 中的调用时，声明已经告诉编译器：`workshop::adjust_pressure` 接收一个 `int`，返回一个 `int`。这些信息足以检查当前调用、解释结果怎样交给输出操作；函数体由 `pressure.cpp` 提供。

## 声明可见与实体相同是两件事

`main.cpp` 和 `pressure.cpp` 都打开了 `workshop` 命名空间。[重新打开命名空间](../28-namespaces-and-name-lookup/02-organizing-namespace-declarations.md#分段书写仍属于同一个命名空间)会继续向同一归属添加声明，而不是按文件生成不同的命名空间。

不过，**一个文件中的声明不会因此自动出现在另一个翻译单元中**。即使构建时已经列出 `pressure.cpp`，删除 `main.cpp` 中的函数声明后，调用仍然不能通过编译。

跨文件的另一项关系是链接属性（linkage）：不同声明中的名称，能否指向同一个实体。实体（entity）在这里就是被声明的具体函数。

当前这种具名命名空间中的普通自由函数，其名称默认具有外部链接（external linkage）。在不同翻译单元中，对同一命名空间里的该函数作出相互一致的声明，可以共同指向**同一个函数**。所以 `main.cpp` 所调用的函数，正是 `pressure.cpp` 中定义的那个函数。

这里不需要额外写关键字，普通函数声明已经具备所需的外部链接关系。文件名不决定函数身份：把 `pressure.cpp` 改名并同步构建命令，不会改变 `workshop::adjust_pressure` 指向谁。

> [!IMPORTANT]
> 声明可见，解决当前代码能否认识并使用函数；外部链接，允许不同翻译单元中的声明指向同一个函数；定义则提供这个函数实际执行的行为。

## 分别编译保留了各自的检查边界

[分别编译](../00-introduction/03-source-file-to-executable.md#分别编译让翻译单元独立产生目标文件)也可以显式拆成三个命令：

```sh
g++ -std=c++23 -c main.cpp -o main.o
g++ -std=c++23 -c pressure.cpp -o pressure.o
g++ main.o pressure.o -o pressure_demo
```

`-c` 要求生成目标文件后停止，不执行链接。前两个命令可以分别完成：`main.o` 保留对函数实现的需求，`pressure.o` 提供相应实现，最后一条命令把它们组合起来。

```text
main.cpp       → main.o       ─┐
                               ├→ pressure_demo
pressure.cpp   → pressure.o    ─┘
```

链接器依靠目标文件中的符号匹配这些关系。它不会回到 `main.cpp`，替编译器重新查找名称或选择重载。因此，把一个新函数体加进其他源文件，不会自动改变当前调用点已经依据声明作出的判断。

## 从失败位置判断缺少什么

对上面的程序分别作以下修改，会遇到不同问题：

| 修改 | 失败原因 | 常见表现 |
| --- | --- | --- |
| 删掉 `main.cpp` 中的 `adjust_pressure` 声明 | 当前翻译单元无法查到被调用函数 | 编译时报名称未声明或命名空间中没有该成员 |
| 最后只链接 `main.o` | 调用已经合法，但完整程序没有提供所需定义 | 链接时报未定义引用或未解析的外部符号 |
| 将实现的参数类型改成 `double`，调用方仍声明 `int` 版本 | 定义了另一个重载，原来的 `int` 版本仍缺少定义 | 两个文件可能分别编译成功，链接仍失败 |

最后一种情况揭示了手抄声明的风险：两个文件各自看起来合理，并不能证明它们对接口的理解一致。换一个返回类型等其他不一致还可能没有可靠的链接诊断，不能把“链接成功”当成跨文件类型检查已经完成。

> [!PRACTICE]
> 判断多文件构建失败时，先确认调用处拥有正确声明，再确认提供对应定义的源文件或目标文件参与了构建。只补声明不能补出实现，只把源文件加入构建也不能让其声明自动可见。

共用接口应集中维护，使调用方与实现方都依据同一份声明接受检查。这正是[头文件共享接口](02-headers-and-include-guards.md#让调用方与实现方包含同一份声明)要解决的问题。

## 参考资料

- [C++23 工作草案：程序与链接属性](https://timsong-cpp.github.io/cppwp/n4950/basic.link)
- [C++23 工作草案：分别翻译](https://timsong-cpp.github.io/cppwp/n4950/lex.separate)
- [GCC：控制编译阶段的选项](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
