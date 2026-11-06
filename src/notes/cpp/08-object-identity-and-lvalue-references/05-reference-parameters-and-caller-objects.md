---
title: 引用参数与调用者对象（Reference Parameters and Caller Objects）
date: 2026-08-28
order: 5
---

# 引用参数与调用者对象（Reference Parameters and Caller Objects）

计分程序用整数对象保存选手当前的分数。加分函数若通过引用形参（reference parameter）绑定这条已有记录，就能直接更新调用者保存的分数；只修改按值形参，则不会改变原记录。

以下得分与加分值均使用非负的小整数，相加结果可由 `int` 表示。各完整程序彼此独立；片段的接续位置另行说明。

## 函数调用初始化引用参数

```cpp
void add_points(int& score, const int points) {
    score += points;
}

int main() {
    int player_score{10};
    add_points(player_score, 5);
}
```

调用发生时，`player_score` 是指定已有 `int` 对象的 lvalue，因此引用形参 `score` 绑定到它。`points` 则是按值形参，由实参 `5` 初始化为独立的 `const int` 对象。

函数体中的 `score += points;` 通过引用读取并修改原来的 `player_score` 对象。调用完成后，`player_score` 保存 `15`；修改已经发生在原记录上，不需要再把结果复制回去。

> [!IMPORTANT] 按值形参与引用形参的初始化
> **每次函数调用都会用对应实参初始化形参。整数按值形参是独立对象；引用形参直接绑定已有对象时，建立的是对原对象的访问关系，不另建该整数的副本。**引用形参声明中虽然没有初始化器，绑定仍在每次调用时完成。

## 非 const 引用表达必需的修改目标

`int&` 形参需要能够直接绑定的、允许修改的 `int` lvalue。保留上面的函数定义，以下错误片段放在 `main` 的函数体内分别考察，不接到正常调用之后：

```cpp
add_points(10, 5); // 错误：10 是 prvalue

const int final_score{20};
add_points(final_score, 5); // 错误：不能丢弃 const 访问约束
```

`add_points` 需要访问可以修改的得分记录。字面量 `10` 能够提供数值，却不满足这里 `int&` 所需的 lvalue 条件。`final_score` 虽然是 lvalue，但其类型为 `const int`，也不能用于建立允许修改得分的 `int&` 绑定。

> [!IMPORTANT] 非 const 引用形参要求可修改目标
> **这里的 `int&` 形参要求调用者提供可绑定的、可修改的 `int` 对象。**它让函数具有经形参修改原对象的能力，不表示每次调用一定发生修改。实际需要修改目标的函数，应当用名称清楚表达这种作用。

`add_points` 直接说明会增加分数；这样的名称能让调用者预期原记录会发生变化。

## const 左值引用限制函数内的访问

查询分数是否达到目标，不需要经参数修改得分。下面的 `reaches_target` 使用只读引用访问分数。保留开篇程序的 `add_points` 定义，在 `main` 之前增加这个函数定义：

```cpp
bool reaches_target(const int& score, const int goal) {
    return score >= goal;
}
```

`score` 可以直接绑定普通 `int` 对象或 `const int` 对象，函数体不能通过这个形参修改整数。`goal` 按值接收目标分数，是独立的只读整数形参。

> [!IMPORTANT] const 引用形参限制访问路径
> **`const int&` 形参限制的是经该形参修改目标，不会把直接绑定的普通 `int` 对象变成 `const` 对象。**原对象仍可通过其他允许的路径改变；函数经该形参读取的是同一目标的当前值。

加分后，`player_score` 保存 `15`。可以查询当前是否达到 `20` 分，也可以先计算假设的分数，查询“再得 `5` 分能否达标”，而不修改当前记录。在 `main` 中的 `add_points(player_score, 5);` 之后加入下面的查询：

```cpp
const bool reached{reaches_target(player_score, 20)};         // false
const bool would_reach{reaches_target(player_score + 5, 20)}; // true
```

第一条查询直接绑定已有的 `player_score` 对象，比较 `15 >= 20`，得到 `false`。第二条查询绑定计算结果对应的临时目标，依次发生以下过程：

1. `player_score + 5` 读取当前的 `15`，计算得到 prvalue `20`；为初始化引用形参 `score`，物化临时 `const int` 对象来保存这个结果。按值形参 `goal` 保存独立的整数 `20`。
2. 函数比较临时目标中的分数与目标分数，得到 `true`，按值返回这个 `bool` 结果，用它初始化 `would_reach`。函数返回后，临时目标在当前完整表达式结束前仍然存在。
3. 声明末尾的分号结束包含调用的完整表达式，临时目标在这里销毁。`would_reach` 仍保存 `true`，原来的 `player_score` 仍保存 `15`；这次查询没有实际加分。

> [!IMPORTANT] 临时实参的销毁时刻
> **绑定到引用形参的临时对象，存活到包含调用的完整表达式结束。**这与用 prvalue 初始化块作用域局部 `const int&`、让相应临时目标保持到该局部引用生命周期结束的情况不同。判断目标何时销毁，要核对引用初始化的语境。

> [!WARNING] 保存访问关系不会延长临时实参的生命周期
> 临时目标在本次调用期间可用，不代表可以在包含调用的完整表达式结束后继续访问它。即使把目标地址等访问关系保存下来，目标仍会在既定边界销毁；之后再通过悬空的访问关系读取原对象，行为未定义。保存独立数值与继续借用原目标，有不同的生命周期要求。

## 指针保留可选目标状态

计分程序还可以清零当前选中的得分记录。有选中记录时执行清零，没有选中记录时不修改任何分数。指针参数可以用空指针值表达“没有选中记录”。下面是另一个独立的完整程序：

```cpp
void reset_score(int* target) {
    if (target != nullptr) {
        *target = 0;
    }
}

int main() {
    int player_score{15};
    int* selected_score{&player_score};

    reset_score(selected_score);

    selected_score = nullptr;
    reset_score(selected_score);
}
```

`selected_score` 保存当前选中记录的地址。第一次调用用这个指针值初始化形参 `target`：这是两个独立的指针对象，指向同一个 `player_score` 对象。函数执行 `*target = 0;` 后，得分变为 `0`，调用者的 `selected_score` 仍指向这条记录。

如果把函数体中的 `*target = 0;` 改成 `target = nullptr;`，改变的就是本次调用的指针形参：原分数仍为 `15`，调用者的 `selected_score` 也仍指向原对象。这既没有清零得分，也没有取消调用者保存的选择。

> [!IMPORTANT] 指针形参与被指对象是两层关系
> **`int*` 形参仍是按值初始化的独立指针对象；复制指针值不复制它指向的整数。**经 `*target` 修改的是共同指向的目标；给形参 `target` 赋新指针值，只改变形参自身，不会改写调用者的指针对象。

原程序在第一次调用后，由 `main` 执行 `selected_score = nullptr;`，取消调用者保存的选择。第二次调用收到空指针值，不进入 `if` 的分支，也不访问整数对象，`player_score` 仍为 `0`。

> [!WARNING] 非空检查不验证目标是否有效
> `target != nullptr` 只区分可正常比较的指针值是否为空。通过非空分支写入对象，还要求目标仍在生命周期内、类型匹配，并允许经该路径修改；判空不证明这些条件。若目标已经销毁，继续通过指针写入原对象的行为未定义。

若接口要求调用者一定提供对象，可以使用引用表达这项要求；若没有目标本身是合法输入，指针参数可以保留这项可选状态。

## 参数形式首先表达接口契约

当前已经认识的参数形式可以按调用关系区分：

| 参数形式 | 函数中的形参 | 能否用空值表示没有目标 | 对调用者状态的影响 |
| --- | --- | --- | --- |
| `int value` | 独立整数对象 | 不涉及目标绑定 | 修改形参不修改调用者提供数值的对象 |
| `const int& value` | 只读引用关系，可绑定已有对象或临时目标 | 没有正常的空状态 | 不能经此路径修改目标 |
| `int& value` | 对可修改对象的引用关系 | 没有正常的空状态 | 可以经此路径修改被绑定的整数 |
| `const int* value` | 独立指针对象，复制实参提供的指针值 | 可以，是否接受由接口约定 | 改写形参不改写调用者的指针；不能经此路径修改目标 |
| `int* value` | 独立指针对象，复制实参提供的指针值 | 可以，是否接受由接口约定 | 改写形参不改写调用者的指针；可经间接访问修改有效目标 |

> [!PRACTICE] 简单数值通常优先按值传递
> 对于 `int`、`double` 和指针这类复制成本低、函数只需要数值的小型标量，按值传递通常最直接。若达标查询只需要分数值，可以用下面的定义替换前面的 `const int&` 版本，查询片段保持相同；这里比较的是两种独立的接口写法：
>
> ```cpp
> bool reaches_target(const int score, const int goal) {
>     return score >= goal;
> }
> ```
>
> `const int&` 版本在语言上成立，却没有因为“没有创建独立 `int` 形参对象”就自动更快。具体调用约定、优化结果和间接访问成本都由实现与上下文决定。

参数形式应先让调用者看清独立数值、修改原对象和可选目标之间的区别，再根据实际类型和测量结果讨论性能。引用与普通指针参数都不负责维持已有调用者对象的生命周期；经参数访问目标时，目标必须仍然有效。

## 参考资料

- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：临时对象](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++ Core Guidelines：函数参数传递](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-conventional)
