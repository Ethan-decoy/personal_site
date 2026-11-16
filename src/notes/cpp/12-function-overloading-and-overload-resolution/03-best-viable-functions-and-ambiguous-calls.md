---
title: 最佳可行函数与重载歧义（Best Viable Functions and Ambiguous Calls）
date: 2026-08-29
order: 3
---

# 最佳可行函数与重载歧义（Best Viable Functions and Ambiguous Calls）

`short` 实参既能初始化 `int` 形参，也能初始化 `double` 形参，两项函数都可行。要确定一次调用执行哪项函数，还需要比较这些匹配的质量。

把每个实参用于初始化对应形参所需的转换关系，称为隐式转换序列（implicit conversion sequence）。本篇分析的普通函数只使用内建算术类型，涉及的序列都是标准转换序列（standard conversion sequence）。

各份完整程序彼此独立；片段按标明的位置替换使用。函数定义均放在文件最外层、`main` 之前，实际调用放在 `main` 的函数体中。

> [!IMPORTANT] 最佳可行函数必须优于其他所有可行函数
> **最佳可行函数（best viable function）必须按照语言规则优于每一个其他可行函数。**在已有可行函数的前提下，若不能确定唯一最佳目标，调用就具有重载歧义（overload ambiguity），程序不合法。
>
> 能够接受实参，只证明函数可行；要成为最终目标，还必须满足相应的优劣比较规则。声明顺序、开发者的业务偏好都不能代替这项比较。

## 标准转换序列的匹配等级

标准转换序列先按匹配等级比较。这里的等级由转换规则决定：

> [!IMPORTANT] 标准转换序列的三个匹配等级
> **精确匹配优于提升，提升优于转换：Exact Match > Promotion > Conversion。**
>
> | 匹配等级 | 当前算术类型范围内的典型情形 |
> | --- | --- |
> | 精确匹配（Exact Match） | `int` 实参匹配 `int` 形参 |
> | 提升（Promotion） | `short` 提升为 `int`，`float` 提升为 `double` |
> | 转换（Conversion） | `int` 转换为 `long`，`int` 转换为 `double` |
>
> 比较的是整条标准转换序列的等级。Exact Match 也可能包含读取对象当前值等语义步骤，不能把它理解为机器层面完全没有处理。

调试输出可以在数值前标明采用的参数类型。下面是独立的完整程序：

```cpp
#include <iostream>

void print_reading(const int reading) {
    std::cout << "int: " << reading << '\n';
}

void print_reading(const long reading) {
    std::cout << "long: " << reading << '\n';
}

void print_reading(const double reading) {
    std::cout << "double: " << reading << '\n';
}

int main() {
    const short reading{220};

    print_reading(220);
    print_reading(reading);
    print_reading(220.5F);
}
```

三次调用的实参表达式分别具有 `int`、`const short` 和 `float` 类型。对于 `reading`，按值初始化形参所需的序列包含读取 `short` 值的左值到右值转换，以及随后所需的数值转换。三项候选在这些调用中都可行，匹配等级如下：

| 实参表达式 | `int` 形参 | `long` 形参 | `double` 形参 | 选中版本 |
| --- | --- | --- | --- | --- |
| `220` | Exact Match | Conversion | Conversion | `print_reading(int)` |
| `reading` | Promotion | Conversion | Conversion | `print_reading(int)` |
| `220.5F` | Conversion | Conversion | Promotion | `print_reading(double)` |

程序依次输出 `int: 220`、`int: 220` 和 `double: 220.5`。前两次虽然选中同一个函数，却分别依靠精确匹配和整数提升；相同输出不表示转换序列相同。

转换序列怎样由读取、提升与其他转换组成，见附章[序列的组成决定整体等级](deep-dives/01-standard-conversion-sequences-and-overload-ranking.md#序列的组成决定整体等级)。

## 相同等级不保证存在更好选择

单独考察另一组候选：保留上一程序的 `long`、`double` 两个函数定义，删除 `int` 版本，并把 `main` 的函数体替换为下面的错误片段：

```cpp
print_reading(220); // 错误：调用存在歧义
```

此时已经没有 `int` 形参对应的精确匹配，剩余两项候选都需要数值转换：

| 候选函数 | 实参 `220` 所需的转换 | 匹配等级 |
| --- | --- | --- |
| `print_reading(long)` | `int` 转换为 `long` | Conversion |
| `print_reading(double)` | `int` 转换为 `double` | Conversion |

对于这两条数值转换，没有其他规则能确定哪项更好。两个候选都可行，却没有唯一最佳函数，因此编译器在调用处报告歧义。

> [!WARNING] 不能按类型大小或业务偏好打破平局
> “变成更大的类型”不等于 Promotion。`int` 到 `long` 属于 Conversion，即使某个平台上 `long` 的取值范围更大，也不能据此认为它比 `int` 到 `double` 的转换更好。
>
> 当前可行函数之间若没有规则能确定唯一最佳目标，调用就因歧义被拒绝；编译器不会按存储宽度、精度或业务需要任选一个函数。

等级只是第一层比较。同等级序列仍可能依据序列组成、限定关系或引用绑定分出优劣；相关情形见附章[同等级序列仍可能继续比较](deep-dives/01-standard-conversion-sequences-and-overload-ranking.md#同等级序列仍可能继续比较)。本例的两条数值转换没有这样的优劣关系。

## 多个实参必须整体比较

具有多个形参时，要为每个实参分别比较初始化对应形参所需的转换序列：

> [!IMPORTANT] 多个实参的匹配怎样决定优劣
> 对本篇这些按所示标准转换进行比较的普通函数，A 要据此优于 B，必须同时满足：
>
> - **A 对每个实参的匹配都不比 B 差；**
> - **A 至少对一个实参的匹配明确优于 B。**
>
> 某个实参匹配得更好，不能抵消另一个实参匹配得更差。比较对象是各实参对应的转换序列，不能先把它们合成一个总分。

下面的两个函数都输出一对数值，并在行首标出采用的参数类型组合。这是另一份独立的完整程序：

```cpp
#include <iostream>

void print_pair(const int first, const double second) {
    std::cout << "int, double: " << first << ' ' << second << '\n';
}

void print_pair(const double first, const int second) {
    std::cout << "double, int: " << first << ' ' << second << '\n';
}

int main() {
    print_pair(10, 2.5);
}
```

`print_pair(int, double)` 对两个实参都是精确匹配；`print_pair(double, int)` 则需要分别执行 `int` 到 `double` 和 `double` 到 `int` 的转换。第一项候选在两个位置都更好，因此成为唯一最佳函数，程序输出 `int, double: 10 2.5`。

保留这两个函数定义，把 `main` 的函数体替换为下面的错误片段。第一个实参的数值仍是 10，类型由 `int` 改成了 `double`：

```cpp
print_pair(10.0, 2.5); // 错误：调用存在歧义
```

| 候选函数 | 第一个实参 `10.0` | 第二个实参 `2.5` |
| --- | --- | --- |
| `print_pair(int, double)` | Conversion | Exact Match |
| `print_pair(double, int)` | Exact Match | Conversion |

第一项候选在第二个实参上更好，却在第一个实参上更差；第二项候选也有一项更差。两者都不能满足“每项都不比另一项差”，所以调用具有歧义。

### 更多精确匹配也不保证胜出

下面是另一份独立的错误程序。两项声明表示输出三个数值的不同参数组合；这里只凭声明就能判断调用具有歧义，不需要为错误调用补充函数体：

```cpp
void print_triple(int first, int second, double third);
void print_triple(double first, double second, int third);

int main() {
    print_triple(10, 20, 30); // 错误：调用存在歧义
}
```

三个实参都是 `int`，对应关系如下：

| 候选函数 | 第一个实参 | 第二个实参 | 第三个实参 |
| --- | --- | --- | --- |
| `print_triple(int, int, double)` | Exact Match | Exact Match | Conversion |
| `print_triple(double, double, int)` | Conversion | Conversion | Exact Match |

第一项候选虽然在两个位置上更好，却在第三个位置上更差，仍然不能胜过第二项候选；第二项也不能胜过第一项。因此，两个精确匹配对一个精确匹配，结果仍然是歧义。

> [!WARNING] 不能按精确匹配的数量投票
> 只要 A 在某个实参上的匹配比 B 更差，就不能通过“其他位置更好的次数更多”让 A 据此获胜。即使一个候选拥有更多 Exact Match，仍可能不存在唯一最佳函数，调用因而不合法。
>
> 应检查各位置的优劣关系是否同时满足比较条件，不能只统计各等级出现了几次。

## 返回结果的去向不参与选择

接收对象的类型约束调用结果怎样被使用；普通函数调用的重载选择则根据调用本身完成：

> [!IMPORTANT] 先确定调用目标，再处理返回结果
> **这里的普通函数调用先根据候选声明与实参完成重载决议；调用结果随后用于赋值或初始化时，再按接收位置的规则处理。**接收对象的类型不会反过来帮助选择重载。
>
> 返回类型属于函数自身的类型，但调用结果将被交给哪种类型的对象，不是这次普通函数调用的匹配依据。

下面这份独立程序提供两个减半函数：整数版本进行整数除法，浮点版本进行浮点除法。

```cpp
#include <iostream>

int half(const int value) {
    return value / 2;
}

double half(const double value) {
    return value / 2.0;
}

int main() {
    double stored_result{};
    stored_result = half(5);

    const double fractional_result{half(5.0)};

    std::cout << stored_result << ' ' << fractional_result << '\n';
}
```

两次调用分别发生以下过程：

- `half(5)` 的实参是 `int`，选择整数版本。整数除法 `5 / 2` 得到 `int` 结果 `2`，随后赋值将它转换为 `double` 值 `2.0`，保存到 `stored_result`。
- `half(5.0)` 的实参是 `double`，选择浮点版本。`5.0 / 2.0` 得到 `double` 结果 `2.5`，用于初始化 `fractional_result`。

程序输出 `2 2.5`。第一项结果虽然保存在 `double` 对象中，整数版本也已经完成了整数除法；改变接收对象的类型不能恢复被舍去的小数部分。要让这里的浮点版本执行，应提供 `double` 实参，例如 `5.0`。

## 选择依据是表达式的静态类型

表达式的静态类型（static type）由声明与表达式规则在编译期确定。给对象赋新值，不会改写对象的类型：

> [!IMPORTANT] 运行时数值不重新决定普通重载
> **普通函数重载在编译期依据候选声明、实参表达式的静态类型和值类别，以及允许的转换关系确定目标。**运行时改变对象中保存的数值，不会让调用自动重新选择另一个重载。

保留上一完整程序的两个 `half` 定义与头文件，把 `main` 的函数体替换为下面的片段，作为另一种独立运行情形：

```cpp
double value{5.0};
const double first{half(value)};

value = 5.5;
const double second{half(value)};

std::cout << first << ' ' << second << '\n';
```

两处调用之间没有改变候选集合。名称表达式 `value` 的类型也始终是 `double`，值类别始终是 lvalue：

| 调用位置 | `value` 保存的数值 | 选中函数 | 返回值 |
| --- | --- | --- | --- |
| 初始化 `first` 时 | `5.0` | `half(double)` | `2.5` |
| 初始化 `second` 时 | `5.5` | `half(double)` | `2.75` |

程序输出 `2.5 2.75`。第一次调用时，`5.0` 虽然没有小数部分，提供它的仍是 `double` 对象；不会因此改选返回整数商的 `half(int)`。两次都使用同一个浮点版本，变化的是输入数值及其计算结果。

## 参考资料

- [C++23 工作草案：最佳可行函数的比较](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general#2)
- [C++23 工作草案：转换序列的匹配等级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#4)
- [C++23 工作草案：标准转换序列的组成与等级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.scs#3)
- [C++23 工作草案：除法与整数商](https://timsong-cpp.github.io/cppwp/n4950/expr.mul#4)
