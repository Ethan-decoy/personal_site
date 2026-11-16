---
title: 转换函数与目标类型结果（Conversion Functions and Target-Type Results）
date: 2026-09-01
order: 3
---

# 转换函数与目标类型结果（Conversion Functions and Target-Type Results）

`pressure_kpa` 对象保存着以千帕为单位的整数读数。普通读取函数需要写出 `pressure.value_kpa()` 这样的调用；编译器不会仅因为它返回 `int`，就自动把它当作转换接口。

类也可以通过转换函数（conversion function），让对象在相应转换语境中提供目标类型的结果。例如，`static_cast<int>(pressure)` 可以请求由压力对象取得整数。在这个例子中，构造函数规定怎样从整数建立压力对象，转换函数规定怎样由压力对象提供整数，两项接口分别声明。

## 转换函数的声明形式

转换函数是以调用对象作为转换来源的类成员函数。C++ 用 `operator` 关键字后接目标类型，组成这类函数的名称。以转换到 `int` 为例，下面的声明放在源类的 `public` 部分：

```cpp
explicit operator int() const;
```

| 声明中的部分 | 含义 |
| --- | --- |
| `operator int` | 转换函数的名称，表示由当前类对象产生 `int` 类型的结果 |
| `()` | 没有普通形参，转换来源由调用对象提供 |
| 尾随 `const` | 沿用 `const` 成员函数的访问约束，允许通过 `const` 源对象调用 |
| `explicit` | 限制这项转换被采用的语境；本例可用于直接初始化或 `static_cast`，不能用于普通复制初始化 |

`()` 是参数列表，尾随 `const` 是成员函数限定，它们都不属于函数名。

> [!IMPORTANT] 转换函数由调用对象提供目标类型结果
> **转换函数以调用对象作为转换来源，由函数体提供目标类型的结果；这里的 `operator int()` 没有普通形参。**目标类型已经写在函数名 `operator int` 中，前面不再另写返回类型，函数体仍用 `return` 提供整数结果。
>
> 声明一项转换函数，就是为源类提供相应的转换接口。普通读取函数即使返回相同类型，也不会因此自动成为这项接口。

## 显式转换函数产生目标类型结果

下面是独立的完整程序，类定义放在 `main` 之前。类中同时给出普通读取函数与转换函数，用三种写法观察同一个压力对象：

```cpp
#include <iostream>

class pressure_kpa {
  public:
    explicit pressure_kpa(const int value_kpa) : stored_value_kpa{value_kpa} {}

    int value_kpa() const {
        return stored_value_kpa;
    }

    explicit operator int() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};

int main() {
    const pressure_kpa measured_pressure{220};

    const int named_value_kpa{measured_pressure.value_kpa()};
    const int direct_value_kpa{measured_pressure};
    const int cast_value_kpa{static_cast<int>(measured_pressure)};

    std::cout << named_value_kpa << ' ' << direct_value_kpa << ' ' << cast_value_kpa << '\n';
}
```

程序输出 `220 220 220`。第一条整数声明明确调用普通成员函数 `value_kpa()`；后两条分别采用直接列表初始化与 `static_cast`，选择的是 `pressure_kpa::operator int() const`。

执行转换函数时，`measured_pressure` 是调用对象。`return stored_value_kpa;` 从它的成员中读取 `220`，作为 `int` 结果，再用于初始化目标整数对象。这里的三个整数对象独立保存各自取得的值；源对象仍然是原来的 `pressure_kpa` 对象，当前实现也没有修改它的状态。

> [!IMPORTANT] explicit 限制转换函数被采用的语境
> **本节的显式转换函数可以用于直接初始化相应目标类型的对象，或由 `static_cast` 明确请求；普通复制初始化和普通实参的隐式转换不会采用它。**能否采用这项转换函数，取决于当前语境，不取决于函数体是否只是读取数据。

保留这个完整程序的头文件与类定义，单独用下面的错误片段替换 `main` 的函数体：

```cpp
const pressure_kpa measured_pressure{220};
const int copied_value_kpa = measured_pressure; // 错误：复制初始化不采用显式转换函数
```

若只删除 `operator int()` 前的 `explicit`，保留构造函数前的 `explicit`，这项复制初始化就能成立，`copied_value_kpa` 保存 `220`。改变的是从 `pressure_kpa` 到 `int` 的转换接口，反方向的构造接口没有改变。

非显式转换函数还可以在普通函数实参转换，以及其他允许相应隐式转换的语境中提供路径。具体表达式最终是否采用它，仍取决于当时形成的候选与重载决议。

## explicit operator bool：允许条件判断，不提供普通隐式转换

读数是否可用，与读数的数值分别表示不同信息。这里用 `reading_status` 只保存可用状态：`true` 表示当前有可用读数，`false` 表示当前没有可用读数。

> [!IMPORTANT] 条件判断可以采用 explicit operator bool
> **`if` 条件使用按语境转换为 `bool`（contextual conversion to `bool`），可以采用 `explicit operator bool()`。**这是一项针对条件语境的规则，普通函数的 `bool` 形参不使用这条特殊规则。

下面是另一份独立的完整程序。类与辅助函数均定义在 `main` 之前；`inspect` 通过只读引用观察调用者的状态对象，`print_availability` 的形参是普通 `bool`，函数把收到的值输出。默认输出格式把 `true`、`false` 分别显示为 `1`、`0`：

```cpp
#include <iostream>

class reading_status {
  public:
    explicit reading_status(const bool is_available) : available{is_available} {}

    explicit operator bool() const {
        return available;
    }

  private:
    bool available;
};

void print_availability(const bool is_available) {
    std::cout << "availability: " << is_available << '\n';
}

void inspect(const reading_status& status) {
    if (status) {
        std::cout << "available\n";
    } else {
        std::cout << "unavailable\n";
    }

    print_availability(static_cast<bool>(status));
}

int main() {
    const reading_status ready{true};
    const reading_status missing{false};

    inspect(ready);
    inspect(missing);
}
```

程序输出：

```text
available
availability: 1
unavailable
availability: 0
```

构造函数从给定的布尔标志建立 `reading_status` 对象；转换函数则以状态对象为调用对象，返回其中保存的布尔值。`if (status)` 使用的是后一个方向：观察 `ready` 时进入 `if` 分支，观察 `missing` 时进入 `else` 分支。

`static_cast<bool>(status)` 明确请求布尔结果，再用这个已经具有 `bool` 类型的结果初始化 `print_availability` 的形参。直接把状态对象传给这个函数则不同。保留第二个完整程序的类与辅助函数定义，单独用以下错误片段替换 `main` 的函数体：

```cpp
const reading_status status{true};
print_availability(status); // 错误：普通的 bool 形参初始化不采用显式转换函数
```

> [!WARNING] 条件可用不代表能隐式传入 bool 形参
> **`if (status)` 可以成立，不代表 `print_availability(status)` 也成立。**前者按语境转换为 `bool`，后者需要用状态对象隐式初始化普通 `bool` 形参，不能自动采用本例的显式转换函数。
>
> 若要把这个状态作为普通布尔实参传入，可以像正常程序那样先写出 `static_cast<bool>(status)`，再传递所得结果。

### 用初始化模型区分两种语境

直接初始化布尔对象同样可以采用这项显式转换函数。仍保留第二个完整程序的类与辅助函数，以下正常片段单独替换 `main` 的函数体：

```cpp
const reading_status status{true};
const bool direct_availability(status);
std::cout << direct_availability << '\n';
```

这段代码输出 `1`。`direct_availability(status)` 出现在变量声明中，圆括号提供初值，没有发起函数调用；它使用直接初始化，可以采用 `explicit operator bool()`。前面用花括号直接列表初始化 `int` 的例子，也能采用相应的显式转换函数。

单独用以下错误片段替换同一个 `main` 的函数体：

```cpp
const reading_status status{true};
const bool copied_availability = status; // 错误：复制初始化不采用显式转换函数
```

这里的 `=` 仍然属于创建对象时的初始化语法，不是向已有对象赋值。对同一个源对象，直接初始化与普通复制初始化采用的规则不同。

这项区别对应两份假想声明。以下两行分别用于解释语言的判定模型，不接续到正常程序中；`status` 仍代表上述类的对象。普通隐式转换为 `bool` 是否成立，使用复制初始化模型判断：

```cpp
bool temporary = status;
```

这个模型不会考虑显式转换函数。`if` 所用的按语境转换为 `bool`，则使用直接初始化模型判断：

```cpp
bool temporary(status);
```

后一个模型会考虑 `explicit operator bool()`，所以本例的条件判断可以成立。两份假想声明解释的是不同语境怎样判断转换是否合法，并不是把 `if (status)` 当作普通函数调用。

## const 限定约束源对象

当前两个转换函数都是 `const` 成员函数，并且只读取对象的普通数据成员。它们可以通过 `const` 源对象调用，当前实现也不会修改源对象的状态。

> [!IMPORTANT] explicit 与 const 分别约束语境和调用对象
> **`explicit` 约束转换函数在哪些语境中被采用；尾随 `const` 约束经调用对象进行的访问，并影响它能否通过只读路径调用。**这两项限定分别判断，尾随 `const` 不修饰转换结果的类型。
>
> 本例的 `operator int() const` 仍然提供普通 `int` 值，`operator bool() const` 仍然提供普通 `bool` 值。

若只删除 `operator int()` 的尾随 `const`，函数体即使仍然只有读取与返回，也不能再通过完整程序中的只读源对象 `measured_pressure` 调用。调用资格取决于声明中的限定，相关规则见[只读路径的调用资格](../10-class-interfaces-and-encapsulation/02-const-member-functions-and-read-only-access.md#const-对象只能提供受限访问)。

非 `const` 转换函数可以在产生结果时修改调用对象，也可以只读取它；是否实际修改状态要看实现。尾随 `const` 同样不保证函数没有任何副作用，仍需检查它是否输出信息或修改外部对象。

## 参考资料

- [C++23 工作草案：转换函数](https://timsong-cpp.github.io/cppwp/n4950/class.conv.fct)
- [C++23 工作草案：explicit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.spec)
- [C++23 工作草案：隐式转换与按语境转换为 bool](https://timsong-cpp.github.io/cppwp/n4950/conv.general)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
