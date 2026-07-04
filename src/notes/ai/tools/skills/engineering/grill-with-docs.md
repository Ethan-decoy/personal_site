---
title: grill-with-docs
date: 2026-07-04
---
# grill-with-docs

来源：[skills/engineering/grill-with-docs](https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=grill-with-docs
npx skills update grill-with-docs
```

## 它解决什么

`grill-with-docs` 在动手前对计划进行一问一答的拷问，直到你和 Agent 达成共同理解。同时，它会把变清楚的术语写入 `CONTEXT.md`，把重要决策写入 ADR。

普通拷问会让理解停留在会话里；这个技能会留下纸面轨迹。

## 何时使用

在一个改动刚开始、计划还模糊、领域语言也没有完全定下来时使用。

如果只想被追问但不写文档，用 `grilling` 或 `grill-me`。如果计划已经清楚，只是想沉淀术语或决策，用 `domain-modeling`。

## 前置条件

它会向仓库写入文档，但这些文件按需创建：

- 术语写入根目录 `CONTEXT.md`，或多上下文仓库里的对应 `CONTEXT.md`。
- 难以逆转的决策写入 `docs/adr/`。

## 工作方式

它沿着设计决策树向下问，一次只问一个问题。能从代码库读出来的问题，会自己读代码，不浪费你的回答。

术语一旦明确，就立即写入 glossary，而不是等会话结束再批量整理。ADR 则保持稀少，只在真正有取舍且后续难以回退时出现。

## 在流程中的位置

```txt
grill-with-docs -> to-prd -> to-issues -> implement -> code-review
```

它是主线入口，负责把模糊想法变成足够稳定的上下文。
