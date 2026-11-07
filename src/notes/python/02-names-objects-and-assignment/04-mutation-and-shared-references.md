---
title: 对象修改与共享引用（Mutation and Shared References）
date: 2026-11-07
order: 4
---

# 对象修改与共享引用（Mutation and Shared References）

同一个列表可以从空变成含有元素的列表，引用它的名称不需要因此重新赋值。对象的[身份保持不变](03-object-identity-and-equality.md#相等与身份分别判断)，并不意味着它的内容也必须保持不变。

脚本示例均为完整程序，分别在 CPython 3.14 中独立运行。

## 修改同一个列表

列表属于可变对象（mutable object）：它允许在保持同一对象身份的情况下，改变自身保存的元素引用。直接改变原对象状态的操作称为原地修改（in-place mutation）。

`append` 是列表提供的方法（method），通过列表对象取得并调用。在 `values.append(3)` 中，先读取名称 `values` 取得列表，再通过点号和名称 `append` 取得该列表的追加方法，最后用括号发起调用，将整数对象 `3` 作为实参交给它。这次调用在原列表末尾追加对该对象的引用，正常完成后返回 `None`。

```python
values = []
alias = values
values.append(3)

print(values)
print(alias)
print(values is alias)
```

前两行让 `values` 与 `alias` 引用同一个空列表，[绑定动作没有复制列表](01-names-and-assignment.md#重新绑定与多个名称)。第三行通过 `values` 取得这个列表，再向其中追加一个元素。输出为：

```text
[3]
[3]
True
```

`[3]` 是这里打印列表时采用的表示形式：方括号中有一个整数元素 `3`。`append` 修改了列表保存的内容，两个名称的绑定都没有改变，因此经任一名称取得的都是修改后的同一个列表。最后的身份比较仍为 `True`，与这项原地修改的契约相符。

> [!IMPORTANT] 共享引用与对象修改
> **多个名称引用同一可变对象，且绑定保持不变时，它们随后取得的仍是原地修改后的同一个对象。原地修改改变对象的状态，保持对象身份。**共享引用使同一对象的修改可以通过不同名称读取到，不需要逐个重新绑定这些名称。

## 修改对象与重新绑定名称

`[3]` 也可以直接写在源码中：对方括号内的 `3` 求值，将所得对象作为唯一元素，创建一个新的列表对象。`values = [3]` 因而先取得新列表，再将名称 `values` 绑定到它：

```python
values = []
alias = values
values = [3]

print(values)
print(alias)
print(values is alias)
```

这份脚本开始时，两个名称仍然引用同一个空列表。第三行右侧创建另一个含有元素 `3` 的列表，随后只重新绑定 `values`。`alias` 继续引用原来的空列表，输出为：

```text
[3]
[]
False
```

两份脚本中，`values` 最终都显示为 `[3]`，但 `alias` 的读取结果和身份比较结果不同。`values.append(3)` 改变的是原列表的内容；`values = [3]` 改变的是 `values` 的绑定，原空列表没有被修改。

**对象是否可变，与某次操作是否实际修改它，需要分别判断。**列表允许原地修改，引用它的名称也可以重新绑定到另一个对象。判断这类代码时，需要跟踪右侧取得哪个对象、调用修改哪个对象，以及赋值改变哪个名称的绑定。

## 不可变对象与重新绑定

`str` 与 `int` 属于不可变类型。这些对象创建后，自身表示的字符串内容或整数值不能原地改写，称为不可变对象（immutable object）。需要表示不同的字符串内容时，可以计算一个[字符串拼接结果](02-object-types.md#类型约束操作的含义与成立条件)，再将名称绑定到所得对象：

```python
message = "Hello"
alias = message
message = message + ", Python!"

print(message)
print(alias)
print(message is alias)
```

第三行先读取 `message` 当前引用的字符串，再与右侧文本拼接，得到内容为 `Hello, Python!` 的字符串，最后将 `message` 绑定到结果。`alias` 仍引用内容为 `Hello` 的原字符串。输出为：

```text
Hello, Python!
Hello
False
```

这里拼接结果的内容与原字符串不同，而原字符串的内容不能原地改变，因此结果不是原字符串，身份比较得到 `False`。这并不能扩大为“不可变对象的每次运算都会创建新对象”；是否复用已有对象，仍要按具体表达式或调用的契约判断。

> [!IMPORTANT] 不可变性与名称绑定
> **不可变性约束对象自身允许的状态变化，不会固定引用它的名称。**字符串与整数对象的值不能原地改写；名称仍可通过简单赋值，绑定到表示其他值的对象。

## 修改效果与返回值

调用产生的修改效果，与调用的返回值需要分别判断。[右侧为调用的简单名称赋值，会将名称绑定到调用正常返回的对象](01-names-and-assignment.md#右侧求值与绑定的先后)。`append` 修改原列表，返回的却是 `None`，因此下面的赋值会让 `values` 绑定到 `None`：

```python
values = []
alias = values
values = values.append(3)

print(values)
print(alias)
```

第三行先读取右侧 `values` 当前引用的列表，取得并调用它的 `append` 方法。列表追加元素后，调用返回 `None`；随后赋值将左侧 `values` 绑定到这个返回值。`alias` 的绑定没有改变，仍引用已经追加了元素的列表。输出为：

```text
None
[3]
```

这次赋值正常完成，但 `values` 已经不再引用列表。列表的修改也没有消失，仍可通过 `alias` 取得。

> [!WARNING] 把 append 的返回值当成列表
> **若目的是让名称继续引用该列表，`values = values.append(3)` 会违背这个目的：`append` 返回 `None`，随后赋值让 `values` 绑定到它。**已经完成的列表修改仍然保留，可以通过其他仍引用该列表的名称取得。

`append` 的返回约定不能推广为“所有修改对象的方法都返回 `None`”。其他调用是否修改对象、返回什么，需要分别核对其契约，不能仅凭存在修改效果就推断返回值。

## 参考资料

- [Python 3.14 语言参考：对象、值与类型](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 内置类型：可变序列的操作与返回约定](https://docs.python.org/3.14/library/stdtypes.html#mutable-sequence-types)
- [Python 3.14 教程：列表方法](https://docs.python.org/3.14/tutorial/datastructures.html#more-on-lists)
- [Python 3.14 语言参考：列表创建表达式](https://docs.python.org/3.14/reference/expressions.html#list-displays)
- [Python 3.14 语言参考：赋值语句](https://docs.python.org/3.14/reference/simple_stmts.html#assignment-statements)
