---
title: GitHub Issue 追踪
date: 2026-05-27
order: 17
---
# GitHub Issue 追踪

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

GitHub 作为问题追踪器的使用约定。

## CLI 命令

- `gh issue list` — 列出 issue
- `gh issue view <number>` — 查看详情
- `gh issue create --title <t> --body <b>` — 创建
- `gh issue edit <number> --add-label <l>` — 加标签
- `gh issue close <number>` — 关闭

## 约定

- Issue 按时间从早到晚排序
- 标签用于分派角色（needs-triage、ready-for-agent 等）
- 评论用于分派笔记和 agent brief
