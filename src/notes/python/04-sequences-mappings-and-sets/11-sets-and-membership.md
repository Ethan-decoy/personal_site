---
title: 集合与成员判断（Sets and Membership Tests）
date: 2026-11-12
order: 11
---

# 集合与成员判断（Sets and Membership Tests）

一组图像标注中，类别名称可以反复出现。列表能保留这些记录的次数与次序；集合（set）只保留不同的元素，适合表示出现过哪些类别，以及判断某个类别是否在其中。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。成功示例使用内置集合，元素为字符串或整数。

## 集合的创建与唯一元素

非空集合可以在大括号中写出元素表达式，并用逗号分隔，例如 `{"cat", "dog"}`。这与[字典的键值对应](09-dictionaries-and-key-lookup.md#用键描述对应关系)不同：集合中直接写元素，没有 `key: value` 这样的条目。

集合元素与字典键一样，需要满足[可哈希条件](09-dictionaries-and-key-lookup.md#键的相等与可哈希条件)。本篇使用的字符串、整数可以作为元素，列表不能作为元素。

`len(labels)` 返回集合当前的元素个数。对于这里的字符串，相等的值只保留一项，重复写出不会增加数量：

```python
labels = {"cat", "dog", "cat"}
empty = set()

print(type(labels), len(labels))
print(type(empty), len(empty))
print(type({}))
```

输出为：

```text
<class 'set'> 2
<class 'set'> 0
<class 'dict'>
```

`labels` 引用的集合只包含 `"cat"` 与 `"dog"` 两个元素。**空集合写作 `set()`，空大括号 `{}` 已经表示空字典。**

`set(source)` 也能从[可迭代来源](04-adding-and-removing-list-elements.md#追加一个对象与扩展一组元素)创建集合。来源是列表或元组时，逐个提供其中的元素；重复值不会在所得集合中占据多项：

```python
source = ["cat", "dog", "cat"]
labels = set(source)

print(len(source), len(labels))
print(source)
```

输出为：

```text
3 2
['cat', 'dog', 'cat']
```

创建集合没有删除来源列表中的重复记录。`source` 仍有三项，`labels` 则包含两个不同的类别名称。

`set(source)` 可以接收列表作元素来源，不代表这个列表本身就能成为集合的一个元素。

## 成员判断与元素次序

对于本篇使用的字符串或整数查询值，`value in labels` 判断集合中是否有与 `value` 对应的元素，`value not in labels` 判断是否没有，结果都是布尔值。这个[成员判断写法](09-dictionaries-and-key-lookup.md#成员判断检查的是键)在字典中检查键，在集合中直接检查元素。

两个集合相等，要求它们包含相同的元素。元素在字面量中写出的先后，不影响这种相等关系：

```python
labels = {"cat", "dog"}

print("cat" in labels)
print("bird" in labels)
print("bird" not in labels)
print(labels == {"dog", "cat"})
```

输出为：

```text
True
False
True
True
```

`"cat"` 存在，`"bird"` 不存在；最后的相等比较确认两个集合具有相同元素。

**集合不记录元素的位置或插入次序，不提供索引和切片。**即使打印时能看到一串排列，也不能把最左边的元素当成具有“索引零”的首项，或依赖这项排列恢复来源列表的顺序。按下标访问集合会在运行时引发 `TypeError`。

> [!IMPORTANT] 集合的元素与成员关系
> **集合保存不同的可哈希元素；本篇的字符串或整数中，相等的值只占一项。**`len` 计算当前元素数，`in` 与 `not in` 判断元素是否存在，集合相等取决于元素内容。集合不保留位置与插入次序，不能用索引、切片或显示排列解释其元素关系。

## 集合的添加与移除

内置 `set` 可以原地修改。`labels.add(value)` 添加一个元素；如果相等的元素已经存在，数量不会增加。`labels.remove(value)` 移除已有元素；`labels.discard(value)` 也移除元素，但允许该元素本来就不存在。这三项方法正常完成后都返回 `None`。

`alias` 与 `labels` 引用同一个集合，增删会通过两处引用体现：

```python
labels = {"cat"}
alias = labels

added = labels.add("dog")
labels.add("dog")
print(len(labels), "dog" in alias)
print(added)

removed = labels.remove("cat")
missing = labels.discard("bird")
print("cat" in alias, len(labels))
print(removed, missing)
```

输出为：

```text
2 True
None
False 1
None None
```

第一次添加让集合多了 `"dog"`，第二次添加同一个值没有再增加元素。移除 `"cat"` 后，集合中只剩 `"dog"`；本来就不存在的 `"bird"` 经 `discard` 处理后仍不存在。两个名称没有重新绑定，仍引用被修改的同一个集合，延续了[共享引用与原地修改](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改同一个列表)的关系。

> [!IMPORTANT] 集合修改与返回结果
> **`add`、`remove` 与 `discard` 修改原集合，正常返回 `None`；其他引用同一集合的名称也会取得修改结果。**添加已有元素不增加数量；`remove` 要求元素存在，否则引发 `KeyError`；`discard` 允许元素缺失，缺失时保持集合内容不变。

`add` 添加的是参数对象本身，不会把来源逐个展开。把列表作为一个元素添加，违反了可哈希条件：

```python
labels = {"cat"}
print(len(labels))
labels.add(["dog"])
print("after addition")
```

第三行在运行时引发 `TypeError`。此前已经输出：

```text
1
```

异常末行为：

```text
TypeError: cannot use 'list' as a set element (unhashable type: 'list')
```

这次调用没有把列表或其中的 `"dog"` 加入集合，`labels` 仍只包含 `"cat"`，最后一行不会执行。它与 `set(["dog"])` 的角色不同：后者把列表作为来源，取得能作元素的字符串 `"dog"`。

对缺失元素调用 `remove`，则会以 `KeyError` 失败：

```python
labels = {"cat"}
print(len(labels))
labels.remove("bird")
print("after removal")
```

第三行运行时找不到要移除的元素。此前已经输出：

```text
1
```

异常末行为：

```text
KeyError: 'bird'
```

集合仍只包含 `"cat"`，最后一行不会执行。对于本篇使用的字符串或整数元素，`discard` 适用于“处理后保证它不存在”的要求；需要在元素缺失时报告失败，则由 `remove` 保留这项检查。

## 交集、并集与差集

两组类别可以按元素关系生成另一个集合。对于两个内置集合 `present` 与 `selected`：

| 表达式 | 所得集合中的元素 |
| --- | --- |
| `present & selected` | 两边都包含的元素，称为交集（intersection） |
| `present \| selected` | 至少一边包含的元素，称为并集（union） |
| `present - selected` | 在 `present` 中、却不在 `selected` 中的元素，称为差集（difference） |

这些运算返回新的集合，不修改两侧原集合。`&`、`|` 与 `-` 在这里的两侧都采用集合，不能把列表直接放到另一侧当作同一种输入。

`present` 表示已出现的类别，`selected` 表示选中的类别：

```python
present = {"cat", "dog"}
selected = {"dog", "bird"}

common = present & selected
combined = present | selected
remaining = present - selected

print(common == {"dog"})
print(combined == {"cat", "dog", "bird"})
print(remaining == {"cat"})
print((selected - present) == {"bird"})
print(present == {"cat", "dog"})
```

输出为：

```text
True
True
True
True
True
```

交集只包含两边共有的 `"dog"`；并集包含三个不同类别；`present - selected` 则只保留尚未选中的 `"cat"`。把差集两侧交换，得到的是只在 `selected` 中的 `"bird"`。最后的相等比较确认 `present` 的内容没有因这些结果而改变。

**差集的方向有意义。**`left - right` 保留左边独有的元素，不能一般地与 `right - left` 互换。交并差解决的是元素关系，所得集合仍然不携带元素次序。

## 参考资料

- [Python 3.14 内置类型：集合的创建、成员判断与集合运算](https://docs.python.org/3.14/library/stdtypes.html#set-types-set-frozenset)
- [Python 3.14 内置类型：集合添加与移除](https://docs.python.org/3.14/library/stdtypes.html#set.add)
