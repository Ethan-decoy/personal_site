---
title: 转换函数与目标类型结果（Conversion Functions and Target-Type Results）
date: 2026-09-01
order: 3
---

# 转换函数与目标类型结果（Conversion Functions and Target-Type Results）

构造函数由目标类声明“怎样接收源值”，转换函数（conversion function）则由源类声明“怎样产生目标类型结果”。转换函数是类的成员函数，以调用对象作为转换来源：

```cpp
class pressure_kpa {
  public:
    explicit pressure_kpa(int value_kpa) : stored_value_kpa{value_kpa} {}

    explicit operator int() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};
```

`operator int()` 是转换函数的函数名，`operator` 后面的 `int` 同时说明转换目标。它不像普通函数那样在函数名前另写返回类型。转换函数以调用对象作为源，不接收普通函数实参。

尾随 `const` 不是转换函数名称的一部分。当前实现只读取调用对象，所以把它声明为 `const` 成员函数，允许 `const pressure_kpa` 对象使用这项转换。

## 显式转换函数产生目标类型结果

当前 `operator int()` 声明为 `explicit`。直接列表初始化目标对象或使用 `static_cast` 时，可以选择它：

```cpp
const pressure_kpa measured_pressure{220};

const int direct_value_kpa{measured_pressure};
const int cast_value_kpa{static_cast<int>(measured_pressure)};
```

两条声明都会调用 `pressure_kpa::operator int() const`，产生一个值为 `220` 的 `int` 结果。普通复制初始化不会采用这项显式转换函数：

```cpp
const int copied_value_kpa = measured_pressure; // 错误
```

若删除 `operator int()` 前的 `explicit`，它就能在普通复制初始化、函数实参转换以及其他允许相应隐式转换的语境中提供从 `pressure_kpa` 到 `int` 的路径。具体表达式是否最终采用它，仍取决于当时形成的候选与重载决议。

## explicit operator bool：允许条件判断，不提供普通隐式转换

`bool` 有一个常见而重要的特殊语境。下面的类同时声明了两个方向相反的接口：

```cpp
class pressure_reading {
  public:
    explicit pressure_reading(bool is_available) : available{is_available} {}

    explicit operator bool() const {
        return available;
    }

  private:
    bool available;
};
```

构造函数 `explicit pressure_reading(bool)` 控制从 `bool` 到 `pressure_reading` 的构造；转换函数 `explicit operator bool() const` 控制从 `pressure_reading` 到 `bool` 的转换。条件判断使用的是后一个方向。

当前转换函数仍然遵守 `explicit` 的初始化边界：直接初始化可以采用它，普通复制初始化则不可以：

```cpp
const pressure_reading reading{true};

const bool direct_availability(reading); // 正确：直接初始化
const bool copied_availability = reading; // 错误：复制初始化
```

普通隐式转换是否成立，可以借助下面的假想声明理解：

```cpp
bool temporary = reading;
```

这个声明采用复制初始化，不能使用 `explicit operator bool()`，所以 `copied_availability` 不合法。这里的 `=` 仍然属于初始化语法，不是先构造对象再向它赋值。

但是，`if` 条件需要的是按语境转换为 `bool`（contextual conversion to `bool`）。语言使用另一种判断模型：这项转换成立，当且仅当下面形式的假想声明成立：

```cpp
bool temporary(reading);
```

这次采用的是直接初始化形式，会考虑 `explicit operator bool()`，所以对象可以直接用于条件判断。条件语境与普通函数实参的边界并不相同：

```cpp
void record_availability(bool is_available);

void inspect(const pressure_reading& reading) {
    if (reading) { // 正确：按语境转换为 bool
        // 处理当前可用的读数
    }

    record_availability(reading); // 错误：普通的实参转换
    record_availability(static_cast<bool>(reading)); // 正确：显式转换
}
```

**`explicit operator bool()` 可用于直接初始化、显式转换和按语境转换为 `bool`，但不能用于普通复制初始化或普通函数实参转换。** 这条较窄的接口边界允许对象自然地参与条件判断，而不会让它在其他语境中悄悄变成 `bool`。

## const 限定约束源对象

当前两个转换函数都是 `const` 成员函数，并且只读取对象的普通数据成员。它们可以通过 `const` 源对象调用，当前实现也不会修改源对象的状态。

转换函数不必带有 `const` 限定。非 `const` 转换函数不能通过 `const` 对象调用，并且可以在产生目标类型结果时修改调用对象。转换是否具有副作用，仍然取决于成员函数限定和具体实现。

**转换函数由源类规定怎样产生目标类型结果；`explicit` 决定这条路径可以在哪些初始化语境中采用，成员函数的 `const` 限定则约束它怎样访问源对象。**

## 参考资料

- [C++23 工作草案：转换函数](https://timsong-cpp.github.io/cppwp/n4950/class.conv.fct)
- [C++23 工作草案：explicit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.spec)
- [C++23 工作草案：按语境转换为 bool](https://timsong-cpp.github.io/cppwp/n4950/conv)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
