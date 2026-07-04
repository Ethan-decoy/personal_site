---
title: triage
date: 2026-07-04
---
# triage

来源：[skills/engineering/triage](https://github.com/mattpocock/skills/tree/main/skills/engineering/triage)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=triage
npx skills update triage
```

## 它解决什么

`triage` 让 issue 或外部 PR 经过一个小型状态机：分类、验证、必要时追问，最后留下可交给 Agent 或人的 brief。

它不会盲目打标签。每个条目应该同时只有一个 category role 和一个 state role。

## 何时使用

当 issue tracker 里堆积了未经判断的报告、请求或外部 PR 时使用。

你可以自然语言调用：看看哪些需要注意、处理某个 issue、把某项移到 ready-for-agent。

如果是把新对话变成规格，用 `to-prd`。如果是把已有 PRD 拆成票，用 `to-issues`。

## 前置条件

必须先运行 `setup-matt-pocock-skills`。它需要知道 issue tracker 在哪里，以及五个 canonical state 对应仓库里的哪些真实标签：

- `needs-triage`
- `needs-info`
- `ready-for-agent`
- `ready-for-human`
- `wontfix`

## 验证先于 brief

`triage` 和普通贴标签的差别在验证。Bug 要复现，PR 要 checkout 并运行检查。它还会查两个问题：

- 这个需求是否已经实现，若已实现可能是 `wontfix`。
- `.out-of-scope/` 是否已有拒绝记录。

确认后的 brief 比猜测强得多。

## PR 也是带代码的 issue

如果仓库把外部 PR 也当作请求入口，`triage` 会用同一套状态机处理它们。`ready-for-agent` 表示 brief 已写好，Agent 可以继续处理代码；`ready-for-human` 表示可以进入人工合并判断。

## 记忆点

分诊不是整理标签，是让队列里的每个条目变得可信、可行动。
