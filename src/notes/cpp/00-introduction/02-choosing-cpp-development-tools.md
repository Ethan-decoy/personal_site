---
title: 选择 C++ 开发工具
date: 2026-08-08
---

# 选择 C++ 开发工具

认识 C++ 以后，是时候选择一套趁手的工具，让第一段代码真正运行起来了。

不过在选择工具以前，不妨先把开发环境缩减到最小。要写出并运行一个 C++ 程序，我们真正需要的只有两样东西：一个能够编辑纯文本的程序，以及一个 C++ 编译器。

## 从纯文本开始

C++ 源代码首先只是一段文本。我们完全可以打开系统自带的文本编辑器，写下下面的内容：

```cpp
#include <iostream>

int main()
{
    std::cout << "Hello, C++!\n";
}
```

把文件保存为 `main.cpp`，它便成为了一个 C++ 源文件。从内容上看，`main.cpp` 和 `main.txt` 都是普通的文本文件；`.cpp` 这个扩展名只是在告诉开发者和工具：“请把这份文本当作 C++ 源代码处理。”

随着程序逐渐变大，我们还会见到 `.h` 或 `.hpp` 文件。它们通常用来存放需要被多份源文件共享的声明，称为头文件。文件扩展名本身不会赋予代码特殊能力，C++ 标准也没有强制规定这些扩展名；它们是开发工具普遍遵循的约定。一个最小程序只需要 `main.cpp`，并不需要为了形式再创建头文件。

## 在命令行完成第一次编译

源文件只是写给人和编译器阅读的文本，不能被计算机直接执行。我们还需要编译器把它翻译成可执行程序。

以已经安装 GCC 的环境为例，可以在命令行中执行：

```shell
g++ main.cpp -o hello
```

这里，`g++` 是 GCC 的 C++ 编译器驱动程序，`main.cpp` 是输入文件，`-o hello` 指定输出程序的名称。`g++` 会替我们依次调用所需工具，因此一条命令就能完成从源代码到可执行程序的整个过程。

日常交流中，我们经常把这整个过程统称为“编译”。如果拆开来看，它包含四个主要阶段：

```text
main.cpp
   │  预处理
   ▼
main.ii
   │  编译
   ▼
main.s
   │  汇编
   ▼
main.o
   │  链接
   ▼
hello 或 hello.exe
```

1. **预处理**：处理以 `#` 开头的预处理指令，例如展开 `#include` 引入的头文件、替换宏，以及根据条件决定保留哪些代码。结果仍然是 C++ 文本，只是已经为真正的编译做好准备。
2. **编译**：检查代码的语法和语义，并将 C++ 转换成面向目标处理器的汇编代码。优化通常也发生在这一阶段。
3. **汇编**：把汇编代码转换成目标文件。目标文件已经包含二进制机器码，还记录着尚待确定的符号和地址，因此通常不能独立运行。
4. **链接**：把一个或多个目标文件与所需的库组合起来，解析它们之间的引用，最终生成完整的可执行程序。

通常不需要手动执行这些阶段，但 GCC 允许我们停在每一步，观察相应的中间产物：

```shell
g++ -E main.cpp -o main.ii  # 只完成预处理
g++ -S main.ii -o main.s    # 编译为汇编代码
g++ -c main.s -o main.o     # 汇编为目标文件
g++ main.o -o hello         # 链接为可执行程序
```

因此，“生成二进制”并不是最后一刻才突然发生：`main.o` 已经是二进制目标文件，只是要经过链接，才会成为可以直接启动的 `hello`。完整命令执行成功后，可以运行它：

```shell
# Linux 或 macOS
./hello

# Windows
.\hello.exe
```

到这里，整个过程都没有用到 IDE：文本编辑器负责写入源代码，编译器负责产生程序，命令行负责让我们明确地调用它们。

## 三种主流 C++ 编译器

C++ 由标准规定语言应当具有什么行为，再由不同厂商和开源项目实现。今天最常见的三套编译器是 GCC、Clang 和 MSVC。

C++ 标准主要通过一台抽象机器（abstract machine）描述程序的语义与可观察行为，而不要求每个编译器采用完全相同的内部结构、优化方式或机器指令。只要满足标准规定的要求，并遵守标准明确留给实现选择的部分，GCC、Clang 和 MSVC 就可以采用不同方式实现同一门语言。

公开的 [C++ 工作草案](https://eel.is/c%2B%2Bdraft/#intro.defs) 可以直接查阅标准使用的术语与语言规则；其中的[抽象机器与程序执行](https://eel.is/c%2B%2Bdraft/intro.abstract)进一步说明了标准如何描述程序行为。这个网站提供的是工作草案的网页版本，并不是 ISO 正式出版的 C++ 标准文本。

| 编译器 | 常用命令 | 常见环境 | 特点 |
| --- | --- | --- | --- |
| [GCC](https://gcc.gnu.org/) | `g++` | Linux，也可用于 Windows 和其他平台 | 历史悠久、开源，广泛用于 Linux、服务器和跨平台项目 |
| [Clang](https://clang.llvm.org/) | `clang++` | macOS、Linux，也支持 Windows | 属于 LLVM 生态，重视诊断信息，并为许多代码分析工具提供基础 |
| [MSVC](https://learn.microsoft.com/en-us/cpp/build/reference/compiling-a-c-cpp-program) | `cl` | Windows | 与 Windows SDK 和微软工具链结合紧密，也是 Visual Studio 默认使用的 C++ 编译器 |

同一个 `main.cpp` 可以分别交给它们处理：

```shell
# GCC
g++ main.cpp -o hello

# Clang
clang++ main.cpp -o hello

# MSVC，需要在配置好 MSVC 环境的命令行中执行
cl /EHsc main.cpp /Fe:hello.exe
```

三者都在实现同一门 C++，但它们支持新标准的进度、诊断信息、扩展功能、优化方式以及与操作系统的结合并不完全相同。因此，“使用哪一个编译器”通常不是单纯的排行榜问题：Windows 原生开发经常选择 MSVC，Linux 上常见 GCC 和 Clang，macOS 则通常使用 Apple 提供的 Clang；需要跨平台交付的项目还会主动使用多种编译器验证代码。

## IDE（集成开发环境）

真实的 C++ 工程不只有代码编辑和编译，还需要项目浏览、语义分析、格式化、构建与调试。IDE（Integrated Development Environment）把这些能力组织到同一个工作界面中，但它本身并不等同于编译器：IDE 负责连接和调度工具，编译器负责生成程序。

Visual Studio 和 CLion 属于集成程度较高的传统 IDE。[Visual Studio Code](https://code.visualstudio.com/) 的产品定位更接近可扩展编辑器，但它能够自由组合语言服务、格式化工具、编译器和调试器，实际承担一套模块化 IDE 的入口。工具之间边界清晰，也意味着更换编译器时不必连同编辑环境一起更换。

以 VS Code 为主体，C++ 开发能力由扩展接入：

| VS Code 扩展 | 连接的外部工具 | 职责 |
| --- | --- | --- |
| [clangd](https://marketplace.visualstudio.com/items?itemName=llvm-vs-code-extensions.vscode-clangd) | clangd 语言服务器 | 提供补全、跳转、重命名、即时诊断和代码格式化 |
| [CMake Tools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools) | CMake 与实际构建工具链 | 在 VS Code 中配置和构建 CMake 项目，并提供 CMake 语言支持 |

CMake 和 GCC 都是安装在系统中的独立工具，不是 VS Code 扩展。CMake Tools 只是把 CMake 的工作流程接入 VS Code，真正的编译和链接仍由 GCC 完成。类似地，clangd 扩展负责连接 clangd 语言服务器；clangd 已经内嵌 clang-format 的格式化能力，并读取项目中的 `.clang-format` 规则，因此不需要额外安装格式化扩展。

只有一个 `main.cpp` 时，直接执行 `g++ main.cpp -o hello` 已经足够。工程包含多个源文件或第三方库以后，CMake 可以将源文件、编译选项和依赖记录为统一的项目配置，再生成实际构建所需的规则。
