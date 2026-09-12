---
title: 16 · 类对象的销毁与资源生命周期
date: 2026-09-03
---

# 类对象的销毁与资源生命周期

[序列容器](../11-sequences-and-data-access/04-sequence-storage-and-reference-validity.md)已经提供了销毁时清理元素、释放所管理存储的契约。本章用登记与解除这类配对动作，说明类型怎样把清理交给对象销毁过程，以及这种责任为何需要与复制能力、外部对象的生命周期一起设计。

1. [析构函数与类对象销毁（Destructors and Class Object Destruction）](01-destructors-and-class-object-destruction.md)
2. [隐式析构函数与成员逆序销毁（Implicit Destructors and Reverse Member Destruction）](02-implicit-destructors-and-reverse-member-destruction.md)
3. [作用域绑定清理与 RAII（Scope-Bound Cleanup and RAII）](03-scope-bound-cleanup-and-raii.md)
4. [资源责任与复制能力的设计边界（Design Boundaries of Resource Responsibility and Copyability）](04-design-boundaries-of-resource-responsibility-and-copyability.md)
