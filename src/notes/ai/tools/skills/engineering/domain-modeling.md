---
title: domain-modeling
date: 2026-07-04
---
# domain-modeling

来源：[skills/engineering/domain-modeling](https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=domain-modeling
npx skills update domain-modeling
```

## 它解决什么

`domain-modeling` 主动建立和打磨项目的统一语言。它会挑战含糊词、用具体场景压力测试关系，并在术语或决策变清楚时立刻写入文档。

这不是“读取 CONTEXT.md 借用词汇”的被动习惯，而是在改变模型时使用的纪律。

## 何时使用

当问题是“词不清楚”时使用：

- “account” 同时表示三件事。
- “cancellation” 在不同人那里含义不同。
- 代码和口头描述矛盾。
- 某个概念需要被命名成 canonical term。
- 有一个难以逆转的架构决策需要记录。

如果问题是模块接口和接缝，使用 `codebase-design`。

## 产物

技能会按需写两个地方：

- `CONTEXT.md`：只记录领域词汇，不塞实现细节、规格草稿或临时想法。
- `docs/adr/`：记录真正重要的决策。

ADR 的门槛很高：难以逆转、没有上下文会令人意外、来自真实取舍。少写 ADR 是健康信号。

## 工作方式

当你陈述一个领域规则时，技能会把它和代码对照。例如你说“可以部分取消订单”，但代码只能取消整个订单，它会逼你决定哪一个才是事实。

## 记忆点

统一语言不是词典装饰，而是让代码、规格、issue 和对话说同一种话。
