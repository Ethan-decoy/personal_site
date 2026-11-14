---
title: 函数的定义、调用与返回（Defining, Calling, and Returning）
date: 2026-11-12
order: 1
---

# 函数的定义、调用与返回（Defining, Calling, and Returning）

函数（function）把一段操作组织成可以调用的对象。调用可以提供输入，并取得一个返回结果；定义函数本身，并不等于执行其中的操作。

各代码块为独立完整脚本，使用 CPython 3.14.10。

## 定义与执行是两个时刻

`def` 后写函数名，圆括号中列出参数（parameter），冒号后的缩进部分是函数体（function body）。参数名用于在本次调用中引用收到的对象；函数体中的 `return` 将后面表达式的结果交回调用处。

调用时，在函数名后的圆括号中提供[实参（argument）](../00-introduction/02-running-python-programs.md#函数调用与输出)。本例采用按位置对应的形式：先对实参表达式求值，再按顺序把所得对象绑定给参数名，随后执行函数体。图像宽与高均以像素为单位，相乘得到像素总数：

```python
def area(width, height):
    print("calculating")
    return width * height


print("defined")
result = area(320, 240)
print(result)
```

输出为：

```text
defined
calculating
76800
```

执行 `def` 时，创建函数对象，并让名称 `area` 引用它；函数体中的输出与乘法尚未执行。`area(320, 240)` 才发起调用：本次调用的 `width` 引用整数三百二十，`height` 引用整数二百四十。函数体先输出 `calculating`，再求出乘积七万六千八百并返回；外层赋值使 `result` 引用这个整数，最后将其输出。

> [!IMPORTANT] 定义、调用与返回
> **执行函数定义会建立函数对象；调用才会执行普通函数体。**一次调用先取得实参对象、绑定参数，再执行函数体；正常执行到 `return` 时，将结果交回调用处，并结束本次调用。

函数体必须有语句。暂时没有操作时可以写 `pass`，它是合法但不产生效果的语句。名称须在调用发生前已经绑定；源码中定义写在调用的后面，不能让尚未执行的定义提前生效。

## 返回结果可以继续参与计算

[函数调用也是表达式](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)，返回结果可以继续交给其他代码。把一个调用写在另一个调用的实参位置时，内层返回的对象就是外层接收的输入：

```python
def area(width, height):
    return width * height


def double(value):
    return value * 2


print(double(area(3, 4)))
```

输出为：

```text
24
```

`area(3, 4)` 先完成乘法，返回十二；`double` 的参数 `value` 接收十二，返回二十四；最后，`print` 接收二十四并输出。

## return 结束整个调用

`return` 只能在函数体中使用，也可以写在函数体内的条件或循环中。它离开的是本次函数调用，而不只是某个分支或循环：

```python
def first_positive(values):
    for value in values:
        if value > 0:
            return value
    return None


print(first_positive([0, -2, 5, 8]))
print(first_positive([0, -2]))
```

输出为：

```text
5
None
```

第一次调用取得五时立即返回，八不会再被检查。第二次循环耗尽，执行末尾的 `return None`。这里 `None` 表示“没有找到”，与找到整数零的含义不同；本例条件排除了零。

在脚本顶层写 `return`，会在[源码检查阶段](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)引发 `SyntaxError`，整份脚本都不会开始执行。把它放进顶层的 `if` 或循环中，也不能使它成为合法的函数返回语句。

不带表达式的 `return`，以及函数体正常执行到末尾，均返回 `None`。这与函数是否产生[文本输出](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)无关。`announce` 不需要接收输入，定义处不列参数，调用时也保留空圆括号：

```python
def announce():
    print("ready")


result = announce()
print(result)
```

输出为：

```text
ready
None
```

`announce` 中的 `print` 先写出 `ready`，随后函数体执行到末尾，返回 `None`。因此 `result` 引用的是 `None`，不是已经输出的字符串；第二条 `print` 才把这个返回值写出来。

> [!IMPORTANT] 输出与返回承担不同作用
> **输出是执行期间的效果，返回值是调用表达式正常完成后的结果对象。**函数没有显式返回其他对象时，正常完成仍返回 `None`。

## 多项结果仍是一个对象

`return width, height` 中的逗号[形成元组](../04-sequences-mappings-and-sets/05-tuples-and-immutable-sequences.md#元组的写法与逗号)，调用返回这个元组；调用处可以使用[序列解包](../04-sequences-mappings-and-sets/06-sequence-unpacking.md#逐项绑定与数量匹配)取得两项。

```python
def dimensions():
    return 320, 240


width, height = dimensions()
print(width, height)
```

输出为：

```text
320 240
```

元组保存的是[元素对象的引用](../04-sequences-mappings-and-sets/05-tuples-and-immutable-sequences.md#修改元素对象与替换引用)，不会自动复制这些元素。调用若因异常退出，就没有这次正常返回的结果；调用处的后续赋值也不会完成。

## 参考资料

- [Python 3.14 语言参考：函数定义](https://docs.python.org/3.14/reference/compound_stmts.html#function-definitions)
- [Python 3.14 语言参考：return](https://docs.python.org/3.14/reference/simple_stmts.html#the-return-statement)
