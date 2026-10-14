---
title: 函数模板与重载选择（Function Templates and Overload Selection）
date: 2026-09-23
order: 5
---

# 函数模板与重载选择（Function Templates and Overload Selection）

同一个函数名可以同时表示普通函数和函数模板。调用时，模板不会等普通函数都不能调用后才参与；普通函数也不会只凭“不是模板”就取得优先权。

**模板先根据本次调用确定模板实参，形成具有具体参数类型的候选，再与普通函数一起接受重载决议（overload resolution）。**参与选择与函数体能否成功实例化，需要分开判断。

## 模板先形成候选，再比较匹配

[候选函数与可行函数](../12-function-overloading-and-overload-resolution/02-candidate-and-viable-functions.md#允许的隐式转换也能建立可行性)仍然提供基本框架：名称查找得到可能的调用目标，可行性检查判断实参能否初始化形参，随后比较匹配质量。

函数模板增加了前面的一步。对本章的简单函数模板，先由显式指定或函数实参推导确定 `T`，再将它代入函数声明；成功形成的具体函数声明，才能作为模板一方的候选。编译器不会把模板想象成所有可能类型的函数，再把它们全部加入候选集合。

下面是一个完整程序。两个版本都显示收到的值，额外打印的标签用来标识选中了哪一个实现。

```cpp
#include <iostream>

void show_value(int value) {
    std::cout << "non-template: " << value << '\n';
}

template <typename T> void show_value(T value) {
    std::cout << "template: " << value << '\n';
}

int main() {
    show_value(7);
    show_value(7.5);
}
```

输出为：

```text
non-template: 7
template: 7.5
```

这两次调用可以按[标准转换序列的匹配等级](../12-function-overloading-and-overload-resolution/03-best-viable-functions-and-ambiguous-calls.md#标准转换序列的匹配等级)逐项判断：

| 调用 | 普通函数一方 | 模板一方 | 选择结果 |
| --- | --- | --- | --- |
| `show_value(7)` | `int` 到 `int`，精确匹配 | 推导 `T = int`，也是精确匹配 | 当前两者匹配相当，普通函数胜出 |
| `show_value(7.5)` | `double` 到 `int`，转换等级 | 推导 `T = double`，精确匹配 | 模板一方匹配更好，胜出 |

在第一行中，普通的 `show_value(int)` 与模板产生的 `show_value<int>(int)` 是不同函数。它们具有相同的形参类型，并不使普通函数成为模板定义的一部分。

第二行说明“普通函数也能接收这个实参”还不足以决定选择。`double` 可以转换成 `int`，所以普通函数可行；模板一方直接接收 `double`，匹配质量已经更好，无需再用普通函数优先的规则打破平局。

> [!IMPORTANT]
> 对当前普通函数与函数模板的比较，先看实参到形参的匹配关系；其他相关比较条件相同时，非模板函数才胜过模板产生的函数。不能把这条平局规则提前当作所有调用的第一条规则。

## 显式模板实参限定了本次调用目标

前例让普通函数与模板共同竞争。现在改变候选的进入方式：保留两个 `show_value` 定义，只将 `main` 替换为：

```cpp
int main() {
    show_value<double>(7);
    show_value<>(7);
}
```

两行输出都是 `template: 7`。`show_value<double>(7)` 明确使用函数模板，并指定 `T = double`。普通的 `show_value(int)` 没有模板参数，不参与这次带模板实参列表的选择。

此时形参已经确定为 `double`。实参 `7` 经过 `int` 到 `double` 的转换，初始化这个形参；这与让普通函数和模板共同竞争时选择谁，是两个不同的问题。输出中的 `7` 是 `double` 值采用默认流格式后的显示，并不表示 `T` 变回了 `int`。

`show_value<>(7)` 使用空的模板实参列表（empty template argument list）。`<>` 表示这次使用函数模板，但没有指定 `T`，所以仍从实参推导得到 `int`。这解释了它与没有尖括号的 `show_value(7)` 为什么选择不同。

这里仅有一个函数模板，因此限定到模板以后，选择很直接。若同名函数模板不止一个，还需要在这些模板候选之间继续重载决议；`<>` 本身不意味着可以绕开匹配和歧义检查。

## 函数体错误不会使选择退回另一个重载

模板声明能够产生可行候选，不等于模板函数体对这个类型一定合法。先看一个能够正常调用的完整程序：这里为 `number` 定义只读成员函数 `read()`，用于取得 `stored` 中保存的整数，同时保留转换成 `int` 的接口。

```cpp
#include <iostream>

struct number {
    int stored;

    int read() const {
        return stored;
    }

    operator int() const {
        return stored;
    }
};

int read_value(int value) {
    return value;
}

template <typename T> int read_value(T value) {
    return value.read();
}

int main() {
    const number value{7};
    std::cout << read_value(value) << '\n';
}
```

程序输出 `7`。这次调用选择函数模板，推导出 `T = number`，再通过 `value.read()` 调用刚定义的成员函数，取得保存的整数。

`number` 还提供一个未标记为 `explicit` 的[转换函数](../14-user-defined-conversions-and-explicit-interfaces/03-conversion-functions-and-target-type-results.md#显式转换函数产生目标类型结果)。因此，若只有 `read_value(int)`，传入 `number` 对象可以先转换成 `int`，这项普通函数调用本来也是可行的。

现在只删除 `number` 中的 `read` 成员。用下面的完整定义替换上面的 `number`，两个 `read_value` 函数和 `main` 都保持不变：

```cpp
struct number {
    int stored;

    operator int() const {
        return stored;
    }
};
```

这次刻意移除 `read()`，使模板函数体缺少所需操作；转换成 `int` 的路径仍然存在。调用 `read_value(value)` 时，依次发生这些判断：

1. 模板按值形参从 `value` 推导得到 `T = number`，形成 `int read_value<number>(number)` 这一候选；它的声明没有要求类型存在 `read` 成员。
2. 模板一方接收 `number` 获得精确匹配；普通函数一方需要调用 `operator int()`，属于用户定义转换。[标准转换序列优于用户定义转换序列](../14-user-defined-conversions-and-explicit-interfaces/04-user-defined-conversions-and-overload-resolution.md#标准转换序列先胜过用户定义转换序列)，所以模板一方被选中。
3. 调用需要这个具体函数的定义，因而实例化函数体。此时 `number` 已没有 `read` 成员，`return value.read();` 不合法，程序在这里编译失败。

对 `value.read()` 的成员查找不会为了寻找 `read`，先把 `value` 隐式转换成另一种类型。这个失败也不会回到重载决议，改选刚才仍然可行的 `read_value(int)`。

保持删除 `read` 后的 `number` 定义，只把 `main` 的输出语句替换为：

```cpp
std::cout << read_value(static_cast<int>(value)) << '\n';
```

这次调用的实参已经是 `int`。普通函数与模板产生的 `int` 版本匹配相当，普通函数被选中，程序输出 `7`。虽然模板定义中的 `value.read()` 对 `int` 同样不成立，当前调用不需要实例化它的函数体，因此它不会使这次调用失败。

> [!WARNING]
> **函数体能够成立不是这里的候选筛选条件。**被选中的模板在函数体实例化时出错，是程序错误，不是“这个重载不适用，请尝试下一个”。仅在函数体中写某项操作，也没有把“类型支持此操作”自动变成接口的参与条件。

因此，增加一个宽泛的 `T` 形参模板会改变整个重载集的行为：原本依靠转换调用普通函数的实参，现在可能精确匹配模板。设计接口时，需要同时判断候选如何参与、哪个候选会胜出，以及胜出后的函数体能否成立，不能只检查普通重载是否还保留着。

## 参考资料

- [C++23 工作草案：函数模板与重载决议](https://timsong-cpp.github.io/cppwp/n4950/temp.over)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：显式模板实参](https://timsong-cpp.github.io/cppwp/n4950/temp.arg.explicit)
- [C++23 工作草案：隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
