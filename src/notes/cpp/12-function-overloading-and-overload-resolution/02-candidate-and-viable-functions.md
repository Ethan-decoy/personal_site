---
title: 候选函数与可行函数（Candidate and Viable Functions）
date: 2026-08-29
order: 2
---

# 候选函数与可行函数（Candidate and Viable Functions）

同一个函数名能够找到多个函数，其中有的却无法接收当前实参。参加本次检查的函数称为候选函数（candidate function）；其中满足这组实参要求的，才是可行函数（viable function）。

本篇各组完整程序彼此独立。普通函数都在文件最外层定义，并在调用前可见；实参数量按各例中写出的固定参数列表判断。错误片段的替换位置另行说明。

> [!IMPORTANT] 候选函数与可行函数的关系
> **对这里在同一作用域声明、在调用前可见的普通函数，名称查找得到的函数构成候选集合；候选只有在实参数量符合要求、每个实参都能初始化对应形参时，才对这次调用可行。**引用形参的初始化同样必须完成合法绑定。
>
> 候选函数与可行函数都针对具体调用判断。即使两次调用找到相同的候选，实参改变后，留下的可行函数也可能不同。

## 实参数量先排除不能调用的函数

压力余量等于上界减去当前读数。本例以千帕（kPa）表示压力，常用上界为 `500`，也允许调用者指定本次计算的上界；示例中的数值与差值都可由 `int` 表示。

下面是独立的完整程序，两个同名函数分别接收一个和两个实参：

```cpp
#include <iostream>

int calculate_pressure_margin(const int pressure_kpa) {
    return 500 - pressure_kpa;
}

int calculate_pressure_margin(const int pressure_kpa, const int maximum_pressure_kpa) {
    return maximum_pressure_kpa - pressure_kpa;
}

int main() {
    const int default_margin{calculate_pressure_margin(220)};
    const int configured_margin{calculate_pressure_margin(220, 450)};

    std::cout << default_margin << ' ' << configured_margin << '\n';
}
```

两次调用都能找到这两项函数定义，因此候选集合相同。数量检查的结果却不同：

| 候选函数 | `calculate_pressure_margin(220)` | `calculate_pressure_margin(220, 450)` |
| --- | --- | --- |
| `calculate_pressure_margin(int)` | 可行：一个实参与一个形参对应 | 不可行：多了一个实参 |
| `calculate_pressure_margin(int, int)` | 不可行：缺少第二个实参 | 可行：两个实参与两个形参对应 |

对数量符合要求的候选，实参类型也都能匹配，因此每次调用恰好留下一个可行函数。第一条调用使用常用上界，计算 `500 - 220`，得到 `280`；第二条调用使用指定上界，计算 `450 - 220`，得到 `230`。程序输出 `280 230`。

## 允许的隐式转换也能建立可行性

形参与实参的类型不必完全相同。按值形参只要能够由实参经过允许的隐式转换初始化，就可能满足调用要求。

调试输出可以用不同标签区分整数读数与浮点读数。下面是另一份独立的完整程序：

```cpp
#include <iostream>

void print_reading(const int reading) {
    std::cout << "integer: " << reading << '\n';
}

void print_reading(const double reading) {
    std::cout << "floating: " << reading << '\n';
}

int main() {
    const short reading{220};
    print_reading(reading);
}
```

调用 `print_reading(reading)` 时，两项候选的形参数量都符合要求。读取 `reading` 得到 `short` 值，再分别检查初始化对应形参的转换：

| 候选函数 | 形参初始化所需的转换 | 是否可行 |
| --- | --- | --- |
| `print_reading(int)` | `short` 提升为 `int` | 可行 |
| `print_reading(double)` | `short` 转换为 `double` | 可行 |

两项候选都可行，表示两种参数初始化各自都能成立。**这不表示一次调用会执行两个函数，也不表示调用已经发生歧义。**

本例最终选择 `int` 版本，输出 `integer: 220`：`short` 到 `int` 的整数提升优于到 `double` 的整数到浮点转换。更完整的比较规则见[标准转换序列的匹配等级](03-best-viable-functions-and-ambiguous-calls.md#标准转换序列的匹配等级)。

实际调用只初始化所选函数的形参。原来的 `reading` 始终是保存 `220` 的 `const short` 对象；转换没有把它改造成 `int` 或 `double` 对象。

> [!IMPORTANT] 可行性筛选与最终选择
> **没有可行函数时，这次调用不合法；存在多个可行函数时，还要比较它们的匹配质量，确定是否存在唯一最佳目标。**“能够接受这组实参”与“最终选中这个函数”是不同判断。
>
> 候选筛选与重载选择发生在编译期，不会通过依次运行候选函数、观察返回结果来作决定。运行时只执行已经选定的调用目标。

## 引用形参必须能够完成绑定

引用形参的初始化需要建立绑定。下面的两个修改接口分别向已有的 `int` 或 `double` 压力记录写入新值；它们返回 `void`，调用效果直接体现在原记录上。

这是另一份独立的完整程序：

```cpp
#include <iostream>

void update_pressure(int& stored_pressure_kpa, const int requested_pressure_kpa) {
    stored_pressure_kpa = requested_pressure_kpa;
}

void update_pressure(double& stored_pressure_kpa, const double requested_pressure_kpa) {
    stored_pressure_kpa = requested_pressure_kpa;
}

int main() {
    int stored_pressure_kpa{220};
    update_pressure(stored_pressure_kpa, 225);

    std::cout << stored_pressure_kpa << '\n';
}
```

两个候选都接收两个实参，但每个实参都必须满足对应形参的初始化要求：

| 候选函数 | 第一个实参 `stored_pressure_kpa` | 第二个实参 `225` | 是否可行 |
| --- | --- | --- | --- |
| `update_pressure(int&, int)` | 可直接绑定 `int&` | 可初始化整数形参 | 可行 |
| `update_pressure(double&, double)` | 不能绑定 `double&` | 可转换为 `double` | 不可行 |

第二个候选虽然能够接收 `225` 转换得到的浮点值，却无法为第一个形参建立所需的绑定。把整数值转换为 `double` 值，不会把原来的 `int` 对象变成 `double` 对象；转换所得的 prvalue 也不能绑定到非 `const` 左值引用 `double&`。

因此，调用选择第一个函数，其引用形参绑定原来的压力记录。赋值后，`stored_pressure_kpa` 保存 `225`，程序输出 `225`。

若原记录带有 `const` 限定，结果又会改变。保留上面的函数定义，把 `main` 的函数体替换为下面的错误片段，单独考察：

```cpp
const int stored_pressure_kpa{220};
update_pressure(stored_pressure_kpa, 225); // 错误：没有可行函数
```

第一个候选的 `int&` 不能绑定 `const int` 对象，否则会丢弃访问约束；第二个候选的 `double&` 也不能绑定这个对象。候选仍有两个，可行函数却一个也没有，因此编译器在调用处诊断错误。

> [!WARNING] 数值可转换不代表可写引用能够绑定
> 对这里的基础数值类型，能够从实参取得所需数值，不保证能取得引用形参所要求的可修改对象。数值转换不会改变源对象的类型，也不会为 `double&` 提供可绑定的 `double` lvalue；`const int` 对象也不能直接用于初始化允许修改它的 `int&`。
>
> 绑定条件不成立时，候选在编译期被排除，不会先进入函数体尝试修改，再通过返回值报告失败。

## 只读引用具有不同的绑定边界

`const int&` 不提供经该形参修改目标的能力，可以绑定这里的普通 `int` 对象、`const int` 对象，以及由整数 prvalue 物化的临时对象。

下面用一份独立的完整程序对照这些绑定条件。`read_pressure` 按值返回读到的整数，不把引用保存在调用之外：

```cpp
#include <iostream>

int read_pressure(const int& pressure_kpa) {
    return pressure_kpa;
}

int main() {
    int stored_pressure_kpa{220};
    const int locked_pressure_kpa{225};

    const int first{read_pressure(stored_pressure_kpa)};
    const int second{read_pressure(locked_pressure_kpa)};
    const int third{read_pressure(230)};

    std::cout << first << ' ' << second << ' ' << third << '\n';
}
```

这三次调用都能找到 `read_pressure`，也都能完成引用绑定：

| 实参表达式 | 绑定目标 | 读取结果 |
| --- | --- | --- |
| `stored_pressure_kpa` | 已有的普通 `int` 对象 | `220` |
| `locked_pressure_kpa` | 已有的 `const int` 对象 | `225` |
| `230` | 为绑定引用而物化的临时整数对象 | `230` |

因此，这三次调用都有可行函数，程序输出 `220 225 230`。第三次调用的临时目标在包含调用的完整表达式结束时销毁；`third` 已经保存独立的整数值，不依赖该目标继续存在。

这里使用引用是为了对照可行性所依赖的绑定条件。对于只需要简单整数数值的普通接口，按值传递通常更直接；`const int&` 的这些合法绑定能力不构成默认使用引用的理由。

## 参考资料

- [C++23 工作草案：具名函数调用的候选集合](https://timsong-cpp.github.io/cppwp/n4950/over.call.func#3)
- [C++23 工作草案：可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.viable)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom#1)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref#5)
- [C++23 工作草案：转换序列的匹配等级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#4)
