---
title: to-issues
date: 2026-07-04
---
# to-issues

来源：[skills/engineering/to-issues](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-issues)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=to-issues
npx skills update to-issues
```

## 它解决什么

`to-issues` 把计划、规格或 PRD 拆成一组可独立领取的 issue，并按依赖顺序发布到项目 issue tracker。

每个 issue 都应该是 tracer bullet：一条窄的垂直切片，穿过 schema、API、UI、测试等必要层，而不是只做某一层。

## 何时使用

当你已经有同意的计划或写好的 PRD，希望把它拆成 Agent 可以独立执行的任务时使用。

如果规格还没写，先用 `to-prd`。

## 前置条件

它会写入 issue tracker，因此仓库需要先运行 `setup-matt-pocock-skills`，配置 tracker 和 triage 标签。发布时会自动打上 ready-for-agent 对应标签。

## 垂直切片

水平切片只做一层，例如全 schema 或全 API，直到全部层做完才有可验证产物。垂直切片则穿过所有必要层，完成后可以独立演示或验证。

拆分前，它还会寻找 prefactoring：先让改动变容易，再做容易的改动。

## 工作方式

它会先和你确认拆分粒度、依赖关系、哪些该合并或拆开。发布时先发 blocker，后续 issue 才能引用真实的 blocked-by 关系。

## 记忆点

好的 issue 不是“做一层”，而是“交付一条能跑通的小路径”。
