---
title: 运算符函数与类类型表达式（Operator Functions and Class-Type Expressions）
date: 2026-08-31
order: 1
---

# 运算符函数与类类型表达式（Operator Functions and Class-Type Expressions）

向右 8 格与向左 3 格的横向位移，可以合成为向右 5 格。位移用整数步数描述：正数表示向右，负数表示向左，`0` 表示不移动。把步数放进类中，并不会使语言自动知道两个位移怎样相加。

C++ 允许声明运算符函数（operator function），为类类型参与已有运算符时提供行为。用这种函数建立相应运算语义，称为运算符重载（operator overloading）。

下面是独立的完整程序。`displacement` 保存横向移动的步数，类外的 `operator+` 合成两个位移。示例使用小整数，并保证两个步数相加的结果可由 `int` 表示：

```cpp
#include <iostream>

struct displacement {
    int steps;
};

displacement operator+(const displacement left, const displacement right) {
    return displacement{left.steps + right.steps};
}

int main() {
    const displacement first{8};
    const displacement second{-3};

    const displacement total{first + second};

    std::cout << total.steps << ' ' << first.steps << ' ' << second.steps << '\n';
}
```

`operator+` 是函数名，由关键字 `operator` 与已有的运算符符号 `+` 组成。前面的 `displacement` 是返回类型，两个形参分别接收左、右操作数。

这个类型只保存一个整数，输入按值传递；`left`、`right` 各自由相应操作数初始化，成为独立的形参对象。形参的 `const` 表明函数只读取这些副本，返回声明则表示按值返回合成后的位移。

## 运算符表达式仍然经过重载决议

名称表达式 `first`、`second` 都是指定已有 `const displacement` 对象的 lvalue。它们作为 `+` 的操作数时，语言为这次运算建立候选，并通过重载决议确定可用的运算。

本例的 `operator+` 可以用这两个对象初始化对应的按值形参，没有其他可行候选与它竞争，因此被选中。随后函数体读取两个整数步数，计算 `8 + (-3)`，按值返回步数为 `5` 的位移。

> [!IMPORTANT] 操作数类型决定当前加法采用的规则
> **本例的两个类类型操作数通过重载决议选择 `operator+`；函数体中的两个整数成员则使用内建整数加法。**符号相同，不表示两处采用同一种运算规则。
>
> 类定义本身不会自动生成这项加法。若移除本例的 `operator+` 定义，`first + second` 就会因找不到适用运算而编译失败。

两处加法需要分开追踪：

| 表达式 | 操作数的类型与值类别 | 当前采用的操作 |
| --- | --- | --- |
| `first + second` | 两个 `const displacement` lvalue | 选择类外的 `operator+`，按值初始化形参 |
| `left.steps + right.steps` | 两个 `const int` lvalue | 读取整数值，执行内建整数加法 |

加法结果用于初始化 `total`。程序输出 `5 8 -3`：合成位移为向右 5 格，两个原对象仍分别保存 `8` 和 `-3`。本例没有修改原对象，是这份参数设计与函数体共同产生的结果。

> [!IMPORTANT] 返回声明决定本例表达式的结果
> **选中运算符函数后，本篇 `+` 表达式的结果按普通函数的返回规则确定。**这里返回 `displacement` 值，因此 `first + second` 是该类型的 prvalue，用于初始化独立对象 `total`。
>
> 若选中的运算符函数返回左值引用，表达式结果就会是 lvalue，指代返回的引用目标。仅看 `+` 符号，不能断定表达式一定产生独立的值；接口与实现仍需符合运算含义和生命周期要求。

## 运算符函数仍然可以直接调用

`operator+` 也可以像普通函数名一样显式写出。把下面片段追加到开篇 `main` 的已有代码之后，继续使用其中的 `first`、`second`：

```cpp
const displacement direct_total{operator+(first, second)};
std::cout << direct_total.steps << '\n';
```

追加的代码再输出 `5`。`first + second` 是运算符表达式，`operator+(first, second)` 是显式函数调用表达式；在当前声明可见、只有这一项适用函数的语境中，两者选择同一项函数，得到相同的位移值。`direct_total` 与 `total` 是两个独立对象，相同的成员值不表示它们具有同一身份。

这种函数调用形式用于呈现操作数与形参的对应。运算符形式在建立候选时按运算符重载规则处理，并保留该运算符的分组与求值约束；显式函数调用有自己的实参求值规则。本例只比较两个既有位移的合成结果，操作数没有副作用，对应结论限于当前示例。

内建加法也不会自动声明一项可调用的函数。下面是独立的错误程序，不使用开篇的类与函数定义：

```cpp
int main() {
    return operator+(1, 2); // 错误：没有这样的函数声明
}
```

> [!WARNING] 内建运算不提供可直接调用的函数名
> `1 + 2` 按内建整数加法得到 `3`，不意味着程序中存在 `operator+(int, int)`。显式函数调用需要能找到相应声明；上面的独立程序没有这项声明，因此编译失败。

## 不能重新定义纯内建类型的运算

本例使用类类型形参满足重载运算的条件。若尝试仅用两个 `int` 形参定义加法函数，则会在声明处被拒绝。下面是另一份独立的错误程序：

```cpp
int operator+(const int left, const int right) { // 错误：形参类型不满足重载要求
    return left - right;
}

int main() {}
```

C++ 不允许借此把 `int + int` 从加法改成减法。这项非成员声明的限制检查形参类型；把返回结果设计为类对象，也不能使全为 `int` 形参的 `operator+` 合法。

> [!IMPORTANT] 定制类类型的运算，保留语言规定的结构
> **本篇的运算符函数为类类型参与的加法提供行为，不会改写纯内建类型之间的运算。**同样，函数定义不能改变运算符的优先级、结合性或操作数数量，也不能创造新的运算符符号。
>
> `first + second + first` 仍按 `(first + second) + first` 分组，包含两次二元加法。分组说明结果怎样组合，不保证操作数按从左到右的顺序求值。

定义当前的二元 `operator+`，也不会自动声明一元 `+`、`operator+=`、减法或相等运算符。保留开篇的类型与函数定义，只把 `main` 的函数体替换为下面的错误片段：

```cpp
displacement accumulated{8};
const displacement increment{-3};

accumulated += increment; // 错误：当前类型没有可用的 += 运算
```

> [!WARNING] 提供加法不会自动提供复合赋值
> `accumulated` 是可修改对象，失败原因是没有适用的 `operator+=`，不是 `const` 限制。语言不会根据当前 `operator+` 自动生成这项复合赋值。
>
> 若类型需要支持 `+=`，应另外提供相应操作，并明确它修改哪个对象、返回什么结果。内建运算之间熟悉的关系，不能代替类类型的接口定义。

## 参考资料

- [C++23 工作草案：运算符函数、显式调用与声明约束](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：表达式中的运算符重载决议与求值约束](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper#2)
- [C++23 工作草案：函数调用中的形参与返回结果](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
