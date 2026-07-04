---
title: handoff
date: 2026-07-04
---
# handoff

来源：[skills/productivity/handoff](https://github.com/mattpocock/skills/tree/main/skills/productivity/handoff)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=handoff
npx skills update handoff
```

## 它解决什么

`handoff` 把当前长会话压缩成一份交接文档，让新的 Agent 能接着做。

它不重复已经写在 PRD、计划、ADR、issue、commit 或 diff 里的内容，而是引用路径或 URL。交接文档只保留当前线程里仍然活着的上下文。

## 何时使用

当会话很长、接近上下文上限、准备收工，或要交给另一个 Agent 时使用。

调用时可以附上一句下一段会话的目的，它会据此定制交接文档。

## 文档包含什么

- 当前正在做什么，为什么。
- 下一步应该做什么。
- 建议下个 Agent 使用哪些技能。
- 已落地文档、issue、PRD、ADR、diff 的引用。
- 去除密钥、密码和隐私信息。

文档写到系统临时目录，不放进工作区，避免变成需要长期维护的新资产。

## 记忆点

handoff 是把会话压缩到“可继续”的核心，而不是把聊天记录重新打印一遍。
