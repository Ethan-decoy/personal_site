---
title: 列表的添加与移除（Adding and Removing List Elements）
date: 2026-11-10
order: 3
---

# 列表的添加与移除（Adding and Removing List Elements）

列表的添加与移除改变原列表保存的元素引用，列表对象的身份保持不变。添加时，可以放入一个对象，也可以接收来源逐个提供的元素；移除时，可以指定位置，也可以寻找匹配的值。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。成功示例中的扩展来源均为内置列表。

## 追加一个对象与扩展一组元素

`values.append(value)` 在原列表末尾追加对 `value` 的引用，正常完成后返回 `None`。`append` 通过[列表对象取得并调用](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改同一个列表)，参数本身是列表时，也仍然只添加一个元素。

`values.extend(source)` 接收能够逐个提供元素的 `source`，这类对象称为可迭代对象（iterable）。来源是列表时，`extend` 按来源的元素顺序，把这些元素引用依次追加到目标列表末尾，正常完成后也返回 `None`。

`appended` 与 `extended` 各自引用一个初始内容相同的独立列表，`source` 是它们共同使用的来源：

```python
source = [99, 88]
appended = [30, 10, 20, 40]
extended = [30, 10, 20, 40]

append_result = appended.append(source)
extend_result = extended.extend(source)

print(appended)
print(extended)
print(len(appended), len(extended))
print(append_result, extend_result)
print(appended[-1] is source)
```

输出为：

```text
[30, 10, 20, 40, [99, 88]]
[30, 10, 20, 40, 99, 88]
5 6
None None
True
```

`append` 把整个 `source` 列表作为一个元素放到末尾，长度只增加一；最后的身份比较说明，这个元素就是 `source` 引用的对象。`extend` 使用的则是来源中的整数九十九与八十八，长度增加二。

**`extend` 只接收来源直接提供的元素，不继续展开内层列表，也不复制这些元素对象。**来源直接提供的元素本身是列表时，目标会保存对这些内层列表的引用：

```python
source = [[99], [88]]
values = [30, 10, 20, 40]
values.extend(source)

source[0].append(77)

print(source)
print(values)
print(values[-2] is source[0])
```

输出为：

```text
[[99, 77], [88]]
[30, 10, 20, 40, [99, 77], [88]]
True
```

`source[0]` 与 `values[-2]` 取得同一个内层列表。追加七十七修改了这个内层列表，因此经两处引用都能读取到修改结果。外层 `source` 与 `values` 仍是两个列表；扩展没有让目标绑定到来源，也没有把来源中的引用关系变为深复制。

> [!IMPORTANT] 添加的单位与元素引用
> **`append(value)` 将参数对象作为一个元素追加；`extend(source)` 接收可迭代来源逐个提供的元素。**来源是列表时，前者增加一个元素，后者按来源的元素顺序扩展；空来源不增加元素。两者都修改原列表、正常返回 `None`，添加的元素仍是原对象的引用，不因添加而获得独立副本。

`extend` 需要的是能够提供元素的来源，整数不满足这个条件。它不会自动把一个整数当成含有该整数的列表：

```python
values = [30, 10, 20, 40]
print(values)
values.extend(99)
print("after extend")
```

第三行执行调用时引发 `TypeError`。此前已经输出：

```text
[30, 10, 20, 40]
```

异常末行为：

```text
TypeError: 'int' object is not iterable
```

这个调用因整数不能提供元素而失败，目标列表没有改变；最后一行不会执行。若要把整数九十九作为一个元素放入末尾，`values.append(99)` 就符合这个目的。

## 按位置插入与取出

### 插入位置与已有元素

`values.insert(index, value)` 在指定位置之前插入一个元素。括号中的两个实参按顺序用逗号隔开：第一个给出位置，第二个给出要放入的对象。位置使用整数；传入 `1.0` 这样的浮点数会引发 `TypeError`，不会自动转换为整数位置。

```python
values = [30, 10, 20, 40]
result = values.insert(1, 99)

print(values)
print(result)
```

输出为：

```text
[30, 99, 10, 20, 40]
None
```

九十九进入索引一处，原来从这个位置开始的元素依次向后移动一位，列表长度增加一。它没有替换原来的整数十；[索引赋值](01-lists-length-and-indexing.md#读取元素与替换元素)才会替换指定位置保存的引用，并保持长度不变。`insert` 正常完成后返回 `None`。

对于方法能够接收的整数位置，设调用前列表长度为 `n`：负位置先加上 `n`，结果小于零时按零处理，大于 `n` 时按 `n` 处理。因此，插入位置可以落在开头或末尾，不要求那里已经有元素。

下表每行都从 `values = [30, 10, 20, 40]` 独立开始：

| 调用 | 修改后的 `values` |
| --- | --- |
| `values.insert(0, 99)` | `[99, 30, 10, 20, 40]` |
| `values.insert(len(values), 99)` | `[30, 10, 20, 40, 99]` |
| `values.insert(-1, 99)` | `[30, 10, 20, 99, 40]` |
| `values.insert(99, 99)` | `[30, 10, 20, 40, 99]` |
| `values.insert(-99, 99)` | `[99, 30, 10, 20, 40]` |

`-1` 经调整后指向原来的末尾元素，因此是在它之前插入。`len(values)` 则给出尾后位置，在这里插入与 `append` 一样，都会把对象放到末尾。

这里的越界处理针对超出当前列表范围的位置。CPython 对 `insert` 和 `pop` 可接收的索引整数还有实现层面的大小限制；`values.insert(10 ** 100, 99)` 会在位置转换时引发 `OverflowError`，不属于按列表长度裁剪的情形。

### 取出位置与返回对象

`values.pop(index)` 移除指定位置的元素，并返回原来位于该处的对象。`values.pop()` 省略位置时，使用末尾位置，效果相当于 `values.pop(-1)`。

```python
values = [30, 10, 20, 40]
last = values.pop()
print(last)
print(values)

first = values.pop(0)
print(first)
print(values)
```

输出为：

```text
40
[30, 10, 20]
30
[10, 20]
```

第一次调用从末尾取出四十，将返回的整数对象绑定到 `last`，列表缩短为三个元素。第二次调用在这个当前列表中取出索引零处的三十，后面的十、二十依次前移，长度再减少一。

**`pop` 同时产生列表修改和返回结果。**返回的不是缩短后的列表，也不是被移除对象的副本：

```python
item = [99]
values = [item, 10]
taken = values.pop(0)
taken.append(88)

print(values)
print(item)
print(taken is item)
```

输出为：

```text
[10]
[99, 88]
True
```

`pop` 移除了外层列表中对 `item` 所指对象的那一处引用，`taken` 取得的仍是该内层列表。它既可以通过 `item` 取得，也可以通过 `taken` 取得；取出操作并没有使这个对象消失。随后追加八十八，修改的是该内层列表。

对于方法能够接收的整数索引，`pop` 的位置必须指向已有元素，沿用[整数索引的正负位置与边界](01-lists-length-and-indexing.md#整数索引与负数位置)：长度为 `n` 时，有效范围是 `-n <= index < n`。浮点位置会引发 `TypeError`；空列表没有有效位置，省略位置也会引发 `IndexError`。

```python
values = [30, 10, 20, 40]
print(values)
values.pop(4)
print("after pop")
```

第三行在运行时引发 `IndexError`。此前已经输出：

```text
[30, 10, 20, 40]
```

异常末行为：

```text
IndexError: pop index out of range
```

索引四没有对应元素，列表没有被修改，最后一行也不会执行。同样的位置可以用于在末尾插入，却不能用于取出一个不存在的元素；`pop` 不会把越界位置裁剪到列表两端。

## 按值移除与首次匹配

`values.remove(value)` 从前向后寻找首个与 `value` 相等的元素，移除这一项，正常完成后返回 `None`。对这里的普通数值，匹配按相等比较 `==` 的含义判断，不要求是同一个对象；找不到匹配项时，引发 `ValueError`。

```python
values = [30, 10, 20, 10]
result = values.remove(10)

print(values)
print(result)
```

输出为：

```text
[30, 20, 10]
None
```

从前向后，第一个等于十的元素原来位于索引一处。移除后，后面的二十与另一个十向前移动，长度减少一；末尾的十仍然保留。一次调用只移除首次匹配的一项，不会把所有相等元素一并移除。

`remove` 的参数表示要匹配的值，不表示索引。`by_position` 与 `by_value` 各自引用一个独立列表，对同一个整数参数零，两种调用会移除不同的元素：

```python
by_position = [30, 0, 20, 40]
by_value = [30, 0, 20, 40]

taken = by_position.pop(0)
result = by_value.remove(0)

print(taken)
print(by_position)
print(result)
print(by_value)
```

输出为：

```text
30
[0, 20, 40]
None
[30, 20, 40]
```

`pop(0)` 按位置取出第一个元素三十，并把该对象作为返回结果。`remove(0)` 则找到列表中的整数零，移除它并返回 `None`。

> [!IMPORTANT] 按位置取出与按值移除
> **`pop(index)` 按当前有效索引移除一个元素，并返回这个原对象；`remove(value)` 按从前向后的首次相等匹配移除一个元素，正常返回 `None`。**`pop()` 默认取出末尾元素。可接收的整数索引越界或列表为空时，前者引发 `IndexError`；后者要求找到匹配项，否则引发 `ValueError`。两者正常移除后，后续元素的位置前移，原列表长度减少一。

缺少匹配项时，`remove` 不会把调用当成已经完成的空操作：

```python
values = [30, 10, 20, 40]
print(values)
values.remove(99)
print("after remove")
```

第三行执行时找不到等于九十九的元素，引发 `ValueError`。此前已经输出：

```text
[30, 10, 20, 40]
```

异常末行为：

```text
ValueError: list.remove(x): x not in list
```

这个列表没有元素被移除，最后一行不会执行。空列表同样找不到任何匹配项，调用 `remove` 也会以 `ValueError` 失败。这里与前述位置越界都是具体调用的失败条件，不能由这些例子推断所有修改操作失败时都不会留下已完成的修改。

## 清空列表与操作结果

`values.clear()` 不接收参数，移除原列表中的全部元素，正常返回 `None`。对空列表调用也能正常完成。

```python
values = [30, 10, 20, 40]
alias = values
result = values.clear()

print(values)
print(alias)
print(values is alias)
print(result)
```

输出为：

```text
[]
[]
True
None
```

两个名称的绑定都没有改变，仍引用被清空的同一个列表。`values = []` 则会[重新绑定名称](../02-names-objects-and-assignment/01-names-and-assignment.md#重新绑定与多个名称)，让 `values` 引用另一个空列表；`alias` 仍引用原列表，原列表不会因此清空。

这些方法的常用调用与返回结果可按下表查阅，位置和匹配的条件仍按对应操作判断：

| 调用 | 选择或添加的依据 | 对原列表的修改 | 正常返回 |
| --- | --- | --- | --- |
| `values.append(value)` | 一个参数对象 | 在末尾增加一个元素 | `None` |
| `values.extend(source)` | 可迭代来源提供的元素 | 按来源提供的顺序在末尾扩展 | `None` |
| `values.insert(index, value)` | 插入位置与一个参数对象 | 在该位置插入一个元素 | `None` |
| `values.pop()` 或 `values.pop(index)` | 末尾或指定的有效位置 | 移除一个元素 | 被移除的原对象 |
| `values.remove(value)` | 首个相等匹配 | 移除一个元素 | `None` |
| `values.clear()` | 全部元素 | 清空列表 | `None` |

调用产生的[修改效果与返回值](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改效果与返回值)是两件事。`taken = values.pop()` 能保存被移除的对象；把返回 `None` 的其他方法写在赋值右侧时，左侧名称取得的就是 `None`，不会取得修改后的列表。

## 参考资料

- [Python 3.14 内置类型：可变序列操作](https://docs.python.org/3.14/library/stdtypes.html#mutable-sequence-types)
- [Python 3.14 教程：列表方法与返回约定](https://docs.python.org/3.14/tutorial/datastructures.html#more-on-lists)
- [CPython 3.14.10 源码：列表插入、取出与移除](https://github.com/python/cpython/blob/v3.14.10/Objects/listobject.c)
