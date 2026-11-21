---
title: 默认与删除复制操作（Defaulted and Deleted Copy Operations）
date: 2026-09-03
order: 4
---

# 默认与删除复制操作（Defaulted and Deleted Copy Operations）

类作者可以把复制能力明确写入类接口，而不必手工重复正确的逐成员实现。写在函数声明符之后的 `= default` 请求语言按照默认规则定义函数；`= delete` 则把函数声明为删除的函数（deleted function），明确禁止通过它完成调用。

> [!IMPORTANT] 复制操作的定义与调用条件
> **复制构造与复制赋值由不同函数提供，需要分别判断其定义与调用条件。**两种标记对各自函数的作用如下：
>
> | 写法 | 对这项复制接口的含义 |
> | --- | --- |
> | `= default` | 请求采用语言提供的默认定义，仍须满足各成员的相应约束 |
> | `= delete` | 保留函数声明并参与选择，但选中它的调用不合法 |

在类内定义复制操作时，两种标记都以分号结束，不再书写花括号函数体。

## 用 default 明确采用默认复制语义

`pressure_snapshot` 保存一项以千帕（kPa）为单位的压力值，复制它应当保留这项数值。下面是独立的完整程序，类定义位于 `main` 之前。本文各份完整程序彼此不拼接；错误语句只按注明的位置追加，单独考察。

```cpp
#include <iostream>

class pressure_snapshot {
  public:
    explicit pressure_snapshot(const int initial_pressure_kpa)
        : stored_pressure_kpa{initial_pressure_kpa} {}

    pressure_snapshot(const pressure_snapshot&) = default;
    pressure_snapshot& operator=(const pressure_snapshot&) = default;

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

  private:
    int stored_pressure_kpa;
};

int main() {
    const pressure_snapshot measured{220};
    const pressure_snapshot archived{measured};

    pressure_snapshot displayed{180};
    displayed = measured;

    std::cout << archived.pressure_kpa() << ' ' << displayed.pressure_kpa() << '\n';
}
```

两项默认化的函数（defaulted function）分别承担复制构造与复制赋值。对于当前只有一个 `int` 成员的类，它们都能采用默认定义：`archived{measured}` 初始化新对象的 `stored_pressure_kpa`；`displayed = measured` 则修改已有目标中的对应成员。

程序输出 `220 220`。两份目标最终保存相同的压力值，但仍分别经历复制构造和复制赋值。`= default` 让两项函数各自采用相应规则，不会把它们合并为同一个过程。

## 复制构造与复制赋值可以分别控制

本例把基线压力视为创建时确定的状态：允许从已有基线建立同值副本，已有基线不通过复制赋值替换其状态。可以为这两项能力分别选择默认定义与删除定义。

下面是另一份独立的完整程序。`approved` 保存压力为 `220` 的基线，`backup` 是新建副本；`active` 是已有的另一份基线，保留完整对象的可修改性，以便单独检查赋值接口的限制：

```cpp
#include <iostream>

class pressure_baseline {
  public:
    explicit pressure_baseline(const int initial_pressure_kpa)
        : stored_pressure_kpa{initial_pressure_kpa} {}

    pressure_baseline(const pressure_baseline&) = default;
    pressure_baseline& operator=(const pressure_baseline&) = delete;

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

  private:
    int stored_pressure_kpa;
};

int main() {
    const pressure_baseline approved{220};
    const pressure_baseline backup{approved};

    pressure_baseline active{180};
    std::cout << backup.pressure_kpa() << ' ' << active.pressure_kpa() << '\n';
}
```

程序输出 `220 180`：默认化的复制构造可以建立 `backup`，已有的 `active` 仍保存创建时的压力。若只在这份 `main` 的末尾、右花括号之前追加下面的错误语句，得到的错误变体就不能通过编译：

```cpp
active = approved; // 错误：复制赋值被删除
```

`active` 自身不是 `const` 对象，失败来自选中了被删除的复制赋值函数。这两项声明共同构成类的复制接口：允许建立副本，不保证允许用另一份记录替换已有对象的状态。

这项限制来自本例“已有基线保持创建时状态”的接口契约。其他类型是否采用同样的限制，仍需依据其公开含义判断，见[复制接口的设计边界](05-design-boundaries-of-copy-interfaces.md#类型是否应当允许复制)。

## 删除的函数仍然参与选择

对上面的 `active = approved`，需要区分选择函数与判断能否调用：

1. 重载决议仍考虑被删除的复制赋值函数。`active` 满足当前成员函数的调用条件，右侧 `approved` 可以直接绑定到 `const pressure_baseline&`，因此本例选中这项函数。
2. 选中的函数带有 `= delete`，这次调用不合法，编译器必须给出诊断。程序无法进入该函数更新成员。

> [!WARNING] 删除的最佳匹配不会让位给较差候选
> **选中的函数被删除，会使当前调用不合法；语言不会因此改选较差的匹配。**对这里的同类型源，复制赋值提供直接的引用绑定。即使另有需要转换才能匹配右侧的赋值重载，删除这个最佳匹配也不会让较差的转换路径接管。
>
> 删除函数是存在但不可调用的候选，不是从重载集合中消失的函数。

## default 不能越过成员约束

`= default` 请求采用默认定义，能否得到可用函数仍由成员条件决定。下面的 `identified_pressure` 保存来源编号与压力；编号在对象创建后固定，两份独立记录可以具有相同编号。

这又是一份独立的完整程序。它显式默认化两项复制操作，但只调用可用的创建与复制构造入口：

```cpp
#include <iostream>

class identified_pressure {
  public:
    identified_pressure(const int initial_sensor_id, const int initial_pressure_kpa)
        : sensor_id{initial_sensor_id}, stored_pressure_kpa{initial_pressure_kpa} {}

    identified_pressure(const identified_pressure&) = default;
    identified_pressure& operator=(const identified_pressure&) = default;

    int sensor_identifier() const {
        return sensor_id;
    }

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

  private:
    const int sensor_id;
    int stored_pressure_kpa;
};

int main() {
    const identified_pressure measured_pressure{17, 220};
    const identified_pressure saved_pressure{measured_pressure};

    identified_pressure displayed_pressure{23, 180};

    std::cout << saved_pressure.sensor_identifier() << ' ' << saved_pressure.pressure_kpa() << '\n';
    std::cout << displayed_pressure.sensor_identifier() << ' ' << displayed_pressure.pressure_kpa()
              << '\n';
}
```

程序输出 `17 220` 和 `23 180`。复制构造为新的 `sensor_id` 提供初值，因此可以保存源记录的编号 `17`。默认复制赋值则需要给目标中已有的 `const int` 成员赋值，成员条件不成立，这项默认化函数因而被定义为删除的。

Clang 可能在这条默认化赋值声明处提示“显式默认化的复制赋值被隐式删除”。这项警告指出赋值操作不可用，类本身及上面使用的复制构造仍然合法。

`displayed_pressure` 的完整对象保留可修改性，用来单独检查成员约束。若在这份 `main` 的末尾追加下面的错误语句，调用就会因选中了删除的函数而被拒绝。此错误变体单独考察，不接入其他完整程序：

```cpp
displayed_pressure = measured_pressure; // 错误：默认化的复制赋值不可用
```

> [!IMPORTANT] 声明存在与操作可用分别判断
> **显式写出 `= default` 不保证函数可调用；默认定义无法满足成员条件时，相应复制函数仍会被定义为删除的。**前面两种不可用的赋值声明，来由不同：
>
> | 本例中的赋值声明 | 不可调用的原因 |
> | --- | --- |
> | `pressure_baseline` 的复制赋值：`= delete` | 类接口主动禁止这项操作 |
> | `identified_pressure` 的复制赋值：`= default` | `const int sensor_id` 不支持赋值，默认化函数被定义为删除的 |

对于类类型成员也要分别检查：若某个成员无法完成当前所需的复制构造或复制赋值，外围类相应的默认化操作也不能越过这个限制。

## 参考资料

- [C++23 工作草案：显式默认化的函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.default)
- [C++23 工作草案：删除的函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.delete)
- [C++23 工作草案：复制构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
