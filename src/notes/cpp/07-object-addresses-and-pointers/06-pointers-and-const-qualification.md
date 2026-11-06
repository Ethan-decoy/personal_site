---
title: 指针与 const 限定（Pointers and const Qualification）
date: 2026-08-27
order: 6
---

# 指针与 const 限定（Pointers and const Qualification）

## const 可以约束两个不同层次

指针对象保存指针值，被指对象保存自己的数据。`target = &other;` 改变指针对象保存的值；`*target = 9;` 修改被指对象。两种修改作用于不同的对象，也可以分别受到类型约束。

这里讨论单层对象指针与已经初始化的普通 `int`、`const int` 对象。以下代码片段均位于 `main` 函数体内；注明接续或沿用时保留相应正常示例的定义，其余片段彼此独立。错误语句分别考察，不接入正常示例。

> [!IMPORTANT] 指针对象与被指类型的两层限制
> **所指类型上的 `const` 限制通过这条指针路径修改目标；指针对象自身的 `const` 限制给该指针对象赋值。**一项约束通过 `*target` 对目标进行的修改，另一项约束 `target` 自身的修改，两者分别判断。

下面的声明形式省略了初始化器。表中的“允许”只回答类型是否许可；实际访问目标时，还须满足目标有效性等条件：

| 声明形式 | 类型是否允许经指针修改目标 | 能否给指针对象赋值 |
| --- | --- | --- |
| `int* target` | 允许 | 允许 |
| `const int* target` | 不允许 | 允许 |
| `int* const target` | 允许 | 不允许 |
| `const int* const target` | 不允许 | 不允许 |

在这些单层声明中，`*` 左侧被指类型上的 `const` 限制通过该指针修改目标；`*` 右侧的 `const` 则限定指针对象自身。`const int*` 与 `int const*` 表示相同类型，本笔记统一采用前一种写法。

## 指向 const 的指针限制访问路径

指向 `const` 的指针（pointer to const）`const int*`，所指类型是 `const int`。它既可以指向 `const int`，也可以指向普通 `int`；下面先保持指向同一个普通对象：

```cpp
int value{7};
const int* target{&value};

value = 9;
const int saved{*target};
```

`value` 自身是可以修改的 `int` 对象，通过名称给它赋值后，它保存整数 `9`。`target` 仍指向这个对象，因此初始化 `saved` 时，通过 `*target` 读到的也是当前值 `9`。

> [!IMPORTANT] 只读访问路径与目标对象的可修改性
> **`const int*` 限制通过该指针修改目标，并不要求目标本身必须是 `const` 对象。**普通 `int` 仍可通过其他允许的路径改变，之后经只读指针读取的是同一个对象的当前值；如果目标本身是 `const int`，则不能在初始化后修改这个对象。

沿用上面的定义，下面这条语句演示编译错误：

```cpp
*target = 11; // 错误：不能通过指向 const 的路径修改目标
```

即使实际目标 `value` 是普通 `int`，`*target` 这条访问路径仍受所指类型 `const int` 的限制。编译器必须诊断这种赋值，不能把它理解为执行后没有效果。

首例中的 `&value` 具有 `int*` 类型，能够转换为 `const int*` 并初始化 `target`。这叫限定转换（qualification conversion）：它保留对同一个 `value` 的指向，并为新路径增加修改限制，没有复制目标对象，也没有把原对象变成 `const` 对象。

反方向的普通初始化不能去掉这个限制。仍沿用首例的定义，下面是另一条独立的错误语句：

```cpp
int* copy{target}; // 错误：不能隐式去掉所指类型上的 const
```

这里根据 `target` 的类型 `const int*` 判断转换是否合法；它此刻恰好指向普通 `int`，不会使这种转换成为合法转换。

> [!IMPORTANT] 单层对象指针的限定转换
> **`int*` 可以隐式转换为 `const int*`，为同一目标建立只读访问路径；`const int*` 不能隐式转换为 `int*`。**复制指针值时，也不能借此去掉所指类型上的 `const` 限制。

`target` 的指针对象自身没有 `const` 限定，因此仍可以重新赋值。接续首个正常示例，让它改为指向一个 `const int` 对象：

```cpp
const int other{20};
target = &other;
```

此后通过 `*target` 读取的是 `other` 保存的 `20`。原来的 `value` 与 `saved` 仍各自保存 `9`；改变指向没有修改这两个对象。

## const 指针固定指向关系

const 指针（const pointer）`int* const` 中的 `const` 限定指针对象自身。下面是独立的正常示例：

```cpp
int value{7};
int* const target{&value};

*target = 9;
```

`target` 在定义时保存指向 `value` 的指针值，之后不能给这个指针对象赋值。被指类型仍是普通 `int`，所以 `*target = 9;` 可以把 `value` 改为 `9`，指针值保持原样。

这里需要在定义位置提供初始化器，不能先写下 `int* const target;`，再通过后续赋值补上初值。沿用本节正常示例的定义，下面两段分别演示不合法的赋值：

```cpp
int other{20};
target = &other; // 错误：不能给 const 指针对象赋值
```

```cpp
target = &value; // 错误：赋相同的指针值也属于赋值
```

两种情况都要求对同一个 `const` 指针对象执行赋值，因此编译器都必须诊断。限制针对赋值操作本身，不取决于赋值前后是否会保存相同的值。

读取这个指针对象保存的值则仍然允许。接续本节的正常示例，用它初始化另一个指针对象，再改变新指针的指向：

```cpp
int* copy{target};
int other{20};
copy = &other;
*copy = 30;
```

`copy` 是独立的 `int*` 对象，可以重新赋值。执行后，`copy` 指向保存 `30` 的 `other`；`target` 仍指向保存 `9` 的 `value`。读取并复制 `target` 的值，没有给 `target` 自身赋值。

> [!IMPORTANT] 指针复制与两层 const
> **指针对象自身的 `const` 限制对该对象赋值，不会自动附加到按值复制后建立的新指针对象上；被指类型上的 `const` 则不能通过普通指针复制去掉。**因此，`int* const` 保存的值可以初始化 `int*`；`const int*` 保存的值却不能隐式初始化 `int*`。新指针对象是否允许赋值，由它自己的类型决定。

`const int* const` 同时限定所指类型与指针对象：不能给这个指针对象赋值，也不能通过它修改目标。读取并在类型允许时复制其指针值仍然可以；如果它指向普通 `int`，目标仍可能通过其他允许的访问路径改变。

## const 不表示指针有效

同时具有两层 `const` 的指针，也可以用空指针值初始化：

```cpp
const int* const target{nullptr};
```

这条定义合法，但明确没有目标，不能通过 `*target` 访问对象。固定保存一个指针值，也不会使该值所指的对象一直存活；目标先结束生命周期时，const 指针同样可能悬空。

> [!IMPORTANT] 修改限制与目标有效性
> **`const` 约束修改权限，不保证指针非空，也不延长被指对象的生命周期。**通过指针访问对象前，仍须保证指针值可正常使用、目标在此次访问期间存活，并满足读取或修改的相应条件。

当访问路径只需读取目标时，使用 `const int*` 可以让编译器检查经该路径进行的意外修改；需要固定指针对象保存的值时，再用指针对象自身的 `const` 表达约束。两种限制分别由对象的职责决定，目标的有效性也须另行保证。

## 参考资料

- [C++23 工作草案：指针声明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.ptr)
- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++23 工作草案：限定转换](https://timsong-cpp.github.io/cppwp/n4950/conv.qual)
- [C++23 工作草案：左值到右值转换](https://timsong-cpp.github.io/cppwp/n4950/conv.lval)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
