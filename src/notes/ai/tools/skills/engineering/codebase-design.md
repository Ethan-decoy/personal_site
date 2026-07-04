---
title: codebase-design
date: 2026-07-04
---
# codebase-design

来源：[skills/engineering/codebase-design](https://github.com/mattpocock/skills/tree/main/skills/engineering/codebase-design)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=codebase-design
npx skills update codebase-design
```

## 它解决什么

`codebase-design` 提供一套谈论代码结构的共享语言，重点是 **深模块**：大量行为隐藏在小而稳定的接口后面，并且可以通过这个接口测试。

它不是一个重构流程，而是一个词汇层。它统一这些概念：module、interface、depth、seam、adapter、leverage、locality。

## 何时使用

当问题是“模块形状”时使用：

- 想设计或改善某个模块接口。
- 想判断接缝应该放在哪里。
- 想让代码更可测试、更容易被 Agent 导航。
- 架构讨论里术语混乱，例如 component、service、API、boundary 被混着用。

如果问题是业务领域术语，使用 `domain-modeling`。如果想扫描整个代码库，使用 `improve-codebase-architecture`。

## 深模块

深模块不是“内部代码很多”这么简单，而是调用方用很少的接口知识就能获得很多能力。浅模块则相反：接口几乎和实现一样复杂。

两个判断很实用：

- **删除测试**：假设删掉这个模块，复杂度是消失了，还是散落到多个调用方？
- **适配器数量**：一个 adapter 只是可能存在接缝，两个 adapter 才说明这个接缝真实存在。

## 接口就是测试面

这里的 interface 不只是 TypeScript 类型签名，还包括调用顺序、不变量、错误模式、性能承诺等调用方必须知道的事实。测试和调用方穿过同一条 seam，因此接口放得好，测试就能稳定地覆盖行为，而不是追着实现细节跑。

## 记忆点

代码设计先修词。词不准，模块边界就容易被切错。
