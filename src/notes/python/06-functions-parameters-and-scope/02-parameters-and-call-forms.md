---
title: 参数绑定与调用形式（Parameters and Call Forms）
date: 2026-11-12
order: 2
---

# 参数绑定与调用形式（Parameters and Call Forms）

[实参求值得到对象，再绑定参数](01-defining-calling-and-returning.md#定义与执行是两个时刻)。参数名在本次函数调用中引用收到的对象，调用方提供实参时使用的名称可以不同。

代码均为独立完整脚本，使用 CPython 3.14.10；预期失败单独运行。

## 按位置与按名称提供实参

**位置实参（positional argument）**按顺序对应参数；**关键字实参（keyword argument）**使用 `参数名=表达式`，按名称指定接收者。两种形式可以混用，普通位置实参须写在关键字实参之前。

关键字实参中的等号属于调用语法，并不在调用方创建同名变量。

```python
def dimensions(width, height):
    return width, height


size = 320
print(dimensions(size, 240))
print(dimensions(height=240, width=size))
print(dimensions(size, height=240))
```

输出为：

```text
(320, 240)
(320, 240)
(320, 240)
```

三次调用都让 `width` 绑定到三百二十、`height` 绑定到二百四十。第二次调用先写 `height=240`，仍按名称完成对应；`width=size` 读取调用方的 `size`，把取得的对象交给参数 `width`，不要求两处名称相同。

若把第三条输出语句改为 `print(dimensions(width=320, 240))`，普通位置实参就出现在关键字实参之后。整份脚本会在[源码检查阶段](../01-source-code-and-execution/02-source-checking-and-runtime-errors.md#整份脚本的语法错误会阻止它开始执行)引发 `SyntaxError`，前两条输出语句也不会执行。

一个普通参数不能既由位置提供，又被关键字重复提供。这种写法可以通过源码检查，但会在调用时绑定失败：

```python
def dimensions(width, height):
    print("body")
    return width, height


print("before")
dimensions(320, width=640, height=240)
print("after")
```

先输出 `before`，随后在参数绑定时引发 `TypeError`：`width` 得到了两份实参。函数体没有开始，所以 `body` 与 `after` 都没有输出。必需参数缺失、多给普通位置实参或传入不接受的关键字，也会在绑定阶段失败。

> [!IMPORTANT] 绑定完成后才进入函数体
> **实参先求值得到对象，再按函数的参数约定绑定；必需参数缺失或同一参数被重复提供等错误，会使调用在进入函数体前失败。**失败前已经发生的实参求值效果不会撤销。

## 限定位置参数与关键字参数

定义中的 `/` 和单独的 `*` 是参数分隔符，不是要传入的参数。`/` 前面是仅限位置参数（positional-only parameter），只能按位置传；单独 `*` 后面是仅限关键字参数（keyword-only parameter），只能按关键字传。

```python
def resize(width, height, /, *, scale):
    return width * scale, height * scale


print(resize(320, 240, scale=2))
```

输出为：

```text
(640, 480)
```

`resize(width=320, height=240, scale=2)` 会违反 `/` 的约定；`resize(320, 240, 2)` 会违反 `*` 的约定，均引发 `TypeError`。普通的 `def f(x, y)` 没有这些分隔符，两项都可以按位置或关键字提供。

## 接收数量可变的实参

定义中的 `*sizes` 指定在调用绑定时，把剩余的位置实参收集为元组。关键字实参先匹配其他允许按关键字接收的参数，其余部分由 `**options` 收集为字典，以关键字名称为键、实参对象为值。`sizes` 与 `options` 是普通参数名，星号决定它们的收集方式。

```python
def describe(name, *sizes, **options):
    print(name)
    print(sizes)
    print(options)


describe("sample", 320, 240, mode="gray")
```

输出为：

```text
sample
(320, 240)
{'mode': 'gray'}
```

`name` 先取得 `"sample"`，剩余两个位置实参进入 `sizes`，`mode` 未对应其他明确参数，因此进入 `options`。没有剩余项时，分别得到空元组和空字典。`*sizes` 后面若还有普通命名参数，它们是仅限关键字参数。

## 调用时展开容器

调用处的 `*source` 要求来源是[可迭代对象](../04-sequences-mappings-and-sets/04-adding-and-removing-list-elements.md#追加一个对象与扩展一组元素)，将其逐项提供的元素作为位置实参。列表与元组都可以作为来源。

`**mapping` 要求来源是字典等[映射对象（mapping）](../04-sequences-mappings-and-sets/09-dictionaries-and-key-lookup.md#用键描述对应关系)，所有键均须为字符串。每个键作为关键字名称，对应的值作为实参对象。

```python
def dimensions(width, height):
    return width, height


size = [320, 240]
options = {"width": 640, "height": 480}

print(dimensions(*size))
print(dimensions(**options))
```

输出为：

```text
(320, 240)
(640, 480)
```

`dimensions(*size)` 相当于 `dimensions(320, 240)`，两个元素按位置提供；`dimensions(**options)` 相当于 `dimensions(width=640, height=480)`，由键指定接收参数，关联值提供实际对象。

> [!IMPORTANT] 参数收集与实参展开
> **函数定义中的 `*sizes`、`**options` 指定收集方式：调用绑定时，剩余位置实参组成元组，剩余关键字实参组成字典。调用表达式中的 `*source`、`**mapping` 则分别展开来源，提供位置实参和关键字实参。**`*source` 的来源须可迭代；`**mapping` 的来源须为映射，字符串键指定关键字名称，关联值提供实参对象。

来源满足展开条件后，仍须符合函数的参数约定；项数不合适、出现不接受的关键字或同一参数被重复提供，仍会在进入函数体前引发 `TypeError`。对这里的 `dimensions`，`dimensions(size)` 只提供一个列表对象，缺少 `height`；`dimensions(*size)` 则提供两个元素，能够完成绑定。

> [!PRACTICE] 保留调用处的参数含义
> 参数少且位置含义明确时，普通调用更便于阅读；尺寸、阈值等容易互换的选项可以用关键字表达角色。数据已经按参数结构组织时，展开可以减少逐项传入的重复；选择这种写法时，仍须让来源内容与接口要求的对应关系清楚可辨。

## 参考资料

- [Python 3.14 语言参考：调用](https://docs.python.org/3.14/reference/expressions.html#calls)
- [Python 3.14 官方教程：特殊参数与实参解包](https://docs.python.org/3.14/tutorial/controlflow.html#special-parameters)
