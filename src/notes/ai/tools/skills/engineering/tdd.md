---
title: tdd
date: 2026-07-04
---
# tdd

来源：[skills/engineering/tdd](https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=tdd
npx skills update tdd
```

## 它解决什么

`tdd` 用 test-first 的方式构建功能或修复 bug。它一次只处理一个行为，通过 red-green loop 推动代码出现。

它不会先批量写完所有测试。那会让测试描述想象中的行为，而不是跟随真实实现反馈。

## 何时使用

当有具体行为要构建，并希望测试能经得起重构时使用。

如果行为还没被规格化，先用 `to-prd`。如果主要问题是接口怎么设计，先用 `codebase-design`。

## 红绿循环

流程是：

1. 写一个失败测试。
2. 写刚好足够的代码让它通过。
3. 再写下一个失败测试。
4. 绿灯后才重构。

第一个测试应该是 tracer bullet：一条窄而端到端的路径，先证明整体链路能工作。

## 好测试

好测试像规格，而不是像实现检查：

- 名字描述用户可见行为。
- 通过公开接口触达真实代码路径。
- 内部函数重命名不会破坏它。
- expected value 来自规格、已知样例或独立真值，不用和实现相同的算法重新算一遍。

## 记忆点

TDD 的节奏是一个行为、一个测试、一个最小实现。红的时候不重构。
