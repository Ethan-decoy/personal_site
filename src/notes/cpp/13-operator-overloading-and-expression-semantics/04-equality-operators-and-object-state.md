---
title: 相等运算符与对象状态（Equality Operators and Object State）
date: 2026-08-31
order: 4
---

# 相等运算符与对象状态（Equality Operators and Object State）

两份位置记录都保存横向第 `2` 格、纵向第 `3` 格。它们表示同一个网格位置，同时仍然是程序中的两个独立对象。判断“位置是否相同”与判断“正在访问哪一份记录”，需要区分值与对象身份。

下面的 `grid_position` 用 `x`、`y` 分别保存横向与纵向格号。本例把这两个整数共同规定为位置的值：两个分量都相等，才表示相同位置。示例只使用小整数，涉及的整数减法结果也均可表示。

## 值相等不等于身份相同

下面是完整程序，类型与非成员 `operator==` 定义在 `main` 之前。比较函数通过两个 `const` 引用读取原对象，无须为输入建立副本：

```cpp
#include <iostream>

struct grid_position {
    int x;
    int y;
};

bool operator==(const grid_position& left, const grid_position& right) {
    return left.x == right.x && left.y == right.y;
}

int main() {
    const grid_position first{2, 3};
    const grid_position second{2, 3};
    const grid_position other{2, 4};
    const grid_position& alias{first};

    std::cout << (first == second) << ' ' << (&first == &second) << '\n';
    std::cout << (first == other) << ' ' << (&first == &other) << '\n';
    std::cout << (first == alias) << ' ' << (&first == &alias) << '\n';
}
```

`first == second` 选择当前的非成员函数，形参 `left`、`right` 分别绑定这两个对象。函数内部的 `left.x == right.x` 比较两个整数，`left.y == right.y` 也比较两个整数；内建 `&&` 组合这些布尔判断。函数只读取成员，按值返回 `bool`，不修改输入。

对 `first` 与 `second`，两项整数比较都为 `true`，所以位置值相等。对 `first` 与 `other`，横向格号都是 `2`，纵向格号却分别为 `3`、`4`，第二项比较为 `false`，整体结果也为 `false`。

> [!IMPORTANT] 值相等与对象身份分别判断
> **对这里的网格位置，`==` 判断横、纵格号是否共同相等；本例的地址比较则判断两条访问路径是否指定同一个仍存活的完整对象。**不同对象可以保存相同位置值；引用也可以提供访问同一对象的另一条路径。
>
> 值比较与身份比较回答不同问题。不能从位置值相等推出对象相同，也不能因为两份记录身份不同就断定位置值不同。

程序每行先输出值比较，再输出身份比较。默认布尔输出用 `1` 表示 `true`、`0` 表示 `false`，因此三行输出分别为 `1 0`、`0 0`、`1 1`：

| 比较的两条访问路径 | 对象关系 | 位置值相等 | 身份相同 |
| --- | --- | --- | --- |
| `first` 与 `second` | 两个独立对象，坐标相同 | `true` | `false` |
| `first` 与 `other` | 两个独立对象，纵坐标不同 | `false` | `false` |
| `first` 与 `alias` | 两条路径指定同一个对象 | `true` | `true` |

`alias` 是绑定到 `first` 的引用，没有创建第四份位置对象。`&alias` 取得的是原对象 `first` 的地址。

> [!WARNING] 地址比较不能替代本例的位置值比较
> 若把开篇 `operator==` 的函数体替换为 `return &left == &right;`，程序仍能编译，但 `first == second` 会变为 `false`。这两个引用形参绑定原对象，取得的是两个独立对象的地址。
>
> 原来的两份记录仍然都保存 `(2, 3)`。错误来自把“是否为同一对象”当成“是否为同一位置”，不是记录中的值发生了变化。

## 相等由类型语义决定

本例明确要求横、纵两个分量都参与位置值的判断。若只比较横坐标，就会遗漏类型承诺的一部分逻辑状态。保留开篇的类型与 `main`，只把 `operator==` 替换为下面这个错误实现，不与原函数并列追加：

```cpp
bool operator==(const grid_position& left, const grid_position& right) {
    return left.x == right.x;
}
```

这个版本可以编译，却会把 `first == other` 判为 `true`，使第二行输出从 `0 0` 变为 `1 0`。两个位置的横坐标都是 `2`，纵坐标却不同；身份比较仍然为 `false`，改变的是位置相等的判断规则。

> [!WARNING] 通过编译不代表比较包含了完整的值
> C++ 不会自动判断哪些成员构成当前类型的值。对这份 `grid_position`，忽略 `y` 会把不同位置判成相等；合法的函数声明、返回 `bool`、输入使用 `const`，都不能证明比较规则符合值语义。

> [!PRACTICE] 按类型承诺的逻辑状态定义相等
> 为当前这样的值类型定义 `==` 时，先确定调用者所比较的值由哪些信息组成，再让实现兑现这个约定。本例的 `x`、`y` 都是位置值的一部分，因此两者都要参与规则。
>
> 类型也可能保存用于避免重复计算的缓存（cache），或记录调用次数；若这些信息不属于对外表达的值，把它们机械加入比较会让同值对象被判为不等。应排除与值无关的实现状态，同时避免遗漏真正构成值的信息；比较全部成员并不是无条件适用的规则。

指针成员也要服从这个选择：类型表达的可能是“观察哪一个目标”，也可能是“目标中的内容”。比较指针值本身不会读取目标中的数据，不同目标即使内容相同，指针值也不一定相等。

同一指针类型的两个空指针值也会通过 `==` 比较为 `true`，此时没有被指对象。因此，指针相等不能单独证明存在可访问的目标。若类型按目标内容定义相等，读取前仍须保证目标存活且允许访问；允许空状态时，还要规定空状态怎样参与比较。

## 普通值等价关系的基本性质

除了选对参与比较的状态，还需要让比较关系本身保持一致。对于把 `==` 用作普通值等价关系（equivalence relation）的类型，下列要求适用于其约定的有效值域。

> [!IMPORTANT] 普通值等价关系的判断条件
> 在输入逻辑状态不变时，比较结果应保持稳定。把 `==` 用作普通值等价关系，还应满足：
>
> - 自反性（reflexivity）：任意有效值 `a` 与自身相等，即 `a == a`；
> - 对称性（symmetry）：若 `a == b`，则 `b == a`；
> - 传递性（transitivity）：若 `a == b` 且 `b == c`，则 `a == c`。
>
> **这些性质约束比较关系的一致性；比较是否符合类型所表达的值，还要依据该类型的值语义判断。**C++ 不会自动证明任意运算符函数满足这些要求。

把“足够接近”直接当成相等，可能破坏这样的关系。下面是独立的错误设计程序，与开篇分开使用；它把纵坐标相同、横坐标相差不超过一格的位置判为相等。这里使用的小坐标保证减法结果可由 `int` 表示：

```cpp
#include <iostream>

struct grid_position {
    int x;
    int y;
};

bool operator==(const grid_position& left, const grid_position& right) {
    const int difference{left.x - right.x};
    return left.y == right.y && difference >= -1 && difference <= 1;
}

int main() {
    const grid_position first{0, 0};
    const grid_position second{1, 0};
    const grid_position third{2, 0};

    std::cout << (first == second) << ' ' << (second == third) << ' ' << (first == third) << '\n';
}
```

程序输出 `1 1 0`：第一个位置与第二个相差一格，第二个与第三个也相差一格，第一个与第三个却相差两格。前两项相等不能推出第三项相等，传递性失效。

> [!WARNING] 这一项接近规则不能充当值等价关系
> 对同一行的位置，“横坐标相差不超过一格”能判断局部距离是否满足限制，却不能保证同值关系的传递性。若调用者据此把三个位置归为同一组，会遇到前两项判断成立、首尾判断却不成立的矛盾。
>
> 需要判断接近时，可以用含义明确的具名操作表达相应条件；不能仅因它返回 `bool`、写成 `operator==` 后能够编译，就把它当成普通值相等。

反过来，前面只比较 `x` 的错误实现，仍能满足自反、对称与传递：它实际建立的是“横坐标相同”的等价关系。但它把 `(2, 3)` 与 `(2, 4)` 判为相等，仍然不符合本例规定的完整位置值。关系一致与值含义正确，是需要分别核对的两项条件。

## 参考资料

- [C++23 工作草案：内建相等比较与指针比较](https://timsong-cpp.github.io/cppwp/n4950/expr.eq)
- [C++23 工作草案：二元运算符函数](https://timsong-cpp.github.io/cppwp/n4950/over.binary)
- [C++23 工作草案：值相等关系的语义要求](https://timsong-cpp.github.io/cppwp/n4950/concept.equalitycomparable)
- [C++ Core Guidelines：相等比较的接口约定](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rc-eq)
