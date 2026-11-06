---
title: 函数定义与调用（Function Definitions and Calls）
date: 2026-08-27
---

# 函数定义与调用（Function Definitions and Calls）

订单的应付金额由商品金额与运费相加得到。假设当前配送规则是基本运费 `5` 元，再加上 `10` 元的加急附加费；以下示例的金额都按整数元记录。

函数（function）可以把运费计算组织为一项有名字的工作。程序在需要运费的位置调用它，取得返回的结果后，再显示金额或计入应付金额。

## 把一段行为命名为函数

用 `calculate_shipping_fee` 命名这项运费计算。基本费与附加费固定在函数体中，调用时不需要向它传入数据。下面是完整程序；辅助函数定义在 `main` 之前，`main` 调用它并显示结果：

```cpp
#include <iostream>

int calculate_shipping_fee() {
    int base_fee{5};
    int surcharge{10};

    return base_fee + surcharge;
}

int main() {
    int shipping_fee{calculate_shipping_fee()};
    std::cout << shipping_fee << '\n'; // 15
    return 0;
}
```

`int calculate_shipping_fee() { ... }` 是一条函数定义（function definition）。它规定函数的名称、参数列表、返回类型与函数体：

| 组成部分 | 当前示例 | 含义 |
| --- | --- | --- |
| 返回类型 | `int` | 规定这次计算正常返回一个 `int` 结果 |
| 函数名 | `calculate_shipping_fee` | 标识运费计算这项工作 |
| 参数列表 | `()` | 没有参数，调用时不在圆括号中传入数据 |
| 函数体 | 名称与参数列表之后的 `{...}` | 计算两项费用之和，并用 `return` 把运费作为结果返回 |

函数体沿用已有的代码块模型，可以包含对象定义、表达式语句、选择语句和循环语句。这个函数先定义两项费用，再通过 `return base_fee + surcharge;` 提供它们的合计金额。函数定义末尾的右花括号结束定义，本身不需要再用分号结束。

普通函数定义不能直接嵌套在另一个函数体中。这里把 `calculate_shipping_fee` 的完整定义写在 `main` 之前，使编译器分析调用位置时，已经知道它的名称、参数列表和返回类型。

> [!IMPORTANT] 定义描述行为，调用才执行行为
> **函数定义规定一项可调用的行为；定义在源码中出现，不会使函数体自动执行。程序执行到调用表达式时，才进入被调用的普通函数的函数体。**同一个函数定义可以对应多次调用，每次调用都执行相应的函数体。

## 调用才会进入函数体

`main` 中用于初始化 `shipping_fee` 的 `calculate_shipping_fee()` 是一次函数调用（function call）表达式。定义头部也有同样的名称与圆括号，但它们所在的位置和职责不同：

| 源码位置 | 圆括号的职责 | 是否在这里发起调用 |
| --- | --- | --- |
| `int calculate_shipping_fee() { ... }` | 描述函数的参数列表 | 否，这是定义 |
| `int shipping_fee{calculate_shipping_fee()};` | 在初始化表达式中调用函数 | 是 |

> [!IMPORTANT] 定义中的圆括号与调用中的圆括号
> **函数定义中紧跟函数名的圆括号属于参数列表；调用无参普通函数时，表达式位置的 `函数名()` 才表示执行调用。**调用的空圆括号不能省略，单独写出函数名不会执行函数体。

执行 `int shipping_fee{calculate_shipping_fee()};` 时：

1. 为了取得初始化所需的值，程序进入 `calculate_shipping_fee` 的函数体，尚不执行 `main` 中后面的输出语句；
2. 函数体把 `base_fee` 初始化为 `5`，把 `surcharge` 初始化为 `10`；
3. `return base_fee + surcharge;` 这条返回语句（return statement）先计算 `5 + 10`，把 `15` 作为本次调用的 `int` 结果，随后结束这次函数调用；
4. 控制回到 `main` 中的调用位置，用返回的整数值初始化 `shipping_fee`，后面的输出语句再显示 `15`。

函数体中的 `base_fee` 与 `surcharge` 用于计算，`main` 中的 `shipping_fee` 保存调用取得的结果。实际输出发生在 `std::cout` 语句中，`return` 在这里负责把计算结果交回调用位置。

如果去掉调用的圆括号，把 `main` 中定义 `shipping_fee` 的那一行替换为下面的错误片段：

```cpp
int shipping_fee{calculate_shipping_fee}; // 错误：只有函数名，没有发起调用
```

这次没有取得计算返回的 `int` 结果，不能用这样的函数名表达式初始化 `int` 对象，程序无法通过编译。补回 `()`，才会调用函数并使用它返回的值。

## 函数调用也是表达式

商品金额为 `100` 元时，可以直接把运费调用写进加法表达式，计算应付金额。保留开篇的函数定义，把 `main` 中定义和输出 `shipping_fee` 的两条语句替换为：

```cpp
int goods_total{100};
int payable_total{goods_total + calculate_shipping_fee()};
std::cout << payable_total << '\n'; // 115
```

调用本身返回 `int` 值 `15`；加法使用商品金额 `100` 与这个结果相加，得到 `115`，再初始化 `payable_total`。改写后的程序显示应付金额 `115`，调用返回的运费仍然是 `15`。

> [!IMPORTANT] 调用表达式的类型与返回结果
> **函数调用也是表达式。对于按值返回 `int` 的普通函数，调用正常完成时得到 `int` 结果；这个结果可以用于初始化对象，也可以作为外围运算的操作数。**外围表达式再按相应运算符的规则使用这个结果，依赖它的运算要在取得结果后才能完成。

两种写法使用同一个函数定义：前一种保存并显示运费，后一种把返回的运费用作加法的操作数。每次实际执行到调用时，函数体都会按当前收费规则重新计算。

## 让函数边界表达意图

`calculate_shipping_fee` 的函数体负责计算运费，`main` 负责使用结果：可以单独显示运费，也可以把返回值计入订单的应付金额。调用位置因此能够用一个有意义的名称表达“取得当前规则下的运费”。

> [!PRACTICE] 按一项能够说明的工作确定函数边界
> 当一组语句共同完成一项可以清楚命名的工作时，可以用函数集中表达这项工作，让调用处说明要做什么，函数体负责怎样完成。即使暂时只有一个调用位置，清楚的名字与职责也可能让代码更容易理解。
>
> 如果函数名称必须同时罗列许多彼此独立的动作，通常需要重新检查这些动作是否适合放在同一个函数中。

## 参考资料

- [C++23 工作草案：函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：返回语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
