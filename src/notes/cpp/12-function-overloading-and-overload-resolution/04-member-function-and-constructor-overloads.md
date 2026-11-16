---
title: 成员函数与构造函数的重载（Member Function and Constructor Overloads）
date: 2026-08-29
order: 4
---

# 成员函数与构造函数的重载（Member Function and Constructor Overloads）

同一个对象可以经可修改路径访问，也可以经 `const` 引用只读访问。调用同名成员函数时，这些路径可能选中不同重载；圆括号内的显式实参相同，也不保证调用目标相同。

成员函数调用仍按候选函数、可行函数和最佳可行函数进行选择，只是还要把调用对象纳入匹配。本篇的成员调用使用已经建立的隐式对象成员函数（implicit object member function），调用对象均为左值。对象创建时，构造函数也要根据初始化形式与实参选择入口。

各份完整程序彼此独立，类定义位于函数外，调用代码位于 `main` 中。错误片段按标明的语境单独考察。

## 显式实参沿用普通重载规则

计数器可以提供“增加一次”和“增加指定次数”两种入口。下面的独立程序从 `0` 开始计数，增量取正的小整数，并保证相加结果可由 `int` 表示：

```cpp
#include <iostream>

class counter {
  public:
    void increment() {
        ++stored_value;
    }

    void increment(const int amount) {
        stored_value += amount;
    }

    int value() const {
        return stored_value;
    }

  private:
    int stored_value{0};
};

int main() {
    counter total{};

    total.increment();
    std::cout << total.value() << '\n';

    total.increment(3);
    std::cout << total.value() << '\n';
}
```

两个 `increment` 的显式参数数量不同，构成重载。`total` 是可修改的对象，能满足这两个成员函数的调用要求：

| 调用 | 可行的重载 | 对同一个 `total` 的影响 |
| --- | --- | --- |
| `total.increment()` | 无参数版本 | 计数从 `0` 变为 `1` |
| `total.increment(3)` | 单形参版本 | 计数从 `1` 变为 `4` |

程序依次输出 `1` 和 `4`。成员函数被选中后，其函数体操作调用对象中的成员；第二次调用使用的是第一次更新后的计数。

显式形参类型不同时，仍按实参初始化对应形参所需的隐式转换序列比较。把函数定义放进类中，不会改变已建立的数值转换等级。

## 调用对象的 const 限定参与匹配

尾随 `const` 可以使两个显式参数列表相同的成员函数成为不同重载。下面的数值槽 `number_slot` 只保存一个整数，并有意允许调用者直接读写它；两个 `value()` 都返回对这个成员的引用。

```cpp
#include <iostream>

class number_slot {
  public:
    int& value() {
        return stored_value;
    }

    const int& value() const {
        return stored_value;
    }

  private:
    int stored_value{7};
};

int main() {
    number_slot current{};
    const number_slot& view{current};
    const number_slot fixed{};

    current.value() = 9;

    std::cout << current.value() << ' ' << view.value() << ' ' << fixed.value() << '\n';
}
```

> [!IMPORTANT] 调用对象要满足隐式对象形参的要求
> **对这里的左值调用，调用对象的匹配可以用隐式对象形参（implicit object parameter）描述：**
>
> | 成员函数 | 调用对象所需的绑定 |
> | --- | --- |
> | `int& value()` | `number_slot&` |
> | `const int& value() const` | `const number_slot&` |
>
> 可修改的 `number_slot` lvalue 能满足两项要求；`const number_slot` lvalue 只能满足后一项。两项显式参数列表相同且都可行时，绑定到限定更少的对象类型更好，因此非 `const` 路径在本例中选择非 `const` 版本。
>
> 这些引用类型用于描述语言层面的匹配，不是源码中实际声明的首形参，也不规定机器调用怎样传参。

三条访问路径的关系是：

| 调用表达式 | 当前路径及其实际目标 | 可行版本与选择 | 返回引用 |
| --- | --- | --- | --- |
| `current.value()` | 可修改路径，指定 `current` | 两项都可行，非 `const` 版本更好 | `int&` |
| `view.value()` | 只读路径，仍指定 `current` | 只有 `const` 版本可行 | `const int&` |
| `fixed.value()` | 只读路径，指定独立的 `const` 对象 `fixed` | 只有 `const` 版本可行 | `const int&` |

`current.value()` 调用非 `const` 版本，所得表达式是指定 `current` 中整数成员的 `int` lvalue，赋值通过它把该成员改为 `9`。`view` 没有创建副本，所以随后通过它读到的也是 `9`；`fixed` 中的整数仍为 `7`。程序输出 `9 9 7`。

返回的引用借用成员子对象，只能在所属对象仍然存活时使用。这里读取和赋值都发生在两个数值槽的生命周期内。

沿用上一完整程序的类与变量，下面两条错误语句分别放入 `main` 中单独考察：

```cpp
view.value() = 11;  // 错误：返回的 const int& 不提供可写访问
fixed.value() = 11; // 错误：返回的 const int& 不提供可写访问
```

> [!WARNING] 调用合法不等于返回路径可写
> 上面两次 `value()` 调用都能选中 `const` 成员函数，失败的是随后对结果的赋值。返回的 `const int&` 只提供只读访问，即使 `view` 实际指代可修改的 `current`，也不能通过这条路径给成员赋值。

> [!WARNING] 返回类型不同不能代替尾随 const
> 两个 `value()` 能形成重载，依据是成员函数的尾随 `const`。返回类型中的 `const int&` 则限制调用结果的访问能力。
>
> 若只去掉第二个 `value()` 的尾随 `const`，保留不同的返回类型，两项声明就仅在返回类型上有区别，程序会因不能形成这种重载而编译失败。调用对象选择成员函数的资格与返回结果允许的操作，需要分别判断。

> [!PRACTICE] 成对的引用访问接口保持同一含义
> 当接口需要提供成员或元素的可写、只读引用时，`const` 与非 `const` 版本应访问同一对象、表达同一项操作，使调用者能够把差异理解为访问能力的差异。
>
> 返回可写引用会允许调用者直接修改内部状态。类型若需要通过专门操作维护取值约束，就应保留这种控制，而不能随意开放可写引用；仅查询简单整数也可以按值返回。本例的数值槽有意允许直接修改，所以采用成对的引用接口。

### 调用对象与显式实参必须共同比较

前一组 `value()` 没有显式实参，两个版本只需比较调用对象的匹配。具有显式实参时，仍须遵循[每个位置都不更差、至少一处更好](03-best-viable-functions-and-ambiguous-calls.md#多个实参必须整体比较)的条件：

> [!IMPORTANT] 对象匹配不能抵消实参匹配
> **对这里的成员函数重载，调用对象也占一个匹配位置，与圆括号内的显式实参共同参与比较。**一个候选要据此优于另一个候选，必须在所有位置都不更差，并且至少一处更好；某个位置更好不能抵消另一个位置更差。
>
> 在调用对象上优于某项候选，只证明其中一个位置更好，不能据此直接确定最终函数。

下面是独立的错误程序。两个声明表示输出整数或浮点数，却具有不同的尾随 `const`；这组声明用于展示匹配冲突，不作为只读输出接口的设计建议。调用处已经存在歧义，因此无需定义函数体：

```cpp
class number_printer {
  public:
    void print(int value);
    void print(double value) const;
};

int main() {
    number_printer printer{};

    printer.print(2.5); // 错误：调用存在歧义
}
```

两项候选都可行，但分别在不同位置上占优：

| 候选函数 | 调用对象 `printer` 的匹配 | 显式实参 `2.5` 的匹配 |
| --- | --- | --- |
| `print(int)` | 绑定 `number_printer&`，比另一项更好 | `double` 到 `int`，Conversion，比另一项更差 |
| `print(double) const` | 绑定 `const number_printer&`，比另一项更差 | Exact Match，比另一项更好 |

两条对象绑定序列都属于 Exact Match，但能根据引用限定关系分出优劣。与此同时，浮点版本对显式实参更好。两项候选都无法满足“所有位置都不更差”，因此没有唯一最佳函数；不能只凭 `printer` 可修改就选定非 `const` 版本。

## 构造函数也形成重载集

一个二维位置可以默认位于原点，也可以在创建时明确给出横、纵坐标。下面是另一份独立程序，其中的 `position` 定义与前文同名类型分开使用：

```cpp
#include <iostream>

class position {
  public:
    position() : x{0}, y{0} {}

    position(const int initial_x, const int initial_y) : x{initial_x}, y{initial_y} {}

    int current_x() const {
        return x;
    }

    int current_y() const {
        return y;
    }

  private:
    int x;
    int y;
};

int main() {
    const position origin{};
    const position point{20, 10};

    std::cout << origin.current_x() << ' ' << origin.current_y() << '\n';
    std::cout << point.current_x() << ' ' << point.current_y() << '\n';
}
```

这个类具有用户声明的构造函数，不是聚合类型。这里的花括号初始化按相应的构造函数规则处理，不是直接按位置填写私有数据成员：

| 对象定义 | 选择的构造函数 | 建立的成员初值 |
| --- | --- | --- |
| `const position origin{};` | 无参数构造函数 | `x` 为 `0`，`y` 为 `0` |
| `const position point{20, 10};` | 双形参构造函数 | `x` 为 `20`，`y` 为 `10` |

第一项没有初始化实参，无参数构造函数是唯一可行目标；第二项提供两个 `int`，双形参构造函数对两项实参都是精确匹配。程序依次输出 `0 0` 和 `20 10`。

> [!IMPORTANT] 构造重载选择建立初态的入口
> **类名先确定正在初始化的对象类型，再根据初始化形式与实参选择相应构造函数。**本例两条构造路径各自按成员初始化规则为 `x`、`y` 提供初值。构造函数没有普通函数那样的返回类型，也不通过接收返回值的对象来倒推选择。
>
> 本例的无参数路径建立原点，双形参路径使用给定坐标；两项初始化不是先调用无参数版本，再用另一个版本覆盖成员。

保留这个 `position` 定义，把 `main` 的函数体分别替换为下面两个错误片段，单独考察不同的失败原因。第一种情况没有可接受一个整数的构造函数：

```cpp
const position incomplete{20}; // 错误：没有可行的构造函数
```

第二种情况能选出双形参构造函数，但初始化仍然不合法：

```cpp
const position fractional{20.5, 10}; // 错误：double 到 int 是窄化转换
```

`double` 到 `int` 的隐式转换能够用于普通函数参数匹配，因此双形参构造函数可行；另一项无参数构造函数不可行，目标可以唯一确定。但是，当前花括号初始化需要把 `20.5` 转换为 `int`，违反列表初始化禁止这项窄化的规则，编译器必须诊断。

> [!WARNING] 选出构造函数不保证初始化合法
> 对这里的花括号初始化，找到唯一可行构造函数与满足初始化约束是两项判断。需要窄化的初始化可以在目标已经选定后仍被拒绝，不能把所有构造失败都解释为“没有可行函数”。

本篇这些成员调用与构造调用的目标都在编译期确定。运行时改变计数或数值槽中的整数，只会改变被操作的状态，不会据此重新选择重载。

## 参考资料

- [C++23 工作草案：调用对象与隐式对象形参](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general#4)
- [C++23 工作草案：引用绑定的限定排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#3.2.6)
- [C++23 工作草案：所有匹配位置的整体比较](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general#2)
- [C++23 工作草案：成员函数与调用对象](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：构造函数的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.ctor)
- [C++23 工作草案：列表初始化选择构造函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
- [C++23 工作草案：列表初始化的空实参处理与窄化限制](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list#3)
