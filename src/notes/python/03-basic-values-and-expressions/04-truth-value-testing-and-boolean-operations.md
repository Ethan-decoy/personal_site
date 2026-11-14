---
title: 真值测试与布尔运算（Truth Value Testing and Boolean Operations）
date: 2026-11-09
order: 4
---

# 真值测试与布尔运算（Truth Value Testing and Boolean Operations）

布尔值 `False` 为假，字符串 `"False"` 却可以被判断为真：它包含五个字符，是一个非空字符串。布尔运算依据对象的真值取得结果，结果也可能仍是字符串、数值或列表对象。

本节用已出现的 `bool`、`int`、普通有限 `float`、`str`、`list` 与 `None` 说明真值规则。各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对，预期失败的脚本也单独运行。

## 对象的真值与布尔值

对象在真假判断中被解释为真或假，称为对象的真值（truth value）。根据对象取得这一判断的过程，称为真值测试（truth value testing）。[比较表达式取得的 `True` 与 `False`](03-comparisons-and-boolean-values.md#数值关系与布尔结果) 可以直接表达真假，其他已学对象也有各自的真值规则：

| 对象类型或取值 | 为假的情况 | 为真的情况 |
| --- | --- | --- |
| `bool` | `False` | `True` |
| `None` | `None` | 无 |
| `int`、`float` | 数值零，如 `0`、`0.0` | 非零数值，包括负数 |
| `str` | 空字符串 `""` | 非空字符串，包括 `"False"`、`"0"` |
| `list` | 空列表 `[]` | 非空列表，包括 `[0]`、`[False]` |

单参数形式 `bool(value)` 对传入对象进行真值测试，取得 `bool` 对象 `True` 或 `False`；它不修改这里的原对象，也不重新绑定原名称。

```python
print(bool("False"))
print(bool([]))
print(bool([0]))
```

输出为：

```text
True
False
True
```

`bool("False")` 按字符串是否为空判断，不把这五个字符解析成布尔常量。列表 `[0]` 含有一个元素，因此为真；这里判断的是外层列表是否为空，不要求逐一测试元素的真值。即使元素本身为假，非空列表仍然为真。

> [!IMPORTANT] 已学对象的真值规则
> **在本节这些内置对象中，`False`、`None`、数值零、空字符串与空列表为假，其余值为真。**`bool(value)` 取得对应的布尔值；原对象、它的类型与原名称绑定不会因此改变。

## 布尔运算与结果对象

布尔运算（Boolean operation）依据操作数的真值取得结果。`not` 进行取反：`not x` 在 `x` 为假时取得 `True`，为真时取得 `False`，结果总是 `bool`：

```python
print(not 0)
print(not "False")
print(type(not "False"))
```

输出为：

```text
True
False
<class 'bool'>
```

数值零为假，取反得到 `True`；非空字符串 `"False"` 为真，取反得到 `False`。

`and` 与 `or` 连接两个表达式。两侧已经是布尔值时，`and` 仅在两侧都为真时取得 `True`，`or` 在至少一侧为真时取得 `True`。它们也接受本节其他对象，此时按左侧的真值决定取得哪一个对象。

表中的 `x` 与 `y` 代表操作数表达式。两种运算都先对 `x` 求值，再测试所得对象的真值：

| 表达式 | 左侧对象的真值 | 后续求值与结果 |
| --- | --- | --- |
| `x and y` | 假 | 直接取得左侧对象，不对 `y` 求值 |
| `x and y` | 真 | 对 `y` 求值，取得右侧结果对象 |
| `x or y` | 真 | 直接取得左侧对象，不对 `y` 求值 |
| `x or y` | 假 | 对 `y` 求值，取得右侧结果对象 |

右侧需要求值时，所得对象直接成为结果，不再被这次 `and` 或 `or` 转成布尔值。右侧被跳过，则不会发生其中的名称读取、调用或计算；这沿用了[短路求值](03-comparisons-and-boolean-values.md#链式比较与停止求值)的规则。

> [!IMPORTANT] 布尔运算的结果与短路
> **`not` 取得真值取反后的布尔值；`and` 在左侧为假时取得左侧对象，否则求值并取得右侧对象；`or` 在左侧为真时取得左侧对象，否则求值并取得右侧对象。**被跳过的右侧不求值。`and` 与 `or` 取得的是所选操作数的结果对象，不要求它是 `bool`，也不复制该对象。

```python
print(0 and 5)
print(3 and 5)
print(0 or 5)
print(3 or 5)
```

输出为：

```text
0
5
5
3
```

`0 and 5` 在左侧为假时取得整数零；`3 and 5` 则继续求右侧的值，取得整数五。`0 or 5` 继续求右侧的值，`3 or 5` 直接取得左侧的整数三。四个结果都是已有操作数求值所得的整数。

所选对象也可以是列表：

```python
source = [0]
result = source or []

print(result)
print(result is source)
```

`source` 引用非空列表，真值为真，`or` 直接取得这个列表对象，再让 `result` 绑定到它。输出为：

```text
[0]
True
```

`is` 核对的是[是否为同一个对象](../02-names-objects-and-assignment/03-object-identity-and-equality.md#相等与身份分别判断)。这里两个名称引用同一列表，未发生复制；右侧 `[]` 没有求值，也就没有按该写法创建新的空列表。

按真值选择结果，会影响默认值的含义。若某个数量约定用 `None` 表示尚未提供，而零仍是有效数量，直接使用 `count or 10` 就会在零值时选取默认数十：

```python
count = 0
result = count or 10

print(result)
print(count)
print(count is None)
```

输出为：

```text
10
0
False
```

`count` 仍然引用整数零，原输入没有被修改；但 `result` 取得的是十，未保留这个有效数量。`count is None` 得到 `False`，也说明本例中的零并非 `None`。

> [!WARNING] 用 or 取默认值也会替换零和空值
> **把 `value or default` 理解成“只在 `value` 为 `None` 时取默认值”，会在合法假值上得到不符合预期的结果。**左侧的零、`False`、空字符串与空列表也会让表达式选取右侧。原输入保持原状，选择结果却可能把有效的零或空值换成默认值。

是否为 `None` 可以用[身份判断 `value is None`](../02-names-objects-and-assignment/03-object-identity-and-equality.md#判断是否为-none)确定。它与真值测试回答不同的问题；当所有假值都应选用默认值时，按真值选择才符合这样的取值约定。

## 短路求值与失败位置

右侧是否执行，取决于左侧已经取得的对象及其真值。在下面这份独立脚本中，`missing` 没有建立绑定：

```python
print(False and missing)
print(True or missing)
```

第一行在 `and` 左侧取得 `False`，第二行在 `or` 左侧取得 `True`，两次都跳过右侧的名称读取。输出为：

```text
False
True
```

`and` 的左侧改为 `True` 后，需要继续取得右侧对象。下面这份独立脚本中的 `missing` 仍未绑定：

```python
print("start")
print(True and missing)
print("end")
```

程序先输出：

```text
start
```

随后读取 `missing` 时引发 `NameError`。错误诊断的最后一行为：

```text
NameError: name 'missing' is not defined
```

第二行的布尔表达式没有取得结果，该次外层 `print` 尚未执行，脚本随未处理的异常终止，`end` 不会输出。已经完成的 `start` 输出仍然存在。

同样，在 `missing` 未绑定的独立运行中，`print(False or missing)` 也会引发 `NameError`，且没有程序输出：`or` 的左侧为假，需要继续读取右侧，表达式因名称读取失败而终止。短路只会跳过不需要执行的部分，不会处理已经发生的异常。

左侧的比较也可以决定是否进行右侧计算。对下面的整数除数，`divisor != 0` 决定是否继续执行除法：

```python
divisor = 0
print(divisor != 0 and 10 / divisor > 2)

divisor = 2
print(divisor != 0 and 10 / divisor > 2)
```

输出为：

```text
False
True
```

除数为零时，左侧比较得到 `False`，右侧除法未执行。重新绑定为二后，左侧比较得到 `True`，继续计算十除以二，再判断所得的五是否大于二，取得 `True`。

交换两侧表达式，会改变先执行的操作：

```python
divisor = 0
print(10 / divisor > 2 and divisor != 0)
```

这份独立脚本先求左侧比较的值，其中的除法已经因零除失败，尚未取得可用于真值测试的左侧结果。程序没有输出，错误诊断的最后一行为：

```text
ZeroDivisionError: division by zero
```

后面的 `divisor != 0` 没有执行，外层 `print` 也未执行，脚本终止。前面两个写法的差别来自操作位置：只有在失败操作尚未执行、且已有结果允许跳过它时，短路才会使它不发生。

## 优先级与表达式组合

在这里的运算中，比较的优先级高于 `not`，`not` 高于 `and`，`and` 高于 `or`。因此，`not value < limit` 按 `not (value < limit)` 分组；`True or False and False` 按 `True or (False and False)` 分组。

```python
value = 3
limit = 5

print(not value < limit)
print(not (value < limit))
print(True or False and False)
print((True or False) and False)
```

输出为：

```text
False
False
True
False
```

前两行都先比较三与五，再对 `True` 取反。第三行的外层是 `or`，左侧已经为真，右侧整个 `False and False` 被跳过，取得 `True`。第四行的外层则是 `and`，左侧括号表达式取得 `True`，因此继续取得右侧的 `False`。

优先级确定表达式怎样分组，短路规则再决定哪些部分需要求值。右侧的高优先级运算，也可能整体被跳过。在 `missing` 未绑定的独立脚本中：

```python
print(True or missing and False)
```

表达式按 `True or (missing and False)` 分组，`or` 的左侧为真，因此不需要读取 `missing`，输出为：

```text
True
```

括号可以直接写明需要的分组；它与[操作数的求值先后](02-arithmetic-and-expression-evaluation.md#分组与求值先后)共同决定表达式的实际行为。

## 参考资料

- [Python 3.14 内置调用：bool](https://docs.python.org/3.14/library/functions.html#bool)
- [Python 3.14 内置类型：真值测试](https://docs.python.org/3.14/library/stdtypes.html#truth-value-testing)
- [Python 3.14 语言参考：布尔运算](https://docs.python.org/3.14/reference/expressions.html#boolean-operations)
- [Python 3.14 语言参考：运算符优先级](https://docs.python.org/3.14/reference/expressions.html#operator-precedence)
