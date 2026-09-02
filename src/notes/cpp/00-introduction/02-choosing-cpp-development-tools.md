---
title: 编译并运行第一个 C++ 程序（Compiling and Running the First C++ Program）
date: 2026-08-08
order: 2
---

# 编译并运行第一个 C++ 程序（Compiling and Running the First C++ Program）

运行一个最小 C++ 程序只需要两个基本条件：能够编辑纯文本的工具，以及一套已经安装好的 C++ 实现。文本编辑器（text editor）负责保存源代码，编译器驱动程序（compiler driver）负责读取源文件并生成能够运行的程序。

## 写入源文件

C++ 源文件（source file）首先是一份纯文本。新建下面的文件，并将它保存为 `main.cpp`：

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, C++!\n";
    return 0;
}
```

`.cpp` 是开发者与工具普遍采用的 C++ 源文件扩展名。扩展名本身不会改变文件内容；它告诉编译器驱动程序和其他开发工具，应当把这份文本作为 C++ 源代码处理。

## 先建立程序的最小契约

下表给出判断本例构建与运行结果所需的使用契约。

| 代码 | 当前需要知道的含义 |
| --- | --- |
| `#include <iostream>` | `#include` 是预处理指令（preprocessing directive）；这里使 `<iostream>` 提供的 `std::cout` 名称可用，本身不是运行时输出操作 |
| `int` | 指定 `main` 的返回类型（return type）为 `int`；这个整数用于表示程序终止状态 |
| `main` | 托管实现（hosted implementation）按照特殊规则调用的函数（function）；本例的用户代码从它的函数体开始执行 |
| `()` | `main` 的参数列表（parameter list）；这里没有写入任何参数 |
| `{` 与 `}` | 界定 `main` 的函数体（function body），也就是本例需要执行的两条语句 |
| `std::cout` | `std::` 表示这里使用标准库提供的名称；`std::cout` 是标准输出流对象（standard output stream object），写入其中的文本通常显示在终端 |
| `<<` | 在当前表达式中，把右侧内容写入左侧输出流 |
| `"Hello, C++!\n"` | 字符串字面量（string literal），表示需要输出的一串字符 |
| `\n` | 字符串中的转义序列（escape sequence），表示换行字符 |
| `;` | 结束当前的输出语句或 `return` 语句 |
| `return 0;` | 结束 `main`；返回值 `0` 表示程序成功终止 |

这些说明是足以运行当前程序的使用契约。例如，`<<` 在这里负责输出，并不表示它在所有 C++ 表达式中都具有同一种作用。

## 使用 GCC 编译

在 `main.cpp` 所在目录打开命令行，执行：

```shell
g++ -std=c++23 -Wall -Wextra -Wpedantic main.cpp -o hello
```

这里，`g++` 是 GCC 的 C++ 编译器驱动程序：

- `-std=c++23` 选择本套笔记采用的 C++23 语言模式；
- `-Wall -Wextra -Wpedantic` 启用一组有助于发现可疑代码的诊断（diagnostic）；
- `main.cpp` 是输入的源文件；
- `-o hello` 指定生成程序的名称。

命令成功完成后，在 Linux 或 macOS 中运行：

```shell
./hello
```

在 Windows PowerShell 中，相应程序通常带有 `.exe` 扩展名：

```powershell
.\hello.exe
```

程序会输出：

```text
Hello, C++!
```

随后光标移动到下一行，因为字符串末尾包含 `\n`。

## Clang 与 MSVC 的对应命令

已经安装 Clang 时，可以使用同样的语言模式和警告选项：

```shell
clang++ -std=c++23 -Wall -Wextra -Wpedantic main.cpp -o hello
```

在已经配置好 MSVC 的开发者命令提示符中，可以使用：

```shell
cl /std:c++23preview /W4 /EHsc main.cpp /Fe:hello.exe
```

`cl` 是 MSVC 的编译器驱动程序；`/W4` 启用较高警告级别，`/EHsc` 启用标准 C++ 异常处理模型（exception handling model），`/Fe:hello.exe` 指定生成程序的名称。

MSVC 当前把仅启用 C++23 特性的模式命名为 `/std:c++23preview`。这个名称表示 MSVC 仍以预览方式提供 C++23 支持；实际可用特性取决于安装的 MSVC 版本，不能把它理解成语言标准本身处于预览状态。

## 编辑器、IDE 与编译器不是同一个角色

文本编辑器只需能够可靠地编辑和保存纯文本。集成开发环境（Integrated Development Environment，IDE）会进一步组织代码浏览、诊断和运行入口，也可以替我们调用编译器驱动程序。

**无论命令来自终端还是 IDE 的按钮，判断 C++ 源代码并生成程序的仍然是所选 C++ 实现；IDE 本身不定义 C++ 语言规则。**因此，一个 `main.cpp` 可以换用不同编辑器编写，也可以交给 GCC、Clang 或 MSVC 检查和生成程序。

## 参考资料

- [C++23 工作草案：`main` 函数](https://timsong-cpp.github.io/cppwp/n4950/basic.start.main)
- [C++23 工作草案：标准输出流对象](https://timsong-cpp.github.io/cppwp/n4950/iostream.objects)
- [C++23 工作草案：源文件包含](https://timsong-cpp.github.io/cppwp/n4950/cpp.include)
- [GCC：C++ 语言模式选项](https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html)
- [GCC：警告选项](https://gcc.gnu.org/onlinedocs/gcc/Warning-Options.html)
- [GCC：输出类型与构建阶段选项](https://gcc.gnu.org/onlinedocs/gcc/Overall-Options.html)
- [Clang：编译器用户手册](https://clang.llvm.org/docs/UsersManual.html)
- [Microsoft：`/std` 语言标准模式](https://learn.microsoft.com/en-us/cpp/build/reference/std-specify-language-standard-version)
- [Microsoft：`/W4` 警告级别](https://learn.microsoft.com/en-us/cpp/build/reference/compiler-option-warning-level)
- [Microsoft：`/EH` 异常处理模型](https://learn.microsoft.com/en-us/cpp/build/reference/eh-exception-handling-model)
- [Microsoft：`/Fe` 可执行文件名称](https://learn.microsoft.com/en-us/cpp/build/reference/fe-name-exe-file)
