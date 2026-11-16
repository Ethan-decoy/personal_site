---
title: 转换接口的设计边界（Design Boundaries of Conversion Interfaces）
date: 2026-09-01
order: 6
---

# 转换接口的设计边界（Design Boundaries of Conversion Interfaces）

`1 kPa` 等于 `1'000 Pa`。把 `220'600 Pa` 改用整数千帕表示，可以截断为 `220 kPa`，也可以在要求精确表示时报告失败。两种操作的目标单位相同，输入条件和结果含义却不同。

转换接口需要说明源值怎样解释、目标值承诺什么，以及调用者是否必须明确请求转换。类型之间存在一条可用路径，只是这些约定的一部分。

## 转换关系属于类型的公开接口

由目标类提供构造函数，表示“这种源值可以建立当前类型”；由源类提供转换函数，表示“当前类型可以产生这种目标结果”。接口位于哪一端，决定哪种类型负责解释转换含义。

对于同一方向、相同语义的转换，通常由一端承担主要责任，减少重复入口与候选竞争。两端都提供接口时，需要核对它们会在哪些语境中同时参与选择，以及能否选出唯一最佳目标。

复制初始化可能同时考虑目标类的转换构造函数与源类的转换函数。两条路径都可行时，若仍无法选出唯一最佳目标，初始化才会产生歧义，具体关系见[构造函数与转换函数的候选范围](04-user-defined-conversions-and-overload-resolution.md#构造函数与转换函数并非总会同时竞争)。

转换接口也不只影响声明它时想到的那条调用。一项非 `explicit` 构造函数或转换函数，会让相关初始化、函数调用和运算符表达式获得新的可行路径。增加一处局部便利，可能改变整个重载集合的选择结果。

> [!IMPORTANT] 转换入口与行为契约分别说明
> **能够按语言规则采用某项转换，不等于转换结果已经满足单位、精度或业务范围要求。**入口声明与采用语境规定类型之间怎样匹配；完整的转换契约还要说明输入条件、目标值的解释、信息处理策略，以及是否可能失败和怎样报告失败。

## 接口形式决定调用处保留多少意图

> [!PRACTICE] 按调用处需要表达的信息选择转换入口
> 先确定转换的含义与结果契约，再选择调用者怎样请求它：
>
> | 接口形式 | 调用处表达的意图 | 采用条件 |
> | --- | --- | --- |
> | 非 `explicit` 构造函数或转换函数 | 可以省略转换请求 | 含义自然稳定，省略请求不会隐藏单位、信息损失、失败处理或策略选择，并已核对相关重载的影响 |
> | `explicit` 构造函数或转换函数 | 由调用者明确请求 | 转换含义已经确定，但应要求调用者主动选择，而不作为普通隐式转换入口 |
> | 具名操作 | 用名称说明方向与策略 | 目标类型名称不足以说明单位换算、精度处理或失败契约等行为 |
>
> 隐式入口减少重复请求，也会扩展相关重载的可行路径；显式请求与具名操作保留更多调用意图，代价是调用者需要明确写出目标类型或选择处理策略。具名操作内部仍可使用显式构造，两者可以配合使用。

> [!WARNING] explicit 不会自动验证业务要求
> **给构造函数或转换函数加上 `explicit`，不会为函数体增加范围检查，也不会自动选择舍入、截断或失败处理策略。**例如，仅保存输入整数的构造函数，即使加上 `explicit`，仍会保存 `-10`；业务若只接受非负值，还需要实际实现验证。
>
> 调用处写出了目标类型，不等于输入和结果已经通过业务检查。

`explicit operator bool()` 则体现了采用语境的特殊规则：[按语境转换为 `bool`](03-conversion-functions-and-target-type-results.md#用初始化模型区分两种语境)可以采用这项显式转换函数，普通 `bool` 形参的隐式初始化不会采用它。限制针对这项入口；类若另有合适的非显式转换路径，普通布尔传参仍须重新判断。

下面是独立的完整程序，两个单位类型与转换函数都放在 `main` 之前。`pressure_pa` 保存整数帕，`pressure_kpa` 保存整数千帕。函数按整数除法向零截断，因此名称写明 `truncate_to_whole_kpa`；`long` 的标准保证范围足以容纳示例数值：

```cpp
#include <iostream>

struct pressure_pa {
    long value_pa;
};

struct pressure_kpa {
    long value_kpa;
};

pressure_kpa truncate_to_whole_kpa(const pressure_pa pressure) {
    constexpr long pa_per_kpa{1'000L};
    return pressure_kpa{pressure.value_pa / pa_per_kpa};
}

int main() {
    const pressure_pa first{220'000L};
    const pressure_pa second{220'600L};
    const pressure_kpa first_result{truncate_to_whole_kpa(first)};
    const pressure_kpa second_result{truncate_to_whole_kpa(second)};

    std::cout << first_result.value_kpa << ' ' << second_result.value_kpa << '\n';
}
```

程序输出 `220 220`。第一个输入正好等于 `220 kPa`，第二个输入还多出 `600 Pa`，截断后却得到相同结果。对第一个输入没有丢失信息；对第二个输入，返回值不再包含这部分余数。

调用者从函数名称、参数类型和返回类型，可以辨认转换方向、目标粒度与截断策略。若把同样的计算藏在隐式构造中，调用处就不再明确表达对这项信息损失的选择。

如果业务改为“只接受能够用整数千帕精确表示的压力”，接口就需要另一份契约：只有帕数能被 `1'000` 整除时，才提供目标值。两种策略对相同输入的承诺如下：

| 输入 | 允许截断到整数 kPa | 只接受精确整数 kPa |
| --- | --- | --- |
| `220'000 Pa` | 得到 `220 kPa`，没有余数 | 成功，提供 `220 kPa` |
| `220'600 Pa` | 得到 `220 kPa`，丢弃 `600 Pa` | 失败，没有可用目标值 |
| `0 Pa` | 得到 `0 kPa` | 成功，提供 `0 kPa` |

对精确转换，可以约定返回结果明确区分“成功并提供 `pressure_kpa`”与“失败且没有可用目标值”。调用者先确认成功，再使用目标值；失败时保留原来的帕数，或明确选择允许截断的操作。这是另一项接口的行为契约，上面的截断函数仍按其原有策略返回结果。

> [!WARNING] 名称和 explicit 不能代替失败契约
> **当接口承诺精确转换时，`220'600 Pa` 必须报告失败，不能把截断所得的 `220 kPa` 当作成功结果。**只增加 `try_` 前缀或改用显式构造，都不会自动产生失败检查与报告机制。
>
> `0 kPa` 本身也是合法结果，不能用它冒充失败而不提供可辨认的状态。返回契约必须让调用者知道是否成功，以及何时可以使用目标值。

## 运算符形式只提供转换机会

对于本章的普通二元 `operator+`，成员形式由调用对象提供左操作数，右操作数初始化显式形参；非成员形式让两侧都通过普通形参参与匹配。具体区别见[两侧的用户定义转换入口](05-mixed-type-operations-and-conversion-symmetry.md#非成员形式为两侧提供用户定义转换入口)。

运算符形式提供的是匹配机会，是否允许自动采用转换仍由接口契约决定。若 `pressure_delta_kpa` 表达按千帕解释的压力增量，即使整数在加法两侧都能进入这个类型，也仍需判断省略单位说明是否合适。要求调用者明确构造单位类型，可以与非成员加法同时采用。

这与前面的帕到千帕转换遵循同一项判断：先明确输入的解释、目标值的含义、信息处理与失败边界，再决定哪些转换能够自动发生，哪些需要调用者明确请求。

## 参考资料

- [C++23 工作草案：复制初始化中的转换候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.copy)
- [C++23 工作草案：唯一最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general#3)
- [C++23 工作草案：转换函数的采用语境](https://timsong-cpp.github.io/cppwp/n4950/over.match.conv)
- [C++23 工作草案：整数除法与截断](https://timsong-cpp.github.io/cppwp/n4950/expr.mul#4)
- [C++ Core Guidelines：默认把单实参构造函数声明为 explicit](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-explicit)
- [C++ Core Guidelines：避免隐式转换运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Ro-conversion)
- [C++ Core Guidelines：让接口具有精确且强类型的含义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#i4-make-interfaces-precisely-and-strongly-typed)
