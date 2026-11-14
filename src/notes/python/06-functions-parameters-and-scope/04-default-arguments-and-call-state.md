---
title: 默认参数与跨调用状态（Default Arguments and Call State）
date: 2026-11-12
order: 4
---

# 默认参数与跨调用状态（Default Arguments and Call State）

函数定义中，参数名后面的 `=表达式` 指定默认值（default value）：调用没有为该参数提供实参时，参数绑定到保存的默认对象。默认表达式在[执行函数定义](01-defining-calling-and-returning.md#定义与执行是两个时刻)时求值，不会在每次省略实参时重新计算。

示例为 CPython 3.14.10 的独立完整脚本。

## 定义时取得默认对象

```python
scale = 2


def resize(width, factor=scale):
    return width * factor


scale = 3
print(resize(100))
print(resize(100, factor=4))
```

输出为：

```text
200
400
```

执行 `def` 时，默认表达式 `scale` 得到整数二，它被保存为 `factor` 的默认值。之后外层名称改绑到三，不会重算已有默认值。显式提供四时，本次参数使用四，不使用默认对象。

对本例这种可按位置或关键字传入的参数，有默认值的参数后面不能再放无默认值的参数。`def f(x=1, y):` 会在[源码检查阶段](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)引发 `SyntaxError`，函数定义尚未执行。

[仅限关键字参数](02-parameters-and-call-forms.md#限定位置参数与关键字参数)允许在有默认值的参数之后，继续声明无默认值的必需参数；调用时仍须按关键字提供这些必需参数。

> [!IMPORTANT] 默认值的求值与复用
> **每次执行函数定义时，默认表达式求值一次；后续省略相应实参的调用，复用这次定义保存的默认对象。**函数若被重新定义，会建立新的函数对象与相应默认值。

## 可变默认对象会保留修改

```python
def collect(value, values=[]):
    values.append(value)
    return values


first = collect(320)
second = collect(640)
print(first)
print(second)
print(first is second)
```

输出为：

```text
[320, 640]
[320, 640]
True
```

执行定义时，`[]` 创建默认列表。第一次调用追加三百二十后，[`return values` 交回的仍是这个列表](03-arguments-sharing-and-mutation.md#返回并不复制对象)，`first` 引用它。第二次调用继续取得同一默认列表，追加六百四十，再让 `second` 引用它。

两次输出都在第二次调用之后，此时 `first` 与 `second` 引用的同一列表已经包含两个元素，所以两行都显示 `[320, 640]`，身份比较为 `True`。`first` 保存的是对象引用，不是第一次调用结束时的内容快照。

> [!WARNING] 省略实参不等于新建容器
> 若每次调用应拥有独立列表，使用可变默认对象会把修改留给后续省略实参的调用。错误来自默认对象被复用，而不是“列表不能作为参数”。

## 在调用中建立独立状态

本例将 `None` 用作“没有提供列表”的标记：省略 `values` 或显式传入 `None` 时，在函数体内新建本次调用的列表；显式传入列表时，直接沿用它。函数向所用列表追加 `value`，并返回这个列表。

函数使用[`values is None`](../02-names-objects-and-assignment/03-object-identity-and-equality.md#判断是否为-none)检测这个标记。若该参数的显式 `None` 需要与省略实参表示不同含义，应使用能区分二者的缺省约定。

```python
def collect(value, values=None):
    if values is None:
        values = []
    values.append(value)
    return values


first = collect(320)
second = collect(640)
provided = []
third = collect(960, provided)

print(first, second)
print(first is second)
print(third is provided, provided)
```

输出为：

```text
[320] [640]
False
True [960]
```

前两次调用都先让 `values` 绑定到保存的默认对象 `None`，再在各自函数体内创建列表。`values = []` [只改变本次调用中的参数绑定](03-arguments-sharing-and-mutation.md#重新绑定参数不会替换调用方名称)；函数保存的默认对象仍为 `None`，下一次省略该实参时，参数依旧先取得 `None`。因此，`first` 与 `second` 引用不同列表。

第三次调用直接把 `values` 绑定到 `provided`，跳过新建步骤；追加发生在这个原列表上，返回的也是它，所以 `third is provided` 为 `True`，`provided` 的内容变为 `[960]`。

`is None` 检查对象身份，`if not values` 则进行[真值测试](../03-basic-values-and-expressions/04-truth-value-testing-and-boolean-operations.md#对象的真值与布尔值)。若改用后者，空列表也会使条件成立，第三次调用就会新建列表并重新绑定 `values`，`provided` 仍为空。这会改变本例“沿用并修改显式提供的列表”的接口约定。

## 参考资料

- [Python 3.14 语言参考：函数默认值](https://docs.python.org/3.14/reference/compound_stmts.html#function-definitions)
- [Python 3.14 官方教程：默认参数](https://docs.python.org/3.14/tutorial/controlflow.html#default-argument-values)
