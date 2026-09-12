---
title: 成员函数与构造函数的重载（Member Function and Constructor Overloads）
date: 2026-08-29
order: 4
---

# 成员函数与构造函数的重载（Member Function and Constructor Overloads）

类中的成员函数同样可以形成重载集。本篇考察的成员函数调用仍会筛选候选函数、可行函数和最佳可行函数，但还需把调用对象纳入可行性与匹配比较：**圆括号内的显式实参参与匹配，点号左侧的调用对象也会影响这些成员函数是否可行。**

构造函数也使用重载决议。初始化对象时，初始化形式与其中的实参共同决定哪些构造函数可行，以及最终选择哪一项构造函数。

## 显式实参沿用普通重载规则

同一个类可以声明多个同名成员函数，只要它们能够按照重载规则相互区分：

```cpp
class tire_log {
  public:
    tire_log() : last_pressure_kpa{}, last_temperature_c{} {}

    void record(int pressure_kpa) {
        last_pressure_kpa = pressure_kpa;
    }

    void record(int pressure_kpa, int temperature_c) {
        last_pressure_kpa = pressure_kpa;
        last_temperature_c = temperature_c;
    }

    int pressure_kpa() const {
        return last_pressure_kpa;
    }

    int temperature_c() const {
        return last_temperature_c;
    }

  private:
    int last_pressure_kpa;
    int last_temperature_c;
};
```

两个 `record` 成员函数的显式参数数量不同，因此构成重载：

```cpp
tire_log front_left_log{};

front_left_log.record(220);
front_left_log.record(225, 36);
```

第一条调用只有单形参重载可行；第二条调用只有双形参重载可行。成员函数被选中之后，两个函数体修改的都是调用对象 `front_left_log` 中的成员。

显式参数类型不同时，隐式转换序列的比较也与普通函数相同。成员函数没有因为写在类中而获得另一套数值匹配规则。

## 调用对象的 const 限定参与匹配

尾随 `const` 可以使两个显式参数列表相同的成员函数成为不同重载。下面的类型有意提供对内部 `tire_state` 对象的可修改访问和只读访问：

```cpp
struct tire_state {
    int pressure_kpa;
    int temperature_c;
};

class tire_slot {
  public:
    tire_slot() : stored_state{220, 32} {}

    tire_state& state() {
        return stored_state;
    }

    const tire_state& state() const {
        return stored_state;
    }

  private:
    tire_state stored_state;
};
```

两个 `state` 成员函数不是依靠返回类型形成重载。真正区分它们的是第二项声明的尾随 `const`，它改变了成员函数能够接受的调用对象以及通过该对象获得的访问能力。

对于可修改的对象：

```cpp
tire_slot front_left{};
front_left.state().pressure_kpa = 225;
```

两个 `state` 重载都能由非 `const` 对象调用，但非 `const` 成员函数不需要为调用对象增加只读访问约束，因此它是更好的匹配。返回的 `tire_state&` 允许调用者修改 `front_left` 中的成员子对象。

对于 `const` 对象：

```cpp
const tire_slot parked{};
const int parked_pressure_kpa{parked.state().pressure_kpa};
```

非 `const` 成员函数不能通过 `parked` 调用，因此不可行；尾随 `const` 的成员函数成为唯一可行目标。它返回 `const tire_state&`，调用者不能通过这条访问路径修改被指代对象。

**调用对象不是源码中写在圆括号内的普通实参，却仍然参与本篇这些成员函数的可行性与匹配比较。**

一组 `const` 与非 `const` 成员函数重载应当保持同一项业务含义。当前两项 `state()` 都表示取得同一成员子对象，差别只在调用路径能够提供的修改能力。

## 构造函数也形成重载集

一个类可以提供多个构造函数，让对象从不同形式的初始信息建立完整状态：

```cpp
class tire_snapshot {
  public:
    tire_snapshot() : pressure_kpa{220}, temperature_c{20} {}

    tire_snapshot(int initial_pressure_kpa, int initial_temperature_c)
        : pressure_kpa{initial_pressure_kpa}, temperature_c{initial_temperature_c} {}

    int current_pressure_kpa() const {
        return pressure_kpa;
    }

    int current_temperature_c() const {
        return temperature_c;
    }

  private:
    int pressure_kpa;
    int temperature_c;
};
```

这两项声明都使用构造函数的特殊声明语法，并拥有不同的参数列表。初始化 `tire_snapshot` 时，它们共同作为构造函数重载参与选择：

```cpp
tire_snapshot default_snapshot{};
tire_snapshot measured_snapshot{225, 36};
```

`default_snapshot` 的初始化器没有实参，无参数构造函数是唯一可行目标。`measured_snapshot` 提供两个 `int` 实参，双形参构造函数对两项实参都是精确匹配，因此被选中。

若初始化器不能匹配任何构造函数，对象就无法完成初始化：

```cpp
tire_snapshot incomplete_snapshot{225}; // 错误：没有可行的构造函数
```

构造函数没有返回类型，也不依靠“最终要创建的对象类型”在多个候选中倒推结果。类名已经确定正在初始化 `tire_snapshot`；初始化形式与实参列表共同筛选其构造函数并确定最佳匹配。

**本篇的成员函数重载把调用对象与显式实参共同纳入选择；构造函数重载则让同一种对象拥有多条能够独立建立完整状态的初始化路径。**这些选择仍然发生在编译期，不会根据对象运行期间保存的状态改变目标。

## 参考资料

- [C++23 工作草案：候选函数与实参列表](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs)
- [C++23 工作草案：成员函数与调用对象](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：构造函数的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.ctor)
