---
title: 混合类型运算与转换对称性（Mixed-Type Operations and Conversion Symmetry）
date: 2026-09-01
order: 5
---

# 混合类型运算与转换对称性（Mixed-Type Operations and Conversion Symmetry）

一个保存整数的类对象可以与整数 `3` 相加。把 `current + 3` 换成 `3 + current`，两个输入的值没有变，表达式却可能从合法变为不合法。差别来自操作数怎样进入运算符函数，而不是整数加法的计算规则。

普通成员 `operator+` 由调用对象提供左操作数，右操作数初始化显式形参；非成员形式则用两个显式形参接收左右操作数。用户定义转换能否用于相应的匹配位置，决定了混合类型运算是否具有对称的转换机会。

## 成员形式只为右侧提供用户定义转换入口

下面是完整程序，类定义放在 `main` 之前。`integer_value` 保存一个 `int`，构造函数保存传入值，`value()` 读取它；相加产生新的值对象。这个小类型的显式输入按值接收。示例只使用小整数，所有相加结果均可由 `int` 表示：

```cpp
#include <iostream>

class integer_value {
  public:
    integer_value(const int value) : stored_value{value} {}

    int value() const {
        return stored_value;
    }

    integer_value operator+(const integer_value right) const {
        return integer_value{stored_value + right.stored_value};
    }

  private:
    int stored_value;
};

int main() {
    const integer_value current{8};
    const integer_value total{current + 3};

    std::cout << total.value() << '\n';
}
```

在 `current + 3` 中，`current` 是调用对象，提供整数值 `8`；`3` 则要初始化按值形参 `right`。构造函数没有声明为 `explicit`，所以可以用 `integer_value(int)` 从 `3` 建立这个形参对象。成员函数把两个整数相加，返回保存 `11` 的新对象，程序输出 `11`。

> [!IMPORTANT] 调用对象与右形参分别匹配
> **对这里采用[隐式对象形参](../10-class-interfaces-and-encapsulation/deep-dives/01-implicit-object-parameter-this-and-implementation-model.md#语言模型中的隐式对象形参)的普通成员 `operator+`，左操作数是调用对象，右操作数初始化显式形参。**隐式对象形参不能借助用户定义转换达成类型匹配；右侧普通形参则可以采用符合其初始化规则的隐式转换。
>
> 对本例的左值调用，隐式对象形参可按 `const integer_value&` 理解，`current` 能满足要求。调用对象也需要匹配，不能把成员形式简单记成“左侧没有形参”。

保留类与 `main` 的其余部分，只把 `total` 的定义替换为下面的错误声明，单独检查：

```cpp
const integer_value total{3 + current}; // 错误：当前没有可行的加法入口
```

成员候选根据左操作数的类型查找。这里左侧是 `int`，无法从中找到 `integer_value` 的成员 `operator+`；编译器不会先把 `3` 转换为这个类，再去查找它的成员。这份程序也没有其他可行的加法入口，因此表达式不合法。

这里的左右匹配结论限于普通二元 `+`。相等与关系比较可能按专门规则增加其他比较运算的候选，或交换候选的操作数顺序，不能直接套用这套模型。

## 非成员形式为两侧提供用户定义转换入口

回到开篇的正常程序，删除类内 `operator+` 的整个定义，保留构造函数、读取函数和数据成员。在类定义之后、`main` 之前加入下面的非成员函数：

```cpp
integer_value operator+(const integer_value left, const integer_value right) {
    return integer_value{left.value() + right.value()};
}
```

再用以下定义整体替换 `main`，不保留前面的错误声明：

```cpp
int main() {
    const integer_value current{8};
    const integer_value right_mixed{current + 3};
    const integer_value left_mixed{3 + current};

    std::cout << right_mixed.value() << ' ' << left_mixed.value() << '\n';
}
```

> [!IMPORTANT] 非成员形式为两侧提供普通形参转换机会
> **非成员 `operator+` 没有调用对象，两个操作数分别初始化相应的显式形参。**只要从源类型到对应形参类型的隐式转换可用，两侧都能采用这条路径。本例的两个形参类型相同，因此同一项 `int` 到 `integer_value` 的构造能力可以用于任一侧。

两个表达式分别建立以下匹配关系：

| 表达式 | 左形参 `left` | 右形参 `right` |
| --- | --- | --- |
| `current + 3` | 由 `current` 初始化，取得值 `8` | 经 `integer_value(int)` 由 `3` 初始化 |
| `3 + current` | 经 `integer_value(int)` 由 `3` 初始化 | 由 `current` 初始化，取得值 `8` |

两项调用都可行，函数分别计算 `8 + 3` 与 `3 + 8`，程序输出 `11 11`。转换发生在各自的形参初始化中，操作数互换后，对应的转换入口仍然存在。

> [!WARNING] 两个 int 操作数仍使用内建加法
> `8 + 3` 的两个操作数都是 `int`，结果仍是 `int` 值 `11`。即使整数能隐式构造 `integer_value`，语言也不会先把这两个操作数转换为类对象，再调用类的非成员加法。
>
> 在 `const integer_value total{8 + 3};` 中，先完成内建加法，再用结果初始化类对象；后面发生了构造，不能证明前面的加法采用了类运算符。

## 对称转换不等于对称业务含义

> [!WARNING] 两种顺序都能调用，不等于结果相同
> **转换对称性描述的是匹配机会，不是交换律的证明。**例如，整数减法 `8 - 3` 与 `3 - 8` 都合法，结果却分别为 `5` 与 `-5`。
>
> 本例的两项加法都得到 `11`，是因为函数体实际按整数加法组合数值；仅有非成员形式的声明，不能保证这种数学性质。

对称的形参角色也不要求接受裸整数。继续使用非成员版本，仅把类内的构造函数定义替换为下面一行，其他成员与非成员加法保持不变：

```cpp
explicit integer_value(const int value) : stored_value{value} {}
```

若此时仍使用前面的 `main`，`current + 3` 与 `3 + current` 都不合法：两个普通形参都不能再通过这项 `explicit` 构造函数，由裸整数隐式初始化。

以以下定义整体替换 `main`，由调用者明确构造整数所在的一侧：

```cpp
int main() {
    const integer_value current{8};
    const integer_value right_mixed{current + integer_value{3}};
    const integer_value left_mixed{integer_value{3} + current};

    std::cout << right_mixed.value() << ' ' << left_mixed.value() << '\n';
}
```

程序再次输出 `11 11`。明确构造后，两侧实参都已经具有 `integer_value` 类型，仍能分别初始化非成员函数的两个形参。

> [!PRACTICE] 分别决定运算符形式与隐式转换边界
> 对两个地位相同、只读取输入并返回新值的二元运算，非成员形式便于让两侧遵循相同的形参匹配规则。是否允许其他类型隐式进入，还要分别判断含义是否自然、是否隐藏单位或信息损失，以及对相关重载的影响。
>
> 当前 `integer_value` 表达普通整数值，从 `int` 进入的含义直接。若类型表达按千帕计的压力增量，例如 `pressure_delta_kpa`，要求调用者明确写出单位类型，可以保留数值的解释，代价是表达式更长。这样的类型仍可采用非成员加法，同时用 `explicit` 保留构造边界。

## 参考资料

- [C++23 工作草案：表达式中的运算符重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper)
- [C++23 工作草案：隐式对象形参的匹配限制](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general#5)
- [C++23 工作草案：构造函数提供的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv.ctor)
- [C++ Core Guidelines：为对称运算使用非成员函数](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-symmetric)
