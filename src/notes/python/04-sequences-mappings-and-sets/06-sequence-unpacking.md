---
title: 序列解包（Sequence Unpacking）
date: 2026-11-11
order: 6
---

# 序列解包（Sequence Unpacking）

一个元组能把有顺序的一组值保存为整体，序列解包（sequence unpacking）则把来源提供的元素按位置分配给赋值目标。来源是列表或元组、目标是名称时，解包保留来源中的元素安排，各名称直接引用取得的元素对象。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。成功示例的解包来源均为内置列表或元组，目标为同一层的名称。

## 逐项绑定与数量匹配

尺寸元组 `size` 按高度在前、宽度在后的顺序保存两个整数，单位为像素。`height, width = size` 将第一个元素绑定到 `height`，第二个元素绑定到 `width`：

```python
size = (480, 640)
height, width = size

print(height)
print(width)
print(size)
```

输出为：

```text
480
640
(480, 640)
```

赋值左侧的逗号列出两个目标名称；右侧的 `size` 提供一个元组对象，解包后，各名称分别引用对应的整数。来源仍保存原来的两个元素。

解包来源需要能够逐个提供元素，也就是[可迭代对象](04-adding-and-removing-list-elements.md#追加一个对象与扩展一组元素)。列表同样能按顺序提供元素，因此 `height, width = [480, 640]` 也能得到相同的两个名称绑定，不需要先把列表转换成元组。

### 一个目标与整个来源

只有一个解包目标时，末尾的逗号仍然有作用。`height, = source` 要求来源恰好提供一个元素，并把它绑定到 `height`；`whole = source` 则是普通的简单名称赋值，将整个来源对象绑定到 `whole`：

```python
source = (480,)
whole = source
height, = source

print(whole)
print(height)
print(whole is source)
```

输出为：

```text
(480,)
480
True
```

`whole` 与 `source` 引用同一个单元素元组，`height` 则引用其中的整数。左侧的 `height,` 是解包目标的写法；右侧 `(480,)` 中的逗号属于[元组表达式](05-tuples-and-immutable-sequences.md#元组的写法与逗号)，两处逗号各有所在的语境。

### 数量不符与来源不成立

**没有带星目标时，来源的元素个数必须与目标个数相等。**元素过少或过多都会引发 `ValueError`。已有的两个名称绑定，不会让缺少的来源元素自动获得默认值：

```python
height = 1
width = 2
print(height, width)
height, width = (480,)
print("after unpacking")
```

第四行执行解包时，两个目标只能对应到一个来源元素，引发 `ValueError`。此前已经输出：

```text
1 2
```

异常末行为：

```text
ValueError: not enough values to unpack (expected 2, got 1)
```

这次失败发生在当前一层名称的数量匹配阶段。`height` 与 `width` 尚未重新绑定，仍分别引用整数一、二；旧绑定没有先被替换再恢复。此前的输出保留，最后一行不会执行。

来源过多也不能完成一一对应。`height, width = (480, 640, 3)` 会在运行时引发 `ValueError`，因为三个元素不能与两个普通目标匹配，不会悄悄丢掉第三项。在当前这种由列表或元组向一层普通名称解包的形式中，数量不匹配同样在目标绑定前被发现。

来源本身不具备逐个提供元素的能力时，则是 `TypeError`：

```python
height = 1
width = 2
print(height, width)
height, width = 480
print("after unpacking")
```

第四行运行时，整数四百八十不能作为解包来源。此前已经输出：

```text
1 2
```

异常末行为：

```text
TypeError: cannot unpack non-iterable int object
```

两个名称的绑定仍没有改变，最后一行也不会执行。解包要求来源能够提供元素，不会把整数四百八十拆成十进制数位，也不会自动把它扩展成两个值。

> [!IMPORTANT] 解包的对应关系与名称绑定
> **没有带星目标时，来源必须能提供与目标个数相等的元素；取得右侧结果后，从左到右将各目标名称绑定到对应的元素对象。**对于本篇的列表／元组来源与一层名称目标，数量不符引发 `ValueError`，且发生在这些目标重新绑定之前；非可迭代来源引发 `TypeError`。这些来源的元素安排保持不变，元素对象没有被复制。

## 元素引用与右侧求值顺序

### 名称取得的是元素对象

一层名称目标按来源当前这一层的元素进行对应。来源的第一个元素本身是列表时，第一个名称取得这个列表，不会继续把它的内部元素分给其他名称：

```python
inner = [30, 10]
source = (inner, 40)
items, limit = source
items.append(20)

print(items is inner)
print(source)
print(limit)
```

输出为：

```text
True
([30, 10, 20], 40)
40
```

`items`、`inner` 与 `source[0]` 都引用同一个列表。通过 `items` 追加二十后，元组的第一个元素仍然引用该列表，因此打印元组时也会显示修改后的内容。这与[元组中的可变元素](05-tuples-and-immutable-sequences.md#修改元素对象与替换引用)一致，解包没有为 `items` 创建内层副本。

**名称绑定到元素对象，不会与来源中的某个位置保持自动同步。**来源是列表时，后来替换该位置的引用，不会重新绑定已经解包的名称：

```python
size = [480, 640]
height, width = size
size[0] = 720

print(size)
print(height, width)
```

输出为：

```text
[720, 640]
480 640
```

解包时，`height` 取得原来的整数四百八十。第三行只把列表索引零处的引用换成整数七百二十，`height` 的绑定没有改变。前一份脚本通过 `items` 修改共享列表，这份脚本则替换外层列表的一处引用，改变的是不同层次。

### 交换名称绑定

普通赋值[先对右侧求值，再使用所得对象完成左侧赋值](../02-names-objects-and-assignment/01-names-and-assignment.md#右侧求值与绑定的先后)。右侧有多个元素表达式时，先从左到右取得它们的结果，再按左侧目标的顺序完成绑定：

```python
height = 480
width = 640
height, width = width, height

print(height, width)
```

输出为：

```text
640 480
```

第三行右侧的 `width, height` 使用两个名称的旧绑定，按顺序提供整数六百四十、四百八十；左侧随后分别将 `height` 绑定到前者、`width` 绑定到后者。两个名称交换了引用的对象，整数对象自身没有被修改。

把它写成两次普通赋值，会产生不同的结果：

```python
height = 480
width = 640
height = width
width = height

print(height, width)
```

输出为：

```text
640 640
```

第三行已经把 `height` 绑定到整数六百四十。第四行读取的是这个新绑定，因此 `width` 也取得六百四十；这里没有保留 `height` 原来的四百八十。两条语句分别求值与赋值，和一条解包赋值的执行关系不同。

## 星号接收剩余元素

在解包目标名称前写 `*`，可以让它接收未分配给其他目标的元素，这样的目标称为带星目标（starred target）。同一层最多有一个带星目标；其他普通目标仍各自需要一个元素。

`first, *middle, last = source` 将第一个元素交给 `first`，最后一个交给 `last`，中间剩余的元素按原顺序组成一个新列表，绑定到 `middle`：

```python
source = (30, 10, 20, 40)
first, *middle, last = source

print(first)
print(middle)
print(last)
print(type(middle))
```

输出为：

```text
30
[10, 20]
40
<class 'list'>
```

**带星名称取得的是列表，即使来源是元组。**星号在这里决定剩余元素的接收方式，不会把多个普通目标改为可以缺少元素的目标。

### 剩余零个与数量不足

只要来源足以满足所有普通目标，就可以正常解包。没有剩余元素时，带星名称取得空列表：

```python
source = (30, 40)
first, *middle, last = source

print(first, middle, last)
print(type(middle))
```

输出为：

```text
30 [] 40
<class 'list'>
```

两个元素分别满足 `first` 与 `last`，剩余数量为零。若来源只有一个元素，就无法满足这两个普通目标：

```python
source = (30,)
print(source)
first, *middle, last = source
print("after unpacking")
```

第三行执行解包时引发 `ValueError`。此前已经输出：

```text
(30,)
```

异常末行为：

```text
ValueError: not enough values to unpack (expected at least 2, got 1)
```

当前这层的数量条件不成立，`first`、`middle` 与 `last` 都还没有绑定，最后一行不会执行。一般地，带星解包要求来源的元素个数至少等于普通目标的个数，多出来的元素才由带星目标接收。

### 新列表与共享元素

带星目标也可以位于最后。`first, *rest = source` 让 `first` 取得首个元素，其余元素组成新列表；修改这个新列表自身的元素引用，不会替换来源的位置：

```python
source = [30, 10, 20, 40]
first, *rest = source
rest[0] = 99

print(source)
print(rest)
print(rest is source)
```

输出为：

```text
[30, 10, 20, 40]
[99, 20, 40]
False
```

`rest` 是另一个外层列表，`rest[0] = 99` 只替换它自己保存的第一项引用。来源的索引一处仍引用整数十，内容没有因这次替换而改变。

剩余元素仍是来源中的原对象。若其中有列表等可变对象，新列表与来源仍可能共享它；修改这个共享元素，会从两边取得相应变化。这里沿用[浅复制的外层独立、内层共享](../02-names-objects-and-assignment/05-shallow-list-copies.md#外层独立与内层共享)，带星目标没有为这些元素创建内层副本。

> [!IMPORTANT] 带星目标与剩余元素
> **同一层最多有一个带星目标；来源至少要有足够的元素满足其他普通目标，剩余元素按原顺序组成新列表，绑定到带星名称。**剩余数量可以为零，结果仍是列表。新列表自身的元素替换独立于来源，元素对象则仍是原对象的引用；共享可变元素的修改仍能从来源中取得。

### 星号目标的合法位置

带星名称必须处于解包目标的组合中。只写 `*rest = source` 会在源码检查阶段引发 `SyntaxError`；需要让一个带星名称接收全部元素时，可以写成 `*rest, = source`。末尾逗号表明左侧仍采用解包形式，来源为空时，`rest` 得到空列表。

同一层出现两个带星目标，也属于源码不成立：

```python
print("before unpacking")
first, *middle, *last = (30, 10, 20, 40)
print("after unpacking")
```

第二行在源码检查阶段引发 `SyntaxError`，异常末行为：

```text
SyntaxError: multiple starred expressions in assignment
```

这份脚本[不会开始执行](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)，两个 `print` 都不会产生输出，三个目标名称也没有被绑定。它与前述数量不匹配不同：数量错误发生在执行解包时，此前已经完成的语句仍然保留效果。

## 参考资料

- [Python 3.14 语言参考：赋值目标、解包与带星目标](https://docs.python.org/3.14/reference/simple_stmts.html#assignment-statements)
- [Python 3.14 语言参考：右侧表达式列表](https://docs.python.org/3.14/reference/expressions.html#expression-lists)
- [Python 3.14 语言参考：表达式求值顺序](https://docs.python.org/3.14/reference/expressions.html#evaluation-order)
