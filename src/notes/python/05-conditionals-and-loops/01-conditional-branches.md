---
title: 条件分支（Conditional Branches）
date: 2026-11-12
order: 1
---

# 条件分支（Conditional Branches）

条件分支（conditional branch）根据条件选择执行哪些语句。同一份源码可以因当前数据不同而经过不同路径，未选中的分支不会执行。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。

## 条件与缩进代码块

`if` 后写条件表达式，以冒号结束这一行；下一行开始的缩进代码块属于这个条件。条件为真时执行该代码块，为假时跳过。`else:` 可以提供条件为假时的另一条路径：

```python
width = 640

if width >= 512:
    print("large")
else:
    print("small")

print("checked")
```

输出为：

```text
large
checked
```

`width` 表示图像宽度，单位为像素。比较 `width >= 512` 得到 `True`，因此执行第一处缩进中的 `print`，跳过 `else` 的代码块。最后一行已经退回外层缩进，不属于任何分支，在所选分支正常完成后继续执行。

`else` 与对应的 `if` 对齐，`else` 后不再写条件。代码块的归属由[缩进结构](../01-source-code-and-execution/03-tokens-indentation-and-comments.md#缩进决定语句归属)确定；本书使用四个空格表示一级缩进。

条件也可以直接采用已有对象，按[真值规则](../03-basic-values-and-expressions/04-truth-value-testing-and-boolean-operations.md#对象的真值与布尔值)判断，不要求表达式本身一定返回 `bool`：

```python
files = []

if files:
    print("files available")
else:
    print("no files")
```

输出为：

```text
no files
```

空列表的真值为假，所以执行 `else`。若省略 `else`，条件为假时便直接越过整个 `if` 语句，不会自动补做某项操作。

## elif 与 else 的选择顺序

`elif` 是同一条分支语句中的后续条件。它与 `if` 对齐，也由条件、冒号和缩进代码块组成。条件按书写顺序判断，第一个为真的条件选中对应代码块，后面的条件和分支不再执行：

```python
width = 640

if width >= 1024:
    label = "large"
elif width >= 512:
    label = "medium"
else:
    label = "small"

print(label)
```

输出为：

```text
medium
```

第一个条件为假，才继续判断 `width >= 512`。第二个条件为真，`label` 绑定到 `"medium"`，`else` 不再执行。`elif` 可以有多项，`else` 则只能作为最后一项。

条件有重叠时，顺序会改变结果。若把 `width >= 512` 放在 `width >= 1024` 之前，宽度一千二十四也会先进入前者，后者没有机会被选中。覆盖较大范围的条件放在前面，可能使后面的条件永远无法选中。

多条独立的 `if` 则各自判断，不会因为前一条已经选中，就跳过后一条：

```python
width = 640

if width >= 512:
    print("at least 512")
if width >= 256:
    print("at least 256")
```

输出为：

```text
at least 512
at least 256
```

这两个条件都为真，所以两个代码块都执行。需要从多条候选路径中只选择一条时，`if / elif / else` 的选择关系与多条独立 `if` 不同。

> [!IMPORTANT] 条件分支的选择规则
> **同一条 `if / elif / else` 按顺序判断条件，只执行第一个真条件对应的代码块；所有条件都为假时，执行可选的 `else`。**没有 `else` 且所有条件均为假时，不执行任何分支。选中分支后，后续分支的条件与语句不再求值；多条独立的 `if` 则分别进行判断。

## 名称绑定与分支路径

分支中的赋值只有实际执行后才会建立绑定。仅在源码中写出名称，不代表所有路径都能读取它：

```python
width = 320
if width >= 512:
    label = "large"
print(label)
```

第二行的条件为假，第三行没有执行。第四行读取尚未绑定的 `label`，在运行时引发 `NameError`，异常末行为：

```text
NameError: name 'label' is not defined
```

脚本没有产生正常输出。`width` 的绑定已经建立，`label` 则没有被绑定，也没有自动取得 `None` 或空字符串；失败的 `print` 没有输出内容，脚本随未处理的异常结束。

需要在分支之后使用结果时，可以让各条可能到达该处的路径都提供结果，前面的 `if / elif / else` 就采用这种组织。也可以先建立默认绑定，再在满足条件时替换它：

```python
width = 320
label = "small"

if width >= 512:
    label = "large"

print(label)
```

输出为：

```text
small
```

条件为假，分支内的赋值未执行，`label` 保持已有绑定。分支中实际完成的名称绑定，也不会在离开该缩进代码块时自动消失。

> [!WARNING] 未经过的分支不会建立绑定
> **只在某个分支中赋值、随后在分支外读取名称，会在该分支没有执行且此前也没有绑定时引发 `NameError`。**名称能否读取取决于实际经过的路径，而不是它是否曾出现在源码中。已有绑定也不会因某个分支被跳过而被清除。

## 参考资料

- [Python 3.14 语言参考：if 语句](https://docs.python.org/3.14/reference/compound_stmts.html#if)
- [Python 3.14 执行模型：名称绑定与作用域](https://docs.python.org/3.14/reference/executionmodel.html#binding-of-names)
