---
title: 重载接口的设计边界（Design Boundaries of Overloaded Interfaces）
date: 2026-08-29
order: 5
---

# 重载接口的设计边界（Design Boundaries of Overloaded Interfaces）

函数重载允许多个函数共享一个名称，但共享名称也意味着这些函数向调用者作出了共同的语义承诺。对本章给出的这些调用，编译器根据实参数量、类型、值类别和绑定关系选择函数，无法理解这些类型在业务中分别代表什么。

**重载适合表达同一项操作能够接受的不同输入形式，不适合用类型差异隐藏彼此无关的行为。**重载决议得到唯一最佳函数，只说明重载选择本身具有唯一目标；访问控制等其余语言规则仍须满足，接口语义也仍须由设计保证。

## 同一个名称应当表达同一项操作

下面两个函数都表示判断压力是否处于有效范围，区别只在于能够接受的数值表示：

```cpp
bool is_pressure_valid(int pressure_kpa) {
    return pressure_kpa >= 0 && pressure_kpa <= 500;
}

bool is_pressure_valid(double pressure_kpa) {
    return pressure_kpa >= 0.0 && pressure_kpa <= 500.0;
}
```

无论调用最终选择哪一项重载，名称 `is_pressure_valid` 都保持同一项业务含义。

若同名函数实际完成不同工作，参数类型只会掩盖这项差异：

```cpp
void update(int retry_count);
void update(double pressure_bar);
```

`update(3)` 与 `update(3.0)` 会选择不同函数，但调用位置无法直接说明一次调用是在修改重试次数还是轮胎压力。不同操作应当由名称直接表达：

```cpp
void set_retry_count(int retry_count);
void set_pressure_bar(double pressure_bar);
```

名称首先承担接口语义，重载只在这项语义确实相同时统一不同输入形式。

## 参数名称不能表达单位差异

参数名称不参与区分函数，因此下面两行只是对同一个函数的重复声明：

```cpp
void set_pressure(double pressure_bar);
void set_pressure(double pressure_kpa);
```

把参数分别改成 `float` 和 `double` 虽然能够形成重载，却会错误地把单位寄托在数值表示形式上：

```cpp
void set_pressure(float pressure_bar);
void set_pressure(double pressure_kpa);
```

调用者书写 `2.3F` 还是 `2.3` 将决定所使用的单位。编译器只能看到 `float` 与 `double`，无法知道调用者真正想表达 bar 还是 kPa。

在单位尚未由类型表达时，名称应当保留单位信息：

```cpp
void set_pressure_bar(double pressure_bar);
void set_pressure_kpa(double pressure_kpa);
```

用户定义类型也可以让单位成为实参类型的一部分：

```cpp
struct pressure_bar {
    double value;
};

struct pressure_kpa {
    int value;
};

double to_bar(pressure_bar pressure) {
    return pressure.value;
}

double to_bar(pressure_kpa pressure) {
    return static_cast<double>(pressure.value) / 100.0;
}

const double first{to_bar(pressure_bar{2.3})};
const double second{to_bar(pressure_kpa{230})};
```

两个 `to_bar` 重载仍然表达同一项转换操作，而 `pressure_bar` 与 `pressure_kpa` 已经在类型层面说明输入单位。调用不再依赖字面量后缀偶然决定业务语义。

**类型只有真正表达了不同概念时，才适合承担重载选择的依据。**

## 相近数值类型会扩大选择边界

由多个相近算术类型构成的重载集，常常比接口表面呈现的更难调用：

```cpp
int normalize_limit(int requested_limit);
int normalize_limit(long requested_limit);

short requested_limit{8};
const int normalized{normalize_limit(requested_limit)};
```

这里选择 `normalize_limit(int)`，因为 `short` 到 `int` 属于整数提升，而 `short` 到 `long` 属于 Conversion 等级。选择来自语言的排序规则，不取决于数值 `8` 能被哪个类型表示，也不说明 `int` 在业务上必然更适合。

重载集还是一个整体接口。新增函数会改变相应名称的候选集合，原本通过转换选中某项函数的调用，在重新编译后可能选择新增的精确匹配，或者变成没有唯一最佳函数的歧义调用。

相近数值类型的重载只有在调用者本来就自然持有这些不同类型，并且所有重载确实保持同一语义时才容易维护。若接口内部最终只需要一种表示形式，一个明确的参数类型通常更容易理解。

## 显式转换只能表达本次选择

面对没有唯一最佳函数的调用，显式转换可以使某项重载获得更直接的匹配：

```cpp
int select_limit(long requested_limit);
int select_limit(double requested_limit);

int requested_limit{8};
const int selected{select_limit(static_cast<long>(requested_limit))};
```

`static_cast<long>(requested_limit)` 明确产生 `long` 结果，因此选择第一项函数。在这个例子中，`int` 到 `long` 能够保留原值；但这个写法仍然只表达了本次转换和重载选择，不能回答为什么业务上应当使用 `long`。更一般地，显式转换本身也不会替程序证明目标类型、数值范围和精度符合业务要求。

若大量调用位置都必须依靠显式转换才能选中预期函数，问题通常已经从调用语法转移到接口设计。增加转换只能控制当前表达式的静态类型，不能使含义不同的重载自动成为统一接口。

## 重载集也是可演进的接口

设计重载接口时，需要同时检查：

- 所有重载是否表达同一项操作；
- 参数类型本身是否准确表达不同输入形式；
- 常见实参能否自然得到唯一且可预期的最佳匹配；
- 隐式转换是否仍然保留业务所需的范围、精度和单位含义。

**重载解决的是同一语义面对多种输入形式时的名称统一；不同操作、单位或策略仍应由不同名称或真正不同的类型表达。**语言能够完成重载决议，只是正确接口的必要条件之一。

## 参考资料

- [C++23 工作草案：函数重载](https://timsong-cpp.github.io/cppwp/n4950/over)
- [C++ Core Guidelines：重载应当执行等价操作](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-equivalent)
- [C++ Core Guidelines：避免对参数含义产生歧义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#i4-make-interfaces-precisely-and-strongly-typed)
