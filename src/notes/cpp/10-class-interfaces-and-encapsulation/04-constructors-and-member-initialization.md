---
title: 构造函数与成员初始化（Constructors and Member Initialization）
date: 2026-08-29
order: 4
---

# 构造函数与成员初始化（Constructors and Member Initialization）

访问控制可以阻止外部代码直接改写私有表示，但对象从一开始仍然必须获得可用状态。构造函数（constructor）是初始化相应类对象时使用、具有特殊声明语法的一类成员函数：

```cpp
class tire_pressure {
  public:
    tire_pressure() : stored_value_bar{2.3} {}

    double value_bar() const {
        return stored_value_bar;
    }

  private:
    double stored_value_bar;
};
```

构造函数声明使用一项特殊语法：在通常出现函数名的位置写出类名 `tire_pressure`，并且不写返回类型。C++ 标准并不把构造函数描述为“拥有与类相同名称的普通函数”；这套语法专门用于标识对象初始化所使用的构造函数。

## 创建对象时调用构造函数

```cpp
tire_pressure front_left{};
```

这里的空花括号没有再按第九章的聚合规则逐个对应公开成员。`tire_pressure` 已经声明构造函数，对象初始化会选择能够接受当前实参列表的构造函数；空实参列表选择 `tire_pressure()`。

这项区别发生在相同的外层语法中：

| 类型提供的初始化机制 | `type object{arguments};` 的含义 |
| --- | --- |
| 聚合类型 | 按聚合元素规则初始化成员 |
| 当前 `tire_pressure` 类 | 选择构造函数，用实参初始化其形参并执行对象初始化 |

构造函数没有返回类型，因为它不是先计算一个普通函数返回值，再把返回值赋给对象。它参与的过程就是建立这个 `tire_pressure` 对象及其成员子对象的初始状态。

## 成员初始化列表直接初始化成员

构造函数参数列表之后、函数体之前的部分是成员初始化列表（member initializer list）：

```cpp
tire_pressure() : stored_value_bar{2.3} {}
```

`stored_value_bar{2.3}` 直接初始化 `stored_value_bar` 成员子对象。执行进入构造函数体时，成员的初始化阶段已经完成；空函数体不表示 `stored_value_bar` 尚未初始化，它此时已经保存 `2.3`。

也可以把赋值写进函数体：

```cpp
tire_pressure() {
    stored_value_bar = 2.3;
}
```

但两段代码的语义并不相同。第二种写法先让 `double` 成员经过默认初始化；它没有因此获得确定值。进入函数体后，赋值才把 `2.3` 写入已经存在的成员子对象。对于本应由初始状态直接建立的成员，成员初始化列表更准确地表达意图。

**构造函数体开始执行之前，成员子对象已经按照各自的初始化规则完成初始化。**

## 默认成员初始化器仍然参与选择

第九章使用过的默认成员初始化器也适用于类：

```cpp
class tire_pressure {
  public:
    tire_pressure() {}

    double value_bar() const {
        return stored_value_bar;
    }

  private:
    double stored_value_bar{2.3};
};
```

构造函数的成员初始化列表没有提到 `stored_value_bar`，因此默认成员初始化器提供 `2.3`。若成员初始化列表显式写出同一成员，则这次构造使用列表中的初始化器，默认成员初始化器被忽略：

```cpp
tire_pressure() : stored_value_bar{2.4} {}
```

同一个成员不会先按 `2.3` 初始化，再被列表中的 `2.4` 覆盖；本次构造只选择一个初始化器。

## 初始化顺序由声明顺序决定

一个类包含多个成员时，成员子对象始终按照它们在类定义中的声明顺序初始化，而不是按照成员初始化列表的书写顺序：

```cpp
struct tire_snapshot {
    double pressure_bar;
    double temperature_c;

    tire_snapshot(double initial_pressure_bar, double initial_temperature_c)
        : pressure_bar{initial_pressure_bar}, temperature_c{initial_temperature_c} {}
};

tire_snapshot measured{2.4, 36.0};
```

`2.4` 和 `36.0` 先分别初始化两个形参，成员初始化器再读取形参值，初始化对应的成员子对象。`pressure_bar` 先声明，因此先初始化；`temperature_c` 随后初始化。即使交换列表中的两项，真实顺序也不会改变。列表顺序与声明顺序不一致会让阅读顺序产生误导，也可能在一个成员的初始化依赖另一个成员时造成错误，因此应让两者保持一致。

前面的 `tire_pressure` 构造函数能够保证对象一开始保存 `2.3`，但这还不是完整的不变式设计：若公开操作随后可以写入任意值，初始状态的有效性无法约束对象之后的全部状态。

## 参考资料

- [C++23 工作草案：构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.ctor)
- [C++23 工作草案：基类与成员初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++ Core Guidelines：构造函数应建立类不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-complete)
