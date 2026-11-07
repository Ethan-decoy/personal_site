---
title: 结构体对象的复制与赋值（Copying and Assigning Struct Objects）
date: 2026-08-28
order: 4
---

# 结构体对象的复制与赋值（Copying and Assigning Struct Objects）

绘图程序可以保存移动前的位置，再更新当前位置。对于这里仅包含可复制基本类型成员的简单结构体，C++ 提供的复制行为能够把一组坐标保存到独立对象中。

## 用已有对象初始化新对象

下面的类型定义放在 `main` 之前，对象定义放在 `main` 的函数体内；后续位置修改和恢复片段按顺序接在对象定义之后：

```cpp
struct position {
    int x{};
    int y{};
};

position current{20, 10};
const position saved{current};
```

`const position saved{current};` 的初始化形式是直接列表初始化（direct-list-initialization）。本例中，花括号里只有一个指定已有 `position` 对象的表达式；C++23 用该对象初始化整个 `saved`，形成副本。

`saved.x`、`saved.y` 分别以 `current.x`、`current.y` 的当前值初始化。这次使用的是源对象的状态，不使用本例成员声明中的默认成员初始化器：

```text
current               saved
├── x    20   ──>     ├── x    20
└── y    10   ──>     └── y    10
```

箭头表示初始化时读取对应成员的状态。接着修改当前位置：

```cpp
current.x = 35;
current.y = 15;
```

执行后，`current` 的两个分量为 `35`、`15`，`saved` 仍保存原来的 `20`、`10`。

> [!IMPORTANT] 用已有对象建立副本
> **用已有对象建立当前简单结构体的副本，会创建新的完整对象，并用源对象中对应成员的状态初始化新成员。**这里的两个位置及各自的整数成员具有独立身份；复制不建立持续同步关系，修改 `current` 不会改写 `saved`。

## 赋值修改已有结构体对象

继续使用这两个对象。若要让当前位置恢复为保存的快照，可以执行复制赋值（copy assignment），把 `saved` 中的状态赋给已经存在的 `current`：

```cpp
current = saved;
```

这次赋值读取 `saved` 的两个整数，赋给 `current` 中对应的已有成员子对象。执行后，`current` 恢复为横向 `20`、纵向 `10`；两个完整对象仍具有各自身份，之后修改 `current` 也不会改变 `saved`。

> [!IMPORTANT] 建立副本与复制赋值
> **建立副本会创建新对象，复制赋值修改已经存在的对象。**对于这里的简单结构体，`position copy{current};` 创建副本，`current = saved;` 则修改原来的 `current` 及其中已有的成员，保留它们原有的身份。

这里 `saved` 是 `const position` 对象，作为源对象只需要被读取；被修改的是允许赋值的 `current`。把赋值方向反过来，下面这条位于 `main` 中的错误语句须单独考察：

```cpp
saved = current; // 错误：目标对象为 const
```

即使完整对象自身没有声明为 `const`，成员自身的限定仍会约束赋值。下面是独立示例，类型定义放在 `main` 之前，对象定义放在 `main` 中：

```cpp
struct fixed_position {
    const int x{};
    const int y{};
};

const fixed_position source{20, 10};
fixed_position target{source};
```

`source` 和新建的 `target` 都保存横向 `20`、纵向 `10`。`target` 的完整对象类型没有 `const` 限定，但它的两个成员自身都是 `const int`。这些成员可以在对象创建时取得初值，因此建立副本合法。

给这个已有的 `target` 赋值则需要修改已有成员。当前类型由语言默认提供的赋值操作不可用，因为它不能给两个 `const int` 成员赋新值。沿用这组定义，下面的错误语句单独考察：

```cpp
target = source; // 错误：当前类型的默认赋值操作不可用
```

> [!WARNING] 建立副本与给已有对象赋值的条件不同
> 能从已有对象建立副本，不保证能给这种类型的已有对象赋值。对这里由语言提供的赋值，既要允许修改目标对象，也要有可用的逐成员赋值操作。`saved` 的 `const` 限定使第一条错误赋值不成立；`fixed_position` 的 `const int` 成员使第二条默认赋值不可用。两条错误都必须得到编译诊断。

## 成员复制遵循成员自己的语义

指针成员保存的是指针值。判断复制后共享的是什么，需要区分指针成员自身与它指向的外部对象。

一个坐标观察记录可以通过指针读取外部的横向坐标。下面是独立示例：类型定义放在 `main` 之前，其余定义放在 `main` 中，后面的更新与改向片段按顺序接在这些定义之后：

```cpp
struct coordinate_observer {
    const int* target{nullptr};
};

int x{20};

const coordinate_observer primary{&x};
coordinate_observer secondary{primary};
```

`primary` 与 `secondary` 是两个独立的 `coordinate_observer` 对象，各自包含一个独立的指针成员子对象。复制建立 `secondary` 时，复制的是 `primary.target` 的指针值。因此，此时 `primary.target == secondary.target` 为 `true`，两者都指向外部整数 `x`。

接着更新这个外部整数，再通过观察对象读取：

```cpp
x = 35;
const int observed_x{*(secondary.target)};
```

`observed_x` 保存 `35`，`primary` 经自己的指针成员也能观察到相同的值。两个观察对象各自保存的指针值未变；两条路径访问的是同一个外部整数。

现在让副本观察另一份横向坐标，继续在同一个 `main` 中执行：

```cpp
const int other_x{60};
secondary.target = &other_x;
```

这次改向只修改 `secondary` 中的指针成员。`primary.target` 仍指向 `x`，经它读取 `35`；`secondary.target` 改指 `other_x`，经它读取 `60`。先前创建的整数对象 `observed_x` 仍保存 `35`。

| 执行位置 | `primary` 的目标／目标值 | `secondary` 的目标／目标值 |
| --- | --- | --- |
| 刚建立副本 | `x`／`20` | `x`／`20` |
| `x = 35;` 后 | `x`／`35` | `x`／`35` |
| 副本改向后 | `x`／`35` | `other_x`／`60` |

> [!IMPORTANT] 成员复制保留各自类型的语义
> **建立当前结构体的副本时，新对象及其成员子对象各有身份；指针成员复制的是指针值，外部目标仍可能共享。**修改一个指针成员的指向，只改变这个成员自身；经两条指向同一目标的路径读取，得到的是同一个外部对象的当前值。
>
> 给允许赋值的结构体对象进行复制赋值时，指针成员也按指针赋值规则接收源指针值，外部目标不会因此产生副本。

成员语义规定复制后应有的状态，实现可以选择满足这些语义的具体指令。成员值与填充区域、对象表示的关系，见附章[对象布局、对齐与填充](deep-dives/01-object-layout-alignment-and-padding.md#对象表示值表示与填充不是同一层概念)。

## 参考资料

- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：复制构造的成员语义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
