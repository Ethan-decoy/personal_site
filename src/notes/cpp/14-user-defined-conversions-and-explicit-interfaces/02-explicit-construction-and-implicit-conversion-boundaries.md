---
title: 显式构造与隐式转换边界（Explicit Construction and Implicit Conversion Boundaries）
date: 2026-09-01
order: 2
---

# 显式构造与隐式转换边界（Explicit Construction and Implicit Conversion Boundaries）

`pressure_kpa` 用一个整数保存以千帕为单位的压力读数。`pressure_kpa{220}` 明确请求从整数建立压力对象；把裸整数交给需要 `pressure_kpa` 的位置时，也可能自动调用同一项构造函数。这两种使用方式是否都被允许，取决于构造函数的声明与当前初始化形式。

## 没有 explicit 时的自动构造

下面是完整程序，类定义与辅助函数都放在 `main` 之前。辅助函数按值接收一个压力对象，再返回其中保存的整数，便于观察形参取得的值。示例类只保存传入读数，尚未加入压力范围验证：

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

int read_pressure_value(const pressure_kpa pressure) {
    return pressure.value_kpa();
}

int main() {
    const pressure_kpa target_pressure = 225;
    const int recorded_value_kpa{read_pressure_value(230)};

    std::cout << target_pressure.value_kpa() << ' ' << recorded_value_kpa << '\n';
}
```

程序输出 `225 230`。第一条对象声明采用普通复制初始化，用整数值 `225` 调用构造函数建立新的 `target_pressure` 对象。这里的 `=` 属于初始化语法，不是向已有对象赋值。

第二条对象声明先求值函数调用。`read_pressure_value` 需要初始化一个只读的 `pressure_kpa` 形参对象，实参却是 `int` 值 `230`；形参的初始化允许隐式转换，因此可以自动采用构造函数。形参对象保存 `230`，函数再返回这个整数，用于初始化 `recorded_value_kpa`。

> [!TIP] 找到实际需要转换的初始化位置
> 判断某条构造路径能否采用，先找正在初始化的对象及其目标类型，再辨认源值到这个对象的初始化形式。一个表达式内有多处初始化时，应分别核对。
>
> 在 `recorded_value_kpa{read_pressure_value(230)}` 中，需要从整数构造类对象的是 `pressure_kpa` 形参。外层花括号只用于初始化接收返回值的 `int` 对象，不会把内部的普通传参也改成直接列表初始化。

## explicit 的可用性由初始化语境决定

`read_pressure_value(230)` 的调用只写出裸整数，单位由接口约定解释。若希望调用者在从整数进入压力类型时明确选择千帕含义，可以把构造函数声明为 `explicit`。

保留开篇程序的头文件与辅助函数，仅将类定义替换为下面的版本。随后各使用片段均单独替换开篇 `main` 的函数体，彼此不接续；错误片段也单独考察：

```cpp
class pressure_kpa {
  public:
    explicit pressure_kpa(const int value_kpa) : stored_value_kpa{value_kpa} {}

    int value_kpa() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};
```

> [!IMPORTANT] explicit 限制构造路径的采用语境
> **`explicit` 保留构造函数建立对象的能力，但不允许普通隐式转换自动采用这项构造函数。**直接列表初始化可以采用它；普通复制初始化和这里由整数实参初始化类形参的隐式转换不能采用它；`static_cast` 则可以明确请求这项构造。
>
> 判断依据是当前初始化语境，不是源码中是否写出了目标类型名称。限制针对这项构造路径，不是禁止所有复制初始化或按值传参。

针对上面从 `int` 到 `pressure_kpa` 的构造函数，各种写法的区别如下。表中每一行独立考察：

| 语境 | 示例 | 能否采用当前的 `explicit` 构造函数 |
| --- | --- | --- |
| 直接列表初始化 | `const pressure_kpa pressure{220};` | 可以，对象保存 `220` |
| 普通复制初始化 | `const pressure_kpa pressure = 225;` | 不可以，初始化不合法 |
| 普通实参初始化类形参 | `read_pressure_value(230)` | 不可以，调用不合法 |
| `static_cast` 显式转换 | `static_cast<pressure_kpa>(235)` | 可以，构造出的对象保存 `235` |
| 复制列表初始化 | `const pressure_kpa pressure = {220};` | 先选择构造函数；本例选中显式构造函数，初始化不合法 |

普通复制初始化已经写出了 `pressure_kpa`，仍然不能采用该显式构造函数；复制列表初始化还写出了花括号，也不能因此按直接列表初始化处理。

保留当前显式构造函数，下面是单独考察的错误片段：

```cpp
const pressure_kpa pressure = {220}; // 错误：复制列表初始化选中了显式构造函数
```

> [!WARNING] 复制列表初始化不预先排除显式构造函数
> 对这里的非聚合类，复制列表初始化先通过重载决议选择构造函数；**如果最终选中的是 `explicit` 构造函数，这项初始化不合法。**不能把它理解为先排除显式构造函数，再从其余构造函数中挑选。
>
> 因此，即使另有较差的非显式构造函数，语言也不会在选中显式构造函数后回退到它。[附章进一步解释这项选择顺序](deep-dives/01-user-defined-conversion-sequences-and-overload-ranking.md#复制列表初始化在选中构造函数后检查-explicit)。

调用函数时，可以先直接列表初始化目标对象，再传递这个已经具有正确类型的结果：

```cpp
const int recorded_value_kpa{read_pressure_value(pressure_kpa{235})};
std::cout << recorded_value_kpa << '\n';
```

这段代码输出 `235`。内层 `pressure_kpa{235}` 直接列表初始化压力对象，可以选择 `explicit` 构造函数。函数形参接收到的已经是同类型结果，不再需要从 `int` 隐式转换到 `pressure_kpa`，因此按值传参仍然可以成立。

## explicit 不负责证明业务安全

仍使用上面的显式构造函数，单独用以下片段替换 `main` 的函数体：

```cpp
const pressure_kpa unchecked_pressure{-10};
std::cout << unchecked_pressure.value_kpa() << '\n';
```

程序可以构建，并输出 `-10`。当前构造函数按原样保存整数；增加 `explicit` 没有为函数体添加任何数值检查。

> [!WARNING] 显式构造不会自动验证业务范围
> **`explicit` 约束构造函数在哪些语境中被采用，不证明传入的值符合业务要求。**如果类型承诺只保存非负压力读数，上面的声明虽然符合语言规则，建立的状态却不符合该承诺。
>
> 构造函数与其他公开状态入口仍须共同维护这项不变式。当前示例没有实现这项范围验证，不能仅凭调用处明确写出了类型，就把输入视为已经验证。

## 转换构造函数不由参数数量定义

显式构造函数仍然能够完成由整数建立类对象的过程，但“转换构造函数”是具有特定分类依据的标准术语：

> [!IMPORTANT] 转换构造函数的分类与可用性
> **标准把非显式（non-explicit）的构造函数称为转换构造函数（converting constructor），分类依据不是参数数量。**开篇未加 `explicit` 的构造函数属于这一分类；加上 `explicit` 后，它仍能构造对象，却不再属于这项标准术语。
>
> 属于转换构造函数，不等于任意初值都能使用它。某次初始化仍须提供合法实参，并满足相应初始化语境的规则。

多参数构造函数也可以是转换构造函数。下面是独立的完整程序：`pressure_range` 保存以千帕为单位的下限与上限，示例使用 `100` 和 `250`，这里只保存两个端点，不另加范围验证。

```cpp
#include <iostream>

class pressure_range {
  public:
    pressure_range(const int minimum_kpa, const int maximum_kpa)
        : stored_minimum_kpa{minimum_kpa}, stored_maximum_kpa{maximum_kpa} {}

    int minimum_kpa() const {
        return stored_minimum_kpa;
    }

    int maximum_kpa() const {
        return stored_maximum_kpa;
    }

  private:
    int stored_minimum_kpa;
    int stored_maximum_kpa;
};

int main() {
    const pressure_range operating_range = {100, 250};

    std::cout << operating_range.minimum_kpa() << ' ' << operating_range.maximum_kpa() << '\n';
}
```

程序输出 `100 250`。这个两参数构造函数不是显式的，因此属于转换构造函数；复制列表初始化提供两个元素，分别初始化它的两个整数形参。

保留这个完整程序的其余部分，将 `operating_range` 的定义替换为以下错误声明：

```cpp
const pressure_range operating_range = 100; // 错误：单个整数没有提供第二个实参
```

单个源表达式 `100` 无法为当前两参数构造函数提供完整的实参，因此没有可用的构造路径。这里失败的是实参条件，不是构造函数的标准分类发生了变化。

## 参考资料

- [C++23 工作草案：explicit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.spec)
- [C++23 工作草案：由构造函数完成的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv.ctor)
- [C++23 工作草案：列表初始化中的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
- [C++23 工作草案：static_cast](https://timsong-cpp.github.io/cppwp/n4950/expr.static.cast)
- [C++ Core Guidelines：默认把单实参构造函数声明为 explicit](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-explicit)
