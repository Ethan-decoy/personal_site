---
title: 参数共享与对象修改（Argument Sharing and Mutation）
date: 2026-11-12
order: 3
---

# 参数共享与对象修改（Argument Sharing and Mutation）

把列表传给函数时，参数接收的是调用中得到的对象。参数绑定没有额外复制列表，因此调用方与函数可能经不同名称访问同一个可变对象。

以下均为 CPython 3.14.10 中独立运行的完整脚本。

## 参数可以成为共享引用

`append` 会[修改原列表并返回 None](../02-names-objects-and-assignment/04-mutation-and-shared-references.md#修改效果与返回值)。函数中的参数也能用于取得这个方法：

```python
def add_width(values):
    values.append(640)


widths = [320]
result = add_width(widths)
print(widths)
print(result)
```

输出为：

```text
[320, 640]
None
```

调用先读取 `widths`，得到列表；本次调用的 `values` 绑定到同一个列表。`append` 改写这个对象，因此调用结束后经 `widths` 也能看到六百四十。函数正常走到末尾，返回的却是 `None`，修改效果与返回值分别存在。

## 重新绑定参数不会替换调用方名称

对两个内置列表，`left + right` 按顺序拼接两侧元素，创建新外层列表，不修改两侧列表；元素对象本身不会被复制。

`values = values + [640]` 先取得拼接结果，再把本次调用的参数 `values` 重新绑定到新列表。这个版本还用 `return values` 显式返回新列表，与前一版正常返回 `None` 的约定不同：

```python
def add_width(values):
    values = values + [640]
    return values


widths = [320]
result = add_width(widths)
print(widths)
print(result)
print(widths is result)
```

输出为：

```text
[320]
[320, 640]
False
```

进入函数体时，`values` 与 `widths` 引用同一个列表，内容为 `[320]`。拼接得到 `[320, 640]` 后，赋值只把 `values` 重新绑定到新列表，`widths` 仍引用原来的 `[320]` 列表。`return values` 取得新列表并返回，外层赋值使 `result` 引用它，因此 `widths is result` 为 `False`。

> [!IMPORTANT] 参数绑定与对象修改
> **参数最初绑定到实参求值得到的对象；重新绑定参数只改变本次调用中的绑定，修改共享对象则可能从调用方被观察到。**参数绑定本身不会复制对象；函数体是否创建或复制对象，取决于实际执行的操作。

## 返回并不复制对象

```python
def unchanged(values):
    return values


widths = [320]
result = unchanged(widths)
print(result is widths)

result.append(640)
print(widths)
```

输出为：

```text
True
[320, 640]
```

`return values` 取得当前引用的对象并返回，`result` 与 `widths` 因而引用同一个列表。能否独立修改，应依据具体函数契约判断，不能因为对象“从函数里出来”就推断它已经独立。

若函数承诺返回新列表，可以使用 `values.copy()` 等操作建立外层独立性；[浅复制仍可能共享内部元素](../02-names-objects-and-assignment/05-shallow-list-copies.md#外层独立与内层共享)。复制的层次必须与所需修改范围对应。

## 同一个对象可以绑定多个参数

```python
def add_and_read(target, source):
    target.append(640)
    return len(source)


widths = [320]
print(add_and_read(widths, widths))
print(widths)
```

输出为：

```text
2
[320, 640]
```

两个参数的名称不同，但两次实参读取都得到同一个列表。经 `target` 追加之后，`source` 看到的长度也为二。参数名不同不能证明对象不同。

> [!PRACTICE] 让修改责任可见
> 接口若以计算新结果为职责，返回结果通常便于组合；若以原地更新为职责，应明确修改哪一层对象及返回什么。调用方是否需要保留原数据，决定了是否应复制，不能只为回避解释共享而额外复制。

## 参考资料

- [Python 3.14 官方教程：定义函数与参数传递](https://docs.python.org/3.14/tutorial/controlflow.html#defining-functions)
- [Python 3.14 语言参考：对象、值与类型](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types)
- [Python 3.14 内置类型：序列拼接](https://docs.python.org/3.14/builtins/stdtypes.html#common-sequence-operations)
