---
title: 返回局部对象与隐式移动（Returning Local Objects and Implicit Move）
date: 2026-09-12
order: 7
---

# 返回局部对象与隐式移动（Returning Local Objects and Implicit Move）

筛选压力读数时，函数可以在循环中逐个收集有效样本，再用 `return result;` 交付序列。要追踪返回时的构造和销毁，先判断这个局部对象能否直接成为调用结果，以及未采用省略时所选构造是否合法。本文以 C++23 为准。

## 逐步准备结果，再按值交付

下面的函数从源序列中筛选压力读数，单位是 kPa。此处约定正数有效。每次 `push_back` 成功追加一个有效读数，结果序列的长度增加一。

```cpp
#include <iostream>
#include <vector>

std::vector<double> collect_valid_samples(const std::vector<double>& source) {
    std::vector<double> result{};

    for (const double value : source) {
        if (value > 0.0) {
            result.push_back(value);
        }
    }

    return result;
}

int main() {
    const std::vector<double> source{240.0, -1.0, 245.0, 0.0};
    const std::vector<double> selected = collect_valid_samples(source);

    std::cout << source.size() << ' ' << selected.size() << ' ' << selected[0] << '\n';
}
```

`result` 在循环中收集 `240.0` 和 `245.0`。各次操作正常完成时，程序输出 `4 2 240`，分别是源序列的长度、结果序列的长度和第一个有效读数。两条返回路径都要先完成这项筛选工作。

## 具名返回值优化允许合并对象身份

具名返回值优化（named return value optimization，NRVO）是编译器可以对具名局部对象的返回采用的一种复制省略（copy elision）。

> [!IMPORTANT] 具名返回的构造路径与对象身份
> **返回具名局部对象时，未省略路径所选中的构造必须合法。** 满足 NRVO 条件时，实现可以把局部对象直接构造成调用的结果对象。采用这项省略时，局部对象与调用结果具有同一身份。

`volatile` 是类型限定符，例如 `volatile int value;`。在本文的普通函数中，NRVO 要求 `return` 直接命名一个具有自动存储期的非 `volatile` 局部对象。忽略顶层类型限定后，该对象和返回类型必须是同一个类。函数形参和引用变量都不符合这项省略的条件。

调用端使用 `=` 从同类纯右值初始化 `selected`，因此 `selected` 就是这次调用的结果对象。见[同类纯右值怎样直接构造结果对象](06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)。

- 采用 NRVO 时，函数内的 `result` 和调用端的 `selected` 指代同一个序列。循环直接填充它，到 `selected` 的作用域结束时才销毁。
- 未采用 NRVO 时，`result` 是独立的局部序列。返回时先从 `result` 移动构造 `selected`，再销毁 `result`。这条路径在建立调用结果时执行一次移动构造。

## 隐式移动让返回位置提供可转交的来源

`result` 在循环中是左值。C++23 在符合以下条件的返回位置把这样的名称表达式视为将亡值，这称为隐式移动（implicit move）。

- `return` 的操作数是变量名称，可以在名称外加括号。
- 变量在当前函数体内或形参列表中声明，自身具有自动存储期。
- 变量是非 `volatile` 对象，或是右值引用且其被引用类型是非 `volatile` 的对象类型。

检查右值引用时，自动存储期条件适用于引用变量自身。例如，绑定到静态对象的右值引用形参也可以符合这些条件。

在筛选程序中，`return result;` 的 `result` 是将亡值，可以绑定到 `std::vector<double>` 移动构造的右值引用形参。

实际调用还要由构造函数的重载决议和访问条件决定。对正在返回的类 `T`，可用的 `T(const T&)` 也能接收将亡值。若只有 `T(T&)`，它无法绑定该来源，初始化失败。C++23 在这种情况下不会把返回表达式重新按左值尝试。

## 按值形参可以隐式移动，但不能采用 NRVO

需要修改一份独立的采样记录时，可以按值接收序列。下面的独立程序从已有的 `source` 复制出形参 `samples`，再给每个读数加上 `5.0` kPa。

```cpp
#include <iostream>
#include <vector>

std::vector<double> apply_offset(std::vector<double> samples, const double offset_kpa) {
    for (double& value : samples) {
        value += offset_kpa;
    }

    return samples;
}

int main() {
    const std::vector<double> source{240.0, 245.0};
    const std::vector<double> adjusted = apply_offset(source, 5.0);

    std::cout << source[0] << ' ' << adjusted[0] << '\n';
}
```

`samples` 是独立的参数对象，循环只修改这份序列，输出为 `240 245`。`return samples;` 中的名称表达式是将亡值，由移动构造从参数对象建立 `adjusted`。函数形参不能采用 NRVO。

在独立的对照版本中，把 `apply_offset` 的第一个形参改为 `std::vector<double>& samples`，并把 `main` 中的源序列声明改成 `std::vector<double> source{240.0, 245.0};`。沿用循环、调用和输出语句。

这时 `samples` 绑定到调用者的可修改序列，循环直接更新 `source`。`return samples;` 中的名称是左值，因为左值引用形参不具备隐式移动资格。复制构造从更新后的序列建立 `adjusted`，程序输出 `245 245`。

## const 与删除构造仍然约束返回

`make_baseline` 在声明局部变量时就初始化完整序列，因此可以将该变量声明为 `const`。把下面的函数定义放在包含 `<vector>` 的源文件的命名空间作用域。

```cpp
std::vector<double> make_baseline() {
    const std::vector<double> result{240.0, 245.0};
    return result;
}
```

这种局部变量也符合 NRVO 的条件。未采用 NRVO 时，返回名称是带 `const` 的将亡值，无法绑定 `std::vector<double>&&`，因此选择复制构造。

下表汇总这些 `std::vector<double>` 示例。构造列对应未采用省略的情况。

| 返回的来源 | 能否采用 NRVO | 返回名称的值类别 | 未省略时选中的构造 |
| --- | --- | --- | --- |
| 非 `const` 局部对象 `result` | 可以 | 将亡值 | 移动构造 |
| 按值形参 `samples` | 不可以 | 将亡值 | 移动构造 |
| `const` 局部对象 `result` | 可以 | 带 `const` 的将亡值 | 复制构造 |
| 左值引用形参 `samples` | 不可以 | 左值 | 复制构造 |

下面是独立的快照程序。`snapshot` 显式删除了复制构造和移动构造。`make_direct` 用同类纯右值直接构造结果，程序输出 `240`。

```cpp
#include <iostream>

struct snapshot {
    int pressure_kpa;

    explicit snapshot(const int value) : pressure_kpa{value} {}

    snapshot(const snapshot&) = delete;
    snapshot(snapshot&&) = delete;
};

snapshot make_direct() {
    return snapshot{240};
}

int main() {
    const snapshot selected = make_direct();
    std::cout << selected.pressure_kpa << '\n';
}
```

在 `make_direct` 的定义之后、`main` 之前加入下面的函数，得到编译失败的对照版本。即使 `main` 只调用 `make_direct`，`make_named` 的函数体也要通过编译检查。

```cpp
snapshot make_named() {
    snapshot result{240};
    return result;
}
```

`make_named` 中的返回名称是将亡值，重载决议选中已删除的移动构造，所以 `return result;` 编译失败。NRVO 要求未省略路径所选中的构造合法。

即使为这个类型恢复 `snapshot(const snapshot&)`，只要显式删除的移动构造仍然是最佳候选，该具名返回仍会报错。没有移动构造、显式删除移动构造，以及默认移动因成员条件被定义为删除，须按[移动操作的生成与选择](05-generation-and-selection-of-move-operations.md#不存在与被删除的移动操作并不相同)分别判断。

## 不要为普通局部返回额外添加移动转换

> [!PRACTICE] 同类局部对象直接按名称返回
> 对本篇这种按值返回、同类非 `volatile` 局部对象的写法，`return result;` 保留了 NRVO 的可能。未采用省略时，返回名称仍符合隐式移动的条件。
>
> `return std::move(result);` 的操作数是函数调用表达式。在 C++23 中，它提供将亡值，同时失去按局部对象名称返回所享有的 NRVO 许可。

返回成员表达式、通过借用得到的对象，或者转换成另一种结果类型时，应按实际来源的类型、值类别和构造接口判断。

## 参考资料

- [C++23 工作草案：具名局部对象的复制与移动省略](https://timsong-cpp.github.io/cppwp/n4950/class.copy.elision#1.1)
- [C++23 工作草案：隐式移动的对象与表达式条件](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.unqual#4)
- [C++23 工作草案：结果初始化先于局部对象销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.return#5)
- [C++ Core Guidelines：返回局部变量时避免多余的移动转换](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-return-move-local)
