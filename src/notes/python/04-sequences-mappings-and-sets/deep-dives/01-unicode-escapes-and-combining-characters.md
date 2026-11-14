---
title: Unicode 转义与组合字符（Unicode Escapes and Combining Characters）
date: 2026-11-12
order: 3
---

# Unicode 转义与组合字符（Unicode Escapes and Combining Characters）

Unicode 转义用码点编号写出字符串内容。一个带尖音符的字母既可以使用单一码点，也可以使用基础字母与组合标记的码点序列表示；两种形式在[按码点计数和定位](../07-string-length-indexing-and-slicing.md#字符串长度究竟数什么)时会产生不同结果。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；操作对象均为内置 `str`。普通字符串中的[转义规则](../../03-basic-values-and-expressions/05-string-literals-and-escape-sequences.md#转义实际内容与显示)与字符串的[索引和切片](../07-string-length-indexing-and-slicing.md#索引与切片的结果)仍按相应契约成立。

## 用 Unicode 编号写出字符

字母 `e` 的 Unicode 码点编号是 `U+0065`。码点编号常记为 `U+` 后接十六进制数字；`U+` 是编号的记法，不属于字母的文本内容。编号中的数字可以使用 `0` 到 `9`、`a` 到 `f`，字母大小写均可。

在普通字符串字面量中，`\u` 后接恰好四位十六进制数字，可以表示该编号对应的字符。因此，`"\u0065"` 与 `"e"` 表示相同的字符串：

```python
letter = "\u0065"

print(letter)
print(letter == "e")
print(len(letter))
```

输出为：

```text
e
True
1
```

这段转义在源码中由反斜杠、字母 `u` 和四位数字组成，字面量求值后得到的却只是字母 `e`，长度为一。它与已经介绍过的 `\n` 类似：`\n` 用一种约定的拼写表示换行，`\u0065` 用编号表示字母 `e`；转义写法不会原样成为字符串内容。

> [!IMPORTANT] Unicode 转义与字符串内容
> **在普通字符串字面量中，`\u` 后接恰好四位十六进制数字，按编号表示一个码点。**这一整段转义写法在所得字符串中贡献一个码点，源码中的反斜杠、字母和数字不会分别成为字符串内容；具体编号与字符的对应关系按 Unicode 字符表查阅。

## 字母和组合标记

`é` 是字母 `e` 带上尖音符后的写法，上方的短斜线就是这个标记。Unicode 既给整个带尖音符的字母 `é` 分配了一个码点，也给可以附加到前面字母上的组合尖音符分配了一个独立码点。

| 文本成分 | 码点编号 | 普通字符串写法 |
| --- | --- | --- |
| 小写字母 `e` | `U+0065` | `"e"` 或 `"\u0065"` |
| 带尖音符的小写字母 `é` | `U+00E9` | `"é"` 或 `"\u00e9"` |
| 组合尖音符 | `U+0301` | `"\u0301"` |

组合尖音符在字符串中写在基础字母后面，显示系统通常会把它画在前面字母的上方。因此，可以先写一个 `e`，再接上这个标记，得到显示为带重音字母的文本：

```python
base = "e"
accent = "\u0301"
combined = base + accent

print(combined)
print(combined == "e\u0301")
print(len(base), len(accent), len(combined))
```

输出为：

```text
é
True
1 1 2
```

`base` 包含字母 `e`，`accent` 包含一个组合尖音符；两者各有一个码点。拼接后的 `combined` 依次保存这两个码点，显示在一起不会把它们合并成一个码点。

**`"e\u0301"` 就是在同一个普通字符串字面量中，依次写出字母 `e` 和转义序列 `\u0301`。**它与 `"e" + "\u0301"` 得到的文本相同：前半部分贡献一个字母，后半部分贡献一个组合标记，所以长度为二。

## 比较与切片依据码点序列

直接写出 `"é"` 使用的是带尖音符字母自身的一个码点；写出 `"e\u0301"` 则使用基础字母与组合标记的两个码点：

```python
composed = "é"
combined = "e\u0301"

print(len(composed), len(combined))
print(composed == combined)
```

输出为：

```text
1 2
False
```

两段文本可以显示为同样的带重音字母，但 `composed` 包含一个码点，`combined` 包含两个码点。普通字符串相等比较依据实际的码点序列，不会只因它们显示相同，就自动把不同表示转换成同一种形式。

因此，`combined` 的索引零处只是字母 `e`，索引一处才是组合标记：

```python
combined = "e\u0301"
base = combined[0]
mark = combined[1]

print(base)
print(len(mark))
print(mark == "\u0301")
print(combined[:1])
```

输出为：

```text
e
1
True
e
```

`mark` 仍是长度为一的字符串，包含组合尖音符。`combined[:1]` 只选中第一个码点，得到普通字母 `e`，没有保留后面的重音标记。按一个位置截取，并不等于保留原来显示中的一个完整字符组合。

反向切片也遵循码点顺序：

```python
combined = "e\u0301"
reversed_text = combined[::-1]

print(reversed_text[0] == "\u0301")
print(reversed_text[1] == "e")
```

输出为：

```text
True
True
```

反转后，组合尖音符位于第一个位置，字母 `e` 位于第二个位置；原来“字母在前、重音标记在后”的组合关系已经改变。这个结果由码点选取顺序决定，不依赖终端最后把标记画在什么位置。

## 参考资料

- [Python 3.14 语言参考：Unicode 转义](https://docs.python.org/3.14/reference/lexical_analysis.html#hexadecimal-unicode-characters)
- [Python 3.14 Unicode 指南：码点、文本表示与字符串比较](https://docs.python.org/3.14/howto/unicode.html)
- [Unicode UAX #29：显示字符与文本分段](https://www.unicode.org/reports/tr29/tr29-49.html#Grapheme_Cluster_Boundaries)
