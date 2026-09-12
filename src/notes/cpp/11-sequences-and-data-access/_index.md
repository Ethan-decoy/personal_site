---
title: 11 · 序列与数据访问
date: 2026-09-11
---

# 序列与数据访问

一组连续采样值需要统一保存和处理。`std::vector<double>` 提供这样的序列对象：它管理元素，调用者通过公开操作读取、修改和追加数据。使用它需要理解元素访问、复制关系和有效性条件，无需先自行实现存储管理。

本章先建立序列的使用契约，再用同一组数据比较独立副本与访问原对象，最后解释数量变化怎样影响已取得的元素引用。成本判断由这些实际操作产生：需要独立数据时建立副本，只需访问原数据时保留访问关系；两种选择承担不同的工作与依赖。

1. [序列对象与元素访问（Sequence Objects and Element Access）](01-vectors-and-element-access.md)
2. [序列遍历与元素修改（Sequence Traversal and Element Updates）](02-sequence-traversal-and-element-updates.md)
3. [序列复制与函数访问（Sequence Copying and Function Access）](03-sequence-copying-and-function-access.md)
4. [序列存储与引用有效性（Sequence Storage and Reference Validity）](04-sequence-storage-and-reference-validity.md)
