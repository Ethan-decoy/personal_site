---
title: improve-codebase-architecture
date: 2026-07-04
---
# improve-codebase-architecture

来源：[skills/engineering/improve-codebase-architecture](https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=improve-codebase-architecture
npx skills update improve-codebase-architecture
```

## 它解决什么

`improve-codebase-architecture` 扫描代码库，寻找可以把浅模块变深的机会，并生成可视化 HTML 报告。你选中一个候选后，它再进入拷问流程。

它不是普通“重构清单”。每个候选都要通过删除测试：移除这个模块时，复杂度是被集中到了更小接口后面，还是只是被搬到调用方？

## 何时使用

适合作为周期性架构体检：

- 代码库开始让人频繁在多个小文件间跳转。
- 一个概念必须打开五个文件才懂。
- 模块接口几乎和实现一样复杂。
- 测试看起来很多，但真正的 bug 藏在调用组合里。

如果你已经知道要设计哪个模块，用 `codebase-design` 就够了。

## 深化机会

它寻找的是 depth：更多行为隐藏在更小、更稳定的接口后。报告会使用共享设计词汇，例如 module、interface、seam、adapter、leverage、locality，并结合项目自己的领域语言。

## 报告与拷问

输出是一个写到系统临时目录的 HTML 文件，不落到仓库里。每张卡片包含：

- 相关文件。
- 当前摩擦。
- 普通语言描述的解法。
- 局部性和杠杆收益。
- before/after 图。
- `Strong`、`Worth exploring` 或 `Speculative` 置信标记。

报告最后会推荐最值得优先处理的一项。你选中后，它再用 `grilling` 对具体设计继续追问。

## 记忆点

这不是“让代码更漂亮”，而是寻找能真正压缩调用方面复杂度的接口。
