---
title: 常量求值与局部状态（Constant Evaluation and Local State）
date: 2026-09-28
order: 2
---

# 常量求值与局部状态（Constant Evaluation and Local State）

一个计算需要循环、局部变量和条件分支，并不意味着它只能在运行期使用。判断 `constexpr` 函数的一次调用能否用于常量表达式，关键是**这次求值实际执行了什么操作，以及操作的是哪些对象**。

## 计算过程可以修改自己的局部状态

假设需要把三次校准得到的偏移量相加，再调整默认压力值。下面使用普通循环保存累加状态：

```cpp
#include <array>
#include <iostream>

constexpr int total_offset(const std::array<int, 3>& offsets) {
    int total{0};
    for (const int value : offsets) {
        total += value;
    }
    return total;
}

int main() {
    constexpr std::array<int, 3> offsets{2, 3, 4};
    constexpr int adjusted{220 + total_offset(offsets)};

    std::cout << adjusted << '\n';
}
```

输出为 `229`。在 C++23 中，这里用到的 `std::array` 访问操作能够参与常量求值。`offsets` 是可用于常量表达式的对象，因此求值能够读取其中的元素。

`total` 没有声明为 `constexpr`，而且每轮循环都改变它。这个对象是在 `total_offset(offsets)` 的本次求值过程中创建的，它的初始化、修改和最终取值都属于这次计算；这样的局部状态可以参与常量求值。

把 `total` 改成 `constexpr` 反而不合适：那会把它声明成不可修改的对象，`total += value` 就不再成立。**计算结果需要成为常量，不等于计算过程中的每个局部对象都必须不可变。**

这也不意味着常量求值可以随意修改调用者已有的对象。上述计算只是创建并更新自己的局部状态；如果通过引用去修改本次求值之外已经存在的对象，就不具备同样的条件。

## 形参的值不会成为另一项声明的常量条件

`total_offset` 可以在常量求值中使用形参，但函数形参本身仍然是普通形参。下面这个函数定义故意把形参用作局部 `constexpr` 对象的初始化：

```cpp
constexpr int apply_offset(int value) {
    constexpr int copied{value}; // 错误：value 不能用于这项常量初始化
    return copied;
}
```

`copied` 的声明单独提出了常量初始化要求。编译器检查这项声明时，不能把 `value` 当成某个已知调用传来的固定值。即使所有预想中的调用都写成 `apply_offset(3)`，函数定义中的这项要求也不会因此成立。

如果改成普通局部对象，定义便可以成立：

```cpp
constexpr int apply_offset(int value) {
    const int copied{value};
    return copied;
}
```

此时 `copied` 不再单独要求常量初始化。将调用 `apply_offset(3)` 用于一个 `constexpr` 对象的初始化时，形参和局部对象都在这次调用的求值中创建，计算可以读取它们的值并返回 `3`。

这里要区分两项要求：**在一次常量求值中使用对象的值**，与**把那个值直接用在另一处必须是常量表达式的语境中**，并不是同一件事。

## 判断实际经过的分支

函数中出现普通函数调用，也不意味着每一条路径都无法常量求值。下面的 `read_runtime_pressure` 故意没有声明为 `constexpr`；它代表一条只能通过普通调用取得压力值的路径：

```cpp
#include <iostream>

int read_runtime_pressure() {
    return 240;
}

constexpr int initial_pressure(bool use_default) {
    if (use_default) {
        return 220;
    }
    return read_runtime_pressure();
}

int main() {
    constexpr int baseline{initial_pressure(true)};
    const int current{initial_pressure(false)};

    std::cout << baseline << ' ' << current << '\n';
}
```

输出为 `220 240`。

计算 `initial_pressure(true)` 时，执行路径在 `return 220;` 处结束，没有调用 `read_runtime_pressure`，所以本次调用可以用于 `baseline` 的常量初始化。

`initial_pressure(false)` 会调用非 `constexpr` 函数，因而不能用于常量表达式。不过 `current` 不要求常量初始化，这次普通调用是合法的。若把它的声明替换为下面这样，就会因实际经过的调用而失败：

```cpp
constexpr int current{initial_pressure(false)}; // 错误：调用了非 constexpr 函数
```

`read_runtime_pressure` 的函数体虽然只返回字面量，也不能由编译器“看得懂结果”来免除语言要求。

> [!WARNING]
> 常量求值按实际执行路径检查操作，但普通 `if` 的两条分支仍须是合法代码。未经过的分支可以包含不能在本次常量求值中执行的操作，不能因此包含语法错误或在对应类型上根本不存在的操作。

## 常量求值会拒绝非法运算，但不添加运行期保护

下面是一个计算每个传感器平均分配量的函数，以及同一源文件中故意失败的常量初始化片段：

```cpp
constexpr int amount_per_sensor(int total, int count) {
    return total / count;
}

constexpr int amount{amount_per_sensor(220, 0)}; // 错误：常量求值执行了除以零
```

整数除以零不能出现在成立的常量求值中，因此程序无法通过编译。数组越界访问、有符号整数溢出等未定义行为，也不能借助 `constexpr` 变成合法计算。

这项检查不会给函数自动添加运行期保护。把相同函数用于普通调用时，调用者仍须保证 `count` 非零，并保证除法结果可表示；否则仍会触发整数除法的未定义行为。如果接口需要处理非法输入，应明确检查并采用适合接口的失败处理方式。

> [!TIP]
> 判断具体调用时，先看结果所在语境是否要求常量表达式，再沿实际执行路径检查所读取的对象、所调用的函数和各项运算。局部变量、循环或分支本身不是否定条件；读取不允许读取的外部状态、调用非 `constexpr` 函数或执行非法运算，才会使相应路径无法用于常量表达式。

`constexpr` 标记并不替代对指针、引用、对象生命周期和具体标准库操作的各自检查。

## 参考资料

- [C++23 工作草案：常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：constexpr 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：array 概览](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
