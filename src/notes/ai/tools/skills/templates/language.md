---
title: 架构语言
date: 2026-05-27
order: 12
---
# 架构语言

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

架构审查中的统一术语表。

## 术语

- **Module** — 任何有接口和实现的东西
- **Interface** — 调用者使用模块必须知道的一切
- **Implementation** — 内部的代码
- **Depth** — 接口处的杠杆率
- **Seam** — 接口所在之处
- **Adapter** — 在接缝处满足接口的具体事物
- **Leverage** — 调用者从深度中得到的收益
- **Locality** — 维护者从深度中得到的收益

## 规则

在架构审查和 HTML 报告中**精确使用这些术语**。不要漂移成"组件"、"服务"、"API"或"边界"。
