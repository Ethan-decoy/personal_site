---
title: 标准转换序列与重载排序（Standard Conversion Sequences and Overload Ranking）
date: 2026-08-29
order: 1
---

# 标准转换序列与重载排序（Standard Conversion Sequences and Overload Ranking）

重载决议会为每个可行函数的每个实参建立一条隐式转换序列。这条序列描述相应实参怎样初始化形参，也是比较多个可行函数匹配质量的依据。

本章实际出现的路径只涉及普通函数、内建算术类型、左值引用和对象指针的限定调整，并且都属于标准转换序列。它们记录的是语言规定的类型与绑定关系，不是编译后需要执行多少条机器指令。

## 当前示例中的转换阶段

本附章当前按值传递算术类型、调整对象指针限定的示例只会用到以下阶段：

1. 按值使用左值时，进行至多一次左值到右值转换，读取对象当前保存的值；
2. 必要时进行至多一次数值提升或数值转换；
3. 必要时进行至多一次限定转换（qualification conversion），调整指针所指类型的 `const` 等限定。

并非每次调用都会经历全部步骤：

```cpp
int store_sample(int sample_count) {
    return sample_count;
}

int measured_count{7};
const int stored{store_sample(measured_count)};
```

名称表达式 `measured_count` 是左值。按值形参需要一个 `int` 值，因此左值到右值转换会读取对象当前保存的 `7`；读取后的类型已经是 `int`，不再需要数值类型转换。

每个阶段也可以不发生转换。这些阶段是当前示例实际使用的标准转换子集，不是标准转换序列的完整分类；即使只在这个子集内，也不能为了匹配某个重载而自由串联任意多项转换。

## 序列的组成决定整体等级

正文已经建立的三个等级仍然保持如下顺序：Exact Match 优于 Promotion，Promotion 优于 Conversion。一条标准转换序列的整体等级会考虑其中每项转换以及引用绑定的等级：

- 所有组成部分都处于 Exact Match 等级时，整条序列属于 Exact Match；
- 至少包含 Promotion、但不包含 Conversion 等级的组成部分时，整条序列属于 Promotion；
- 只要包含 Conversion 等级的组成部分，整条序列就属于 Conversion。

例如，`short` 左值按值传给 `int` 形参时，左值到右值转换保持在 Exact Match 等级，随后的整数提升使整条序列属于 Promotion。

**类型占用更多存储空间或能够表示更大范围，不等于相应转换属于 Promotion。**`int` 到 `long` 仍然是整数转换，属于 Conversion 等级。Promotion 是标准明确规定的一组转换关系，不能用“变成更大的类型”代替。

## Exact Match 不等于没有转换

Exact Match 是重载排序中的等级名称，不表示实参与形参之间完全没有语义步骤：

```cpp
int inspect_temperature(int temperature_c) {
    return temperature_c;
}

int measured_temperature_c{78};
const int inspected{inspect_temperature(measured_temperature_c)};
```

调用需要从左值 `measured_temperature_c` 读取当前值，但左值到右值转换仍然属于 Exact Match 等级。

增加被指对象的类型限定也可以保持在 Exact Match 等级：

```cpp
int observe_temperature(const int* temperature_c) {
    return *temperature_c;
}

int measured_temperature_c{78};
int* temperature_pointer{&measured_temperature_c};

const int observed{observe_temperature(temperature_pointer)};
```

`int*` 可以转换为 `const int*`。这项限定转换限制通过所得指针修改被指对象的能力，但在重载排序中仍然属于 Exact Match。

## 引用绑定先决定可行性

实参与引用形参能够直接绑定时，引用初始化不会先从左值读取一份独立值，而是让形参指代已有对象。若类型不能直接绑定，引用不一定保留实参对象的身份：非 `const` 左值引用不能借助数值转换绑定新结果，`const` 左值引用则可能绑定转换后物化的临时对象。

```cpp
int inspect_pressure(int& pressure_kpa) {
    return pressure_kpa;
}

int inspect_pressure(const int& pressure_kpa) {
    return pressure_kpa;
}

int measured_pressure_kpa{220};
const int fixed_pressure_kpa{225};

const int first{inspect_pressure(measured_pressure_kpa)};
const int second{inspect_pressure(fixed_pressure_kpa)};
const int third{inspect_pressure(230)};
```

对于 `measured_pressure_kpa`，两个引用形参都能绑定。两条序列都属于 Exact Match，但绑定到 `int&` 不需要增加 `const` 限定，因此非 `const` 引用版本具有更好的转换序列。

对于 `fixed_pressure_kpa`，`int&` 不能绑定 `const int` 对象，只有 `const int&` 版本可行。表达式 `230` 是 `int` prvalue；`int&` 不能绑定该结果，而 `const int&` 可以绑定由此物化的临时对象，因此仍然只有 `const int&` 版本可行。

**可行性判断先排除不能完成的引用绑定，排序只发生在剩余的可行函数之间。**直接引用绑定保留原对象的身份和相应访问能力；若匹配依赖转换与临时对象物化，引用指代的则是新物化的临时对象。引用匹配不能统一理解成“把实参转换为引用类型”。

## 同等级序列仍可能继续比较

两个标准转换序列属于相同等级，不表示它们必然同样好。恒等转换（identity conversion）和增加限定的转换都属于 Exact Match，但前者可以比后者更直接：

```cpp
int observe_pressure(int* pressure_kpa) {
    return *pressure_kpa;
}

int observe_pressure(const int* pressure_kpa) {
    return *pressure_kpa;
}

int measured_pressure_kpa{220};
int* pressure_pointer{&measured_pressure_kpa};

const int observed{observe_pressure(pressure_pointer)};
```

`int*` 形参不需要改变指针类型；`const int*` 形参需要增加被指对象的 `const` 限定。两条序列都处于 Exact Match 等级，但前一项转换序列是更好的匹配，因此选择 `observe_pressure(int*)`。

等级提供第一层排序，标准还会在必要时比较序列的组成、限定关系和引用绑定关系。不能只看到相同等级就立即断定调用存在歧义。

## 参考资料

- [C++23 工作草案：隐式转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics)
- [C++23 工作草案：标准转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.scs)
- [C++23 工作草案：隐式转换序列排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom)
- [C++23 工作草案：浮点提升](https://timsong-cpp.github.io/cppwp/n4950/conv.fpprom)
- [C++23 工作草案：限定转换](https://timsong-cpp.github.io/cppwp/n4950/conv.qual)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
