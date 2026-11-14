---
title: 字符串的长度、索引与切片（String Length, Indexing, and Slicing）
date: 2026-11-12
order: 7
---

# 字符串的长度、索引与切片（String Length, Indexing, and Slicing）

字符串支持按位置读取和切片，结果仍是 `str`。这些操作以 Unicode 码点为单位；一个显示中的字符可能由多个码点组成。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。操作对象均为内置 `str`。

## 字符串长度究竟数什么

Unicode 用码点（code point）为文本成分编号，文字、标点和组合标记等可以有各自的码点。Python 的 `str` 是 Unicode 码点组成的不可变序列，`len(text)` 返回其中码点的个数。

```python
text = "A中🙂"

print(text)
print(len(text))
```

输出为：

```text
A中🙂
3
```

这里的字母 `A`、汉字 `中` 和本例中的符号 `🙂` 各由一个码点表示，因而长度为三。它们显示时占据的宽度可以不同；字符串长度不以终端或页面上的显示宽度计数。

长度也不按字面量在源码中写了多少个符号计算。普通字符串的[转义规则](../03-basic-values-and-expressions/05-string-literals-and-escape-sequences.md#转义实际内容与显示)与[原始字符串的规则](../03-basic-values-and-expressions/05-string-literals-and-escape-sequences.md#原始字符串与引号边界)先决定实际的字符串值，`len` 再对这个值计数：

```python
text = "A\nB"
raw = r"A\nB"

print(repr(text))
print(len(text))
print(repr(raw))
print(len(raw))
```

输出为：

```text
'A\nB'
3
'A\\nB'
4
```

`text` 包含字母 `A`、一个换行和字母 `B`，共三个码点。`raw` 则包含 `A`、反斜杠、字母 `n` 和 `B`，共四个码点。`repr` 返回用于显示的表示形式，外围引号与转义写法没有被添加进原来的字符串；它们不计入原字符串的长度。

> [!IMPORTANT] 字符串长度与位置的单位
> **内置 `str` 的长度与索引位置以 Unicode 码点为单位。**字面量先按自身规则得到字符串值，`len` 计算该值中的码点个数，不按源码拼写或显示宽度计数。一个显示中的字符可能包含多个码点，不能把可见字符数直接当作字符串长度。

## 索引与切片的结果

`text[index]` 按整数索引读取一个位置，正索引从零开始，负索引从末尾计数，沿用[序列的位置规则](01-lists-length-and-indexing.md#整数索引与负数位置)。**Python 没有独立的字符类型；读取一个合法位置，得到的是长度为一的 `str`。**

`text[start:stop:step]` 则按[切片规则](02-list-slicing.md#切片写法与选取结果)选取一组位置：包含起点，不包含终点，省略步长时使用一。字符串切片仍返回 `str`，其中可以有多个码点、一个码点，也可以没有码点。

```python
text = "Python"
first = text[0]
part = text[1:4]
empty = text[3:3]

print(first, type(first), len(first))
print(text[-1])
print(part, type(part))
print(repr(empty), type(empty), len(empty))
```

输出为：

```text
P <class 'str'> 1
n
yth <class 'str'>
'' <class 'str'> 0
```

`text[0]` 取得只含 `P` 的字符串，`text[-1]` 取得末尾的 `n`。`text[1:4]` 选择索引一、二、三处，得到 `"yth"`。`text[3:3]` 没有选中任何位置，因此得到长度为零的空字符串 `""`。

默认边界、负位置、步长方向与越界裁剪仍按已有的序列规则处理。下表各表达式的 `text` 均为 `"Python"`，结果列用字符串字面量表示：

| 表达式 | 结果 | 选取关系 |
| --- | --- | --- |
| `text[:2]` | `"Py"` | 从开头选到索引二之前 |
| `text[-2:]` | `"on"` | 从倒数第二个位置选到末尾 |
| `text[::2]` | `"Pto"` | 从索引零开始，索引每次增加二 |
| `text[::-1]` | `"nohtyP"` | 按反方向选取全部位置 |
| `text[99:]` | `""` | 起点超出末尾，没有选中位置 |

### 索引越界与切片边界

长度为 `n` 时，整数索引的有效范围仍是 `-n <= index < n`。索引必须对应一个已有位置，越界会引发 `IndexError`：

```python
text = "Python"
print(text)
value = text[6]
print("after indexing")
```

第三行在读取索引六处时失败，那里已经没有码点。此前已经输出：

```text
Python
```

异常末行为：

```text
IndexError: string index out of range
```

这次失败发生在运行时，原字符串仍是 `"Python"`。右侧读取没有取得结果，`value` 尚未绑定，最后一行不会执行。空字符串也没有有效位置，`""[0]` 同样会引发 `IndexError`。

切片的边界可以超出长度，按方向裁剪后再选取；因此 `text[:99]` 得到 `"Python"`，`text[99:]` 得到空字符串。整数索引与切片边界的不同职责，决定了它们的越界结果不同。

`text[0.0]` 这样的浮点索引会引发 `TypeError`，不会自动转换成整数。浮点切片边界也不成立；步长可以为正或负，但 `text[::0]` 会在运行时引发 `ValueError`，因为零不能决定下一次选取的位置。

> [!IMPORTANT] 字符串索引与切片的返回约定
> **合法整数索引返回长度为一的 `str`；切片返回按边界与步长选取的 `str`，未选中位置时返回空字符串。**索引必须对应已有位置，切片边界可以裁剪，但步长不能为零。读取不改变原字符串，也不保证每次都创建另一个字符串对象，`text[:]` 不能作为取得不同身份对象的保证。

## 显示字符与码点的对应

显示中的一个完整字符可以由多个码点共同表示。例如，带尖音符的字母 `é` 既可以用一个码点表示，也可以用字母 `e` 与组合重音标记的两个码点表示。后一种表示中的标记通常画在字母上方，显示为一个字母，字符串中仍然有两个位置。

对于后一种表示，只保留第一个码点会得到没有重音的 `e`；按码点逆序排列，又可能把重音标记移到字母之前。`len`、索引与切片依据实际码点序列工作，不会自动识别并保留显示中的完整字符组合。

> [!WARNING] 反向切片可能拆开字符组合
> **把 `text[::-1]` 当成按完整显示字符反转任意文本的方式，会在多码点字符组合处失效。**反向切片只逆转码点顺序，可能颠倒基础字母与组合标记的先后位置，改变原来的字符组合。

码点编号、Unicode 转义与组合表示的具体例子，见附章：[Unicode 转义与组合字符](deep-dives/01-unicode-escapes-and-combining-characters.md)。

## 字符串不可变与重新构造

`str` 属于[不可变对象](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#不可变对象与重新绑定)。索引可以读取某个位置，索引赋值却不能原地替换那里的内容；即使位置有效，操作也不成立：

```python
text = "Python"
print(text)
text[0] = "p"
print("after replacement")
```

第三行尝试替换内容时引发 `TypeError`。此前已经输出：

```text
Python
```

异常末行为：

```text
TypeError: 'str' object does not support item assignment
```

这不是索引越界，索引零确实存在，失败来自字符串不支持元素赋值。原字符串没有改变，最后一行不会执行；`text[:1] = "p"` 这样的切片赋值同样不受支持。

需要得到首字母不同的文本时，可以把首字母与剩余部分[拼接成字符串结果](../02-names-objects-and-assignment/02-object-types.md#类型约束操作的含义与成立条件)，再将名称绑定到它：

```python
text = "Python"
alias = text
text = "p" + text[1:]

print(text)
print(alias)
print(text is alias)
```

输出为：

```text
python
Python
False
```

第三行先从原字符串取得 `"ython"`，与 `"p"` 拼接得到 `"python"`，再重新绑定 `text`。`alias` 的绑定没有改变，仍引用内容为 `"Python"` 的原字符串。

这里结果文本与原文本不同，而原字符串不能原地改写，因此两者不是同一个对象。切片与拼接产生文本结果，赋值决定名称随后引用哪个结果；它们没有让其他引用原字符串的名称一同改变。

## 参考资料

- [Python 3.14 内置类型：字符串与单位置读取](https://docs.python.org/3.14/library/stdtypes.html#text-sequence-type-str)
- [Python 3.14 内置类型：通用序列操作与切片边界](https://docs.python.org/3.14/library/stdtypes.html#common-sequence-operations)
- [Python 3.14 语言参考：Unicode 转义](https://docs.python.org/3.14/reference/lexical_analysis.html#hexadecimal-unicode-characters)
- [Python 3.14 语言参考：不可变对象与对象复用](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 Unicode 指南：文本表示与字符串比较](https://docs.python.org/3.14/howto/unicode.html)
- [Unicode UAX #29：显示字符与文本分段](https://www.unicode.org/reports/tr29/tr29-49.html#Grapheme_Cluster_Boundaries)
