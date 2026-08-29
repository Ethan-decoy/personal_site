---
title: 结构体对象的复制与赋值（Copying and Assigning Struct Objects）
date: 2026-08-28
order: 4
---

# 结构体对象的复制与赋值（Copying and Assigning Struct Objects）

结构体把多个成员组织为一个完整对象，因此同类型对象之间的初始化和赋值也能够作用于整个结构体。对于本章中只含可复制基本类型成员的简单结构体，C++ 会提供相应的复制行为。

## 用已有对象初始化新对象

```cpp
struct tire_state {
    double pressure_bar{2.3};
    double temperature_c{20.0};
    int wear_percent{};
};

tire_state current{2.4, 36.0, 18};
tire_state saved{current};
```

第二条对象声明创建新的 `tire_state` 对象 `saved`。虽然初始化器使用花括号，但这里只有一个同类型表达式 `current`；C++23 会直接用它初始化整个 `saved`，而不是把它当成 `pressure_bar` 的位置初始化器。当前简单类型由语言提供的复制操作会用 `current` 中对应成员的状态初始化 `saved` 的各成员子对象：

```text
current                       saved
├── pressure_bar    2.4  ──>  ├── pressure_bar    2.4
├── temperature_c 36.0  ──>  ├── temperature_c 36.0
└── wear_percent    18   ──>  └── wear_percent    18
```

箭头表示初始化时读取对应成员的状态，不表示两个对象之间保留同步关系：

```cpp
current.pressure_bar = 1.9;
current.wear_percent = 25;
```

执行后，`saved` 的成员仍然是 `2.4`、`36.0` 和 `18`。两个完整对象身份不同，它们内部的基本类型成员子对象也彼此独立。

## 赋值修改已有结构体对象

```cpp
tire_state active{2.1, 40.0, 30};
const tire_state baseline{2.3, 20.0, 0};

active = baseline;
```

赋值不会创建新的 `tire_state` 对象。它把 `baseline` 各成员的当前状态赋给 `active` 中对应的已有成员子对象。执行后两个对象保存相同状态，但仍然具有各自身份；继续修改其中一个不会自动改变另一个。

这与基本类型对象上的区别一致：初始化创建对象并建立初始状态，赋值修改已经存在的对象。结构体只把这项行为扩展到了由多个成员组成的完整对象。

## 成员复制遵循成员自己的语义

“逐成员复制”不表示复制操作会追踪每个成员最终关联的外部对象。若成员本身是指针，复制的是指针值：

```cpp
struct pressure_observer {
    const double* observed_pressure_bar{nullptr};
};

double measured_pressure_bar{2.4};

pressure_observer primary{&measured_pressure_bar};
pressure_observer secondary{primary};

const bool same_target{primary.observed_pressure_bar == secondary.observed_pressure_bar};
```

`primary` 与 `secondary` 是两个独立的 `pressure_observer` 对象，各自包含一个独立的指针成员子对象。不过两个指针成员保存相同的指针值，因此 `same_target == true`，并且都指向唯一的 `measured_pressure_bar`：

```cpp
measured_pressure_bar = 1.9;
const double observed_pressure_bar{*(secondary.observed_pressure_bar)};
```

`observed_pressure_bar == 1.9`，`primary` 经自己的指针成员也能观察到同一个值。不是两个结构体对象在同步，而是复制后的两条指针路径仍然指定同一个外部对象。

**结构体复制让完整对象及其成员子对象具有独立身份，但每个成员值中原有的别名关系仍按该成员类型的规则保留。**

上述复制按成员语义建立结果，并不等于逐字节复制对象存储。填充区域与对象表示为何不能代替成员语义，见附章[对象布局、对齐与填充](deep-dives/01-object-layout-alignment-and-padding.md)。

本篇结论限定于成员均支持相应操作的简单结构体；成员自身的类型约束会继续约束完整结构体能否复制初始化或复制赋值。

## 参考资料

- [C++23 工作草案：复制初始化的成员语义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
