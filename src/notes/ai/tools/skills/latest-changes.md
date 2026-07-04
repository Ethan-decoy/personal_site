---
title: Skills 最新变化
date: 2026-07-04
---
# Skills 最新变化

来源：[mattpocock/skills CHANGELOG](https://github.com/mattpocock/skills/blob/main/CHANGELOG.md)。

## 1.0.1

`teach` 被调整成“复用优先”的教学技能。它会先读取 `./assets/` 中已有的样式、测验组件、模拟器和图表工具，再构建课程；如果过程中产生新的可复用组件，会抽取到 `assets`，而不是直接内联到单节课里。

这个变化的方向很清楚：长期学习工作区不应该越写越散，课程应该逐渐形成一套共享资产。

## 1.0.0

### 新增 `ask-matt`

`ask-matt` 是 user-invoked 技能的路由器。你描述当前情境，它告诉你应该走哪个技能或流程，而不是自己完成工作。

### 新增共享设计技能

新版把设计语言拆成两个可复用技能：

- `codebase-design`：深模块、接口、接缝、适配器、局部性等代码结构语言。
- `domain-modeling`：统一语言、领域术语、`CONTEXT.md` 和 ADR 的维护纪律。

`improve-codebase-architecture`、`tdd`、`grill-with-docs` 等技能都改为依赖这两个共享技能，而不是各自内置一份相近说明。

### 移除旧技能

- `caveman` 被移除：它是作者测试中的重复技能，不再公开。
- `zoom-out` 被移除：实践中使用频率不高。

### 重命名

- `diagnose` 改名为 `diagnosing-bugs`。
- `write-a-skill` 改为 `writing-great-skills`。

### 新增合并冲突技能

`resolving-merge-conflicts` 用于处理中途卡住的 git merge 或 rebase。它强调按“意图”解决冲突，而不是按文本挑 ours/theirs。

### 分类变化

文档从旧的 Commands/Skills 分类，改成：

- **User-invoked**：只能用户显式调用。
- **Model-invoked**：用户可调用，Agent 也可按任务自动调用。

这让技能之间的组合关系更清楚：编排流程的技能由用户启动，可复用纪律由模型在合适场景触发。
