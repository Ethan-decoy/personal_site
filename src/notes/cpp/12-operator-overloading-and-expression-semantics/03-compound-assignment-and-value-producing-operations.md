---
title: 复合赋值与值产生运算（Compound Assignment and Value-Producing Operations）
date: 2026-08-31
order: 3
---

# 复合赋值与值产生运算（Compound Assignment and Value-Producing Operations）

`left += right` 与 `left + right` 可以基于同一项业务计算，却表达两种不同的对象关系：前者修改已经存在的左对象，后者读取操作数并产生独立结果。运算符接口需要保留这项区别。

```cpp
struct pressure_delta_kpa {
    int value;

    pressure_delta_kpa& operator+=(const pressure_delta_kpa& increment) {
        value += increment.value;
        return *this;
    }
};

pressure_delta_kpa operator+(const pressure_delta_kpa& left, const pressure_delta_kpa& right) {
    return pressure_delta_kpa{left.value + right.value};
}
```

## 复合赋值修改已有对象

成员 `operator+=` 通过调用对象取得左操作数，并通过 `increment` 取得右操作数：

```cpp
pressure_delta_kpa accumulated{15};
const pressure_delta_kpa increment{5};

pressure_delta_kpa& updated{accumulated += increment};
```

调用完成后，`accumulated.value == 20`。`updated` 不是另一个 `pressure_delta_kpa` 对象，而是绑定到同一对象的引用，因此：

```cpp
const bool same_object{&updated == &accumulated}; // true
```

成员函数执行时，`this` 指向当前调用对象，`*this` 是指定该对象的 lvalue。`return *this;` 与返回类型 `pressure_delta_kpa&` 共同使 `accumulated += increment` 的结果仍然指代 `accumulated`。这延续了内建复合赋值的结果模型：修改左操作数，并得到指向该左操作数的 lvalue。

返回 `pressure_delta_kpa&` 是接口惯例，不是所有 `operator+=` 都必须服从的语法要求。C++ 允许为重载的 `+=` 选择其他返回类型，也允许把它定义为非成员函数；当前成员形式和引用结果能够最直接地表达“修改左对象，并把该对象作为运算结果”。

[`this` 指针与隐式对象参数](../10-class-interfaces-and-encapsulation/deep-dives/01-implicit-object-parameter-this-and-implementation-model.md)进一步说明了调用对象与 `*this` 的关系。

## 加法产生独立结果

非成员 `operator+` 通过两个 `const` 引用读取操作数，并按值返回新的 `pressure_delta_kpa`：

```cpp
const pressure_delta_kpa baseline{15};
const pressure_delta_kpa correction{5};

const pressure_delta_kpa projected{baseline + correction};
```

`baseline + correction` 调用按值返回的运算符函数，因而产生 `pressure_delta_kpa` 类型的 prvalue。这个结果初始化 `projected`；求值结束后，`projected.value == 20`，`baseline.value` 仍然是 `15`，`correction.value` 仍然是 `5`。

**在这组接口中，复合赋值修改左操作数并返回指代它的 lvalue；普通加法不修改输入，而是产生用于建立独立对象的值。**函数声明和函数体共同建立这项语义，`+=` 与 `+` 的符号不会自动替实现作出保证。

## 相关运算应当保持一致

若类型同时提供 `+` 与 `+=`，两项接口应当表达同一项组合规则。对有效的 `left` 和 `right`，`left + right` 的可观察结果通常应当等同于先复制 `left`，再对副本执行 `+= right`；语言并不要求两项函数必须采用同一段实现，也不会自动检查它们是否一致。

运算符重载同样不会消除底层运算的边界。示例假定两个 `int` 成员相加的数学结果处于 `int` 可表示范围内；若数学结果无法表示，内建有符号整数加法仍然会产生未定义行为。若类型还承诺特定取值范围，运算符函数也必须像其他公开操作一样保证结果继续满足该项不变式。

**符号表达运算关系，真正决定对象是否被修改、结果指代谁以及状态是否仍然有效的，仍然是函数接口与实现。**

## 参考资料

- [C++23 工作草案：重载运算符](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：赋值与复合赋值](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++ Core Guidelines：按照惯常含义定义运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-conventional)
