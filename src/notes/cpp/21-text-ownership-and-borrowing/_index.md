---
title: 21 · 文本的保存与借用
date: 2026-09-15
---

# 文本的保存与借用

保存传感器名称、组合记录、从记录中选取字段，都会处理字符序列，但不一定需要为每一步建立独立副本。本章把文本的拥有、内容操作和范围借用连起来，说明什么时候需要保存字符，什么时候只需要访问已有文本。

`std::string` 拥有字符序列，`std::string_view` 只记录借用范围。两者都能表达一段文本；复制、截取和返回结果时的职责却不同，使用时需要同时判断字符内容、范围边界与有效期。

1. [字符串对象与字符序列（String Objects and Character Sequences）](01-string-objects-and-character-sequences.md)
2. [文本比较与组合（Text Comparison and Composition）](02-text-comparison-and-composition.md)
3. [字符串视图与文本借用（String Views and Borrowed Text）](03-string-views-and-borrowed-text.md)
4. [文本查找与片段选取（Searching and Selecting Text）](04-searching-and-selecting-text.md)
5. [文本借用的有效期与接口边界（Text Lifetimes and Interface Boundaries）](05-text-lifetimes-and-interface-boundaries.md)

查询长度与结尾空字符、字符串的下标边界，可以定位到第一篇；查询字符串的容量、增长与预留方式，可以定位到第二篇；查询子串是否拥有字符、截取越界如何处理，可以定位到第三篇；查询 `find` 的缺失结果与位置运算，可以定位到第四篇；保存或返回视图时，应同时核对第五篇的来源与修改条件。

附章以完整的文本拥有与借用模型为前提：[空终止文本与指针接口](deep-dives/01-null-terminated-text-and-pointer-interfaces.md)解释按长度读取与按结束标记读取的差别，[字符串的存储选择与移动边界](deep-dives/02-string-storage-and-move-boundaries.md)解释短字符串优化及其成本取舍。主线已经给出正确使用所需的边界，附章用于进一步理解接口接合与实现机制。
