---
title: 字典的修改与条目（Dictionary Mutation and Items）
date: 2026-11-12
order: 10
---

# 字典的修改与条目（Dictionary Mutation and Items）

字典可以原地设置或移除条目。修改之后，键、值与条目视图反映字典当前的内容；条目的顺序则按键进入字典的先后保留。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。操作对象均为内置 `dict`。

## 设置条目与原地修改

`frame[key] = value` 按键设置关联值。先对右侧求值，再用所得对象完成条目赋值；键已经存在就替换关联的值，键不存在就新增条目。键仍须满足[可哈希条件](09-dictionaries-and-key-lookup.md#键的相等与可哈希条件)。

`frame` 中的高度与宽度以像素为单位，`"channels"` 表示图像通道数。更新高度并补入通道数，改变的是同一个字典：

```python
frame = {"height": 480, "width": 640}
alias = frame
frame["height"] = 720
frame["channels"] = 3

print(frame)
print(alias is frame)
print(len(frame))
```

输出为：

```text
{'height': 720, 'width': 640, 'channels': 3}
True
3
```

`"height"` 原本存在，更新后仍是一项；`"channels"` 原本不存在，新增后长度变为三。`frame` 与 `alias` 的绑定没有改变，仍引用被修改的同一字典，这与[对象修改和名称重新绑定的区别](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改对象与重新绑定名称)一致。

这里的 `frame["channels"] = 3` 不要求键预先存在；[`frame["channels"]` 的读取](09-dictionaries-and-key-lookup.md#按键读取与缺失结果)则要求存在。方括号出现在读取位置与赋值目标位置，承担的职责不同。

## 按键移除条目

`frame.pop(key)` 移除指定键的条目，返回该条目原来关联的值。它按键选择，不按条目当前排在第几个位置选择。

`frame.pop(key, default)` 还允许给出缺键时的默认结果：键不存在就返回默认值，不修改字典。省略默认值且键不存在时，引发 `KeyError`：

```python
frame = {"height": 480, "width": 640, "channels": 3}
channels = frame.pop("channels")
missing = frame.pop("label", None)

print(channels)
print(missing)
print(frame)
```

输出为：

```text
3
None
{'height': 480, 'width': 640}
```

第一次调用移除了 `"channels"` 条目，将原值三绑定到 `channels`。第二次没有找到 `"label"`，返回显式给出的默认值 `None`，没有新增或移除条目。已有值本身就是 `None` 时，`pop` 仍会移除那个已有条目。

没有默认结果的缺键调用会失败：

```python
frame = {"height": 480, "width": 640}
print(frame)
removed = frame.pop("channels")
print("after removal")
```

第三行在运行时引发 `KeyError`。此前已经输出：

```text
{'height': 480, 'width': 640}
```

异常末行为：

```text
KeyError: 'channels'
```

没有条目被移除，`removed` 尚未绑定，最后一行不会执行。返回一个缺键默认结果与移除已有条目，是需要分别判断的两种情形。

## 插入顺序与条目位置

字典保留键的插入顺序，不按键名或关联值自动排序。更新已有键的值，不改变该键的位置；移除后重新插入，则作为新插入的条目放在末尾：

```python
frame = {"height": 480, "width": 640}
frame["height"] = 720
print(frame)

frame.pop("height")
frame["height"] = 1080
print(frame)
```

输出为：

```text
{'height': 720, 'width': 640}
{'width': 640, 'height': 1080}
```

第一次修改只替换 `"height"` 的关联值，所以它仍在 `"width"` 之前。随后移除 `"height"`，再插入同名键，当前顺序便是 `"width"` 在前、`"height"` 在后。

顺序并不把字典变成位置序列：`frame[0]` 仍按键零查找，不表示读取排在最前的条目。

> [!IMPORTANT] 字典的修改与插入顺序
> **按键赋值和 `pop` 修改原字典：设置已有键替换其值，设置新键增加条目，`pop` 移除条目并返回原值。**字典保留插入顺序，更新值不改变键的位置，移除后重加进入末尾。关联值与排列位置分别判断，读取仍以键为依据。

## 键、值与条目视图

`frame.keys()`、`frame.values()` 与 `frame.items()` 返回字典视图（dictionary view）。视图关联原字典，能够逐个提供当前的相应内容，并随字典的变化反映这些变化；它不是保存调用时内容的列表副本。

| 调用 | 视图提供的内容 |
| --- | --- |
| `frame.keys()` | 各个键 |
| `frame.values()` | 各个关联值 |
| `frame.items()` | 各个 `(key, value)` 二元素元组 |

`list(view)` 按视图当前提供的顺序建立一个列表，调用形式沿用[可迭代来源到列表的转换](05-tuples-and-immutable-sequences.md#列表与元组的转换)。三个视图的内容分别为：

```python
frame = {"height": 480, "width": 640}
keys = frame.keys()
values = frame.values()
items = frame.items()

print(list(keys))
print(list(values))
print(list(items))
```

输出为：

```text
['height', 'width']
[480, 640]
[('height', 480), ('width', 640)]
```

条目视图提供的每一项都是二元素元组，先放键、再放对应值。键、值与条目按相同的插入顺序提供；直接把字典交给 `list(frame)`，取得的也是键列表。

视图支持成员判断，检查的单位各不相同：`"height" in keys` 查键，`480 in values` 查值，`("height", 480) in items` 则检查整对键与值。视图自身不支持像列表那样按整数位置取元素；需要位置访问时，先取得列表结果。

保存视图与保存列表结果，会在字典改变后显示出区别：

```python
frame = {"height": 480, "width": 640}
items = frame.items()
saved = list(items)

frame["height"] = 720
frame["channels"] = 3

print(list(items))
print(saved)
```

输出为：

```text
[('height', 720), ('width', 640), ('channels', 3)]
[('height', 480), ('width', 640)]
```

`items` 仍关联原字典，新取得的列表反映当前高度七百二十和新增通道数三。`saved` 则是修改前已经建立的列表，字典后来的条目替换与新增不会重新安排它的内容。建立列表仍只保留当时的元素引用，不能由这个结果推出[内层对象也被复制](../02-names-objects-and-assignment/05-shallow-list-copies.md#外层独立与内层共享)。

> [!IMPORTANT] 字典视图与列表结果
> **`keys/values/items` 返回关联原字典的视图，分别提供键、值与 `(key, value)` 元组，后续取用反映字典当前内容。**`list(view)` 则按取用时的内容建立列表，之后的条目替换或新增不会自动更新该列表；元素对象的共享关系仍须另行判断。

## 参考资料

- [Python 3.14 内置类型：字典的修改与顺序](https://docs.python.org/3.14/library/stdtypes.html#mapping-types-dict)
- [Python 3.14 内置类型：字典视图](https://docs.python.org/3.14/library/stdtypes.html#dictionary-view-objects)
- [Python 3.14 语言参考：下标赋值](https://docs.python.org/3.14/reference/simple_stmts.html#assignment-statements)
