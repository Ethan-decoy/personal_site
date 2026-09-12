---
title: 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）
date: 2026-09-03
order: 1
---

# 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）

复制构造函数（copy constructor）定义了从同类型对象建立新对象的复制路径。沿这条路径构造对象时，目标对象尚不存在；构造过程会建立新的完整对象，并从源对象取得初始状态：

```cpp
class tire_snapshot {
  public:
    tire_snapshot(int initial_pressure_kpa, int initial_temperature_c)
        : pressure_kpa{initial_pressure_kpa}, temperature_c{initial_temperature_c} {}

    tire_snapshot(const tire_snapshot& source)
        : pressure_kpa{source.pressure_kpa}, temperature_c{source.temperature_c} {}

    int current_pressure_kpa() const {
        return pressure_kpa;
    }

    int current_temperature_c() const {
        return temperature_c;
    }

    void set_pressure_kpa(int new_pressure_kpa) {
        pressure_kpa = new_pressure_kpa;
    }

  private:
    int pressure_kpa;
    int temperature_c;
};
```

`tire_snapshot(const tire_snapshot&)` 是 `tire_snapshot` 的复制构造函数。它接收对已有同类型对象的 `const` 引用，并用该对象的状态初始化新对象的成员。成员函数可以访问任意 `tire_snapshot` 对象的私有成员，因此构造函数能够读取 `source.pressure_kpa` 与 `source.temperature_c`。

## 复制构造建立新的对象身份

```cpp
tire_snapshot measured{220, 36};
const tire_snapshot archived{measured};
```

第二条声明对 `archived` 执行直接列表初始化（direct-list-initialization）。初始化器只有一个同类型 lvalue `measured`，它绑定到复制构造函数的 `source` 形参；两个成员初始化器随后读取源对象的成员值，分别初始化 `archived` 中对应的成员子对象。

`archived` 不是 `measured` 的另一个名称。它拥有新的对象身份，其中的两个 `int` 成员子对象也独立存在：

```cpp
measured.set_pressure_kpa(225);

const int measured_pressure_kpa{measured.current_pressure_kpa()}; // 225
const int archived_pressure_kpa{archived.current_pressure_kpa()}; // 220
```

修改源对象不会重新执行复制构造函数，也不会自动更新已经构造完成的对象。当前复制构造函数只在 `archived` 初始化期间读取 `measured` 的状态。

> [!IMPORTANT]
> 复制构造以已有同类型对象为源，建立具有独立身份的新对象；它不会把源对象本身变成新对象，也不会在两者之间自动保留同步关系。

当前快照只需要复制两个 `int` 成员，所需工作很少。[复制一份 `std::vector<double>` 采样序列](../11-sequences-and-data-access/03-sequence-copying-and-function-access.md)则需要为新序列建立独立元素，用源序列中的采样值初始化它们。两者都通过复制构造建立新对象，实际工作却不同。**复制构造的成本来自为了得到所需副本而实际执行的工作。**

## const 引用描述复制源

复制构造函数的形参不按值接收 `tire_snapshot`。下面的声明不合法：

```cpp
class tire_snapshot {
  public:
    tire_snapshot(tire_snapshot source); // 错误：不能用同类型按值形参声明这种构造函数
};
```

按值形参本身需要先初始化一个新的 `tire_snapshot` 参数对象，无法作为建立同类型复制过程的入口。`const tire_snapshot&` 直接绑定已有源对象，不为形参再创建一个 `tire_snapshot`，并允许同一项构造函数接受可修改或 `const` 源对象：

```cpp
const tire_snapshot baseline{230, 20};
const tire_snapshot parked{baseline};
```

当前接口只能通过 `source` 读取普通成员，因而复制过程不会修改 `baseline`。引用形参描述的是构造期间访问源对象的方式；它不使新对象成为引用。

## 复制初始化不等于复制构造

同一项复制构造函数也可以被复制初始化（copy-initialization）选中：

```cpp
tire_snapshot measured{220, 36};
const tire_snapshot reported = measured;
```

声明中的 `=` 属于初始化器语法，`reported` 在这条声明中才开始存在，并没有先默认构造再接受赋值。当前复制构造函数没有声明为 `explicit`，因此复制初始化可以选择它，以 `measured` 为源建立 `reported`。

直接列表初始化也能执行复制构造：

```cpp
const tire_snapshot archived{measured};
```

两组术语描述的不是同一个维度：

| 术语 | 描述的问题 |
| --- | --- |
| 直接列表初始化、复制初始化 | 源代码采用哪种初始化形式，以及怎样选择构造函数 |
| 复制构造 | 最终是否由复制构造函数建立新的同类型对象 |

复制初始化也可以从其他类型的表达式开始，并选择相应的转换构造函数；直接列表初始化也可以选择普通构造函数。因此，不能只看到花括号或 `=` 就断定是否发生复制构造，必须继续判断源表达式的类型和最终选中的构造函数。

与声明中的初始化器不同，赋值表达式要求左侧对象已经存在。若 `active` 已经完成初始化，`active = measured;` 就是在修改它的状态，而不是再次建立它。**声明中的复制初始化可以调用复制构造函数；赋值表达式则修改已有对象。判断依据是对象是否正在被初始化，而不是源码中是否出现 `=`。**

## 参考资料

- [C++23 工作草案：复制构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：初始化器](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
