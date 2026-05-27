---
title: HTML 报告格式
date: 2026-05-27
order: 13
---
# HTML 报告格式

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

架构审查 HTML 报告的编写规范。

## 技术栈

- **Tailwind CDN** — 布局和样式
- **Mermaid CDN** — 图表（调用图、依赖、时序）
- 手工 div/SVG — 编辑感观的视觉（质量图、截面图、折叠动画）

混合使用——不要全都用 Mermaid。

## 卡片模板

每个候选项的卡片：

- **Files** — 涉及哪些文件/模块
- **Problem** — 为什么当前架构在制造摩擦
- **Solution** — 用通俗语言描述会改变什么
- **Benefits** — 用局部性和杠杆率来解释
- **Before / After 图** — 并排展示
- **推荐强度** — Strong / Worth exploring / Speculative

## 位置

写入系统临时目录，不要污染仓库：`<tmpdir>/architecture-review-<timestamp>.html`
