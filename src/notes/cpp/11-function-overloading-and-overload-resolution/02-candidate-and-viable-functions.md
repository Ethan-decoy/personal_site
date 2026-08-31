---
title: 候选函数与可行函数（Candidate and Viable Functions）
date: 2026-08-29
order: 2
---

# 候选函数与可行函数（Candidate and Viable Functions）

调用表达式写出一个重载名称时，编译器不会直接执行“参数最像”的函数。它先根据当前位置的名称查找结果确定候选函数（candidate function），再从中筛出能够接受当前实参的可行函数（viable function）：

```text
名称查找得到同名函数
          │
          ▼
       候选函数
          │  检查实参数量、隐式转换与引用绑定
          ▼
       可行函数
```

本篇当前使用的普通函数都声明在同一作用域，没有其他能够扩展候选集合的语言机制。在这个边界内，名称查找得到的同名函数就是需要检查的候选函数。

## 实参数量先排除不能调用的函数

下面的两个重载分别接收一个和两个实参：

```cpp
int calculate_pressure_margin(int pressure_kpa) {
    return 500 - pressure_kpa;
}

int calculate_pressure_margin(int pressure_kpa, int maximum_pressure_kpa) {
    return maximum_pressure_kpa - pressure_kpa;
}
```

调用名称 `calculate_pressure_margin` 时，两项声明都属于候选函数：

```cpp
const int default_margin{calculate_pressure_margin(220)};
const int configured_margin{calculate_pressure_margin(220, 450)};
```

第一条调用只提供一个实参，因此只有第一个候选在当前模型中可行；第二条调用提供两个实参，因此只有第二个候选可行。实参数量不能满足参数列表时，相应函数不会进入这次调用的可行函数集合。

## 允许的隐式转换也能建立可行性

形参与实参的类型不必逐字相同。只要每个实参都能按照已经建立的隐式转换规则初始化对应形参，相应候选仍然可能可行：

```cpp
int encode_pressure(int pressure_kpa);
int encode_pressure(double pressure_kpa);

short measured_pressure_kpa{220};
const int encoded{encode_pressure(measured_pressure_kpa)};
```

对于这次调用：

- `short` 可以提升为 `int`，因此第一个候选可行；
- `short` 也可以转换为 `double`，因此第二个候选同样可行。

可行性只回答“这项函数能否被调用”，不会在仍有多个可行函数时直接决定结果。编译器还需要比较各项转换的匹配质量，确定是否存在唯一更好的函数。

实参转换用于初始化本次调用的形参。无论最终选择哪个候选，`measured_pressure_kpa` 对象仍然是 `short` 对象；调用不会把它的数据类型改成 `int` 或 `double`。

## 引用形参必须能够完成绑定

引用参数是否能够绑定相应实参，也是可行性判断的一部分：

```cpp
bool try_update_pressure(int& stored_pressure_kpa, int requested_pressure_kpa) {
    stored_pressure_kpa = requested_pressure_kpa;
    return true;
}

bool try_update_pressure(double& stored_pressure_kpa, double requested_pressure_kpa) {
    stored_pressure_kpa = requested_pressure_kpa;
    return true;
}
```

已有一个可修改的 `int` 对象时：

```cpp
int stored_pressure_kpa{220};
const bool updated{try_update_pressure(stored_pressure_kpa, 225)};
```

`stored_pressure_kpa` 可以直接绑定第一个候选的 `int&` 形参。若要匹配第二个候选，数值转换只能产生一个 `double` prvalue；非 `const double&` 不能绑定该结果，因此第二个候选不可行。

若对象本身为 `const`，两个修改接口都不可行：

```cpp
const int stored_pressure_kpa{220};
const bool updated{try_update_pressure(stored_pressure_kpa, 225)}; // 错误
```

第一个候选的 `int&` 不能绑定 `const int` 对象；第二个候选的 `double&` 同样不能通过数值转换取得一个可修改的调用者对象。名称虽然能够找到两个候选，却没有任何可行函数，因此程序不合法。

只读引用具有不同的绑定边界：

```cpp
int read_pressure(const int& pressure_kpa) {
    return pressure_kpa;
}

int stored_pressure_kpa{220};
const int locked_pressure_kpa{225};

const int first{read_pressure(stored_pressure_kpa)};
const int second{read_pressure(locked_pressure_kpa)};
const int third{read_pressure(230)};
```

`const int&` 可以直接绑定普通 `int` 对象和 `const int` 对象。表达式 `230` 是 `int` prvalue；当它绑定 `const int&` 形参时会物化临时对象。因此，三次调用都具有可行的目标。

**候选函数是名称查找得到、需要接受检查的函数；可行函数是实参数量、类型转换和引用绑定都能满足调用要求的候选。**没有可行函数与存在多个可行函数是不同状态：前者已经无法调用，后者还需要继续确定是否存在唯一最佳目标。

## 参考资料

- [C++23 工作草案：重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match)
- [C++23 工作草案：候选函数与实参列表](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs)
- [C++23 工作草案：可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.viable)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
