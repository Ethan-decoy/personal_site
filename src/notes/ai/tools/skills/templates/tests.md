---
title: 好坏测试示例
date: 2026-05-27
order: 9
---
# 好坏测试示例

> 转自 [mattpocock/skills](https://github.com/mattpocock/skills)，版权归原作者所有。

好测试与坏测试的对比。

## 好测试

- 通过公共接口锻炼真实代码路径
- 描述行为，不是实现步骤
- 能在内部重构后存活
- 读起来像规格说明

```
// 好：描述行为
test('用户可以用有效购物车结账')
```

## 坏测试

- 与内部实现耦合
- 模拟内部协作者
- 测试私有方法
- 重构时断裂但行为没变

```
// 坏：测试实现
test('processOrder 调用 paymentService.pay 并传递正确参数')
```
