---
title: 数值转换与文本解析（Numeric Conversion and Text Parsing）
date: 2026-11-10
order: 7
---

# 数值转换与文本解析（Numeric Conversion and Text Parsing）

字符串 `"0.3"` 可以原样输出，却[不能直接采用浮点数的数值格式](06-formatted-strings-and-numeric-display.md#格式说明与数值显示)。让数字文本参与数值计算，需要按目标类型的规则解析；已有数值改用另一种类型表示时，还可能发生截断、舍入或范围限制。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。主要输入为内置 `str`、`int` 与普通有限 `float`，`None` 用于说明不支持的输入类型。

## 转换调用与结果绑定

内置类型名称 `int`、`float` 可以用于调用，分别取得整数和浮点数结果。这里采用单参数形式 `int(value)`、`float(value)`：传入已有对象，按相应规则取得目标类型的数值。

对于文本 `"0.3"`，`float` 按浮点文本规则解析，正常返回浮点对象：

```python
text = "0.3"
number = float(text)

print(f"{number:.2f}")
print(type(text))
print(type(number))
```

输出为：

```text
0.30
<class 'str'>
<class 'float'>
```

第二行先读取 `text`，把取得的字符串传给 `float`，再将返回的浮点对象绑定到 `number`。此后 `number` 可以采用数值格式说明；`text` 仍引用原字符串 `"0.3"`，没有因这次调用而改变类型或内容。

能采用数值格式，不意味着得到精确的十进制数。这里解析得到的浮点值同样受[有限表示与舍入](01-integers-and-floating-point-numbers.md#有限表示与舍入)约束；显示为 `0.30` 是本次格式化产生的文本。

对于 `"3"` 这样的十进制整数文本，`int` 返回整数。若把结果赋给原来的名称，发生的是[名称重新绑定](../02-names-objects-and-assignment/01-names-and-assignment.md#重新绑定与多个名称)：

```python
value = "3"
previous = value
value = int(value)

print(value + 1)
print(previous + "1")
print(type(value))
print(type(previous))
```

输出为：

```text
4
31
<class 'int'>
<class 'str'>
```

第二行让两个名称引用同一字符串。第三行先把这个字符串交给 `int`，取得整数三，再将 `value` 绑定到结果；`previous` 仍引用原字符串。整数加法得到四，字符串拼接得到 `"31"`，两种操作继续按实际对象的类型进行。

**转换调用取得数值结果，赋值决定哪个名称引用它。**在这些内置数值与字符串之间进行转换，不会原地把源对象改成另一种类型；`value = int(value)` 也不意味着其他引用原字符串的名称一同改变。

## 文本解析的格式条件

文本解析（text parsing）按目标接口接受的写法识别文本内容，并据此取得数值。字符串中恰好有数字字符，不足以保证它符合任意数值接口的要求。

单参数 `int(text)` 默认按十进制整数文本解析；`float(text)` 则接受相应的浮点文本形式，包括带小数点或十进制指数的写法：

| 调用 | 结果 |
| --- | --- |
| `int("3")` | 整数 `3` |
| `int("3.0")` | 引发 `ValueError` |
| `float("3.0")` | 浮点数 `3.0` |
| `float("1e3")` | 浮点数 `1000.0` |

`"3.0"` 表达的数学数值虽然是整数三，包含小数点的文本仍不符合这里的整数解析规则。`float("1e3")` 则按指数写法取得一千，规则与[浮点字面量中的十进制指数](01-integers-and-floating-point-numbers.md#浮点写法与混合计算)相应。

这些接口允许文本带有首尾空白和紧贴数值的正负号。例如，`int("  -12  ")` 取得 `-12`，`float(" +3.5 ")` 取得 `3.5`。整数文本也允许数字之间的单个下划线，`int("1_000")` 取得 `1000`；这些空白、符号和分组写法仍须符合接口的解析规则。

> [!IMPORTANT] 文本解析由目标规则决定
> **对于这里的字符串输入，`int(text)` 默认按十进制整数文本解析，`float(text)` 按其接受的浮点文本规则解析；正常完成时返回目标类型的数值。**文本看起来像数字，或所表达的数学数值恰好是整数，并不保证它符合目标接口的文本写法。解析不会原地改变源字符串。

下面是一份故意失败的完整脚本：

```python
value = "3.0"
print("start")
value = int(value)
print("end")
```

源码合法，前两行完成绑定和 `start` 的输出。第三行读取 `value` 也能成功，但 `int` 无法按十进制整数文本规则解析 `"3.0"`，因而引发 `ValueError`。程序已经写出的内容为：

```text
start
```

错误诊断的最后一行为：

```text
ValueError: invalid literal for int() with base 10: '3.0'
```

调用没有正常返回，赋值右侧未取得结果，因此[这次目标绑定没有发生](../02-names-objects-and-assignment/01-names-and-assignment.md#右侧求值与绑定的先后)。在异常发生后、脚本终止时，`value` 仍绑定原字符串；它没有先被改成其他值再恢复。异常未被处理，`end` 不会输出，先前的 `start` 输出仍然存在。

输入对象的类型也必须受到支持。`None` 不是 `int` 能按这里的接口转换的输入：

```python
print("start")
print(int(None))
print("end")
```

程序先输出：

```text
start
```

第二行的 `int(None)` 引发 `TypeError`，错误诊断的最后一行为：

```text
TypeError: int() argument must be a string, a bytes-like object or a real number, not 'NoneType'
```

末尾的 `NoneType` 是 `None` 的类型名称。这次失败来自输入对象的类型不受支持；上一份脚本中的字符串类型可以作为输入，失败的是具体文本格式。两次调用都在运行时失败，不是源码语法错误。

第二行的内层调用未能返回，外层 `print` 尚未执行，脚本随未处理的异常终止，`end` 不会输出；已经完成的 `start` 不会撤销。

## 浮点数转整数与向零截断

输入已经是普通有限浮点数时，`int` 进行数值转换，不再解析文本。它向零截断（truncate toward zero），舍去数值的小数部分并返回整数：

```python
print(int(3.0))
print(int(3.5))
print(int(-3.5))
print(-3.5 // 1)
```

输出为：

```text
3
3
-3
-4.0
```

`3.0` 已经是浮点对象，所表示的数值恰好为整数，转换后得到整数三。`3.5` 舍去小数部分得到三，`-3.5` 则向零靠近，得到负三。

最后一行采用已学的[向下取整除法](02-arithmetic-and-expression-evaluation.md#除法向下取整与取余)：负三点五除以一，再向负无穷方向取整，得到 `-4.0`。它与负三点五向零截断的结果不同；操作数中有浮点数，取整除法的结果类型也仍是 `float`。

> [!IMPORTANT] 有限浮点数转整数
> **`int` 对普通有限 `float` 向零截断，舍去小数部分，返回 `int`。**这不同于取最近整数，也不同于 `//` 的向下取整：负数存在小数部分时，向零截断朝零靠近，向下取整则朝负无穷方向取值。

`int(3.0)` 能成功，而 `int("3.0")` 会失败，区别来自输入对象：前者已经是数值，采用向零截断的转换规则；后者仍是文本，必须符合整数解析的写法。`int` 并不会先把任意数字文本解析成浮点数，再统一截断。

## 整数转浮点数的精度与范围

`float` 接受整数输入，按目标浮点类型的精度与范围取得结果。整数三可以被这里的浮点类型精确表示：

```python
value = 3
result = float(value)

print(result)
print(type(value))
print(type(result))
```

输出为：

```text
3.0
<class 'int'>
<class 'float'>
```

`value` 仍引用整数三，`result` 引用浮点结果，类型不同而数值相等。转换没有改变源整数对象或 `value` 的绑定。

整数可以保存的精度，不代表目标浮点数也能保留。在本篇的二进制浮点环境中，下面的整数无法按原值精确表示：

```python
value = 9_007_199_254_740_993
converted = float(value)
restored = int(converted)

print(converted)
print(restored)
print(restored == value)
print(value)
```

输出为：

```text
9007199254740992.0
9007199254740992
False
9007199254740993
```

第二行转换时，原整数已经被舍入为附近可表示的浮点值。第三行再调用 `int`，处理的是 `converted` 当前实际表示的数值；这个数值已经是整数 `9007199254740992`，截断操作无法恢复此前丢失的差别。

最后一行仍能输出原整数，因为 `value` 的绑定没有改变。需要区分的是转换结果是否保留原值，而不是源对象是否被修改。并非所有大整数转换都会失去精度，是否精确取决于目标浮点类型能否表示该数值。

范围限制还可能使转换无法完成。下面这份独立脚本先计算一个整数，再尝试把它转换为浮点数：

```python
value = 10 ** 400
print("start")
result = float(value)
print("end")
```

这里的幂运算能够得到整数结果，但它超出本次环境的 `float` 可接受范围。程序已经输出：

```text
start
```

第三行转换时引发溢出错误 `OverflowError`，错误诊断的最后一行为：

```text
OverflowError: int too large to convert to float
```

`value` 的整数绑定已经建立，`float` 调用却未能返回，因而没有建立 `result` 的绑定。异常未被处理，脚本终止，`end` 不会输出，先前的 `start` 仍然保留。

> [!IMPORTANT] 整数转浮点数的精度与范围
> **整数转为 `float` 时，结果受目标浮点类型的精度与范围约束：不能精确表示的值需要舍入，超出其可接受范围的整数转换会引发 `OverflowError`。**因此，先转为浮点数、再转回整数，不保证得到原整数；这些转换不会改写源整数对象。

实际精度与范围按运行环境核对，规格入口见 [`sys.float_info`](https://docs.python.org/3.14/library/sys.html#sys.float_info)。不同进制的整数解析、非有限浮点值的转换、超长整数字符串限制与自定义对象的转换协议，按 `int`、`float` 的官方说明查用；有限数值上的转换结论不能直接套用于所有输入。

## 参考资料

- [Python 3.14 内置类型调用：int](https://docs.python.org/3.14/library/functions.html#int)
- [Python 3.14 内置类型调用：float](https://docs.python.org/3.14/library/functions.html#float)
- [Python 3.14 内置类型：数值类型与转换](https://docs.python.org/3.14/library/stdtypes.html#numeric-types-int-float-complex)
- [Python 3.14 标准库：浮点精度与范围信息](https://docs.python.org/3.14/library/sys.html#sys.float_info)
