---
title: 对象的类型（Object Types）
date: 2026-11-07
order: 2
---

# 对象的类型（Object Types）

整数 `3` 和字符串 `"3"` 都能由 `print` 写成一行 `3`，但前者表示一个数，后者表示一段文本。输出的文字相同，不能据此判断它们支持相同的操作。

脚本示例均为完整程序，分别在 CPython 3.14 中独立运行。

## 值、类型与显示结果

```python
print(3)
print("3")
```

输出为：

```text
3
3
```

第一行中的 `3` 是整数字面量（integer literal），求值得到表示整数三的对象，其类型是 `int`。第二行中的 `"3"` 是字符串字面量，求值得到包含字符 `3` 的字符串对象，其类型是 `str`。字符串的引号界定源码中的文本边界，[不会由这里的 `print` 作为内容输出](../00-introduction/02-running-python-programs.md#函数调用与输出)，因此两行显示成相同的文字。

**类型（type）规定对象可以表示的值，以及它支持的操作。**`int` 和 `str` 是 Python 提供的两个内置类型：前者表示整数，后者表示文本。字符串内容恰好是数字字符，并不会使它自动成为整数。

单参数形式的 `type(value)` 用来取得传入对象的类型，返回的是一个类型对象（type object），并不要求输出。把这个返回值交给 `print`，就能显示类型：

```python
print(type(3))
print(type("3"))
```

外层的 `print` 要先取得实参，因此先执行内层的 `type` 调用，再把所得类型对象交给 `print`。这沿用了[返回值可以成为另一次调用实参的规则](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)。输出为：

```text
<class 'int'>
<class 'str'>
```

`<class 'int'>` 和 `<class 'str'>` 是这两个类型对象的显示形式。`class` 是这里表示类型时采用的字样，`int` 与 `str` 标识相应类型；显示的对象已经是类型对象，而不是原来的整数和字符串。`type(3)` 返回的也不是字符串 `"int"`。

## 重新绑定与对象类型

[读取名称时，取得它当前绑定的对象](01-names-and-assignment.md#赋值建立名称与对象的绑定)。因此，`type(value)` 查看的是名称 `value` 此刻引用的对象的类型。

```python
value = "3"
previous_value = value
value = 3

print(type(value))
print(type(previous_value))
```

第一行让 `value` 引用字符串对象。第二行读取这个绑定，让 `previous_value` 也引用该字符串对象；绑定动作没有复制字符串。第三行将 `value` 重新绑定到整数对象，`previous_value` 仍然引用原来的字符串对象。输出为：

```text
<class 'int'>
<class 'str'>
```

第三行改变的是 `value` 的绑定，没有把原字符串转换成整数。随后读取两个名称，分别取得不同类型的对象，因而得到不同的类型结果。

> [!IMPORTANT] 类型与名称绑定
> **类型属于对象；同一个名称可以先后绑定不同类型的对象。**简单名称重新绑定到其他类型的对象，不会把原对象转换成另一种类型，也不会改变其他名称的绑定。

Python 是动态类型（dynamic typing）语言。在这里的简单赋值中，不需要先声明名称只能引用某种类型；执行到操作时，仍然要依据实际取得的对象及其类型判断操作。这使同一个名称可以引用不同类型的对象，也保留了各类型自身的操作规则。

## 类型约束操作的含义与成立条件

运算符（operator）`+` 写在两个表达式之间，两侧供运算使用的对象称为操作数（operand）。两个操作数都是整数时，`+` 计算它们的和；都是字符串时，`+` 拼接两段文本，得到表示拼接结果的字符串：

```python
print(3 + 4)
print("3" + "4")
```

每行都先计算括号中的加法表达式，再把结果交给 `print`。输出为：

```text
7
34
```

第一行的结果是整数 `7`。第二行的结果是字符串 `"34"`，其中的字符依次来自左侧的 `"3"` 和右侧的 `"4"`。两次运算都使用 `+`，但操作数的类型不同，运算的含义也不同。

把右侧字符串 `"4"` 改成整数 `4`，则不能再应用字符串与字符串拼接的规则。下面是故意错误的完整脚本：

```python
left = "3"
right = 4

print("start")
print(left + right)
print("end")
```

这份源码符合语法。运行时，前两行分别建立字符串与整数的绑定，接着完成 `start` 的输出。随后求值 `left + right` 时，左侧是字符串，右侧是整数，这一组合不支持这里的加法操作，因而引发类型错误 `TypeError`。标准输出中已经写入的内容是：

```text
start
```

错误诊断的末行为：

```text
TypeError: can only concatenate str (not "int") to str
```

诊断说明，字符串拼接需要另一个字符串，这里却取得了整数。字符串 `"3"` 看起来像一个数，也不会使这次加法自动把它当作整数；整数 `4` 同样没有被自动改成字符串。

失败发生在加法求值时，尚未得到能够交给外层 `print` 的结果，因此这次输出调用没有执行。异常未被处理，最后的 `print("end")` 也不再执行；先前写出的 `start` 则[不会因为后续失败而撤销](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)。诊断措辞可能随实现或版本变化，使用时核对实际的异常类型、说明与失败位置即可。

> [!IMPORTANT] 操作依据实际对象判断
> **名称参与运算时，使用的是它当前绑定的对象，运算按实际操作数的类型规则进行。**同一个运算符对不同类型可能表示不同操作；名称可以重新绑定到其他类型的对象，并不意味着这些对象支持相同操作。

这也不意味着“不同类型的对象都不能一起运算”，具体操作支持哪些类型组合，要按相应规则判断。类型符合操作要求，也不保证任意取值都能成功：[除法中的 `1` 与 `0` 都是整数，但除数为零仍会引发异常](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)。类型、具体取值与运行条件分别影响操作能否完成。

> [!TIP] 核对参与操作的对象类型
> 普通输出无法分清数据种类，或遇到类型不匹配的 `TypeError` 时，可在失败操作之前用 `type` 分别取得实际操作数的类型，再用 `print` 显示。将查到的类型与该操作支持的输入组合核对；若组合不受支持，再根据操作目的是数值计算还是文本处理，检查数据来源与所用操作。只看输出是否像一个数字，可能漏掉整数与字符串的区别。

## 参考资料

- [Python 3.14 语言参考：对象、值与类型](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 内置调用：type](https://docs.python.org/3.14/builtins/functions.html#type)
- [Python 3.14 语言参考：名称与绑定](https://docs.python.org/3.14/reference/executionmodel.html#binding-of-names)
- [Python 3.14 语言参考：加法操作](https://docs.python.org/3.14/reference/expressions.html#binary-arithmetic-operations)
- [Python 3.14 内置异常：TypeError](https://docs.python.org/3.14/builtins/exceptions.html#TypeError)
