---
title: 诊断与运行期检查（Diagnostics and Runtime Checks）
date: 2026-10-08
order: 3
---

# 诊断与运行期检查（Diagnostics and Runtime Checks）

格式一致、编译成功和运行一次成功分别提供不同证据。诊断工具有实际检测范围，不能把没有报告当作所有行为都合法。

## 编译警告和检查器发现不同问题

GCC 与 Clang 的 -Wall、-Wextra、-Wpedantic 等选项扩大诊断范围；选项名与作用属于工具链接口。项目可以把相关警告当作构建错误，但仍须处理来自系统头文件或不同工具链的边界。

运行期检查器（Sanitizer）为执行加入检测，例如：

| 工具 | 主要检查方向 |
| --- | --- |
| AddressSanitizer | 相应内存越界、释放后访问等问题 |
| UndefinedBehaviorSanitizer | 受支持的未定义行为检查 |
| ThreadSanitizer | 相应数据竞争 |

它们需要受支持的编译器、运行库和平台；尤其线程检查器不能无条件当作所有 Windows 环境可用工具。执行未覆盖的路径、未支持的错误类型，仍可能没有报告。

## 诊断不能代替对象模型

检查器不会普遍证明业务不变式、完整同步协议或跨库 ABI。一项悬空视图恰巧还读到原字节，可能没有立即报错；生命周期仍已不成立。

用错误程序验证诊断能力时，应明确预期错误类型，不将其输出记录成语言保证。正常示例则须消除实际报告，而不是简单关闭检查。

> [!PRACTICE]
> 建立形式检查、行为验证、运行期检测和人工语义审阅的组合。每项结果记录工具条件及覆盖范围，风险集中在模型和接口边界，不靠重复运行相同路径制造信心。

## 参考资料

- [Clang 官方文档：AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html)
- [Clang 官方文档：UndefinedBehaviorSanitizer](https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html)
- [Clang 官方文档：ThreadSanitizer](https://clang.llvm.org/docs/ThreadSanitizer.html)
