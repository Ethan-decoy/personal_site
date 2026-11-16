---
title: 重载接口的设计边界（Design Boundaries of Overloaded Interfaces）
date: 2026-08-29
order: 5
---

# 重载接口的设计边界（Design Boundaries of Overloaded Interfaces）

设计重载接口时，需要同时确定两件事：调用会选中哪个函数，以及选中的函数是否完成调用者所需的操作。前者依据语言规则判断，后者取决于接口的含义与约束。

> [!IMPORTANT] 匹配规则与接口含义承担不同职责
> **唯一最佳函数只证明重载选择有确定目标。**编译器根据声明、实参的类型、值类别与允许的转换进行匹配，不会根据变量名称判断一个数值原本代表哪种单位。
>
> 选中的函数仍须满足访问控制等其余语言规则；单位、范围和操作含义是否符合需求，也需要由接口约定与调用代码共同保证。

以下完整程序彼此独立。只展示接口声明的片段放在文件作用域，用于比较签名与含义，不提供运行实现；其他片段按标明的位置替换使用。

## 同一个名称应当表达同一项操作

判断数值是否非负，可以接受整数，也可以接受浮点数。下面的两个重载保持相同的判断含义：

```cpp
#include <iostream>

bool is_nonnegative(const int value) {
    return value >= 0;
}

bool is_nonnegative(const double value) {
    return value >= 0.0;
}

int main() {
    std::cout << is_nonnegative(3) << ' ' << is_nonnegative(3.0) << '\n';
    std::cout << is_nonnegative(-1) << ' ' << is_nonnegative(-1.0) << '\n';
}
```

程序依次输出 `1 1` 和 `0 0`：两种表示的 `3` 都满足判断，两种表示的 `-1` 都不满足。输入的数值表示不同，函数名称所承诺的操作保持一致。

若类型差异被用来区分不相关的操作，调用位置就难以看清含义。下面只比较两组独立的接口声明：

```cpp
void update(int retry_count); // 设置重试次数
void update(double length_m); // 设置以米计的线段长度
```

`update(3)` 与 `update(3.0)` 都能选出唯一函数，却分别设置重试次数和线段长度。把字面量从整数改成浮点数，连执行的操作都变了。更明确的接口是：

```cpp
void set_retry_count(int retry_count);
void set_length_m(double length_m);
```

> [!PRACTICE] 重载统一同一项操作的不同输入形式
> 当不同实参形式表达同一项操作时，可以用重载统一名称，让调用者围绕操作理解接口。若各项函数实际承担不同任务，应让名称直接表达任务差异，避免由数值类型偶然决定业务含义。
>
> 同一项操作可以接受不同数值表示，不要求这些类型必须对应不同的业务概念。是否提供多项入口，还要看调用者的实际输入与必要的转换边界。

## 参数名称不能区分不同单位的重载

参数名称可以向读者说明单位，但不能仅靠它形成不同重载。以下两行都是同一个 `set_length(double)` 的声明：

```cpp
void set_length(double length_m);
void set_length(double length_cm);
```

> [!IMPORTANT] 参数名称记录约定，参数类型参与匹配
> **普通函数的参数名称不参与区分重载。**同一函数在不同声明中的形参可以使用不同名称；编译器不会根据实参或形参名称中出现的单位选择另一项函数。
>
> `length_m` 与 `length_cm` 能帮助人理解约定，却没有把两个 `double` 入口变成不同函数。

把单位寄托在 `float`、`double` 的差异上，虽然能形成重载，却容易让相近写法表达不同长度。下面是语言上合法的反例：两项函数都返回以米计的数值，却分别把输入解释为米和厘米。换算关系为 **1 米 = 100 厘米**。

```cpp
#include <iostream>

double to_meters(const float length_m) {
    return length_m;
}

double to_meters(const double length_cm) {
    return length_cm / 100.0;
}

int main() {
    std::cout << to_meters(2.0F) << ' ' << to_meters(2.0) << '\n';
}
```

程序输出 `2 0.02`。`2.0F` 选中 `float` 入口，被解释为 2 米；`2.0` 选中 `double` 入口，被解释为 2 厘米，转换后只有 0.02 米。

> [!WARNING] 数值类型变化可能悄悄改变单位
> 在这组错误的接口约定中，若原意一直是 2 米，仅去掉 `F` 就会改选厘米入口。调用仍可编译，得到的长度却变了。浮点字面量的后缀说明数值类型，不能据此判断调用者原本使用什么单位。

一种做法是把单位写进函数名称。以下是另一组独立的设置长度接口：

```cpp
void set_length_m(double length_m);
void set_length_cm(double length_cm);
```

另一种做法是声明不同的单位类型，使单位标注成为实参类型的一部分。下面两个包装类型都保存 `double`，差别只在明确表达的单位：

```cpp
#include <iostream>

struct length_m {
    double value;
};

struct length_cm {
    double value;
};

double to_meters(const length_m length) {
    return length.value;
}

double to_meters(const length_cm length) {
    return length.value / 100.0;
}

int main() {
    const double first{to_meters(length_m{2.0})};
    const double second{to_meters(length_cm{200.0})};

    std::cout << first << ' ' << second << '\n';
}
```

程序输出 `2 2`，两项结果都以米为单位：2 米与 200 厘米被转换为同一种表示。两个函数执行同一项单位归一操作，选择依据是明确的单位类型。

> [!IMPORTANT] 独立类型让单位标注参与匹配
> `length_m` 与 `length_cm` 是不同类型，即使内部都保存 `double`，对应的两个形参仍能形成重载。本例的 `to_meters(2.0)` 无法把裸 `double` 隐式转换为任一形参类型，因此没有可行函数；调用者必须明确提供相应的包装值。
>
> 类型能够检查采用了哪种标注，不能核实测量值原本的单位。把厘米数错误地包装成 `length_m`，仍然是调用者需要避免的含义错误。

函数名包含单位，声明与调用较直接，但调用者仍需按约定提供数值。独立单位类型增加了声明与包装代码，也让单位进入类型匹配；同一长度需要经过多个接口传递时，这项区别更容易被保留下来。应根据接口规模与误用后果选择，而不是用不同数值类型代替单位设计。

## 相近数值类型会扩大选择边界

相近算术类型之间存在隐式转换，调用者持有的类型不一定与某项形参完全相同。下面只根据声明分析匹配：声明放在文件作用域，变量与调用片段放在 `main` 中，函数约定输出给定整数，此处不提供运行实现。

```cpp
void print_value(int value);
void print_value(long value);

const short value{8};
print_value(value);
```

这里选择 `print_value(int)`，因为 `short` 到 `int` 属于整数提升，优于到 `long` 的 Conversion 等级整数转换。数值 `8` 能被两种类型表示，不会因此让两条转换同样好；语言选择也不能替接口设计者回答为什么需要同时提供这两个数值入口。

> [!PRACTICE] 根据实际输入决定数值入口
> 调用者自然持有多种表示、接口也确实需要保留相应范围或处理方式时，可以提供语义一致的数值重载。还应核对常见的其他实参类型会怎样匹配。
>
> 若内部最终只需要一种表示，一个明确的参数类型通常更容易理解，也减少了调用者追踪多项转换关系的负担。提供更多重载本身不保证接口更易用。

## 显式转换只能表达本次选择

下面是一份独立的错误程序。两项声明分别表示按整数或浮点表示输出数值；仅根据声明就能诊断调用歧义，因此不需要函数体：

```cpp
void print_value(long value);
void print_value(double value);

int main() {
    const int value{8};

    print_value(value); // 错误：调用存在歧义
}
```

`int` 到 `long`、`int` 到 `double` 在这里都属于 Conversion，两条序列没有能分出优劣的其他关系，因此不存在唯一最佳函数。

若调用需求已经明确为按整数表示输出 `8`，可以在调用处显式产生 `long` 实参。下面的独立完整程序为两个入口提供函数体，并在输出中加上参数类型，便于辨认调用目标：

```cpp
#include <iostream>

void print_value(const long value) {
    std::cout << "long: " << value << '\n';
}

void print_value(const double value) {
    std::cout << "double: " << value << '\n';
}

int main() {
    const int value{8};

    print_value(static_cast<long>(value));
}
```

`static_cast<long>(value)` 产生 `long` 结果，使整数入口获得 Exact Match，程序输出 `long: 8`。这里转换保留了原值，且符合当前的整数输出需求。

若需求变为保留小数，只能选中某项函数还不够。保留这个完整程序的函数定义与头文件，把 `main` 的函数体替换为下面的片段，作为另一次独立运行：

```cpp
const double value{8.5};

print_value(value);
print_value(static_cast<long>(value));
```

两次调用分别输出 `double: 8.5` 和 `long: 8`。第二次先把 `8.5` 转换为 `long` 值 `8`，再选中整数入口；目标唯一，但已丢失需要保留的小数。

> [!WARNING] 显式选中函数不证明转换符合需求
> `static_cast` 使目标类型写得明确，数值仍按转换规则处理。本例的转换合法，却把 `8.5` 变成 `8`；需要保留小数时，这次调用仍不符合需求。
>
> 更一般的数值转换还须核对范围与精度条件，见[显式不等于合理](../06-constants-literals-and-type-conversions/06-explicit-type-conversions.md#显式不等于合理)。消除歧义不能代替这些判断，也不能替数值补回正确单位。

如果添加转换只是为了绕过难以预测的匹配，调用者本身并没有改变数值表示的需求，就应重新检查重载集合是否符合实际输入。

## 重载集也是可演进的接口

新增重载会改变调用位置能看到的候选集合。下面是一份独立的初始版本，目前只有 `long` 入口：

```cpp
#include <iostream>

void print_value(const long value) {
    std::cout << "long: " << value << '\n';
}

int main() {
    const int value{8};

    print_value(value);
}
```

调用通过 `int` 到 `long` 的转换完成，程序输出 `long: 8`。现在保留原有代码，在 `main` 之前加入下面的函数定义：

```cpp
void print_value(const double value) {
    std::cout << "double: " << value << '\n';
}
```

原来的 `print_value(value)` 没有改动，重新编译却会报告歧义：新增的 `double` 入口也可行，两条匹配都是无法进一步区分的 Conversion。增加一个函数，反而使已有调用不再合法。

再从只有 `long` 入口的初始版本出发，建立另一个独立变体，在 `main` 之前只加入下面的 `int` 版本：

```cpp
void print_value(const int value) {
    std::cout << "int: " << value << '\n';
}
```

这一次，原调用仍能编译，输出却变为 `int: 8`：新增入口获得 Exact Match，优于原来的 Conversion。操作仍是输出数值，选中的函数已经改变。

> [!IMPORTANT] 候选集合变化会影响已有调用
> **新增重载的声明对调用位置可见，并重新编译该调用时，要依据新的候选集合重新确定目标。**实参源码不变，也可能改选另一函数或变成歧义调用。
>
> 选择发生在编译期；对象中保存的运行时数值不会重新决定调用目标。

> [!PRACTICE] 修改重载集时复核已有调用
> 新增或调整入口时，保留已有调用的实际类型、限定和值类别，用改动前后的候选集合核对可行性、选中目标和必要转换。常见字面量与对象表达式都应纳入比较。
>
> 若目标改变，确认新函数是否仍满足原调用所依赖的含义与数据约束；若出现歧义，重新判断新增参数类型是否必要，或是否应采用不同名称、明确的单位类型。仅给调用加上转换，并不能证明原有语义得到保留。

## 参考资料

- [C++23 工作草案：重载选择与其余语言约束](https://timsong-cpp.github.io/cppwp/n4950/over.match.general#1)
- [C++23 工作草案：参数名称与函数声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct#19)
- [C++23 工作草案：转换序列的匹配等级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#4)
- [C++23 工作草案：浮点到整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint#1)
- [C++ Core Guidelines：重载保持相同的操作含义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-equivalent)
- [C++ Core Guidelines：接口应精确表达类型含义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#i4-make-interfaces-precisely-and-strongly-typed)
