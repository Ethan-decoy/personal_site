---
title: grill-me
date: 2026-07-04
---
# grill-me

来源：[skills/productivity/grill-me](https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=grill-me
npx skills update grill-me
```

## 它解决什么

`grill-me` 对一个计划或设计进行一问一答的强力访谈，沿着决策树把隐含分支逐个摊开，直到你和 Agent 达成共同理解。

它一次只问一个问题，并且等待回答。每个问题都会附带 Agent 推荐答案，让你回应一个具体提案，而不是面对空白题。

## 何时使用

在构建前使用。计划大体正确，但你能感觉还有没有说清楚的软点时，它尤其有用。

如果希望同样的拷问过程还留下 glossary 和 ADR，用 `grill-with-docs`。

## 设计树

它把计划看成一棵决策树。父决策先解决，依赖它的子决策再展开。目的不是快点达成一致，而是确保重要假设没有被静默带过。

`grill-me` 是无状态的：不写文件，不留下 workspace，唯一产物是会话中被磨清楚的理解。

## 记忆点

`grill-me` 是动手前的压力测试。它让模糊计划提前暴露，而不是在实现中爆炸。
