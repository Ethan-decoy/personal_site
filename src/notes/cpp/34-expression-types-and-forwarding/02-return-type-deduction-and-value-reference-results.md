---
title: 返回类型推导与值引用关系（Return Type Deduction and Value or Reference Results）
date: 2026-09-28
order: 2
---

# 返回类型推导与值引用关系（Return Type Deduction and Value or Reference Results）

一个读取函数可能返回独立数值，也可能返回已有对象的引用。包装这个调用时，若只把函数体写成 `return source.read();`，却没有保留返回关系，就可能把借用变成副本。

函数可以使用占位返回类型（placeholder return type），由 `return` 的操作数推导实际类型。`auto` 与 `decltype(auto)` 都能承担这个位置，但采用的规则不同：**裸 `auto` 推导按值结果；`decltype(auto)` 按 `decltype` 的规则决定结果是不是引用。**推导在编译期完成，函数不会在运行时任意改变返回类型。

## auto 与 decltype(auto) 采用不同规则

先从变量初始化观察这个区别。`decltype(auto)` 是一个完整的类型占位写法，表示对初始化表达式采用 [`decltype` 规则](./01-decltype-and-expression-types.md#一般表达式把值类别映射到引用类型)：

```cpp
#include <iostream>

int main() {
    int value{220};
    int& alias{value};

    const auto copy = alias;
    decltype(auto) borrowed = alias;
    borrowed = 230;

    std::cout << value << ' ' << copy << '\n';
}
```

程序输出 `230 220`。裸 `auto` 从初始化表达式推导值类型 `int`，这里额外写出的 `const` 再使 `copy` 成为只读副本。`decltype(auto)` 则相当于对 `alias` 使用 `decltype(alias)`，得到其声明类型 `int&`，所以 `borrowed` 保留引用关系。

`decltype(auto)` 也不代表“一律引用”。如果把 `borrowed` 的初始化改成 `= value`，类型会是 `int`；改成 `= (value)`，类型才是 `int&`。差别来自操作数适用的 `decltype` 规则，而不是初始化所指向的对象不同。

## 函数返回要决定交付值还是保留访问

下面的完整程序用同一个成员访问，对照两种返回类型。形参 `source` 引用调用方已有的对象：

```cpp
#include <iostream>

struct reading {
    double pressure_kpa;
};

auto read_copy(reading& source) {
    return (source.pressure_kpa);
}

decltype(auto) read_alias(reading& source) {
    return (source.pressure_kpa);
}

int main() {
    reading source{220.0};

    const auto snapshot = read_copy(source);
    decltype(auto) alias = read_alias(source);
    alias = 230.0;

    std::cout << source.pressure_kpa << ' ' << snapshot << ' ' << alias << '\n';
}
```

程序输出 `230 220 230`。两个函数的 `return` 操作数完全相同，都是 `double` 左值，但返回推导不同：

| 函数 | 推导规则 | 返回类型与本例的结果 |
| --- | --- | --- |
| `read_copy` | 裸 `auto` 不保留操作数的引用关系 | `double`，交付一个数值 |
| `read_alias` | `decltype((source.pressure_kpa))` | `double&`，借用调用方对象的成员 |

`read_alias` 的结果指向 `source.pressure_kpa`，所以赋值会修改原成员。这里的 `source` 在使用引用时仍然存活，借用有效。

如果去掉 `read_alias` 的内层括号，改成 `return source.pressure_kpa;`，`decltype(auto)` 会应用没有额外括号的成员访问规则，得到成员的声明类型 `double`。这次改动会使函数转为按值返回。

**调用方也参与决定是否保留引用。**在上述程序中，把 `decltype(auto) alias = read_alias(source);` 改成 `auto alias = read_alias(source);`，局部变量 `alias` 就是 `double` 副本。此后对它赋值不会修改 `source`；程序会输出 `220 220 230`。

> [!IMPORTANT]
> 返回类型推导与接收结果是两次独立判断。函数返回引用，不保证调用方也建立引用；函数按值返回，也不能靠调用方写引用把结果变回原对象的别名。

裸 `auto` 返回值也不等于“必定发生一次复制”。类对象的返回仍遵循[复制消除与隐式移动](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md#隐式移动让返回位置提供可转交的来源)等规则。此外，按值返回 `std::string_view` 只建立一个视图对象，底层字符仍然是借用的。返回类型是否为引用，与结果是否拥有底层数据，需要分别判断。

## 返回推导不能代替生命周期设计

`decltype(auto)` 会保留适用的引用关系，却不会延长目标的生命周期。尤其不能把普通函数体中 `decltype((name))` 的结论直接搬到所有 `return` 位置。

C++23 对[符合隐式移动条件的局部名称](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md#隐式移动让返回位置提供可转交的来源)有额外规则：返回位置将其视为将亡值，给名称加括号不取消这一资格。以下是放在命名空间作用域中的对照定义；`dangling_result` 故意展示错误的接口，不应使用它返回的引用：

```cpp
decltype(auto) make_value(int value) {
    return value; // int：仍适用没有额外括号的名称规则
}

decltype(auto) dangling_result(int value) {
    return (value); // C++23 中是 int&&，目标是按值形参
}

decltype(auto) borrow_value(int& value) {
    return (value); // int&：借用调用方的对象
}
```

`make_value` 的操作数直接是名称，`decltype` 取其声明类型 `int`，因此按值返回。`dangling_result` 的操作数是 `(value)`，改用一般表达式规则；这里的按值形参符合隐式移动条件，返回位置的表达式是将亡值，于是得到 `int&&`。这个引用指向函数的按值形参，不能在调用结束后的使用中继续依赖它，编译器可能对此发出警告。

`borrow_value` 的形参是左值引用，不符合这项隐式移动条件；`(value)` 仍是左值，所以返回 `int&`。它是否安全，取决于调用方对象在借用期间是否仍然有效。

> [!WARNING]
> C++23 中，`decltype(auto)` 配合 `return (局部对象名);` 可能得到指向将被销毁对象的右值引用。把引用从 `T&` 换成 `T&&` 不会解决悬空问题。需要交付独立结果时，应选择按值返回，而不是期待推导替你安排对象的有效期。

## 多个返回分支必须推导出同一类型

推导返回类型不是在所有分支之间自动找一个“共同类型”。以下命名空间作用域中的函数定义会编译失败：

```cpp
auto select_pressure(bool corrected) {
    if (corrected) {
        return 220;
    }
    return 220.5; // 错误：前一处推导为 int，这一处推导为 double
}
```

`corrected` 的运行时取值不能消除这个冲突。普通 `if` 的两个返回都参与检查；即使某次调用只会走其中一条路径，定义仍需成立。

如果接口应统一提供 `double`，可以明确写 `double select_pressure(bool corrected)`，让两个返回结果转换到声明的类型；也可以把整数返回改成 `220.0`，使两处都推导为 `double`。`decltype(auto)` 同样要求参与推导的返回语句得到一致类型，值类型与引用类型也不能混用。

## 使用调用结果之前必须知道推导结果

显式声明返回类型时，调用方可以只看到函数声明。占位返回类型则需要先得到推导结果；只有 `auto read_pressure();` 这样的声明，还不足以支持随后对它的普通调用。

对普通函数，定义必须在这样的使用之前提供。对函数模板，确定推导返回类型还可能要求实例化函数体。因此，把调用写进 `decltype` 或 `requires` 表达式，并不意味着编译器就一定不需要查看被调用函数的实现；[函数体实例化中的错误也不一定变成约束不满足](../33-template-constraints-and-concepts/06-constraints-and-semantic-contracts.md#调用表达式成立不等于函数体已经验证)。

> [!PRACTICE]
> 业务接口已经明确“交付数值”或“借用哪个对象”时，直接声明 `double`、`double&` 等返回类型通常更容易查阅。泛型包装需要沿用被调用表达式的结果关系时，`decltype(auto)` 才能发挥作用；同时仍要检查被借用对象的来源，以及调用方最终怎样接收结果。

## 参考资料

- [C++23 工作草案：auto 占位类型、返回推导与使用条件](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
- [C++23 工作草案：decltype 的类型规则](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.decltype)
- [C++23 工作草案：符合隐式移动条件的名称表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.unqual#4)
- [C++23 工作草案：返回局部对象及 decltype(auto) 对照](https://timsong-cpp.github.io/cppwp/n4950/class.copy.elision#3)
