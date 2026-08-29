---
title: 聚合初始化与默认成员初始化器（Aggregate Initialization and Default Member Initializers）
date: 2026-08-28
order: 3
---

# 聚合初始化与默认成员初始化器（Aggregate Initialization and Default Member Initializers）

本篇使用的简单 `tire_state` 满足 C++23 对聚合（aggregate）的要求。聚合初始化（aggregate initialization）可以用花括号中的初始化器，依次建立各成员子对象的初始状态。

`struct` 与 aggregate 不是同义词：`struct` 是定义类类型使用的关键字，aggregate 则是类型满足一组语言条件时获得的分类。本章只分析当前简单结构体的聚合行为，不把结论扩展到所有类类型。

## 初始化器按成员声明顺序对应

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;
};

tire_state front_left{2.4, 36.0, 18};
```

花括号中的三个初始化器按成员声明顺序，分别用于初始化：

| 初始化器 | 成员子对象 | 成员类型 |
| --- | --- | --- |
| `2.4` | `front_left.pressure_bar` | `double` |
| `36.0` | `front_left.temperature_c` | `double` |
| `18` | `front_left.wear_percent` | `int` |

位置表达的是对应关系，而不是成员名称。交换结构体中的成员声明顺序，也会改变同一初始化器列表的含义，因此成员顺序是这种接口的一部分。

## 每个成员仍遵循自身初始化规则

聚合初始化不会绕过成员类型的语言规则。每个初始化器最终仍要初始化相应成员，花括号也会在这个边界检查窄化：

```cpp
tire_state invalid_state{2.4, 36.0, 18.5}; // 错误：double 到 int 的窄化
```

前两个初始化器能够建立 `double` 成员，第三个初始化器却不能通过列表初始化建立 `int` 成员。外层对象是用户定义类型，不会让成员初始化失去类型约束。

## 默认成员初始化器提供默认状态

数据成员声明可以带有默认成员初始化器（default member initializer）：

```cpp
struct tire_state {
    double pressure_bar{2.3};
    double temperature_c{20.0};
    int wear_percent{};
};
```

它描述调用者没有为该成员提供显式初始化器时采用的状态：

```cpp
tire_state spare{};
tire_state front_left{2.4, 36.0, 18};
tire_state rear_left{2.5};
```

三次初始化的结果分别是：

| 对象 | `pressure_bar` | `temperature_c` | `wear_percent` |
| --- | ---: | ---: | ---: |
| `spare` | `2.3` | `20.0` | `0` |
| `front_left` | `2.4` | `36.0` | `18` |
| `rear_left` | `2.5` | `20.0` | `0` |

`front_left` 的显式初始化器取代三个默认成员初始化器；`rear_left` 只显式初始化第一个成员，其余成员使用各自的默认成员初始化器。

**默认成员初始化器不是创建对象时必定先执行、随后又被覆盖的赋值。每个成员只选择当前初始化语境规定的初始化器，并完成一次初始化。**

## 没有默认状态的成员

聚合初始化使用空花括号时，没有显式初始化器、也没有默认成员初始化器的普通标量成员会从空初始化列表完成初始化，因此得到零值：

```cpp
struct tire_measurement {
    int sample_count;
    double latest_pressure_bar;
};

tire_measurement ready{}; // sample_count == 0，latest_pressure_bar == 0.0
```

但省略对象初始化器是另一种初始化形式。若下面的声明位于函数体内，`pending` 具有自动存储期（automatic storage duration）：

```cpp
tire_measurement pending;
```

这里对 `pending` 执行默认初始化；当前简单结构体没有默认成员初始化器，两个标量成员不会因此得到确定值。读取它们之前必须先建立有效状态。若同一声明位于命名空间作用域，对象还会先经过零初始化，不能把函数体内的结论直接推广到所有存储期。

在表示明确默认状态的简单数据结构中，默认成员初始化器可以让空花括号和默认初始化都得到可预测结果。若某个对象没有合理默认状态，则不应为了省略初始化参数而虚构一个具有业务歧义的状态。

## 成员按照声明顺序初始化

成员子对象实际按照它们在结构体中的声明顺序初始化。默认成员初始化器可以使用已经完成初始化的较早成员：

```cpp
struct pressure_range {
    int minimum_kpa{0};
    int maximum_kpa{minimum_kpa + 300};
};

pressure_range default_range{};
```

`minimum_kpa` 先初始化为 `0`，随后 `maximum_kpa` 读取同一个 `pressure_range` 对象中已经存在的成员状态，得到 `300`。依赖成员初始化顺序的代码应当与声明顺序保持一致，而不是让成员之间形成难以观察的初始化关系。

## 参考资料

- [C++23 工作草案：聚合](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：默认成员初始化器](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++ Core Guidelines：始终初始化对象](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-always)
