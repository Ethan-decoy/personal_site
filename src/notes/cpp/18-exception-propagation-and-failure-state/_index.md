---
title: 18 · 异常传播与失败后的对象状态
date: 2026-09-12
---

# 异常传播与失败后的对象状态

一项操作执行到一半失败时，需要分别判断控制会转向哪里、已经建立的对象如何清理，以及已发生的修改是否保留。本章从异常的抛出与处理建立控制流，再解释异常展开、构造失败和操作的状态承诺。

异常展开能够调用析构完成资源清理，但原数据是否恢复取决于操作设计。需要判断失败后能否继续使用对象或重试时，可以查阅[失败后的对象状态与异常安全](04-failure-state-and-exception-safety.md)；需要判断异常能否越过函数边界时，可以查阅[noexcept 与操作的异常承诺](05-noexcept-and-operation-contracts.md)。

1. [异常的抛出、捕获与传播（Throwing, Catching, and Propagating Exceptions）](01-throwing-catching-and-propagating-exceptions.md)
2. [异常展开与作用域清理（Stack Unwinding and Scope Cleanup）](02-stack-unwinding-and-scope-cleanup.md)
3. [构造失败与成员清理（Construction Failure and Member Cleanup）](03-construction-failure-and-member-cleanup.md)
4. [失败后的对象状态与异常安全（Object State After Failure and Exception Safety）](04-failure-state-and-exception-safety.md)
5. [noexcept 与操作的异常承诺（noexcept and Exception Contracts）](05-noexcept-and-operation-contracts.md)