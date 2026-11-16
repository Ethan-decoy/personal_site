---
title: 由其他类型构造类对象（Constructing Class Objects from Other Types）
date: 2026-09-01
order: 1
---

# 由其他类型构造类对象（Constructing Class Objects from Other Types）

一份测量读数用整数 `220` 表示，单位约定为千帕。把它保存到 `pressure_kpa` 对象时，源表达式的类型是 `int`，目标对象的类型却是 `pressure_kpa`；目标类需要规定怎样用这个整数建立自己的状态。

下面通过已学过的构造函数完成这项初始化。正常示例使用非负的小整数，只接收并保存给定读数，不额外验证压力范围。对象声明采用直接列表初始化，明确给出目标类型。

## 源表达式为目标对象提供值

以下是完整程序，类定义放在 `main` 之前。源整数稍后还要更新，因此保留可修改性；两个压力对象只用于读取：

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

int main() {
    int measured_value_kpa{220};

    const pressure_kpa measured_pressure{measured_value_kpa};
    const pressure_kpa target_pressure{230};

    std::cout << measured_pressure.value_kpa() << ' ' << target_pressure.value_kpa() << '\n';
}
```

两条对象声明都选择接收整数的构造函数，程序输出 `220 230`。以 `measured_pressure` 为例，给定的值经过三个位置：

| 位置 | 当前处理 |
| --- | --- |
| 源表达式 `measured_value_kpa` | 从已有的 `int` 对象读取 `220` |
| 构造形参 `value_kpa` | 按值初始化只读的整数形参，保存 `220` |
| 新对象的 `stored_value_kpa` 成员 | 用形参提供的整数初始化成员，成为新压力对象的状态 |

`target_pressure{230}` 则直接从字面量取得整数值，再初始化形参与成员，不需要先创建一个命名的源整数对象。

> [!IMPORTANT] 构造函数提供通向目标类的转换路径
> **目标类可以通过构造函数规定怎样从其他类型的源表达式建立本类对象，这提供了一条用户定义转换（user-defined conversion）路径。**本例的源值是 `int`，最终建立的是 `pressure_kpa` 对象；“用户定义”指类的作者声明了相应转换接口，不要求转换两端都是类类型。
>
> 这条路径通过目标对象的初始化来采用：实参初始化构造形参，成员再按成员初始化规则取得初值。构造函数本身没有普通函数那样的返回值；这里的“转换”描述的就是这一次由源类型建立目标类对象的过程。

构造函数的实参仍须能合法初始化相应形参。保留类定义，用下面的错误片段替换 `main` 的函数体，单独考察，不与正常示例接续：

```cpp
const pressure_kpa invalid_pressure{230.5}; // 错误：double 到 int 发生窄化
```

> [!WARNING] 类对象的列表初始化仍会拒绝窄化实参
> 本例需要用 `double` 值 `230.5` 初始化构造函数的整数形参。外层采用列表初始化，这项浮点数到整数的转换属于窄化，因此声明不合法，编译器必须诊断。
>
> 拒绝发生在实参初始化形参的边界，不是先截去小数、进入构造函数体后再验证。存在构造路径，不等于任意源表达式都能通过当前初始化形式使用它。

## 源状态与对象关联取决于具体接口

接续开篇的正常程序，将下面的片段追加到 `main` 末尾。修改源整数后，再通过普通读取函数观察已经建立的压力对象：

```cpp
measured_value_kpa = 225;

const int observed_value_kpa{measured_pressure.value_kpa()}; // 仍为 220
std::cout << measured_value_kpa << ' ' << observed_value_kpa << '\n';
```

追加部分输出 `225 220`。源整数已经保存 `225`，`measured_pressure` 中的成员仍然保存初始化时取得的 `220`。`observed_value_kpa` 是另一个 `int` 对象，用来保存读取函数返回的 `220`。

> [!IMPORTANT] 源对象身份与目标状态分别判断
> **由源值构造新对象，不会把命名的源对象本身改成目标类型。**本例的 `measured_value_kpa` 仍是原来的 `int` 对象，`measured_pressure` 则是另一个新建立的类对象。
>
> 目标独立保存读数，来自当前构造函数按值接收整数、成员也按值保存整数的设计。不能仅凭发生了用户定义转换，就推断源状态一定不变，或目标一定不保留对源对象的访问关系。

其他构造接口可以通过可修改引用改变源对象，也可以在成员中保存指针或引用，使后续读取继续观察源对象。判断时，应同时核对形参、成员表示与具体实现。若保留的是借用关系，实际目标还必须在使用期间存活且允许访问；经构造形参保存下来的借用关系，不会重新延长目标原有的生命周期。

## 转换路径的方向与采用语境

以当前类为中心，类的作者可以声明接收其他类型值的构造函数，也可以用专门声明形式的转换函数（conversion function），由本类对象提供其他类型的结果。这是两类独立接口，本例只提供前一类：

| 转换方向 | 提供接口的一端 | 接口的作用 |
| --- | --- | --- |
| 其他类型到当前类 | 当前类的构造函数 | 用源值建立本类对象 |
| 当前类到其他类型 | 当前类的转换函数 | 由本类对象提供相应目标类型的结果 |

本例的 `value_kpa()` 是普通成员函数，必须明确写出调用才能取得它返回的整数。它不属于这里所说的转换函数。保留开篇的类定义，用以下错误片段替换 `main` 的函数体，独立考察：

```cpp
const pressure_kpa pressure{220};
const int invalid_value_kpa{pressure}; // 错误：当前没有 pressure_kpa 到 int 的转换路径
```

> [!WARNING] 普通读取函数不自动提供反向转换
> `pressure_kpa` 能从整数构造，不代表对象能自动转换回 `int`。当前类没有声明这种转换函数，编译器也不会自动寻找并调用 `value_kpa()` 来完成上面的初始化。
>
> 明确调用 `pressure.value_kpa()` 可以得到整数，是因为普通成员函数调用本身返回 `int`；这与把 `pressure` 直接用作需要 `int` 的初值是两种不同用法。

本节正常例子采用的是直接列表初始化。其他初始化形式或实参转换能否自动采用构造路径，还要核对相应语境；具体规则见[显式构造与隐式转换边界](02-explicit-construction-and-implicit-conversion-boundaries.md#explicit-的可用性由初始化语境决定)。源类怎样声明另一方向的接口，见[转换函数的声明形式](03-conversion-functions-and-target-type-results.md#转换函数的声明形式)。

## 参考资料

- [C++23 工作草案：类的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv)
- [C++23 工作草案：由构造函数完成的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv.ctor)
- [C++23 工作草案：列表初始化中的构造函数调用](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
- [C++23 工作草案：列表初始化与窄化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
