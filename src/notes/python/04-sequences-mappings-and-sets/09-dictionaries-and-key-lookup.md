---
title: 字典与按键访问（Dictionaries and Key Lookup）
date: 2026-11-12
order: 9
---

# 字典与按键访问（Dictionaries and Key Lookup）

列表按位置安排元素；字典（dictionary）则保存键到值的对应关系。图像的高度和宽度可以分别关联到 `"height"` 与 `"width"`，读取时直接给出所需的键。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。操作对象均为内置 `dict`。

## 用键描述对应关系

字典写作 `{key: value, ...}`：花括号围住条目，冒号分开键（key）与值（value），逗号分隔不同条目。一个键及其关联的值组成一个条目（item）。空字典写作 `{}`。

`frame` 记录图像的像素尺寸，其中两个键是字符串，两个值是整数。`frame["height"]` 查找键 `"height"` 所关联的值：

```python
frame = {"height": 480, "width": 640}

print(frame)
print(frame["height"])
print(frame["width"])
print(len(frame))
```

输出为：

```text
{'height': 480, 'width': 640}
480
640
2
```

`len(frame)` 计算条目数。这里不是把键与值各算一个元素，因此长度是二。字典保存键和值的引用；读取返回对应的值对象，不会自动复制它。

方括号中的内容是键，不是序号。`frame[0]` 会查找整数键零，不表示“读取第一个条目”；`"height"` 两侧的引号也有作用，它指定字符串键，而不是读取名为 `height` 的名称。

## 按键读取与缺失结果

对内置字典，`frame[key]` 要求键已经存在。键不存在时，读取会在运行时引发键错误 `KeyError`：

```python
frame = {"height": 480, "width": 640}
print(frame)
channels = frame["channels"]
print("after lookup")
```

第三行查找不存在的键 `"channels"`。此前已经输出：

```text
{'height': 480, 'width': 640}
```

异常末行为：

```text
KeyError: 'channels'
```

右侧没有取得结果，`channels` 尚未绑定，原字典没有改变；脚本随未处理的异常终止，最后一行不会执行。

允许缺少某项信息时，可以调用 `frame.get(key)` 或 `frame.get(key, default)`。键存在就返回其关联的值；键不存在才返回默认值，省略默认值时采用 `None`。默认值只作为调用结果返回，不插入字典：

```python
frame = {"height": 480, "count": 0, "label": None}

print(frame.get("height"))
print(frame.get("count", 99))
print(frame.get("label"))
print(frame.get("channels"))
print(frame.get("channels", 3))
print(frame)
```

输出为：

```text
480
0
None
None
3
{'height': 480, 'count': 0, 'label': None}
```

`"count"` 已经存在，即使值为零，也不会改用默认值九十九。`"channels"` 不存在，所以两次调用分别取得默认的 `None` 与显式默认值三；字典中仍然没有新增这一项。

> [!IMPORTANT] 按键读取与缺失结果
> **`d[key]` 返回已有键关联的值，缺键时引发 `KeyError`；`d.get(key, default)` 则在缺键时返回默认值，不插入条目。**`get` 省略默认值时采用 `None`；它依据键是否存在作选择，不按已有值的真值决定是否采用默认值。

> [!WARNING] 返回 None 不等于键不存在
> **仅凭 `d.get(key) is None`，不能断定字典中没有这个键。**键已经存在、关联值恰好为 `None` 时，也会得到相同结果；把这种结果当成缺键，会误判已有条目。

## 成员判断检查的是键

`key in frame` 检查字典是否含有这个键，返回布尔值；`key not in frame` 检查键是否不存在。`in` 与 `not in` 是成员测试（membership test）的两种写法，左侧给出待检查对象，右侧给出容器。

字典上的成员判断不直接搜索值，也不根据值是否为空决定结果：

```python
frame = {"height": 480, "label": None}

print("height" in frame)
print(480 in frame)
print("label" in frame)
print("channels" not in frame)
```

输出为：

```text
True
False
True
True
```

整数四百八十虽然是一个值，却不是这个字典的键。`"label"` 则确实存在，即使它关联 `None`，成员判断仍为 `True`。需要区分缺键与已有的空值时，检查键的成员关系。

> [!IMPORTANT] 字典的成员判断
> **对内置字典，`key in d` 判断键是否存在，`key not in d` 判断键是否不存在，结果均为布尔值。**关联值是零、空字符串或 `None`，不会使已有键被判为不存在；这项判断不直接搜索字典的值。

## 键的相等与可哈希条件

字典的键须可哈希（hashable）：对象能提供在其生命期内保持稳定、用于查找的哈希值（hash value），并且相等对象的哈希值必须一致。具体哈希数值不属于键的使用方式；键的相等关系也参与判断，不能把哈希值当成对象的唯一编号。

字符串和整数可以作为键。元组则取决于其中的元素：所有元素都可哈希时，元组才能作为键。下表限定于已介绍的内置类型：

| 键的写法 | 能否作为键 | 条件 |
| --- | --- | --- |
| `"height"` | 可以 | 字符串可哈希 |
| `0` | 可以 | 整数可哈希 |
| `(0, 1)` | 可以 | 两个整数元素均可哈希 |
| `[0, 1]` | 不可以 | 列表不可哈希 |
| `(0, [1])` | 不可以 | 元组中包含不可哈希的列表 |

因此，[元组自身不可变](05-tuples-and-immutable-sequences.md#不可变性约束哪一层)不意味着任何元组都能作为键。字典的值没有同样的限制，可以关联列表等可变对象。

不可哈希的对象不能作为字典中的键。下面的源码写法成立，但运行到创建字典时会失败：

```python
print("before dictionary")
labels = {[0, 1]: "point"}
print("after dictionary")
```

第二行使用列表作键，引发 `TypeError`。此前已经输出：

```text
before dictionary
```

异常末行为：

```text
TypeError: cannot use 'list' as a dict key (unhashable type: 'list')
```

右侧字典创建失败，`labels` 尚未绑定，最后一行不会执行。

可哈希的键还要按相等关系区分。比较相等的整数一、浮点数一和 `True` 可以查找同一个条目；它们不会仅因类型不同就自动成为三个键：

```python
values = {1: "integer", 1.0: "float", True: "boolean"}

print(len(values))
print(values[1])
print(values[1.0])
print(values[True])
```

输出为：

```text
1
boolean
boolean
boolean
```

这三个键比较相等，后给出的值替换了前面的对应值，因此最终只有一个条目，关联最后给出的字符串 `"boolean"`。字符串键 `"1"` 与这些数值键并不相等，可以对应另一条目。

> [!IMPORTANT] 键的约束与相等关系
> **字典键须可哈希；元组还要求其元素均可哈希，值对象则没有这项要求。**可哈希的键中，比较相等的键可以查找同一个条目，重复指定这类键时，后给出的值取代前值。可哈希条件不能只用“外层不可变”代替判断。

## 参考资料

- [Python 3.14 内置类型：字典、按键访问与 get](https://docs.python.org/3.14/library/stdtypes.html#mapping-types-dict)
- [Python 3.14 语言参考：字典条目的创建与重复键](https://docs.python.org/3.14/reference/expressions.html#dictionary-displays)
- [Python 3.14 术语表：可哈希](https://docs.python.org/3.14/glossary.html#term-hashable)
