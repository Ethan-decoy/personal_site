---
title: 名称与赋值（Names and Assignment）
date: 2026-11-05
order: 1
---

# 名称与赋值（Names and Assignment）

字符串可以[直接交给 `print` 输出](../00-introduction/02-running-python-programs.md#函数调用与输出)，也可以先用一个名称引用，再通过名称取得它。这样，同一份数据就能在程序的不同位置使用。

脚本示例均为完整程序，分别在 CPython 3.14 中独立运行。

## 赋值建立名称与对象的绑定

```python
message = "Hello, Python!"
print(message)
```

Python 用对象（object）表示程序中的数据。右侧的字符串字面量求值得到一个字符串对象，它表示文本 `Hello, Python!`。左侧的 `message` 是名称（name），用于引用这个对象。

第一行是赋值语句（assignment statement）。`=` 在这里要求先对右侧表达式求值，再让左侧名称引用所得对象。让名称引用某个对象，称为建立绑定（binding）。在这类例子中，`message` 也常被称为变量名（variable name）。

第二行括号中的 `message` 也是[表达式](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#交互回显与程序输出)。读取这个名称，得到它当前绑定的字符串对象，再把这个对象交给 `print`，输出为：

```text
Hello, Python!
```

赋值本身没有要求把问候语显示出来。

> [!IMPORTANT] 名称的赋值与读取
> **在这里的简单名称赋值中，先对右侧表达式求值，再将左侧名称绑定到所得对象；读取名称时，取得它当前绑定的对象。**

常见的英文名称由字母、数字和下划线组成，首字符使用字母或下划线。名称区分大小写，`message` 与 `Message` 是两个不同的名称。`if` 等保留关键字（keyword）由语言用于专门语法，不能作为这里的赋值名称。

示例名称采用小写字母，多个单词用下划线连接，如 `previous_message`。这是本书采用的书写约定。Python 还支持符合规则的非英文名称；其他字符的合法范围与完整保留字规则，可查阅[官方名称规则](https://docs.python.org/3.14/reference/lexical_analysis.html#names)。

## 名称与字符串字面量

带引号与不带引号的 `message`，在源码中承担不同角色：

```python
message = "Hello, Python!"
print(message)
print("message")
```

输出为：

```text
Hello, Python!
message
```

`print(message)` 要先读取名称 `message`，取得它绑定的对象。`print("message")` 则直接把内容为 `message` 的字符串交给函数，引号之间的字母是文本内容。

因此，最后一行输出的是单词 `message` 本身。若只运行 `print("message")` 这一条调用，也不需要先建立名称 `message` 的绑定，因为这个字符串字面量不要求查找同名名称。

## 重新绑定与多个名称

同一个名称可以再次赋值：

```python
message = "Hello, Python!"
print(message)
message = "Welcome, Python!"
print(message)
```

输出为：

```text
Hello, Python!
Welcome, Python!
```

第一次输出读取到的是 `message` 当时绑定的问候语。第三行再次执行赋值，让 `message` 绑定到表示 `Welcome, Python!` 的字符串对象，随后读取这个名称便取得新的结果。这种改变已有绑定的行为称为重新绑定（rebinding）。

赋值右侧也可以使用另一个名称：

```python
message = "Hello, Python!"
previous_message = message
message = "Welcome, Python!"

print(message)
print(previous_message)
```

第二行右侧的 `message` 先求值，取得它当时引用的字符串对象。按照简单名称赋值的规则，左侧的 `previous_message` 直接绑定到所得对象，绑定动作没有复制字符串。此时，两个名称都引用表示 `Hello, Python!` 的同一个字符串对象。

第三行只重新绑定 `message`。`previous_message` 仍引用原来的对象，所以输出为：

```text
Welcome, Python!
Hello, Python!
```

`previous_message = message` 建立的是名称与对象的关系。此后读取 `previous_message`，就通过它自己的绑定取得对象，不需要再去读取 `message`。两个名称在第二行引用同一对象，并不要求它们以后始终保持相同绑定。

> [!IMPORTANT] 多个名称与重新绑定
> **多个名称可以引用同一个对象，简单名称赋值的绑定动作不复制对象。重新绑定其中一个名称，本身不会改变其他名称的绑定。**

## 读取尚未绑定的名称

下面是故意错误的完整脚本，在一次新的运行中执行，开始时没有 `message` 的绑定：

```python
print(message)
message = "Hello, Python!"
```

第一行尝试读取 `message`，但此时还找不到这个名称的绑定。解释器会报告 `NameError`，诊断的末行为：

```text
NameError: name 'message' is not defined
```

这份源码符合语法，失败发生在运行时读取名称的操作中。`print` 要先取得实参，读取失败时，这次输出调用尚未执行，所以没有写出问候语。异常未被处理，脚本也就[停止后续执行](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)，第二行没有机会建立绑定。

> [!WARNING] 后面的赋值不能提前生效
> **执行到名称读取时，若仍找不到它的绑定，就会引发 `NameError`；源码后面的赋值不能提前建立该绑定。**本例中的异常未被处理，脚本停止执行，第二行赋值不会发生。

赋值是建立名称绑定的一种方式。`print` 已由 Python 作为内置名称提供，因此这些脚本可以直接使用它；本例中的 `message` 则需要由脚本建立绑定。

> [!TIP] 复现错误时核对已有绑定
> 同一次交互会话可能保留先前赋值建立的绑定，独立脚本的一次新运行不继承这些绑定。若同一条读取语句在两种环境中表现不同，核对读取前执行过哪些语句，以及当前是否已有同名绑定。

## 右侧求值与绑定的先后

赋值右侧是函数调用表达式时，名称绑定到调用正常返回的对象。[`print` 的返回值是 `None`](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)：

```python
result = print("Hello, Python!")
print(result)
```

第一行先执行 `print("Hello, Python!")`，由这次调用写出问候语。调用正常返回的 `None` 也是一个对象，`result` 随后绑定到它；第二行读取该绑定，再把 `None` 交给 `print`。完整输出为：

```text
Hello, Python!
None
```

`result` 已经有绑定，读取它会得到 `None`；前面的错误脚本则在读取名称时找不到绑定，因而引发 `NameError`。

右侧也可能在得到结果之前失败。以下交互记录来自一个新的默认终端会话，各次输入按顺序执行；记录省略回溯部分，只保留异常诊断的末行：

```pycon
>>> message = "Hello, Python!"
>>> message = 1 / 0
ZeroDivisionError: division by zero
>>> print(message)
Hello, Python!
```

第一条输入只建立绑定，没有输出，也不触发默认的表达式回显。第二条输入先计算右侧的 `1 / 0`，除法引发异常，尚未执行这次目标绑定。这里的 `message` 此前已有绑定，因此在交互环境重新接收输入后，仍能取得原来的问候语。

> [!WARNING] 右侧求值失败时不进行目标绑定
> **简单名称赋值中，若右侧求值因异常而失败，这次目标绑定就不会发生。**本例的 `message` 因而保留原来的绑定，并没有先被替换再恢复。

求值期间已经完成的其他效果，仍按[运行异常与先前操作的规则](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)判断，不会因为这次赋值失败而自动撤销。

## 参考资料

- [Python 3.14 语言参考：名称与绑定](https://docs.python.org/3.14/reference/executionmodel.html#binding-of-names)
- [Python 3.14 语言参考：赋值语句](https://docs.python.org/3.14/reference/simple_stmts.html#assignment-statements)
- [Python 3.14 语言参考：赋值中的求值顺序](https://docs.python.org/3.14/reference/expressions.html#evaluation-order)
- [Python 3.14 语言参考：对象、值与类型](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 语言参考：名称的写法](https://docs.python.org/3.14/reference/lexical_analysis.html#names)
- [Python 3.14 内置异常：NameError](https://docs.python.org/3.14/builtins/exceptions.html#NameError)
