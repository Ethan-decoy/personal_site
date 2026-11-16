---
title: 复合赋值与值产生运算（Compound Assignment and Value-Producing Operations）
date: 2026-08-31
order: 3
---

# 复合赋值与值产生运算（Compound Assignment and Value-Producing Operations）

一份记录保存向右 `15` 格的累计位移，再加入向右 `5` 格的位移时，可以先计算合成后的 `20` 格，也可以直接把累计记录更新为 `20` 格。计算相同，是否修改原对象、结果与哪个对象有关，却需要分别确定。

按照惯常的值运算含义，`left + right` 读取输入并产生独立结果，`left += right` 更新已有的左对象。下面的接口明确实现这两种行为；重载符号本身不会自动建立这些保证。

`displacement` 保存横向位移，`steps` 为正表示向右、为负表示向左，`0` 表示不移动。这个类型只保存一个整数，显式输入按值传递。以下运算均使用小整数，并保证相加的数学结果可由 `int` 表示。

## 加法产生独立结果

先只计算合成结果。下面是完整程序，类型与非成员函数定义在 `main` 之前；`accumulated` 是随后还要更新的累计记录，因此保留可修改性：

```cpp
#include <iostream>

struct displacement {
    int steps;
};

displacement operator+(const displacement left, const displacement right) {
    return displacement{left.steps + right.steps};
}

int main() {
    displacement accumulated{15};
    const displacement increment{5};

    const displacement projected{accumulated + increment};

    std::cout << projected.steps << ' ' << accumulated.steps << ' ' << increment.steps << '\n';
}
```

函数用两个操作数分别初始化按值形参，读取步数并计算 `15 + 5`。`projected` 保存合成结果，原来的两个对象保持不变，因此程序输出 `20 15 5`。

> [!IMPORTANT] 值返回用于建立独立结果
> **本例的 `operator+` 按值返回 `displacement`，因此加法表达式是 `displacement` 类型的 prvalue，用于初始化独立对象 `projected`。**它不把 `projected` 绑定到某个操作数，也不要求形参在函数返回后继续存在。
>
> 原操作数没有改变，来自这份函数只读取输入的实现；仅凭按值返回，不能推断函数没有修改对象等副作用。

## 复合赋值修改已有对象

要把新的位移直接累加到原记录中，需要另行提供 `operator+=`。把开篇程序的 `displacement` 类定义替换为下面这一份，保留原来的非成员 `operator+` 与 `main`：

```cpp
struct displacement {
    int steps;

    displacement& operator+=(const displacement increment) {
        steps += increment.steps;
        return *this;
    }
};
```

成员形式通过调用对象取得左操作数，右操作数初始化按值形参 `increment`。函数体中的 `steps += increment.steps` 对两个整数使用内建复合赋值，把计算结果写回调用对象的成员；它不是再次调用类类型的 `operator+=`。

> [!IMPORTANT] 复合赋值的修改与引用结果
> **这份 `operator+=` 修改调用对象，并用 `displacement&` 返回类型与 `return *this;` 保留该对象的身份。**调用期间，`this` 指向调用对象，`*this` 是指定该对象的 lvalue；返回引用绑定到这个对象。
>
> 因此，选中这项函数的 `accumulated += increment` 是 `displacement` 类型的 lvalue，指定更新后的 `accumulated`，不会仅因函数返回就建立独立的位移副本。

将以下片段追加到开篇 `main` 的末尾，继续使用仍为 `15` 的 `accumulated`、值为 `5` 的 `increment` 和保存 `20` 的 `projected`：

```cpp
displacement& updated{accumulated += increment};
const bool same_object{&updated == &accumulated}; // true

std::cout << accumulated.steps << ' ' << updated.steps << ' ' << projected.steps << ' '
          << same_object << '\n';

updated += increment;
std::cout << accumulated.steps << ' ' << updated.steps << ' ' << projected.steps << ' '
          << increment.steps << '\n';
```

追加部分先输出 `20 20 20 1`。第一次复合赋值把 `accumulated` 更新为 `20`，`updated` 则绑定到同一个对象；地址比较为 `true`，按默认布尔输出方式显示为 `1`。这时独立的 `projected` 恰好也保存 `20`，相同数值不表示对象相同。

接着，通过 `updated` 再执行一次 `+= increment`，追加部分再输出 `25 25 20 5`。修改的是 `accumulated`，所以经 `updated` 也读到 `25`；独立的 `projected` 仍为 `20`，右操作数 `increment` 仍为 `5`。

当前两项接口的返回声明、表达式类型和值类别要分开判断：

| 表达式 | 函数返回声明 | 表达式类型与值类别 | 本例如何使用结果 |
| --- | --- | --- | --- |
| `accumulated + increment` | `displacement` | `displacement`，prvalue | 初始化独立的 `projected` 对象 |
| `accumulated += increment` | `displacement&` | `displacement`，lvalue | 初始化引用 `updated`，保留原对象身份 |

返回引用，不表示接收声明自动成为引用。本例明确用 `displacement&` 定义 `updated`；若改用 `displacement` 按值接收同一项调用的结果，则会初始化另一个对象。返回形式与接收方式共同决定最后建立的关系。

> [!WARNING] 重载符号不强制规定返回形式
> `operator+=` 可以采用其他返回类型，也可以定义为非成员函数。返回调用对象的引用是延续内建复合赋值结果模型的接口惯例，不是所有重载 `+=` 都必须满足的语法要求。
>
> 例如，一项合法返回 `void` 的 `operator+=` 可以完成更新，却没有可供 `displacement&` 绑定的结果；若仍按上面的方式初始化 `updated`，就会编译失败。判断结果指代谁、能怎样接收，应核对选中函数的返回声明与实现。

[调用对象与 this](../10-class-interfaces-and-encapsulation/deep-dives/01-implicit-object-parameter-this-and-implementation-model.md#函数体中的-this-表达式)进一步说明了 `this` 与 `*this` 的关系。

## 只读输入与可修改的调用对象

沿用带 `operator+=` 的类定义和原来的非成员 `operator+`，用下面的正常片段替换 `main` 的函数体。从同一组初值出发，把累计记录声明为 `const`，单独考察它能参与哪些操作：

```cpp
const displacement accumulated{15};
const displacement increment{5};

const displacement projected{accumulated + increment};
std::cout << projected.steps << ' ' << accumulated.steps << '\n';
```

这份变体输出 `20 15`。加法函数按值取得两个输入，计算独立结果，不需要修改原来的 `const` 对象。

若在这个 `main` 中追加下面的错误语句，则程序不能通过编译：

```cpp
accumulated += increment; // 错误：当前成员函数不能以 const 对象作为调用对象
```

> [!WARNING] 当前更新接口要求可修改的调用对象
> 这份成员 `operator+=` 没有尾随 `const`。对这里的左值调用，其隐式对象形参要求可按 `displacement&` 绑定；`const displacement` 不能满足这个要求，因此错误发生在调用匹配阶段。
>
> 右操作数是另一项判断：本例的 `increment` 本来就是 `const` 对象，仍可用于初始化按值形参。不能把“左对象不能接受更新”误解成“参与运算的对象都不能是 `const`”。

## 相关运算应当保持一致

对于这里的位移值，`+` 与 `+=` 应使用同一项合成规则。有效输入下，`left + right` 得到的位移值，应与先复制 `left`、再对副本执行 `+= right` 得到的位移值一致；对原对象是否产生修改，仍是两项接口之间的区别。

可以让加法复用复合赋值。保留带 `operator+=` 的类定义，把开篇的非成员 `operator+` 替换为下面这一项，不与旧定义并列追加：

```cpp
displacement operator+(displacement left, const displacement right) {
    left += right;
    return left;
}
```

按值形参 `left` 是左操作数的独立副本，因此这里有意允许修改它。`left += right` 更新的是这个副本，函数随后按值返回结果，原来的左操作数没有被更新。使用这份替代实现，前面正常示例的输出保持相同。

> [!PRACTICE] 用一致的组合规则维护相关接口
> 类型同时提供 `+` 与 `+=` 时，应让两项操作对有效输入采用一致的组合规则，分别承担产生新值与更新原对象的职责。已有可用的 `+=`、且复制左操作数符合值运算用途时，`+` 可以更新副本后返回，让组合规则与必要检查集中在一处维护，减少修改一项后另一项遗漏的风险。
>
> 这里的类型只保存一个整数，复制成本低；更复杂的类型还需考虑复制成本与接口约束。分别实现两项函数也合法，只是需要持续核对它们的契约；复用是实现选择，C++ 不会自动验证两项操作是否一致。

> [!WARNING] 重载不会自动检查底层加法的范围
> 无论直接计算成员之和，还是通过 `+=` 复用实现，底层仍然执行 `int` 加法。数学结果超出 `int` 可表示范围时，内建有符号整数运算产生未定义行为；把它包在运算符函数中，不会自动得到范围检查。
>
> 本篇以结果可表示为前提。若类型还承诺更窄的有效范围，公开运算也要遵守该约束，重载语法不会自动维护类不变式。

## 参考资料

- [C++23 工作草案：二元运算符的成员与非成员形式](https://timsong-cpp.github.io/cppwp/n4950/over.binary)
- [C++23 工作草案：函数调用结果的值类别](https://timsong-cpp.github.io/cppwp/n4950/expr.call#13)
- [C++23 工作草案：this 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.this)
- [C++23 工作草案：内建赋值与复合赋值](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：表达式求值与结果范围](https://timsong-cpp.github.io/cppwp/n4950/expr.pre#4)
- [C++ Core Guidelines：按照惯常含义定义运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-conventional)
