---
title: 隐式对象形参、this 与实现模型（The Implicit Object Parameter, this, and the Implementation Model）
date: 2026-08-29
order: 1
---

# 隐式对象形参、this 与实现模型（The Implicit Object Parameter, this, and the Implementation Model）

沿用[普通函数与成员函数的两种调用方式](../01-member-functions-and-invocation-objects.md#由成员访问表达式发起调用)，下列片段分别对应主线的两版独立程序。普通函数通过显式形参接收需要处理的位置：

```cpp
void move_right(position& target, const int dx);
```

改为成员函数后，调用语法不再把对象写入圆括号：

```cpp
first.move_right(15);
```

对象并没有从调用语义中消失。`first` 是隐含对象实参（implied object argument），它确定本次成员函数调用所作用的对象。C++ 的语言模型、函数体中的 `this` 表达式与具体平台的调用约定从不同层次描述这项关系，三者不能直接合并成“编译器偷偷传入一个指针”。

## 语言模型中的隐式对象形参

下面是独立使用的 `position` 定义，保留横向和纵向两个数据成员，并提供读取、修改横向位置的成员函数。以下坐标与位移仍取非负的小整数，并保证相加结果可由 `int` 表示。读取函数的尾随 `const` 约束它通过调用对象进行的访问：函数不能通过这条路径修改对象的普通成员子对象，因此也能接收 `const` 对象的调用。

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

这两个函数属于隐式对象成员函数（implicit object member function）。

> [!IMPORTANT] 隐式对象形参与调用对象的访问要求
> 在函数匹配的语义模型中，这类函数具有一个隐式对象形参（implicit object parameter）。**隐含对象实参需要能够与隐式对象形参绑定。**对于这里的左值对象调用：
>
> | 成员函数 | 隐式对象形参所表达的当前访问 |
> | --- | --- |
> | `move_right` | `position&` |
> | `current_x() const` | `const position&` |
>
> 非 `const` 的 `position` 对象可以提供这两种访问；`const position` 对象只能提供只读访问，因此不能调用 `move_right`。
>
> 这些引用类型描述函数匹配的要求，不是源码中实际声明出来的首形参，也不规定机器调用如何实现。上表只覆盖这里的左值对象调用。

## 函数体中的 this 表达式

这里的隐式对象成员函数可以使用 `this` 表达式，取得指向当前调用对象的指针值。上面两个成员函数也可以在 `struct` 内写成以下形式：

```cpp
int current_x() const {
    return this->x;
}

void move_right(const int dx) {
    this->x += dx;
}
```

在当前 `position` 成员函数中：

| 函数语境 | `this` 的类型和值类别 | `*this` |
| --- | --- | --- |
| 非 `const` 成员函数 | `position*` 类型的 prvalue | 指定调用对象的 `position` 类型 lvalue |
| `const` 成员函数 | `const position*` 类型的 prvalue | 指定调用对象的 `const position` 类型 lvalue |

执行 `first.move_right(15)` 时，`this` 指向 `first`。成员函数体中的 `this->x` 与调用处的 `first.x` 指定同一个成员子对象。

`this->x` 与 `(*this).x` 指定同一个成员子对象。未限定的成员名称在当前语境中也按照调用对象解释，因此读取函数可以直接写：

```cpp
return x;
```

而不必机械添加 `this->`。

> [!IMPORTANT] 隐式对象形参与 this 分属不同层次
> **隐式对象形参用于描述调用匹配；`this` 是指向当前调用对象的指针纯右值表达式，不是指针变量。**前者规定调用对象需要提供什么访问，后者让函数体显式取得指向该对象的指针值。

## this 不是对象中的隐藏成员

> [!IMPORTANT] this 不是成员子对象
> **`this` 是指向调用对象的表达式，不是对象中的指针成员。**成员函数能够使用 `this`，不意味着每个对象都因此增加一个指针大小的隐藏字段。

数据成员与调用期间的 `this` 因而具有不同角色：

```text
position 对象
├── x    横向位置成员子对象
└── y    纵向位置成员子对象

成员函数调用期间
└── this            指向调用对象的表达式结果，不是成员子对象
```

`this` 不拥有对象，不会延长调用对象的生命周期；成员调用仍然要求目标对象处于可以访问的生命周期阶段。

## ABI 可以用地址实现调用

[应用二进制接口：编译产物之间的契约（Application Binary Interface）](../../05-functions/deep-dives/02-application-binary-interface.md#abi-固定分别编译边界) 规定编译结果怎样在具体平台上协作。Itanium C++ ABI 等实际接口会把对象地址作为本章这种成员函数调用的隐式 `this` 参数传递，调用方与被调函数按同一约定解释这个值。

这是一种二进制实现契约，而不是 C++ 源码把成员函数定义成普通函数加指针参数的规则。目标平台可以把地址放入寄存器或栈中的约定位置，具体传递方式应查目标平台的 ABI。

> [!WARNING] 源码中的成员调用不保证独立的机器调用
> **从 `first.move_right(15)` 不能推出运行时一定存在一次独立的函数调用和一次对象地址传递。**编译器可以把被调函数的工作合并进调用位置，使程序完成相同的操作，却不执行独立调用或参数传递。ABI 规定编译产物在实际调用边界上怎样配合，不要求每个源码调用都保留为独立的机器调用。

四个层次可以这样区分：

| 层次 | 当前模型回答的问题 |
| --- | --- |
| 调用语法 | 哪个对象作为本次调用的目标 |
| 隐式对象形参 | 这个对象能否满足相应成员函数的访问要求 |
| `this` 表达式 | 函数体怎样显式取得当前对象的地址 |
| ABI 调用约定 | 编译结果怎样在特定平台上传递实现调用所需的信息 |

保持这四层分离，既能用 `(*this).member` 理解成员访问的语言语义，也不会把某一种 ABI 的实现选择误认为所有 C++ 程序都必须具有的物理结构。

## 参考资料

- [C++23 工作草案：成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct)
- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：隐式对象形参](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general)
- [C++23 工作草案：this 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.this)
- [Itanium C++ ABI：this 参数](https://itanium-cxx-abi.github.io/cxx-abi/abi.html#this-parameters)
