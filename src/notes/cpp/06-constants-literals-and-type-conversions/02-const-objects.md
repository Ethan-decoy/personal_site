---
title: const 对象（Const Objects）
date: 2026-08-27
order: 2
---

# const 对象（Const Objects）

## 初始化后不再修改

当前数量可以随着处理过程增加，数量上限则应在确定后保持不变。用 `count` 保存当前数量，用 `limit` 保存上限：

除完整程序外，以下代码片段均放在 `main` 函数体内；注明沿用时保留对应声明，其余片段彼此独立。

```cpp
const int limit{4};
int count{3};

++count;
```

`const` 是类型限定符（type qualifier），这里使 `limit` 的类型成为 `const int`。`limit` 初始化为 4，之后只供读取；`count` 的类型仍是 `int`，可以递增。执行后，两个对象保存的数值都是 4，但它们允许的操作不同。

> [!IMPORTANT] const 把修改限制纳入对象类型
> **对于这里的基本类型对象，`const` 是类型的一部分：对象可以被初始化和读取，初始化完成后不能再通过赋值、自增或自减修改。**赋相同的值仍属于赋值，同样不允许。

沿用 `limit` 的声明，下面两条语句分别演示不合法的修改：

```cpp
limit = 5; // 错误：不能给 const 对象赋值
++limit;   // 错误：不能递增 const 对象
```

这些语句在语言上不合法，编译器必须诊断，不能把它们当作“执行后没有效果”的操作。即使把第一行改成 `limit = 4;`，仍然不合法：赋相同的值也要求目标对象允许修改。

## 定义时建立初始值

初始化在对象创建时建立初始状态，赋值则修改已经存在的对象。`const` 限制创建后的修改，不妨碍创建时进行初始化。

下面这条局部对象定义本身就不合法：

```cpp
const int limit; // 错误：定义 const int 对象时没有提供初始化器
```

这里不能先留下一个没有初值的 `const int` 对象，再通过后续赋值补上初值。如果初始值确实为 0，可以使用空花括号：

```cpp
const int limit{};
```

空花括号仍然是初始化器，在这里使 `int` 对象以 0 初始化；这与完全省略初始化器不同。

> [!IMPORTANT] const 基本类型对象在定义时初始化
> **定义这里的 `const int` 等基本类型对象时，需要在创建时建立确定的初始状态。**初值可以由字面量、其他对象的值或计算结果提供，也可以用空花括号为 `int` 提供零值；不能把初始化推迟成对象创建后的赋值。

## const 对象仍然是对象

`const` 对象仍然具有自己的类型、身份、生命周期和值。读取它的值，可以用来初始化另一个独立对象：

```cpp
const int source{4};
int target{source};

target = 7;
```

第一行创建保存 4 的 `const int` 对象 `source`。第二行读取这个值，初始化类型为 `int` 的新对象 `target`。第三行只修改 `target`，因此最后 `source` 仍为 4，`target` 为 7。

> [!IMPORTANT] 新对象的修改限制由自己的类型决定
> **用 `const` 数值对象的值初始化另一个独立对象，不会自动把 `const` 附加到新对象上。**新对象是否允许修改，由它自己的类型决定；修改可变副本，也不会修改原来的 `const` 对象。

这里的 `4` 是 `int` 字面量，`source` 则是用于访问 `const int` 对象的名称。二者可以提供相同数值，但 `const` 不会把对象名称变成字面量，也不是把源代码中的名称直接替换成数字。

## const 不等于编译期常量

`const` 对象的初值也可以在执行过程中从普通可修改对象中取得。下面的完整程序先保存 `requested` 当时的值，再修改 `requested`：

```cpp
#include <iostream>

int main() {
    int requested{3};
    const int limit{requested};

    requested = 5;

    std::cout << requested << ' ' << limit << '\n'; // 5 3
    return 0;
}
```

`limit` 正确地初始化为 3，之后保持这个值。`requested` 改为 5，不会重新执行 `limit` 的初始化，也不会使它自动更新。`const` 限制的是初始化完成后的修改，允许初值来自这样的读取或其他计算。

但“初始化后不可修改”不足以满足所有编译期要求。常量表达式（constant expression）还必须符合语言规定的额外求值限制，例如 `switch` 的 `case` 标签就有相应要求。下面是一个独立的错误片段：

```cpp
int requested{3};
const int limit{requested};

switch (requested) {
case limit: // 错误：limit 的值不能用于这里要求的常量表达式
    break;
default:
    break;
}
```

虽然 `limit` 不可修改，但它的初值读取了普通可修改对象 `requested`，不满足这里的常量表达式要求。即使编译器通过优化很容易提前算出 3，也不会改变这项语言规则，`case limit:` 仍然不合法。

如果仅把上面第二行改为 `const int limit{3};`，在这里的同一作用域中，`limit` 就可以用于 `case` 标签：这个 `const int` 对象使用满足常量表达式要求的值初始化。因此，也不能把 `const` 理解为“只能在运行期使用”。

> [!IMPORTANT] 不可修改与常量表达式是两项判断
> **`const` 约束对象初始化后的修改，不单独保证它的值可以用于常量表达式。**判断能否用于 `case` 等位置，还要检查类型、初始化方式等常量表达式条件；编译器是否能够通过优化提前算出结果，不能代替这些条件。

`const` 整数对象参与常量求值的条件，见[常量表达式与 constexpr 中的精确边界](03-constant-expressions-and-constexpr.md#const-整数对象的精确边界)。

## 用类型表达稳定性

开篇执行后，`count` 与 `limit` 都保存 4。`count` 仍然可以继续变化，因为它承担记录当前数量的职责；`limit` 则把上限在本次使用期间保持不变的要求写进了类型。

> [!PRACTICE] 按对象是否承担状态变化选择 const
> 对初始化后只需读取的对象，使用 `const` 可以让编译器检查意外修改；需要继续记录数量、累计结果等状态变化的对象，则保留可修改类型。是否使用 `const` 取决于对象的职责，而不是它的初值是否恰好写成了一个固定数字。

## 参考资料

- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++23 工作草案：类型限定](https://timsong-cpp.github.io/cppwp/n4950/basic.type.qualifier)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：实现符合性与诊断要求](https://timsong-cpp.github.io/cppwp/n4950/intro.compliance.general)
