---
title: 实参依赖查找与非成员接口（Argument-Dependent Lookup and Non-Member Interfaces）
date: 2026-09-21
order: 4
---

# 实参依赖查找与非成员接口（Argument-Dependent Lookup and Non-Member Interfaces）

非成员函数可以是一个类型接口的一部分：例如读数类型与输出读数的函数，都属于 `workshop` 命名空间。调用者已经通过实参使用了这个类型，语言能否据此找到与类型一起声明的操作？

对于满足条件的非限定函数调用，答案是可以。**实参依赖查找（argument-dependent lookup，ADL）根据实参类型补充函数查找结果，再与普通查找得到的函数一起参与重载决议。**

## 从实参类型找到相关命名空间

下面是一个完整程序。`print_margin` 是 `workshop` 中的非成员函数，接收一份读数和目标气压，输出测量值与目标值的差：

```cpp
#include <iostream>

namespace workshop {
struct reading {
    int pressure_kpa;
};

void print_margin(const reading& current, int target_kpa) {
    std::cout << "integer target: " << current.pressure_kpa - target_kpa << '\n';
}
} // namespace workshop

int main() {
    const workshop::reading current{220};
    print_margin(current, 240);
}
```

程序输出 `integer target: -20`。这里没有 `using` 声明，调用也没有写 `workshop::`。从 `main` 的代码块向外进行普通查找，找不到 `print_margin`；ADL 却可以根据 `current` 的类型继续提供候选。

对这个直接定义在命名空间里的普通结构体，`workshop::reading` 的关联命名空间（associated namespace）是 `workshop`。因此查找还会考虑其中已经声明的同名函数，找到 `workshop::print_margin`。它能够接收两个实参，于是调用成立。

第二个实参 `240` 是 `int`。这样的基本类型（fundamental type）不为 ADL 增加关联命名空间，所以这一项实参没有扩大查找范围。

这里依据的是**实参的类型**，不是变量名称或变量声明所在的位置。`current` 虽然声明在 `main` 中，它的类型仍然是 `workshop::reading`。如果通过 `using workshop::reading;` 缩短类型名称，也不会改变它对应的命名空间。

## 普通查找成功后，仍可能补充候选

ADL 并不是“找不到函数时才启用的补救”。在上面的命名空间定义之后、`main` 之前，加上这个全局函数：

```cpp
void print_margin(const workshop::reading& current, double target_kpa) {
    std::cout << "decimal target: " << current.pressure_kpa - target_kpa << '\n';
}
```

然后把 `main` 替换为：

```cpp
int main() {
    const workshop::reading current{220};

    print_margin(current, 240);
    ::print_margin(current, 240);
}
```

两行输出分别为：

```text
integer target: -20
decimal target: -20
```

第一项调用的普通查找已经找到了全局 `print_margin`。由于查到的是命名空间作用域中的函数，并没有阻止 ADL，`workshop::print_margin` 仍然加入候选：

| 候选函数 | 读数实参 | `240` 实参 |
| --- | --- | --- |
| `workshop::print_margin(const reading&, int)` | 直接绑定 `const` 引用 | `int` 精确匹配 |
| `::print_margin(const workshop::reading&, double)` | 直接绑定 `const` 引用 | 需要 `int` 到 `double` 的转换 |

两项候选对第一个实参的匹配相同，命名空间内的函数对第二个实参匹配更好，因此获选。这延续了[最佳可行函数的比较](../12-function-overloading-and-overload-resolution/03-best-viable-functions-and-ambiguous-calls.md#多个实参必须整体比较)：ADL 决定额外有哪些候选，不赋予这些候选特殊优先级。

第二项调用使用 `::print_margin`，明确在全局命名空间进行限定查找。**这样的限定函数调用不进行 ADL**，所以只在这里找到的全局函数中决定目标，随后把 `240` 转换为 `double`。

> [!IMPORTANT]
> 对允许 ADL 的非限定调用，先合并普通查找与实参类型带来的函数，再做重载决议。普通查找已经找到函数，不表示候选集合已经封闭；ADL 找到的函数也不保证一定获选。

如果把全局函数的第二个参数也改成 `int`，两项不同函数就会具有相同的匹配表现。非限定调用会产生歧义，而不会因其中一项与类型位于同一个命名空间，就自动选择那一项。

## 哪些条件会让这条路径失效

将第一个完整程序的 `main` 替换为以下错误示例：

```cpp
int main() {
    const workshop::reading current{220};
    const int print_margin{0};

    print_margin(current, 240); // 错误：找到的是 int 对象，不能把它当作函数调用
}
```

普通查找找到了同名局部对象。**当普通查找得到非函数声明时，不会再借助 ADL 去寻找同名函数。**这里不是“对象不能调用，于是继续尝试命名空间中的函数”；名称查找已经受到了当前声明的限制。

对这里的普通函数调用，ADL 要求直接使用非限定函数名，例如 `print_margin(current, 240)`。给函数名本身加上括号，改成 `(print_margin)(current, 240)`，就不会触发 ADL。

结合普通查找结果与实参类型，可以判断以下边界：

| 调用位置的情况 | 是否通过 ADL 补充候选 |
| --- | --- |
| 写成 `workshop::print_margin(current, 240)` 或 `::print_margin(...)` | 不补充：调用名已经限定 |
| 直接以非限定函数名调用，普通查找没有结果，或只找到命名空间中的函数 | 根据实参类型补充关联查找结果 |
| 普通查找找到类成员、在块作用域中声明的函数，或非函数声明 | 不补充 |
| 所有实参都是 `int`、`double` 这样的基本类型 | 这些类型不为 ADL 增加关联命名空间 |

在函数体里用 `using workshop::print_margin;` 引入已有命名空间函数，不等于在块作用域中另行声明一个函数，因此这种 `using` 本身不会阻止 ADL。

关联关系取决于调用处已有的实参类型，也不能靠希望发生的隐式转换倒推。若某个命名空间里的函数接收类对象，而实际实参只是 `int`，不会为了尝试把 `int` 转成那个类，就先去搜索那个命名空间。

本篇的关联命名空间推演以直接定义在普通命名空间中的非模板结构体为范围。即使它有一个 `int` 成员，ADL 也不是沿所有数据成员的类型遍历程序，更不会递归搜索任意子命名空间。

## 将非成员操作放在类型所属的命名空间

ADL 让类型和它的非成员操作可以在同一命名空间中组织，而外部表达式仍然能够自然使用这些操作。[非成员二元运算符](../13-operator-overloading-and-expression-semantics/02-member-and-non-member-operator-functions.md#非成员形式显式接收两个操作数)接收两个显式操作数，它们的类型也为查找非成员运算符提供了来源。

下面是一个独立的完整程序：

```cpp
#include <iostream>

namespace workshop {
struct pressure_delta_kpa {
    int value;
};

pressure_delta_kpa operator+(const pressure_delta_kpa& left, const pressure_delta_kpa& right) {
    return pressure_delta_kpa{left.value + right.value};
}
} // namespace workshop

int main() {
    const workshop::pressure_delta_kpa left{8};
    const workshop::pressure_delta_kpa right{-3};
    const workshop::pressure_delta_kpa total{left + right};

    std::cout << total.value << '\n';
}
```

程序输出 `5`。`operator+` 不在全局命名空间中，但两个操作数的类型都关联到 `workshop`，因此这项非成员运算符能够被找到。示例中的整数相加结果处于 `int` 范围内；名称查找不会改变底层算术的有效范围。

> [!PRACTICE]
> 与自定义类型紧密相关、适合作为非成员的操作，通常放在该类型所属的命名空间中，使接口归属与查找来源一致。对需要明确指定实现来源的普通调用，可以写出限定名称；对自然依赖操作数类型的接口，则应检查 ADL 加入了哪些候选，以及是否引入歧义。

命名空间决定接口归属，查找决定哪些声明可参与当前表达式，重载决议再从候选中选出目标。把这三步分开，才能解释“函数确实存在，却没有被找到”和“函数已经找到，却不能唯一选中”这两类不同失败。

## 参考资料

- [C++23 工作草案：实参依赖查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.argdep)
- [C++23 工作草案：名称查找与重载决议](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.general)
- [C++23 工作草案：普通函数调用的候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.call)
- [C++23 工作草案：运算符表达式的候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper)
