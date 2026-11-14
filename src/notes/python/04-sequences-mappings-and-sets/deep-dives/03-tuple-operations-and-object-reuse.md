---
title: 元组操作与对象复用（Tuple Operations and Object Reuse）
date: 2026-11-12
order: 2
---

# 元组操作与对象复用（Tuple Operations and Object Reuse）

元组操作得到相应的序列结果，不代表每次都创建不同身份的对象。元组自身不可变，结果允许复用已有对象的情形，需要按各项操作的契约判断。

这里的读取与转换分别沿用[元组切片](../05-tuples-and-immutable-sequences.md#按位置读取与切片)和[列表／元组转换](../05-tuples-and-immutable-sequences.md#列表与元组的转换)。各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；操作对象均为内置元组。

## 完整切片与实现行为

在这里使用的 CPython 3.14.10 中，对内置元组作完整的正向切片，会直接复用原元组：

```python
size = (480, 640)
whole = size[:]

print(whole)
print(whole is size)
```

输出为：

```text
(480, 640)
True
```

`whole` 与 `size` 在这次运行中引用同一个元组。这个实现行为不能推广为“所有元组切片都返回原对象”；例如 `size[:1]` 的元素个数已经不同，结果不可能仍是原来的二元素元组。切片所保证的是按规则取得相应序列结果，不能把列表切片的对象独立性直接推广到元组。所选的元素对象也不会因切片而被逐个复制。

## 已有元组与 tuple 调用

**`list(source)` 创建新的外层列表；`tuple(source)` 则不保证创建新对象。**来源已经是内置元组时，`tuple` 直接返回该元组：

```python
size = (480, 640)
same = tuple(size)

print(same)
print(same is size)
```

输出为：

```text
(480, 640)
True
```

这项返回约定与来源为列表时不同。`tuple(size)` 没有产生另一个元组，不能把它当成保证对象独立的复制方式。

## 参考资料

- [Python 3.14 内置类型：元组的构造与序列操作](https://docs.python.org/3.14/library/stdtypes.html#tuples)
- [Python 3.14 语言参考：不可变对象的身份](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [CPython 3.14.10 源码：元组切片的结果复用](https://github.com/python/cpython/blob/v3.14.10/Objects/tupleobject.c#L791)
