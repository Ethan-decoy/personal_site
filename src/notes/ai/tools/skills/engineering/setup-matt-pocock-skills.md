---
title: setup-matt-pocock-skills — 仓库级配置搭建
date: 2026-05-27
order: 5
---
# setup-matt-pocock-skills — 仓库级配置搭建

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

**触发时机**：首次使用工程类技能之前，或技能缺少问题追踪器/分派标签/领域文档上下文时。

**描述**：为每个仓库搭建配置（问题追踪器、分派标签词汇、领域文档布局），其他工程技能会消费这些配置。

---

## 配置内容

搭建工程技能假设的每仓库配置：

- **问题追踪器** — issue 存放的位置（默认 GitHub；也支持本地 Markdown）
- **分派标签** — 五种规范分派角色使用的字符串
- **领域文档** — `CONTEXT.md` 和 ADR 的位置，以及读取它们的消费者规则

这是一个**提示驱动**的技能，不是确定性脚本。探索、呈现发现、与用户确认、然后写入。

## 流程

### 1. 探索

查看当前仓库，了解起点。阅读已有的内容，不做假设：

- `git remote -v` 和 `.git/config` — 这是 GitHub 仓库吗？哪个？
- 仓库根目录的 `AGENTS.md` 和 `CLAUDE.md` — 是否存在？是否已有 `## Agent skills` 部分？
- 根目录的 `CONTEXT.md` 和 `CONTEXT-MAP.md`
- `docs/adr/` 和任何 `src/*/docs/adr/` 目录
- `docs/agents/` — 此技能的先前输出是否已存在？
- `.scratch/` — 本地 Markdown 问题追踪约定的迹象

### 2. 呈现发现并逐一询问

总结已有和缺少的内容。然后引导用户完成**三个决策，每次一个**——呈现一个部分，得到用户回答，再进入下一个。不要一次性全部抛出。

假设用户不理解这些术语的含义。每个部分以简短解释开头（是什么、为什么需要、选择不同会有什么变化）。然后展示选择和默认值。

**A 部分 — 问题追踪器**

> 解释："问题追踪器"是 issue 存放的地方。`to-issues`、`triage`、`to-prd` 等技能会读写它——它们需要知道是调用 `gh issue create`、在 `.scratch/` 下写 Markdown、还是遵循其他工作流。选择你实际用来跟踪工作的地方。

默认姿态：这些技能为 GitHub 设计。如果 `git remote` 指向 GitHub，提议那个。如果指向 GitLab，提议 GitLab。否则提供：

- **GitHub** — issue 存放在 GitHub Issues（使用 `gh` CLI）
- **GitLab** — issue 存放在 GitLab Issues（使用 `glab` CLI）
- **本地 Markdown** — issue 作为 `.scratch/<feature>/` 下的文件（适合个人项目或无 remote 的仓库）
- **其他**（Jira、Linear 等）— 让用户用一段话描述工作流；技能记录为自由文本

**B 部分 — 分派标签词汇**

> 解释：当 `triage` 技能处理 incoming issue 时，它通过状态机流转——需要评估、等待报告人、准备给 AFK agent、准备给人、或不会修复。要做到这一点，它需要应用*你实际配置过的*标签字符串。如果你的仓库已使用不同的标签名（例如 `bug:triage` 而不是 `needs-triage`），在这里映射它们，这样技能会应用正确的而不是创建重复。

五种规范角色：

| 角色 | 含义 |
|------|------|
| `needs-triage` | 维护者需要评估 |
| `needs-info` | 等待报告人 |
| `ready-for-agent` | 已完整指定，AFK 就绪 |
| `ready-for-human` | 需要人工实现 |
| `wontfix` | 不会采取行动 |

默认：每个角色的字符串等于其名称。询问用户是否想覆盖任何。如果他们的问题追踪器没有现有标签，默认值即可。

**C 部分 — 领域文档**

> 解释：某些技能（`improve-codebase-architecture`、`diagnose`、`tdd`）读取 `CONTEXT.md` 来学习项目的领域语言，读取 `docs/adr/` 了解过去的架构决策。它们需要知道仓库是有一个全局上下文还是多个（例如前后端分离的单体仓库）。

确认布局：

- **单上下文** — 一个 `CONTEXT.md` + `docs/adr/` 在仓库根目录。大多数仓库如此。
- **多上下文** — `CONTEXT-MAP.md` 在根目录，指向各上下文的 `CONTEXT.md`（通常是单体仓库）。

### 3. 确认并编辑

向用户展示草稿：

- 要添加到 `CLAUDE.md` / `AGENTS.md` 的 `## Agent skills` 块
- `docs/agents/issue-tracker.md`、`docs/agents/triage-labels.md`、`docs/agents/domain.md` 的内容

让用户编辑后再写入。

### 4. 写入

**选择编辑哪个文件：**

- 如果 `CLAUDE.md` 存在，编辑它。
- 否则如果 `AGENTS.md` 存在，编辑它。
- 如果都不存在，询问用户创建哪个——不要替他们选择。

永远不要在 `CLAUDE.md` 已存在时创建 `AGENTS.md`（反之亦然）——始终编辑已有的那个。

如果 `## Agent skills` 块已存在，就地更新内容而不是追加重复。不要覆盖用户对周围部分的编辑。

### 5. 完成

告诉用户设置已完成，哪些工程技能现在会从这些文件读取。提到他们以后可以直接编辑 `docs/agents/*.md`——只有在想切换问题追踪器或从头开始时才需要重新运行此技能。
