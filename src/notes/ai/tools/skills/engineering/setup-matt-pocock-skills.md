---
title: setup-matt-pocock-skills
date: 2026-07-04
---
# setup-matt-pocock-skills

来源：[skills/engineering/setup-matt-pocock-skills](https://github.com/mattpocock/skills/tree/main/skills/engineering/setup-matt-pocock-skills)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=setup-matt-pocock-skills
npx skills update setup-matt-pocock-skills
```

## 它解决什么

`setup-matt-pocock-skills` 让某个仓库知道工程类技能应该怎样工作：issue 在哪里，triage 标签叫什么，领域文档放在哪里。

它写配置，不硬编码行为。其他技能读取这些配置后，才能在你的仓库里可靠运行。

## 何时使用

每个仓库第一次使用这套工程技能前运行一次。

如果 `triage`、`to-prd` 或 `to-issues` 在猜 issue tracker、乱用标签，通常说明这个设置还没做。

## 三个决策

它会一项一项确认：

- **Issue tracker**：GitHub、GitLab、本地 Markdown，或其他工作流。
- **Triage labels**：把五个 canonical state 映射到仓库里真实存在的标签。
- **Domain docs**：仓库是单个 `CONTEXT.md`，还是通过 `CONTEXT-MAP.md` 管理多个上下文。

## 产物

通常会写入：

- `docs/agents/issue-tracker.md`
- `docs/agents/triage-labels.md`
- `docs/agents/domain.md`

并在 `CLAUDE.md` 或 `AGENTS.md` 中加入指向这些文件的 `Agent skills` 区块。

## 记忆点

这是地基，不是日常步骤。先让技能知道仓库事实，后面的自动化才不会猜。
