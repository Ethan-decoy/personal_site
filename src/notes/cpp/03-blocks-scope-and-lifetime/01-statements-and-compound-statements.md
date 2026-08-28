---
title: 语句与复合语句（Statements and Compound Statements）
date: 2026-08-26
---

# 语句与复合语句（Statements and Compound Statements）

前两章已经分别建立了变量声明与表达式语句。变量声明出现在允许写语句的位置时，构成声明语句（declaration statement）；表达式后接分号构成表达式语句（expression statement）。**语句（statement）是 C++ 描述程序执行过程的基本语法单位。**C++ 还允许把一组语句组织成一个仍然只占据一条语句位置的整体。

## 复合语句与代码块（Compound Statements and Blocks）

在允许出现语句的位置，下面的片段可以作为一个整体嵌入：

```cpp
{
    int remaining_count{3};
    remaining_count += 1;
}
```

第一行是声明语句，第二行是表达式语句；包括花括号在内的整个结构本身也是一条语句。**由一对花括号包围、把零条或多条语句组成一条语句的结构称为复合语句（compound statement），也称为代码块（block）。**

代码块不会改变内部语句各自的语法。声明语句和表达式语句仍然以分号结束；复合语句本身由右花括号 `}` 结束，后面不再添加分号。没有包含任何语句的 `{}` 也是合法的空复合语句。

**复合语句的关键不只是使用花括号排版，而是它在语法上把整个语句序列组合成一条语句。**换行和缩进帮助人阅读结构，却不能代替语句自身需要的分号与花括号。

## 花括号的含义取决于语法位置

同一种符号可以参与不同的语法结构。在前面的片段中，最外层花括号出现在能够容纳语句的位置，因此构成复合语句；`remaining_count` 后面的 `{3}` 出现在变量声明的初始化位置，因此是初始化器。

**花括号本身不能决定语义，必须结合所在的语法位置判断。**初始化器建立对象的初始状态，复合语句则组织语句；两者不会因为都使用 `{}` 而成为同一种结构。

## 嵌套代码块

复合语句本身是一条语句，因此可以出现在另一个复合语句内部：

```cpp
{
    int tire_count{4};

    {
        int damaged_count{1};
        damaged_count += 1;
    }

    tire_count += 1;
}
```

这里的外层与内层花括号分别形成一个代码块。缩进呈现了它们的嵌套关系，但真正建立边界的是源代码中的花括号。

## 参考资料

- [C++23 工作草案：语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.pre)
- [C++23 工作草案：复合语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.block)
- [C++23 工作草案：声明语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
