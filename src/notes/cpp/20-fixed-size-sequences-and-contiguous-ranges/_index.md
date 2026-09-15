---
title: 20 · 固定长度序列与连续范围
date: 2026-09-15
---

# 固定长度序列与连续范围

一组连续元素可以由固定长度的数组保存，也可以由能够增减元素的容器管理；处理这些元素的函数，则未必需要接管其中任何一种拥有者。本章把元素的保存、范围的传递和访问有效期连起来，建立固定数组与范围借用的接口模型。

`std::array` 表达“拥有固定数量的元素”，`std::span` 表达“借用从某个位置开始的一段元素”。这项区别决定了复制会做多少工作、修改会落在哪个对象上，以及函数返回后访问能否继续成立。

1. [固定长度序列与数组对象（Fixed-Size Sequences and Array Objects）](01-fixed-size-sequences-and-array-objects.md)
2. [连续范围与 span 借用（Contiguous Ranges and Borrowing with span）](02-borrowing-contiguous-ranges-with-span.md)
3. [视图的复制与元素访问（Copying Views and Accessing Elements）](03-copying-views-and-element-access.md)
4. [子范围与区间边界（Subranges and Interval Boundaries）](04-subranges-and-interval-boundaries.md)
5. [范围借用的有效期与接口边界（Range Lifetimes and Interface Boundaries）](05-range-lifetimes-and-interface-boundaries.md)

查询视图赋值、两层 `const` 的区别，可以定位到第三篇；查询截取范围的下标和检查条件，可以定位到第四篇；涉及容器扩容、临时对象或返回视图时，应同时核对第五篇的有效期条件。

附章在完整的范围借用模型之后，解释[内置数组与指针转换](deep-dives/01-built-in-arrays-and-pointer-conversion.md)，再建立[连续存储与指针运算](deep-dives/02-contiguous-storage-and-pointer-arithmetic.md)的规则。它们用于理解语言机制和接入指针接口；主线所需的边界与生命周期条件已在相应正文给出。
