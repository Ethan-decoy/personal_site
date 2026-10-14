---
title: 泛型 Lambda 与调用转接（Generic Lambdas and Call Adapters）
date: 2026-09-28
order: 6
---

# 泛型 Lambda 与调用转接（Generic Lambdas and Call Adapters）

Lambda 表达式可以创建带有捕获状态的函数对象。如果同一个操作需要接受不同类型的输入，可以把形参中的具体类型换成 `auto`，让每次调用根据实参推导形参类型。这种 Lambda 称为泛型 Lambda（generic lambda）。

它仍然是一个类型确定的闭包对象。发生推导的是它的调用接口，不是闭包在运行时切换自身类型。借助 `auto`、`auto&` 和 `auto&&`，这个接口可以分别表达按值接收、借用和转发。

## 形参中的 auto 由调用实参推导

下面的完整程序把一份压力偏移配置保存在闭包中，再分别处理整数和浮点数输入：

```cpp
#include <iostream>

int main() {
    const double offset_kpa{2.0};
    const auto offset = [offset_kpa](auto value) { return value + offset_kpa; };

    std::cout << offset(240) << '\n';
    std::cout << offset(240.5) << '\n';
}
```

输出为 `242`、`242.5`。这里有两个 `auto`，推导时机和对象不同：

| 位置 | 推导的内容 |
| --- | --- |
| `const auto offset = ...` | 由 Lambda 表达式确定变量的闭包类型 |
| `(auto value)` | 每次调用时，由对应实参推导这一形参的类型 |

`offset(240)` 中的 `value` 是 `int`，`offset(240.5)` 中的 `value` 是 `double`。可以把这个调用接口理解为：闭包提供了函数调用运算符模板，形参 `auto` 对应一个由调用推导的类型模板参数。模板针对所需类型形成相应实例；这沿用函数模板的编译期模型。

两次调用使用同一个 `offset` 对象，也读取同一份按值捕获的 `offset_kpa`。捕获不会因为换了一种形参类型就重新执行。由于这份配置是 `double`，本例两个加法表达式都产生 `double`；输入类型不同，并不要求返回类型也不同。

`auto value` 是按值形参，与函数模板中的 `T value` 对应。对本例数值输入，它初始化本次调用自己的数值，修改形参不会修改调用方对象；传入 `const` 数值也不会使这个按值形参自动成为 `const`。

泛型同样不等于接受任何输入。如果某种推导类型不能形成 `value + offset_kpa`，所需调用实例的函数体就无法成立。形参中写 `auto` 提供了推导位置，没有替函数体补上缺失的操作。

## auto& 把操作作用到调用方对象

需要直接修改已有读数时，形参应当明确表达借用。下面是一个独立程序：

```cpp
#include <iostream>

int main() {
    const double offset_kpa{2.0};
    const auto add_offset = [offset_kpa](auto& value) { value += offset_kpa; };
    double source{240.0};

    add_offset(source);
    std::cout << source << '\n';
}
```

输出 `242`。`auto&` 按引用形参规则推导，本次 `value` 的类型是 `double&`，修改的是 `source`。若仅把 `auto&` 改成 `auto`，函数体就会修改一份按值形参，输出的 `source` 仍为 `240`。

这里 `add_offset` 是 `const` 闭包对象，但仍能修改 `source`。闭包默认的 `const` 调用约束它自身的状态访问，不会把作为实参借用的独立对象也变成只读。

以下语句分别加入前面 `main`，都会编译失败：

```cpp
add_offset(240.0); // 错误：auto& 不能绑定这个右值。

const double fixed{240.0};
add_offset(fixed); // 错误：推导得到 const double& 后，函数体不能修改它。
```

两次失败的位置不同。第一种输入无法绑定所需形参；第二种可以推导和绑定引用，却不能完成 `value += offset_kpa`。因此不能把 `auto&` 概括为“只接受可修改对象”：它也能推导出引用 `const` 对象的类型，只是这段函数体不适用于该类型。

## auto&& 需要配合 decltype 才能继续转发

若 Lambda 只是把输入交给另一项操作，就不能预先假定所有输入都应按值复制或只能作为左值借用。形参 `auto&& value` 是转发引用，调用推导与引用折叠遵循同样的规则；Lambda 体内也仍然需要显式转发具名的 `value`。

下面的完整程序复用[对左值返回引用、对右值返回数值的访问器](05-forwarding-interfaces-and-lifetime-boundaries.md#引用结果与值结果分别从哪里来)，用 Lambda 将它固定为当前要执行的操作：

```cpp
#include <iostream>
#include <utility>

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
    const auto pressure = [](auto&& value) {
        return pressure_access{}(std::forward<decltype(value)>(value));
    };
    reading source{240.0};

    decltype(auto) result = pressure(source);
    result = 245.0;

    const auto value = pressure(reading{250.0});
    std::cout << source.pressure_kpa << ' ' << result << ' ' << value << '\n';
}
```

输出 `240 245 250`。先看传入底层访问器的路径：

| 传入 Lambda 的实参 | `value` 的声明类型，也就是 `decltype(value)` | 转发给访问器的表达式 |
| --- | --- | --- |
| 左值 `source` | `reading&` | `reading` 左值 |
| 右值 `reading{250.0}` | `reading&&` | `reading` 右值 |

普通函数模板可以把具名模板参数 `T` 交给 `std::forward<T>`；这里没有直接书写模板参数的名称，就用 `decltype(value)` 取得形参推导后的声明类型。左值调用得到引用类型 `reading&`，右值调用得到 `reading&&`；传给 `std::forward` 后，引用折叠使两条路径各自保留原来的访问方式。

这里必须使用没有额外括号的 `decltype(value)`。如果写成 `decltype((value))`，查询的是具名表达式 `(value)` 的值类别：在这个转发调用中，它始终是左值，两种输入都会得到 `reading&`。原本传入右值的路径便会误选左值访问器，丢失正要保留的信息。

> [!IMPORTANT]
> 泛型 Lambda 中的 `auto&&` 接住调用推导信息，`std::forward<decltype(value)>(value)` 才把它交给下一层。直接使用 `value`，或者把 `decltype(value)` 改成 `decltype((value))`，都不能保留右值输入的访问方式。

## 输入正确转发以后还要决定怎样返回

上面的 `pressure(source)` 确实调用了返回 `double&` 的访问器，但 `result = 245.0` 没有改变 `source`。原因在 Lambda 自己的返回接口：**省略尾置返回类型时，Lambda 按 `auto` 规则推导返回类型。**它从底层引用取得数值，返回的是 `double`。

因此，哪怕接收变量写成 `decltype(auto) result`，也只能保留 Lambda 已经返回的 `double`，无法重新得到已在上一层舍弃的引用关系。

[Lambda 的尾置返回类型](../23-callable-objects-and-lambda-expressions/03-lambda-expressions-and-value-captures.md#先读懂一个不捕获外部状态的表达式)写在形参列表之后、函数体之前。显式写成 `-> decltype(auto)`，就让返回类型按 `return` 表达式的 `decltype` 规则推导。保持前面程序的其余部分不变，仅将 `main` 中 `pressure` 的定义替换为：

```cpp
const auto pressure = [](auto&& value) -> decltype(auto) {
    return pressure_access{}(std::forward<decltype(value)>(value));
};
```

输出变为 `245 245 250`。对左值调用，返回表达式是底层函数调用产生的 `double` 左值，Lambda 返回 `double&`；`result` 因而保留对原成员的引用，同一句赋值现在会修改 `source.pressure_kpa`。对右值调用，返回表达式仍是 `double` 纯右值，Lambda 返回 `double`。这仍然是针对不同实参类型形成的调用实例，各自推导自己的返回类型。

| 接口层次 | 本例的选择 |
| --- | --- |
| 输入怎样进入 Lambda | `auto&&` 接收，再按 `decltype(value)` 转发 |
| 底层调用结果怎样离开 Lambda | `-> decltype(auto)` 保留值或引用 |
| 调用者怎样保存结果 | `result` 用 `decltype(auto)` 保留返回关系；`value` 用 `const auto` 保存独立数值 |

这里只在 Lambda 直接转交底层调用结果时采用 `decltype(auto)`。原来的 `offset` 本来就在计算一个新的数值，普通 `auto` 返回已经表达了它的意图。

结果有效期也沿用[转发包装的生命周期边界](05-forwarding-interfaces-and-lifetime-boundaries.md#完整转交引用也可能完整转交悬空风险)：引用结果仍要求目标对象存活。本例的临时输入安全，是因为 `pressure_access` 对右值返回独立数值；把转接器改写成 Lambda，不会额外延长临时对象的生命周期。

## 参考资料

- [C++23 工作草案：泛型 Lambda 与默认返回类型](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.general)
- [C++23 工作草案：闭包的函数调用运算符模板](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.closure)
- [C++23 工作草案：调用中的模板实参推导](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
- [C++23 工作草案：decltype 的声明与表达式规则](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.decltype)
- [C++23 工作草案：auto 与 decltype(auto) 的推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
