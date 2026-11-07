---
title: 词法记号、缩进与注释（Tokens, Indentation, and Comments）
date: 2026-10-26
order: 3
---

# 词法记号、缩进与注释（Tokens, Indentation, and Comments）

[源码要先通过检查，脚本才开始执行](02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)。这些检查涉及名称、引号、括号、换行和行首空格的组织方式。同样是增加空格或换行，有些调整只改变排版，有些会改变文本内容、操作执行的条件，或使源码不再合法。

示例采用 CPython 3.14；各个 `python` 代码块分别是一份独立的完整脚本。

## 源码由记号组成

解释器从源码的字符中识别词法记号（token），再按语法规则分析它们组成的结构。记号是分析源码时识别出的单位，并不等于单个字符。以这份脚本为例：

```python
print("Hello, Python!")
```

这里独立写出的 [`print` 调用](../00-introduction/02-running-python-programs.md#函数调用与输出)构成一条语句（statement），要求执行这次输出调用。组成这个调用的名称、括号和字符串，可以这样辨认：

| 源码片段 | 记号与本例中的作用 |
| --- | --- |
| `print` | 一个名称记号，使用内置函数的名称 |
| `(` | 左圆括号，在这里开始调用的实参部分 |
| `"Hello, Python!"` | 一个普通字符串字面量记号，表示传给函数的文本 |
| `)` | 右圆括号，在这里结束调用的实参部分 |

`print` 虽然由五个字母组成，仍是一个名称记号。引号里的逗号、空格和感叹号则与引号一起构成普通字符串字面量的写法；其中的空格属于文本，不是用来分隔源码记号的空白。

记号之间可以在允许的位置加入空格。下面两行构成相同的调用，依次输出两行相同的问候语：

```python
print("Hello, Python!")
print ( "Hello, Python!" )
```

第二行只在本例允许分隔记号的位置加入空格，名称和字符串记号本身没有改变。这种排版用于对照合法位置，通常仍采用第一行的紧凑写法。

若把调用中的 `print` 改成 `pr int`，原来的一个名称就被拆成了两个名称记号。它们在这里无法组成合法调用，解释器会在这一行报告 `SyntaxError`，当前脚本无法开始执行。

若把 `"Hello, Python!"` 改成 `"Hello,Python!"`，源码仍然合法，但交给 `print` 的文本已经改变，输出也就少了逗号后的空格。判断空格能否调整，需要先辨认它处在什么位置。

> [!IMPORTANT] 记号边界与字符串内容
> **在允许分隔记号的位置，调整空格可以只改变排版；名称内部插入空格会拆开名称，普通字符串内部的空格则属于文本内容。**

## 一次调用可以写在多个物理行上

同一个调用也可以写成：

```python
print(
    "Hello, Python!"
)
```

运行这份脚本，仍然只输出一行 `Hello, Python!`。换行发生在调用括号内部、字符串字面量之外，三行共同表达同一次调用；字符串本身仍完整地写在中间那一行，输出文本没有增加换行。

源码中按换行分开的行称为物理行（physical line）。Python 再按续行规则，把一个或多个物理行组成逻辑行（logical line）。上例的三个物理行组成一个逻辑行，换行没有把调用拆成三条语句。

这种括号内的续行称为隐式续行（implicit line joining），不需要在行末额外写续行符。方括号和花括号内的表达式也支持相应的续行规则。

> [!IMPORTANT] 源码换行与语句结束
> **物理行换行不一定结束当前语句。括号内的续行仍属于同一个逻辑行，不能按源码写了几行来判断进行了几次操作。**

中间一行缩进四个空格，是为了让调用内容容易辨认。这些空格位于尚未闭合的括号内，用于续行排版；右括号结束后，调用才完整。

在这些脚本中，字符串之外的单独空行可以用来分隔内容，不会增加一次调用或计算。[缺少右括号的脚本](02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)直到文件结束仍没有形成完整结构，因此会在执行前失败。

## 缩进决定语句归属

行首空格还可以承担另一种作用：决定语句属于哪一组。`if` 语句是一种条件语句（conditional statement）：条件成立时，才执行它后面的语句组（suite）。

这里固定采用布尔值（Boolean value）`False`，表示假，写法不加引号。`if False:` 的条件不成立，因此属于它的语句都会被跳过。冒号结束条件部分；采用换行形式时，后面的受控语句要缩进一层：

```python
if False:
    print("inside")
print("after")
```

`print("inside")` 缩进了一层，属于 `if` 控制的语句组，因此被跳过。`print("after")` 退回到 `if` 所在层级，已经离开这个语句组，仍然执行。输出为：

```text
after
```

只把最后一行也缩进四个空格，得到另一份脚本：

```python
if False:
    print("inside")
    print("after")
```

现在两次调用都属于这个 `if` 控制的语句组，条件不成立，两次调用都被跳过。整个脚本没有输出。两份脚本的条件都固定为 `False`，调用中的文本也相同；最后一行的缩进改变了它是否属于被跳过的范围。

> [!IMPORTANT] 缩进与语句归属
> **在换行书写的受控语句组中，同组语句保持同一缩进层级，退回外层缩进表示离开该组。**改变缩进，可能改变一条语句在什么条件下执行。

这里与前面的多行调用都出现了行首空格，作用却不同：**括号内的续行缩进用于排版，`if` 后语句组的缩进参与决定程序结构。**不能仅凭一行向右移了多少，就脱离上下文判断它的归属。

本书每级缩进采用四个空格，与 [PEP 8 的建议](https://peps.python.org/pep-0008/#indentation)一致。这是书写惯例，四个空格并非唯一合法宽度；语言要求相应层级的缩进一致、归属合法。统一使用空格，也能避免空格与制表符混排时，看起来对齐却实际属于不同层级。

缩进还必须先构成合法语法。下面是故意错误的完整脚本：

```python
print("start")
if False:
print("inside")
```

`if` 后采用换行形式，第三行却没有缩进，因而缺少它所要求的语句组。解释器会在第三行报告缩进错误 `IndentationError`，这是一种语法错误。整份脚本尚未开始执行，第一行的 `start` 也不会输出。条件决定的是通过检查后哪些语句会执行，`False` 也不能免除[源码检查](02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)。

Python 让读者看到的排版层级直接参与表示程序结构。[官方设计 FAQ](https://docs.python.org/3.14/faq/design.html#why-does-python-use-indentation-for-grouping-of-statements)将这种选择与可读性联系起来：代码呈现的分组与实际分组保持一致。相应地，移动或粘贴代码时，也需要连同缩进一起核对语句归属。

## 注释与字符串中的井号

注释（comment）是在源码中写下的说明，不作为调用或计算语句执行。井号 `#` 是否开始注释，需要结合字符串的边界判断。例如：

```python
# 这一行说明下面的调用。
print("Hello # Python!")  # 这一部分是行尾注释。
```

输出为：

```text
Hello # Python!
```

第一行的井号开始一条独立注释；调用右侧、字符串外的井号开始行尾注释。两处说明都不属于输出文本。引号之间的井号则是普通字符串的内容，随问候语一起写出。

> [!IMPORTANT] 注释与字符串内容的边界
> **普通字符串字面量中的 `#` 属于文本；在字符串外，`#` 开始注释，内容延续到当前物理行末。**

多行注释可以逐行使用 `#`。三引号 `'''` 或 `"""` 界定的仍然是字符串字面量，只是允许内容跨行。例如，`print("""Hello # Python!""")` 会把这个字符串交给 `print`，仍然输出一行 `Hello # Python!`。

把三引号字符串独立写在脚本中时，[脚本不会自动回显表达式的结果](01-scripts-and-interactive-execution.md#交互回显与程序输出)，因此可以没有可见输出。这里写下的仍是字符串表达式，不能凭没有输出，就把它当作通用的多行注释语法。

注释适合补充代码中不容易直接看出的原因、约束和边界。代码改变后，对应的说明也应同步核对，避免留下与实际行为相反的解释。

## 参考资料

- [Python 3.14 语言参考：行结构、续行、缩进与记号间空白](https://docs.python.org/3.14/reference/lexical_analysis.html#line-structure)
- [Python 3.14 语言参考：记号的种类](https://docs.python.org/3.14/reference/lexical_analysis.html#other-tokens)
- [Python 3.14 语言参考：独立表达式组成语句](https://docs.python.org/3.14/reference/simple_stmts.html#expression-statements)
- [Python 3.14 语言参考：复合语句与语句组](https://docs.python.org/3.14/reference/compound_stmts.html)
- [Python 3.14 语言参考：注释](https://docs.python.org/3.14/reference/lexical_analysis.html#comments)
- [Python 3.14 语言参考：三引号字符串](https://docs.python.org/3.14/reference/lexical_analysis.html#triple-quoted-strings)
- [PEP 8：缩进惯例](https://peps.python.org/pep-0008/#indentation)
- [Python 3.14 设计 FAQ：为什么用缩进表示语句分组](https://docs.python.org/3.14/faq/design.html#why-does-python-use-indentation-for-grouping-of-statements)
