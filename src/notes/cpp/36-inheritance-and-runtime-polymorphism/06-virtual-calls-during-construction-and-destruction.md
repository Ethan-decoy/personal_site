---
title: 构造析构期间的虚调用（Virtual Calls during Construction and Destruction）
date: 2026-10-05
order: 6
---

# 构造析构期间的虚调用（Virtual Calls during Construction and Destruction）

正常使用一个派生对象时，基类接口中的虚调用可以到达派生覆盖。但基类构造函数开始执行时，派生成员还没有完成初始化；基类析构函数开始执行时，派生部分又已经完成销毁。

如果这些阶段仍调用依赖派生状态的实现，就会把尚未建立或已经结束的状态当作可用状态。虚调用因此具有与当前构造、析构阶段相应的边界。

## 调用范围随当前构造析构阶段变化

从构造函数或析构函数直接、间接发起虚调用，且目标是**这个正在构造或析构的对象**时，调用选择以当前正在执行构造或析构的类为界，不会进入更派生类的覆盖。

在单层继承中，基类构造期间调用基类版本；派生构造函数体中可以调用派生版本。析构过程按反向顺序收缩：派生析构函数体中仍可调用派生版本，进入基类析构阶段后则调用基类版本。

下面是完整程序。输出用于显示五个不同阶段，压力单位仍为千帕。

```cpp
#include <iostream>

class pressure_sensor {
  public:
    pressure_sensor() {
        std::cout << "base construction: " << read() << '\n';
    }

    virtual ~pressure_sensor() {
        std::cout << "base destruction: " << read() << '\n';
    }

    virtual int read() const {
        return 220;
    }
};

class calibrated_sensor : public pressure_sensor {
  public:
    explicit calibrated_sensor(int adjustment) : offset{adjustment} {
        std::cout << "derived construction: " << read() << '\n';
    }

    ~calibrated_sensor() override {
        std::cout << "derived destruction: " << read() << '\n';
    }

    int read() const override {
        return pressure_sensor::read() + offset;
    }

  private:
    int offset;
};

int main() {
    const calibrated_sensor source{10};
    std::cout << "normal use: " << source.read() << '\n';
}
```

输出为：

```text
base construction: 220
derived construction: 230
normal use: 230
derived destruction: 230
base destruction: 220
```

基类构造先于 `offset` 初始化，所以第一项调用没有读取 `offset`。派生构造函数体开始时，基类和成员已经初始化，校准版本可以读取修正量。派生析构函数体先于它的成员销毁，校准版本此时也仍然能够读取这个成员。

最后进入基类析构阶段时，调用选择回到基类版本，不再依赖派生部分。

示例中的调用都位于函数体。在成员初始化列表中，对当前对象调用 `read` 这类成员函数时，如果当前类的基类初始化尚未全部完成，行为未定义；代码可能通过编译。基类初始化完成后，调用仍不能读取尚未初始化的成员值。

| 调用发生的位置 | 示例选择的实现 | 对派生状态的使用边界 |
| --- | --- | --- |
| 基类构造函数体 | `pressure_sensor::read` | 派生成员尚未初始化 |
| 派生构造函数体 | `calibrated_sensor::read` | 当前基类和成员已经完成初始化 |
| 完整对象的正常使用期 | `calibrated_sensor::read` | 对象必须保持有效 |
| 派生析构函数体 | `calibrated_sensor::read` | 当前派生成员尚未销毁 |
| 基类析构函数体 | `pressure_sensor::read` | 派生销毁阶段已经结束 |

> [!IMPORTANT]
> 虚调用服从对象当前的构造、析构阶段。基类代码不能在这些阶段借助虚函数，要求更派生部分提供正常使用期的行为；加上 `virtual` 或 `override` 都不会越过这条边界。

## 把调用放进辅助函数不会改变阶段

规则不仅适用于构造函数体中直接写出的 `read()`。如果基类构造函数把自身交给一个辅助函数，再由辅助函数调用虚函数，目标仍是这个正在构造的对象，调用边界仍停在基类阶段。

例如，普通函数 `read_pressure(const pressure_sensor&)` 中的 `source.read()` 并没有固定为基类或派生类实现。正常使用期借用校准对象时，它可以调用校准版本；若它从该对象的基类构造阶段被调用，目标是这个尚未完成构造的对象，就按当前阶段选择基类版本。

**把虚调用移出构造函数的字面位置，不等于把对象移出了构造过程。**

这项限制也不能扩大成“构造函数里的所有虚调用都只用基类版本”。如果目标是另一个已经完成构造、尚未开始析构的对象，就仍按那个目标的正常虚调用关系处理。判断时要同时定位调用阶段和目标对象。

## 纯虚接口不能承担基类阶段的虚调用

如果 `pressure_source::read` 是纯虚函数，那么在 `pressure_source` 的构造或析构期间，对当前对象直接或间接发起 `read` 的虚调用，行为未定义。

原因不是派生类“忘记写 `override`”。即使具体派生类正确提供了实现，基类阶段也不会调用它。不能设计成“抽象基类在构造时先调用读取接口，由派生对象准备数据”。

> [!WARNING]
> 构造或析构期间，对当前对象的虚调用若到达纯虚函数，行为未定义。编译器可能给出诊断，也可能在链接或运行时表现异常；某种特定表现不是语言保证，不能把它当作可用的初始化协议。

纯虚函数允许另行提供定义，但这也不能使上述虚调用变得合法。显式限定调用某个已有定义则是另一种调用方式，它不会通过虚调用转交给派生实现；是否能够安全使用该定义，仍要按当前阶段和实际状态判断。

## 每一层建立和结束自己的状态

构造顺序意味着基类先建立自己的有效状态，派生类再建立新增的状态。正常的多态操作可以在完整对象成功构造后，由普通使用代码发起。

析构时，派生类先结束自己的职责，再由基类结束基类部分。管理资源的成员应当沿已有的 [RAII 关系](../16-class-object-destruction-and-resource-lifetime/03-scope-bound-cleanup-and-raii.md#让对象生命周期承载清理责任)自行清理，而不是要求基类析构函数虚调用一个派生清理钩子。

> [!PRACTICE]
> 如果一项操作需要完整派生状态，把它放在构造完成后的正常调用中，并让初始化协议表达清楚对象何时可用。析构则让每一层及其资源成员完成自身清理，避免依赖基类阶段的虚调用去访问派生状态。

虚析构使通过基类销毁能够进入正确的派生析构路径，但不会让基类析构函数体中的其他虚调用继续选择派生版本。这两项规则分别处理销毁入口与销毁期间的调用边界。

## 参考资料

- [C++23 工作草案：构造和析构期间的成员调用](https://timsong-cpp.github.io/cppwp/n4950/class.cdtor)
- [C++23 工作草案：基类和成员的初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++23 工作草案：抽象类与构造析构期间的纯虚调用](https://timsong-cpp.github.io/cppwp/n4950/class.abstract)
