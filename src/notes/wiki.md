---
title: Wiki
date: 2026-05-27
---
# Wiki — 概念词典

## IDL

IDL（Interface Definition Language）是一种**简化的描述语言**，用于描述软件组件之间的接口格式。

### 在 ROS2 中的作用

ROS 2 使用 IDL 来描述三种通信接口：<kbd>Topics</kbd>、<kbd>Services</kbd>、<kbd>Actions</kbd>。工具可以自动根据 IDL 文件为多种编程语言生成对应的源代码。

### 三种接口类型

| 类型 | 文件后缀 | 说明 |
|------|---------|------|
| msg | `.msg` | 描述消息的字段，用于生成各语言的消息源代码 |
| srv | `.srv` | 描述一个服务，由请求（request）和响应（response）两部分组成 |
| action | `.action` | 描述动作，由目标（goal）、结果（result）和反馈（feedback）三部分组成 |
