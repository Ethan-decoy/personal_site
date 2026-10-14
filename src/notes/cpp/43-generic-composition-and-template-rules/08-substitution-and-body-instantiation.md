---
title: 替换失败与函数体实例化（Substitution Failure and Body Instantiation）
date: 2026-10-08
order: 8
---

# 替换失败与函数体实例化（Substitution Failure and Body Instantiation）

一个模板候选为什么被排除，和选中后函数体为什么编译失败，是两项不同判断。将所有错误都当作“换另一个重载”会错误推演调用。

## 直接替换条件可以影响候选集合

模板实参替换（Template Argument Substitution）将推导或指定实参代入相应声明。按规定发生在直接语境中的某些失败，会导致候选不适用，而非立即使整个调用不合法，通常称 SFINAE（Substitution Failure Is Not An Error）。

下面 `-> decltype(value.read())` 是尾置返回类型，位于形参列表后，使用形参名称形成类型表达式。若实际类型没有可调用 read，这一候选在相应替换中被排除。

```cpp
#include <iostream>

struct sensor {
    int read() const {
        return 230;
    }
};

int read_value(int value) {
    return value;
}

template <typename T> auto read_value(const T& value) -> decltype(value.read()) {
    return value.read();
}

int main() {
    std::cout << read_value(220) << '\n';      // 220
    std::cout << read_value(sensor{}) << '\n'; // 230
}
```

对 int，模板声明里的成员调用无法成立，普通整数重载可用；对 sensor，相应模板声明和函数体都成立。

## 函数体错误不会自动成为替换失败

若模板改为固定返回 int，把 `value.read()` 仅放在函数体中，声明可能仍是可行候选。选中后实例化发现没有 read，不能再假定编译器回去换成次优重载。

保留前例的 `sensor` 和普通整数重载，用下面的定义替换函数模板，并替换 `main`。这组变式用于观察编译失败：

```cpp
template <typename T> int read_value(const T& value) {
    return value.read();
}

int main() {
    std::cout << read_value(short{220}) << '\n';
}
```

这次失败可以按调用阶段定位：

1. 从 `short{220}` 推导出 `T = short`；声明形成 `int read_value<short>(const short&)`，其中没有检查 `read()`。
2. 模板一方直接绑定 `short`，是精确匹配；普通 `read_value(int)` 需要从 `short` 提升到 `int`，所以模板一方胜出。
3. 选中后需要实例化函数体，`value.read()` 对 `short` 不成立，程序在这里编译失败。它不会改选仍然可行的普通整数重载。

为什么用 `short`？若沿用 `read_value(220)`，两边都精确匹配，当前平局由普通函数胜出，模板函数体无需实例化。这一调用仍然成功，不能显示“选中模板之后出错”的边界。

带推导返回类型的函数体实例化，以及替换触发其他模板的内部错误，也不应无条件当作直接语境的失败。SFINAE 有规定范围，不是“模板中任何错误都可以忽略”。

> [!IMPORTANT]
> 分别检查推导、声明替换或约束、重载选择、函数体实例化。接口适用性要放在能表达它的声明条件中，函数体负责实现已承诺的操作。

## 概念把适用条件写成明确接口

C++23 的新接口通常用 requires 表达可用操作及关系。SFINAE 帮助阅读已有库和解释替换机制，不要求为每项新约束手写复杂类型特征。

std::enable_if 是传统条件类型工具：条件不成立时不提供相应成员类型，配合合法的替换位置影响候选。它的作用不能推广到普通函数体的任意错误；概念通常更直接。

## 参考资料

- [C++23 工作草案：推导与替换失败](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct)
