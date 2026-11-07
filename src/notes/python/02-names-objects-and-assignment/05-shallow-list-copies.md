---
title: 列表的浅复制（Shallow Copies of Lists）
date: 2026-11-07
order: 5
---

# 列表的浅复制（Shallow Copies of Lists）

[简单名称赋值不会复制列表](01-names-and-assignment.md#重新绑定与多个名称)，多个名称因而可以引用同一个列表，[原地修改也可以通过这些引用取得](04-mutation-and-shared-references.md#修改同一个列表)。列表的浅复制则创建另一个列表对象，同时保留原来的元素引用。

脚本示例均为完整程序，分别在 CPython 3.14 中独立运行。

## 复制创建新的列表对象

`copy` 是列表提供的另一个[方法](04-mutation-and-shared-references.md#修改同一个列表)。`source.copy()` 中的空括号发起一次不带额外实参的调用。正常完成时，它返回一个新列表，不修改 `source` 所引用的原列表；新列表按原顺序保存同一批元素对象的引用。这种复制称为浅复制（shallow copy）。

```python
source = [3]
target = source.copy()
target.append(4)

print(source)
print(target)
print(source is target)
```

第一行创建一个含有整数元素 `3` 的列表。第二行先调用 `copy`，得到另一个含有相同元素引用的列表，再让 `target` 绑定到返回结果。第三行只向 `target` 所引用的列表追加整数 `4`。输出为：

```text
[3]
[3, 4]
False
```

两个列表起初都引用原来的整数对象 `3`，但各自保存元素引用。向目标列表追加元素，不会向原列表追加元素，因此原列表仍显示为 `[3]`。`[3, 4]` 的方括号内有两个元素，逗号分隔它们的表示形式。最后的 [`is` 比较](03-object-identity-and-equality.md#相等与身份分别判断)得到 `False`，与 `copy` 创建另一个列表的契约相符。

新列表来自右侧的 `copy()` 调用，赋值只负责让 `target` 绑定到这个结果。若写成 `target = source`，右侧读取的是已有列表对象，两个名称就会引用同一个列表。

> [!IMPORTANT] 浅复制的独立范围
> **列表浅复制创建新列表，按原顺序保留元素引用，不继续复制元素对象。**新列表本身的追加操作独立；若两边仍引用同一个可变元素对象，该对象的原地修改仍可从两边取得。外层列表身份不同，不能证明元素对象也已独立。

## 外层独立与内层共享

列表保存对象引用，元素也可以引用另一个列表。`source = [inner]` 创建一个外层列表，它只有一个元素，这个元素引用名称 `inner` 当前绑定的内层列表。例如，外层中包含一个内容为 `[3]` 的内层列表时，会显示为 `[[3]]`：外面的一对方括号表示外层列表，里面的一对表示作为元素的内层列表。

```python
inner = [3]
source = [inner]
target = source.copy()
inner.append(4)

print(source)
print(target)
print(source is target)
```

复制完成时，`source` 引用原外层列表，`target` 引用新外层列表；两个外层列表保存的唯一元素引用，都指向 `inner` 所引用的那个列表。此时共有三个列表对象。

第四行通过 `inner` 修改这个共享的内层列表，将它从 `[3]` 改为 `[3, 4]`。两个外层保存的元素引用都没有改变，仍然指向修改后的内层列表，因而输出为：

```text
[[3, 4]]
[[3, 4]]
False
```

这里的 `False` 回答的是两个外层列表是否为同一对象。内层是否共享，需要另行追踪元素引用，不能由这个结果推出。两边都显示内层修改，是因为浅复制保留了对同一个内层对象的引用。

若追加调用的对象是 `target`，增加的元素就属于目标外层列表：

```python
inner = [3]
source = [inner]
target = source.copy()
target.append(4)

print(source)
print(target)
print(source is target)
```

这份独立脚本从相同的初始结构开始。第四行向 `target` 所引用的外层列表追加整数 `4`，原有的内层列表仍为 `[3]`。输出为：

```text
[[3]]
[[3], 4]
False
```

目标外层现在有两个元素：第一个引用内层列表，第二个引用整数 `4`。原外层仍只有对内层列表的那个引用。两次调用都追加整数 `4`，但 `inner.append(4)` 修改共享内层，`target.append(4)` 修改目标外层，影响范围由实际取得并修改的对象决定。

## 需要内层独立时复制哪一层

需要分别修改内层列表时，可以为这一层也建立副本。`[inner.copy()]` 先执行方括号中的 `copy()` 调用，得到内层列表副本，再创建一个以该副本为唯一元素的外层列表：

```python
inner = [3]
source = [inner]
target = [inner.copy()]
inner.append(4)

print(source)
print(target)
print(source is target)
```

第三行创建了两个列表对象：`inner.copy()` 返回的内层副本，以及包含它的目标外层列表。`source` 中的元素仍引用原来的 `inner`，`target` 中的元素则引用内层副本。

第四行只修改原来的内层列表，目标中的内层副本保留原有内容。输出为：

```text
[[3, 4]]
[[3]]
False
```

本例两份外层列表、两份内层列表分别保存自己的元素引用，因而对各自列表的追加可以独立进行。内层副本保存的整数引用仍按浅复制规则保留；整数对象本身[不可变](04-mutation-and-shared-references.md#不可变对象与重新绑定)。这里独立的是这两层列表，不能据此断言所有层次的对象都已复制；更深结构若包含需要独立修改的可变对象，还须继续辨认相应的引用关系。

> [!PRACTICE] 按修改需求选择复制层次
> 需要共同读取同一份更新时，可以保留共享引用；只需要独立调整外层列表的元素安排时，可以使用列表浅复制；需要独立修改某个内层列表时，再为该层建立副本。复制会增加对象和复制工作，选择应依据需要独立保存的状态。本例两层列表的写法适用于这里的结构，更深嵌套仍要按实际对象关系判断。

## 参考资料

- [Python 3.14 教程：列表的 copy 方法](https://docs.python.org/3.14/tutorial/datastructures.html#more-on-lists)
- [Python 3.14 标准库：浅复制与深复制的对象关系](https://docs.python.org/3.14/library/copy.html)
- [Python 3.14 语言参考：对象、值、类型与容器引用](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 语言参考：列表创建表达式](https://docs.python.org/3.14/reference/expressions.html#list-displays)
