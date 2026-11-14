---
title: 比较运算与布尔值（Comparisons and Boolean Values）
date: 2026-11-09
order: 3
---

# 比较运算与布尔值（Comparisons and Boolean Values）

表达式 `3 < 5` 的结果是 `True`，`5 < 5` 的结果是 `False`。比较把数值之间的关系表示为布尔结果，这个结果也能通过名称保存和传递。

本节的数值规则适用于内置 `int` 与普通有限 `float`。各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对，预期失败的脚本也单独运行。

## 数值关系与布尔结果

比较运算符（comparison operator）写在两个表达式之间，判断它们所得的值是否满足相应关系。数值之间常用的六种写法如下：

| 运算符 | 判断的关系 | 示例 | 结果 |
| --- | --- | --- | --- |
| `<` | 左侧小于右侧 | `3 < 5` | `True` |
| `<=` | 左侧小于或等于右侧 | `3 <= 3` | `True` |
| `>` | 左侧大于右侧 | `3 > 5` | `False` |
| `>=` | 左侧大于或等于右侧 | `3 >= 3` | `True` |
| `==` | 两侧相等 | `3 == 5` | `False` |
| `!=` | 两侧不相等 | `3 != 5` | `True` |

`<` 与 `>` 要求严格的小于或大于；`<=` 与 `>=` 则包含相等的边界。因此，`5 < 5` 为 `False`，`5 <= 5` 为 `True`。这四种比较也称为次序比较（order comparison）。

`==` 使用两个等号，进行相等比较；它与[建立名称绑定的赋值符号 `=`](../02-names-objects-and-assignment/01-names-and-assignment.md#赋值建立名称与对象的绑定)作用不同。这里判断的是数值是否相等，[是否为同一对象](../02-names-objects-and-assignment/03-object-identity-and-equality.md#相等与身份分别判断)则由身份比较判断。

布尔值（Boolean value）`True` 表示真，`False` 表示假，属于内置类型 `bool`，源码写法不加引号。数值比较可以取得这样的对象：

```python
value = 3
limit = 5

print(value < limit)
print(type(value < limit))
```

`value` 表示参与比较的数值，`limit` 表示上限。每次比较都先读取两侧名称，取得整数三与五，再判断三是否小于五。输出为：

```text
True
<class 'bool'>
```

第二次比较的结果先交给 [`type`](../02-names-objects-and-assignment/02-object-types.md#值类型与显示结果)，再将取得的类型对象交给 `print`，因此显示为 `<class 'bool'>`。

比较运算的优先级低于[已经建立的算术运算](02-arithmetic-and-expression-evaluation.md#括号优先级与结合方向)。在 `value` 为三、`limit` 为五时，`value + 1 < limit` 按 `(value + 1) < limit` 分组：先求出左侧的四，再取得右侧的五，最后比较，结果为 `True`。

> [!IMPORTANT] 数值比较与布尔结果
> **内置整数与普通有限浮点数之间，`<`、`<=`、`>`、`>=`、`==`、`!=` 按实际数值判断关系，正常完成时得到 `bool` 对象 `True` 或 `False`。**比较不会修改这些数值对象，也不会重新绑定参与比较的名称。

## 保存结果与再次比较

比较表达式可以位于赋值语句的右侧。[赋值先求右侧的值，再建立左侧名称的绑定](../02-names-objects-and-assignment/01-names-and-assignment.md#右侧求值与绑定的先后)，因此可以用名称保存本次比较的结果：

```python
value = 3
limit = 5
below_limit = value < limit

value = 8
print(below_limit)
print(value < limit)
```

执行 `below_limit = value < limit` 时，`value` 引用整数三，`limit` 引用整数五，比较得到 `True`，随后让 `below_limit` 绑定这个布尔对象。

`value = 8` 将 `value` 重新绑定到整数八。`below_limit` 仍引用先前的 `True`；再次求值 `value < limit` 时，则根据八与五得到 `False`。完整输出为：

```text
True
False
```

**名称保存的是已经求值得到的对象；重新执行比较，才会根据当前取得的数值产生本次判断。**`below_limit` 所表示的是此前那次比较的结果，后续对其他名称的重新绑定不会让它自动重新计算。

## 相等、次序与类型条件

内置 `int` 与 `float` 之间支持数值比较，类型不同也可能数值相等。整数 `3` 与浮点数 `3.0` 都表示数学上的三，因此比较相等；整数与数字字符串进行相等比较时，数字字符的相同则不会使它们相等：

```python
print(3 == 3.0)
print(3 == "3")
print(3 != "3")
print(3 < 3.5)
```

输出为：

```text
True
False
True
True
```

字符串 `"3"` 保留文本类型，比较不会自动把它解析成整数。内置整数与浮点数则按各自实际表示的数值比较，数值相等不要求类型相同；**参与比较的整数按其精确值判断，不会先舍入为近似浮点数。**

浮点比较还会受到先前数值表示与计算的影响。在这里的二进制浮点环境中，`0.1 + 0.2` 得到的数值略大于字面量 `0.3` 对应的浮点值，因此 `0.1 + 0.2 > 0.3` 为 `True`。比较依据实际取得的数值，不会消除[已经发生的舍入](01-integers-and-floating-point-numbers.md#有限表示与舍入)，也不会自动改为允许某种误差的“足够接近”。

同一组对象能完成相等比较，不意味着它们也支持次序比较。内置整数与字符串之间不支持这里的大小关系，下面这份独立脚本会在运行时失败：

```python
print("start")
result = 3 < "3"
print(result)
```

第一行已经完成输出：

```text
start
```

随后执行 `3 < "3"`，两个操作数分别为整数与字符串，这一组合不支持 `<`，因而引发 `TypeError`。错误诊断的最后一行为：

```text
TypeError: '<' not supported between instances of 'int' and 'str'
```

右侧比较没有取得结果，所以没有建立 `result` 的绑定。异常未被处理，脚本终止，最后的 `print(result)` 不会执行；先前写出的 `start` 仍然存在。

得到 `False` 表示相应关系在这次比较中不成立；引发异常则表示本次比较无法正常完成。对象的类型决定相应比较是否受支持，实际数值再决定受支持的关系是否成立。

## 链式比较与停止求值

链式比较（chained comparison）把相邻的比较写在同一个表达式中。`0 <= value < limit` 同时要求零不大于 `value`，并且 `value` 小于 `limit`，因此包含下界零，不包含上界 `limit`。

```python
value = 3
limit = 5
print(0 <= value < limit)

value = limit
print(0 <= value < limit)
```

第一次比较中，零不大于三，三也小于五，两项关系都成立。重新绑定后，`value` 为五，第二项要求的严格小于关系不成立。输出为：

```text
True
False
```

这条链先求零与 `value` 的值，判断 `0 <= value`。这项比较为真时，才继续求 `limit` 的值，判断 `value < limit`。第二次比较使用的是中间数值 `value`，第一次比较所得的布尔结果决定是否继续。

**需要求值的中间表达式只求值一次，所得对象供相邻两次比较使用。**中间位置也可以写成算术表达式，例如 `0 <= value + 1 < limit` 会复用本次 `value + 1` 的求值结果。

一项比较已经为假时，整条链的结果就已经确定为 `False`，后续操作数不再求值。这种根据已有结果跳过后续求值的行为，称为短路求值（short-circuit evaluation）。

> [!IMPORTANT] 链式比较与短路求值
> **对本节的内置数值，链式比较从左到右逐项判断相邻数值的关系；每个操作数表达式至多求值一次，已取得的中间数值供相邻两次比较使用。**某项比较为假时，整条链得到 `False`，尚未开始的后续求值被跳过；各项均为真时得到 `True`。需要执行的求值若引发异常，当前表达式仍会失败。

在下面这份独立脚本中，`missing` 没有建立绑定：

```python
print(3 < 2 < missing)
```

`3 < 2` 已经得到 `False`，因此跳过右侧名称 `missing` 的读取，将链的结果交给 `print`。输出为：

```text
False
```

把第一个数值改为一，形成另一份独立脚本，`missing` 仍未绑定：

```python
print(1 < 2 < missing)
```

这次 `1 < 2` 为 `True`，需要继续读取 `missing`，才能判断中间数值二与右侧对象的关系。读取未绑定的名称时[引发 `NameError`](../02-names-objects-and-assignment/01-names-and-assignment.md#读取尚未绑定的名称)，链式比较无法完成，外层 `print` 尚未执行，因此没有程序输出。错误诊断的最后一行为：

```text
NameError: name 'missing' is not defined
```

两份源码都符合语法；差别在于前一项比较的结果是否要求继续求值。短路会跳过尚不需要的部分，需要执行的名称读取与运算仍须满足各自的条件。

## 参考资料

- [Python 3.14 语言参考：比较表达式与链式比较](https://docs.python.org/3.14/reference/expressions.html#comparisons)
- [Python 3.14 语言参考：值比较及类型条件](https://docs.python.org/3.14/reference/expressions.html#value-comparisons)
- [Python 3.14 内置类型：数值之间的比较](https://docs.python.org/3.14/library/stdtypes.html#numeric-types-int-float-complex)
