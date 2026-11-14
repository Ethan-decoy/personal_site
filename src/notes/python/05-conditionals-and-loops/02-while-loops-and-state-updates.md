---
title: while 循环与状态更新（While Loops and State Updates）
date: 2026-11-12
order: 2
---

# while 循环与状态更新（While Loops and State Updates）

`while` 循环在每次准备进入循环体之前检查条件。条件为真就执行循环体，再回到条件；条件为假则结束这项重复，继续执行循环之后的语句。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。

## 条件复查与状态更新

`while` 后写条件表达式，以冒号结束这一行。缩进代码块是循环体（loop body），条件判断沿用[分支的真值规则](01-conditional-branches.md#条件与缩进代码块)：

```python
remaining = 3

while remaining > 0:
    print(remaining)
    remaining = remaining - 1

print("done", remaining)
```

输出为：

```text
3
2
1
done 0
```

每轮先判断 `remaining > 0`，再按顺序执行两条循环体语句。赋值先计算当前值减一的结果，再重新绑定 `remaining`；下一次判断因此读取更新后的值。

| 检查时的 `remaining` | 条件结果 | 本轮执行后的 `remaining` |
| --- | --- | --- |
| `3` | `True` | `2` |
| `2` | `True` | `1` |
| `1` | `True` | `0` |
| `0` | `False` | 不进入循环体，保持 `0` |

`print("done", remaining)` 已退回外层缩进，只有离开循环后才执行。条件为假不会撤销前几轮的赋值，最终的 `remaining` 仍为零。

> [!IMPORTANT] while 的条件复查
> **`while` 每轮开始前重新求值条件表达式；为真时执行循环体，正常到达循环体末尾后回到条件，为假时离开循环。**后一次判断读取当时的状态，循环体可以执行零次或多次，已完成的修改会保留下来。

循环会重新求值所写的表达式，但不会自动更新另一个已经算好的布尔值。若先把 `remaining > 0` 的结果绑定到 `ready`，随后用 `while ready`，条件读取的是 `ready` 当前的真值；单独修改 `remaining` 不会让这个旧布尔结果重新计算。这与[保存比较结果](../03-basic-values-and-expressions/03-comparisons-and-boolean-values.md#保存结果与再次比较)的关系一致。

## 零次执行与循环之后

条件在第一次检查时就为假，循环体一次也不执行：

```python
remaining = 0

while remaining > 0:
    print("processing")
    remaining = remaining - 1

print("done", remaining)
```

输出为：

```text
done 0
```

`while` 不保证先执行一轮。循环体中才会建立的绑定，也不能据此保证在循环之后存在；这与[分支路径中的名称绑定](01-conditional-branches.md#名称绑定与分支路径)采用相同的执行规则。

条件持续为真而执行又没有其他退出路径时，循环会一直重复。对第一个例子，只保留 `print(remaining)`、省去减一赋值，会使 `remaining` 始终为三；打印本身不会推进剩余数量。

> [!WARNING] 重复执行不会替代状态推进
> **循环重复的是循环体，不会自动把计数减小、把任务移除或刷新已保存的布尔结果。**若条件依赖的状态始终使条件为真，且执行没有其他退出或失败路径，循环便不会自行结束。退出所依赖的状态变化必须来自实际执行的操作。

## 以容器状态决定重复

条件可以直接使用容器的真值。已有列表非空时为真，移除最后一个元素后为空，便可以让循环结束：

```python
pending = ["frame_001.png", "frame_002.png"]

while pending:
    filename = pending.pop()
    print(filename)

print(pending)
```

输出为：

```text
frame_002.png
frame_001.png
[]
```

`pending` 是尚待处理的文件名列表，这里只显示名称，不读取文件。每轮的 [`pop()`](../04-sequences-mappings-and-sets/04-adding-and-removing-list-elements.md#取出位置与返回对象) 都从末尾取出一项，既返回原元素，也缩短同一个列表。两轮之后列表为空，下一次条件判断为假。

这项重复以“取出一项后，剩余任务发生变化”为依据，因此显示顺序从末尾向前。若任务要求按另一种顺序处理，需要按所需顺序组织操作，不能把这里的取出方式理解为文件处理的一般约定。

## 条件求值也可能失败

条件是每轮重新执行的表达式，它自身也可能引发异常。直接访问一个会逐渐变空的列表，其位置可能在后一次检查时已经不存在：

```python
values = [1]
while values[0] > 0:
    print(values.pop())
print("done")
```

第一轮条件成立，循环体取出并输出整数一：

```text
1
```

列表此时已经为空。第二次执行第二行的条件时，`values[0]` 引发 `IndexError`，异常末行为：

```text
IndexError: list index out of range
```

循环体不会开始第二轮，最后一行也不会执行。先前完成的 `pop()` 没有被撤销，`values` 仍引用空列表；这次失败发生在条件求值阶段，并没有得到一个假条件。

可以先判断列表非空，再读取首项。`and` 的[短路求值](../03-basic-values-and-expressions/04-truth-value-testing-and-boolean-operations.md#短路求值与失败位置)允许空列表直接决定条件为假：

```python
values = [1]

while values and values[0] > 0:
    print(values.pop())

print(values)
```

输出为：

```text
1
[]
```

列表为空时，`and` 不再求值右侧，因而不会访问不存在的首项。这一条件同时要求列表非空、首项大于零；若首项不大于零，也会结束循环，并不承诺移除来源中的全部元素。

## 参考资料

- [Python 3.14 语言参考：while 语句](https://docs.python.org/3.14/reference/compound_stmts.html#while)
- [Python 3.14 语言参考：布尔运算与短路求值](https://docs.python.org/3.14/reference/expressions.html#boolean-operations)
