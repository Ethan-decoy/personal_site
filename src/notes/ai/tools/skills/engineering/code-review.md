---
title: code-review
date: 2026-07-04
---
# code-review

来源：[skills/engineering/code-review](https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=code-review
npx skills update code-review
```

## 它解决什么

`code-review` 审查当前 `HEAD` 和某个固定点之间的 diff。它永远分成两条独立轴线：

- **Standards**：代码是否符合仓库约定和基础代码气味标准。
- **Spec**：代码是否真正实现了原 issue 或 PRD 的要求。

两条轴线并行运行，最后并排报告，不合并成一个总分。一个改动可能代码风格很好，但偏离规格；也可能规格实现正确，但代码结构有风险。

## 何时使用

当有一个 diff 需要被判断时使用：分支、PR、WIP 改动，或者“从某个提交以来”的修改。

它适合放在实现链路末尾。如果要写代码，先用 `implement` 或 `tdd`；如果要生成规格，先用 `to-prd`。

## 前置条件

Standards 轴不需要额外配置，会自带 Fowler 风格的代码气味基线。

Spec 轴需要能找到规格来源，例如 issue、PRD 文件或你显式传入的路径。找不到规格时，它应该明确说明没有 spec，而不是编造需求。

## 工作方式

技能先确认固定点可解析，并且 diff 非空。然后把 Standards 和 Spec 交给两个互不污染上下文的子流程。最终报告保留两个标题块，让你分别处理。

## 记忆点

审查时不要问“这个改动好不好”一个大问题。拆成两个问题更可靠：它是否被正确构建？它是否构建了正确的东西？
