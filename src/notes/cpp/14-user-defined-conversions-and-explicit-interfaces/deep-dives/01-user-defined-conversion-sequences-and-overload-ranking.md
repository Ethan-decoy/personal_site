---
title: 用户定义转换序列与重载排序（User-Defined Conversion Sequences and Overload Ranking）
date: 2026-09-01
order: 1
---

# 用户定义转换序列与重载排序（User-Defined Conversion Sequences and Overload Ranking）

从一个整数构造类对象，或者从类对象取得数值，可能既需要用户定义转换，也需要整数提升等标准转换。重载决议用用户定义转换序列（user-defined conversion sequence）描述这样的隐式转换路径，并限制哪些步骤可以连在一起。

标准转换序列优于用户定义转换序列；当两项候选都需要用户定义转换时，还要检查路径内部是否满足继续比较的条件。花括号实参另有列表初始化规则，不能只数整行代码调用了多少个构造函数。

三段图与逐步例子用于追踪每次正在初始化谁、转换发生在哪一段。需要理解这些关系与推理，具体类型名、数值和代码全文无需背诵；更复杂的列表形式与排序细则在使用时按文末条款核对。

## 一条序列固定分成三段

> [!IMPORTANT] 用户定义转换序列的三段结构
> **由单个源表达式形成的一条用户定义转换序列，中间只有一项用户定义转换；前后可以各有一段标准转换。**前后两段不能容纳第二项用户定义转换。
>
> ```text
> 初始标准转换序列
>         ↓
> 一次用户定义转换
>         ↓
> 第二标准转换序列
> ```

初始标准转换序列（initial standard conversion sequence）负责让源表达式匹配构造函数的第一个形参；对于转换函数，它负责让源对象满足这项成员函数对调用对象的要求。中间调用选中的构造函数或转换函数。第二标准转换序列（second standard conversion sequence）再把该调用的结果转换到整条序列的目标类型。

前后两段都可以是恒等转换（identity conversion），表示该段不需要实施转换。不能仅凭类型名称相同就断定这一点：例如，将一个 `int` 左值传给 `int` 按值形参，仍需进行左值到右值转换。

### 构造函数之前可以先有标准转换

`pressure_kpa` 表示按千帕解释的压力类型，`record_pressure` 接收这样的类对象。下面是独立的声明分析片段，类与函数均放在命名空间作用域。构造函数和接收函数只给出声明，用于语法、类型与重载检查，不作为完整程序链接运行：

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

表达式 `measured_value_kpa` 是 `const short` 左值（lvalue），构造函数的第一个形参却是 `int`。这条序列为：

```text
const short lvalue
    │ 左值到右值转换
    ▼
short prvalue
    │ short 到 int 的整数提升
    ▼
int prvalue
    │ pressure_kpa(int)
    ▼
pressure_kpa prvalue
    │ 恒等转换
    ▼
目标形参类型 pressure_kpa
```

左值到右值转换从 `const short` 对象读取一个 `short` 纯右值（prvalue），再通过整数提升得到 `int` 值。这两步属于初始标准转换序列；调用 `pressure_kpa(int)` 是中间唯一的用户定义转换；构造结果已经具有目标类型，第二标准转换序列是恒等转换。

### 转换函数之后可以继续有标准转换

现在从类对象中取出一个 `short`，再把它交给接收 `int` 的函数。下面另作一组完整程序：`short_value` 只保存一个 `short` 数值，`print_value` 输出接收到的整数，行首标签表明形参类型。

源类通过[转换函数](../03-conversion-functions-and-target-type-results.md#转换函数的声明形式)提供取值路径：`operator short()` 声明产生 `short` 结果的成员函数，前面不另写返回类型。

空的 `()` 表示没有普通形参，转换来源是调用对象；尾随 `const` 允许通过 `const` 对象调用。

```cpp
#include <iostream>

struct short_value {
    short value;

    operator short() const {
        return value;
    }
};

void print_value(const int value) {
    std::cout << "int: " << value << '\n';
}

int main() {
    const short_value source{7};
    print_value(source);
}
```

转换函数没有声明为 `explicit`，可以参与本次实参的隐式转换。求值 `print_value(source)` 时，以 `source` 为调用对象执行转换函数，读取成员得到 `short` 值 `7`；再通过整数提升得到 `int` 值 `7`，用于初始化 `print_value` 的形参。程序输出 `int: 7`。

`source` 对转换函数调用对象要求的匹配是恒等转换，属于初始标准转换序列。转换函数调用位于中间，随后 `short` 到 `int` 的整数提升属于第二标准转换序列：

```text
const short_value lvalue
    │ operator short() const
    ▼
short prvalue，值为 7
    │ 整数提升
    ▼
int prvalue，值为 7
```

前后两组例子中的标准转换位置不同，中间都只采用一项用户定义转换。若某条路径还需要第二项用户定义转换，就不能直接按同一条序列接下去。

## 同一条序列不能串联两项用户定义转换

下面另作独立的声明分析片段。`inner_value` 可以由整数构造，`outer_value` 提供接收 `inner_value` 的构造接口，`accept` 接收最终的 `outer_value` 对象。类与函数均放在命名空间作用域，只做语法与类型检查：

```cpp
class inner_value {
  public:
    inner_value(int value);
};

class outer_value {
  public:
    outer_value(inner_value value);
};

void accept(outer_value value);

void inspect_conversion() {
    accept(7); // 错误：同一条序列需要两项用户定义转换
}
```

从 `int` 到 `inner_value` 需要调用 `inner_value(int)`，再到 `outer_value` 又需要调用 `outer_value(inner_value)`。初始标准转换序列不能包含第一项构造调用，因此从表达式 `7` 到最终形参类型无法形成合法的用户定义转换序列。

保留类与 `accept` 的声明，用下面的合法版本替换整个 `inspect_conversion` 定义。调用者把两项构造写成两次直接列表初始化：

```cpp
void inspect_conversion() {
    accept(outer_value{inner_value{7}});
}
```

内层由整数建立 `inner_value`，外层由这个对象建立 `outer_value`；函数调用接收到的实参表达式已经具有 `outer_value` 类型。

> [!WARNING] 一行代码可以包含多次构造
> **一条用户定义转换序列中的“一次”限制，不能改读成一行代码只能调用一个构造函数。**代码中分别写出的内外两次构造，各自接受初始化规则检查；整行代码可以合法地包含多次构造。

## 排序只在规则允许的边界内继续

重载决议先比较隐式转换序列的基本形式：标准转换序列优于用户定义转换序列。两条候选路径都属于用户定义转换序列时，还要判断它们能否在内部继续比较。

### 同一项用户定义转换之后可以比较后段

> [!IMPORTANT] 共享同一项用户定义转换时比较后段
> **比较同一个实参到不同候选形参的路径时，若两条用户定义转换序列采用同一个构造函数或转换函数，更好的第二标准转换序列可以使整条序列更好。**比较的是允许比较的后段，整条路径仍属于用户定义转换序列。

回到[转换函数之后可以继续有标准转换](#转换函数之后可以继续有标准转换)中的完整程序。保留 `short_value`、`print_value(int)` 与 `main`，在 `main` 之前加入以下浮点重载，其他定义不变：

```cpp
void print_value(const float value) {
    std::cout << "float: " << value << '\n';
}
```

仍然检查 `print_value(source)`。两项候选各自需要的路径如下：

```text
到 int：   source → operator short() const → short → int
到 float： source → operator short() const → short → float
```

这些路径用于编译期比较，运行时不会先调用两遍转换函数来试选重载。`short` 到 `int` 是整数提升，具有 Promotion 等级；`short` 到 `float` 是整数到浮点数的转换，具有 Conversion 等级，不能算作浮点提升。

两条序列采用同一个 `operator short() const`，因此可以比较后段。整数提升更好，最终选择 `print_value(int)`，程序仍输出 `int: 7`。

### 不同用户定义转换不能沿用后段比较

上面的继续比较有一个前提：两条序列共享同一项构造函数或转换函数。若两条序列采用不同的用户定义转换，这项后段比较规则就不能套用；初始标准转换序列也不是另一项普遍的计分依据。

对于由不同构造函数或转换函数形成的两条路径，不能只凭其中一条的前段或后段“更直接”就判定它更好。若没有其他适用规则区分两项候选，调用就是歧义；主线中[不同的用户定义转换可能彼此无法排序](../04-user-defined-conversions-and-overload-resolution.md#不同的用户定义转换可能彼此无法排序)展示了这种情形。

## 花括号初始化建立另一层转换关系

花括号初始化列表（braced-init-list）本身不是表达式。以它作为函数实参时，语言按照列表初始化序列（list-initialization sequence）的专门规则判断它能否初始化形参，不能把整个列表机械代入前面的单表达式三段结构。

这里沿用[同一条序列不能串联两项用户定义转换](#同一条序列不能串联两项用户定义转换)中的 `inner_value`、`outer_value` 与 `accept` 声明，两项构造函数仍都没有声明为 `explicit`。以以下合法片段替换 `inspect_conversion` 的定义，作为另一种独立变体：

```cpp
void inspect_conversion() {
    accept({7}); // 合法：由列表初始化规则分别检查内外关系
}
```

与先前失败的 `accept(7)` 相比，改变的只是实参加上了花括号。现在需要分别检查两项初始化关系：

| 正在检查的关系 | 待建立的对象 | 所用构造接口 |
| --- | --- | --- |
| 外层 `{7}` 初始化函数形参 | `outer_value` | 列表初始化选择 `outer_value(inner_value)` |
| 列表元素 `7` 初始化该构造函数的形参 | `inner_value` | 由 `inner_value(int)` 完成一次用户定义转换 |

选择外层构造函数时，还要检查它的形参能否由列表元素初始化；这里内层只需一次用户定义转换，所以可行。实际构造时，先得到 `inner_value`，再把它交给 `outer_value` 的构造函数。

两次构造分别属于上述两项初始化关系。`accept(7)` 只有一个源表达式到最终形参的转换问题，不能在同一条序列里串联它们；`accept({7})` 则由专门的列表规则建立外层关系，再检查内层实参。一条由单个源表达式形成的用户定义转换序列仍只包含一次用户定义转换。

### 复制列表初始化在选中构造函数后检查 explicit

直接列表初始化与复制列表初始化都会让相应的 `explicit` 构造函数参与这项构造函数选择，但复制列表初始化还有一次选中后的合法性检查：

下面另作一组独立的声明分析片段。`number` 提供接收 `int` 与 `long` 的两项构造接口，类与函数均放在命名空间作用域，只做语法与类型检查：

```cpp
class number {
  public:
    explicit number(int value);
    number(long value);
};

void inspect_initialization() {
    const number value{7}; // 合法：选中 explicit 构造函数
}
```

保留类声明与函数外壳，将函数体中的对象定义替换为下面的错误声明，单独检查：

```cpp
const number value = {7}; // 错误：选中后因 explicit 被拒绝
```

对整数字面量 `7`，`number(int)` 是精确匹配，比需要整数转换的 `number(long)` 更好。两种写法都会选中前者；直接列表初始化可以调用它，复制列表初始化则在选中后判定程序不合法。

> [!WARNING] 复制列表初始化不会回退到较差的构造函数
> **复制列表初始化若选中了 `explicit` 构造函数，初始化就不合法。**语言不会移除该构造函数，再回退到较差的非显式构造函数。把规则理解成“先排除所有 `explicit`，再选最佳目标”，会错误地把这里的复制列表初始化判断为合法。

> [!TIP] 先划分初始化关系，再检查可行性与排序
> 先辨认实参是表达式还是花括号初始化列表，并写清每次正在初始化哪个对象或形参。对于表达式，记录其类型、`const` 限定与值类别，再确定每条路径采用哪项转换接口。
>
> 随后检查路径是否可行；对可行路径区分序列形式，再核对是否满足相应的内部排序条件。得到唯一最佳目标后，继续检查复制列表初始化等语境的最终合法性，不能把“最佳候选已选出”直接等同于“初始化合法”。
>
> 遇到更复杂的列表形式或同级比较，在据此判断前核对文末的“列表初始化序列”“列表初始化中的重载决议”与“隐式转换序列的排序”。

## 参考资料

- [C++23 工作草案：隐式转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics)
- [C++23 工作草案：用户定义转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.user)
- [C++23 工作草案：转换函数](https://timsong-cpp.github.io/cppwp/n4950/class.conv.fct)
- [C++23 工作草案：隐式转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++23 工作草案：列表初始化序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.list)
- [C++23 工作草案：列表初始化中的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
