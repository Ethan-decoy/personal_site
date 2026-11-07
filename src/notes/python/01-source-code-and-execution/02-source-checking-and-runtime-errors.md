---
title: 源码检查与运行错误（Source Checking and Runtime Errors）
date: 2026-11-05
order: 2
---

# 源码检查与运行错误（Source Checking and Runtime Errors）

程序报错时，有时连第一行的输出都没有，有时却已经写出了一部分内容。要判断哪些操作真正发生，需要先辨认失败发生在源码检查阶段，还是操作执行阶段。下文采用 CPython 3.14，各个 `python` 代码块分别是一份独立的完整脚本。

## 整份脚本的语法错误会阻止它开始执行

下面是故意写错的 `hello.py`：

```python
print("start")
print("end"
```

第二行缺少右圆括号，无法构成完整的调用。解释器会报告语法错误（syntax error）。下面将诊断中的文件路径简写为 `hello.py`，实际运行时会显示相应路径：

```text
  File "hello.py", line 2
    print("end"
         ^
SyntaxError: '(' was never closed
```

`line 2` 指向第二行，标记位于尚未闭合的左括号下方，末行说明这个括号没有闭合。第一行的调用本身没有问题，但运行这份脚本时，仍然不会输出 `start`。

原因在于，直接运行源文件时，解释器先解析整份脚本，检查源码能否组成合法结构，再开始执行其中的语句。第二行使当前脚本未能通过检查，因此第一行也尚未执行。文件中的先后位置，并不意味着前一行能在后一行接受检查之前先执行。

> [!IMPORTANT] 源码检查的边界是当前脚本
> **直接运行源文件时，当前脚本的源码要先整体通过语法检查，其中的语句才会开始执行。同一脚本后面的语法错误，也能阻止前面的语句开始执行。**

[交互模式每次接收一段完整输入](01-scripts-and-interactive-execution.md#脚本与交互输入)，检查边界也随之不同。已经单独提交并执行成功的输入，不会因为后来另一段输入出现语法错误而变成“从未执行”。同一脚本文件中的相邻语句，则属于这次一起提交的源码。

## 运行异常发生在操作执行时

保留先输出、再进行另一项操作的结构，这份 `hello.py` 的完整内容为：

```python
print("start")
1 / 0
print("end")
```

`1` 和 `0` 在这里表示整数，`/` 要求计算除法结果。`1 / 0` 是一个表达式，写法符合语法，但除数为零，真正求值时会引发异常（exception）`ZeroDivisionError`，无法正常得到除法结果。

这份脚本先通过语法检查，再开始执行。第一行完成输出，第二行执行除法时失败；本例没有处理这个异常，所以第三行不再执行。标准输出中已经写入的内容是：

```text
start
```

对应的错误诊断为，文件路径仍简写为 `hello.py`：

```text
Traceback (most recent call last):
  File "hello.py", line 2, in <module>
    1 / 0
    ~~^~~
ZeroDivisionError: division by zero
```

这段诊断在最后一行给出异常名称和说明；上面从 `Traceback (most recent call last):` 开始的部分称为回溯（traceback），记录异常发生时的执行位置。

> [!IMPORTANT] 运行失败与先前操作
> **在这类独立运行且没有异常处理的脚本中，运行异常会打断后续执行；失败不会自动撤销先前已经完成的操作。**本例的最后一次 `print` 没有执行，已经写出的 `start` 仍然保留。

语法检查通过，只说明源码符合相应的结构规则。每项操作能否成功，还取决于它实际处理的值与运行条件。前一份脚本尚未开始执行，这一份则已经完成部分操作；看到错误信息时，需要先辨认这一区别。

默认终端交互会话则在报告这类异常后继续等待下一次输入。下面按顺序分别提交三次输入；记录省略了诊断中的回溯部分，只保留末行错误说明：

```pycon
>>> print("start")
start
>>> 1 / 0
ZeroDivisionError: division by zero
>>> print("end")
end
```

第一次输入已经写出 `start`。第二次输入求值失败，交互环境报告异常后，再次显示等待输入的提示符 `>>>`。最后的 `print("end")` 是随后新提交的输入，因此仍能执行；这并不表示前面的独立脚本能够越过除零操作，接着执行第三行。

## 程序输出与错误诊断

> [!IMPORTANT] 输出通道与显示顺序
> **默认情况下，`print` 写入[标准输出](../00-introduction/02-running-python-programs.md#函数调用与输出)，解释器将错误诊断写入标准错误（standard error）；它们是两个不同的通道。**错误诊断可以由解释器直接产生，不表示源码中又执行了一次 `print` 调用。
>
> 两种通道汇入同一窗口或日志时，显示顺序可能受到缓冲和收集方式影响。判断操作的先后，应结合源码与失败位置，不能只看文字在屏幕上的排列。

语法错误的诊断通常包含文件名、行号、相关源码和错误说明。标记指向发现问题的位置，修改方式要结合源码判断：第一份诊断标出了已有的左括号，修正时需要在字符串后补上与它配对的右括号。

在上面的除零示例中，回溯里的 `File "hello.py", line 2` 把位置对应到脚本的第二行，紧接着展示该行源码与相关标记。诊断末行的 `ZeroDivisionError` 表示异常种类，`division by zero` 说明原因是除数为零。

> [!TIP] 结合诊断定位源码与失败原因
> 先根据文件名和行号找到对应源码，再结合异常名称、错误说明和相关标记，核对失败的结构或操作。标记指出发现问题的位置，实际需要修改的地方仍须结合源码判断。

`SyntaxError` 本身也是一种异常。判断哪些操作已经发生，需要结合失败阶段与源码位置。诊断的精确措辞、路径与标记样式可能随运行入口或版本变化，使用时核对实际信息即可，不需要背诵整段诊断。

## 参考资料

- [Python 3.14 语言参考：异常、执行中断与交互会话](https://docs.python.org/3.14/reference/executionmodel.html#exceptions)
- [Python 3.14 命令行：非交互输入在执行前完成解析](https://docs.python.org/3.14/using/cmdline.html#interface-options)
- [Python 3.14 教程：语法错误、运行异常与诊断信息](https://docs.python.org/3.14/tutorial/errors.html)
- [Python 3.14 内置异常：SyntaxError](https://docs.python.org/3.14/builtins/exceptions.html#SyntaxError)
- [Python 3.14 标准库：标准输出、标准错误与缓冲](https://docs.python.org/3.14/library/sys.html#sys.stdout)
