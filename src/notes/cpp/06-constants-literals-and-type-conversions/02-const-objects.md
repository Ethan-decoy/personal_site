---
title: const 限定对象（Const-Qualified Objects）
date: 2026-08-14
---

# const 限定对象（Const-Qualified Objects）

## 把“不应再改变”写进类型

普通对象完成初始化后，通常还可以通过赋值改变当前值：

```cpp
int maximum_attempts{3};
maximum_attempts = 5;
```

如果对象建立初始状态后就不应再改变，可以在类型中加入 `const`：

```cpp
const int maximum_attempts{3};
```

`const` 是类型限定符（type qualifier）。对象名称仍是 `maximum_attempts`，基础类型仍是 `int`，完整类型则是 `const int`，即受到 `const` 限定的 `int` 类型。

`const int first_limit{3};` 与 `int const second_limit{3};` 中的两种排列表示同一种类型，当前笔记统一采用前者。`const` 也能限定其他基本类型，例如 `const double`、`const char` 和 `const bool`。

## 必须建立初始值

对于当前讨论的基本类型，`const` 对象必须在定义时完成初始化：

```cpp
const int maximum_attempts; // 错误：没有初始化器
```

不能先创建一个没有确定值的 `const int`，再通过赋值补上初始值，因为初始化一旦结束，对象就不再允许被赋值。正确做法是像 `const int maximum_attempts{3};` 一样，让有效状态与对象一起建立。花括号仍然执行直接列表初始化；`const` 不会放宽类型检查。

## 初始化后不能再修改

对象完成初始化后，直接修改 `const` 对象的表达式不合法：

```cpp
const int maximum_attempts{3};
maximum_attempts = 5;  // 错误：赋值会修改对象
maximum_attempts += 1; // 错误：复合赋值会修改对象
```

赋值、复合赋值以及自增、自减都会尝试修改对象。这不是只供读者遵守的注释，而是类型系统中的约束，编译器能在这些直接修改发生的位置给出诊断。

`const` 限定的是对象，不是数值本身。两个对象即使恰好都保存 `3`，也各自拥有自己的类型与修改权限：

```cpp
const int maximum_attempts{3};
int current_attempts{3};

current_attempts = 2; // 正确：修改的是另一个普通 int 对象
```

## 读取不等于修改

不能修改 `const` 对象，不代表不能使用它。读取其当前值并参与不修改对象的表达式完全正常：

```cpp
const int wheel_count{4};
int axle_count{wheel_count / 2};
bool has_multiple_wheels{wheel_count > 1};
```

除法和比较读取 `wheel_count` 保存的值，却没有把新状态写回这个对象。也可以用 `const` 对象的值初始化新的普通对象：

```cpp
const int recorded_pressure{240};
int editable_pressure{recorded_pressure};

editable_pressure = 220;
```

`editable_pressure` 是新建的独立 `int` 对象。初始化只读取了 `recorded_pressure` 当时的值，没有把 `const` 限定自动传播给新对象；之后修改 `editable_pressure` 不会影响 `recorded_pressure`。

## 初始值可以在运行时取得

`const` 只要求对象在初始化后不可修改，并不要求初始值必须在编译时确定：

```cpp
int normalize_limit(int requested_limit) {
    const int session_limit{
        requested_limit > 0 ? requested_limit : 3
    };
    return session_limit;
}
```

每次调用 `normalize_limit` 时，`session_limit` 的初始值都由本次调用在运行时收到的实参决定；初始化完成后，它在本次调用中保持不变。“运行时才取得”与“取得以后保持不变”并不矛盾：前者描述初始值何时产生，后者描述对象建立之后允许哪些操作。

也不能因为编译器可能通过优化提前推断某个结果，就把所有 `const` 对象视为编译期常量。哪些表达式能用于语言明确要求编译期确定的语境，应按[常量表达式与 `constexpr`](03-constant-expressions-and-constexpr.md)中的规则判断。

## 作用域与生命周期不变

`const` 只改变对象允许进行的操作，不改变名称的作用域，也不改变对象的存储期或生命周期。函数中的局部 `const` 对象在每次调用时仍会独立建立，并在离开相应代码块时结束生命周期。相关规则参见[复合语句、块作用域与局部对象生命周期](../03-blocks-scope-and-lifetime/01-compound-statements-block-scope-and-local-object-lifetime.md)。

## const 不增加运行时状态

对于同一个基础类型，`const int` 与 `int` 具有相同的表示和对齐要求。`const` 对象不需要额外保存一个“不可修改”标记；这项约束由类型系统表达，并由编译器检查代码是否遵守。

`const` 也不保证对象一定放在物理只读的内存区域。实现可以按照程序行为把局部对象放在普通存储中、保留在寄存器中，甚至在不影响可观察结果时不为它单独分配存储。这些实现与优化选择都不改变语言约束：程序仍然不能通过普通表达式修改 `const` 对象。

## 按值 const 形参

按值形参是由实参结果初始化出来的独立参数对象，因此也可以把这个对象声明为 `const`：

```cpp
int remaining_count(const int total, const int used) {
    return total - used;
}
```

函数体可以读取 `total` 和 `used`，但 `total -= used;` 之类的写法不合法，因为它会修改 `const` 参数对象。这里的 `const` 保护函数内部的参数对象，而不是调用者的对象。即使形参没有 `const`，按值传递本来就会建立独立对象；修改普通按值形参也不会自动修改实参对象。

对于函数对外呈现的参数类型，按值形参的顶层 `const`（top-level const），也就是直接限定参数对象本身的 `const`，不用于区分函数。所以下面的声明与定义可以对应同一个函数：

```cpp
int remaining_count(int total, int used);

int remaining_count(const int total, const int used) {
    return total - used;
}
```

声明只需说明调用者传入两个 `int` 值；定义中的 `const` 表达实现不准备重新赋值给自己的参数对象。对于需要在实现中逐步调整的按值参数，省略 `const` 也很自然。是否加入它，应由保护内部状态是否确实提高了清晰度决定，而不是机械套用。

## 命名常量

具有名称的 `const` 对象常被用作命名常量（named constant）：

```cpp
const int maximum_attempts{3};
int current_attempts{1};
bool can_retry{current_attempts < maximum_attempts};
```

与直接在条件中写 `3` 相比，`maximum_attempts` 说明这个数值代表允许的最大尝试次数；同一规则在多个位置使用时，也能把数值集中在一个声明中。

名称应当描述业务含义，而不是重复类型或数值。`maximum_attempts` 比 `constant_three` 更有信息。`const` 也不要求名称全部使用大写字母，当前笔记继续遵循项目的蛇形命名风格。

命名常量不一定来自字面量：

```cpp
int requested_capacity{12};
const int accepted_capacity{requested_capacity};
```

`accepted_capacity` 表达“本次已经接受、之后不再改变的容量”。即使具体值要到运行时才知道，这个名称和约束仍然有意义。

## 使用原则

当对象在完成初始化后继续变化属于正常状态转换时，使用普通对象；当后续变化意味着程序破坏了自己的设计约束时，使用 `const`。局部计算结果、配置快照和一次调用期间保持不变的值通常适合 `const`，计数器和逐步累积的结果则应保留为可修改对象。

相关规则可参阅 C++23 工作草案 N4950 中的[cv 限定类型的性质](https://timsong-cpp.github.io/cppwp/n4950/basic.type.qualifier)、[`const` 类型限定](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)、[函数参数类型的形成](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)、[块作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.block)与[自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)。
