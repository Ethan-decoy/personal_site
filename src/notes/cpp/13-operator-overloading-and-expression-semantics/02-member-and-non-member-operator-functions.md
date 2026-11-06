---
title: 成员与非成员运算符函数（Member and Non-Member Operator Functions）
date: 2026-08-31
order: 2
---

# 成员与非成员运算符函数（Member and Non-Member Operator Functions）

运算符函数可以是成员函数，也可以是类外的非成员函数。两种形式都能为类类型建立运算，但操作数进入函数接口的方式不同。

## 成员形式由调用对象提供左操作数

二元 `operator+` 可以声明为 `pressure_delta_kpa` 的成员：

```cpp
struct pressure_delta_kpa {
    int value;

    pressure_delta_kpa operator+(const pressure_delta_kpa& right) const {
        return pressure_delta_kpa{value + right.value};
    }
};
```

对这份定义执行：

```cpp
const pressure_delta_kpa left{8};
const pressure_delta_kpa right{-3};

const pressure_delta_kpa total{left + right};
```

`left` 是 `operator+` 的调用对象，同时承担二元加法的左操作数；`right` 绑定到唯一的显式形参。成员函数带有 `const` 限定，因此可以通过 `const pressure_delta_kpa` 对象调用，并且不能经调用对象修改其状态。

在当前只有这一项合适候选的语境中，也可以显式写出成员调用：

```cpp
const pressure_delta_kpa direct_total{left.operator+(right)};
```

这项直接调用只用于显式呈现调用对象与形参的对应关系。

**普通二元成员运算符函数由调用对象提供左操作数，右操作数才出现在它的显式形参列表中。**表达式中的操作数没有减少，只是左操作数按照成员函数语义参与调用。

## 非成员形式显式接收两个操作数

同一项加法也可以采用非成员形式。下面是一份独立的替代定义，不应与上一份成员 `operator+` 同时放入同一个程序：

```cpp
struct pressure_delta_kpa {
    int value;
};

pressure_delta_kpa operator+(const pressure_delta_kpa& left, const pressure_delta_kpa& right) {
    return pressure_delta_kpa{left.value + right.value};
}
```

非成员函数没有调用对象，因此两个操作数都明确出现在形参列表中。`left + right` 经过重载决议选择这项函数后，左操作数绑定 `left` 形参，右操作数绑定 `right` 形参。

非成员运算符函数不会自动获得类的私有成员访问权。当前 `struct` 的数据成员本来就是公开的；若类型通过私有表示维护不变式，非成员函数通常应当使用该类型已经提供的公开接口完成运算，而不是为了缩短实现而暴露内部状态。

## 两种形式共同参与重载决议

成员候选不会因为位于类内就自动优先于非成员候选。若调用位置同时看到语义相同、匹配程度也相同的成员与非成员 `operator+`，两者会共同参与重载决议，并可能使 `left + right` 产生歧义。

因此，成员与非成员形式是两种接口设计，不是应当叠加提供的两层实现。对于当前两个同类型操作数的例子，它们都能表达相同的加法结果；这不表示两种形式在所有参数和转换场景中完全等价。

成员形式适合围绕调用对象展开的操作，尤其是需要修改该对象并维护其不变式时。对称的二元值运算常采用非成员形式，使左右操作数以相同的显式接口角色出现。这里的对称描述的是接口角色；交换律等数学性质仍然取决于具体类型与函数实现。

**成员或非成员决定操作数怎样进入函数候选，不会替类型决定运算本身应当具有什么业务含义。**

## 参考资料

- [C++23 工作草案：重载运算符](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：二元运算符](https://timsong-cpp.github.io/cppwp/n4950/over.binary)
- [C++ Core Guidelines：为对称运算使用非成员函数](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-symmetric)
