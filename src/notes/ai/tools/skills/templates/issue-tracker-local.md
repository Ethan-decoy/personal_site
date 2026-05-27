---
title: 本地 Markdown 追踪
date: 2026-05-27
order: 19
---
# 本地 Markdown 追踪

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

本地文件作为问题追踪器的使用约定。

## 存储位置

`.scratch/<feature>/` 目录，每个 issue 一个 Markdown 文件。

## 文件结构

```markdown
# Issue #N: {标题}

**状态**：needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix
**类别**：bug / enhancement
**日期**：YYYY-MM-DD

## 描述

{问题描述}

## 分派笔记

{分派笔记内容}
```

## 约定

适合个人项目或无 remote 的仓库。技能直接读写 `.scratch/` 下的文件来管理 issue 状态。
