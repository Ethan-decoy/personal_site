---
title: 转换函数与目标类型结果（Conversion Functions and Target-Type Results）
date: 2026-09-01
order: 3
---

# 转换函数与目标类型结果（Conversion Functions and Target-Type Results）

构造函数由目标类声明“怎样接收源值”，转换函数（conversion function）则由源类声明“怎样产生目标类型结果”。

## 转换函数的声明形式

转换函数是以调用对象作为转换来源的类成员函数。C++ 用 `operator` 关键字后接目标类型，组成这类函数的名称。以转换到 `int` 为例，下面的声明放在源类的 `public` 部分：

```cpp
explicit operator int() const;
```

| 声明中的部分 | 含义 |
| --- | --- |
| `operator int` | 转换函数的名称，表示由当前类对象产生 `int` 类型的结果 |
| `()` | 没有普通形参，转换来源由调用对象提供 |
| 尾随 `const` | 沿用 `const` 成员函数的访问约束，允许通过 `const` 源对象调用 |
| `explicit` | 限制这项转换被采用的语境；本例可用于直接初始化或 `static_cast`，不能用于普通复制初始化 |

**目标类型已经写在 `operator int` 中，因此函数名前不再另写返回类型；函数体用 `return` 提供相应类型的结果。**`()` 是参数列表，尾随 `const` 是成员函数限定，它们都不属于函数名。

下面的类把这项声明写成定义，由函数体说明怎样取得结果：

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

`return stored_value_kpa;` 从调用对象读取整数值，作为转换结果。这个实现只读取源对象，适合声明为 `const` 成员函数；转换后，源对象仍然是原来的 `pressure_kpa` 对象。

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

`if` 条件使用按语境转换为 `bool`（contextual conversion to `bool`），会考虑这项 `explicit operator bool()`。普通函数的 `bool` 形参不使用这条特殊规则，不能自动采用它。

保留上面的类定义，把下面的声明和函数定义放在类定义之后。`inspect` 中的 `reading` 借用调用者的对象；三种使用方式都针对它：

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

> [!TIP]
> `explicit operator bool()` 可用于直接初始化、显式转换和按语境转换为 `bool`，但不能用于普通复制初始化或普通函数实参转换。这条较窄的接口边界允许对象自然地参与条件判断，而不会让它在其他语境中悄悄变成 `bool`。

这项区别可以进一步用初始化模型解释。下面的片段放在函数体内，对同一个对象分别作两种初始化：

```cpp
const pressure_reading reading{true};

const bool direct_availability(reading);  // 正确：直接初始化
const bool copied_availability = reading; // 错误：复制初始化
```

`direct_availability(reading)` 出现在变量声明中：圆括号提供初始值，没有发起函数调用。它使用直接初始化，可以采用显式转换函数；前面用花括号直接列表初始化 `int` 的例子也能采用相应的显式转换函数。`copied_availability = reading` 则采用复制初始化，不能使用 `explicit operator bool()`；这里的 `=` 仍然属于初始化语法，不是向已有对象赋值。

普通隐式转换是否成立，可以借助下面形式的假想声明判断：

```cpp
bool temporary = reading;
```

这个模型使用复制初始化，不会考虑显式转换函数。`if` 所用的按语境转换为 `bool` 则以另一种假想声明为判断依据：

```cpp
bool temporary(reading);
```

后一个模型使用直接初始化，会考虑 `explicit operator bool()`。因此，`if (reading)` 可以采用它，普通的 `record_availability(reading)` 仍然不成立；调用者可以用 `static_cast<bool>(reading)` 明确取得布尔结果再传入。

## const 限定约束源对象

当前两个转换函数都是 `const` 成员函数，并且只读取对象的普通数据成员。它们可以通过 `const` 源对象调用，当前实现也不会修改源对象的状态。

转换函数不必带有 `const` 限定。非 `const` 转换函数不能通过 `const` 对象调用，并且可以在产生目标类型结果时修改调用对象。转换是否具有副作用，仍然取决于成员函数限定和具体实现。

**转换函数由源类规定怎样产生目标类型结果；`explicit` 决定这条路径可以在哪些初始化语境中采用，成员函数的 `const` 限定则约束它怎样访问源对象。**

## 参考资料

- [C++23 工作草案：转换函数](https://timsong-cpp.github.io/cppwp/n4950/class.conv.fct)
- [C++23 工作草案：explicit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.spec)
- [C++23 工作草案：按语境转换为 bool](https://timsong-cpp.github.io/cppwp/n4950/conv)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
