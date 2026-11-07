---
title: 对象身份与相等比较（Object Identity and Equality）
date: 2026-11-07
order: 3
---

# 对象身份与相等比较（Object Identity and Equality）

同一种类型的两个对象可以比较相等，却仍然是两个不同对象。[多个名称也可以引用同一个对象](01-names-and-assignment.md#重新绑定与多个名称)。判断数据是否相等，与判断取得的是否为同一对象，需要区分。

脚本示例均为完整程序，分别在 CPython 3.14 中独立运行。

## 相等与身份分别判断

每个对象都有自己的身份（identity），用于区别于同时存在的其他对象。对象存在期间，其身份保持不变。

列表（list）是一种按顺序保存对象引用的容器。`[]` 创建一个没有元素的空列表，每次对这个写法求值，都会创建一个新的空列表对象。两个空列表按列表的规则比较相等，但不要求它们是同一个对象。

两个表达式之间的 `==` 进行相等比较（equality comparison），具体规则取决于参与比较的对象类型。`is` 则进行身份比较（identity comparison），判断两侧取得的是否为同一个对象。`==` 使用两个等号，与[用于赋值的单个 `=`](01-names-and-assignment.md#赋值建立名称与对象的绑定)有不同作用。

身份比较返回布尔值（Boolean value）：`True` 表示真，`False` 表示假，它们属于内置类型 `bool`，源码写法不加引号。本节使用的内置整数、字符串与空列表，其相等比较也返回布尔值。

```python
first = []
second = []
alias = first

print(first == second)
print(first is second)
print(first is alias)
```

前两行各自创建一个空列表，`first` 与 `second` 分别引用它们。第三行读取 `first` 已有的绑定，让 `alias` 也引用第一个列表，没有创建或复制列表。此时有三个名称、两个列表对象。输出为：

```text
True
False
True
```

`first == second` 按列表的相等比较规则判断，两个列表都没有元素，因此得到 `True`。`first is second` 检查对象身份，两个名称取得的是分别创建的对象，因此得到 `False`。`first is alias` 的两侧则取得同一个对象，结果为 `True`。

> [!IMPORTANT] 相等比较与身份判断
> **`==` 按相应类型的规则判断两个对象是否相等；`is` 判断两侧取得的是否为同一个对象。相等不能推出身份相同。**多个名称可以引用同一对象，类型相同、比较相等的对象也可以具有不同身份。

这里两个列表的身份不同，由 `[]` 每次创建新列表的规则确定；`is` 的结果与这条规则相符。对象数目不能仅凭[普通输出或类型显示](02-object-types.md#值类型与显示结果)推断，相同的显示结果不足以证明引用了同一个对象。

## 重新绑定与对象身份

名称重新绑定后，即使所指对象仍然比较相等，引用关系也可能已经改变：

```python
first = []
alias = first
print(first is alias)

first = []
print(first is alias)
print(first == alias)
```

前两行让两个名称引用同一个空列表，第一次身份比较得到 `True`。第二次执行 `first = []` 时，先由右侧创建另一个空列表，再将 `first` 绑定到它。`alias` 仍引用原来的列表，因此随后得到 `False`。完整输出为：

```text
True
False
True
```

最后一次相等比较得到 `True`，因为两个列表仍然都为空。这一结果不能说明 `first` 保留了原来的引用；它回答的是列表是否相等，而不是是否发生了绑定变化。

新对象来自右侧 `[]` 的求值，随后进行的是简单名称绑定。若右侧读取已有名称，就会取得已有对象；不能把赋值的绑定动作本身理解为创建或复制对象的操作。重新绑定也没有改变原列表的身份，`alias` 始终引用那个原有对象。

## 字面量求值与对象复用

空列表的创建规则，不能直接推广到整数或字符串字面量。对于相同类型、相同值的这些对象，实现可能复用已有对象；两次字面量求值既可能取得同一个对象，也可能取得值相同的不同对象。例如：

```python
left = 3
right = 3

print(left == right)
print(left is right)
```

第一行输出按整数相等比较的规则确定，为 `True`。第二行输出反映这次运行中，两个名称取得的是否为同一个整数对象；不能仅根据源码里写了两次 `3`，就断定它一定为 `False`，也不能把一次运行得到的 `True` 推广为所有同值整数的身份保证。

> [!WARNING] 字面量出现次数不能决定对象数目
> **“相同字面量每次都产生独立对象”的预期并不成立。**某些整数或字符串对象可能被复用，此时两处字面量可以取得同一对象，身份比较就会得到 `True`。反过来，一次得到 `True` 也不能证明相同值总会复用同一对象；用 `is` 代替值比较，遇到相等但身份不同的对象时，就会得到不符合比较目的的 `False`。

具体复用策略属于实现与版本的细节，不能用某一组数值或某次运行结果替代语言规则。`[]` 创建新列表、名称读取取得已有对象、字面量求值可能复用对象，分别依据各自表达式的规则判断。

## 判断是否为 None

`None` 对应的对象只有一个，程序在不同位置取得的 `None` 仍然是同一对象。因此，判断一个结果是否为 `None`，可以直接写成 `result is None`。

[`print` 正常完成后返回 `None`](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#函数返回值与输出)，而不是返回刚才写出的文本：

```python
result = print("Hello, Python!")
print(result is None)
result = "None"
print(result is None)
```

第一行先写出问候语，再将返回的 `None` 绑定到 `result`，因此第二行的身份比较得到 `True`。随后 `result` 重新绑定到字符串 `"None"`；它以这四个字母作为文本内容，是另一个对象，所以最后的身份比较得到 `False`。完整输出为：

```text
Hello, Python!
True
False
```

`is not` 是与 `is` 相反的身份比较写法，判断两侧取得的不是同一个对象。在上面的两种绑定状态中，`result is not None` 会分别得到 `False` 与 `True`。

> [!IMPORTANT] None 对象与身份判断
> **`None` 是一个唯一的对象。取得一个对象后，`value is None` 判断它是否就是 `None`，`value is not None` 判断它是否为另一个对象。**字符串 `"None"` 的内容虽然写成相同的字母，仍不具有 `None` 的身份。

身份比较同样要先取得两侧的对象。若一个名称[尚未绑定](01-names-and-assignment.md#读取尚未绑定的名称)，读取它时仍会引发 `NameError`，比较无法继续；`is None` 不能用来判断名称是否已经存在。

## 参考资料

- [Python 3.14 语言参考：对象、值与类型](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 语言参考：列表创建表达式](https://docs.python.org/3.14/reference/expressions.html#list-displays)
- [Python 3.14 语言参考：值比较](https://docs.python.org/3.14/reference/expressions.html#value-comparisons)
- [Python 3.14 语言参考：身份比较](https://docs.python.org/3.14/reference/expressions.html#identity-comparisons)
- [Python 3.14 语言参考：字面量与对象身份](https://docs.python.org/3.14/reference/expressions.html#literals-and-object-identity)
- [Python 3.14 内置常量：None](https://docs.python.org/3.14/builtins/constants.html#None)
