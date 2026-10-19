---
title: constexpr 构造与类对象（constexpr Construction and Class Objects）
date: 2026-09-28
order: 3
---

# constexpr 构造与类对象（constexpr Construction and Class Objects）

一个压力区间可以把上下界保存在私有成员中，通过构造函数建立状态，再用成员函数判断读数是否落在区间内。这套接口也能参与常量求值，不需要为了编译期配置放弃封装。

**构造函数的 `constexpr` 允许合适的构造调用参与常量求值；对象声明上的 `constexpr` 则要求这次初始化满足常量表达式规则，并把对象声明为 `const`。**二者约束的位置不同，不能相互替代。

## 构造与查询共同组成常量表达式

下面的完整程序以整数千帕（kPa）表示压力。`pressure_limits` 的构造函数保存两个边界，`contains()` 按包含两端的闭区间判断。这里先由调用方提供有序边界。

```cpp
#include <iostream>

class pressure_limits {
  public:
    constexpr pressure_limits(int lower_kpa, int upper_kpa)
        : lower_kpa{lower_kpa}, upper_kpa{upper_kpa} {}

    constexpr int minimum_kpa() const {
        return lower_kpa;
    }

    constexpr int maximum_kpa() const {
        return upper_kpa;
    }

    constexpr bool contains(int pressure_kpa) const {
        return lower_kpa <= pressure_kpa && pressure_kpa <= upper_kpa;
    }

  private:
    int lower_kpa;
    int upper_kpa;
};

int main() {
    constexpr pressure_limits preset{220, 260};
    constexpr bool accepted{preset.contains(240)};
    constexpr int width_kpa{preset.maximum_kpa() - preset.minimum_kpa()};

    int requested_upper_kpa{280};
    pressure_limits adjustable{220, requested_upper_kpa};
    requested_upper_kpa = 290;
    adjustable = pressure_limits{230, requested_upper_kpa};

    std::cout << accepted << ' ' << width_kpa << '\n';
    std::cout << adjustable.maximum_kpa() << '\n';
}
```

输出为：

```text
1 40
290
```

`preset` 的初始化先用 `220` 和 `260` 初始化构造形参，再初始化两个成员。整次构造满足常量表达式要求，因此可以建立这个 `constexpr` 对象。`contains()` 等查询也声明为 `constexpr`，读取 `preset` 的成员后得到的结果可以继续初始化 `accepted` 和 `width_kpa`。

`adjustable` 使用同一个构造接口，但它的初始上界来自可修改的普通对象。它的声明没有要求常量求值，也没有把自己声明为 `const`，因而可以随后接受赋值。构造函数带有 `constexpr`，不会自动让所有 `pressure_limits` 对象成为常量。

## constexpr 与 const 分别作用于哪里

这里的查询函数同时写了 `constexpr` 和尾随 `const`，两者承担不同职责：

| 写法 | 当前示例中的含义 |
| --- | --- |
| 构造函数前的 `constexpr` | 合适的构造调用可以参与常量求值 |
| 查询函数前的 `constexpr` | 合适的查询调用可以参与常量求值 |
| 查询函数尾部的 `const` | 允许通过只读调用对象使用这项查询 |
| `preset` 声明上的 `constexpr` | 要求常量初始化，并把这个对象声明为 `const` |

`constexpr` 成员函数**不会隐含尾随 `const`**。例如，只把原类的 `maximum_kpa()` 替换成下面这个版本：

```cpp
constexpr int maximum_kpa() {
    return upper_kpa;
}
```

原来 `preset.maximum_kpa()` 的调用就会编译失败：`preset` 是 `const` 对象，而这个版本没有提供只读调用接口。失败先发生在[调用对象的访问资格](../10-class-interfaces-and-encapsulation/02-const-member-functions-and-read-only-access.md#const-对象只能提供受限访问)上，并不是编译器不能算出 `260`。

反过来，如果保留尾随 `const`，只去掉查询函数前的 `constexpr`，通过 `preset` 调用它仍符合只读访问规则，但这次调用不能用于 `width_kpa` 的常量初始化。**可以读取某个常量对象，不等于这项读取操作已经具备常量求值接口。**

## 类的成员和析构也要满足条件

声明一个 `constexpr` 类对象还要求其类型是**字面类型（literal type）**。这是语言为常量表达式规定的类型类别，不是“可以用一个字面量拼写”的意思。

对当前没有其他对象模型特征、只有两个 `int` 成员的类，可以逐项说明它为何满足要求：

- `int` 属于字面类型，两个普通整数成员满足成员类型的要求。
- 类提供了一个非复制、非移动的 `constexpr` 构造函数。
- 类没有自行声明析构函数；语言提供的[隐式默认析构](../16-class-object-destruction-and-resource-lifetime/02-implicit-destructors-and-reverse-member-destruction.md#默认析构仍然销毁成员)在这里是 `constexpr` 析构函数。

此外，`constexpr` 对象还需要满足**常量销毁（constant destruction）**要求：按常量求值规则检查相应销毁过程时，不能依赖不允许的操作。当前类只保存整数，没有额外清理动作，这项要求自然成立。这个检查不表示对象在源程序中的生命周期被省略，也不要求为它手写一个空析构函数。

例如，在原类的 `public` 部分加上以下用户提供的析构函数：

```cpp
~pressure_limits() {}
```

这个空函数并没有因为函数体简单而自动成为 `constexpr` 析构函数，类不再满足这里的字面类型条件，原来的 `constexpr pressure_limits preset{220, 260};` 会编译失败。保留原本的隐式析构即可；若确实需要明确写出默认语义，当前类也可以使用 `~pressure_limits() = default;`。

> [!WARNING]
> “有一个 `constexpr` 构造函数”不足以证明任意对象都能声明为 `constexpr`。还要检查类型条件、这次初始化实际执行的操作及对象的销毁要求。字面类型提供的是参与常量表达式的可能性，也不保证每组实参都能构造出常量对象。

## 非法边界可以让常量初始化失败

若区间要求 `0 <= lower_kpa <= upper_kpa`，可以在构造时建立这项不变式。恢复最初的查询与隐式析构，在程序开头增加 `<stdexcept>`，再把原构造函数替换为：

```cpp
constexpr pressure_limits(int lower_kpa, int upper_kpa)
    : lower_kpa{lower_kpa}, upper_kpa{upper_kpa} {
    if (lower_kpa < 0 || lower_kpa > upper_kpa) {
        throw std::invalid_argument{"invalid pressure limits"};
    }
}
```

有效边界不会经过 `throw`，因此原来的 `preset{220, 260}` 仍然可以常量初始化。但若把 `main` 中的 `preset` 声明替换成下面这一行，就会编译失败：

```cpp
constexpr pressure_limits preset{260, 220}; // 错误：求值进入了 throw 路径
```

C++23 的常量求值不允许执行 `throw` 表达式。这里不是先构造一个无效的常量对象再等待运行期捕获异常，而是这次初始化不再是常量表达式，无法满足声明要求。

同一个构造函数仍然可以接受普通运行期数据。`std::invalid_argument` 的 `what()` 成员函数返回构造异常时保存的说明文本。把程序中的 `main` 替换为下面这段，`catch` 中通过 `error.what()` 取得文本并输出 `invalid pressure limits`：

```cpp
int main() {
    const int requested_lower_kpa{260};
    const int requested_upper_kpa{220};

    try {
        const pressure_limits limits{requested_lower_kpa, requested_upper_kpa};
        std::cout << limits.minimum_kpa() << '\n';
    } catch (const std::invalid_argument& error) {
        std::cout << error.what() << '\n';
    }
}
```

普通调用执行到 `throw` 时，仍遵守[异常传播规则](../18-exception-propagation-and-failure-state/01-throwing-catching-and-propagating-exceptions.md#异常沿正在执行的调用关系传播)。`limits` 没有成功构造，处理权转移到匹配的 `catch`。`constexpr` 没有为运行期调用更换一套错误语义。

这种写法让同一套构造接口维护相同的不变式：固定配置必须在常量初始化时通过检查；运行期数据不合法时则报告构造失败。需要保持一致的是区间规则，而每次调用是否必须成为常量表达式，仍由调用语境决定。

## 参考资料

- [C++23 工作草案：constexpr 函数与对象声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：字面类型的条件](https://timsong-cpp.github.io/cppwp/n4950/basic.types.general#10)
- [C++23 工作草案：默认析构函数的 constexpr 条件](https://timsong-cpp.github.io/cppwp/n4950/class.dtor#9)
- [C++23 工作草案：常量表达式与常量销毁](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：invalid_argument 的说明文本](https://timsong-cpp.github.io/cppwp/n4950/std.exceptions#invalid.argument)
