---
title: ADR 格式
date: 2026-05-27
order: 2
---
# ADR 格式

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

## 结构

```md
# {ADR 编号}: {标题}

**日期**：YYYY-MM-DD
**状态**：已接受（或 已拒绝 / 进行中）

## Context（上下文）

{什么决策需要做出？}

## 决策（Decision）

{我们决定做什么。}

## 后果（Consequences）

{这个决策的结果——好的和坏的。}
```

## 规则

- **只有在决策难以逆转时创建 ADR。**
- **只有在缺少上下文会让人惊讶时创建 ADR。**
- **只有在真实权衡的结果时创建 ADR。**
- **ADR 描述"为什么"，不是"怎么做"。**
- 使用现在时。
- 包含指向相关讨论的链接（PR、issue、Slack 频道）。
