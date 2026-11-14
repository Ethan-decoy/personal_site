---
title: 列表、长度与索引（Lists, Length, and Indexing）
date: 2026-11-10
order: 1
---

# 列表、长度与索引（Lists, Length, and Indexing）

列表 `[30, 10, 20]` 保存三个元素，它们在列表中的位置与各自数值的大小是两回事。按位置可以取得某个元素对象，也可以让这个位置改为引用另一个对象；这些操作都要依据列表当前的长度判断位置是否存在。

本篇使用内置列表，单项访问以 `int` 索引说明。各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。

## 列表的顺序与长度

列表是一种序列（sequence），元素具有确定的位置顺序。列表字面量在方括号中按顺序写出元素表达式，用逗号分隔；求值后，列表按相应顺序保存所得对象的引用。列表还允许[原地修改](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改同一个列表)，属于可变对象。

内置函数 `len(values)` 返回列表当前的元素个数，结果为非负整数，不修改列表：

```python
values = [30, 10, 20]

print(values)
print(len(values))
print(type(len(values)))
```

输出为：

```text
[30, 10, 20]
3
<class 'int'>
```

元素按三十、十、二十的顺序保存，没有因为数值大小而自动排序。“有序”在这里指元素的位置顺序；值相同的元素也可以占据不同位置，仍分别计入长度。空列表没有元素，`len([])` 返回零。

列表元素可以引用另一个列表。此时长度只计算当前外层的元素个数，不递归展开内层：

```python
inner = [30, 10, 20]
values = [inner, 40]

print(len(values))
print(len(inner))
```

输出为：

```text
2
3
```

外层列表有两个元素：一个引用 `inner` 所指的列表，另一个引用整数四十。内层列表有三个元素，但在外层只占一个位置。这沿用了[外层列表与内层对象分别保存引用的关系](../02-names-objects-and-assignment/05-shallow-list-copies.md#外层独立与内层共享)。

## 整数索引与负数位置

索引（index）表示元素的位置。`values[index]` 先取得列表与索引，再取得对应位置的元素对象。这里的方括号跟在已有表达式后，表示单项访问；独立写出的 `[30, 10, 20]` 则用于创建列表。

非负索引从零开始，`values[0]` 取得第一个元素。负索引从末尾计算，`values[-1]` 取得最后一个元素：

```python
values = [30, 10, 20]

print(values[0])
print(values[-1])
```

输出为：

```text
30
20
```

对于这份列表，各个位置的对应关系为：

| 元素 | `30` | `10` | `20` |
| --- | --- | --- | --- |
| 非负索引 | `0` | `1` | `2` |
| 负索引 | `-3` | `-2` | `-1` |

若当前长度为 `n`，负索引 `index` 按 `n + index` 换算。例如，长度为三时，`-1` 对应二，`-3` 对应零。`-0` 的整数值仍为零，因此 `values[-0]` 与 `values[0]` 访问同一位置；末尾位置的负索引从 `-1` 开始。

> [!IMPORTANT] 列表长度与索引范围
> **列表长度 `n` 是当前外层元素个数；对于这里使用的整数索引，合法范围为 `-n <= index < n`。**非负索引从零开始，负索引按 `n + index` 换算。空列表长度为零，没有任何可访问的元素位置。

负索引在每次访问时按列表当前的长度解释。已经计算并保存的整数索引，则不会随着列表追加元素而自动改变：

```python
values = [30, 10, 20]
last_index = len(values) - 1
values.append(40)

print(values[last_index])
print(values[-1])
print(len(values))
```

输出为：

```text
20
40
4
```

第二行取得当时的长度三，计算后将 `last_index` 绑定到整数二。[`append` 追加元素](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改同一个列表)后，列表长度变为四，但 `last_index` 仍为二，因此先取得原位置上的二十。随后读取 `values[-1]`，按当前长度四换算，取得索引三处新追加的四十。

索引描述访问时的位置，并不是会跟随某个元素移动的标记。

## 读取元素与替换元素

索引读取取得该位置引用的对象，不复制元素。元素本身可变时，通过读取结果也可以修改这个对象：

```python
inner = [30]
values = [inner, 10, 20]
selected = values[0]

print(selected is inner)
selected.append(40)
print(values)
```

输出为：

```text
True
[[30, 40], 10, 20]
```

`values` 的第一个元素引用 `inner` 所指的列表。第三行取得的就是这个内层对象，`selected` 随后绑定到它，因而身份比较得到 `True`。`selected.append(40)` 修改内层列表，外层保存的引用仍指向同一个内层对象，所以再次输出外层时能看到这项修改。

索引赋值 `values[index] = value` 则把一个已有位置改为引用右侧所得对象。它修改列表，不重新绑定列表名称，也不要求改变原元素对象：

```python
values = [30, 10, 20]
alias = values
selected = values[0]
values[0] = 99

print(values)
print(alias)
print(selected)
print(len(values))
```

输出为：

```text
[99, 10, 20]
[99, 10, 20]
30
3
```

第二行使 `alias` 与 `values` 引用同一个列表。第三行读取第一个元素，使 `selected` 绑定整数三十。第四行只替换列表索引零处保存的引用，让它改为引用整数九十九，因此经 `values` 与 `alias` 都能取得修改后的列表。

`selected` 的绑定没有改变，仍引用整数三十。原整数也没有被原地改成九十九；改变的是列表中的一个元素引用。列表仍有三个元素，长度保持为三。

> [!IMPORTANT] 索引读取与元素替换
> **索引读取取得已有的元素对象，不复制它；合法的单项索引赋值替换列表相应位置的引用，保持列表身份与长度。**其他仍引用同一列表的名称可以取得替换后的内容；先前取得原元素的名称保持原有绑定，原元素对象不会被这次替换原地改写。

## 索引边界与失败位置

整数索引超出列表当前范围时，单项读取或替换都会引发索引错误 `IndexError`。长度为三的列表，非负索引最大为二，索引三已经越界：

```python
values = [30, 10, 20]
index = len(values)

print(index)
print(type(index))
print(len(values))
print(values[index])
print("end")
```

程序先输出：

```text
3
<class 'int'>
3
```

这些结果表明，索引是整数三，访问前的列表长度也是三。索引类型适合这里的单项访问，数值却不在 `-3 <= index < 3` 的范围内。第七行读取元素时引发 `IndexError`，错误诊断的最后一行为：

```text
IndexError: list index out of range
```

元素读取没有取得结果，该行外层的 `print` 尚未执行。异常未被处理，脚本终止，`end` 不会输出；已经写出的索引、类型与长度仍然保留。列表没有被这次读取修改。

对于同一个长度为三的列表，`values[-4]` 也越界。负索引不会让任意整数都变成合法位置；空列表中读取索引零或负一，同样会引发 `IndexError`。

索引赋值也要求目标位置已经存在。下面这份独立脚本试图写入索引三：

```python
values = [30, 10, 20]
print("start")
values[len(values)] = 40
print("end")
```

程序先输出：

```text
start
```

第三行写入的目标位置不存在，因而引发 `IndexError`。错误诊断的最后一行为：

```text
IndexError: list assignment index out of range
```

这次赋值没有追加元素，也没有替换任何已有元素；列表仍为 `[30, 10, 20]`。异常未被处理，`end` 不会输出。前面已经使用的 `append(40)` 承担末尾追加，索引赋值承担已有位置的替换，两者的成立条件不同。

索引的类型也会影响访问能否成立。浮点数 `0.0` 虽然与整数零比较相等，却不能直接用于这里的列表单项索引：

```python
values = [30, 10, 20]
print("start")
print(values[0.0])
print("end")
```

程序先输出：

```text
start
```

第三行因索引类型不受支持而引发 `TypeError`，错误诊断的最后一行为：

```text
TypeError: list indices must be integers or slices, not float
```

这里尝试的是单项访问，索引类型检查就已失败。诊断中的 `slices` 指另一种区间访问形式；本例没有使用它。元素读取没有成功，外层 `print` 未执行，列表保持原状，脚本终止后也不会输出 `end`。

数字字符串 `"0"` 同样不会在索引时自动解析为整数。索引访问与[显式数值转换](../03-basic-values-and-expressions/07-numeric-conversion-and-text-parsing.md#转换调用与结果绑定)是不同操作，数值看起来相同也不意味着满足相同的输入条件。

> [!TIP] 核对索引失败时的列表状态
> 在失败操作之前，输出索引值、`type(index)` 与 `len(values)`，核对本次访问实际使用的类型、数值和当前长度。对本篇的整数索引，用 `-len(values) <= index < len(values)` 检查位置；长度为零时没有合法元素位置。索引类型不受支持时，先核对产生索引的表达式及其结果类型；整数位置越界时，核对索引的计算依据是否仍符合当前列表状态，不能只看列表先前的长度。

这些失败都发生在运行时的索引操作中，源码本身合法。[先前已经完成的输出不会因后续异常而撤销](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)。

## 参考资料

- [Python 3.14 内置函数：len](https://docs.python.org/3.14/library/functions.html#len)
- [Python 3.14 内置类型：通用序列操作与索引范围](https://docs.python.org/3.14/library/stdtypes.html#common-sequence-operations)
- [Python 3.14 内置类型：可变序列的元素替换](https://docs.python.org/3.14/library/stdtypes.html#mutable-sequence-types)
- [Python 3.14 语言参考：下标访问](https://docs.python.org/3.14/reference/expressions.html#subscriptions)
