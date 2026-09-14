---
title: 17 · 右值引用与移动语义
date: 2026-09-05
---

# 右值引用与移动语义

本章从[复制与移动的不同任务](01-rvalue-references-and-xvalues.md#为什么复制之外还需要移动)解释为什么需要区分输入，再建立右值引用与表达式类别的关系。移动构造与赋值分别处理新对象和已有对象的责任，默认操作则把这些规则用于成员组合。

按值返回把对象的构造关系延伸到函数接口：结果可以直接构造，也可以从具名局部对象建立，需要区分语言保证、可选省略与隐式移动。设计篇据此收束责任、源状态、外部生命周期和实际成本的判断。

1. [右值引用与将亡值（Rvalue References and Xvalues）](01-rvalue-references-and-xvalues.md)
2. [std::move 与表达式类别转换（std::move and Expression Category Conversion）](02-std-move-and-expression-category-conversion.md)
3. [移动构造与资源责任转移（Move Construction and Resource Responsibility Transfer）](03-move-construction-and-resource-transfer.md)
4. [移动赋值与既有资源责任（Move Assignment and Existing Resource Responsibility）](04-move-assignment-and-existing-resource-responsibility.md)
5. [移动操作的生成与选择（Generation and Selection of Move Operations）](05-generation-and-selection-of-move-operations.md)
6. [按值返回与结果对象（Return by Value and Result Objects）](06-return-by-value-and-result-objects.md)
7. [返回局部对象与隐式移动（Returning Local Objects and Implicit Move）](07-returning-local-objects.md)
8. [移动接口的设计边界（Design Boundaries of Move Interfaces）](08-design-boundaries-of-move-interfaces.md)
