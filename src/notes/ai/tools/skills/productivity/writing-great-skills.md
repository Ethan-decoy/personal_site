---
title: writing-great-skills
date: 2026-07-04
---
# writing-great-skills

来源：[skills/productivity/writing-great-skills](https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-great-skills)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=writing-great-skills
npx skills update writing-great-skills
```

## 它解决什么

`writing-great-skills` 是编写和维护技能的元参考。它关注如何让一个随机系统尽可能执行出稳定过程。

目标不是每次输出完全一样，而是每次遵循同样可靠的流程。predictability 是根本价值。

## 何时使用

当你在写新技能或修改旧技能时使用：

- 判断技能应该由用户调用还是模型自动调用。
- 写 description，让技能在合适任务上触发。
- 决定内容放在 `SKILL.md`，还是放到被引用的文件。
- 诊断技能为什么误触发或不触发。

## 认知负载与上下文负载

核心概念是两种 load：

- **context load**：model-invoked 技能每轮都把描述放进上下文，因此能自动触发，但占窗口。
- **cognitive load**：user-invoked 技能不占上下文，但用户必须记得它存在。

当 user-invoked 技能太多时，需要 router skill 来降低人的记忆负担。`ask-matt` 就是这种路由器。

## 其他杠杆

- **leading words**：用一个模型已熟悉的词压缩复杂执行概念，例如 tight、red、tracer bullet。
- **information hierarchy**：把信息分层放在技能步骤、技能内参考、外部引用里。
- **progressive disclosure**：只有在需要时才打开更深资料。
- **pruning**：维护单一事实来源，删除沉积、蔓延和无效句子。
- **failure modes**：识别 premature completion、duplication、sediment、sprawl、no-op。

## 记忆点

好技能不是写得多，而是能稳定地让 Agent 做对同一类事。
