---
title: consteval 与立即调用（consteval and Immediate Invocations）
date: 2026-09-28
order: 5
---

# consteval 与立即调用（consteval and Immediate Invocations）

[`constexpr` 函数](./01-constexpr-functions-and-evaluation-contexts.md#让同一个计算用于两种语境)允许合适的调用参与常量求值，但普通调用仍然可以使用运行时才取得的输入。如果某个接口要求调用结果必须在翻译期间形成，仅给函数加上 `constexpr` 还不够。

`consteval` 把这项要求写在函数声明上。声明为 `consteval` 的函数是**立即函数（immediate function）**。本篇讨论在 `main` 等普通非模板函数中，通过函数名直接调用这类函数的情况，不含 [`decltype` 等不求值语境](../34-expression-types-and-forwarding/01-decltype-and-expression-types.md#不求值仍然要求表达式合法)。这类调用必须满足常量求值要求，不能因为接收结果的变量是普通变量，就退回运行时计算。

## 结果交给普通变量，调用仍须常量求值

下面两个函数都给压力值增加 `20` kPa。区别在于调用方是否可以把普通运行时输入交给它们：

```cpp
#include <iostream>

constexpr int add_margin(int value) {
    return value + 20;
}

consteval int fixed_margin(int value) {
    return value + 20;
}

int main() {
    int current{220};
    const int measured{add_margin(current)};
    int configured{fixed_margin(220)};
    configured += 10;

    std::cout << measured << ' ' << configured << '\n';
}
```

程序输出 `240 250`。`add_margin(current)` 可以读取普通对象 `current`，完成普通调用。编译器是否恰好提前算出它的结果，属于优化选择，不改变调用的语言要求。

`fixed_margin(220)` 则不能保留到运行时再计算。在这里，它构成立即调用（immediate invocation），必须满足常量表达式要求；`220` 与实际执行的加法都符合要求，因此得到结果 `240`。

随后，用这个结果初始化的 `configured` 仍是普通 `int`，可以再增加 `10`。**调用怎样求值，与保存结果的对象能否修改，是两个判断。**`consteval` 没有把调用方变量自动变成 `constexpr` 对象，也没有使之后读取这个普通变量都成为常量表达式。

如果希望结果对象本身也可用于后续常量表达式，可以把它声明为 `constexpr int configured{fixed_margin(220)};`；这时自然也不能再修改它。

## 无法常量求值时，不会改走运行时路径

保留上面两个函数，只把 `main` 替换为以下错误对照：

```cpp
int main() {
    int current{220};
    const int configured{fixed_margin(current)}; // 错误：读取普通对象 current
    std::cout << configured << '\n';
}
```

`current` 在源码中看起来就是 `220`，而且还没有被修改，这仍不足以使它的读取符合这里的常量表达式要求。`fixed_margin(current)` 不能完成所要求的常量求值，所以程序编译失败。

把接收变量从 `const int` 改成 `int` 无法消除错误；要求来自立即调用本身。如果把输入改为 `constexpr int current{220};`，这次直接调用就可以成立。改变的是输入的常量表达式资格，不是编译器突然变得更善于推断数值。

对上述普通直接调用，可以这样比较两种声明：

| 调用情形 | constexpr 函数 | consteval 函数 |
| --- | --- | --- |
| 合适的常量输入，结果用于初始化 `constexpr` 对象 | 调用必须满足该初始化要求 | 调用同样必须满足该初始化要求 |
| 合适的常量输入，结果交给普通局部变量 | 可以是普通调用，不由函数声明强制常量求值 | 仍必须常量求值 |
| 求值需要读取普通运行时输入 | 可以进行普通调用 | 调用不成立，不能退回运行期 |

> [!IMPORTANT]
> `constexpr` 为函数提供参与常量求值的能力；`consteval` 进一步限制这里的调用方式。二者的区别是接口允许哪些调用，不是对优化强度作出不同建议。

这个比较有明确范围：它针对上述从普通函数发起的直接调用，不把立即函数内部的所有子表达式都当作彼此独立的常量表达式。

## 立即函数的普通形参仍不是模板参数

调用必须常量求值，并不意味着函数体内的 `value` 自动变成[值模板参数](./04-static-assertions-and-compile-time-contracts.md#依赖模板参数的断言按所需实例检查)。下面是放在命名空间作用域中的错误定义：

```cpp
consteval int checked_pressure(int value) {
    static_assert(value >= 0 && value <= 400, "pressure must be between 0 and 400");
    return value;
}
```

错误位于 `static_assert` 的条件。它必须作为独立的常量表达式成立，不能读取这个普通按值形参，再等待某一次调用把数值补进断言。

即便所有调用都写成 `checked_pressure(240)`，函数定义中的断言也不会随实参分别重写一遍。`consteval` 仍然定义一个通过普通形参接收数值的函数；它没有把 `checked_pressure(240)` 变成以 `240` 为模板实参的一份特化。

这里要区分两个求值边界：检查整个调用时，形参可以在这次常量求值中创建并使用；检查 `static_assert` 条件时，该条件本身有独立要求。前者成立，不意味着后者也成立。这与[普通形参不能直接初始化局部 constexpr 对象](./02-constant-evaluation-and-local-state.md#形参的值不会成为另一项声明的常量条件)是同一类边界。

## 用普通条件判断拒绝非法实参

若要校验每次调用传入的压力值，可以在函数的求值路径中使用普通 `if`。下面约定配置范围为 `0` 到 `400` kPa，包含两端：

```cpp
#include <iostream>
#include <stdexcept>

consteval int checked_pressure(int value) {
    if (value < 0 || value > 400) {
        throw std::invalid_argument{"pressure must be between 0 and 400"};
    }

    return value;
}

int main() {
    const int configured{checked_pressure(240)};
    std::cout << configured << '\n';
}
```

程序输出 `240`。普通 `if` 在这次常量求值中检查形参；条件为 `false`，实际路径没有执行 `throw`，因此调用可以成功。

这里的 `std::invalid_argument` 是 `<stdexcept>` 提供的标准异常类型，可用说明文本构造。[抛出异常](../18-exception-propagation-and-failure-state/01-throwing-catching-and-propagating-exceptions.md#先区分计算结果与失败信息)本来是合法的 C++ 操作，但 **C++23 的常量求值不能实际执行 `throw`**。因此，它可以标记不允许成功完成常量求值的路径。

保留这个函数，把 `main` 替换为：

```cpp
int main() {
    const int configured{checked_pressure(420)}; // 错误：求值进入 throw 路径
    std::cout << configured << '\n';
}
```

这次输入 `420` 使条件为 `true`。常量求值走到 `throw`，调用不能满足要求，于是编译失败。函数定义里出现 `throw` 并未使所有调用都失效；决定结果的是当前调用实际走到哪条路径。

这也不是“程序启动后抛出异常，再由 `catch` 接住”。当前调用本身不合法，给 `main` 加上运行时 `try` / `catch` 不能修复它。编译器通常会指出常量求值失败的位置，但诊断的具体措辞不由异常对象中的说明文本保证。

## 选择来自输入契约

固定配置需要在程序构建时验证，且接口不接受运行时输入时，`consteval` 能把这项约定落实到调用处。调用者不必靠每次都把接收变量写成 `constexpr` 才能获得检查。

如果同一套校验还需要处理传感器读数、用户输入等运行时数据，`constexpr` 函数通常更符合这两种用途：合适的调用可以常量求值，普通调用则按运行时规则执行，包括必要的异常传播。是否强制提前完成，应由接口接受什么输入决定。

`consteval` 没有取消常量表达式的其他要求。计算溢出、访问无效对象等操作，仍可能使一次立即调用失败；它也不会把本来非法的函数体变成合法实现。

## 参考资料

- [C++23 工作草案：constexpr 与 consteval 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：常量表达式、立即函数与立即调用](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：static_assert 的条件](https://timsong-cpp.github.io/cppwp/n4950/dcl.pre)
