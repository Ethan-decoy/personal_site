---
title: 17 · 右值引用与移动语义
date: 2026-09-05
---

# 右值引用与移动语义

本章先从[复制与移动的不同任务](01-rvalue-references-and-xvalues.md#为什么复制之外还需要移动)解释为什么需要区分输入，再建立右值引用与表达式类别的关系。[采样序列的移动构造](03-move-construction-and-resource-transfer.md#从序列副本到已有元素的接管)回到已建立的序列存储模型，说明接管已有元素如何减少工作，移动赋值与设计篇则讨论已有责任和使用边界。

1. [右值引用与将亡值（Rvalue References and Xvalues）](01-rvalue-references-and-xvalues.md)
2. [std::move 与表达式类别转换（std::move and Expression Category Conversion）](02-std-move-and-expression-category-conversion.md)
3. [移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）](03-move-construction-and-resource-transfer.md)
4. [移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）](04-move-assignment-and-existing-resource-responsibility.md)
5. [移动操作的生成与选择（Generation and Selection of Move Operations）](05-generation-and-selection-of-move-operations.md)
6. [移动接口的设计边界（Design Boundaries of Move Interfaces）](06-design-boundaries-of-move-interfaces.md)
