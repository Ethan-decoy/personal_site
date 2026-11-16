---
title: 用户定义转换与重载决议（User-Defined Conversions and Overload Resolution）
date: 2026-09-01
order: 4
---

# 用户定义转换与重载决议（User-Defined Conversions and Overload Resolution）

一个整数读数既可以转换为 `double`，也可以通过构造函数建立 `pressure_kpa` 对象。若同名函数分别接收这两种类型，两项候选都可能可行，还需要比较哪条实参到形参的路径更好。

重载决议用隐式转换序列描述每个实参怎样初始化相应形参。本例中，`int` 到 `double` 的数值转换属于标准转换序列；从整数调用构造函数建立类形参的路径，则属于用户定义转换序列（user-defined conversion sequence）。

## 标准转换序列先胜过用户定义转换序列

下面是完整程序，类与函数定义都放在 `main` 之前。两个输出入口都按千帕解释读数，行首标签用来辨认选中了哪个重载。`pressure_kpa` 的构造函数只保存传入整数，不额外验证范围：

```cpp
#include <iostream>

class pressure_kpa {
  public:
    pressure_kpa(const int value_kpa) : stored_value_kpa{value_kpa} {}

    int value_kpa() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};

void print_pressure(const double value_kpa) {
    std::cout << "double: " << value_kpa << " kPa\n";
}

void print_pressure(const pressure_kpa pressure) {
    std::cout << "pressure_kpa: " << pressure.value_kpa() << " kPa\n";
}

int main() {
    print_pressure(220);
}
```

当前构造函数没有声明为 `explicit`，因此两项重载都能接收这个 `int` 实参，但形参初始化所需的路径不同：

| 候选函数 | `int` 实参到形参的路径 | 序列形式 |
| --- | --- | --- |
| `print_pressure(double)` | `int` 转换为 `double` | 标准转换序列 |
| `print_pressure(pressure_kpa)` | 由 `int` 调用 `pressure_kpa(int)` 建立类对象 | 用户定义转换序列 |

`int` 到 `double` 在标准转换序列内部只有 Conversion 等级，但整条路径仍然只使用标准转换。另一条路径需要从整数调用类的构造函数，因此属于用户定义转换序列。比较这两种基本形式时，前者更好，程序输出 `double: 220 kPa`。

> [!IMPORTANT] 序列形式与标准转换的内部等级
> **比较同一个实参到不同候选形参的路径时，标准转换序列优于用户定义转换序列。**Exact Match、Promotion 与 Conversion 是标准转换序列内部的等级，不能用某一段的精确匹配，把整条用户定义转换序列重新归入 Exact Match。
>
> 本节的转换路径用于编译期筛选与比较。运行时只执行选中的调用及其所需初始化，不会先执行各个候选的构造函数，再观察哪个结果更合适。

## 不同的用户定义转换可能彼此无法排序

再增加一个用巴（bar）表示压力的类型。`pressure_bar` 的 `double` 形参按巴解释，`pressure_kpa` 的整数形参按千帕解释；这些构造函数接收各自单位下的数值，没有在两个单位之间换算。

保留开篇程序的头文件、`pressure_kpa` 类和接收它的输出重载，删除 `print_pressure(double)`。在 `main` 之前加入以下类定义与重载：

```cpp
class pressure_bar {
  public:
    pressure_bar(const double value_bar) : stored_value_bar{value_bar} {}

    double value_bar() const {
        return stored_value_bar;
    }

  private:
    double stored_value_bar;
};

void print_pressure(const pressure_bar pressure) {
    std::cout << "pressure_bar: " << pressure.value_bar() << " bar\n";
}
```

这时重载集只包含 `print_pressure(pressure_kpa)` 与 `print_pressure(pressure_bar)`。把 `main` 的函数体替换为以下错误片段，单独考察：

```cpp
print_pressure(220); // 错误：两个类类型重载之间存在歧义
```

两项构造函数都不是显式的，各自的形参也能由 `220` 初始化，因此两项输出重载都可行。它们需要的转换路径如下：

| 候选函数 | 从 `int` 实参初始化形参所需的路径 | 序列形式 |
| --- | --- | --- |
| `print_pressure(pressure_kpa)` | `int` → `pressure_kpa(int)` → `pressure_kpa` | 用户定义转换序列 |
| `print_pressure(pressure_bar)` | `int` → `double` → `pressure_bar(double)` → `pressure_bar` | 用户定义转换序列 |

第一条路径在构造函数之前不需要改变数值类型，第二条需要先从 `int` 转为 `double`。这里列出的是候选各自需要的初始化关系；调用存在歧义，不能据此运行任何一条路径。

> [!WARNING] 构造函数前的匹配不能直接决定整条路径的优劣
> **比较两个可行重载所需的用户定义转换序列时，若它们采用不同构造函数，不能仅凭前段更直接，就断言整条路径更好。**不能把“一个构造函数接收 `int`，另一个接收 `double`”直接当作两项输出重载的最终排序结果。
>
> 本例没有其他适用规则区分这两项可行函数，因而没有唯一最佳目标，调用不合法。

函数名称、单位在项目中的常用程度，以及构造函数体执行多少工作，都不参与这项排序。重载决议依据声明所形成的类型关系，而不是依据运行时数值或业务偏好猜测意图。

保留这组类与输出重载，单独用下面的正常片段替换 `main` 的函数体。调用者明确构造实参，分别表达两种单位下的读数：

```cpp
print_pressure(pressure_kpa{220});
print_pressure(pressure_bar{2.2});
```

程序输出：

```text
pressure_kpa: 220 kPa
pressure_bar: 2.2 bar
```

第一条调用的实参表达式已经具有 `pressure_kpa` 类型，第二条已经具有 `pressure_bar` 类型。重载比较从这些表达式的结果出发：同类型形参得到精确匹配，当前接口又没有提供两种类类型之间的转换，因此另一项重载不可行。

构造表达式内部从整数或浮点数建立对象，不等于调用处还要再把实参隐式转换一次。这里的精确匹配描述的是已构造出的实参怎样初始化对应形参。

另作独立变体：把两个类中接收数值的构造函数都加上 `explicit`，保留其他定义。此时单独用下面的错误片段替换 `main` 的函数体：

```cpp
print_pressure(220); // 错误：没有可行函数
```

裸整数调用的失败原因从歧义变成没有可行函数，因为两项候选都不能再通过隐式构造接收 `220`。若改用前面明确构造实参的 `main` 函数体，两条调用仍然成立，输出也相同。

## 构造函数与转换函数并非总会同时竞争

当源类型和目标类型都是类时，同一转换方向可能有两个声明位置：目标类可以提供接收源类型的构造函数，源类也可以提供产生目标类型的转换函数。初始化语境决定两者是否进入同一次候选选择。

下面的独立片段用于编译期声明分析，只做语法与类型检查，不与前面的类定义接续。`pressure_pa` 与 `pressure_kpa` 分别表示按帕和千帕解释的压力类型；构造函数与转换函数只给出声明。

`class pressure_pa;` 先声明类名，使下面的构造函数能够声明一个 `const pressure_pa&` 形参；此处还不需要知道源类的成员与大小。源类的完整类定义随后给出：

```cpp
class pressure_pa;

class pressure_kpa {
  public:
    pressure_kpa(const pressure_pa& source);
};

class pressure_pa {
  public:
    operator pressure_kpa() const;
};

void inspect_initialization(const pressure_pa& source) {
    const pressure_kpa target{source}; // 合法：选择目标类构造函数
}
```

保留类声明与函数外壳，将 `inspect_initialization` 中的对象定义替换为下面的错误声明，单独检查：

```cpp
const pressure_kpa target = source; // 错误：构造函数与转换函数提供了两条歧义路径
```

两条路径都从 `pressure_pa` 到 `pressure_kpa`，只是接口声明在不同的一端。初始化形式改变后，参与同一次选择的候选范围不同：

| 初始化形式 | 本例的选择范围与结果 |
| --- | --- |
| 直接列表初始化 `target{source}` | 在目标类的构造函数中选择，选中接收 `const pressure_pa&` 的构造函数 |
| 普通复制初始化 `target = source` | 目标类的非显式构造函数与源类转换函数都可提供所需转换，当前无法确定唯一选择 |

> [!IMPORTANT] 初始化语境决定两端接口是否同时参与选择
> **对于这里的源类到目标类初始化，直接列表初始化在目标类的构造函数中进行选择；普通复制初始化可同时考虑目标类的非显式构造函数与源类的合适非显式转换函数。**两端都声明转换能力，不代表它们在每种初始化语境中都会同时成为候选。
>
> 这里区分的是同一次候选选择的范围。各构造函数的形参本身仍须按相应初始化规则检查。

## 转换入口属于整个重载接口

前面的裸整数调用表明：改变转换接口，会改变哪些候选能够接收实参。两端同时提供同方向路径的例子则表明：新增接口也可能让原本唯一的初始化变成歧义。

> [!IMPORTANT] 隐式转换入口会影响相关重载的可行性
> **一项隐式转换是类型向相关调用公开的接口能力。**新增路径，可能使原本不可行的候选变得可行，也可能引入歧义；删除路径或把接口改为 `explicit`，同样可能改变可行函数的集合。
>
> 判断接口变化的影响，应同时考虑转换关系与相关重载，不能只看某一个构造表达式能否写得更短。

> [!TIP] 沿实参到形参检查一次匹配
> 先确认本次可见的候选，以及实参表达式的类型和值类别，再分别检查各形参能否初始化。对于可行函数，先区分转换序列的形式，再按相应规则比较质量。
>
> 两条路径都属于用户定义转换序列时，应写清各自采用哪项构造函数或转换函数，再核对是否有适用的排序规则。初始化语境改变时，也要重新核对候选范围，不能直接沿用前一种写法的结论。

序列前后还可以包含标准转换，具体组成与数量限制见[一条序列固定分成三段](deep-dives/01-user-defined-conversion-sequences-and-overload-ranking.md#一条序列固定分成三段)；更细的比较条件见[排序只在规则允许的边界内继续](deep-dives/01-user-defined-conversion-sequences-and-overload-ranking.md#排序只在规则允许的边界内继续)。

## 参考资料

- [C++23 工作草案：隐式转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：隐式转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++23 工作草案：列表初始化中的构造函数选择](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
- [C++23 工作草案：复制初始化中的用户定义转换选择](https://timsong-cpp.github.io/cppwp/n4950/over.match.copy)
