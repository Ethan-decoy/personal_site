---
title: 字符串字面量与转义（String Literals and Escape Sequences）
date: 2026-11-09
order: 5
---

# 字符串字面量与转义（String Literals and Escape Sequences）

字符串可以包含引号、换行和反斜杠。它们在源码中的写法与输出时的样子未必相同：普通字符串中的 `\n` 表示一个换行，`\\` 表示一个反斜杠。同一段文本也可以有不同的字面量写法。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。

## 引号与字符串内容

Python 用 [`str` 对象保存文本](../02-names-objects-and-assignment/02-object-types.md#值类型与显示结果)。字符串字面量（string literal）是在源码中直接写出字符串值的形式，外围引号用于界定它的范围，不属于所得字符串的内容。

单引号与双引号都可以界定普通字符串：`'Hello, Python!'` 与 `"Hello, Python!"` 表示相同的文本。开头用了哪一种引号，就用相同的引号结束；另一种引号可以直接写在内容中。因此，双引号里的 `"It's Python"` 可以直接包含单引号。

采用单引号界定同一段文本时，内容中的单引号可以写成 `\'`。这里的反斜杠使后面的单引号表示内容中的字符，而不结束字面量：

```python
message = "It's Python"
same_message = 'It\'s Python'

print(message)
print(message == same_message)
```

输出为：

```text
It's Python
True
```

两种写法得到的文本相等，`==` 的结果为 `True`。字符串值不记录当初选用了哪一种外围引号；文本中本来就有的那个单引号，则是值的一部分。

## 转义、实际内容与显示

普通字符串字面量中的反斜杠可以开始转义序列（escape sequence）：若干源码字符共同表示一个字符或特殊含义。这里常用的几种写法为：

| 字面量中的写法 | 所表示的内容 |
| --- | --- |
| `\n` | 换行字符 |
| `\t` | 水平制表符 |
| `\\` | 一个反斜杠 |
| `\'` | 一个单引号 |
| `\"` | 一个双引号 |

`\n` 在源码中由反斜杠和字母 `n` 组成，所得字符串中却是一个换行字符。制表符 `\t` 也不是固定数量的空格，显示时占据的宽度取决于输出环境及它所在的位置。

`print` 可以直接写出字符串内容；内置函数 `repr(value)` 则返回包含对象表示形式的字符串。对于这里的 `str` 对象，这种表示带有外围引号，并用转义写法表示换行、制表符和反斜杠等字符。**`repr` 返回一个 `str`，本身不执行输出，也不修改传入的字符串。**

```python
message = "A\nB"
result = repr(message)

print(message)
print(result)
print(type(result))
```

输出为：

```text
A
B
'A\nB'
<class 'str'>
```

`message` 的内容是字母 `A`、一个换行和字母 `B`。第一次 `print` 写出这段内容，所以两个字母出现在不同行；写完 `B` 后，`print` 默认还会添加一个结尾换行，使下一次输出从新的一行开始。

`result` 则是另一段字符串内容：其中包含表示用的两侧单引号，以及反斜杠和字母 `n`，没有 `message` 中间的那个实际换行。因此，`print(result)` 把 `'A\nB'` 写在一行中。表示形式中的引号和反斜杠属于 `result`，没有被添加到原字符串 `message` 中。

> [!IMPORTANT] 字面量、字符串值与表示形式
> **普通字符串字面量按转义规则确定内容；对于 `str` 对象，`print` 写出内容，`repr` 返回用于表示它的字符串。**表示形式中的引号与转义描述原字符串，原字符串本身不会改变；`repr` 的返回值也仍需通过输出调用或交互回显才会显示。

若源码需要表达一个反斜杠和字母 `n`，可以把反斜杠本身写成 `\\`：

```python
message = "A\\nB"

print(message)
print(repr(message))
```

输出为：

```text
A\nB
'A\\nB'
```

源码中的 `\\` 先表示一个反斜杠，后面的 `n` 是普通字母，因而整个字符串没有内部换行。**`print` 不会把字符串内容中的反斜杠和字母重新解释成转义序列。**第二行的表示形式用 `\\` 描述这个实际反斜杠，所以显示的反斜杠数量又与直接输出不同。

`repr` 描述当前字符串的值，不恢复它原来采用单引号、双引号还是其他字面量写法。[默认交互回显](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#交互回显与程序输出)也采用这种对象表示，因此回显中的引号可能与输入时不同。需要辨认文本中的换行、制表符或反斜杠时，可以用 `print(repr(message))` 查看这种表示，而不只根据终端上的空白判断内容。

其他转义序列的拼写与限制可以按[官方转义表](https://docs.python.org/3.14/reference/lexical_analysis.html#escape-sequences)查阅，不能把任意反斜杠组合都当作合法转义。

## 多行字符串与源码换行

[三引号](../01-source-code-and-execution/03-tokens-indentation-and-comments.md#注释与字符串中的井号)用连续三个单引号或双引号界定字符串，允许内容跨越多个源码行。没有原始字符串前缀时，三引号中的转义仍按普通字符串规则处理；三引号增加的是容纳实际换行的写法。

```python
message = """A
B"""

print(repr(message))
print(message == "A\nB")
```

输出为：

```text
'A\nB'
True
```

三引号内部的源码换行成为字符串中的换行，因此与用 `\n` 写出的文本相等。两种写法的值相同，`repr` 也不会保留它们在源码中是否跨行的区别。

三引号内的开头换行、结尾换行与行首空格也会进入字符串：

```python
message = """
    A
    B
"""

print(repr(message))
```

输出为：

```text
'\n    A\n    B\n'
```

开头三个引号后紧接着一个换行，因此表示形式以 `\n` 开始。`A` 与 `B` 前各有四个空格，`B` 后还有一个换行；这些都在引号内部，是文本内容。**三引号不会自动去掉内容的首尾换行，也不会自动移除各行的共同缩进。**

这与[括号内的源码续行](../01-source-code-and-execution/03-tokens-indentation-and-comments.md#一次调用可以写在多个物理行上)不同：调用括号内、字符串外的换行可以只承担源码排版；本例三引号内部的换行和空格属于字符串。判断文本包含什么，需要核对引号边界，而不能只数源码写了几行。

## 原始字符串与引号边界

原始字符串字面量（raw string literal）在起始引号前紧接前缀 `r`，例如 `r"A\nB"`。其中的 `\n` 保留为反斜杠和字母 `n`，不会转成换行；所得对象仍然是 `str`。

Windows 风格的路径文字经常包含反斜杠。这里仅把路径当作文本，不访问文件，也不要求相应位置存在：

```python
path = r"C:\notes\test.png"
same_path = "C:\\notes\\test.png"

print(path == same_path)
print(type(path))
print(repr(path))
```

输出为：

```text
True
<class 'str'>
'C:\\notes\\test.png'
```

第一种写法保留两个原本写出的反斜杠；第二种写法分别用 `\\` 表示每个反斜杠，得到相同的文本。`repr(path)` 又用转义写法表示这两个实际反斜杠，因此输出的表示形式中各显示为 `\\`。`r` 改变字面量的解析方式，不会把文本变成专门的路径对象。

去掉前缀而保持引号内的源码不变，含义就会不同：

```python
path = "C:\notes\test.png"

print(repr(path))
print(path == r"C:\notes\test.png")
```

输出为：

```text
'C:\notes\test.png'
False
```

普通写法中的 `\n` 成为换行，`\t` 成为制表符，所得文本已不等于原始字符串写出的路径文字。这次表示形式里的单个 `\n` 与 `\t` 描述实际控制字符；前一份脚本中的 `\\n` 与 `\\t` 则描述反斜杠后接普通字母。

原始字符串仍要识别结束引号。反斜杠可以使紧随其后的引号不结束字面量，但反斜杠本身仍保留在内容中：

```python
message = r"\""

print(message)
```

输出为：

```text
\"
```

`message` 包含一个反斜杠和一个双引号。反斜杠后的双引号作为内容保留，最后一个双引号才结束字面量。

> [!IMPORTANT] 原始字符串的规则与边界
> **`r` 前缀使普通转义写法中的反斜杠保留为文本，结果仍是 `str`；引号边界仍须合法。**反斜杠可以影响后面的引号是否结束字面量，且自身保留，因此原始字符串不能以奇数个连续反斜杠结尾。

下面是一份故意错误的完整脚本：

```python
print("start")
path = r"C:\notes\"
print("end")
```

第二行末尾的单个反斜杠使其后的双引号不能结束字面量，这一行结束时仍缺少合法的结束引号。解释器在源码检查阶段报告 `SyntaxError`；在这里核对的 CPython 3.14.10 中，错误诊断的最后一行为：

```text
SyntaxError: unterminated string literal (detected at line 2); perhaps you escaped the end quote?
```

[整份脚本因此无法开始执行](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)，没有程序输出，第一行的 `start` 与第三行的 `end` 都不会写出。这是字面量语法不成立，不是程序运行到路径所在位置后才失败。

需要让文本以一个反斜杠结束时，普通字符串可以用 `\\` 表示它：

```python
path = "C:\\notes\\"

print(path)
```

输出为：

```text
C:\notes\
```

这里结尾的两个源码反斜杠表示一个内容反斜杠，后面的双引号正常结束字面量。原始写法 `r"C:\notes\\"` 虽然合法，却会在末尾保留两个反斜杠，得到不同的文本。

## 参考资料

- [Python 3.14 语言参考：字符串字面量](https://docs.python.org/3.14/reference/lexical_analysis.html#string-and-bytes-literals)
- [Python 3.14 语言参考：转义序列](https://docs.python.org/3.14/reference/lexical_analysis.html#escape-sequences)
- [Python 3.14 语言参考：三引号字符串](https://docs.python.org/3.14/reference/lexical_analysis.html#triple-quoted-strings)
- [Python 3.14 语言参考：原始字符串字面量](https://docs.python.org/3.14/reference/lexical_analysis.html#raw-string-literals)
- [Python 3.14 内置类型：字符串](https://docs.python.org/3.14/library/stdtypes.html#text-sequence-type-str)
- [Python 3.14 内置函数：repr](https://docs.python.org/3.14/library/functions.html#repr)
- [Python 3.14 内置函数：print](https://docs.python.org/3.14/library/functions.html#print)
