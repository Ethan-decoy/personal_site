---
title: to-prd
date: 2026-07-04
---
# to-prd

来源：[skills/engineering/to-prd](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-prd)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=to-prd
npx skills update to-prd
```

## 它解决什么

`to-prd` 把当前对话和代码库理解合成为产品需求文档，并发布到 issue tracker。

它不会重新访谈你。到达这一步时，对齐工作已经完成；它只是把已知内容综合成可执行规格。

## 何时使用

当一个改动已经谈清楚、领域语言也稳定了，并且你希望在写代码前留下规格时使用。

如果还没有对齐，先用 `grill-with-docs`。如果 PRD 已经完成，要拆任务，用 `to-issues`。

## 前置条件

它会发布到 issue tracker，因此需要先运行 `setup-matt-pocock-skills`。发布后会直接应用 ready-for-agent 标签，不需要再走一次 triage。

## PRD 包含什么

- 问题陈述：哪里坏了或缺了，为什么值得做。
- 解决方案：高层修复形态，不陷入实现细节。
- 用户故事：编号、具体、可独立检查的行为。
- 实现决策：会话中已经定下来的选择。
- 测试决策：测试接缝和完成标准。
- 不在范围内：刻意不做什么。
- 其他备注：无法归入前面部分但值得保留的信息。

## 深模块视角

写 PRD 前，它会先草拟测试接缝，并寻找深模块机会。它倾向复用已有接缝，使用尽可能高的接缝，最好整个改动只有一个主要接缝。

## 记忆点

`to-prd` 不是提问器，是综合器。它把已经达成的共同理解固化成规格。
