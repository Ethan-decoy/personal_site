---
title: 深模块
date: 2026-05-27
order: 5
---
# 深模块

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

深模块 vs 浅模块的概念图解。

## 概念

**深模块** = 小接口 + 大实现。调用者用很少的配置获得很多能力。

**浅模块** = 大接口 + 小实现。调用者需要知道很多才能做很少的事。

## 判断

- 想象删除这个模块——复杂度会集中在调用者还是消失？
- 一个适配器和一个实现 = 假设的接缝。
- 两个适配器和一个实现 = 真正的接缝。

## 示例

```
深模块（好）：
  fn build_query(rules: &Rules) -> Result<Query>
  // 一行调用，背后处理验证、缓存、重试、分页

浅模块（差）：
  fn build_query(
    url: &str, method: &str, headers: Map,
    body: Option<Bytes>, timeout: Duration,
    retries: u32, cache: bool, ...
  ) -> Result<Response>
  // 十个参数，内部只是转发
```
