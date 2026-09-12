---
title: 默认与删除复制操作（Defaulted and Deleted Copy Operations）
date: 2026-09-03
order: 4
---

# 默认与删除复制操作（Defaulted and Deleted Copy Operations）

类作者可以把复制能力明确写入类接口，而不必手工重复正确的逐成员实现。写在函数声明符之后的 `= default` 请求语言按照默认规则定义函数；`= delete` 则把函数声明为删除的函数（deleted function），明确禁止通过它完成调用。

| 写法 | 对复制接口的含义 |
| --- | --- |
| `= default` | 显式采用语言提供的默认定义，但仍须满足各成员的相应约束 |
| `= delete` | 保留函数声明并参与选择，但选中它的调用不合法 |

在类内定义复制操作时，两种标记都以分号结束，不再书写花括号函数体。

## 用 default 明确采用默认复制语义

```cpp
class pressure_snapshot {
  public:
    explicit pressure_snapshot(int initial_pressure_kpa)
        : stored_pressure_kpa{initial_pressure_kpa} {}

    pressure_snapshot(const pressure_snapshot&) = default;
    pressure_snapshot& operator=(const pressure_snapshot&) = default;

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

  private:
    int stored_pressure_kpa;
};
```

两项默认化的函数（defaulted function）分别承担复制构造与复制赋值。对于当前只有一个 `int` 成员的类，它们能够按成员语义完成定义：复制构造初始化新的 `stored_pressure_kpa`，复制赋值修改目标对象中已经存在的 `stored_pressure_kpa`。

```cpp
const pressure_snapshot measured{220};
const pressure_snapshot archived{measured};

pressure_snapshot displayed{180};
displayed = measured;
```

`archived` 与 `displayed` 最终都保存 `220`，但两条语句仍分别执行复制构造和复制赋值。`= default` 不把两种操作合并为同一个过程，它只是让各自采用相应的默认定义。

## 复制构造与复制赋值可以分别控制

复制构造决定能否从源对象建立新对象，复制赋值决定能否用源对象修改已有对象。两项能力由不同函数提供，因此可以分别声明：

```cpp
class pressure_baseline {
  public:
    explicit pressure_baseline(int initial_pressure_kpa)
        : stored_pressure_kpa{initial_pressure_kpa} {}

    pressure_baseline(const pressure_baseline&) = default;
    pressure_baseline& operator=(const pressure_baseline&) = delete;

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

  private:
    int stored_pressure_kpa;
};

const pressure_baseline approved{220};
const pressure_baseline backup{approved}; // 正确：复制构造被允许

pressure_baseline active{180};
active = approved; // 错误：复制赋值被删除
```

`pressure_baseline` 明确允许从已有基线建立新对象，却不允许把另一个基线的状态赋给已经存在的对象。这里的两项声明共同构成类的复制接口；允许其中一项不会自动允许另一项。

这种组合应当来自类型语义，而不是为了修补某个调用点随意选择。语言提供分别控制的能力，不会替类作者证明当前类型为什么适合这组接口。

## 删除的函数仍然参与选择

`= delete` 不等于没有声明 `operator=`。在 `active = approved` 中，删除的复制赋值运算符仍然进入候选并参与重载决议。它与同类型右操作数精确匹配，因而会被选中；选择完成后，程序因为试图调用删除的函数而不合法。

这项顺序使 `= delete` 能够明确阻止某种调用。若类中还有需要转换才能匹配的赋值重载，精确匹配的删除函数仍会优先被选中；这些更宽的接口不能接管已经明确禁止的同类型赋值。

**删除函数是存在但不可调用的候选，不是从重载集合中消失的函数。**

## default 不能越过成员约束

`= default` 是采用默认定义的请求，不是强制语言生成一项必然可用的操作：

```cpp
class identified_pressure {
  public:
    identified_pressure(int initial_sensor_id, int initial_pressure_kpa)
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
```

默认化的复制构造函数可以定义：新对象的 `sensor_id` 由源对象的成员初始化。默认化的复制赋值运算符却需要向目标对象中已经存在的 `const int` 成员赋值，这项成员操作不成立，因此该复制赋值运算符会被定义为删除的。

```cpp
const identified_pressure measured_pressure{17, 220};
const identified_pressure saved_pressure{measured_pressure}; // 正确

identified_pressure displayed_pressure{23, 180};
displayed_pressure = measured_pressure; // 错误：默认化的复制赋值不可用
```

显式写出 `= default` 没有绕开 `sensor_id` 的 `const` 约束。对于类类型成员也遵循相同原则：只要某个成员无法完成当前所需的复制操作，外围类相应的默认化操作就不能获得一份越过该限制的实现。

**`= default` 在成员约束允许时采用默认复制语义；`= delete` 明确保留并禁止一项函数。复制构造和复制赋值可以分别控制，但任何声明方式都不能替成员类型提供它本来不具备的操作。**

## 参考资料

- [C++23 工作草案：显式默认化的函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.default)
- [C++23 工作草案：删除的函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.delete)
- [C++23 工作草案：复制构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
