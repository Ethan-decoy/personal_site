---
title: teach
date: 2026-07-04
---
# teach

来源：[skills/productivity/teach](https://github.com/mattpocock/skills/tree/main/skills/productivity/teach)

## 快速安装

```bash
npx skills add mattpocock/skills --skill=teach
npx skills update teach
```

## 它解决什么

`teach` 把当前目录变成一个长期教学工作区，围绕你为什么要学某个主题，持续生成短小、漂亮、互动的课程。

它不直接相信模型记忆。教学前会收集高可信资源，并用引用支撑知识点。它也是有状态的：下一次课程会接着上次学习记录继续。

## 何时使用

当学习本身是一个项目时使用，例如长期学习语言、框架、理论物理或瑜伽。

如果只是想要一次性解释某个概念，直接问即可，不需要 `teach`。

## 工作区产物

运行后会逐渐写出：

- `MISSION.md`：你为什么学，这会牵引课程设计。
- `RESOURCES.md`：经过筛选的高可信学习来源。
- `lessons/*.html`：编号的自包含课程。
- `reference/*.html`：可复用速查表、算法、术语表。
- `learning-records/*.md`：ADR 风格的学习记录。
- `assets/*`：共享样式和互动组件。
- `NOTES.md`：你的学习偏好。

## 教学原则

每节课都围绕 mission 和你的最近发展区。课程应该有一点挑战，但不能过载。

它关注的是 storage strength，也就是长期保持，而不是当下很顺的 fluency。知识讲解阶段要降低难度，技能练习阶段则通过检索、间隔和交错增加有益难度。

## 记忆点

`teach` 不是解释器，是一个会积累状态的私人课程项目。
