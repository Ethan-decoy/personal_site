---
title: diagnosing-bugs
date: 2026-07-04
---
# diagnosing-bugs

来源：[skills/engineering/diagnosing-bugs](https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnosing-bugs)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=diagnosing-bugs
npx skills update diagnosing-bugs
```

## 它解决什么

`diagnosing-bugs` 是处理复杂 bug 和性能回归的诊断循环：复现、缩小、排列假设、插桩验证，然后修复并补回归测试。

它最重要的原则是：没有紧反馈环，就不开始猜原因。先要有一个能稳定变红的命令，证明当前症状真的被触发。

## 何时使用

适合这些情况：

- Bug 第一眼看不出原因。
- 间歇性失败或 flaky test。
- 某个已知好状态之后出现回归。
- 用户报告“报错、失败、很慢、行为不对”。

如果问题不是 bug，而是想探索要不要这么设计，用 `prototype`。

## 紧反馈环

技能会优先构造一个可运行命令，要求它：

- 触达真实 bug 路径。
- 断言用户报告的精确症状，而不是相邻失败。
- 足够快、确定、Agent 可重复运行。

可能的形式包括失败测试、curl 脚本、CLI 对比、无头浏览器、录制 trace、临时 harness、fuzz loop 或 `git bisect run`。对于非确定性 bug，目标是提高复现率。

## 工作方式

有了红色反馈后，才列出可证伪假设，并按概率排序。验证时可以加入带标签的 debug instrumentation，但完成前必须清理。

## 记忆点

诊断不是“聪明地猜”。它是把系统变成会回答是/否问题的机器。
