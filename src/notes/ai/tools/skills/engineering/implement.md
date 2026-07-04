---
title: implement
date: 2026-07-04
---
# implement

来源：[skills/engineering/implement](https://github.com/mattpocock/skills/tree/main/skills/engineering/implement)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=implement
npx skills update implement
```

## 它解决什么

`implement` 根据 PRD 或一组 issue 执行实现。它会通过 TDD、类型检查、完整测试、代码审查和提交，把已经确定的工作落到当前分支。

它不决定“要做什么”。规格和接缝应该已经在上游确定，它只负责执行。

## 何时使用

当工作已经写成 PRD 或拆成 issue，并且准备进入编码阶段时使用。

如果规格还不存在，先用 `to-prd`。如果已有 PRD 但没有拆任务，先用 `to-issues`。如果只是想针对一个具体行为 test-first 地做，可以直接用 `tdd`。

## 预先约定的接缝

实现的核心是 seam。测试应该打在一个稳定接口上，这个接口在写代码前已经讨论过。

`implement` 不应该在构建中途随意发明新接缝。它按上游计划写测试，再通过 `tdd` 一次实现一个行为。这样测试瞄准的是持久行为，而不是临时实现。

## 工作方式

它会保持反馈环紧凑：

- 经常 typecheck。
- 开发中运行单个测试文件。
- 最后跑完整套检查。
- 提交前再走 `code-review`。

## 记忆点

`implement` 是手，不是脑。思考、对齐和拆分应该在它之前完成。
