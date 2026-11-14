---
title: for 循环与范围（For Loops and Ranges）
date: 2026-11-12
order: 3
---

# for 循环与范围（For Loops and Ranges）

`for` 循环从可迭代来源逐项取得对象，每取得一项，就把循环目标绑定到它，再执行缩进的语句组。它适合处理一组已有数据，也可以配合 `range` 处理按固定步长排列的整数。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。循环目标只使用名称或同一层的名称解包。

## 逐项取得元素与目标绑定

`for width in widths:` 中，`widths` 提供元素，`width` 是接收当前元素的目标名称。这里的 `in` 属于 `for` 的语句结构，不是每轮先计算一次成员判断。冒号结束循环头，缩进的语句组构成循环体。

列表 `widths` 保存三幅图像的宽度，单位为像素。`total` 起初为零，每轮把当前宽度加到已有总值上：

```python
widths = [320, 640, 960]
total = 0

for width in widths:
    total = total + width
    print(width, total)

print(widths)
print(width)
```

输出为：

```text
320 320
640 960
960 1920
[320, 640, 960]
960
```

三轮依次将 `width` 绑定到整数三百二十、六百四十和九百六十。每次执行 `total = total + width` 时，都使用 `total` 的当前值，因而总值依次成为三百二十、九百六十和一千九百二十。

读取元素没有移除它们，列表内容保持原状。循环结束后，目标名称也不会自动删除，`width` 仍引用最后一次取得的整数。

循环目标遵循[名称绑定的关系](../02-names-objects-and-assignment/01-names-and-assignment.md#赋值建立名称与对象的绑定)。只给这个名称重新赋值，不会替换来源列表中的位置：

```python
widths = [320, 640]

for width in widths:
    width = 0

print(widths)
print(width)
```

输出为：

```text
[320, 640]
0
```

每轮先把 `width` 绑定到来源提供的整数，循环体再把它重新绑定到零。下一轮仍会从来源取得下一项，列表的两处元素引用没有被这项名称赋值替换。如果取得的元素本身是可变对象，修改它仍按[共享对象的规则](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改同一个列表)影响该对象，不等于修改循环名称的绑定。

来源为空时，没有元素可以交给目标，循环体一次也不执行，循环不会替目标建立新绑定：

```python
width = 99

for width in []:
    print(width)

print(width)
```

输出为：

```text
99
```

原来的 `width` 绑定保持不变。若运行前并无这个绑定，空来源也不会自动给它赋零或 `None`；随后读取它仍会引发[名称未绑定错误](../02-names-objects-and-assignment/01-names-and-assignment.md#读取尚未绑定的名称)。

> [!IMPORTANT] for 的来源、目标与执行
> **`for` 在进入循环时对来源表达式求值一次，再从该来源逐项取得对象；每轮先完成目标赋值，再执行循环体，没有下一项时结束。**对本篇的名称目标，赋值不自动复制元素，也不替换来源中的位置。空来源不执行循环体、不为目标建立新绑定；循环结束不会自动删除已有目标名称。

## 遍历字符串与字典条目

不同来源提供的元素不同。字符串逐个提供长度为一的字符串，遵循[按码点划分的位置规则](../04-sequences-mappings-and-sets/07-string-length-indexing-and-slicing.md#索引与切片的结果)；字典直接提供键，`items()` 则逐个提供包含键和值的二元素元组。

`widths` 中的键标识两幅图像，值为对应宽度，单位为像素：

```python
for letter in "RGB":
    print(letter)

widths = {"first": 320, "second": 640}

for name in widths:
    print(name)

for name, width in widths.items():
    print(name, width)
```

输出为：

```text
R
G
B
first
second
first 320
second 640
```

第一组循环从字符串中取得三个单字符字符串。第二组循环直接遍历字典，所以只取得两个键。第三组循环使用[条目视图](../04-sequences-mappings-and-sets/10-dictionary-mutation-and-items.md#键值与条目视图)，每次取得一个 `(键, 值)` 元组，按[解包规则](../04-sequences-mappings-and-sets/06-sequence-unpacking.md#逐项绑定与数量匹配)分别绑定 `name` 与 `width`；循环目标中的逗号列出两个接收名称。

这里的字典按插入顺序提供键与条目。集合也可以作为来源，但它[没有位置次序](../04-sequences-mappings-and-sets/11-sets-and-membership.md#成员判断与元素次序)，不能把某次遍历顺序当成稳定约定。顺序由来源的契约决定，`for` 不会替来源排序。

## range 与整数范围

`range` 表示按固定整数步长排列的不可变序列。`range(stop)` 默认从零开始、步长为一；`range(start, stop)` 指定起点，`range(start, stop, step)` 再指定步长。本篇使用整数实参，步长必须非零；传入浮点数会引发 `TypeError`，不会自动取整。

终点始终不包含在结果中。正步长向较大的整数推进，只提供小于终点的值；负步长向较小的整数推进，只提供大于终点的值。起点已经不满足对应条件时，范围为空。

```python
for index in range(3):
    print(index)

print(list(range(2, 8, 2)))
print(list(range(3, 0, -1)))
print(list(range(3, 0)))
```

输出为：

```text
0
1
2
[2, 4, 6]
[3, 2, 1]
[]
```

`range(3)` 提供零、一、二，共三个整数，没有提供终点三。`range(2, 8, 2)` 从二开始，每次增加二，在八之前停止；`range(3, 0, -1)` 每次减少一，在零之前停止。最后一个范围仍采用正步长一，起点三已经不小于终点零，因而为空。

**`range` 对象不是列表。**它表示起点、终点与步长确定的整数范围，不在创建时生成并保存一整份元素列表。上例中的 `list(...)` 使用[可迭代来源转换](../04-sequences-mappings-and-sets/05-tuples-and-immutable-sequences.md#列表与元组的转换)取得列表，便于显示这些整数；`for` 可以直接遍历 `range`，不需要先转成列表。

> [!IMPORTANT] range 的边界与步长
> **`range` 从起点按非零整数步长提供整数，不包含终点；省略起点采用零，省略步长采用一。**正步长要求当前值小于终点，负步长要求当前值大于终点，起点已不满足时得到空范围。它是可迭代的整数序列，不是预先生成的列表。

步长为零不能决定如何推进，创建范围时就会引发 `ValueError`：

```python
print("start")
for index in range(0, 3, 0):
    print(index)
print("after")
```

第二行在求值来源表达式时失败，尚未进入任何一轮。此前已经输出：

```text
start
```

异常末行为：

```text
ValueError: range() arg 3 must not be zero
```

`range` 调用没有取得结果，`index` 尚未绑定，循环体与最后一行都不会执行。这是运行时的实参错误，不是 `for` 语法不成立。

## 遍历期间的列表结构变化

`for` 不会自动为列表建立一份快照。内置列表的遍历继续向后推进位置，而移除元素会使后面的元素前移；两项变化叠加，可能跳过尚未处理的元素：

```python
widths = [320, 640, 960]

for width in widths:
    print(width)
    if width < 700:
        widths.remove(width)

print(widths)
```

输出为：

```text
320
960
[640, 960]
```

第一轮取得三百二十并移除它，六百四十随即移到索引零处。遍历继续向后的下一处位置已经是九百六十，因此六百四十没有进入循环体，最终仍在列表中。这里的 `if` 按[条件分支规则](01-conditional-branches.md#条件与缩进代码块)决定是否执行移除。

> [!WARNING] 删除元素可能使遍历跳过后项
> **把列表遍历理解为“开始时已固定好所有待处理元素”，会在遍历期间增删同一列表时失效。**删除造成的位置前移，可能让后项越过下一次读取的位置；追加也可能让新增元素进入后续遍历。修改元素对象与改变列表结构是不同的操作，不能将这条风险推广成“循环体内不能修改任何对象”。

只需得到筛选结果时，可以保留遍历来源，另用一个列表收集符合条件的元素；确实需要原地改变列表长度时，则要单独核对位置推进，不能沿用没有结构变化时的推断。

## 参考资料

- [Python 3.14 语言参考：for 的来源求值、目标赋值与结束](https://docs.python.org/3.14/reference/compound_stmts.html#the-for-statement)
- [Python 3.14 内置类型：range 的整数范围](https://docs.python.org/3.14/library/stdtypes.html#ranges)
- [Python 3.14 内置类型：可变序列的遍历与位置推进](https://docs.python.org/3.14/library/stdtypes.html#common-sequence-operations)
