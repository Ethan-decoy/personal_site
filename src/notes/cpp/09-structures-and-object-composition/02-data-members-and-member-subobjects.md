---
title: 数据成员与成员子对象（Data Members and Member Subobjects）
date: 2026-08-28
order: 2
---

# 数据成员与成员子对象（Data Members and Member Subobjects）

下面的 `position` 定义中，`int x;` 和 `int y;` 声明数据成员（data member），规定一份位置包含哪些分量。每创建一个 `position` 对象，其中就有分别保存横向、纵向位置的两个整数对象，称为这个位置对象的成员子对象（member subobject）。

## 成员声明与成员子对象

下面是完整程序。`first` 的位置可以更新，`second` 在这里仅供读取：

```cpp
struct position {
    int x;
    int y;
};

int main() {
    position first{20, 10};
    const position second{60, 10};
}
```

一个对象如果不是任何其他对象的子对象，就称为完整对象（complete object）。本例的 `first` 和 `second` 都是完整对象，它们内部的两个整数成员各自形成成员子对象。

类型定义中只有一条 `x` 成员声明，但两个完整对象分别包含自己的横向位置数据：

```text
first                 second
├── x    20           ├── x    60
└── y    10           └── y    10
```

> [!IMPORTANT] 成员声明与成员子对象
> **成员声明规定类型的结构；成员子对象属于某个实际创建的对象。**一条 `x` 成员声明可以对应不同 `position` 对象中各自的整数成员。成员子对象具有自己的类型、身份、当前值和生命周期。

## 通过对象访问成员

成员访问运算符（member access operator）`.` 根据左操作数指定的对象选择成员。把下面的片段接在开篇 `main` 中的两条对象定义之后：

```cpp
const int saved_x{first.x};
first.x = 35;
```

名称表达式 `first` 是 `position` 类型的 lvalue，指定已有的位置对象。表达式 `first.x` 是 `int` 类型的 lvalue，进一步指定其中的横向位置成员；初始化 `saved_x` 时读取它的当前值，赋值则修改这个成员子对象。

执行后，`first.x` 保存 `35`，`saved_x` 仍保存先前读取的 `20`，`second.x` 仍为 `60`。两个完整对象的成员不会因为名称相同而自动同步。

> [!IMPORTANT] 成员访问先确定对象，再确定成员
> **`.` 左侧的表达式确定当前对象，右侧的名称确定该对象中的成员。**`first.x` 与 `second.x` 指定不同对象中的成员。这里用于选择成员的类对象既可以是完整对象，也可以是另一个对象的成员子对象。

## const 完整对象限制成员访问

保留开篇的类型定义，用下面的独立片段替换 `main` 的函数体：

```cpp
const position baseline{0, 0};
const int saved_x{baseline.x};
```

`saved_x` 读取到 `0`。虽然类型定义中的成员声明写的是 `int x;`，但 `baseline` 是 `const position` 对象，成员访问表达式 `baseline.x` 是 `const int` 类型的 lvalue。普通整数赋值要求左侧是可修改的 lvalue，这条路径因 `const` 而不满足要求。沿用这组定义，下面的错误语句单独考察：

```cpp
baseline.x = 5; // 错误：不能经 const 对象修改成员
```

只读引用也可以限制访问，而不改变原对象的类型。下面是另一段独立的 `main` 函数体，仍使用相同的 `position` 定义：

```cpp
position current{20, 10};
const position& observed{current};

const int saved_x{observed.x};
current.x = 35;
```

`observed` 与 `current` 指定同一个完整对象。`current.x = 35;` 可以修改原对象，此后经 `observed.x` 读取也得到 `35`；独立的 `saved_x` 仍保存 `20`。沿用这些定义，下面这条语句被拒绝：

```cpp
observed.x = 40; // 错误：引用提供只读访问路径
```

把这两组独立示例中的成员访问并排比较，成员声明相同，表达式的类型和修改权限却不完全相同：

| 成员访问表达式 | 表达式类型与值类别 | 指定的成员子对象 | 能否经该表达式修改 |
| --- | --- | --- | --- |
| `baseline.x` | `const int` lvalue | `baseline` 中的 `x` | 不可以 |
| `current.x` | `int` lvalue | `current` 中的 `x` | 可以 |
| `observed.x` | `const int` lvalue | 与 `current.x` 相同的成员 | 不可以 |

> [!IMPORTANT] 对象与访问路径的 const 约束
> **对本例的普通整数成员，成员访问表达式会保留 `.` 左侧表达式的 `const` 访问约束。**`baseline.x`、`observed.x` 都是 `const int` lvalue，不能通过这些路径修改成员，也不能直接用它们初始化可写的 `int&`。只读引用不会把直接绑定的普通对象变成 `const` 对象；其他允许修改的路径仍可改变它。

> [!WARNING] 公有成员仍受 const 约束
> `struct` 成员默认公有，允许在类外访问，但这不提供绕过 `const` 的修改权限。上面的两条错误赋值都必须得到编译诊断，不能把它们理解为执行后没有效果。

## 成员的存储期随完整对象

成员子对象使用完整对象内部的存储，其存储期与完整对象相同。离开定义这些局部位置对象的代码块时，它们及其中的整数成员都会结束生命周期。

> [!IMPORTANT] 成员子对象的身份与存储期
> **成员子对象具有独立身份，但它是完整对象的一部分，其存储期随完整对象。**经名称、引用或指针找到某个成员，都不会把它从所属对象的生命周期关系中分离出来。

取得成员的地址，可以让指针直接指向这个整数成员。下面是独立的错误示例，沿用开篇的 `position` 定义，用它替换 `main` 的函数体；最后一行仅作错误分析，不作为正常程序执行：

```cpp
int* target{nullptr};

{
    position current{20, 10};
    target = &current.x;
    *target = 35; // 有效：current 及其 x 成员仍在生命周期内
}

const int saved_x{*target}; // 未定义行为：原成员的生命周期和存储期均已结束
```

这里的 `&current.x` 读作 `&(current.x)`：先确定 `current` 中的 `x` 成员，再取得这个整数成员的地址。内层代码块中，`*target = 35;` 修改的就是 `current.x`，`current.y` 仍为 `10`。离开代码块后，`current` 及其成员结束生命周期，外层的指针对象 `target` 仍然存在，却失去了原来的有效目标，成为悬空指针。

> [!WARNING] 成员地址不能使成员独立存活
> 保存这里已有成员的地址，不会延长局部位置对象或其中成员的生命周期。离开内层代码块后，`target` 没有自动变为空指针，但原成员的存储期已经结束；此后对这个旧指针值执行间接访问会产生未定义行为。这项错误不要求编译器给出诊断，不能以编译成功作为访问有效的依据。

## 参考资料

- [C++23 工作草案：对象与子对象](https://timsong-cpp.github.io/cppwp/n4950/intro.object)
- [C++23 工作草案：类成员与数据成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++23 工作草案：存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.general)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
