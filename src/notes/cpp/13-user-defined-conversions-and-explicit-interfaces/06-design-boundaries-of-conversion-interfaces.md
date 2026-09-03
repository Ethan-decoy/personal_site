---
title: 转换接口的设计边界（Design Boundaries of Conversion Interfaces）
date: 2026-09-01
order: 6
---

# 转换接口的设计边界（Design Boundaries of Conversion Interfaces）

用户定义转换的工程价值不在于少写一个类型名称，而在于让类型明确声明自己接受哪些外部值、又能产生哪些目标类型结果。一条转换路径可以只在调用者明确请求时使用，也可以成为编译器能够自动采用的接口能力；两种选择会直接改变调用处保留多少意图。

## 转换关系属于类型的公开接口

由目标类提供构造函数，表示“这种源值可以建立当前类型”；由源类提供转换函数，表示“当前类型可以产生这种目标结果”。接口位于哪一端，决定哪种类型负责解释转换含义。

同一方向通常只应由一端提供转换。若目标类和源类分别声明一条功能相同的路径，复制初始化等语境可能同时看到两项用户定义转换，原本清楚的类型关系就会变成重载歧义。

转换接口也不只影响声明它时想到的那条调用。一项非 `explicit` 构造函数或转换函数，会让相关初始化、函数调用和运算符表达式获得新的可行路径。增加一处局部便利，可能改变整个重载集合的选择结果。

## 接口形式决定调用处保留多少意图

隐式转换、显式转换和具名操作承担的接口责任不同：

| 接口形式 | 调用处表达的意图 | 适合的转换关系 |
| --- | --- | --- |
| 非 `explicit` 构造函数或转换函数 | 可以省略转换请求 | 含义稳定、不会隐藏单位、信息损失、失败或策略选择 |
| `explicit` 构造函数或转换函数 | 不作为普通隐式转换路径 | 转换本身成立，但不应悄悄进入普通初始化和函数调用 |
| 具名操作 | 用名称表达方向和处理策略 | 涉及单位换算、信息损失、失败条件或多种合理策略 |

`explicit` 只控制语言能否自动采用转换，不会验证数值是否满足类型不变式，也不会替接口选择舍入、截断或失败处理方式。目标类型名称不足以说明这些决策时，需要由操作名称和结果契约继续表达。

`explicit operator bool()` 展示了更窄的接口边界：对象可以自然参与条件判断，却不能作为普通函数的 `bool` 实参。这种设计保留了控制流中的可读性，同时避免类型在其他表达式和重载中普遍退化为布尔值。

下面的独立示例把整数 Pa 转为整数 kPa。转换会丢弃不足 `1 kPa` 的余数，因此函数名直接写出截断策略：

```cpp
struct pressure_pa {
    int value_pa;
};

struct pressure_kpa {
    int value_kpa;
};

pressure_kpa truncate_to_whole_kpa(pressure_pa pressure) {
    constexpr int pa_per_kpa{1'000};
    return pressure_kpa{pressure.value_pa / pa_per_kpa};
}

const pressure_kpa displayed_pressure{
    truncate_to_whole_kpa(pressure_pa{220'600})
};
```

结果保存 `220 kPa`。调用者从 `truncate_to_whole_kpa` 就能看到转换方向、目标粒度和信息损失；若这些行为藏在隐式构造中，表达式只会留下两个类型之间能够自动转换的事实。

如果业务改为“只有能够整除时才成功”，部分输入就无法产生目标值。此时接口还必须让调用者区分成功与失败；把构造函数声明为 `explicit`，或只给函数增加 `try_` 前缀，都不能独自完成这项结果契约。

## 运算符形式只提供转换机会

成员二元运算符由调用对象提供左操作数，只有右操作数通过显式形参参与匹配；非成员形式则让左右操作数都通过形参参与匹配。非成员形式由此能够提供对称的转换机会，却不能证明两种转换方向都具有合理含义。

如果裸整数没有单位，允许它在 `pressure_delta_kpa + int` 与 `int + pressure_delta_kpa` 中自动进入压力类型，并不会因为两种写法都能通过编译就变得安全。运算符形式决定语言在哪里尝试转换，类型设计仍要决定转换是否应当隐式发生。

**构造函数、转换函数、`explicit`、重载决议和运算符候选共同决定一条转换路径会在多大范围内生效。设计转换接口，就是决定哪些类型关系可以由编译器自动完成，哪些单位、损失、策略和失败边界必须由调用者明确写出。**

## 参考资料

- [C++ Core Guidelines：默认把单实参构造函数声明为 explicit](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-explicit)
- [C++ Core Guidelines：避免隐式转换运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-conversion)
- [C++ Core Guidelines：让接口具有精确且强类型的含义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#i4-make-interfaces-precisely-and-strongly-typed)
