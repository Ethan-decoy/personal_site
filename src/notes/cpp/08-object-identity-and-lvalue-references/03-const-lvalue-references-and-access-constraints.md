---
title: const 左值引用与访问约束（Const Lvalue References and Access Constraints）
date: 2026-08-28
order: 3
---

# const 左值引用与访问约束（Const Lvalue References and Access Constraints）

`const int&` 可以为已有整数对象建立只读访问路径：允许通过引用读取对象，但禁止经该引用修改对象。它与 `int&` 都是左值引用（lvalue reference），都在初始化时建立绑定，之后都不能改换绑定目标。

这里讨论对已经存在的普通 `int`、`const int` 对象的直接绑定。以下代码片段均位于 `main` 的函数体内，正常片段按顺序接续；错误语句单独考察，表格中的声明仅作对照。

## const 限定被引用类型

```cpp
int value{7};
int& alias{value};
const int& view{value};
```

`const int&` 读作“对 `const int` 的左值引用”。`const` 属于类型描述中的 `const int`，限定的是经该引用访问整数时允许的操作。这里没有创建新的 `const int` 对象，`alias` 和 `view` 都绑定到同一个 `value`。

对照上面的两条引用声明：

| 引用声明 | 名称表达式的类型 | 值类别 | 能否经该名称修改整数 |
| --- | --- | --- | --- |
| `int& alias{value};` | `int` | lvalue | 可以 |
| `const int& view{value};` | `const int` | lvalue | 不可以 |

两名称的表达式都是 lvalue，都指定原来的 `value`。不过，内建整数赋值要求左操作数是可修改的 lvalue；`view` 的表达式类型带有 `const`，不满足这个要求。

> [!IMPORTANT] const 限定被引用类型
> **`const int&` 中的 `const` 限定被引用类型，使引用名称形成只读访问路径。**`int&` 与 `const int&` 都保持初始化时的绑定，是否允许经当前路径修改整数则由被引用类型的限定决定。

## 受限访问不会改变原对象类型

`view` 绑定的仍是普通 `int` 对象 `value`。接着先保存一份当前值，再分别通过原名称和可写引用修改对象：

```cpp
const int saved{view};

value = 9;
alias = 11;

const int current{view};
```

`saved` 是读取 `view` 指定对象后创建的独立对象。`value` 的原类型允许修改，`alias` 也提供允许修改的路径，因此两条赋值都成立：

| 执行位置 | `value` 的值 | 此时通过 `view` 读取 | `saved` 的值 |
| --- | --- | --- | --- |
| `saved` 初始化后 | `7` | `7` | `7` |
| `value = 9;` 后 | `9` | `9` | `7` |
| `alias = 11;` 后 | `11` | `11` | `7` |

最后，`current` 从 `view` 指定的同一对象读取到 `11`，而 `saved` 仍保存独立的整数 `7`。只读引用持续访问原对象，值对象则保存自己的状态。

> [!IMPORTANT] 只读路径与原对象的可修改性
> **直接绑定到已有 `int` 对象的 `const int&` 保留该对象的身份，只限制经引用进行的修改。**原对象仍可通过其他允许的路径改变，之后经只读引用读取的是同一对象的当前值；复制得到的值对象保存独立状态。

沿用这些定义，下面的错误语句单独考察：

```cpp
view = 13; // 错误：左侧不是可修改的 lvalue
```

这条赋值仍试图修改 `value`，但左侧使用的是类型为 `const int` 的名称表达式 `view`。编译器必须诊断该语句，不能把它当作正常示例中的一次赋值执行。

## const 对象只能提供受限访问

再声明一个本身带有 `const` 限定的整数对象，并把只读引用绑定到它：

```cpp
const int limit{20};
const int& limit_view{limit};
```

通过 `limit_view` 可以读取 `20`。与前面的普通 `int` 对象不同，`limit` 本身不允许在初始化后被修改，直接使用名称 `limit` 也不能给它赋新值。

普通 `int&` 不能绑定到这个对象。以下是独立考察的错误语句：

```cpp
int& limit_alias{limit}; // 错误：不能通过引用初始化丢弃 const
```

如果允许这项绑定，就能经 `limit_alias` 给原来的 `const int` 对象赋值，绕过对象类型的限制。C++ 因而拒绝这种初始化。

## 只读路径不能提供可写引用

访问约束还要按初始化表达式的类型判断。前面的 `view` 实际绑定普通 `int` 对象 `value`，但名称表达式 `view` 的类型是 `const int`。因此，下面的引用初始化同样不成立：

```cpp
int& writable{view}; // 错误：初始化表达式带有 const 访问限制
```

这里没有把 `value` 变成 `const` 对象。被拒绝的是试图通过 `view` 这条只读路径建立可写引用；原先的 `int& alias{value};` 仍然合法，因为它直接使用类型为 `int` 的 lvalue `value`。

这三种初始化器可以并排判断：

| 初始化表达式 | 类型与值类别 | 实际指定的对象 | 能否直接初始化 `int&` |
| --- | --- | --- | --- |
| `value` | `int` lvalue | 普通 `int` 对象 `value` | 可以 |
| `view` | `const int` lvalue | 同一个普通 `int` 对象 `value` | 不可以 |
| `limit` | `const int` lvalue | `const int` 对象 `limit` | 不可以 |

> [!IMPORTANT] 引用初始化保留 const 访问约束
> **在这里对已有整数对象的直接绑定中，普通 `int&` 不能用 `const int` lvalue 初始化。**初始化表达式即使指定实际可修改的对象，也不能通过普通引用初始化丢弃这条路径上的 `const`；是否能修改原对象与能否从当前路径取得可写引用，需要分别判断。

## 引用与指针的 const 访问约束

沿用 `value` 和 `view`，再建立一条指向同一对象的只读指针路径：

```cpp
const int* target{&value};
```

`view` 与 `*target` 都具有 `const int` 类型，都不允许经该表达式修改整数。引用绑定与指针值状态则有不同规则：

| 性质 | `const int&` 引用 `view` | `const int*` 指针 `target` |
| --- | --- | --- |
| 读取目标 | 使用 `view` | 使用 `*target`，要求指针当时可用于访问目标 |
| 经当前路径修改目标 | 不允许 | 不允许 |
| 改换目标 | 不能重新绑定 | 可以给指针对象赋新指针值 |
| 正常的空状态 | 没有 | 可以保存空指针值 |

这里 `target` 的指针对象自身没有 `const` 限定，因此接着给它赋新指针值是合法的：

```cpp
target = &limit;
```

执行后，`target` 指向 `limit`，经 `*target` 可以读取 `20`；`view` 仍绑定 `value`，读取到的仍是 `11`。

把下面这条语句作为错误示例单独考察：

```cpp
view = limit; // 错误：这是经只读路径给 value 赋值，不是重新绑定
```

这条赋值的左侧仍指定原来的 `value`，但 `view` 不允许修改它，因此赋值被拒绝。`const` 没有改变赋值的含义。

指针对象还可以继续保存空指针值：

```cpp
target = nullptr;
```

此时不能对 `target` 执行间接访问。`view` 仍可读取 `value`，因为它绑定的对象仍在生命周期内；如果被绑定对象先结束生命周期，引用会悬空，之后经它读取原对象的行为未定义。

> [!IMPORTANT] 只读约束与目标有效性
> **`const` 限制通过访问路径修改对象，不负责证明目标存在或仍然存活。**对于这里直接绑定或指向的已有对象，引用和指针都不负责维持其生命周期；只读引用也可能悬空，只读指针也可能为空或悬空。

## 参考资料

- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++23 工作草案：表达式类型](https://timsong-cpp.github.io/cppwp/n4950/expr.type)
- [C++23 工作草案：赋值与复合赋值](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
