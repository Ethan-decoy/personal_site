---
title: 混合类型运算与转换对称性（Mixed-Type Operations and Conversion Symmetry）
date: 2026-09-01
order: 5
---

# 混合类型运算与转换对称性（Mixed-Type Operations and Conversion Symmetry）

普通二元成员 `operator+` 由调用对象提供左操作数，只有右操作数对应显式形参；非成员 `operator+` 则用两个显式形参接收左右操作数。混合类型运算需要用户定义转换时，这项差异直接决定哪一侧能够通过形参初始化完成转换。

以下示例允许 `int` 隐式转换为 `pressure_delta_kpa`，只用来说明操作数位置怎样影响函数匹配。裸整数不携带单位，因此这项接口不代表压力类型的推荐设计：

```cpp
class pressure_delta_kpa {
  public:
    pressure_delta_kpa(int value_kpa);
    pressure_delta_kpa operator+(const pressure_delta_kpa& right) const;
};
```

## 成员形式只为右侧提供形参转换入口

左操作数已经是类对象时，右侧整数可以初始化成员函数参数列表中的形参：

```cpp
const pressure_delta_kpa current_delta{8};

const pressure_delta_kpa right_mixed{current_delta + 3};
const pressure_delta_kpa left_mixed{3 + current_delta}; // 错误
```

在第一条表达式中，`current_delta` 是调用对象，`3` 对应形参 `right`。`pressure_delta_kpa(int)` 可以建立临时对象，再把它绑定到 `const pressure_delta_kpa&`。

交换操作数后，左侧 `3` 应当承担调用对象角色，但这项成员接口的参数列表中没有接收左操作数的形参。用于初始化 `right` 的转换能力不能移到调用对象一侧，因此 `3 + current_delta` 不会选中这项成员 `operator+`。

这里关于左右转换机会的结论只适用于普通二元 `operator+`。相等与关系比较会按专门规则额外尝试由其他比较运算生成、或交换了操作数顺序的候选，不能直接套用这套模型。

## 非成员形式为两侧提供形参转换入口

若移除上面的成员 `operator+` 声明，改为一项非成员运算符函数，两个操作数会分别对应参数列表中的两个形参：

```cpp
pressure_delta_kpa operator+(const pressure_delta_kpa& left,
                             const pressure_delta_kpa& right);
```

在这份替代设计中，交换整数所在位置不会消除相应的形参转换机会：

```cpp
const pressure_delta_kpa current_delta{8};

const pressure_delta_kpa right_mixed{current_delta + 3};
const pressure_delta_kpa left_mixed{3 + current_delta};
```

第一条表达式用 `3` 初始化右形参，第二条表达式用 `3` 初始化左形参。因此，两项调用都能用 `pressure_delta_kpa(int)` 建立缺少的一侧，均为可行调用。

这里的转换发生在运算符函数的形参初始化中。两个操作数都只有内建类型时，表达式仍按内建运算规则处理，不会仅凭它们能够转换为某个类类型就改用该类的非成员运算符。

## 对称转换不等于对称业务含义

非成员形式让左右两侧具有对称的形参角色，不表示每项二元运算都应接受两种方向，也不能证明操作满足交换律。接口是否对称，首先取决于两个操作数在业务中是否承担同一种角色。

真实的压力单位类型通常应把这项构造函数声明为 `explicit`，而不是为了缩短混合表达式就让裸整数隐式进入单位类型；调用者仍然可以明确写出单位：

```cpp
const pressure_delta_kpa increased_delta{current_delta + pressure_delta_kpa{3}};
```

选择非成员形式仍然有助于同类型值之间的对称运算，却不要求同时放宽其他类型进入该值类型的构造边界。

**对于普通二元 `operator+`，成员形式只为右操作数提供形参转换入口，非成员形式则让左右操作数都通过形参参与匹配。只有业务关系与转换本身都适合隐式发生时，这种对称的转换机会才应成为公开接口。**

## 参考资料

- [C++23 工作草案：表达式中的运算符重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper)
- [C++23 工作草案：候选函数与实参列表](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs)
- [C++ Core Guidelines：为对称运算使用非成员函数](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-symmetric)
