---
title: Agent Brief 编写指南
date: 2026-05-27
order: 3
---
# Agent Brief 编写指南

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

Agent brief 是给 AFK（away from keyboard）agent 的可执行工单。它应该包含 agent 在无需额外人工交互的情况下完成任务所需的一切。

## 结构

```markdown
## 目标

用一两句话描述 agent 应该完成什么。

## 上下文

为什么需要这个变更。包含相关背景、链接和先前决策。

## 要做什么

具体行动清单，按执行顺序排列。

## 约束

- 什么不应该做
- 必须遵循的规范或约定
- 任何外部依赖或限制

## 验证

如何确认工作完成：

- [ ] 测试通过
- [ ] 特定行为可见
- [ ] 构建无错误

## 参考

- 相关 issue 链接
- 领域文档（CONTEXT.md、ADR）
- 相关代码片段或原型
```

## 编写原则

- **自包含**：agent 不应该需要阅读 brief 之外的内容来开始工作
- **具体**：避免模糊指令；说"在 X 文件中添加 Y 函数"，而不是"改进 X"
- **可验证**：每个 brief 应该有明确的完成标准
- **有边界**：明确说明什么超出范围
