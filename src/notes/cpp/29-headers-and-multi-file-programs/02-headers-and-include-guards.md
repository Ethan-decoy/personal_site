---
title: 头文件与重复包含（Headers and Include Guards）
date: 2026-09-22
order: 2
---

# 头文件与重复包含（Headers and Include Guards）

调用方与实现方都需要知道函数接口。如果每个源文件手写一份声明，修改接口时就可能漏改某一处。头文件（header file）把需要共享的源代码内容集中到一个文件，再由各个源文件通过 `#include` 纳入。

**头文件提供共同的声明来源；每个翻译单元仍然分别接受检查。**它没有让所有源文件共享一个自动同步的名称查找环境。

## 让调用方与实现方包含同一份声明

在[两个源文件共同完成调用](01-declarations-across-source-files.md#调用者和实现分别放在两个文件)的程序中，新建 `pressure.hpp`。以下三个文件放在同一目录。

头文件使用包含保护（include guard）防止同一翻译单元重复处理正文。这里先给出完整文件，保护指令的含义在下节展开。

`pressure.hpp`：

```cpp
#ifndef CPP_NOTES_PRESSURE_HPP
#define CPP_NOTES_PRESSURE_HPP

namespace workshop {
int adjust_pressure(int pressure_kpa);
}

#endif
```

`main.cpp`：

```cpp
#include "pressure.hpp"

#include <iostream>

int main() {
    std::cout << workshop::adjust_pressure(220) << '\n';
}
```

`pressure.cpp`：

```cpp
#include "pressure.hpp"

namespace workshop {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}
} // namespace workshop
```

构建命令仍然是：

```sh
g++ -std=c++23 main.cpp pressure.cpp -o pressure_demo
```

头文件通过两个 `#include` 分别参与对应翻译单元，不需要作为第三个源文件列进这条命令。程序仍输出 `225`。

对当前自有文本头文件，`#include` 可以理解为：**在指令出现的位置，把文件内容纳入当前源文件的预处理过程**。被纳入的内容继续按其中的包含和条件指令处理，形成当前翻译单元所需的内容。

`.hpp` 是常用的 C++ 头文件扩展名，`.h` 也很常见。共享接口的作用来自内容和包含方式，扩展名本身不会让声明自动可见，也不会赋予函数特殊的定义规则。

项目自有头文件使用双引号，标准库头文件使用尖括号。两种形式的具体搜索规则由实现规定；在 GCC 中，双引号形式先从包含它的文件所在目录开始搜索，再按配置继续查找。这个例子将文件放在同一目录，因此不需要额外配置搜索路径。

实现文件也包含自己的头文件，是为了让定义与接口声明在同一翻译单元内相遇。例如只把定义的返回类型改成 `double`，它就会与头文件中返回 `int` 的同参数函数声明发生冲突，编译器能够就地报错。

这不意味着每种改错都一定被发现：若把参数类型改成 `double`，仍可能合法地定义出另一个重载。共用声明减少接口漂移，但还要核对定义是否确实实现了所声明的接口。

## 包含保护记录本次预处理是否已经见过头文件

头文件可以包含其他头文件。即使每个 `.cpp` 只直接包含某个头文件一次，也可能沿不同路径再次到达它：

```text
main.cpp
├─ pressure.hpp
└─ report.hpp
   └─ pressure.hpp
```

预处理不会仅凭路径出现过就按标准自动忽略第二次包含。重复且一致的普通函数声明通常合法，但同一个类定义在同一翻译单元内出现两次便不合法；共享头文件需要可靠地防止重复展开。

包含保护中的 `CPP_NOTES_PRESSURE_HPP` 是宏（macro）的名称。宏由预处理指令管理，不是 C++ 变量，也不属于 `workshop` 命名空间。这里不使用宏替换数据，只把“是否已经定义”作为标记：

| 指令 | 在当前头文件中的作用 |
| --- | --- |
| `#ifndef CPP_NOTES_PRESSURE_HPP` | 若该宏尚未定义，处理这一条件块 |
| `#define CPP_NOTES_PRESSURE_HPP` | 定义该宏，记录正文已经进入处理 |
| `#endif` | 结束这个条件块 |

第一次包含时，宏尚未定义，正文被纳入，同时宏被定义。第二次遇到该头文件时，条件不再成立，于是跳过受保护的正文。

这个标记作用于**当前这一次预处理**。分别处理 `main.cpp` 与 `pressure.cpp` 时，两边都应获得各自需要的接口声明；`main.cpp` 先包含过头文件，不会把 `pressure.cpp` 的声明也一并跳掉。

不同头文件应使用不同的保护宏。若两个头文件误用同一个宏，先包含的文件会使后一个文件的正文被跳过。加入项目和文件含义的前缀，是为了降低这种冲突风险。

> [!WARNING]
> 包含保护控制的是同一翻译单元内的重复包含。一个头文件被两个源文件分别包含时，正文仍会分别进入两个翻译单元；它不能免除跨翻译单元的定义规则。

## 头文件应带齐自己的直接依赖

自包含的头文件（self-contained header）能够在不依赖调用者先包含其他文件的情况下成立。例如，下面是独立的 `report.hpp`，它直接使用 `std::string_view`，因此自己包含 `<string_view>`：

```cpp
#ifndef CPP_NOTES_REPORT_HPP
#define CPP_NOTES_REPORT_HPP

#include <string_view>

namespace workshop {
void print_label(std::string_view label);
}

#endif
```

这里只展示接口声明；真正调用 `print_label` 的程序仍须提供其定义。这个头文件的自包含要求，是指**单独包含它就能理解其中的声明**，并不是要求它包含所有实现。

如果删掉 `<string_view>`，而某个调用文件碰巧提前包含了它，错误就可能被隐藏。另一个调用文件改变包含顺序时，问题才暴露。将依赖写在实际使用它的文件中，能够让接口不依赖这种偶然顺序。

同理，`main.cpp` 自己使用 `std::cout`，就应直接包含 `<iostream>`，即使某个项目头文件当前恰好也包含了它。

## 包含接口，单独构建实现

`#include` 按所在位置纳入内容，因此项目头文件通常在其他声明之外、文件开头包含。把带有 `namespace workshop` 的头文件包含进另一个命名空间，可能使其声明归属发生变化；包含保护不会纠正这种位置错误。

也不要用 `#include "pressure.cpp"` 代替把实现加入构建。如果纳入了实现，又把 `pressure.cpp` 单独编译，同一个普通函数的定义就可能出现在多个翻译单元中。

> [!PRACTICE]
> 共享接口由头文件集中维护；实现文件直接包含对应头文件，并作为源文件参与构建。头文件自身带齐声明所需的依赖，调用方只需按接口使用它。

是否可以把函数体留在头文件中，需要进一步区分[普通函数、类定义和 inline 函数的定义边界](03-definition-boundaries-and-inline.md#单一定义规则先区分两种重复)。

## 参考资料

- [C++23 工作草案：源文件包含](https://timsong-cpp.github.io/cppwp/n4950/cpp.include)
- [C++23 工作草案：条件包含](https://timsong-cpp.github.io/cppwp/n4950/cpp.cond)
- [GCC：头文件搜索路径](https://gcc.gnu.org/onlinedocs/cpp/Search-Path.html)
- [GCC：只包含一次的头文件](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html)
