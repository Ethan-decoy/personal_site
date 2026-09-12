---
title: 运算符函数与类类型表达式（Operator Functions and Class-Type Expressions）
date: 2026-08-31
order: 1
---

# 运算符函数与类类型表达式（Operator Functions and Class-Type Expressions）

`int`、`double` 等内建类型参与 `+` 表达式时，应当执行什么运算已经由语言规定。用户定义类型中的数据具有什么含义，则只能由类型提供的接口说明。一个压力变化量可以这样表示：

```cpp
struct pressure_delta_kpa {
    int value;
};
```

类定义建立了 `pressure_delta_kpa` 类型，却没有因此规定两个此类对象怎样相加。C++ 允许声明运算符函数（operator function），为已有运算符定义类类型参与时的行为：

```cpp
pressure_delta_kpa operator+(const pressure_delta_kpa& left, const pressure_delta_kpa& right) {
    return pressure_delta_kpa{left.value + right.value};
}
```

以运算符函数为类类型建立运算语义，称为运算符重载（operator overloading）。

这项函数的返回类型是 `pressure_delta_kpa`，函数名是 `operator+`，两个引用形参分别接收加法的左右操作数。函数只通过 `const` 引用读取原对象，并按值返回一个新的压力变化量。

函数体中的 `left.value + right.value` 仍然执行内建整数加法，因为两侧子表达式产生的都是 `int` 值。**同一个 `+` 符号最终采用哪项语义，取决于操作数类型和重载决议，而不是符号在源代码中的外形。**

## 运算符表达式仍然经过重载决议

声明可见后，类类型对象可以出现在普通的加法表达式中：

```cpp
const pressure_delta_kpa calibration_delta{8};
const pressure_delta_kpa temperature_delta{-3};

const pressure_delta_kpa total_delta{calibration_delta + temperature_delta};
```

名称表达式 `calibration_delta` 和 `temperature_delta` 都是指定已有 `const pressure_delta_kpa` 对象的 lvalue。类类型参与 `+` 表达式时，语言为这次运算建立候选并进行重载决议；当前 `operator+` 的两个形参都能直接绑定对应对象，因此它是这段代码中被选中的函数。

函数按值返回 `pressure_delta_kpa`，所以 `calibration_delta + temperature_delta` 产生该类型的 prvalue，并用它初始化独立对象 `total_delta`。求值结束后，`total_delta.value == 5`，两个原对象保持不变。

**重载运算符表达式的结果类型和值类别由被选中函数的返回声明决定，不是由运算符符号单独决定。**若运算符函数返回左值引用，表达式结果就是 lvalue；符号本身不会强制它产生新对象。

## 运算符函数仍然可以直接调用

`operator+` 是一项可以显式写出的函数名。在当前声明可见且只有这一项合适候选的语境中，也可以直接调用它：

```cpp
const pressure_delta_kpa direct_total{operator+(calibration_delta, temperature_delta)};
```

`calibration_delta + temperature_delta` 是运算符表达式，`operator+(calibration_delta, temperature_delta)` 是函数调用表达式。它们在当前示例中选择同一项函数并产生相同的值，但这不表示编译器只是把前一种源代码替换成后一种文本。运算符写法仍按照自身的表达式规则建立候选、分组并安排求值。

内建表达式也不能依此类推。`1 + 2` 使用语言规定的内建加法，不表示程序中存在一项可以直接调用的 `operator+(1, 2)` 函数。

## 不能重新定义纯内建类型的运算

运算符重载用于让类类型参与已有运算，不能覆盖内建类型之间已经确定的含义：

```cpp
int operator+(int left, int right) { // 错误：两个操作数都是内建类型
    return left - right;
}
```

C++ 不允许这项声明。程序不能借此把 `int + int` 从加法改成减法；纯内建类型表达式始终遵循相应的内建规则。

定义当前二元 `operator+` 不会同时声明一元 `+`、`operator+=`、减法或相等运算符；这些函数不会仅因名称相近而自动出现。

**运算符重载为类类型参与的表达式补充语义，不会改写纯内建类型表达式的既有含义。**

## 参考资料

- [C++23 工作草案：重载运算符](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：表达式中的运算符重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper)
