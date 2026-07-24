---
title: C++
date: 2026-07-23
---

# C++

这里整理现代 C++ 的语言语义、函数设计、编译模型、验证方法与构建工具。

物理目录按知识主题分类；下面的“建议学习顺序”只负责说明依赖关系，不再用学习阶段代替知识类别。

## 按主题查阅

- [语言基础](language-basics/_index.md)：对象、类型、条件、作用域、循环、`const` 与引用。
- [函数与契约](functions/_index.md)：值传递、接口设计、前置条件与 `std::optional`。
- [编译与程序结构](compilation/_index.md)：源码到可执行文件、翻译单元、头文件与 ODR。
- [测试](testing/_index.md)：从规格推导行为区域、边界检查与回归保护。
- [诊断](diagnostics/_index.md)：故障分级、最小复现、调试器与 sanitizer。
- [CMake](cmake/_index.md)：target、库和使用要求传播。
- [工具与环境](tooling/_index.md)：编辑器、生成器、编译器和本机环境排障。

## 建议学习顺序

1. 先阅读[源码到可执行文件](compilation/source-to-executable.md)，建立编译与链接的整体模型。
2. 按[语言基础](language-basics/_index.md)目录掌握小程序所需的核心语义。
3. 进入[函数与契约](functions/_index.md)，学习怎样表达输入、结果、失败和副作用。
4. 学习[翻译单元、头文件、命名空间与 ODR](compilation/translation-units-headers-namespaces-and-odr.md)，把程序拆成多个源文件。
5. 使用[CMake](cmake/_index.md)描述目标和依赖关系。
6. 使用[测试](testing/_index.md)把规格转换为可重复检查。

[诊断](diagnostics/_index.md)和[工具与环境](tooling/_index.md)不必等到固定阶段；遇到构建失败、运行期故障或环境问题时按需查阅。
