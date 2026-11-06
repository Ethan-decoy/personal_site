---
title: 抽象类与接口契约（Abstract Classes and Interface Contracts）
date: 2026-10-05
order: 3
---

# 抽象类与接口契约（Abstract Classes and Interface Contracts）

有时共同接口没有一个适用于所有对象的默认实现。压力来源可以是固定读数，也可以是带校准的读数，但“一个尚未选择实现的压力来源”本身没有可供读取的值。

这时可以用抽象类（Abstract Class）表达共同接口：调用方知道需要哪些操作，具体对象负责提供实现。

## 纯虚函数使接口不必提供默认行为

纯虚函数（Pure Virtual Function）在虚函数声明后使用纯说明符 `= 0`：

```cpp
class pressure_source {
  public:
    virtual int read() const = 0;
};
```

这是一个完整的类定义。`= 0` 说明 `read` 是纯虚函数，不表示“返回零”，也不是[删除函数](../15-copying-class-objects-and-copyability/04-defaulted-and-deleted-copy-operations.md#删除的函数仍然参与选择)的 `= delete`。

`pressure_source` 是抽象类，不能直接创建这个类型的完整对象。对于这里仅有一个纯虚函数的接口，派生类提供匹配的非纯虚覆盖后，就能作为具体类型创建对象。

抽象类不要求完全没有状态或普通成员实现。这里刻意只保留读取接口，是为了把“调用方需要什么”与“具体对象如何保存读数”分开。

## 具体对象共享接口，不必共享状态表示

下面是完整程序。`fixed_source` 保存一个固定值，`calibrated_source` 保存原值和修正量；它们都通过 `pressure_source` 提供千帕单位的读数。

```cpp
#include <iostream>

class pressure_source {
  public:
    virtual int read() const = 0;
};

class fixed_source : public pressure_source {
  public:
    explicit fixed_source(int value) : stored{value} {}

    int read() const override {
        return stored;
    }

  private:
    int stored;
};

class calibrated_source : public pressure_source {
  public:
    calibrated_source(int value, int adjustment) : stored{value}, offset{adjustment} {}

    int read() const override {
        return stored + offset;
    }

  private:
    int stored;
    int offset;
};

int read_pressure(const pressure_source& source) {
    return source.read();
}

int main() {
    const fixed_source fixed{220};
    const calibrated_source calibrated{220, 10};

    std::cout << read_pressure(fixed) << '\n';      // 220
    std::cout << read_pressure(calibrated) << '\n'; // 230
}
```

`read_pressure` 不知道具体对象使用几个成员，也不需要先判断对象属于哪个派生类。它依赖的是共同的 `read() const` 接口，虚调用把操作交给实际对象。

抽象类仍然可以作为基类子对象存在，也允许声明它的指针或引用。否则，`const pressure_source&` 就无法承担这个共同访问入口。

> [!IMPORTANT]
> 抽象类不能被创建为完整对象，但可以定义共同接口，并成为具体派生对象的基类部分。调用方借用这个部分，执行的虚函数实现仍由实际对象提供。

本例由具体类型的局部变量持有对象，基类只提供借用接口。需要让拥有者通过基类类型管理和销毁对象时，还必须建立[虚析构的销毁契约](04-polymorphic-ownership-and-virtual-destruction.md#通过基类销毁必须到达实际类型)。

## 声明派生类不等于已经具备具体实现

若在上面 `pressure_source` 定义之后增加：

```cpp
class pending_source : public pressure_source {};
```

这个类定义本身合法，但 `pending_source` 没有提供非纯虚的 `read` 覆盖，因此仍是抽象类。

在 `main` 中尝试创建以下任一个对象都会编译失败：

```cpp
pressure_source source; // 错误：不能创建抽象类的完整对象
pending_source pending; // 错误：read 仍然是纯虚接口
```

失败原因是类型仍然抽象，不是没有手写构造函数。只给 `pending_source` 加一个构造函数，也不能替代缺少的虚函数实现。

## 接口契约还包括操作的含义

接口契约（Interface Contract）不仅是“存在一个返回 `int` 的 `read() const`”。对于当前例子，调用方依赖返回值表示千帕单位的压力，校准来源返回经过修正的值。

编译器能够检查函数声明与覆盖关系，却无法仅凭 `int` 判断实现是否误把帕当成千帕，也无法自动判定修正公式是否正确。不同实现的状态表示可以不同，但必须履行共同接口的业务承诺。

| 接口中的要求 | 当前代码能够检查什么 | 仍需设计和实现保证什么 |
| --- | --- | --- |
| 能够通过只读访问调用 `read` | 存在匹配的 `read() const` 覆盖 | 所提供操作符合读取含义 |
| 返回 `int` | 返回类型满足这项声明 | 数值使用约定单位和业务范围 |
| 不同来源可作为同一接口使用 | 公开继承及相应转换成立 | 所有实现维护共同的前提和结果含义 |

`const` 限制当前成员函数通过调用对象进行修改的能力，不保证外部设备、共享状态或每次读数都不变。如果接口用于真实设备，还应说明读取可能怎样失败；不能从 `const` 或虚函数声明推导出“每次调用必定成功”。

这与[概念和语义契约](../33-template-constraints-and-concepts/06-constraints-and-semantic-contracts.md#概念名称和运行时状态都要有明确依据)的边界一致：语言检查能够成立的形式，设计仍然要赋予这些形式正确的含义。

## 抽象类和模板约束解决不同的接口问题

模板可以让不同类型分别满足同一组操作要求，并为实际模板实参形成对应实例。概念表达这些类型应当满足的条件，本身不会建立继承关系，也不会产生一个可以统一借用这些对象的基类类型。

抽象类则明确建立对象之间的基类关系。调用方可以使用同一种 `const pressure_source&`，在正常使用期由实际对象选择虚函数实现。

> [!PRACTICE]
> 当调用方需要通过共同对象接口使用不同实现，例如在程序运行时选择压力来源，抽象类可以保留稳定的调用入口。若函数只需对已经确定的实参类型执行一组操作，受约束的模板通常更直接。先判断需要哪种调用关系，再选择接口形式。

共同接口应当围绕一项能够成立的职责。仅因为几个类中都出现 `read` 这个名称，就要求它们继承同一基类，会掩盖操作含义和生命周期之间的差异。

## 参考资料

- [C++23 工作草案：抽象类与纯虚函数](https://timsong-cpp.github.io/cppwp/n4950/class.abstract)
- [C++23 工作草案：虚函数与覆盖](https://timsong-cpp.github.io/cppwp/n4950/class.virtual)
