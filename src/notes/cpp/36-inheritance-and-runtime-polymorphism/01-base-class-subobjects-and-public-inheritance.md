---
title: 基类子对象与公开继承（Base-Class Subobjects and Public Inheritance）
date: 2026-10-05
order: 1
---

# 基类子对象与公开继承（Base-Class Subobjects and Public Inheritance）

一个普通压力传感器保存原始读数，一个校准传感器还保存修正量。如果调用方只需要压力传感器的共同接口，能否通过同一种引用访问这两类对象？

继承（Inheritance）建立类之间的关系。被继承的类称为基类（Base Class），继承它的类称为派生类（Derived Class）。这里先建立对象如何组成、怎样通过基类访问，以及构造时谁负责初始化哪一部分；调用是否随实际对象改变，是另一项规则。

## 派生对象包含基类子对象

在类名后写 `: public pressure_sensor`，表示 `calibrated_sensor` 公开继承 `pressure_sensor`。派生对象中包含一个 `pressure_sensor` 类型的基类子对象（Base-Class Subobject），也包含自身声明的 `offset` 成员。

派生构造函数中的 `pressure_sensor{value}` 将 `value` 交给基类构造函数，用于初始化这个基类子对象；`offset{adjustment}` 则初始化派生类自己的成员。

下面是完整程序。所有压力值与修正量的单位均为千帕。

```cpp
#include <iostream>

class pressure_sensor {
  public:
    explicit pressure_sensor(int value) : stored{value} {}

    int read() const {
        return stored;
    }

  private:
    int stored;
};

class calibrated_sensor : public pressure_sensor {
  public:
    calibrated_sensor(int value, int adjustment) : pressure_sensor{value}, offset{adjustment} {}

    int adjusted_pressure() const {
        return read() + offset;
    }

  private:
    int offset;
};

int main() {
    const calibrated_sensor source{220, 10};
    const pressure_sensor& base{source};

    std::cout << base.read() << '\n';                // 220
    std::cout << source.adjusted_pressure() << '\n'; // 230
}
```

`source` 是完整对象（Complete Object）：它不是其他对象的子对象。它内部的 `pressure_sensor` 则是子对象，随这个完整对象一起存在。若直接声明 `pressure_sensor ordinary{220};`，`ordinary` 自己就是完整对象。

`offset` 属于派生类；`stored` 属于基类部分。**基类的状态由基类子对象保存；这个子对象随派生对象构造和销毁，不是一个可以独立管理的完整对象。**

基类子对象与完整基类对象的布局不必相同，也不能据此假定基类部分一定占据派生对象的前若干字节。这里需要的是对象组成关系，不是某种内存排列。

## 基类引用借用原对象的一部分

`const pressure_sensor& base{source};` 可以成立，因为示例采用公开继承（Public Inheritance），且只有一个可明确定位的基类子对象。引用绑定到 `source` 中的基类部分，没有复制构造另一个 `pressure_sensor`。

同样的对象关系也允许把派生类指针转换为基类指针。在上面 `main` 的对象仍然存在时，可以写：

```cpp
const calibrated_sensor* derived_address{&source};
const pressure_sensor* base_address{derived_address};

std::cout << base_address->read() << '\n'; // 220
```

转换结果指向同一个完整对象中的基类子对象。引用和指针都没有取得所有权，也没有延长 `source` 的生命周期。

| 表达式或声明 | 当前关系 | 能直接使用的接口 |
| --- | --- | --- |
| `source` | 一个完整的 `calibrated_sensor` 对象 | 派生类公开接口和可访问的基类接口 |
| `const pressure_sensor& base{source}` | 借用其中的基类子对象 | `pressure_sensor` 的公开接口 |
| `const pressure_sensor* base_address{derived_address}` | 指向其中的基类子对象 | `pressure_sensor` 的公开接口 |

`base` 不能直接调用 `adjusted_pressure()`：它提供的是基类接口，基类没有声明这个成员。**能够借用一个派生对象，不等于通过基类名称能够访问派生类的全部成员。**

> [!IMPORTANT]
> 公开继承允许调用方把派生对象当作基类对象来访问。通过引用或指针进行这种访问时，完整对象仍然是原来的派生对象；改变的是当前接口和所指向的子对象，没有发生复制。

## 公开继承不取消成员的访问控制

`public` 写在继承列表中，控制继承关系的访问；它不改变基类成员自身的 `public`、`private` 声明。`calibrated_sensor` 可以调用基类的公开成员 `read()`，但不能直接读取 `pressure_sensor::stored`。

若把上面派生类的成员函数改成以下形式，会在访问 `stored` 时编译失败：

```cpp
int adjusted_pressure() const {
    return stored + offset; // 错误：stored 是基类的 private 成员
}
```

正确实现通过 `read()` 读取基类提供的状态。这使基类仍然能够维护自己的[封装边界](../10-class-interfaces-and-encapsulation/03-access-control-and-class-interfaces.md#public-接口与-private-表示)。

继承列表中的访问说明也有默认值：`class` 省略时为 `private`，`struct` 省略时为 `public`。需要向外提供公开继承关系时，显式写出 `public`，可以让接口意图更清楚。

## 派生构造函数初始化基类部分

`calibrated_sensor` 的成员初始化列表中，`pressure_sensor{value}` 选择基类构造函数来初始化基类子对象；`offset{adjustment}` 初始化派生类成员。它们不是在函数体执行后补做的赋值。

在当前只有一个基类的例子中，顺序是：

1. 构造 `pressure_sensor` 基类子对象；
2. 初始化 `calibrated_sensor` 的成员；
3. 执行 `calibrated_sensor` 的构造函数体。

因此，派生构造函数体开始执行时，基类部分已经完成构造。派生类不能直接替基类初始化 `stored`，而应通过基类构造接口交付初值。

若从示例中删去 `pressure_sensor{value}`，基类部分会尝试默认初始化。但 `pressure_sensor` 只提供了需要一个实参的构造函数，没有可用的默认构造函数，整个派生对象便无法按这种写法构造。

## 继承关系需要成立的替代语义

公开继承提供的转换是一项语言能力；“派生对象是否适合交给基类使用”仍然需要接口设计来保证。

如果基类接口的意义是“读取千帕单位的压力”，派生实现也应维护这项承诺。若派生对象需要调用者绕过基类接口，先执行某项特殊操作才能安全读取，它就未必适合通过这个共同接口替代基类对象。

> [!PRACTICE]
> 需要让不同对象通过共同接口工作时，公开继承可以表达替代关系。若一个对象只是拥有传感器，并借助它完成另一项职责，用[成员组合](../09-structures-and-object-composition/06-object-composition-and-lifetime-relationships.md#以值包含建立成员子对象)表达这种拥有关系通常更直接。选择继承的理由应当是接口关系，而不只是想复用几行实现。

示例中的 `read()` 仍是普通成员函数。基类引用能够访问原派生对象，并不意味着这个调用已经会自动选择派生类自己的实现；[虚函数](02-virtual-functions-and-overriding.md#通过基类接口选择实际对象的实现)建立的是这项调用规则。

## 参考资料

- [C++23 工作草案：派生类与基类子对象](https://timsong-cpp.github.io/cppwp/n4950/class.derived.general)
- [C++23 工作草案：基类和成员的初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++23 工作草案：继承的访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.base)
