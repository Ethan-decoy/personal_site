---
title: 格式化字符串与数值显示（Formatted Strings and Numeric Display）
date: 2026-11-09
order: 6
---

# 格式化字符串与数值显示（Formatted Strings and Numeric Display）

普通字符串 `"count={count}"` 包含花括号和名称文字；`f"count={count}"` 则可以读取名称 `count` 当前绑定的对象，把它的值组织进文本。得到的字符串可以保存、传给函数或输出，数值的显示形式也可以单独指定。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。数值格式的例子使用普通有限 `float`。

## 替换字段与字符串结果

格式化字符串字面量（formatted string literal），简称 f 字符串（f-string），在起始引号前紧接前缀 `f`。其中由花括号界定的部分称为替换字段（replacement field），可以包含 Python 表达式；求值后，所得对象按字段的规则转换为显示文本，与其余文本合成一个 `str`。

```python
count = 3

print("count={count}")
message = f"count={count}, next={count + 1}"
print(message)
print(type(message))
```

输出为：

```text
count={count}
count=3, next=4
<class 'str'>
```

第一个字符串没有 `f` 前缀，里面的 `{count}` 只是普通文本。第二个字符串有两个替换字段：`{count}` [读取名称当前绑定的整数三](../02-names-objects-and-assignment/01-names-and-assignment.md#赋值建立名称与对象的绑定)，`{count + 1}` 则先计算三加一，再把所得的四组织进文本。字段外的 `count=`、逗号、空格与 `next=` 保留为文本内容。

`message` 取得的是完整字符串 `"count=3, next=4"`，其中没有参与计算的整数对象。`count` 仍然绑定整数三；生成文本没有把它转换成字符串对象，也没有改变它的绑定。**f 字符串是产生字符串值的表达式，保存结果不要求立即输出；脚本中的独立表达式也不会自动回显。**

在替换字段之外，连续两个左花括号 `{{` 表示一个普通左花括号，`}}` 表示一个普通右花括号：

```python
count = 3
print(f"{{count}} = {count}")
```

输出为：

```text
{count} = 3
```

左侧的 `{{count}}` 产生文字 `{count}`，不会读取名称；右侧的 `{count}` 才是替换字段。`f` 前缀让花括号参与识别字段，普通花括号也就需要相应的字面写法。

替换字段必须包含非空表达式，并有合法的结束边界。下面是一份故意错误的完整脚本：

```python
count = 3
print("start")
message = f"count={count"
print("end")
```

第三行打开了替换字段，却在字符串结束前缺少右花括号。解释器在源码检查阶段报告 `SyntaxError`；这里核对的诊断最后一行为：

```text
SyntaxError: f-string: expecting '}'
```

[整份脚本无法开始执行](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)，`count` 的赋值也尚未执行，`start` 与 `end` 都不会输出。此时失败的是源码结构，尚未进行字段中的名称读取。

## 求值时机与结果保存

f 字符串在表达式所在的位置求值。字段使用的是当时的名称绑定，保存的字符串则保留本次生成的内容：

```python
count = 3
message = f"count={count}"
count = 4

print(message)
print(f"count={count}")
```

输出为：

```text
count=3
count=4
```

第二行求值时，`count` 引用整数三，生成的文本已经包含字符 `3`。第三行重新绑定 `count`，不会再次执行先前的 f 字符串表达式，也不会改写 `message` 引用的字符串。最后一行出现了新的 f 字符串表达式，此时读取 `count`，才把当前的四组织进文本。

> [!IMPORTANT] f 字符串的求值与结果
> **f 字符串在当前位置求值，替换字段从左到右完成表达式求值与格式化，合成 `str` 结果。**名称读取使用当时的绑定；保存的是本次生成的字符串，源名称后来重新绑定不会使它自动更新。字段中的调用与异常仍按普通表达式规则发生。

字段中的函数调用也会实际执行。[`print` 写出文本后返回 `None`](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)，因此把它写在字段中时，先发生输出，再由返回值参与文本生成：

```python
message = f"{print('left')} | {print('right')}"
print(message)
```

输出为：

```text
left
right
None | None
```

第一个字段先执行 `print('left')`，写出 `left`，取得返回值 `None`；第二个字段随后写出 `right`，也取得 `None`。这两个返回值在默认字段中各生成文字 `None`，与中间的 ` | ` 合成字符串。最后一行才输出这个完整结果。

前两行输出来自字段中的调用，最后一行来自对结果字符串的输出。字段中的操作不会因为写在引号之间，就变成不执行的文字。

名称读取同样需要已有绑定。下面这份独立脚本中的 `missing` 从未绑定：

```python
print("start")
message = f"value={missing}"
print("end")
```

源码结构合法，脚本先完成 `start` 的输出。第二行求值到 `missing` 时，引发 `NameError`。程序已经写出的内容为：

```text
start
```

错误诊断的最后一行为：

```text
NameError: name 'missing' is not defined
```

字段没有取得所需对象，整个 f 字符串未能生成结果，赋值也就[尚未建立 `message` 的绑定](../02-names-objects-and-assignment/01-names-and-assignment.md#右侧求值与绑定的先后)。异常未被处理，脚本终止，`end` 不会输出；已经完成的 `start` 输出仍然存在。

## 字符串内容与表示形式

字符串作为普通替换字段的结果时，默认嵌入其文本内容。若内容包含换行，生成的字符串也会包含这个换行。

转换标记（conversion specifier）`!r` 写在字段表达式之后，要求先对所得对象调用 `repr`，再用返回的表示字符串参与格式化。`repr` [用引号与转义表示字符串的值](05-string-literals-and-escape-sequences.md#转义实际内容与显示)，因此两种字段会产生不同的文本：

```python
text = "A\nB"

print(f"value={text}")
print(f"value={text!r}")
```

输出为：

```text
value=A
B
value='A\nB'
```

第一次生成的字符串包含 `text` 的实际内容，因此 `A` 与 `B` 出现在不同行。第二次先取得 `repr(text)`，用带引号的表示形式描述原文本，其中的反斜杠和字母 `n` 是可见字符，所以整段结果位于同一行。

`!r` 不会改写 `text`。它改变的是本次字段采用的文本来源：使用对象的表示形式。外层 `print` 也不会把这段表示里的 `\n` 重新解释为实际换行。

## 格式说明与数值显示

格式说明（format specifier）写在字段表达式后，以冒号 `:` 开始，用来控制所得对象怎样生成显示文本。对于这里的普通有限浮点数，`f"{value:.2f}"` 可以按小数点后两位生成文本：

```python
value = 1.5
message = f"{value:.2f}"

print(message)
print(type(message))
```

输出为：

```text
1.50
<class 'str'>
```

这个写法的各部分作用如下：

| 部分 | 作用 |
| --- | --- |
| 起始引号前的 `f` | 将字面量作为 f 字符串处理 |
| 字段中的 `value` | 读取需要格式化的对象 |
| `:` | 开始格式说明 |
| `.2` | 在这种格式中指定小数点后两位 |
| 格式说明末尾的 `f` | 选择定点显示形式（fixed-point notation） |

开头的 `f` 与字段末尾的 `f` 处在不同位置，承担不同作用。这里的二指小数点后两位，并非总共两个有效数字；小数位不足时补零，需要缩短时按实际浮点值进行显示舍入。

[浮点数保存的数值与其输出形式不同](01-integers-and-floating-point-numbers.md#有限表示与舍入)。缩短显示可以让文本保留所需的小数位，不会补回此前计算的精度：

```python
value = 0.1 + 0.2
message = f"{value:.2f}"

print(message)
print(value)
print(value == 0.3)
```

在这里核对的环境中，输出为：

```text
0.30
0.30000000000000004
False
```

`message` 保存两位小数的显示文本 `"0.30"`；`value` 仍引用加法得到的浮点对象。相等比较继续使用那个实际数值，不会因为某次显示采用了两位小数，就改为比较理想的十进制数。

> [!IMPORTANT] 格式化文本与原数值
> **对于这里的普通有限浮点数，`.2f` 按小数点后两位生成显示文本，不改写原浮点值、原名称绑定或后续计算与比较所用的数值。**格式化结果是字符串；格式说明还必须适用于实际对象类型。

字符串可以直接用于普通字段，数值格式说明却不会自动把数字文本解析为浮点数。下面这份独立脚本中的 `value` 是字符串 `"0.3"`：

```python
value = "0.3"
print("start")
print(f"{value:.2f}")
print("end")
```

前两行完成绑定与 `start` 的输出，第三行读取 `value` 也能成功；但 `str` 不支持这里的数值格式代码 `f`，格式化时引发值错误 `ValueError`。程序已经写出的内容为：

```text
start
```

错误诊断的最后一行为：

```text
ValueError: Unknown format code 'f' for object of type 'str'
```

失败发生在字段格式化阶段，f 字符串未能取得结果，第三行外层的 `print` 尚未执行。异常未被处理，脚本终止，`end` 不会输出，先前的 `start` 不会撤销。文本看起来像一个数，不足以满足这次数值格式化的输入条件。

字段宽度、对齐与其他数值显示形式，按实际文本需求查阅[格式说明迷你语言](https://docs.python.org/3.14/library/string.html#format-specification-mini-language)；各格式的含义与支持类型需要一并核对。

## 参考资料

- [Python 3.14 语言参考：f 字符串、替换字段与求值](https://docs.python.org/3.14/reference/lexical_analysis.html#f-strings)
- [Python 3.14 教程：格式化字符串字面量与转换标记](https://docs.python.org/3.14/tutorial/inputoutput.html#formatted-string-literals)
- [Python 3.14 标准库：格式说明迷你语言](https://docs.python.org/3.14/library/string.html#format-specification-mini-language)
