---
title: ask-matt
date: 2026-07-04
---
# ask-matt

来源：[skills/engineering/ask-matt](https://github.com/mattpocock/skills/tree/main/skills/engineering/ask-matt)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=ask-matt
npx skills update ask-matt
```

## 它解决什么

`ask-matt` 是整套技能的路由器。你把当前处境告诉它，它判断应该使用哪个技能、按什么顺序使用。

它本身不写代码、不拷问计划、不生成 PRD，也不修复问题。它只负责定向，尤其帮助你记住那些只能用户主动调用的技能。

## 何时使用

当你不知道从哪里开始时使用它：

- 有一个想法，但不确定该先拷问、写 PRD 还是直接做原型。
- 有一堆 bug 报告，不知道该走 `triage` 还是 `diagnosing-bugs`。
- 两个技能看起来相似，需要区分它们的边界。

如果已经确定要用哪个技能，就直接调用那个技能，不必经过路由器。

## 关键模型：flow

它给你的不是单个工具名，而是一条 flow。多数工程工作会落到主线：

```txt
grill-with-docs -> to-prd -> to-issues -> implement -> code-review
```

另有两条常见入口：

- issue 堆积：先走 `triage`。
- 代码库开始变泥球：先走 `improve-codebase-architecture`。

## 记忆点

`ask-matt` 是地图，不是交通工具。它帮你进入正确路线，然后把工作交给真正执行的技能。
