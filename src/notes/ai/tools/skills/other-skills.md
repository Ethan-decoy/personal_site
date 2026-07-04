---
title: Skills 其他目录
date: 2026-07-04
---
# Skills 其他目录

最新版仓库除了正式 `docs/` 中的工程类和生产力类技能，还包含 `misc`、`personal`、`in-progress`、`deprecated` 四类目录。这些目录中的技能不一定出现在正式文档页里，但仍然是仓库当前内容的一部分。

## misc

| 技能 | 用途 |
| --- | --- |
| `git-guardrails-claude-code` | 为 Claude Code 配置 hook，阻止危险 git 操作，例如 push、reset --hard、clean、强删分支等。 |
| `migrate-to-shoehorn` | 把测试里的 `as` 类型断言迁移到 `@total-typescript/shoehorn`，尤其适合只需要部分测试数据的对象。 |
| `scaffold-exercises` | 按课程结构生成 exercises、solutions、explainer 等目录和文件，并遵守 lint 规则。 |
| `setup-pre-commit` | 为仓库配置 Husky、lint-staged、格式化、类型检查和测试类 pre-commit 流程。 |

## personal

| 技能 | 用途 |
| --- | --- |
| `edit-article` | 编辑文章草稿，重组结构、提升清晰度、压紧表达。 |
| `obsidian-vault` | 搜索、创建和整理 Obsidian vault 笔记，维护 wikilinks 与 index notes。 |

## in-progress

这些技能仍处于实验或推进中，适合当作方向参考，不一定等同于稳定公共接口。

| 技能 | 用途 |
| --- | --- |
| `claude-handoff` | 把当前会话交给新的后台 Agent 继续。 |
| `loop-me` | 围绕想构建的工作流规格进行拷问。 |
| `wayfinder` | 面对超大工作时，先创建调查地图和 issue，再逐步消除未知。 |
| `wizard` | 生成交互式 bash 向导，带人完成第三方设置、迁移或状态转换。 |
| `writing-beats` | 把素材组织成一段有推进感的写作节拍旅程。 |
| `writing-fragments` | 从原始材料中挖掘片段，暂不急着组织结构。 |
| `writing-shape` | 把素材塑造成文章，逐段推进。 |

## deprecated

这些技能在新版中已被替换或不推荐继续作为主入口。

| 技能 | 当前状态 |
| --- | --- |
| `design-an-interface` | 已被更通用的 `codebase-design` 相关设计语言覆盖。 |
| `qa` | 旧的交互 QA 会话技能，部分职责可由 `triage` 承接。 |
| `request-refactor-plan` | 旧的重构计划访谈技能，方向被 `grill-with-docs`、`to-prd`、`to-issues` 等主线吸收。 |
| `ubiquitous-language` | 旧的统一语言提取技能，已被 `domain-modeling` 取代。 |

## 旧笔记对应关系

- `diagnose` -> `diagnosing-bugs`
- `write-a-skill` -> `writing-great-skills`
- `caveman` -> 已移除
- `zoom-out` -> 已移除
- 旧 `templates/` 目录 -> 新版拆入具体技能或共享技能说明，不再作为本站独立笔记保留
