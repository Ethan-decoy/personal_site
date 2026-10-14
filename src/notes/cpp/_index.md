---
title: C++
date: 2026-08-08
sidebarGroups: headings
---

# C++

这组笔记从表达式与对象关系出发，逐步建立接口、资源和程序边界的判断能力，最后用一个完整程序组合这些关系。

首次阅读可以沿主线建立模型；查阅具体问题时，从对应章节进入，并按正文引用补齐当前前提。附章用于按需解释表示、机制和更精细的规则，实际阅读前置以该篇说明为准。

## 01 · 语言与程序基础

1. [C++ 导论](00-introduction/_index.md)
2. [对象、类型与变量](01-objects-types-and-variables/_index.md)
3. [表达式与运算符](02-expressions-and-operators/_index.md)
4. [代码块、作用域与生命周期](03-blocks-scope-and-lifetime/_index.md)
5. [控制流](04-control-flow/_index.md)
6. [函数](05-functions/_index.md)
7. [常量、字面量与类型转换](06-constants-literals-and-type-conversions/_index.md)

## 02 · 对象访问与类接口

8. [对象地址与指针](07-object-addresses-and-pointers/_index.md)
9. [对象身份与左值引用](08-object-identity-and-lvalue-references/_index.md)
10. [结构体与对象组合](09-structures-and-object-composition/_index.md)
11. [类的接口与封装](10-class-interfaces-and-encapsulation/_index.md)
12. [序列与数据访问](11-sequences-and-data-access/_index.md)

## 03 · 重载与类型转换

13. [函数重载与重载决议](12-function-overloading-and-overload-resolution/_index.md)
14. [运算符重载与表达式语义](13-operator-overloading-and-expression-semantics/_index.md)
15. [用户定义转换与显式接口](14-user-defined-conversions-and-explicit-interfaces/_index.md)

## 04 · 复制、移动与资源管理

16. [类对象的复制与复制能力](15-copying-class-objects-and-copyability/_index.md)
17. [类对象的销毁与资源生命周期](16-class-object-destruction-and-resource-lifetime/_index.md)
18. [右值引用与移动语义](17-rvalue-references-and-move-semantics/_index.md)
19. [异常传播与失败后的对象状态](18-exception-propagation-and-failure-state/_index.md)
20. [动态对象与独占所有权](19-dynamic-objects-and-exclusive-ownership/_index.md)

## 05 · 数据组织与处理

21. [固定长度序列与连续范围](20-fixed-size-sequences-and-contiguous-ranges/_index.md)
22. [文本的保存与借用](21-text-ownership-and-borrowing/_index.md)
23. [迭代器、区间与算法](22-iterators-ranges-and-algorithms/_index.md)
24. [可调用对象与 Lambda 表达式](23-callable-objects-and-lambda-expressions/_index.md)
25. [排序、比较关系与有序查找](24-sorting-ordering-and-ordered-search/_index.md)
26. [可选值与缺失状态](25-optional-values-and-absence/_index.md)
27. [按键组织数据与有序映射](26-keyed-data-and-ordered-maps/_index.md)
28. [哈希组织与无序映射](27-hashing-and-unordered-maps/_index.md)

## 06 · 名称与程序组织

29. [命名空间与名称查找](28-namespaces-and-name-lookup/_index.md)
30. [头文件与多文件程序](29-headers-and-multi-file-programs/_index.md)
31. [跨文件对象与初始化](30-shared-objects-and-initialization/_index.md)

## 07 · 泛型与编译期编程

32. [函数模板与类型推导](31-function-templates-and-type-deduction/_index.md)
33. [类模板与泛型类型](32-class-templates-and-generic-types/_index.md)
34. [模板约束与概念](33-template-constraints-and-concepts/_index.md)
35. [表达式类型与泛型转发](34-expression-types-and-forwarding/_index.md)
36. [常量求值与编译期分支](35-constant-evaluation-and-compile-time-branches/_index.md)

## 08 · 对象抽象与运行时多态

37. [继承与运行时多态](36-inheritance-and-runtime-polymorphism/_index.md)
38. [运行时类型与继承接口](37-runtime-types-and-inheritance-interfaces/_index.md)

## 09 · 状态、行为与共享资源

39. [具名状态与多种可能值](38-named-states-and-alternative-values/_index.md)
40. [显式结果与错误契约](39-explicit-results-and-error-contracts/_index.md)
41. [可调用接口与行为保存](40-callable-interfaces-and-behavior-storage/_index.md)
42. [共享所有权与弱引用](41-shared-ownership-and-weak-references/_index.md)

## 10 · 值接口、泛型组合与范围

43. [值类型接口与不变式](42-value-type-interfaces-and-invariants/_index.md)
44. [泛型组合与模板规则](43-generic-composition-and-template-rules/_index.md)
45. [范围变换与延迟视图](44-range-transformations-and-lazy-views/_index.md)
46. [容器选择与成本契约](45-container-selection-and-cost-contracts/_index.md)

## 11 · 外部数据与基础设施

47. [文本输入、解析与格式化](46-text-input-parsing-and-formatting/_index.md)
48. [文件、路径与外部失败](47-files-paths-and-external-failures/_index.md)
49. [时间、数值与随机性](48-time-numbers-and-randomness/_index.md)

## 12 · 并发与协程

50. [线程与同步](49-threads-and-synchronization/_index.md)
51. [任务与异步结果](50-tasks-and-asynchronous-results/_index.md)
52. [原子操作与内存序](51-atomic-operations-and-memory-order/_index.md)
53. [协程与暂停的生命周期](52-coroutines-and-suspended-lifetimes/_index.md)

## 13 · 程序边界与工程综合

54. [实现边界与模块](53-implementation-boundaries-and-modules/_index.md)
55. [对象表示与存储边界](54-object-representation-and-storage-boundaries/_index.md)
56. [构建、验证与性能判断](55-building-validation-and-performance/_index.md)
57. [组合一个完整程序](56-composing-a-complete-program/_index.md)
