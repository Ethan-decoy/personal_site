---
title: 04 · 序列、映射与集合
date: 2026-11-10
---

# 序列、映射与集合

本章从列表的长度与索引开始，建立容器中元素的访问与修改规则。

1. [列表、长度与索引](01-lists-length-and-indexing.md)：按位置读取或替换列表元素，理解当前长度、正负索引与访问边界。
2. [列表切片](02-list-slicing.md)：按区间与步长选取元素，理解默认边界、越界处理及新列表与共享元素的关系。
3. [列表的添加与移除](04-adding-and-removing-list-elements.md)：区分添加一个对象与扩展一组元素、按位置取出与按值移除，核对修改效果、返回结果及失败条件。
4. [列表切片赋值](03-list-slice-assignment.md)：按区间修改原列表，区分长度变化与名称重新绑定。
   - 附章：[切片的边界与赋值细则](deep-dives/02-slice-boundaries-and-assignment-details.md)
5. [元组与不可变序列](05-tuples-and-immutable-sequences.md)：理解元组的写法、序列读取与不可变边界，区分外层引用、可变元素及类型转换的结果。
   - 附章：[元组操作与对象复用](deep-dives/03-tuple-operations-and-object-reuse.md)
6. [序列解包](06-sequence-unpacking.md)：按位置绑定元素，理解数量匹配、右侧求值顺序与带星目标接收剩余元素的规则。
7. [字符串的长度、索引与切片](07-string-length-indexing-and-slicing.md)：按 Unicode 码点理解文本长度与位置，区分读取结果、显示字符组合和字符串重新绑定。
   - 附章：[Unicode 转义与组合字符](deep-dives/01-unicode-escapes-and-combining-characters.md)
8. [字符串的拆分与拼接](08-splitting-and-joining-strings.md)：区分指定分隔符与默认空白拆分，理解字符串片段的拼接条件及文本间隔的保留范围。
9. [字典与按键访问](09-dictionaries-and-key-lookup.md)：以键关联值，区分缺键、已有空值与可哈希条件。
10. [字典的修改与条目](10-dictionary-mutation-and-items.md)：按键设置与移除条目，理解插入顺序、字典视图及列表结果。
11. [集合与成员判断](11-sets-and-membership.md)：按唯一元素组织数据，使用成员判断、原地增删与交并差。
