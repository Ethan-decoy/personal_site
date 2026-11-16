---
title: 成员与非成员运算符函数（Member and Non-Member Operator Functions）
date: 2026-08-31
order: 2
---

# 成员与非成员运算符函数（Member and Non-Member Operator Functions）

`left + right` 有两个操作数，运算符函数采用成员或非成员形式时，参数列表却有不同写法。两种接口可以完成同一项计算，调用对象与显式形参的分工需要分别判断。

以下比较普通二元 `+` 的隐式对象成员形式与非成员形式。成员函数属于相应的类；即使把函数体写在类外，它仍然是成员，不能只凭函数体的位置区分两种形式。

示例中的 `displacement` 保存横向位移，`steps` 为正表示向右、为负表示向左。这个类型只保存一个整数，显式输入按值传递；所有相加结果均可由 `int` 表示。各份完整程序彼此独立，片段按注明的位置接入。

## 成员形式由调用对象提供左操作数

把 `operator+` 声明为 `displacement` 的成员后，可以用调用对象提供一项输入。下面同时写出运算符形式与显式成员调用：

```cpp
#include <iostream>

struct displacement {
    int steps;

    displacement operator+(const displacement right) const {
        return displacement{steps + right.steps};
    }
};

int main() {
    const displacement left{8};
    const displacement right{-3};

    const displacement total{left + right};
    const displacement direct_total{left.operator+(right)};

    std::cout << total.steps << ' ' << direct_total.steps << '\n';
    std::cout << left.steps << ' ' << right.steps << '\n';
}
```

> [!IMPORTANT] 成员形式由调用对象提供左操作数
> **采用隐式对象成员形式的二元 `operator+`，由调用对象提供左操作数，右操作数初始化唯一的显式形参。**在 `left + right` 中，`this` 指向调用对象 `left`；函数体中的 `steps` 相当于 `this->steps`，读取的是 `left.steps`。
>
> 尾随 `const` 约束通过调用对象进行的访问。对这里的左值调用，其隐式对象形参可按 `const displacement&` 理解，因此 `const` 对象 `left` 能满足调用要求。

显式形参 `right` 按值取得一份副本，与 `main` 中同名的右操作数对象不是同一个对象。函数读取调用对象中的 `8` 与形参中的 `-3`，按值返回步数为 `5` 的位移。

程序先输出 `5 5`，随后输出 `8 -3`。在这份只有一个适用入口的程序中，两种调用写法选择同一项成员函数；它们分别初始化独立的 `total` 与 `direct_total`，原来的两个操作数没有改变。

## 非成员形式显式接收两个操作数

同一项位移加法也可以由独立函数实现。下面是另一份完整程序，单独使用非成员形式，并把显式调用写成 `operator+(left, right)`：

```cpp
#include <iostream>

struct displacement {
    int steps;
};

displacement operator+(const displacement left, const displacement right) {
    return displacement{left.steps + right.steps};
}

int main() {
    const displacement left{8};
    const displacement right{-3};

    const displacement total{left + right};
    const displacement direct_total{operator+(left, right)};

    std::cout << total.steps << ' ' << direct_total.steps << '\n';
    std::cout << left.steps << ' ' << right.steps << '\n';
}
```

> [!IMPORTANT] 非成员形式用两个显式形参接收操作数
> **非成员 `operator+` 没有调用对象，两个操作数分别初始化相应的显式形参。**本例的 `left`、`right` 都是按值取得的副本，函数体通过它们读取两个步数，没有成员函数中的 `this`。

两个程序的输出都是 `5 5` 和 `8 -3`，但访问原对象的路径不同：

| 操作数 | 成员形式 | 非成员形式 |
| --- | --- | --- |
| 左侧的 `left` | 作为调用对象，函数体直接读取该对象的成员 | 初始化独立的按值形参 `left` |
| 右侧的 `right` | 初始化独立的按值形参 `right` | 初始化独立的按值形参 `right` |

相同结果说明这两份实现对当前输入完成了同一项位移合成，不说明两种接口在所有实参类型与绑定情形下都完全等价。显式调用在这里用于展示操作数的去向，运算符表达式仍按自身的规则建立候选与安排求值。

当前 `steps` 是公开成员，所以非成员函数可以直接读取它；运算符函数的身份不会自动授予私有成员访问权。若类型隐藏内部表示，非成员函数也要按公开接口与访问规则完成操作。

## 两种形式共同参与重载决议

现在回到第一份成员形式的完整程序，在类定义之后、`main` 之前追加下面的非成员函数。这里只追加函数，保留原来的一份 `displacement` 定义：

```cpp
displacement operator+(const displacement left, const displacement right) {
    return displacement{left.steps + right.steps};
}
```

两项定义可以同时存在，但原来的 `left + right` 会出现两个可行候选。比较时，调用对象也占一个匹配位置，不能仅比较显式形参的数量：

| 候选 | 左操作数的匹配 | 右操作数的匹配 |
| --- | --- | --- |
| 成员 `operator+` | 按 `const displacement&` 绑定调用对象，Exact Match | 按值初始化形参，Exact Match |
| 非成员 `operator+` | 按值初始化形参，Exact Match | 按值初始化形参，Exact Match |

左侧的对象绑定与按值初始化具有不同的对象关系，但这里没有适用的排序规则使其中一项更好；右侧的匹配也无法分出优劣。复制成本和函数归属都不能代替语言规定的匹配比较。

> [!WARNING] 成员形式不会自动胜过非成员形式
> 成员与非成员运算符函数可以共同参与同一条运算符表达式的重载决议。两项候选都可行，而匹配比较与其余适用规则仍不能选出唯一最佳函数时，表达式就是歧义调用；函数属于类或显式形参更少，都不提供额外优先级。本例中，`total` 初始化器里的 `left + right` 正是这种情况。
>
> 业务含义一致是接口设计要求，不是重载排序条件。保持这些声明不变而改变某个函数体的计算方式，也不能消除当前的歧义。

定义是否合法与某条调用是否有唯一目标，需要分开判断。继续保留这两项函数，只把 `main` 的函数体替换为下面的片段：

```cpp
const displacement left{8};
const displacement right{-3};

const displacement member_total{left.operator+(right)};
const displacement nonmember_total{operator+(left, right)};

std::cout << member_total.steps << ' ' << nonmember_total.steps << '\n';
```

这份变体可以编译，输出 `5 5`：本例的显式成员调用选择成员入口，显式非成员调用选择独立函数。两项函数可以合法共存；需要诊断为歧义的是同时考虑它们、却无法选出唯一最佳函数的 `left + right`。

应避免的是本例这样让常见调用无法区分的重复入口。成员与非成员形式在不同参数组合下也可以共同组成可用接口，仍须逐条核对相应调用。

> [!PRACTICE] 按对象角色与访问需求选择形式
> 对于只读取两个地位相同的输入、返回独立组合结果的二元值运算，非成员形式更直接地表达这种接口角色的对称性。本例的位移加法符合这一条件，成员形式也能正确实现它；是否满足交换律等数学性质，仍由类型含义与函数实现决定。
>
> 操作围绕某个对象的状态更新展开、需要在类接口中维护约束时，成员形式便于把操作归属于该对象，并使用相应访问权限。这是设计取舍，不是“修改对象必须使用成员函数”的语法要求；非成员函数也能通过公开操作请求修改。
>
> 既有公开接口已经足以完成组合运算时，非成员形式可以避免为每项组合都增加成员入口。它不会自动获得私有访问权，也不应为了缩短实现而暴露需要封装的状态；可用的公开接口同样影响这项选择。

## 参考资料

- [C++23 工作草案：二元运算符的成员与非成员形式](https://timsong-cpp.github.io/cppwp/n4950/over.binary)
- [C++23 工作草案：调用对象与隐式对象形参](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general#4)
- [C++23 工作草案：成员与非成员运算符候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper#3)
- [C++23 工作草案：唯一最佳函数与歧义](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general#3)
- [C++ Core Guidelines：为对称运算使用非成员函数](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-symmetric)
