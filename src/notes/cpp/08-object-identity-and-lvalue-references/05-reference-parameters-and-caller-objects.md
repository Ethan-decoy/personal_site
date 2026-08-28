---
title: 引用参数与调用者对象（Reference Parameters and Caller Objects）
date: 2026-08-28
order: 5
---

# 引用参数与调用者对象（Reference Parameters and Caller Objects）

按值形参是由实参提供的值初始化出的新对象，函数在自己的调用状态中使用这份独立数据。引用形参则让本次调用直接保留某个对象的身份，使函数能够通过形参名称访问原对象。

## 函数调用初始化引用参数

```cpp
void increase_pressure_kpa(int& pressure_kpa, int increase_kpa) {
    pressure_kpa += increase_kpa;
}

int current_pressure_kpa{210};
increase_pressure_kpa(current_pressure_kpa, 5);
```

调用发生时，`current_pressure_kpa` 是能够指定已有 `int` 对象的 lvalue，因此引用形参 `pressure_kpa` 绑定到这个对象。`increase_kpa` 则是普通按值形参，由实参 `5` 初始化为独立的 `int` 对象。

函数体中的复合赋值通过 `pressure_kpa` 修改调用者对象。调用完成后，`current_pressure_kpa == 215`；并不存在需要再复制回调用位置的第二步。

参数声明中没有写出初始化器，但每次函数调用都会用对应实参初始化参数。**按值参数接收独立对象状态；引用参数接收通往绑定目标的访问关系。**

## 非 const 引用表达必需的修改目标

`int&` 形参需要能够直接绑定的、允许修改的 `int` lvalue。下面的调用不合法：

```cpp
increase_pressure_kpa(210, 5); // 错误：210 是 prvalue
```

字面量能够为按值形参提供数值，却不能为普通 `int&` 提供可修改的已有对象身份。这个限制使函数的第一个实参必须对应某个能够承受状态变化的对象。

非 `const` 引用参数也意味着函数体具有修改调用者可见状态的能力。函数名称应当直接表达这种作用，例如 `increase_pressure_kpa`，而不是使用 `process` 或 `handle` 隐藏修改行为。

**使用非 `const` 左值引用参数，是把“调用必须提供可修改目标”写进函数接口。**

## const 左值引用限制函数内的访问

当函数必须绑定某个目标，但不应经参数修改它时，可以使用对 `const` 类型的引用：

```cpp
bool is_pressure_within_limit(const int& pressure_kpa, int maximum_pressure_kpa) {
    return pressure_kpa <= maximum_pressure_kpa;
}
```

`pressure_kpa` 可以绑定普通 `int` 对象或 `const int` 对象，函数体不能通过这个形参赋值。它也可以绑定 `int` prvalue；需要时会物化临时 `const int` 对象，并保证该对象在包含调用的完整表达式结束前有效：

```cpp
bool accepted{is_pressure_within_limit(210, 250)};
```

这项保证足够函数在本次调用中读取 `pressure_kpa`，却不允许函数把该引用返回后假定临时对象继续存在。引用参数只建立本次调用需要的访问关系，不接管实参目标的生命周期。

## 指针保留可选目标状态

如果函数允许调用者明确表示“没有目标”，指针参数能够保存空指针值：

```cpp
void reset_pressure_if_present(int* pressure_kpa) {
    if (pressure_kpa != nullptr) {
        *pressure_kpa = 0;
    }
}

int current_pressure_kpa{210};

reset_pressure_if_present(&current_pressure_kpa);
reset_pressure_if_present(nullptr);
```

第一个调用提供可修改对象的地址，第二个调用明确表示没有目标。若函数语义要求调用者一定提供对象，使用 `int&` 能够省去这一可选状态；若缺少目标本身是合法输入，使用 `int*` 才能表达这项差异。

## 参数形式首先表达接口契约

当前已经认识的参数形式可以按调用关系区分：

| 参数形式 | 函数得到什么 | 目标能否缺少 | 能否影响调用者对象 |
| --- | --- | --- | --- |
| `int value` | 独立 `int` 参数对象 | 不适用 | 修改形参不影响调用者 |
| `const int& value` | 受限的绑定关系 | 不能用空状态表示缺少；可以绑定临时对象 | 不能经此路径修改 |
| `int& value` | 可修改的绑定关系 | 不能 | 可以 |
| `const int* value` | `const int*` 指针对象 | 可以为空 | 目标存在时不能经此路径修改 |
| `int* value` | `int*` 指针对象 | 可以为空 | 目标存在时可以 |

这些区别描述语言语义，而不是固定的性能排名。对于 `int`、`double` 和指针这类复制成本低、函数只需要数值的小型标量，按值传递通常最直接：

```cpp
bool is_pressure_within_limit(int pressure_kpa, int maximum_pressure_kpa) {
    return pressure_kpa <= maximum_pressure_kpa;
}
```

`const int&` 版本在语言上成立，却没有因为“没有创建独立 `int` 形参对象”就自动更快。具体调用约定、优化结果和间接访问成本都由实现与上下文决定。

引用参数适合表达目标必须存在的关系：使用 `int&` 明确允许函数修改目标，使用 `const int&` 限制这条访问路径。指针参数则保留“目标可以不存在”的状态。引用与指针参数都不延长普通调用者对象的生命周期；函数若让相应访问关系离开当前调用，之后的使用仍不得超过目标对象的生命周期。

**参数形式应先让调用者看清复制、修改与可选性，再根据实际类型和测量结果讨论性能。**

## 参考资料

- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++ Core Guidelines：函数参数传递](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-conventional)
