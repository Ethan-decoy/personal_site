---
title: 编译模型与项目骨架
date: 2026-07-09
---

# 编译模型与项目骨架

## 从源码到可执行程序

C++ 不是直接运行源码的语言。一个 `.cpp` 文件通常要经过：

```text
.cpp 源文件
-> 预处理：处理 #include、#define，去掉注释
-> 编译：检查语法、类型，把 C++ 翻译成汇编
-> 汇编：把汇编翻译成 .o/.obj 目标文件
-> 链接：把多个目标文件和库合成最终可执行程序
```

`.o` 或 `.obj` 已经是二进制目标文件，但通常还不是最终可执行程序。链接器还需要把代码里引用到的函数、变量，和真正的定义匹配起来。

## 从命令判断构建目标

编译并链接可执行程序时，最终需要能找到 `main()`：

```bash
g++ main.cpp add.cpp -o app
```

也可以分步构建：

```bash
g++ -c main.cpp
g++ -c add.cpp
g++ main.o add.o -o app
```

`-c` 只编译，不链接，所以它只生成目标文件，不要求有 `main()`。

```bash
g++ -c add.cpp
```

生成静态库也不要求有 `main()`：

```bash
ar rcs libadd.a add.o
```

`libadd.a` 是一包目标文件的归档，不是最终可执行程序。它会在之后被别的程序链接使用。

## 编译错误和链接错误

编译错误发生在编译器处理当前翻译单元时。典型原因是语法错误、类型错误、名字在当前上下文不可见。

```cpp
int main() {
    int x = ;
}
```

这会产生编译错误，因为 `=` 右侧缺少表达式，是语法错误。

链接错误发生在目标文件已经生成之后。典型原因是某个函数或变量已经被声明并使用，但最终没有找到对应定义。

```cpp
void hello();

int main() {
    hello();
}
```

这通常不是编译错误。`void hello();` 已经告诉编译器 `hello` 的名字、参数和返回类型，所以调用本身可以通过编译。真正的问题在链接阶段：如果全项目没有 `hello` 的函数体，链接器会报类似 `undefined reference to hello` 或 `unresolved external symbol hello` 的错误。

## 多文件项目里的链接错误

`main.cpp`：

```cpp
void print();

int main() {
    print();
}
```

`print.cpp`：

```cpp
#include <iostream>

void print() {
    std::cout << "hi\n";
}
```

如果只把 `main.cpp` 交给编译器和链接器，而漏掉 `print.cpp`，仍然会出现链接错误。因为 `print` 的声明在 `main.cpp` 中可见，但 `print.cpp` 里的定义没有参与最终链接。

## 诊断编译错误

编译错误通常会直接给出文件、行列、`error` 和源码位置。

```text
main.cpp: In function 'int main()':
main.cpp:4:13: error: expected primary-expression before ';' token
    int x = ;
            ^
```

这不是链接问题。`main.cpp:4:13` 表示 `main.cpp` 第 4 行第 13 列；`expected primary-expression before ';' token` 表示在 `;` 前面期待一个表达式。源码箭头也指向 `=` 后面缺少表达式的位置。

另一种常见编译错误是名字拼错或名字不可见：

```text
main.cpp: In function 'int main()':
main.cpp:6:5: error: 'pritn' was not declared in this scope; did you mean 'print'?
    pritn();
    ^~~~~
    print
```

这里 `pritn` 在当前作用域里找不到，编译器甚至提示可能想写 `print`。修复方向是先改拼写，或确认正确的声明在当前翻译单元可见，而不是调整链接命令。

## 诊断链接错误

看到 `undefined reference`、`ld returned`、`/usr/bin/ld` 这类关键词，优先判断为链接错误。

```text
main.o: in function `main':
main.cpp:(.text+0x15): undefined reference to `add(int, int)'
collect2: error: ld returned 1 exit status
```

这里的含义是：`main.o` 里引用了 `add(int, int)`，但链接器收到的 `.o` 文件或库里没有找到它的定义。

修复方向通常是把包含定义的 `.cpp`、`.o` 或库加入链接命令：

```bash
g++ main.cpp add.cpp -o app
```

或：

```bash
g++ -c main.cpp
g++ -c add.cpp
g++ main.o add.o -o app
```

不要优先去改头文件，也不要以为多 `#include` 一次就能解决。头文件里的声明只是让编译器知道函数长什么样；链接器需要的是真正的定义。

注意：`ld` 是小写 `L` 开头，不是 `Id`。它指向 linker/loader 相关工具。

## 声明和定义

声明告诉编译器：这个名字存在，类型长这样。

```cpp
int add(int a, int b);
extern int score;
```

定义真正提供函数体，或真正创建对象。

```cpp
int add(int a, int b) {
    return a + b;
}

int score = 10;
```

函数可以被声明多次，但通常只能有一个定义。变量更容易混淆：在全局作用域里，`int score;` 通常是定义；`extern int score;` 才是只声明不定义。

## 头文件里通常放什么

头文件通常放声明，让多个 `.cpp` 文件知道某个函数或变量的存在：

```cpp
// math_utils.h
int add(int a, int b);
```

函数定义通常放在 `.cpp` 文件里：

```cpp
// math_utils.cpp
#include "math_utils.h"

int add(int a, int b) {
    return a + b;
}
```

这样做的核心原因是：头文件会被多个 `.cpp` 通过 `#include` 展开。如果把普通函数定义直接写进头文件，多个 `.cpp` 同时包含它时，就可能在链接阶段出现重复定义错误。

例外情况包括 `inline` 函数、模板、类内定义等，但学习初期先记住默认规则：头文件放声明，源文件放普通函数和全局变量的定义。

## 易混点

- `void hello();` 是函数声明，不是函数定义。
- 声明了函数但没有实现，通常是链接错误，不是未定义行为。
- 未定义行为是程序已经能编译、链接、运行，但 C++ 标准不规定运行结果，例如越界访问数组。
- `.o` 和 `.obj` 是目标文件，不等于最终可执行程序。
- 定义通常也是声明，因为它也告诉了编译器名字和类型；但声明不一定是定义。
- 看到 `expected ... before ';' token`：优先看源码对应位置，通常是语法错误。
- 看到 `was not declared in this scope`：当前翻译单元里找不到这个名字，通常是拼写、作用域或缺声明。
- 看到 `undefined reference`：有声明、有引用，但链接器找不到定义。
- 看到 `/usr/bin/ld` 或 `ld returned`：链接阶段失败。
- 看到 `ar rcs libxxx.a xxx.o`：在打包静态库，不是在生成可执行程序。
