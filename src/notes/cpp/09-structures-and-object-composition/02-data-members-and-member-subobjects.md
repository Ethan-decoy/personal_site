---
title: 数据成员与成员子对象（Data Members and Member Subobjects）
date: 2026-08-28
order: 2
---

# 数据成员与成员子对象（Data Members and Member Subobjects）

结构体定义中的声明描述数据成员（data member）。每当程序创建一个 `tire_state` 对象，这些对象类型的非静态数据成员都会在该对象内部形成各自的成员子对象（member subobject）。

## 成员声明与成员子对象

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;
};

tire_state front_left{2.4, 36.0, 18};
tire_state rear_right{2.2, 32.0, 12};
```

类型定义中只有一条 `pressure_bar` 成员声明，但两个完整对象分别包含自己的 `double` 成员子对象：

```text
front_left
├── pressure_bar     2.4
├── temperature_c   36.0
└── wear_percent    18

rear_right
├── pressure_bar     2.2
├── temperature_c   32.0
└── wear_percent    12
```

成员声明规定结构；成员子对象则属于某个实际的完整对象，具有自己的类型、身份、当前值和生命周期。

## 通过对象访问成员

成员访问运算符（member access operator）`.` 根据左操作数指定的对象选择成员：

```cpp
const double current_pressure_bar{front_left.pressure_bar};
front_left.pressure_bar = 1.9;
```

名称表达式 `front_left` 是 lvalue，指定已有的 `tire_state` 对象。表达式 `front_left.pressure_bar` 也是 lvalue，进一步指定其中的 `double` 成员子对象；初始化会读取它的当前值，赋值则会修改这个成员子对象。

执行后，`front_left.pressure_bar == 1.9`，而 `rear_right.pressure_bar` 仍为 `2.2`。两个完整对象的成员不会因为类型与名称相同而自动同步。

**成员访问先确定左侧表达式所指定的类对象，再在该对象中确定相应成员。这个类对象既可以是完整对象，也可以是成员子对象。**

## const 完整对象限制成员访问

```cpp
const tire_state baseline{2.3, 20.0, 0};

const double baseline_pressure_bar{baseline.pressure_bar};
baseline.pressure_bar = 2.5; // 错误：不能经 const 对象修改成员
```

成员声明中的类型仍然是 `double`，但 `baseline` 是 `const tire_state` 对象。经这个对象访问本章中的普通数据成员时，所得路径不能用来修改相应成员子对象。

这项限制只来自当前访问对象：

```cpp
tire_state current{2.4, 36.0, 18};
const tire_state& observed{current};

const double observed_pressure_bar{observed.pressure_bar};
observed.pressure_bar = 2.5; // 错误：引用提供受限访问
current.pressure_bar = 2.5;  // 正确：原对象仍允许修改
```

`observed` 与 `current` 最终指定同一个完整对象，但两条访问路径具有不同的修改权限。`const` 引用没有改变 `current` 的类型，也没有创建另一组成员。

## 成员的存储期随完整对象

成员子对象不是与完整对象偶然相邻的外部对象。它的存储期与完整对象相同，并在完整对象的初始化和销毁过程中完成自身的初始化与销毁。引用或指针只会建立访问路径，不能把成员保留到包含它的存储期结束之后。

**成员子对象具有独立身份，但它是完整对象的一部分，其存储期随完整对象。**

## 参考资料

- [C++23 工作草案：对象与子对象](https://timsong-cpp.github.io/cppwp/n4950/intro.object)
- [C++23 工作草案：非静态数据成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
