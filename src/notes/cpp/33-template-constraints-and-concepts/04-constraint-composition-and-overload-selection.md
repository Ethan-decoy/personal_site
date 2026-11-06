---
title: 约束组合与重载选择（Constraint Composition and Overload Selection）
date: 2026-09-27
order: 4
---

# 约束组合与重载选择（Constraint Composition and Overload Selection）

同一个气压显示接口可以处理不同能力的输入：未知类型只显示提示，气压源显示读数，而带通道编号的气压源同时显示编号和读数。约束首先决定哪些函数模板适用；多个模板都适用时，约束之间的关系还可能决定选择哪个。

这里有两个不同的问题：**某个类型是否满足约束，以及两个约束在重载比较中能否分出强弱。**前者得到当前类型的 `true` 或 `false`，后者需要比较约束结构，不能把它理解成“编译器统计哪个函数写了更多条件”。

## 在已有概念上增加能力

继续使用[气压源的结果类型要求](./03-compound-requirements-and-result-types.md#从调用合法到结果可用)：对 `const T&` 调用 `read()`，结果可以转换为 `double`。新概念 `identified_source` 直接复用 `pressure_source<T>`，再要求 `channel_id()` 按值返回 `int`。

下面是完整程序。三个 `show_pressure` 模板具有相同的 `const T&` 形参，区别在于约束和函数体：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

template <typename T>
concept identified_source = pressure_source<T> && requires(const T& value) {
    { value.channel_id() } -> std::same_as<int>;
};

struct pressure_sensor {
    double read() const {
        return 220.0;
    }
};

struct channel_sensor {
    double read() const {
        return 240.0;
    }

    int channel_id() const {
        return 7;
    }
};

template <typename T> void show_pressure(const T&) {
    std::cout << "unsupported\n";
}

template <typename T>
    requires pressure_source<T>
void show_pressure(const T& value) {
    const double pressure = value.read();
    std::cout << "pressure: " << pressure << '\n';
}

template <typename T>
    requires identified_source<T>
void show_pressure(const T& value) {
    const double pressure = value.read();
    std::cout << "channel " << value.channel_id() << ": " << pressure << '\n';
}

int main() {
    const pressure_sensor source{};
    const channel_sensor channel{};

    show_pressure(7);
    show_pressure(source);
    show_pressure(channel);
}
```

输出为：

```text
unsupported
pressure: 220
channel 7: 240
```

三次调用可以分开判断：

| 实参类型 | 满足的能力 | 最终选择 |
| --- | --- | --- |
| `int` | 不满足 `pressure_source`，也不满足 `identified_source` | 无约束模板 |
| `pressure_sensor` | 满足 `pressure_source`，缺少 `channel_id()` | `pressure_source` 版本 |
| `channel_sensor` | 同时满足两个概念 | `identified_source` 版本 |

没有满足约束的模板不会因为函数体看起来也许能执行，就保留下来参与最后的比较。相反，无约束模板一直可行，但在本例相同形参的比较中，有适用的受约束版本时，它不会胜出。

最后一行最能体现组合的意义：`identified_source<T>` 既保留了原有气压源要求，又增加了通道编号要求。这个可识别的递进关系让更受约束的版本胜出；程序不会分别调用三个函数，也不会先进入普通版本再尝试升级。

## 与、或按照从左到右的顺序检查

概念定义中的 `&&` 形成合取（conjunction），表示两项都必须满足；`||` 形成析取（disjunction），表示至少一项满足。检查满足性时，它们从左到右短路：

| 组合 | 左侧检查结果 | 右侧是否继续检查 |
| --- | --- | --- |
| `A<T> && B<T>` | `false` | 不再检查右侧，整体为 `false` |
| `A<T> && B<T>` | `true` | 继续检查右侧，由右侧决定整体结果 |
| `A<T> || B<T>` | `true` | 不再检查右侧，整体为 `true` |
| `A<T> || B<T>` | `false` | 继续检查右侧，由右侧决定整体结果 |

在 `identified_source<int>` 中，左侧 `pressure_source<int>` 已经不满足，因此不再检查右侧的通道编号要求。这是模板约束的满足性检查，不是运行时先读取气压、再读取通道；两个成员函数都不会因为检查约束而被调用。

若一个接口允许接收气压源或直接接收 `double` 值，可以在上面程序的命名空间作用域中定义：

```cpp
template <typename T>
concept pressure_input = pressure_source<T> || std::same_as<T, double>;
```

此时 `pressure_input<pressure_sensor>` 和 `pressure_input<double>` 都为 `true`，而 `pressure_input<int>` 为 `false`。这里选择 `same_as`，说明接口只额外接受 `double` 这一种类型，没有把所有数值转换都纳入范围。

`||` 也改变了函数体能够依赖的事实：仅要求 `pressure_input<T>` 的函数，不能无条件使用 `value.read()`，因为满足右侧条件的 `double` 没有这个成员。**合取保留双方要求，析取只保证至少一条路径成立。**不能在接口处写“任选其一”，却在函数体中按“两项都有”使用。

短路只决定右侧是否继续进行约束满足性检查，不会使右侧无须遵守语法，也不会隐藏与模板参数无关的定义错误。

## 更受约束依赖共同的原子来源

语言通过涵盖（subsumption）关系比较约束。对当前程序，只需要掌握它的最小结构：展开所引用的概念，并沿 `&&`、`||` 识别组合，最终剩下参与比较的基本单位叫作原子约束（atomic constraint）。

原子约束不仅记录一个判断表达式，还记录模板参数怎样对应到当前模板实参。两个原子是否相同，需要来自源码中的同一个表达式，并具有相应一致的参数对应关系；仅仅拼写相同、对当前类型都得到 `true`，还不够。

在上面的程序中，可以把 `pressure_source` 定义里的整个 `requires` 表达式记作 `A`，把 `identified_source` 新增的那个 `requires` 表达式记作 `B`：

| 约束 | 用共同原子表示 |
| --- | --- |
| `pressure_source<T>` | `A` |
| `identified_source<T>` | `A && B` |

这里复用 `pressure_source<T>`，让两处的 `A` 来自同一个定义，模板参数也以一致的方式对应。`A && B` 涵盖 `A`，而 `A` 不涵盖 `A && B`，所以 `identified_source` 版本更受约束。类似地，在确实共享同一组原子的前提下，`A` 涵盖 `A || B`：要求 `A` 比允许 `A` 或 `B` 更严格。

这是约束上的偏序（partial ordering）：有些约束能分出强弱，有些不能。编译器不会自动证明任意逻辑表达式的数学蕴含关系，也不会因为一个定义更长，就认定它包含另一个定义。

一个容易踩到的边界是，把被复用概念的实现手动抄进新概念。保留完整程序中的其他代码，只把 `identified_source` 的定义替换为下面这一段：

```cpp
template <typename T>
concept identified_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
} && requires(const T& value) {
    { value.channel_id() } -> std::same_as<int>;
};
```

这个版本仍然会让 `identified_source<channel_sensor>` 为 `true`，但 `show_pressure(channel)` 现在产生歧义（ambiguity），不能通过编译。两份 `read()` 要求虽然逐字相同，却位于不同的 `requires` 表达式中；新抄的整段表达式形成另一个原子 `C`。

于是两个受约束重载现在比较的是 `A` 与 `C && B`。它们没有可用于建立原来涵盖关系的共同原子，不能据此判断哪个更受约束。两者的形参匹配又相同，因此没有唯一最佳版本。无约束版本的存在也无法替两个互不分出胜负的候选消除歧义。

> [!PRACTICE]
> **需要建立能力递进关系时，直接复用已有概念。**`pressure_source<T> && ...` 同时表达了接口意图，并保留重载比较所需的共同原子来源。把要求重抄一遍，可能保持每个具体类型的满足结果，却改变重载集的行为。

这里也不能把“在同一个 `requires` 块里多写一条要求”当作自动产生涵盖关系。用于本例重载比较的原子是整个 `requires` 表达式；要保留已有能力的来源，应像原程序那样把命名概念作为组合的一部分。

## 约束不会越过更好的参数匹配

前面的三个模板故意使用相同的形参形式，让参数匹配保持相当，约束关系才能决定结果。若参数匹配已经分出优劣，不能只比较哪个候选的约束更多。

下面的独立程序只保留气压读取要求，比较 `T&` 与 `const T&` 两种形参：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

struct pressure_sensor {
    double read() const {
        return 240.0;
    }
};

template <typename T> void show_pressure(T& value) {
    const double pressure = value.read();
    std::cout << "mutable: " << pressure << '\n';
}

template <typename T>
    requires pressure_source<T>
void show_pressure(const T& value) {
    const double pressure = value.read();
    std::cout << "constrained: " << pressure << '\n';
}

int main() {
    pressure_sensor source{};
    show_pressure(source);
}
```

输出为 `mutable: 240`。`pressure_sensor` 满足 `pressure_source`，所以受约束版本确实可行；但对 `source` 这个非 `const` 左值，`pressure_sensor&` 与 `const pressure_sensor&` 两种引用绑定相比，前者的匹配更好，无约束模板因此胜出。

这与[重载先比较匹配关系](../31-function-templates-and-type-deduction/05-function-templates-and-overload-resolution.md#模板先形成候选再比较匹配)的模型一致。约束新增了参与条件和相关的平局比较规则，没有取代已有的参数匹配规则。设计重载集时，应先明确各版本接收怎样的实参，再安排需要共享的概念和能力递进关系。

## 参考资料

- [C++23 工作草案：约束的逻辑运算与短路检查](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.op)
- [C++23 工作草案：原子约束及其相同性](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.atomic)
- [C++23 工作草案：约束归一化](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.normal)
- [C++23 工作草案：约束的涵盖关系](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.order)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
