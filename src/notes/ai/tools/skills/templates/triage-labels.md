---
title: 分派标签映射
date: 2026-05-27
order: 20
---
# 分派标签映射

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

五种分派角色的标签映射表。

## 规范角色

| 角色 | 默认标签 | 含义 |
|------|---------|------|
| `needs-triage` | `needs-triage` | 维护者需要评估 |
| `needs-info` | `needs-info` | 等待报告人 |
| `ready-for-agent` | `ready-for-agent` | 已完整指定，AFK 就绪 |
| `ready-for-human` | `ready-for-human` | 需要人工实现 |
| `wontfix` | `wontfix` | 不会采取行动 |

## 自定义

如果你的仓库使用不同的标签名（例如 `bug:triage` 而不是 `needs-triage`），运行 `/setup-matt-pocock-skills` 来映射它们。

## 状态流转

```
未标记 → needs-triage → needs-info → needs-triage (重新评估)
                       → ready-for-agent
                       → ready-for-human
                       → wontfix
```
