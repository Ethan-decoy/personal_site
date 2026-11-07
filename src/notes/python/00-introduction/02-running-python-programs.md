---
title: 运行第一个 Python 程序（Running the First Python Program）
date: 2026-09-23
order: 3
---

# 运行第一个 Python 程序（Running the First Python Program）

Python 源码可以保存在文件中，由解释器读取并执行。程序的可见输出来自代码要求执行的操作。以下示例采用[已安装的 CPython 3.14](02-setting-up-python.md#安装并核对-cpython-314)。

## 源码与源文件

源代码（source code）是用编程语言写成的程序文本。保存 Python 源码的文本文件称为源文件（source file），通常采用 `.py` 扩展名。下面是 `hello.py` 的完整内容：

```python
print("Hello, Python!")
print("你好，Python！")
```

这份文件包含两次输出调用。在 VS Code 中，可通过 **File → New Text File** 新建编辑内容，再通过 **File → Save As** 保存为 `hello.py`；保存的是代码本身，运行命令和运行结果分别出现在其他位置。

Python 源文件默认采用 UTF-8 编码，使解释器能够按约定读取包括中文在内的文本。VS Code 的状态栏可查看文件编码，点击编码项可选择其他编码重新打开或保存文件；保存本例时采用 UTF-8。

## 函数调用与输出

`"Hello, Python!"` 是字符串字面量（string literal），用源码写法表示一段文本。两侧的引号界定文本边界，中间的 `Hello, Python!` 才是这个字符串的内容。第二行的中文字符串采用相同写法。

`print` 是 Python 提供的内置函数（built-in function），可直接用于输出。在函数名称后写圆括号，表示发起一次调用（call）；括号中的字符串是交给这次调用的实参（argument）。本例每次都把一段文本交给 `print`。

`print` 将文本写入标准输出（standard output），并按默认设置在末尾换行。标准输出是程序发送普通输出的通道；从终端直接运行本例时，文本通常显示在终端窗口中。

这份程序中的两次调用按书写顺序执行，正常输出为：

```text
Hello, Python!
你好，Python！
```

第一行调用先写出英文问候语并换行，第二行调用再写出中文问候语并换行。这里出现两行输出，是因为进行了两次默认换行的输出调用。

> [!IMPORTANT] 字符串写法与输出文本
> **界定字符串字面量的引号不属于字符串内容。这里的 `print` 写出字符串内容，并在默认设置下换行。**源码中的引号和调用括号不会作为问候语的一部分输出。

普通字符串也可以使用配对的单引号。例如，第二条调用写成 `print('你好，Python！')`，交给 `print` 的文本仍相同。这里的字符串边界使用英文半角引号 `'` 或 `"`。若把 `“ ”`、`‘ ’` 这样的弯引号用作边界，解释器会报告语法错误（syntax error），无法执行这份源码。

## 把源文件交给解释器

源文件作为程序直接交给解释器运行时，称为脚本（script）。下面的命令输入在[shell](02-setting-up-python.md#终端与-shell)中，源码则由选中的 Python 解释器读取。

Windows 使用：

```powershell
py -3.14 hello.py
```

macOS 或 Linux 使用：

```sh
python3.14 hello.py
```

> [!IMPORTANT] 解释器入口与源文件路径
> **解释器入口决定由谁执行，源文件路径决定执行哪一份代码。**这里 `py -3.14` 或 `python3.14` 选择 CPython 3.14，`hello.py` 指定要读取的源文件。

`hello.py` 是相对路径（relative path），解释器以当前工作目录（current working directory）为起点解析它。以上命令在 `hello.py` 所在目录执行时，文件名本身就足以定位源文件；文件在其他位置时，需要给出对应的路径。

在 VS Code 以源码所在文件夹为[工作区](02-setting-up-python.md#为工作区选择解释器)时，**Terminal → New Terminal** 打开的集成终端（integrated terminal）默认以这个文件夹作为当前工作目录，可以在其中输入上述命令。集成终端是编辑器内部的终端面板，输入仍由当前的 shell 或 Python 解释器处理。

本例的两个调用完成后，脚本结束，shell 重新等待命令。若解释器报告源文件不存在，应核对当前工作目录、文件名和路径；此时源文件尚未成功打开，其中的 `print` 调用也没有执行。

VS Code 的 Python 扩展也可通过编辑器右上角的 **Run Python File in Terminal** 执行当前源文件，输出显示在集成终端中。这个入口使用[工作区中选定的解释器](02-setting-up-python.md#为工作区选择解释器)。

## 保存源码与再次执行

编辑器中尚未保存的内容，可能与磁盘上的源文件不同。终端运行命令读取的是路径指定的文件，不会自动采用另一个编辑窗口中尚未保存的改动。

> [!IMPORTANT] 保存源码与执行程序
> **保存更新磁盘上的源码；从终端再次运行脚本，执行的是指定文件中已保存的内容。**在这里的手动运行方式下，保存本身不会触发新一轮执行。

假设同一份 `hello.py` 保存为以下内容，仅改变第一条调用中的文本：

```python
print("Welcome, Python!")
print("你好，Python！")
```

相同的运行命令会得到：

```text
Welcome, Python!
你好，Python！
```

解释器入口和源文件路径保持相同，第一条输出随保存后的文本改变，第二条输出保持不变。这是两次独立执行读取不同源码内容的结果。

出现旧输出时，除了核对修改是否保存，还应确认命令读取的是哪一份文件。如果在不同目录中分别保存了两份独立的 `hello.py`，修改其中一份，不会更新另一份。

## 参考资料

- [Python 3.14 语言参考：源码编码与字符串字面量](https://docs.python.org/3.14/reference/lexical_analysis.html)
- [Python 3.14 内置函数：print](https://docs.python.org/3.14/library/functions.html#print)
- [Python 3.14 命令行：运行源文件](https://docs.python.org/3.14/using/cmdline.html#interface-options)
- [VS Code：运行 Python 文件](https://code.visualstudio.com/docs/python/run#run-python-code)
- [VS Code：文件编码](https://code.visualstudio.com/docs/editing/codebasics#file-encoding-support)与[集成终端](https://code.visualstudio.com/docs/terminal/basics)
