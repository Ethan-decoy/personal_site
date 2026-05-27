---
title: Out-of-Scope 知识库
date: 2026-05-27
order: 4
---
# Out-of-Scope 知识库

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

持久化记录被拒绝的需求和增强请求，这样 agent 和人就不会重复提议同样的东西。

## 存储位置

`.out-of-scope/` 目录，每个 Markdown 文件对应一个被拒绝的需求。

## 文件命名

使用 kebab-case 描述被拒绝的需求，例如 `auto-generate-readmes.md`。

## 文件结构

```markdown
# {被拒绝的需求名称}

**日期**：YYYY-MM-DD
**来源**：Issue #N（或其他来源）

## 被拒绝的原因

简短解释为什么这个需求不在范围内或被拒绝了。

## 记录人

谁做出了这个决策。
```

## 使用

当 `/triage` 技能处理 incoming issue 时，它读取 `.out-of-scope/` 并展示任何与当前 issue 类似的先前拒绝记录，这样维护者可以快速判断是否是重复提议。
