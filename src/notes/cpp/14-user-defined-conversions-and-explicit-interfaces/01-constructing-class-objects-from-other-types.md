---
title: 由其他类型构造类对象（Constructing Class Objects from Other Types）
date: 2026-09-01
order: 1
---

# 由其他类型构造类对象（Constructing Class Objects from Other Types）

当初始化或表达式需要一种类型，而源表达式提供另一种类型时，程序可能需要在两种类型之间建立转换。若这条路径由目标类的构造函数，或由源类的转换函数（conversion function）声明，它就是用户定义转换（user-defined conversion）。这里的“用户定义”是指类的作者定义了转换规则，并不要求转换两端都必须是类类型。

用户定义转换有两个方向：

| 转换方向 | 提供接口的一端 | 接口的作用 |
| --- | --- | --- |
| 其他类型到目标类 | 目标类的构造函数 | 用源值建立目标类对象 |
| 源类到其他类型 | 源类的转换函数 | 由源对象产生目标类型结果 |

第一种方向由目标类的构造函数提供。`pressure_kpa` 可以声明一个接受 `int` 的构造函数，把以千帕为单位的整数值解释为类对象的状态：

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
```

`pressure_kpa(int)` 的参数类型说明源值必须能够初始化一个 `int` 形参，所属类则确定最终建立的是 `pressure_kpa` 对象。这项构造函数由此提供了从 `int` 到 `pressure_kpa` 的用户定义转换路径。

## 源表达式为目标对象提供值

源值既可以来自已有对象，也可以直接来自字面量：

```cpp
int measured_value_kpa{220};

const pressure_kpa measured_pressure{measured_value_kpa};
const pressure_kpa target_pressure{230};
```

两条声明都直接列表初始化一个新的 `pressure_kpa` 对象，并选择 `pressure_kpa(int)`。第一条读取 `measured_value_kpa` 当前保存的值，第二条直接使用字面量 `230`；构造函数再以相应的 `int` 值初始化成员。

转换没有把 `measured_value_kpa` 对象变成 `pressure_kpa`。初始化完成后，命名的源对象仍然具有原来的类型和身份，目标对象则是新建立的另一个对象。

构造函数的实参仍须满足自己的初始化规则：

```cpp
const pressure_kpa invalid_pressure{230.5}; // 错误：double 到 int 发生窄化
```

外层采用列表初始化，不会因为目标是类类型就放过 `double` 到构造函数 `int` 形参的窄化。存在一条用户定义转换路径，不等于任何源表达式都能合法采用它。

## 源状态与对象关联取决于具体接口

当前构造函数按值接收 `int`，目标对象也按值保存这个整数。因此它只在初始化时读取源值，不会在两个对象之间留下关联：

```cpp
measured_value_kpa = 225;

const int observed_value_kpa{measured_pressure.value_kpa()}; // 仍为 220
```

这个结果来自当前接口和成员表示，而不是所有用户定义转换共有的保证。构造函数也可以接收可修改引用并改变源对象，或者保存指针、引用等关联。源状态是否改变、目标是否继续关联源对象，必须由构造函数的参数类型、成员表示和函数实现共同判断。

**用户定义转换提供的是由源表达式建立目标类型结果的路径，而不是把源对象本身改成目标类型。命名源对象的类型与身份不会因转换而改变；它的状态是否变化、两个对象是否保持关联，则取决于具体接口与实现。**

## 参考资料

- [C++23 工作草案：类的转换](https://timsong-cpp.github.io/cppwp/n4950/class.conv)
- [C++23 工作草案：构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.ctor)
- [C++23 工作草案：列表初始化中的构造函数调用](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
