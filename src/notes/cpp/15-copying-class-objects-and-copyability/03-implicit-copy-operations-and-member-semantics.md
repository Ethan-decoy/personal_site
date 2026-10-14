---
title: 隐式复制操作与成员语义（Implicit Copy Operations and Member Semantics）
date: 2026-09-03
order: 3
---

# 隐式复制操作与成员语义（Implicit Copy Operations and Member Semantics）

类没有写出复制构造函数或复制赋值运算符，不等于每次复制都必须由类作者手工实现。对于下面这个具体类，语言会隐式声明（implicitly declare）相应的复制操作：

```cpp
class pressure_snapshot {
  public:
    pressure_snapshot(int initial_pressure_kpa, const int* warning_limit_kpa)
        : stored_pressure_kpa{initial_pressure_kpa},
          observed_warning_limit_kpa{warning_limit_kpa} {}

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

    const int* warning_limit_target() const {
        return observed_warning_limit_kpa;
    }

  private:
    int stored_pressure_kpa;
    const int* observed_warning_limit_kpa;
};
```

`pressure_snapshot` 没有声明接收同类型对象的构造函数，也没有声明自己的复制赋值运算符。它的两个成员分别是 `int` 和 `const int*`，都支持当前需要的复制初始化与赋值，因此这个类可以使用语言隐式声明的复制构造函数和复制赋值运算符。

这里的“隐式”说明声明由语言规则提供，不表示对象按照原始字节复制，也不保证任意类都拥有可用的复制操作。能否实际复制，仍然取决于相应成员操作是否成立。

## 复制构造按成员初始化新对象

```cpp
int warning_limit_kpa{250};

const pressure_snapshot measured{220, &warning_limit_kpa};
const pressure_snapshot archived{measured};
```

`archived` 的初始化选择隐式声明的复制构造函数。执行这项复制构造时，非静态数据成员按照声明顺序，用 `measured` 中对应成员初始化：

1. `archived` 的 `stored_pressure_kpa` 由 `measured` 中的同名成员初始化；
2. `archived` 的 `observed_warning_limit_kpa` 由 `measured` 中的同名成员初始化。

两个成员子对象都属于新建的 `archived`，并不与 `measured` 共享对象身份。复制构造仍然是在初始化新对象，只是各成员的初始状态来自源对象中的对应成员。

## 复制赋值按成员修改已有对象

```cpp
pressure_snapshot displayed{180, nullptr};
displayed = measured;
```

`displayed` 已经在第一条声明中完成构造。第二条语句选择隐式声明的复制赋值运算符，并按照成员声明顺序执行对应的成员赋值：已有的整数成员接收新的整数值，已有的指针成员接收新的指针值。

赋值完成后，`displayed.pressure_kpa() == 220`。`displayed` 的对象身份没有改变，操作也没有在原位置重新构造另一个对象。

> [!IMPORTANT]
> 隐式复制构造通过成员初始化建立新对象，隐式复制赋值则通过成员赋值修改已有对象；二者都沿用每个成员类型自身的相应语义。

## 指针成员复制后保留原有别名

复制指针成员时，成员语义只复制指针值，不会沿着指针自动复制它所指向的对象：

```cpp
const bool archived_uses_same_limit{
    archived.warning_limit_target() == measured.warning_limit_target()
};

const bool displayed_uses_same_limit{
    displayed.warning_limit_target() == measured.warning_limit_target()
};
```

两个布尔值都是 `true`。三个 `pressure_snapshot` 对象各自拥有独立的指针成员子对象，但这些指针保存相同地址，因此都指向同一个 `warning_limit_kpa` 对象。

这种结果不是类复制规则擅自选择了“共享”。指针成员中的值指定一个目标对象；复制该指针值后，源成员和目标成员保留相同的指向关系，源对象原有的别名关系因此延续到副本中。若类型承诺复制后应当得到独立的外部状态，默认的指针成员语义就不能独自完成这项承诺。

## 成员约束会传递给完整类

复制构造与复制赋值分别要求不同的成员能力。复制构造需要用源对象中的对应成员初始化新成员；复制赋值需要把源成员赋给已经存在的目标成员。一个成员支持前一项操作，不代表它也支持后一项：

```cpp
struct identified_pressure {
    const int sensor_id;
    int pressure_kpa;
};

const identified_pressure measured_pressure{17, 220};
const identified_pressure saved_pressure{measured_pressure}; // 正确：初始化新成员

identified_pressure displayed_pressure{23, 180};
displayed_pressure = measured_pressure; // 错误：不能向已有的 const 成员赋值
```

复制构造能够用 `measured_pressure.sensor_id` 初始化新的 `const int` 成员，因此 `saved_pressure` 可以建立。复制赋值面对的却是 `displayed_pressure.sensor_id` 这个已经存在的 `const` 对象；它不能接收赋值，所以外围类也没有一项可用的隐式复制赋值操作。

同样地，如果某个类类型成员无法从对应源成员复制构造，外围类的隐式复制构造也不会绕过这项限制。**语言可以隐式声明复制操作，但完整类的复制能力由所有成员能否完成相应操作共同决定。**

## 参考资料

- [C++23 工作草案：复制构造函数的隐式声明与定义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制赋值运算符的隐式声明与定义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
