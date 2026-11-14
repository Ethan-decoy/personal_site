---
title: 循环中的跳过与结束（Skipping Iterations and Ending Loops）
date: 2026-11-12
order: 4
---

# 循环中的跳过与结束（Skipping Iterations and Ending Loops）

`continue` 跳过当前一轮循环体中尚未执行的语句，继续下一轮；`break` 则提前结束当前循环。两者只改变执行路径，不会撤销此前已经完成的操作。

各个 `python` 代码块都是独立的完整脚本，分别在 Windows 64 位 CPython 3.14.10 中核对；预期失败的脚本也单独运行。

## 跳过本轮剩余语句

列表 `widths` 保存一组图像宽度，单位为像素，其中零表示本例尚无有效宽度的记录。`continue` 可以让这类记录不进入当前一轮后续处理，同时保留后面的其他记录：

```python
widths = [320, 0, 640]

for width in widths:
    if width == 0:
        continue
    print(width)

print("after")
```

输出为：

```text
320
640
after
```

取得零时，`if` 条件成立，`continue` 让这一轮跳过后面的 `print(width)`。`for` 随后[取得下一项并绑定目标](03-for-loops-and-ranges.md#逐项取得元素与目标绑定)，因此六百四十仍会进入循环体。来源结束后，循环外的 `print("after")` 正常执行。

`continue` 并非只离开它所在的 `if`；它跳过的是当前一轮循环体的剩余部分。已经执行的赋值、修改或输出仍然保留。

## 结束当前循环

`break` 结束包围它的当前循环，不再取得该循环的后续元素。查找第一个达到某项条件的值时，找到后可以立即停止：

```python
widths = [320, 640, 960]
found = None

for width in widths:
    if width >= 600:
        found = width
        break

print(found)
```

输出为：

```text
640
```

第一项三百二十未达到条件，循环继续。第二项六百四十达到条件，`found` 先绑定到这个整数，随后 `break` 结束循环，九百六十不再被取得。循环外的输出仍会执行；如果整组数据都未达到条件，`found` 保持最初的 `None`。

> [!IMPORTANT] 跳过本轮与结束循环
> **`continue` 跳过当前一轮尚未执行的循环体语句，`break` 结束当前循环。**对 `for`，前者继续取得下一项；对 `while`，前者返回条件检查。两者都不撤销此前已完成的操作，也不自动终止循环之后的语句。

两种语句都须处在循环体对应的语法语境内。将 `break` 独立放在脚本顶层，会在源码检查阶段失败：

```python
print("before")
break
print("after")
```

第二行不处在任何循环内，引发 `SyntaxError`，异常末行为：

```text
SyntaxError: 'break' outside loop
```

整份脚本没有开始执行，两个 `print` 都没有输出。顶层的 `continue` 同样不成立；把它放进顶层的 `if` 语句，也不会使它获得循环体语境。

## while 中的推进与最内层循环

`while` 在每轮之前[重新检查条件](02-while-loops-and-state-updates.md#条件复查与状态更新)。使用 `continue` 时，决定进度的更新也可能被跳过，因而更新位置会影响循环能否继续推进：

```python
widths = [320, 0, 640]
index = 0

while index < len(widths):
    width = widths[index]
    index = index + 1
    if width == 0:
        continue
    print(width)

print(index)
```

输出为：

```text
320
640
3
```

这里每轮先读取当前项，再增加索引，然后判断是否跳过后续处理。即使取得零，`index` 也已经推进到下一处位置；所有项处理完后，索引为三，条件变假，循环正常结束。

> [!WARNING] continue 可能跳过 while 的状态更新
> **若索引更新放在会被 `continue` 跳过的位置，循环可能一直读取同一项。**例如，把本例的索引增加移到 `print(width)` 之后，遇到零时就不会更新索引；下一次检查的条件仍为真，又读取同一个零，循环无法按原计划推进。

循环可以嵌套。`break` 与 `continue` 都作用于包围它的最内层循环；`if` 并非另一层循环。下例的 `row` 与 `column` 分别表示一组二维位置的行号与列号：

```python
for row in range(2):
    for column in range(3):
        if column == 1:
            break
        print(row, column)
    print("row finished")
```

输出为：

```text
0 0
row finished
1 0
row finished
```

每行都先取得列号零并输出位置；随后列号一触发 `break`，结束的是内层列循环。行末输出仍会执行，外层循环也会继续取得下一行。内层的 `break` 没有同时结束两层循环。

## 正常结束与循环 else

循环后的 `else` 与循环头保持相同缩进，属于循环语句。对 `for`，来源没有下一项时进入 `else`；对 `while`，条件检查为假时进入 `else`。在对应循环内执行 `break` 则跳过它。

这使搜索可以分别表达“找到后提前停止”和“全部查过仍未找到”。列表中的宽度均以像素为单位：

```python
widths = [320, 480]

for width in widths:
    if width >= 600:
        print("found", width)
        break
else:
    print("not found")
```

输出为：

```text
not found
```

两项都未达到六百，循环没有执行 `break`；来源耗尽后进入 `else`。只将列表中的四百八十改为六百四十，同一脚本就会输出 `found 640`，并因 `break` 跳过 `else`。

即使来源起初为空，`for` 也会正常进入 `else`；`while` 的条件第一次就为假时也是如此。`continue` 仅跳过一轮的剩余语句，不会单独取消循环正常结束后的 `else`。

> [!IMPORTANT] 循环 else 与正常结束路径
> **`for` 因来源耗尽、`while` 因条件变假而结束时，执行对应的 `else`；执行该循环的 `break` 则跳过它。**`else` 不要求循环体至少执行一次，也不是“最后一次 `if` 条件为假”的分支。未处理的异常仍会终止脚本，不会为执行 `else` 而继续运行。

`else` 的归属由缩进决定。本例中它与 `for` 对齐；若改为与内层 `if` 对齐，它就属于条件语句，判断时机与执行次数都会改变。

## 参考资料

- [Python 3.14 语言参考：break 的语境与最内层循环](https://docs.python.org/3.14/reference/simple_stmts.html#the-break-statement)
- [Python 3.14 语言参考：continue 的下一轮执行](https://docs.python.org/3.14/reference/simple_stmts.html#the-continue-statement)
- [Python 3.14 语言参考：while 与 for 的正常结束及 else](https://docs.python.org/3.14/reference/compound_stmts.html#the-while-statement)
- [Python 3.14 官方教程：循环中的 break、continue 与 else](https://docs.python.org/3.14/tutorial/controlflow.html#break-and-continue-statements)
