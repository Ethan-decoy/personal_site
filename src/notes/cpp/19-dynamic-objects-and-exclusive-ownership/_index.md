---
title: 19 · 动态对象与独占所有权
date: 2026-09-14
---

# 动态对象与独占所有权

一个对象需要由不同管理方先后负责清理时，可以让拥有者转交责任，同时保留被管理对象本身。本章从单个动态对象的创建建立这层关系，再解释所有权转移、借用有效期以及函数和成员中的责任边界。

需要判断移动后哪些指针仍然有效，可以查阅[所有权转移与对象身份](02-transferring-ownership-and-object-identity.md)和[动态对象的借用与访问有效性](03-borrowing-and-access-validity.md)；需要设计接收对象的接口，可以查阅[函数边界上的借用与所有权转交](04-ownership-at-function-boundaries.md)。直接保存普通对象和按值交付结果仍然是基础选择，独立所有权用于表达额外的生命周期或身份要求。

1. [动态对象的创建与独占管理（Creating and Exclusively Owning Dynamic Objects）](01-creating-and-owning-dynamic-objects.md)
2. [所有权转移与对象身份（Transferring Ownership and Object Identity）](02-transferring-ownership-and-object-identity.md)
3. [动态对象的借用与访问有效性（Borrowing Dynamic Objects and Access Validity）](03-borrowing-and-access-validity.md)
4. [函数边界上的借用与所有权转交（Borrowing and Ownership Transfer at Function Boundaries）](04-ownership-at-function-boundaries.md)
5. [独占所有者的组合与默认操作（Owning Members and Default Operations）](05-owning-members-and-default-operations.md)

附章[动态存储、对象构造与释放](deep-dives/01-dynamic-storage-construction-and-release.md)在上述拥有关系与失败清理的基础上，解释普通单对象的存储取得、构造、析构和存储归还。主线使用的失败契约已在相应正文说明，附章用于继续理解其机制。
