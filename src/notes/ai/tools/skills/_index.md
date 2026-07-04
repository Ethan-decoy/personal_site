---
title: Matt Pocock Skills
date: 2026-07-04
---
# Matt Pocock Skills 中文笔记

> 本组笔记中文转述自 [mattpocock/skills](https://github.com/mattpocock/skills)。  
> 本次同步来源：`main` 分支 `272f99b22574f50e4266791c86b9302682970e23`。  
> 原仓库采用 MIT License，版权归 Matt Pocock 所有。

## 这套技能解决什么

这是一组面向真实工程工作的 Agent 技能。它们的核心不是“让 AI 多写代码”，而是把软件工程里的几个关键反馈环固定下来：

- 先对齐问题，再写规格。
- 先拆成可验证的垂直切片，再实现。
- 先有红绿反馈，再改代码。
- 用稳定术语、深模块和明确接口降低复杂度。
- 在长会话、代码审查、问题分诊和架构整理之间留下可交接的产物。

## 快速安装

```bash
npx skills@latest add mattpocock/skills
```

安装时需要至少选择 `/setup-matt-pocock-skills`。首次进入某个仓库后，先运行它，让技能知道 issue tracker、分诊标签和领域文档放在哪里。

## 调用方式

新版文档把技能分成两类：

- **User-invoked**：只能由用户显式输入，例如 `/grill-with-docs`、`/to-prd`。它们负责组织流程。
- **Model-invoked**：用户可以显式调用，Agent 在任务匹配时也可以自动使用，例如 `/tdd`、`/diagnosing-bugs`、`/codebase-design`。

一个 user-invoked 技能可以调用 model-invoked 技能，但不会再调用另一个 user-invoked 技能。这个边界让流程更可预期。

## 主线流程

```txt
grill-with-docs -> to-prd -> to-issues -> implement -> code-review
```

- `grill-with-docs`：先用一问一答把计划、术语和关键决策磨清楚。
- `to-prd`：把已经对齐的理解写成 PRD，不重新访谈。
- `to-issues`：把 PRD 拆成可独立交给 Agent 的垂直切片。
- `implement`：按 issue 或 PRD 执行实现，内部驱动 `tdd`。
- `code-review`：从标准和规格两个维度审查 diff。

## 工程类

| 技能 | 类型 | 用途 |
| --- | --- | --- |
| [ask-matt](./engineering/ask-matt.md) | User-invoked | 不知道该用哪个技能时的路由器 |
| [setup-matt-pocock-skills](./engineering/setup-matt-pocock-skills.md) | User-invoked | 每个仓库首次使用前的配置入口 |
| [grill-with-docs](./engineering/grill-with-docs.md) | User-invoked | 拷问计划，同时写入 glossary 和 ADR |
| [to-prd](./engineering/to-prd.md) | User-invoked | 把已对齐的对话转成 PRD |
| [to-issues](./engineering/to-issues.md) | User-invoked | 把计划拆成垂直切片 issue |
| [implement](./engineering/implement.md) | User-invoked | 按 PRD 或 issue 执行实现 |
| [triage](./engineering/triage.md) | User-invoked | 分诊已有 issue 或外部 PR |
| [improve-codebase-architecture](./engineering/improve-codebase-architecture.md) | User-invoked | 扫描代码库，寻找深模块改进机会 |
| [tdd](./engineering/tdd.md) | Model-invoked | 红绿重构，一次一个行为 |
| [diagnosing-bugs](./engineering/diagnosing-bugs.md) | Model-invoked | 复现、缩小、假设、插桩、回归测试 |
| [code-review](./engineering/code-review.md) | Model-invoked | 按 Standards 和 Spec 两轴审查 |
| [codebase-design](./engineering/codebase-design.md) | Model-invoked | 深模块、接口、接缝的设计语言 |
| [domain-modeling](./engineering/domain-modeling.md) | Model-invoked | 维护领域统一语言和 ADR |
| [prototype](./engineering/prototype.md) | Model-invoked | 用一次性原型回答设计问题 |
| [research](./engineering/research.md) | Model-invoked | 基于一手资料做研究并留下引用文档 |
| [resolving-merge-conflicts](./engineering/resolving-merge-conflicts.md) | Model-invoked | 按意图解决 merge/rebase 冲突 |

## 生产力类

| 技能 | 类型 | 用途 |
| --- | --- | --- |
| [grill-me](./productivity/grill-me.md) | User-invoked | 不写文档的计划拷问 |
| [handoff](./productivity/handoff.md) | User-invoked | 把长会话压缩成交接文档 |
| [teach](./productivity/teach.md) | User-invoked | 把当前目录变成长期学习工作区 |
| [writing-great-skills](./productivity/writing-great-skills.md) | User-invoked | 编写和维护技能的元参考 |
| [grilling](./productivity/grilling.md) | Model-invoked | `grill-me` 与 `grill-with-docs` 背后的拷问原语 |

## 版本变化

- [最新变化](./latest-changes.md)：新版仓库的重命名、移除、新增和分类调整。
- [其他目录](./other-skills.md)：`misc`、`personal`、`in-progress`、`deprecated` 中的技能清单。
