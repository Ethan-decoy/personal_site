---
title: 算术运算与表达式求值（Arithmetic Operations and Expression Evaluation）
date: 2026-11-07
order: 2
---

# 算术运算与表达式求值（Arithmetic Operations and Expression Evaluation）

`7 / 2`、`7 // 2` 与 `7 % 2` 使用相同的两个整数，却分别取得商、向下取整的商与余数。一个算式得到什么，还取决于操作数的类型，以及各部分如何组合。

这里讨论内置 `int` 与普通有限 `float` 的算术；幂运算先限于整数底数与整数指数。各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对，预期失败的脚本也单独运行。

## 算术写法与结果类型

算术运算符（arithmetic operator）表示要进行的计算，参与计算的值称为操作数（operand）。`7 + 2` 中，`+` 是加法运算符，左右两个操作数分别是 `7` 与 `2`；减法写作 `7 - 2`，乘法写作 `7 * 2`。

这些运算符各有两个操作数，称为二元运算符（binary operator）。`-` 也可以只作用于右侧的一个数值，取得它的相反数，例如 `-7`；这种写法称为一元运算（unary operation）。一元 `+` 保持数值不变，原数值为负时也仍然为负。

因此，**`-7` 在语法上是对整数字面量 `7` 施加一元负号，得到负整数；负号并非这个数字面量的一部分。**相同的运算也能作用于读取名称所得的数值：

```python
value = 7

print(value - 2)
print(value * 2)
print(-value)
print(+value)
print(value)
```

输出为：

```text
5
14
-7
7
7
```

各次运算都根据操作数取得结果。`-value` 取得 `-7`，没有修改原整数对象，也没有重新绑定 `value`，所以最后一行仍输出 `7`。这里沿用[不可变数值与名称绑定的区别](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#不可变对象与重新绑定)。

对内置整数，**加、减、乘正常完成时都得到精确的 `int` 结果**，能处理的规模仍受实际计算资源限制。任一操作数为 `float` 时，这三种运算按浮点规则计算，正常完成时得到 `float`，遵循浮点的精度与范围限制。例如 `7 - 0.5` 得到 `6.5`，`7 * 0.5` 得到 `3.5`；它们与[混合加法](01-integers-and-floating-point-numbers.md#浮点写法与混合计算)采用相同的结果类型规则。

## 除法、向下取整与取余

`/` 表示除法，`//` 表示向下取整除法（floor division），`%` 在数值之间表示取余（modulo）。三者都要求除数非零；执行到除数为零的运算时，会引发 `ZeroDivisionError`。

对这两个整数，三种运算的结果分别为：

| 表达式 | 结果 | 结果类型 | 含义 |
| --- | --- | --- | --- |
| `7 / 2` | `3.5` | `float` | 相除所得的商 |
| `7 // 2` | `3` | `int` | 商向下取整 |
| `7 % 2` | `1` | `int` | 与向下取整的商配套的余数 |

整数之间使用 `/`，正常完成时也得到浮点结果。即使数学上的商恰好是整数，结果类型仍然是 `float`。

`//` 的名称说明它怎样取商，结果类型还要看操作数。两个操作数都是整数时，结果为 `int`；有浮点操作数时，正常完成的结果为 `float`：

```python
print(8 / 2)
print(7.0 // 2)
print(type(7.0 // 2))
print(7.0 % 2)
```

输出为：

```text
4.0
3.0
<class 'float'>
1.0
```

`7.0 // 2` 的结果数值为三，类型为 `float`。[数值为整数与对象类型为 `int` 是两个判断](01-integers-and-floating-point-numbers.md#浮点写法与混合计算)，不能仅凭商没有小数部分就认定结果类型。

> [!IMPORTANT] 除法与结果类型
> **对内置 `int` 与 `float`，除数非零且计算正常完成时，`/` 的结果为 `float`；`//` 与 `%` 在两个操作数都是 `int` 时得到 `int`，有 `float` 参与时得到 `float`。**浮点结果仍受表示精度与范围限制。三种运算的除数为零时，均引发 `ZeroDivisionError`。

向下取整，是取**不大于数学上的商的最大整数**。七除以二的商为三点五，向下取整为三；负七除以二的商为负三点五，向下取整则为负四。它朝数轴较小的一侧取整数，因而不能一概理解成删掉小数部分。

对整数，商与余数满足“被除数＝商×除数＋余数”。负七除以二采用商负四时，商乘除数为负八，还需要加一才能还原负七：

```python
value = -7
divisor = 2
quotient = value // divisor
remainder = value % divisor

print(quotient)
print(remainder)
print(quotient * divisor + remainder)
```

`quotient` 引用商，`remainder` 引用余数。最后一行先将商与除数相乘，再加余数，输出为：

```text
-4
1
-7
```

余数的符号随除数确定。把除数改为负二，`7 // -2` 得到 `-4`，`7 % -2` 得到 `-1`，因为负四乘负二再加负一，恰好还原七。负的被除数也不必产生负余数，符号需要按这组商余规则判断。

> [!IMPORTANT] 整数商余关系
> **对整数 `a` 与非零整数 `b`，`a // b` 是数学商向下取整所得的整数，且 `a == (a // b) * b + (a % b)`。**余数为零，或与除数 `b` 同号；余数的绝对值小于除数的绝对值。商与余数配套确定，负数情形也遵循这组关系。

这组精确关系限于整数。浮点 `//` 与 `%` 的计算还受[表示近似与舍入](01-integers-and-floating-point-numbers.md#有限表示与舍入)影响，不能直接把整数的精确等式和余数大小边界推广到所有浮点输入；相关舍入边界可查阅[语言参考的取余说明及脚注](https://docs.python.org/3.14/reference/expressions.html#binary-arithmetic-operations)。

除数为零的失败发生在运行阶段。例如：

```python
print("start")
result = 7 // 0
print("end")
```

程序先输出：

```text
start
```

第二行执行 `7 // 0` 时失败。在本篇核对环境中，错误诊断的最后一行为：

```text
ZeroDivisionError: division by zero
```

右侧没有求值得到结果，所以没有建立 `result` 的绑定；这份脚本随之终止，`end` 不会输出。已经完成的 `start` 输出仍然存在，符合[运行异常不会撤销先前操作](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#运行异常发生在操作执行时)的规则。

## 括号、优先级与结合方向

一个表达式可以包含多个运算。运算符优先级（operator precedence）决定没有显式括号时，各部分怎样组合：`*`、`/`、`//`、`%` 处于同一级，高于二元 `+`、`-`。因此，`2 + 3 * 4` 的加法连接的是 `2` 与整个 `3 * 4`。

圆括号可以明确分组，例如 `(2 + 3) * 4` 将加法的结果作为乘法的左操作数。`print((2 + 3) * 4)` 中，外层括号属于函数调用，内层括号用于表达式分组。

同级运算连续出现时，还要确定结合方向（associativity）。这里的加、减、乘、除、向下取整除法和取余均按左结合分组，`8 - 3 - 2` 相当于 `(8 - 3) - 2`：

```python
print(2 + 3 * 4)
print((2 + 3) * 4)
print(8 - 3 - 2)
print(8 - (3 - 2))
```

输出为：

```text
14
20
3
7
```

第一行将乘法结果十二与二相加；第二行将加法结果五与四相乘。后两行则表明，改变同级减法的分组也会改变结果。

幂运算（exponentiation）写作 `底数 ** 指数`，例如 `2 ** 3` 表示二的三次方，得到整数八。对整数底数和整数指数，指数非负时，正常完成的结果为 `int`；指数为负且底数非零时，正常完成的结果为 `float`，例如 `2 ** -2` 表示二的平方的倒数，得到 `0.25`。Python 规定 `0 ** 0` 为整数 `1`。

**连续的幂运算按右结合分组**，`2 ** 3 ** 2` 相当于 `2 ** (3 ** 2)`，指数为九；若要先取得二的三次方，再将结果平方，需要写成 `(2 ** 3) ** 2`。

幂与一元正负号的组合还需要区分左右位置：`-2 ** 2` 按 `-(2 ** 2)` 分组，而 `2 ** -2` 的指数可以包含一元负号，按 `2 ** (-2)` 分组。把负数作为整个底数时，需要写成 `(-2) ** 2`。

```python
print(2 ** 3 ** 2)
print((2 ** 3) ** 2)
print(-2 ** 2)
print((-2) ** 2)
print(2 ** -2)
print(0 ** 0)
```

输出为：

```text
512
64
-4
4
0.25
1
```

一元 `+`、`-` 与乘除相连时，先与其右侧的数值表达式结合；例如 `-2 * 3` 按 `(-2) * 3` 分组。幂运算则遵循上面的左右位置规则，不能用一句“负号总比幂先算”判断所有写法。

零不能取负整数次幂，因为相应的倒数需要除以零。下面这份独立脚本在执行幂运算时失败：

```python
0 ** -1
```

脚本没有程序输出，错误诊断的最后一行为：

```text
ZeroDivisionError: zero to a negative power
```

该表达式的写法合法；失败来自运行时的底数与指数取值，表达式没有取得结果，脚本终止。

## 分组与求值先后

优先级与结合方向确定表达式的结构。结构确定后，每个二元算术运算仍然**先求左操作数的值，再求右操作数的值，最后根据两者进行计算**。这里的操作数本身也可以是一个需要继续求值的表达式。

对 `2 + 3 * 4`，外层是加法：先取得左侧的 `2`，再求右侧 `3 * 4` 的值，最后完成加法。乘法必须在加法完成之前完成，但不会因此抢在左侧 `2` 的求值之前。

这个区别会影响先遇到哪一个错误。在下面这份独立脚本中，`missing` 没有绑定：

```python
missing + 1 / 0
```

除法的优先级高于加法，所以右操作数是整个 `1 / 0`。然而，外层加法先读取左侧名称 `missing`；[读取未绑定的名称](../02-names-objects-and-assignment/01-names-and-assignment.md#读取尚未绑定的名称)立即失败，右侧除法尚未执行。脚本没有程序输出，诊断最后一行为：

```text
NameError: name 'missing' is not defined
```

交换外层加法左右两个操作数，形成另一份独立脚本，`missing` 仍未绑定：

```python
1 / 0 + missing
```

此时先求左侧 `1 / 0` 的值，除法立即失败，尚未读取右侧名称 `missing`。脚本没有程序输出，诊断最后一行为：

```text
ZeroDivisionError: division by zero
```

两份脚本都在第一个异常发生处终止，外层加法均未完成。它们分别暴露名称读取失败与除法失败，原因是外层操作数的位置发生了变化。

> [!IMPORTANT] 表达式分组与求值先后
> **括号、优先级与结合方向确定算术表达式怎样分组；每个二元算术运算先对左操作数求值，再对右操作数求值，最后完成该运算。**操作数求值或运算本身引发异常时，当前表达式随之失败，尚未进行的后续求值不会继续。右结合描述分组方向，不表示操作数从右向左求值。

完整优先级表可在遇到新的运算组合时查阅[语言参考](https://docs.python.org/3.14/reference/expressions.html#operator-precedence)。表达式较复杂时，括号与有含义的中间名称可以直接写明需要的分组。

## 参考资料

- [Python 3.14 内置类型：数值运算、结果类型与向下取整](https://docs.python.org/3.14/library/stdtypes.html#numeric-types-int-float-complex)
- [Python 3.14 语言参考：一元算术运算](https://docs.python.org/3.14/reference/expressions.html#unary-arithmetic-and-bitwise-operations)
- [Python 3.14 语言参考：二元算术运算与商余关系](https://docs.python.org/3.14/reference/expressions.html#binary-arithmetic-operations)
- [Python 3.14 语言参考：幂运算](https://docs.python.org/3.14/reference/expressions.html#the-power-operator)
- [Python 3.14 语言参考：求值顺序与运算符优先级](https://docs.python.org/3.14/reference/expressions.html#evaluation-order)
