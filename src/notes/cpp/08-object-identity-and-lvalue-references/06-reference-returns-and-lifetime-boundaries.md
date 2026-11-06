---
title: 引用返回与生命周期边界（Reference Returns and Lifetime Boundaries）
date: 2026-08-28
order: 6
---

# 引用返回与生命周期边界（Reference Returns and Lifetime Boundaries）

计分程序需要先选择一名选手的得分记录，再为这条记录加分。引用返回（return by reference）可以让函数调用继续指定选中的原对象，调用者随后通过这个结果访问同一条记录。

以下只讨论普通整数对象与普通指针，使用非负的小整数，并保证加法结果可由 `int` 表示。完整程序彼此独立；片段的接续或替换位置逐处说明。涉及悬空目标的片段只用于静态分析，标出的危险读取不得执行。

## 引用返回保留已有对象身份

两个整数对象分别保存两名选手的分数。`select_score` 根据 `choose_first` 选择其中一条记录：`true` 选择第一条，`false` 选择第二条。下面是完整程序，选择函数定义在 `main` 之前：

```cpp
int& select_score(int& first, int& second, const bool choose_first) {
    if (choose_first) {
        return first;
    }

    return second;
}

int main() {
    int first_score{10};
    int second_score{20};

    int& selected{select_score(first_score, second_score, false)};

    selected += 5;
}
```

调用时，形参 `first` 与 `second` 分别绑定调用者的 `first_score` 和 `second_score`。第三个实参是 `false`，函数执行 `return second;`，用指定 `second_score` 的 lvalue 初始化返回引用。

调用表达式继续指定这个原对象，`main` 中的 `selected` 因而也绑定到 `second_score`。执行 `selected += 5;` 后，第二名选手的分数变为 `25`，第一名选手的分数仍为 `10`。

两个整数都在 `main` 的代码块中创建，直到离开这个代码块才结束生命周期；选择函数返回不会销毁它们。引用形参与被绑定的整数是不同实体，返回结果继续指定的是调用者的整数对象。

> [!IMPORTANT] 引用返回保留对象身份
> **返回 `int&` 的普通函数调用是 `int` 类型的 lvalue，指定返回引用所绑定的整数对象。**引用返回不建立该整数的独立副本；实际访问仍须以目标在生命周期内、符合相应访问条件为前提。

## 返回形式决定调用结果关系

返回类型决定调用表达式的类型、值类别及其提供的关系。在当前整数与普通指针范围内，可以这样区分：

| 返回形式 | 调用表达式的类型 | 值类别 | 调用者得到的关系 |
| --- | --- | --- | --- |
| `int` | `int` | prvalue | 供初始化或计算使用的整数值 |
| `int&` | `int` | lvalue | 指定返回引用绑定的整数，可经此路径修改 |
| `const int&` | `const int` | lvalue | 指定返回引用绑定的整数，限制经此路径修改 |
| `int*` | `int*` | prvalue | 指针值；可以指向对象，也可以为空 |

调用结果提供引用关系，不表示接收它的变量也自动成为引用。保留 `select_score` 的定义，用下面片段替换开篇 `main` 的函数体，从相同的初始分数比较两种接收方式：

```cpp
int first_score{10};
int second_score{20};

const int copied{select_score(first_score, second_score, false)};
int& selected{select_score(first_score, second_score, false)};

selected += 5;
```

两次调用都指定 `second_score`。初始化 `copied` 需要整数值，因此读取原对象中的 `20`，建立独立的 `const int` 对象；初始化 `selected` 则直接绑定原对象。

最后，`selected += 5;` 把 `second_score` 改为 `25`，`copied` 仍保存 `20`。返回形式相同，接收声明建立的关系却不同。

> [!IMPORTANT] 返回类型与接收声明分别决定关系
> **返回类型决定调用表达式提供什么结果，接收声明决定用该结果创建值对象，还是建立引用绑定。**对这里返回 `int&` 的调用，用 `int` 或 `const int` 定义新对象会读取并保存数值，用 `int&` 初始化引用会保留原目标的身份。取值时，原目标必须仍然有效。

## 不能返回即将销毁对象的引用

具有自动存储期的普通局部对象，会在函数调用离开相应代码块时结束生命周期。

> [!IMPORTANT] 引用返回不延长目标的生命周期
> **返回引用只传递对目标的访问关系，不改变目标本来的结束边界。**判断返回结果是否可用，应找到实际目标及其销毁时刻：调用者的原对象可以在被调用函数结束后继续存在，函数体中的普通自动存储期局部对象则在退出其代码块时销毁。

下面的函数把返回引用绑定到函数体内创建的整数，存在生命周期错误。定义放在 `main` 之外，只用于分析，不作为正常运行示例：

```cpp
const int& invalid_local_score() {
    const int score{10};
    const int& view{score};

    return view;
}
```

名称表达式 `view` 是指定 `score` 的 lvalue，能够用于初始化返回的 `const int&`。返回过程先建立返回引用，再退出函数体；其中的整数对象 `score` 随之销毁。调用表达式仍是 lvalue，但已经没有可供访问的活对象目标。

以下错误片段假定放在 `main` 的函数体内，仅作分析。标出的读取会访问已经销毁的整数：

```cpp
const int& dangling{invalid_local_score()};
const int copied{dangling}; // 未定义行为：原整数已经销毁
```

> [!WARNING] 返回即将销毁对象的引用会悬空
> 普通自动存储期局部对象在退出其代码块时销毁。返回指向它的引用或指针不会保留这个对象；随后通过它读取或修改原对象的行为未定义。编译器或静态分析工具可能发现问题，但未收到警告也不能证明目标有效。

## return 中的临时对象不会得到延长

另一种危险目标是在 `return` 中物化的临时对象。下面的独立定义放在 `main` 之外，仅用于分析：

```cpp
const int& invalid_answer() {
    return 42;
}
```

在 C++23 中，`return 42;` 为返回的引用物化临时 `const int` 对象。返回引用先完成初始化，临时目标随后在 `return` 操数所属的完整表达式结束时销毁。调用者得到调用结果时，目标已经销毁。

> [!WARNING] return 中的临时目标不会活到调用者使用时
> **在这里的 C++23 引用返回中，物化的临时目标在 `return` 操数所属的完整表达式结束时销毁。**调用者即使立即用 `const int&` 接收调用结果，也不会重新延长它的生命周期；随后通过该结果读取原对象的行为未定义。

编译器通常会对这段代码发出警告，但 C++23 规则不要求把它作为必须拒绝的编译错误。能通过类型检查与返回目标可以安全使用，是两个不同的判断。

## 临时实参不会因引用返回而延长

前面的危险目标在被调用函数内创建。临时实参则在调用位置产生，函数执行期间目标仍然存在。下面的 `identity` 让返回结果继续指定形参所绑定的目标，不创建独立整数；这是独立示例，函数定义放在 `main` 之外：

```cpp
const int& identity(const int& value) {
    return value;
}
```

保留 `identity` 的定义，以下片段假定放在 `main` 的函数体内，仅用于追踪生命周期。注释中的读取不得执行：

```cpp
const int& dangling{identity(42)};

// const int copied{dangling}; // 若执行，读取悬空目标是未定义行为
```

`dangling` 的初始化在语法和类型上能够成功，但它完成绑定后很快失去有效目标：

1. `42` 是 prvalue；为了初始化引用参数 `value`，临时 `const int` 对象被物化；
2. 参数 `value` 在函数执行期间指代这个临时对象；
3. `return value;` 返回同一个对象的身份，因此返回 `const int&` 的调用表达式 `identity(42)` 是 lvalue；
4. `dangling` 能够绑定这个 lvalue 所指定的对象，但这不会重新触发一次生命周期延长；
5. 绑定到引用参数的临时对象只持续到包含函数调用的完整表达式结束，也就是 `dangling` 声明末尾的分号；
6. 分号之后，`dangling` 已经悬空，读取它所指对象会产生未定义行为。

> [!IMPORTANT] 再次绑定不重新决定临时实参的结束点
> **绑定到引用参数的临时对象，存活到包含调用的完整表达式结束。**函数返回同一目标的引用、调用者再绑定这个结果，都不会重新延长该目标的生命周期。应沿访问关系找到原始目标，再按其创建与绑定语境判断结束点。

> [!WARNING] 引用仍然存在，目标也可能已经销毁
> 接收引用自身仍在生命周期内、函数已经成功返回，都不能证明目标仍然存活。临时实参在包含调用的完整表达式结束后销毁，此后通过接收引用读取原对象的行为未定义。

如果调用者只需要数值，可以在目标仍存在时读取它。保留 `identity` 的定义，用下面的正常片段替换前面 `main` 中的片段，独立考察值对象的初始化：

```cpp
const int copied{identity(42)};
```

`identity(42)` 仍是指定临时目标的 lvalue。`copied` 的初始化需要整数值，因此在目标仍存活时读取其中的 `42`，建立独立的 `const int` 对象。随后临时实参销毁，`copied` 仍保存 `42`。

这次复制安全，依赖的是读取发生在临时目标销毁之前。若目标已经在被调用函数内销毁，即使用 `int` 接收，也仍会读取失效目标；值对象不能补救已经悬空的返回结果。

## 按值返回建立独立结果

如果只需要加分后的新分数，函数可以按值返回计算结果，让调用者保存自己的数值。下面是独立示例，函数定义放在 `main` 之外：

```cpp
int score_after_bonus(const int score, const int bonus) {
    return score + bonus;
}
```

保留这个定义，把以下片段放在 `main` 的函数体内：

```cpp
const int player_score{15};
const int next_score{score_after_bonus(player_score, 5)};
```

`return score + bonus;` 用整数 `20` 建立本次调用的值结果。调用表达式是 `int` prvalue，用于初始化调用者自己的 `next_score` 对象；原来的 `player_score` 仍保存 `15`。调用者使用 `next_score` 时，不要求函数内的形参对象继续存在。

> [!PRACTICE] 产生新数值时优先按值返回
> 只需要产生新数值时，按值返回让调用者保存独立结果，通常更容易判断生命周期。引用返回适合调用者确实需要继续访问某个已有对象，并且接口能够保证目标在使用期间有效的情形；允许没有目标时，再由指针值表达这项可选状态。

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：表达式类型](https://timsong-cpp.github.io/cppwp/n4950/expr.type)
- [C++23 工作草案：return 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++23 工作草案：临时对象](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
