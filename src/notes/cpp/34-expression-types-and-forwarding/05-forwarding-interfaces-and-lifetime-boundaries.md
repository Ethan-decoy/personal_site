---
title: 转发包装的约束与结果有效期（Constraints and Result Lifetimes in Forwarding Wrappers）
date: 2026-09-28
order: 5
---

# 转发包装的约束与结果有效期（Constraints and Result Lifetimes in Forwarding Wrappers）

调用转接器（call adapter）接收一项操作和它的输入，再把调用交给这项操作。例如，把“怎样访问压力”与“何时访问哪个读数”分开，调用方就能替换访问规则，而不必改写转接器。

转发接口要接住两端的关系：输入原来是左值还是右值，底层调用返回的是值还是引用。**转发可以保留这些关系，但结果借用了谁、目标还能存活多久，仍由实际接口与对象生命周期决定。**

## 把操作和本次输入一起转发

[函数对象](../23-callable-objects-and-lambda-expressions/01-function-objects-and-call-operators.md#让对象支持调用表达式)可以写成 `function(value)` 来调用：括号前指定操作对象，括号内提供本次输入。两者都是可以传入模板的对象，因此用两个独立的类型模板参数 `Function` 与 `T` 接收它们。

下面的完整程序定义一个只转交一次、只传递一个实参的 `call_once`。操作本身通过第一个形参传入；“一个实参”指交给该操作的 `value`。

```cpp
#include <iostream>
#include <utility>

template <typename Function, typename T>
concept callable_with = requires(Function&& function, T&& value) {
    std::forward<Function>(function)(std::forward<T>(value));
};

template <typename Function, typename T>
    requires callable_with<Function, T>
decltype(auto) call_once(Function&& function, T&& value) {
    return std::forward<Function>(function)(std::forward<T>(value));
}

struct reading {
    double pressure_kpa;
};

struct pressure_access {
    double& operator()(reading& source) const {
        return source.pressure_kpa;
    }

    double operator()(reading&& source) const {
        return source.pressure_kpa;
    }
};

int main() {
    const pressure_access access{};
    reading source{240.0};

    decltype(auto) alias = call_once(access, source);
    alias = 245.0;

    decltype(auto) value = call_once(pressure_access{}, reading{250.0});
    value = 255.0;

    std::cout << source.pressure_kpa << ' ' << alias << ' ' << value << '\n';
}
```

输出 `245 245 255`。

`Function&&` 与 `T&&` 都是转发引用，各自保留对应实参的推导信息。`std::forward<Function>(function)` 产生本次要调用的对象表达式，紧随其后的 `(std::forward<T>(value))` 才是调用运算符的实参列表。这里的两层括号依次完成“取得操作”和“调用操作”。

| 位置 | 负责保留的关系 |
| --- | --- |
| `Function&& function` 与 `std::forward<Function>(function)` | 操作对象原有的 `const` 与左值、右值访问方式 |
| `T&& value` 与 `std::forward<T>(value)` | 输入对象原有的 `const` 与左值、右值访问方式 |
| 返回类型 `decltype(auto)` | 底层调用表达式产生的值或引用结果 |

具名的 `function` 和 `value` 本身都是左值表达式。若直接写 `function(value)`，就会按这两个左值进行调用，失去原调用传入右值的信息。本例两个 `operator()` 都带 `const`，因此操作对象的两种访问方式不会选出不同实现；对输入的转发则直接决定选择哪一个重载。

`call_once` 的函数体只执行一次底层调用。概念中的表达式用于编译期检查，不会额外调用一次，也不会为了检查而创建一份读数。

## 引用结果与值结果分别从哪里来

对 `call_once(access, source)`，`T` 推导为 `reading&`，`std::forward<T>(value)` 是左值，选择接收 `reading&` 的重载。它返回 `source.pressure_kpa` 的引用，调用表达式是 `double` 左值；外层 `decltype(auto)` 因而推导为 `double&`。

`alias` 同样用 `decltype(auto)` 接收结果，继续保留这个引用。给 `alias` 赋值就是修改 `source.pressure_kpa`，所以输出中的前两个数同时变为 `245`。有效期仍依赖 `source`：引用没有取得这份读数的所有权。

对 `call_once(pressure_access{}, reading{250.0})`，`T` 推导为 `reading`，转发后的表达式是右值，选择接收 `reading&&` 的重载。**这个重载主动返回 `double` 值**，所以底层调用是纯右值，外层 `decltype(auto)` 也推导为 `double`。局部对象 `value` 保存独立数值，不再借用临时 `reading` 的成员。

这两个调用分别实例化不同的 `call_once`，各自推导返回类型；并不是同一个函数实例在运行时决定返回值还是引用。

> [!IMPORTANT]
> 本例的生命周期边界由 `pressure_access` 设计：对可修改左值提供借用，对右值取出独立数值。`call_once` 只保留这项选择，不能凭转发语法替任意操作设计同样的边界。

调用者仍可用 `auto copy = call_once(access, source);` 取得一份独立的 `double`。`call_once` 仍返回 `double&`，但修改 `copy` 不会影响 `source`：[函数返回与调用方接收是两次判断](./02-return-type-deduction-and-value-reference-results.md#函数返回要决定交付值还是保留访问)，接口保留引用不代表调用者必须继续借用。

## 约束必须检查真正执行的调用

`callable_with` 中的简单要求与函数体使用相同的表达式：两处都转发 `function`，也都转发 `value`。因此概念检查的是“按这次推导得到的访问方式，底层调用能否形成”。这承接了[约束检查应与实现访问方式一致](../33-template-constraints-and-concepts/02-requires-expressions-and-valid-operations.md#检查的访问方式应当与实现相同)的要求。

如果约束改成裸写的 `function(value);`，即使局部参数声明仍然是 `Function&&` 和 `T&&`，检查的也是左值调用。例如，一项操作只接受 `reading&` 时，这个检查可能接受右值来源，因为检查中的 `value` 是具名左值；函数体真正转发右值后却无法调用。只接受 `reading&&` 的操作则可能遭遇相反的问题：实际转发可行，却被左值检查挡住。

本例 `pressure_access` 只接受 `reading`，没有接受普通数值的重载。下面是加入前面 `main` 的编译失败示例：

```cpp
call_once(access, 240.0); // 错误：pressure_access 不能接收 double。
```

这次 `T` 推导为 `double`，概念中的调用表达式无法形成，`callable_with` 为 `false`，受约束的 `call_once` 不满足本次调用的候选要求。失败入口是接口约束。

约束没有规定返回类型必须为 `double`，因为转接器的职责就是保留被调用方的结果。它也没有要求表达式不抛异常。**使用 `std::forward` 不会给外层函数自动添加 `noexcept` 承诺**；这里的 `call_once` 没有声明 `noexcept`，底层调用若抛出异常，仍会沿调用关系传播。

## 完整转交引用也可能完整转交悬空风险

下面的访问器无论来源是左值还是右值，都返回只读借用。把它放在前面程序的 `main` 之前：

```cpp
struct borrowing_pressure_access {
    const double& operator()(const reading& source) const {
        return source.pressure_kpa;
    }
};
```

它可以借用一个仍然存活的 `reading`，但不能保证任何调用方都能长期保存结果。以下片段只用于分析生命周期，不应把最后的读取加入运行示例：

```cpp
const double& dangling = call_once(borrowing_pressure_access{}, reading{250.0});
// 上一句的分号之后，临时 reading 已经销毁，dangling 悬空。
// std::cout << dangling << '\n'; // 不执行：读取已销毁的成员会产生未定义行为。
```

调用期间临时 `reading` 存活，访问器合法地返回成员引用，概念检查也能通过。问题出现在初始化语句结束时：绑定到函数引用形参的临时对象只存活到包含调用的完整表达式结束。返回引用再绑定给 `dangling`，不会把临时对象的生命周期继续延长。[C++23 的临时对象规则](https://timsong-cpp.github.io/cppwp/n4950/class.temporary#6.9)明确规定了这项边界。

`decltype(auto)` 没有在这里做错推导，它确实保留了底层的 `const double&`；`std::forward` 也确实保留了输入的右值访问方式。缺失的是能让结果继续有效的对象，而类型保真不能补出对象所有权。

> [!WARNING]
> 转接器返回借用时，要追踪引用最终指向的对象，而不是只查看 `call_once` 的局部变量。被调用方若返回临时来源的成员、已经失效的视图或自身局部对象的引用，正确转发也不能把它变为安全结果。概念检查证明所写的调用有效，不证明返回对象的有效期覆盖后续使用。

## 参考资料

- [C++23 工作草案：转发辅助函数](https://timsong-cpp.github.io/cppwp/n4950/utility#forward)
- [C++23 工作草案：decltype(auto) 的返回类型推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
- [C++23 工作草案：简单要求与不求值操作数](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req.simple)
- [C++23 工作草案：临时对象与引用形参](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：异常说明](https://timsong-cpp.github.io/cppwp/n4950/except.spec)
