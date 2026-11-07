---
title: const 成员函数与只读访问（Const Member Functions and Read-Only Access）
date: 2026-08-29
order: 2
---

# const 成员函数与只读访问（Const Member Functions and Read-Only Access）

绘图程序既需要移动位置，也需要在不改变位置的情况下读取横向坐标。`move_right()` 需要修改调用对象，`current_x()` 则只需读取它。成员函数可以在参数列表之后写出 `const`，把只读访问约束声明为接口的一部分。

下面的 `position` 定义放在函数外，独立于上一节的定义使用。坐标与位移取非负的小整数，并保证相加结果可由 `int` 表示：

```cpp
struct position {
    int x;
    int y;

    int current_x() const {
        return x;
    }

    void move_right(const int dx) {
        x += dx;
    }
};
```

`current_x` 是 const 成员函数（const member function）：`int` 是返回类型，空的 `()` 表示没有普通形参，括号后的 `const` 限定通过调用对象进行的访问。`move_right` 没有这项限定，因而可以通过可修改的调用对象更新 `x`。

> [!IMPORTANT] 尾随 const 约束通过调用对象进行的访问
> **本节这种成员函数的尾随 `const` 约束对调用对象的访问，不修饰返回类型。**在 `current_x() const` 中，`x`、`y` 这样的成员子对象可以经当前对象读取，不能经这条路径修改；返回的仍是普通 `int` 值。

## const 对象只能提供受限访问

以下正常片段位于同一个 `main` 函数体中，使用开篇的 `position` 定义：

```cpp
position current{20, 10};
const position fixed{60, 10};
const position& view{current};

const int before{current.current_x()};
current.move_right(15);
const int after{view.current_x()};
const int fixed_x{fixed.current_x()};
```

`current` 是可以修改的位置对象；`fixed` 本身是 `const position` 对象；`view` 是绑定到 `current` 的只读引用，没有创建另一个位置对象。

第一次读取使 `before` 保存 `20`。移动后，`current.x` 变为 `35`，`current.y` 仍为 `10`；经 `view` 再读取同一个对象，`after` 得到 `35`。`before` 保存先前复制出的整数，仍为 `20`。`fixed.current_x()` 则使 `fixed_x` 得到 `60`，没有改变 `fixed`。

三条访问路径的调用资格不同：

| 调用所用的表达式 | 实际指定的对象 | 能否调用 `current_x() const` | 能否调用 `move_right` |
| --- | --- | --- | --- |
| `current` | 可修改的 `current` | 可以 | 可以 |
| `fixed` | `const` 对象 `fixed` | 可以 | 不可以 |
| `view` | 同一个可修改对象 `current`，但当前路径只读 | 可以 | 不可以 |

> [!IMPORTANT] 调用资格取决于当前访问路径
> **对于这里的成员函数和左值调用，非 `const` 路径可以调用 `const` 或非 `const` 成员函数；`const` 路径只能调用 `const` 成员函数。**实际对象可修改，也不能经只读路径调用本例的 `move_right`。调用一次 `const` 成员函数不会改变原对象的类型或使它永久只读。

沿用正常示例的定义，下面两条错误语句分别单独考察，不接入正常代码：

```cpp
fixed.move_right(15); // 错误：fixed 是 const 对象
view.move_right(15);  // 错误：view 只提供 const 访问
```

限制针对声明所要求的调用资格。编译器不会因为某次调用可能没有改变数值，就放行这类调用。

> [!WARNING] 函数体只读不等于声明了 const 接口
> **成员函数能否通过只读路径调用，要看声明中的限定，不能只看函数体有没有赋值。**如果只把开篇的 `int current_x() const` 改成 `int current_x()`，即使函数体仍然只有 `return x;`，`fixed.current_x()` 和 `view.current_x()` 也都会编译失败。需要让查询操作支持只读路径时，应在声明中提供尾随 `const`。

## 函数体受到同一项约束

尾随 `const` 同样约束函数的实现。把开篇 `position` 中的 `current_x` 单独替换为以下错误定义：

```cpp
int current_x() const {
    x = 0; // 错误：不能经当前对象的 const 访问路径修改 x
    return x;
}
```

即使调用处使用的是可修改的 `current`，这个函数体仍然不合法。函数已经声明只按 `const` 接口访问调用对象，编译器必须诊断其中对 `x` 的赋值。同样，在该函数体中直接调用 `move_right(0)` 也不合法：它要求可修改的调用对象，而当前路径不能提供这种访问；传入 `0` 不会改变这一要求。

这与 [`const` 左值引用的访问约束](../08-object-identity-and-lvalue-references/03-const-lvalue-references-and-access-constraints.md#const-限定被引用类型)一致：受限的是经当前路径执行的操作。尾随 `const` 不会让函数的所有局部变量一并变成 `const`；本节的正常示例也已经表明，原来的可修改对象仍可经其他允许的路径改变。

## 外部对象仍然可能改变

成员子对象与指针所指的外部对象需要分开判断。`position_handle` 保存一个指向外部位置的非拥有指针；固定这个访问入口的指向，不等于固定外部位置。

下面另设独立的 `main`，仍使用开篇的正常 `position` 定义。先在函数外定义 `position_handle`：

```cpp
struct position_handle {
    position* target;

    void move_right(const int dx) const {
        target->move_right(dx);
    }
};
```

在这个独立的 `main` 函数体内使用它：

```cpp
position current{20, 10};
const position_handle handle{&current};

handle.move_right(15);
```

`target` 由 `&current` 初始化，调用期间非空，且 `current` 仍然存活。`handle.move_right(15)` 合法：被修改的是外部的 `current`，不是 `handle` 中保存的指针。调用后，`current.x` 为 `35`，`current.y` 仍为 `10`，`handle.target` 仍指向 `current`。

若在 `position_handle` 的 `move_right` 函数体内加入下面的语句，则会被拒绝：

```cpp
target = nullptr; // 错误：试图改写调用对象中的指针成员
```

读取 `target` 保存的指针值与给 `target` 赋值是不同操作。通过 `const` 调用对象访问这个指针成员，不能改写指针成员本身；但读出的值仍允许访问非 `const` 的 `position`。这与 [`int* const` 固定指向而不冻结目标](../07-object-addresses-and-pointers/06-pointers-and-const-qualification.md#const-指针固定指向关系)的两层限制一致。

> [!WARNING] const 不会自动传播到指针所指对象
> **`const` 对象中的普通指针成员不能经这条路径改写，不代表它指向的外部对象也变成了 `const`。**只要所指类型允许修改，且目标在访问时有效，`const` 成员函数仍可能通过该指针修改外部对象；不能仅凭尾随 `const` 判断函数没有副作用。
>
> 若要限制这条指针路径对外部位置的修改，应把成员声明为 `const position* target`。这时可以经它调用 `current_x()`，不能经它调用 `move_right()`。两种声明都不负责延长外部对象的生命周期。

## 参考资料

- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：调用对象与隐式对象形参](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general)
- [C++23 工作草案：成员访问与 const 传播](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++23 工作草案：cv 限定符与访问路径](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
