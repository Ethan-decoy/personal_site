---
title: 脚本与交互执行（Scripts and Interactive Execution）
date: 2026-09-23
order: 1
---

# 脚本与交互执行（Scripts and Interactive Execution）

Python 既能[运行保存在文件中的源码](../00-introduction/02-running-python-programs.md#把源文件交给解释器)，也能在交互环境中接收一段输入、立即处理。相同的代码可能在屏幕上留下不同的内容，区别来自环境怎样显示结果，以及代码本身是否要求输出。

## 脚本与交互输入

运行脚本时，解释器读取指定文件中的源码；交互模式（interactive mode）则每次接收一段完整输入，处理后继续等待下一段。脚本适合保存和重复运行一组操作，交互会话方便单独尝试一段源码并查看结果。

下文采用 CPython 3.14 默认的终端交互会话。[不带源文件名启动解释器](../00-introduction/02-setting-up-python.md#启动解释器辨认输入位置)，或在 VS Code 中使用[已选解释器的终端交互入口](../00-introduction/02-setting-up-python.md#为工作区选择解释器) **Python: Start Terminal REPL**，都可以打开这种会话。

交互记录中的 `>>>` 是等待输入的提示符，代码写在它后面；没有提示符的行，是相应输入之后显示的内容。提示符属于交互界面，保存源码时不把它一并写入文件。

会话中输入过代码，并不意味着已经生成一份包含这些代码的 `.py` 文件。

## 交互回显与程序输出

下面是一段交互记录，两次输入都使用已经出现过的问候语：

```pycon
>>> print("Hello, Python!")
Hello, Python!
>>> "Hello, Python!"
'Hello, Python!'
```

第一条输入通过 `print` [把字符串内容写入标准输出](../00-introduction/02-running-python-programs.md#函数调用与输出)。第二条输入只有字符串字面量，没有调用 `print`，界面仍然显示了这段文本。

`"Hello, Python!"` 本身就是表达式（expression）。表达式用于产生一个值，取得这个值的过程称为求值（evaluation）；求值可以只是取得一段字符串，不一定涉及算术运算。这里得到的结果就是字符串 `Hello, Python!`。

第二条输入下方的内容，是交互环境自动显示的结果，称为交互回显（interactive display）。默认交互环境用带引号的表示形式显示字符串，以便辨认结果的种类。源码中采用双引号，回显中采用单引号，并没有改变字符串内容；显示用的这两侧引号也没有成为问候语的一部分。

同样两行源码作为 `hello.py` 的完整内容时：

```python
print("Hello, Python!")
"Hello, Python!"
```

[运行这个脚本](../00-introduction/02-running-python-programs.md#把源文件交给解释器)，只得到一行输出：

```text
Hello, Python!
```

脚本中也允许单独写下表达式。第二行仍会求值得到相同内容的字符串，只是脚本不会自动显示这个结果。第一行的 `print` 调用要求写出问候语，第二行的字符串字面量本身没有要求写出文本，所以只看到第一行产生的输出。

> [!IMPORTANT] 输出与回显的来源
> **`print` 的输出由程序中的调用产生，回显由交互环境的显示规则产生；脚本不自动回显独立表达式的结果。**默认交互回显同样写入标准输出，两者都可能显示在终端中，不能只凭屏幕上出现了文字，就判断程序调用了 `print`。

## 函数返回值与输出

函数调用本身也是表达式。一次正常完成的调用会把一个结果交回调用处，这个结果称为返回值（return value），可以继续交给其他代码使用。

`print("Hello, Python!")` 写出了问候语，它的返回值却是 `None`。`None` 是 Python 中常用于表示“没有特定结果”的特殊值，它本身也是一个值，源码写法不加引号。字符串 `"None"` 则以这四个字母作为文本内容。`print` 完成输出后返回 `None`，不会把刚才写出的文本当作返回值。

当一个表达式单独输入交互会话时，回显针对的是它最终得到的结果，不会逐个显示它内部的中间值。默认回显规则还会跳过 `None`。因此，`print("Hello, Python!")` 完成后，只看到函数写出的问候语，没有额外回显一行 `None`；括号中的字符串作为实参使用，也不会因此单独触发一次回显。

下面的交互记录对照 `None`、字符串 `"None"` 和主动输出的区别：

```pycon
>>> None
>>> "None"
'None'
>>> print(None)
None
```

第一条输入得到特殊值 `None`，默认回显跳过它，因此紧接着出现下一个提示符。第二条输入得到字符串 `"None"`，它会像前面的问候语一样，以带引号的形式回显。第三条输入调用 `print`，把特殊值 `None` 写成文本 `None`；这次调用返回的仍是 `None`，所以也没有额外回显。

> [!IMPORTANT] 返回值与 None 的显示
> **`print` 正常完成后返回 `None`。默认交互回显跳过 `None`，但 `print(None)` 仍会主动写出文本 `None`。**`None` 与字符串 `"None"` 是不同的值，后者会像其他字符串一样回显。

返回值还可以成为另一次调用的实参。例如，下面把一个 `print` 调用放在另一个 `print` 的括号中：

```pycon
>>> print(print("Hello, Python!"))
Hello, Python!
None
```

外层调用要先取得实参，因此先执行内层的 `print("Hello, Python!")`：它写出问候语，然后返回 `None`。外层收到的就是这个 `None`，所以相当于接着执行一次 `print(None)`，又写出一行 `None`。

这里的两行文字都来自 `print` 调用。交互环境随后检查的是整个外层调用的返回值，仍为 `None`，因此没有第三行回显。

## 参考资料

- [Python 3.14 语言参考：表达式语句与交互回显](https://docs.python.org/3.14/reference/simple_stmts.html#expression-statements)
- [Python 3.14 语言参考：函数调用与实参求值](https://docs.python.org/3.14/reference/expressions.html#calls)
- [Python 3.14 标准库：默认交互回显](https://docs.python.org/3.14/library/sys.html#sys.displayhook)
- [Python 3.14 内置常量：None](https://docs.python.org/3.14/builtins/constants.html#None)
- [Python 3.14 内置函数：print](https://docs.python.org/3.14/builtins/functions.html#print)
