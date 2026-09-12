---
title: 用户定义转换序列与重载排序（User-Defined Conversion Sequences and Overload Ranking）
date: 2026-09-01
order: 1
---

# 用户定义转换序列与重载排序（User-Defined Conversion Sequences and Overload Ranking）

一项用户定义转换可以使候选函数变得可行，也可能让多个候选同时获得可行的初始化路径。重载决议需要确定这些路径由哪些步骤组成、最多能包含几项用户定义转换，以及两条路径何时可以继续比较。花括号初始化列表则通过专门的列表初始化规则建立转换关系。

对单个源表达式而言，答案不是一串可任意延长的转换步骤，而是一条结构受限的用户定义转换序列（user-defined conversion sequence）。

## 一条序列固定分成三段

用户定义转换序列由三段依次组成：

```text
初始标准转换序列
        ↓
一次用户定义转换
        ↓
第二标准转换序列
```

初始标准转换序列（initial standard conversion sequence）负责让源表达式匹配构造函数的第一个形参；对于转换函数，它负责让源对象满足这项成员函数对调用对象的要求。中间调用选中的构造函数或转换函数。第二标准转换序列（second standard conversion sequence）再把该调用的结果转换到整条序列的目标类型。

前后两段都可以是恒等转换（identity conversion），也就是类型不需要改变；中间只有一项用户定义转换。下面两条路径分别让前段和后段承担实际转换，以区分三段的职责。

### 构造函数之前可以先有标准转换

```cpp
class pressure_kpa {
  public:
    pressure_kpa(int value_kpa);
};

void record_pressure(pressure_kpa pressure);

void record_measured_pressure() {
    const short measured_value_kpa{220};
    record_pressure(measured_value_kpa);
}
```

`measured_value_kpa` 是 `short` lvalue，构造函数的第一个形参却是 `int`。这条序列为：

```text
short lvalue
    │ 左值到右值转换、short 到 int 的整数提升
    ▼
int
    │ pressure_kpa(int)
    ▼
pressure_kpa
    │ 恒等转换
    ▼
目标形参类型 pressure_kpa
```

左值到右值转换与整数提升属于初始标准转换序列；调用 `pressure_kpa(int)` 是中间唯一的用户定义转换；构造结果已经具有目标类型，因此第二标准转换序列是恒等转换。

### 转换函数之后可以继续有标准转换

```cpp
class pressure_code {
  public:
    operator short() const {
        return short{2};
    }
};

int classify_pressure(int code) {
    return code;
}

const pressure_code code{};
const int category{classify_pressure(code)};
```

这里，调用对象对 `operator short() const` 的匹配不需要改变类型；转换函数产生 `short` 结果后，第二标准转换序列再执行 `short` 到 `int` 的整数提升：

```text
pressure_code
    │ operator short() const
    ▼
short
    │ 整数提升
    ▼
int
```

标准转换可以出现在用户定义转换的两侧，不等于中间可以继续加入另一项构造函数或转换函数。

## 同一条序列不能串联两项用户定义转换

```cpp
class intermediate_pressure {
  public:
    intermediate_pressure(int value_kpa);
};

class pressure_kpa {
  public:
    pressure_kpa(intermediate_pressure pressure);
};

void record_pressure(pressure_kpa pressure);

void record_integer_pressure() {
    record_pressure(220); // 错误：一条序列需要调用两项构造函数
}
```

从 `int` 到 `intermediate_pressure` 需要调用 `intermediate_pressure(int)`，再到 `pressure_kpa` 又需要调用 `pressure_kpa(intermediate_pressure)`。初始标准转换序列不能包含第一项构造调用，因此从表达式 `220` 到形参类型无法形成合法的用户定义转换序列。

调用者可以把两项构造写成两次直接列表初始化：

```cpp
void record_integer_pressure_explicitly() {
    record_pressure(pressure_kpa{intermediate_pressure{220}});
}
```

内外两次初始化各自建立转换关系；函数调用接收到的已经是 `pressure_kpa`。限制针对一条转换序列，不是统计整条源代码出现了多少次构造。

## 排序只在规则允许的边界内继续

重载决议先比较隐式转换序列的基本形式：标准转换序列优于用户定义转换序列。两条候选路径都属于用户定义转换序列时，还要判断它们能否在内部继续比较。

### 同一项用户定义转换之后可以比较后段

两条序列包含同一个转换函数或构造函数时，更好的第二标准转换序列可以决定结果：

```cpp
class pressure_code {
  public:
    operator short() const;
};

int classify_pressure(int code);
int classify_pressure(float code);

const pressure_code code{};
const int category{classify_pressure(code)};
```

两项候选都先调用 `operator short()`：

```text
pressure_code → short → int
pressure_code → short → float
```

`short` 到 `int` 是整数提升；`short` 到 `float` 不是浮点提升，只能得到 Conversion 等级。两条序列共享同一项用户定义转换，因此前一条序列的第二标准转换更好，调用选择 `classify_pressure(int)`。

### 不同用户定义转换不能沿用后段比较

上面的继续比较有一个前提：两条序列共享同一项构造函数或转换函数。若两条序列调用不同的用户定义转换，这项前提就不成立，第二标准转换序列的比较规则不能套用；初始标准转换序列也不是另一项普遍的计分依据。对于由不同构造函数或转换函数形成的两条路径，即使其中一条的前段或后段看起来更直接，也不能据此判定它更好；若没有其他排序规则区分候选，调用就是歧义。

## 花括号初始化建立另一层转换关系

花括号初始化列表（braced-init-list）本身不是表达式。以它作为函数实参时，语言按照列表初始化序列（list-initialization sequence）的专门规则判断它能否初始化形参，不能把整个列表机械代入前面的单表达式三段结构。

前面定义的类型因而产生一组结果不同的调用：

```cpp
void compare_initialization_forms() {
    record_pressure(220);   // 错误：一条序列需要两项用户定义转换
    record_pressure({220}); // 合法
}
```

第二条调用先按照列表初始化规则为 `pressure_kpa` 选择 `pressure_kpa(intermediate_pressure)`。检查这项构造函数是否可行时，列表元素 `220` 可以通过 `intermediate_pressure(int)` 初始化对应形参。外层列表到 `pressure_kpa` 与内层元素到构造函数形参是两项不同的初始化关系，没有把两项构造塞进同一条由源表达式形成的用户定义转换序列。

### 复制列表初始化在选中构造函数后检查 explicit

直接列表初始化与复制列表初始化都会让相应的 `explicit` 构造函数参与这项构造函数选择，但复制列表初始化还有一次选中后的合法性检查：

```cpp
class pressure_kpa {
  public:
    explicit pressure_kpa(int value_kpa);
    pressure_kpa(long value_kpa);
};

const pressure_kpa direct_pressure{230};    // 合法：选中 explicit 构造函数
const pressure_kpa copied_pressure = {230}; // 错误：选中后因 explicit 被拒绝
```

对整数字面量 `230`，`pressure_kpa(int)` 是精确匹配，比需要整数转换的 `pressure_kpa(long)` 更好。两条声明的构造函数选择都会得到前者；直接列表初始化可以调用它，复制列表初始化则在选中后判定程序不合法。

语言不会移除已经选中的 `explicit` 构造函数，再以较差的 `pressure_kpa(long)` 重新执行重载决议。因此，这项规则不能简化成“复制列表初始化从候选集合中预先排除所有 `explicit` 构造函数”。

**由单个源表达式形成的用户定义转换序列固定包含前段标准转换、一项用户定义转换和后段标准转换；排序只比较标准规定可以比较的部分。花括号初始化另有列表规则，复制列表初始化对选中的 `explicit` 构造函数还会执行最终合法性检查。**

## 参考资料

- [C++23 工作草案：隐式转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics)
- [C++23 工作草案：用户定义转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.user)
- [C++23 工作草案：隐式转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++23 工作草案：列表初始化序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.list)
- [C++23 工作草案：列表初始化中的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
