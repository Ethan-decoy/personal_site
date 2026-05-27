---
title: CONTEXT.md 格式
date: 2026-05-27
order: 1
---
# CONTEXT.md 格式

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

## 结构

```md
# {上下文名称}

{一两句话描述这个上下文是什么以及为什么存在。}

## Language（语言）

**Order（订单）**：
{术语的一两句话描述}
_避免_：Purchase, transaction

**Invoice（发票）**：
交付后发送给客户的付款请求。
_避免_：Bill, payment request

**Customer（客户）**：
下订单的个人或组织。
_避免_：Client, buyer, account
```

## 规则

- **要有立场。** 当多个词表达同一概念时，选择最好的一个，将其他列为要避免的别名。
- **明确标记冲突。** 如果术语使用有歧义，在"标记的歧义"中指出并给出明确解决方案。
- **定义要紧凑。** 最多一两句话。定义它**是**什么，不是它做什么。
- **展示关系。** 使用粗体术语名，在明显时表达基数。
- **只包含此项目上下文特定的术语。** 通用编程概念（超时、错误类型、工具模式）不属于这里，即使项目广泛使用它们。添加术语前问：这是此上下文独有的概念还是通用编程概念？只有前者属于这里。
- **当自然聚类出现时，在子标题下分组术语。** 如果所有术语属于一个凝聚的领域，平铺列表即可。
- **编写示例对话。** 一段开发者和领域专家之间的对话，展示术语如何自然地交互并澄清相关概念之间的边界。

## 单上下文 vs 多上下文仓库

**单上下文（大多数仓库）：** 一个 `CONTEXT.md` 在仓库根目录。

**多上下文：** 根目录的 `CONTEXT-MAP.md` 列出上下文、它们的位置以及它们之间的关系：

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) — 接收和跟踪客户订单
- [Billing](./src/billing/CONTEXT.md) — 生成发票和处理付款
- [Fulfillment](./src/fulfillment/CONTEXT.md) — 管理仓库拣货和发货

## Relationships

- **Ordering → Fulfillment**：Ordering 发出 `OrderPlaced` 事件；Fulfillment 消费它们开始拣货
- **Fulfillment → Billing**：Fulfillment 发出 `ShipmentDispatched` 事件；Billing 消费它们生成发票
- **Ordering ↔ Billing**：共享 `CustomerId` 和 `Money` 类型
```

技能推断适用哪种结构：

- 如果存在 `CONTEXT-MAP.md`，阅读它来查找上下文
- 如果只有根目录 `CONTEXT.md`，单上下文
- 如果都不存在，在第一个术语被确定时惰性创建根目录 `CONTEXT.md`

当存在多个上下文时，推断当前话题与哪个上下文相关。如果不清楚，提问。
