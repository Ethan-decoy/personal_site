---
title: prototype
date: 2026-07-04
---
# prototype

来源：[skills/engineering/prototype](https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=prototype
npx skills update prototype
```

## 它解决什么

`prototype` 构建一个小而可丢弃的程序，只为回答一个设计问题：这个状态模型是否合理，或者这个 UI 应该长什么样。

原型从第一天就是 throwaway。它不追求测试、完整错误处理、抽象或持久化。它的价值是快速学习，然后删除或吸收。

## 何时使用

当纸上讨论不够时使用：

- 状态机分支太多，难以在脑中模拟。
- UI 方向不确定，需要看几个真实版本。
- 想快速验证某个交互或数据流是否舒服。

如果已有系统出 bug，用 `diagnosing-bugs`，不是 `prototype`。

## 两种形态

- **逻辑/状态模型问题**：做一个小型交互式终端程序，每次动作后打印完整状态。
- **UI 方向问题**：在一个路由里做多个差异明显的 UI 方案，通过浮动切换器比较。

问题先于代码。选错形态会浪费整个原型。

## 产物不是代码

真正要保留的是答案，而不是原型本身。原型回答问题后，应把结论写进 commit message、ADR、issue 或邻近的 `NOTES.md`，然后删除或吸收代码。

## 记忆点

一旦你开始强化原型，它就已经不再是原型了。
