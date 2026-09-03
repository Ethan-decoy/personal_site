---
title: 显式构造与隐式转换边界（Explicit Construction and Implicit Conversion Boundaries）
date: 2026-09-01
order: 2
---

# 显式构造与隐式转换边界（Explicit Construction and Implicit Conversion Boundaries）

构造函数不仅能在直接列表初始化目标对象时使用，也可能被复制初始化或函数实参初始化自动采用。是否允许这种自动采用，由构造函数的 `explicit` 边界和当前初始化语境共同决定。

```cpp
class pressure_kpa {
  public:
    pressure_kpa(int value_kpa) : stored_value_kpa{value_kpa} {}

    int value_kpa() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};

int read_pressure_value(pressure_kpa pressure) {
    return pressure.value_kpa();
}
```

当前构造函数没有声明为 `explicit`，因此下面两种语境都能自动采用从 `int` 到 `pressure_kpa` 的路径：

```cpp
const pressure_kpa target_pressure = 225;
const int recorded_value_kpa{read_pressure_value(230)};
```

第一条声明执行普通复制初始化。第二条调用需要用 `int` 实参初始化 `pressure_kpa` 形参；函数参数的这种初始化同样允许隐式转换。两处都会调用 `pressure_kpa(int)` 建立目标对象。

## 转换构造函数不由参数数量定义

**标准把不是显式的（non-explicit）构造函数称为转换构造函数（converting constructor）。** `pressure_kpa(int)` 是转换构造函数；把它声明为 `explicit` 后，它仍然能构造对象，却不再属于这项标准术语。

“单参数构造函数”只是常见形状，不是转换构造函数的定义。不是显式的多参数构造函数也属于这一分类，并能在提供了足够实参的语境中使用：

```cpp
class pressure_range {
  public:
    pressure_range(int minimum_kpa, int maximum_kpa);
};

const pressure_range operating_range = {100, 250};
```

这里的两参数构造函数是转换构造函数，复制列表初始化提供的两个元素能够初始化它的两个形参。`pressure_range value = 100;` 仍然不成立，因为单个源表达式没有为第二个形参提供实参。构造函数的标准分类与某个具体初始化能否为它提供合法实参，是两个不同判断。

## explicit 的可用性由初始化语境决定

单位不应只由隐藏约定决定。下面是一份独立的替代定义：把 `pressure_kpa(int)` 声明为 `explicit`，保留从整数建立对象的能力，同时阻止普通隐式转换自动采用它。

```cpp
class pressure_kpa {
  public:
    explicit pressure_kpa(int value_kpa) : stored_value_kpa{value_kpa} {}

    int value_kpa() const {
        return stored_value_kpa;
    }

  private:
    int stored_value_kpa;
};
```

判断这项构造函数能否使用，应识别初始化形式，而不是观察源码中是否出现了目标类型名称：

| 语境 | 示例 | 能否采用 `explicit` 构造函数 |
| --- | --- | --- |
| 直接列表初始化 | `const pressure_kpa pressure{220};` | 可以 |
| 普通复制初始化 | `const pressure_kpa pressure = 225;` | 不可以 |
| 函数实参的隐式转换 | `read_pressure_value(230)` | 不可以 |
| `static_cast` 显式转换 | `static_cast<pressure_kpa>(235)` | 可以 |

普通复制初始化的声明已经写出了 `pressure_kpa`，却仍然不能采用 `explicit` 构造函数。这说明“调用处能否看见目标类型”不是语言的判断标准。直接列表初始化会考虑 `explicit` 构造函数；普通复制初始化和需要隐式转换的函数实参不会采用它；`static_cast` 明确请求转换到目标类型，因此可以采用它。

复制列表初始化还有一项特殊边界：重载决议先选择构造函数；如果最终选中的是 `explicit` 构造函数，这项初始化才被判为不合法。[附章进一步解释这项选择顺序](deep-dives/01-user-defined-conversion-sequences-and-overload-ranking.md#复制列表初始化在选中构造函数后检查-explicit)。

调用函数时，可以先直接列表初始化目标对象，再传递这个已经具有正确类型的结果：

```cpp
const int recorded_value_kpa{
    read_pressure_value(pressure_kpa{235})
};
```

内层 `pressure_kpa{235}` 可以选择 `explicit` 构造函数。外层函数调用接收的已经是 `pressure_kpa` 对象，不再需要把 `int` 隐式转换为类类型。

## explicit 不负责证明业务安全

```cpp
const pressure_kpa invalid_pressure{-10};
```

这条声明仍然可以使用 `explicit` 构造函数。`explicit` 只控制构造路径能否在特定语境中被隐式采用，不能判断 `-10` 是否符合压力模型，也不会自动执行范围验证。类若承诺压力不能为负，构造函数与其他公开状态入口仍须共同维护这项不变式。

**`explicit` 不会取消构造能力。直接列表初始化与 `static_cast` 可以采用 `explicit` 构造函数；普通复制初始化与函数实参所需的隐式转换不能采用它。判断边界的依据是初始化语境，而不是目标类型名称是否出现在源码中。**

## 参考资料

- [C++23 工作草案：explicit 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.spec)
- [C++23 工作草案：由构造函数完成的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv.ctor)
- [C++ Core Guidelines：默认把单实参构造函数声明为 explicit](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-explicit)
