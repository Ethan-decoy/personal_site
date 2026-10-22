---
title: 编译并运行第一个 C++ 程序（Compiling and Running the First C++ Program）
date: 2026-08-08
order: 2
---

# 编译并运行第一个 C++ 程序（Compiling and Running the First C++ Program）

本篇以常见桌面系统中的终端程序为例，需要能够编辑纯文本的工具，以及一套在当前终端中可以调用、支持所用标准选项的 C++ 实现。文本编辑器（text editor）负责保存源代码，编译器驱动程序（compiler driver）负责读取源文件并生成能够运行的程序。

## 写入源文件

C++ 源文件（source file）首先是一份纯文本。下面的程序会输出一行 `Hello, C++!`，然后正常结束。新建文件，并将它保存为 `main.cpp`：

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, C++!\n";
    return 0;
}
```

`.cpp` 是开发者与工具普遍采用的 C++ 源文件扩展名。扩展名本身不会改变文件内容；它告诉编译器驱动程序和其他开发工具，应当把这份文本作为 C++ 源代码处理。

本例的用户代码从 `main` 的花括号内开始，依次执行两条语句。`std::cout << "Hello, C++!\n";` 把双引号中的文本写入标准输出（standard output），通常显示在终端；`\n` 使输出换行。`return 0;` 随后结束 `main`，用 `0` 表示成功。

> [!IMPORTANT] 程序入口、执行顺序与结束状态
> **本例的用户代码从 `main` 的花括号内开始，先输出问候文本，再用 `return 0;` 结束。输出内容与结束状态是不同结果：前者写向标准输出，后者向运行环境报告程序的终止状态。**因此，`0` 不会作为这条 `return` 语句的输出显示在终端。

上方的 `#include <iostream>` 使输出所需的 `std::cout` 名称可用。这里的 `<<` 负责输出；它的含义取决于当前使用位置，不能据此推断所有 `<<` 都是输出操作。

## 使用 GCC 编译

先在准备编译的终端中检查驱动是否可用：

```shell
g++ --version
```

这条命令显示驱动及其版本，不编译源文件。若终端提示找不到命令，需要先检查工具安装或终端配置；能够显示版本，才说明当前终端可以找到并运行这个驱动。下面的命令还要求当前 GCC 支持 `-std=c++23`，具体支持情况按安装版本查阅 [GCC 官方说明](https://gcc.gnu.org/projects/cxx-status.html#cxx23)。

在 `main.cpp` 所在目录打开命令行，执行：

```shell
g++ -std=c++23 -Wall -Wextra -Wpedantic main.cpp -o hello
```

编译命令成功完成后，会在当前目录生成可执行文件（executable file），也就是可以启动的程序。在 Linux 或 macOS 中运行：

```shell
./hello
```

在 Windows PowerShell 中，相应程序通常带有 `.exe` 扩展名：

```powershell
.\hello.exe
```

这里的 `./` 与 `.\` 都用于指定当前目录中的程序文件。

> [!IMPORTANT] 编译与运行分别处理什么
> **编译命令读取源文件并生成可执行文件；运行命令启动生成的可执行文件。**本例中，`main.cpp` 是编译输入，`hello` 或 `hello.exe` 是构建产物，也是随后运行命令要启动的文件。

程序会输出：

```text
Hello, C++!
```

随后光标移动到下一行，因为字符串末尾包含 `\n`。

编译命令中的 `g++` 是 GCC 的 C++ 编译器驱动程序，其余部分各有职责。具体选项的拼写和支持版本按所用驱动查阅，当前要辨认的是语言模式、诊断、输入与输出各自的作用：

- `-std=c++23` 选择本套笔记采用的 C++23 语言模式；
- `-Wall -Wextra -Wpedantic` 启用一组有助于发现可疑代码的诊断（diagnostic）；
- `main.cpp` 是输入的源文件；
- `-o hello` 指定生成程序的名称。

诊断是工具给出的检查信息，常见的有警告（warning）和错误（error）。

> [!IMPORTANT] 诊断信息与构建结果
> **警告可能伴随成功构建，错误则会使本次构建失败。**判断时应确认本次命令是否成功完成，并核对预期产物，不能仅凭终端是否出现提示文字作出结论。

### 修改后重新编译

> [!IMPORTANT] 修改源文件之后需要重新构建
> **源文件保存的是可编辑的程序文本，可执行文件保存的是某次编译生成的程序。修改并保存源文件，不会自动更新已有的可执行文件。**判断程序是否使用了本次修改时，需要确认对应构建已经成功完成。

例如，把 `main.cpp` 中的问候文本改成 `Welcome!` 并保存后，需要重新执行上面的编译命令。确认编译成功，再运行生成的程序，才会使用新的文字。

> [!WARNING]
> 编译失败后，先前生成的 `hello` 或 `hello.exe` 仍可能存在。它对应旧源码，再次运行它不能用来核对本次修改。应先根据错误信息修正源码或工具配置，确认本次编译成功，再运行新生成的程序。

## 对照代码的组成

下表用于阅读和修改这个程序时查阅各名称和符号的具体用法，不要求逐项背诵。核对时以当前使用位置为准，不把某个符号在本例中的含义推广到所有用法：

| 代码 | 当前需要知道的含义 |
| --- | --- |
| `#include <iostream>` | `#include` 是预处理指令（preprocessing directive）；这里使 `<iostream>` 提供的 `std::cout` 名称可用，本身不是运行时输出操作 |
| `int` | 指定 `main` 的返回类型（return type）为 `int`；这个整数用于表示程序终止状态 |
| `main` | 本例的入口函数（function）；程序启动后由 C++ 实现调用它，执行花括号内的代码 |
| `()` | `main` 的参数列表（parameter list）；这里没有写入任何参数 |
| `{` 与 `}` | 界定 `main` 的函数体（function body），也就是本例需要执行的两条语句 |
| `std::cout` | `std::` 表示这里使用标准库提供的名称；`std::cout` 是标准输出流对象（standard output stream object），写入其中的文本通常显示在终端 |
| `<<` | 在当前表达式中，把右侧内容写入左侧输出流 |
| `"Hello, C++!\n"` | 字符串字面量（string literal），表示需要输出的一串字符 |
| `\n` | 字符串中的转义序列（escape sequence），表示换行字符 |
| `;` | 结束当前的输出语句或 `return` 语句 |
| `return 0;` | 结束 `main`；返回值 `0` 表示程序成功终止 |

## Clang 与 MSVC 的对应命令

使用 Clang 时，先用 `clang++ --version` 确认当前终端可以调用驱动，并按安装版本核对 [C++23 支持情况](https://clang.llvm.org/cxx_status.html#cxx23)。随后可以使用同样的语言模式和警告选项：

```shell
clang++ -std=c++23 -Wall -Wextra -Wpedantic main.cpp -o hello
```

使用 MSVC 时，需要在已配置好的开发者命令提示符中调用 `cl`。下面的命令还要求该版本支持 `/std:c++23preview`；这个选项从 Visual Studio 2022 17.13 Preview 4 开始提供，使用前应按安装版本核对 [Microsoft 官方说明](https://learn.microsoft.com/en-us/cpp/build/reference/std-specify-language-standard-version)：

```shell
cl /std:c++23preview /W4 /EHsc main.cpp /Fe:hello.exe
```

`cl` 是 MSVC 的编译器驱动程序；`/W4` 启用较高警告级别，`/Fe:hello.exe` 指定生成程序的名称。本例还采用 `/EHsc`，为 C++ 异常处理（exception handling）提供相应的清理支持。异常处理是报告、传递并处理某类失败的机制；这个选项的具体适用条件，在需要调整失败处理配置时按 [Microsoft 的说明](https://learn.microsoft.com/en-us/cpp/build/reference/eh-exception-handling-model)查阅。

`/std:c++23preview` 中的 `preview` 表示相应 MSVC 版本以预览方式提供 C++23 支持；实际可用特性取决于安装的版本，不能把它理解成语言标准本身处于预览状态。编译器名称、标准模式、输入与输出文件的作用需要能够辨认；版本条件和选项细则在选择或调整工具配置时查阅。

## 编辑器、IDE 与编译器不是同一个角色

文本编辑器只需能够可靠地编辑和保存纯文本。集成开发环境（Integrated Development Environment，IDE）会进一步组织代码浏览、诊断和运行入口，也可以替我们调用编译器驱动程序。

> [!IMPORTANT] 编辑器、IDE 与 C++ 实现的职责
> **编辑器负责保存源代码，IDE 组织开发操作，所选 C++ 实现负责检查和翻译程序；IDE 本身不定义 C++ 语言规则。**因此，一个 `main.cpp` 可以换用不同编辑器编写，也可以交给 GCC、Clang 或 MSVC 检查和生成程序。判断语言规则与工具行为时，应核对实际采用的实现及其配置。

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
