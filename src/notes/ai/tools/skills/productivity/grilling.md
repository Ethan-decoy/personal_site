---
title: grilling
date: 2026-07-04
---
# grilling

来源：[skills/productivity/grilling](https://github.com/mattpocock/skills/tree/main/skills/productivity/grilling)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=grilling
npx skills update grilling
```

## 它解决什么

`grilling` 是拷问计划或设计的底层原语。它沿着设计树逐个分支追问，在代码开始前解决关键决策依赖。

它一次只问一个问题，并等待回答。能从代码库读出来的，就自己读；不会把一长串问题一次性扔给用户。

## 何时使用

当计划仍有软点，需要在写代码前被暴露时使用。

实践中，你通常不会直接调用它，而是通过两个入口使用：

- `grill-me`：只做访谈。
- `grill-with-docs`：访谈同时写 glossary 和 ADR。

## 为什么被抽出来

新版把 `grilling` 抽成单一事实来源。凡是需要访谈的技能，都可以复用它，而不是各自发明一套提问方式。

`improve-codebase-architecture` 和 `triage` 也会借用它来压力测试自己的判断。

## 记忆点

好的拷问不是问题越多越好，而是顺着决策依赖，一次解决一个节点。
