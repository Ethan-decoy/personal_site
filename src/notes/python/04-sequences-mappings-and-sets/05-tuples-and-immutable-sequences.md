---
title: 元组与不可变序列（Tuples and Immutable Sequences）
date: 2026-11-11
order: 5
---

# 元组与不可变序列（Tuples and Immutable Sequences）

元组（tuple）与列表一样按顺序保存元素引用，但元组自身的元素个数和各位置保存的引用，在创建后不能原地改变。它属于不可变序列（immutable sequence）。

一幅图像以像素为单位的高度与宽度可以组成一个元组。例如，约定先保存高度、再保存宽度，`(480, 640)` 就表示高度为四百八十、宽度为六百四十的这组尺寸值。位置的含义来自这项约定，元组本身不会辨认哪个值表示高度。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。操作对象均为内置列表与元组。

## 元组的写法与逗号

在圆括号中写出两个元素表达式，并用逗号分隔，就能得到含有两个元素的元组。元素表达式从左到右求值，元组按相应顺序保存所得对象的引用：

```python
size = (480, 640)

print(size)
print(type(size))
```

输出为：

```text
(480, 640)
<class 'tuple'>
```

`size` 引用一个元组对象，其中两个元素分别引用整数四百八十与六百四十。打印结果用圆括号与逗号表示这组元素；`type(size)` 则确认对象的类型是 `tuple`。

只有一个元素时，需要保留元素后的逗号。`(480)` 只是对整数表达式加上[分组括号](../03-basic-values-and-expressions/02-arithmetic-and-expression-evaluation.md#括号优先级与结合方向)，求值结果仍是整数；`(480,)` 才是单元素元组。没有元素的空元组写作 `()`：

```python
grouped = (480)
single = (480,)
empty = ()

print(grouped, type(grouped))
print(single, type(single))
print(empty, type(empty))
```

输出为：

```text
480 <class 'int'>
(480,) <class 'tuple'>
() <class 'tuple'>
```

单元素元组中的逗号没有引入第二个元素。它区分了“一个元素组成的元组”与“仅用括号括起来的表达式”。两个及以上元素也可以在末尾再写一个逗号，`(480, 640,)` 仍然只有两个元素。

在简单名称赋值的右侧，`size = 480, 640` 同样得到二元素元组，外层括号可以省略。但逗号的作用与所在语境有关：调用括号中的逗号通常分隔实参。向 `print` 传入两个整数，与向它传入一个元组，写法和结果不同：

```python
print(480, 640)
print((480, 640))
```

输出为：

```text
480 640
(480, 640)
```

第一行有两个实参，`print` 分别显示它们，并在中间放置默认的空格。第二行内层括号中的 `(480, 640)` 是一个元组表达式；整个元组作为唯一实参，交给外层的 `print(...)` 调用。

> [!IMPORTANT] 单元素元组与分组括号
> **`(value,)` 是单元素元组，`(value)` 仍是原表达式的值；空元组写作 `()`。**元组表达式中的逗号区分元素，圆括号标明表达式的范围。调用自己的实参分隔逗号不自动构成元组，`print(a, b)` 与 `print((a, b))` 接收的实参不同。

## 按位置读取与切片

`len(size)` 返回元组的元素个数；`size[index]` 按整数索引取得对应的元素对象，正索引从零开始，负索引从末尾计数。这些[位置规则](01-lists-length-and-indexing.md#整数索引与负数位置)与列表相同。

元组也支持 `size[start:stop:step]` 形式的切片读取。选取规则沿用[切片的边界与步长](02-list-slicing.md#步长方向与默认终点)：不包含终点位置，省略步长时使用一，负步长按反方向选取。**元组切片的结果仍是元组，即使其中只有一个元素或没有元素。**

```python
size = (480, 640)

print(len(size))
print(size[0])
print(size[-1])
print(size[:1])
print(size[1:1])
print(size[::-1])
```

输出为：

```text
2
480
640
(480,)
()
(640, 480)
```

`size[0]` 取得整数四百八十，`size[:1]` 则取得只含这个整数的元组；两者保存或返回对象的层次不同。`size[1:1]` 没有选中任何位置，因此得到空元组。`size[::-1]` 按反方向排列所选元素，结果中的第一个值已经是宽度，原来的 `size` 仍保持高度在前。

整数索引必须指向已有位置。长度为 `n` 时，有效范围为 `-n <= index < n`，越界或从空元组中取元素会引发 `IndexError`；`size[0.0]` 这样的浮点索引会引发 `TypeError`。切片则允许边界超出长度并按方向裁剪，但步长为零会引发 `ValueError`，不能作为选取方式。

元组切片与[列表切片创建新列表](02-list-slicing.md#新列表与共享元素)的返回约定不同。**不能用元组切片保证取得另一个外层对象。**切片保证按规则取得相应的元组结果，所选元素对象也不会被逐个复制。完整切片的对象复用实例，见附章[元组操作与对象复用](deep-dives/03-tuple-operations-and-object-reuse.md#完整切片与实现行为)。

## 不可变性约束哪一层

### 替换元素与重新绑定名称

列表允许通过索引赋值替换元素引用，元组不支持这项操作。即使索引确实存在，赋值也会失败：

```python
size = (480, 640)
print(size)
size[0] = 720
print("after replacement")
```

第三行在执行元素替换时引发 `TypeError`。此前已经输出：

```text
(480, 640)
```

异常末行为：

```text
TypeError: 'tuple' object does not support item assignment
```

元组仍保存原来的两个元素引用，最后一行不会执行。`size[:1] = (720,)` 这样的切片赋值也不受支持；元组同样没有列表用于原地增删元素的 `append`、`pop` 或 `clear` 方法。

元组不可变，不会使引用它的名称也无法重新赋值。[不可变对象与名称绑定](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#不可变对象与重新绑定)是两个层次：

```python
size = (480, 640)
alias = size
size = (720, 1280)

print(size)
print(alias)
print(size is alias)
```

输出为：

```text
(720, 1280)
(480, 640)
False
```

第三行先取得另一组尺寸组成的元组，再重新绑定 `size`。原元组没有被改成新的内容，`alias` 仍引用它；两个元组的内容不同，也不是同一个对象。

### 修改元素对象与替换引用

元组中的元素可以属于不同类型，也可以是可变对象。`group = (inner, 40)` 的第一个元素引用 `inner` 所指的列表，第二个元素引用整数四十。`group[0]` 读取后取得的仍是这个列表，因此可以调用它的 `append` 方法；`group[0] = ...` 则要求替换元组本身保存的引用，仍然不受支持：

```python
inner = [30, 10]
group = (inner, 40)
group[0].append(20)
print(group)
print(group[0] is inner)
group[0] = [99]
print("after replacement")
```

第三行成功修改内层列表，随后已经输出：

```text
([30, 10, 20], 40)
True
```

第六行执行元素替换时引发 `TypeError`，异常末行为：

```text
TypeError: 'tuple' object does not support item assignment
```

`group` 的第一个元素始终引用同一个内层列表。成功的 `append` 让这个列表多了一个元素，却没有更换元组中的引用；第六行试图把该引用换成另一个列表，因而失败。已经完成的追加不会因此撤销，`inner` 仍为 `[30, 10, 20]`，最后一行不会执行。

> [!IMPORTANT] 元组固定的是自身的元素引用
> **元组创建后，不能原地增加、移除或替换它保存的元素引用；元素对象是否可变，仍由各自的类型决定。**读取元组中的列表后，可以修改该列表，元组仍引用原来的对象。名称也可以重新绑定到另一元组，原元组不会随之改变。

因此，元组打印出来的内容并不一定永远相同。显示其中的列表时，会显示列表当前的内容；内层内容发生变化，不等于外层元组更换了元素。

## 列表与元组的转换

`tuple(source)` 与 `list(source)` 都接收能够逐个提供元素的[可迭代来源](04-adding-and-removing-list-elements.md#追加一个对象与扩展一组元素)，按来源提供的顺序保留元素引用。来源是列表时，`tuple(source)` 得到对应的元组；来源是元组时，`list(source)` 创建对应的新列表。转换不会把来源对象自身的类型改掉。

```python
values = [480, 640]
size = tuple(values)
editable = list(size)

values[0] = 720
editable[1] = 1280

print(values)
print(size)
print(editable)
print(editable is values)
```

输出为：

```text
[720, 640]
(480, 640)
[480, 1280]
False
```

转换完成时，三个容器各自保存对整数四百八十、六百四十的引用。`values[0] = 720` 只替换原列表的第一个元素引用；`editable[1] = 1280` 只替换新列表的第二个元素引用。元组自己的两处引用都没有改变，仍保存原来的尺寸值。

转换保留的是元素引用，不会继续复制元素对象。如果来源中有列表等可变元素，转换后的元组或列表仍可能与来源共享这些对象，与[浅复制的内层共享](../02-names-objects-and-assignment/05-shallow-list-copies.md#外层独立与内层共享)一致。把外层列表转成元组，不会同时固定内层列表的内容。

**`list(source)` 创建新的外层列表；`tuple(source)` 不保证创建新对象，来源已经是内置元组时，直接返回该元组。**因此，不能用 `tuple(size)` 保证取得独立的外层对象。这与转换不会继续复制元素对象，是两个需要分别判断的层次。

省略来源时，`tuple()` 得到空元组，`list()` 创建空列表。整数不是可迭代来源，因此 `tuple(480)` 与 `list(480)` 都会在调用时引发 `TypeError`；若需要只包含整数四百八十的元组或列表，对应的写法是 `(480,)` 与 `[480]`。

> [!PRACTICE] 根据修改需求选择列表或元组
> 数据需要追加、移除或替换元素时，列表提供相应的修改接口。需要把一组位置含义已约定的值作为整体保存，并限制对这组元素引用的直接修改时，可以使用元组。元组仍依赖使用者理解各位置的含义，也不会保护元素内部的可变状态；仅把列表转成元组，不能代替对共享可变对象的处理。

## 参考资料

- [Python 3.14 语言参考：圆括号表达式](https://docs.python.org/3.14/reference/expressions.html#parenthesized-forms)
- [Python 3.14 语言参考：对象、可变性与容器引用](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 内置类型：元组的构造与序列操作](https://docs.python.org/3.14/library/stdtypes.html#tuples)
- [Python 3.14 内置类型：列表构造与元素引用](https://docs.python.org/3.14/library/stdtypes.html#lists)
