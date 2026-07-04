---
title: resolving-merge-conflicts
date: 2026-07-04
---
# resolving-merge-conflicts

来源：[skills/engineering/resolving-merge-conflicts](https://github.com/mattpocock/skills/tree/main/skills/engineering/resolving-merge-conflicts)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=resolving-merge-conflicts
npx skills update resolving-merge-conflicts
```

## 它解决什么

`resolving-merge-conflicts` 用于处理中途卡住的 git merge 或 rebase。它逐个 hunk 解决冲突，运行项目检查，并完成合并或变基。

它按“意图”解决，而不是按文本选择 ours 或 theirs。

## 何时使用

当 git merge/rebase 已经停在冲突上时使用。

它不是用来计划合并，也不是用来诊断合并后出现的运行时 bug。合并完成但行为坏了，应该交给 `diagnosing-bugs`。

## 按意图解决

每个冲突 hunk 的两边都来自某个目的。技能会先追溯一手来源，例如 commit message、PR、原 issue，理解两边为什么存在，然后尽量同时保留两边意图。

如果意图确实冲突，就选择符合本次合并目标的一边，并把取舍说清楚。

## 好的结果

- 每个 hunk 都保留了两边可兼容行为，或明确说明无法兼容的取舍。
- 不发明原两边都没有的新行为。
- 按项目习惯运行 typecheck、tests、format。
- merge/rebase 被带到完成状态，而不是 abort。

## 记忆点

冲突不是文本问题，是两段历史意图在同一处相撞。
