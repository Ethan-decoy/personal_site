---
title: 虚函数与覆盖（Virtual Functions and Overriding）
date: 2026-10-05
order: 2
---

# 虚函数与覆盖（Virtual Functions and Overriding）

公开继承允许通过基类引用访问派生对象。现在让普通传感器与校准传感器都提供 `read()`：调用方能否始终写 `source.read()`，由实际对象决定是否加上修正量？

虚函数（Virtual Function）允许这种调用选择。派生类为基类虚函数提供对应实现，称为覆盖（Overriding）。通过共同接口调用、由实际对象选择实现的能力，称为运行时多态（Runtime Polymorphism）。

## 通过基类接口选择实际对象的实现

在基类成员声明前写 `virtual`，将它声明为虚函数；派生类在对应成员声明后写 `override`，要求编译器确认这个声明确实覆盖了基类虚函数。

示例还使用 `pressure_sensor::read()`。这是限定调用（Qualified Call）：明确调用基类版本，不再为这次调用选择派生实现。因此，校准版本能够复用原始读数，再加上修正量，而不会递归调用自己。

下面是完整程序，压力单位仍为千帕。

```cpp
#include <iostream>

class pressure_sensor {
  public:
    explicit pressure_sensor(int value) : stored{value} {}

    virtual int read() const {
        return stored;
    }

  private:
    int stored;
};

class calibrated_sensor : public pressure_sensor {
  public:
    calibrated_sensor(int value, int adjustment) : pressure_sensor{value}, offset{adjustment} {}

    int read() const override {
        return pressure_sensor::read() + offset;
    }

  private:
    int offset;
};

int read_pressure(const pressure_sensor& source) {
    return source.read();
}

int main() {
    const pressure_sensor ordinary{220};
    const calibrated_sensor calibrated{220, 10};

    std::cout << read_pressure(ordinary) << '\n';   // 220
    std::cout << read_pressure(calibrated) << '\n'; // 230
}
```

`read_pressure` 的形参始终是 `const pressure_sensor&`。它既没有复制目标，也没有按具体类型分别编写函数体。第二次调用借用校准对象的基类部分，虚调用选择 `calibrated_sensor::read()`，结果为 `230`。

这里只创建了普通的局部对象。虚函数调用不要求对象具有动态存储期，也不要求先使用智能指针。

## 静态类型决定接口，动态类型参与选择实现

静态类型（Static Type）是编译时表达式所具有的类型，决定名称查找、可访问的成员等编译期判断。在 `read_pressure` 的函数体中，`source` 表达式的静态类型是 `const pressure_sensor`，所以编译器从这个接口寻找 `read()`。

动态类型（Dynamic Type）描述当前表达式所指代对象的实际类型。对于这里已经完成构造、尚未开始析构的对象，第二次调用的目标是完整的 `calibrated_sensor`，因此虚调用选择它提供的覆盖版本。

这两项职责并不冲突：

| 判断 | 依据 | 示例中的结论 |
| --- | --- | --- |
| 能否写 `source.read()` | 表达式的静态类型及可访问接口 | 基类声明了公开的 `read()` |
| 对这次普通虚调用执行哪个实现 | 目标对象及它的覆盖关系 | 校准对象执行校准版本 |
| 能否写派生类独有的成员名 | 表达式的静态类型及名称查找 | 基类引用不会因此获得派生类全部接口 |

> [!IMPORTANT]
> 基类接口决定调用方能提出什么请求；虚调用让实际对象提供这个请求的对应实现。它改变函数实现的选择，没有改变表达式的静态类型，也没有产生一个新对象。

[构造和析构期间](06-virtual-calls-during-construction-and-destruction.md#调用范围随当前构造析构阶段变化)有不同的调用边界：不能把正常使用期的结论直接套到尚未构造完成或正在销毁的完整对象上。

## override 检查覆盖关系

`override` 不负责开启虚调用。基类已经声明为虚函数后，匹配的派生声明即使不重复写 `virtual`，也仍然是虚函数。`override` 的作用是让“这个函数应当覆盖基类版本”的意图接受编译期检查。

例如，在上面的 `calibrated_sensor` 中，用下面的声明替换正确版本会编译失败：

```cpp
int read() override {
    return pressure_sensor::read() + offset;
}
```

基类的版本是 `read() const`，这里漏掉了 `const`。[成员函数的 const 限定](../10-class-interfaces-and-encapsulation/02-const-member-functions-and-read-only-access.md#const-对象只能提供受限访问)是接口的一部分；这两个声明没有建立覆盖关系，`override` 会诊断这个错误。

如果连 `override` 也删掉，这个写法可以声明一个不同的非 `const` 成员，而不是覆盖基类的 `const` 虚函数。即使名字都叫 `read`，通过基类进行的原调用也不会因此改用它。

> [!PRACTICE]
> 派生类打算覆盖虚函数时写出 `override`。接口改名、形参或限定变化后，编译器能及时发现覆盖关系已经断开，避免代码仍能编译却继续调用基类版本。

## 限定调用明确选择基类版本

在前面完整程序的 `main` 中，还可以建立基类借用并进行对照：

```cpp
const pressure_sensor& source{calibrated};

std::cout << source.read() << '\n';                  // 230
std::cout << source.pressure_sensor::read() << '\n'; // 220
```

第一行调用按虚函数规则选择校准版本；第二行显式限定了基类，实现选择停在 `pressure_sensor::read()`。目标仍是同一个校准对象中的基类部分，没有复制，也没有移除 `offset`。

基类普通成员不会因为类中出现了一个虚函数就自动成为虚函数。需要让调用随对象实现变化的成员，才应当采用对应的虚函数接口。

## 多态是一项调用契约

语言规定虚调用应当选择哪个实现，没有规定必须使用某种固定布局或机器指令。实现也可能在能够确定目标类型时直接调用或内联；这些选择不改变示例的结果。

引入虚函数的工程理由是允许调用方依赖共同接口，并让不同对象履行它。若实现选择在编译时就已经确定，且泛型接口足以表达需要的操作，可以使用模板；需要通过同一种基类引用访问不同实际对象时，运行时多态提供了直接的对象关系。

性能判断要结合对象规模、调用频率和编译结果，不能从 `virtual` 一个关键字推导出固定的开销。

## 参考资料

- [C++23 工作草案：虚函数、覆盖与限定调用](https://timsong-cpp.github.io/cppwp/n4950/class.virtual)
- [C++23 工作草案：静态类型](https://timsong-cpp.github.io/cppwp/n4950/intro.defs#defns.static.type)
- [C++23 工作草案：动态类型](https://timsong-cpp.github.io/cppwp/n4950/intro.defs#defns.dynamic.type)
