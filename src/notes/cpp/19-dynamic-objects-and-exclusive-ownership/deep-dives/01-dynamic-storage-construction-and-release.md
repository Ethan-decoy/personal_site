---
title: 动态存储、对象构造与释放（Dynamic Storage, Object Construction, and Release）
date: 2026-09-14
order: 1
---

# 动态存储、对象构造与释放（Dynamic Storage, Object Construction, and Release）

创建传感器时，先要取得存储，再建立对象。若取得存储后构造抛出异常，`new` 表达式在找到匹配的释放函数时会调用它归还存储。

本篇讨论普通单个类对象，使用标准库默认提供的全局分配和释放函数。示例采用非委托构造，析构正常完成。手工创建和删除用于观察机制，日常独占管理可以用[make_unique 与 unique_ptr](../01-creating-and-owning-dynamic-objects.md#一次调用完成创建并交付拥有关系)在创建目标时取得拥有者。

## 创建表达式同时负责存储与初始化

`new pressure_sensor{240.0}` 是一个 new 表达式（new-expression）。`pressure_sensor` 指定要创建的类型，花括号提供构造实参。`delete pointer` 是 delete 表达式（delete-expression），通过保存的指针值定位要销毁的动态对象。

> [!IMPORTANT] 分配、构造、析构与释放
> **创建表达式先取得存储，再初始化对象。初始化成功后，表达式才交付指向对象的指针。** 对本篇成功创建且仍存活的动态对象，删除表达式先执行析构，再归还该对象所用的存储。

传感器保存以 kPa 为单位的读数。构造函数接受 `0.0` 到 `500.0` kPa 的读数，包含端点。程序在进入构造函数体和析构函数体时各输出一行。以下两个示例均假定存储分配成功、输出正常完成。

```cpp
#include <iostream>

struct pressure_error {
    double value_kpa;
};

class pressure_sensor {
  public:
    explicit pressure_sensor(const double value_kpa) : value{value_kpa} {
        std::cout << "enter constructor: " << value << '\n';

        if (!(value >= 0.0 && value <= 500.0)) {
            throw pressure_error{value};
        }
    }

    ~pressure_sensor() {
        std::cout << "enter destructor: " << value << '\n';
    }

    double value_kpa() const {
        return value;
    }

  private:
    double value;
};

int main() {
    pressure_sensor* const pointer{new pressure_sensor{240.0}};
    std::cout << pointer->value_kpa() << '\n';
    delete pointer;
}
```

程序输出如下。

```text
enter constructor: 240
240
enter destructor: 240
```

第二行的 `240` 来自构造完成后的读取。`pointer` 是保存动态传感器地址的局部指针对象。执行 `delete pointer` 时，传感器进入析构，指针变量自身到作用域结束时才销毁。

## 分配函数与创建表达式承担不同职责

普通单对象的存储分配函数（allocation function）名为 `operator new`，对应的存储释放函数（deallocation function）名为 `operator delete`。这两个函数负责存储操作。`new` 和 `delete` 表达式安排这些操作，并处理对象的初始化和析构。

C++23 允许实现省略可替换的全局分配函数调用，或者在满足条件时扩展一项分配，为另一个对象提供存储。这些规则影响实际的分配和释放调用次数。示例的日志记录对象操作，存储管理动作要根据相应的表达式规则判断。见[C++23 分配调用的省略与扩展](https://timsong-cpp.github.io/cppwp/n4950/expr.new#13)。

本例使用默认的抛异常分配形式。分配失败时以 `std::bad_alloc` 报告，类型定义在 `<new>` 中。失败发生时，传感器的初始化尚未开始。

## 构造抛出异常时，存储由创建过程归还

构造失败发生在取得存储之后。保留首个程序的头文件和类型定义，将 `main` 替换为下面的版本。

```cpp
int main() {
    try {
        pressure_sensor* const pointer{new pressure_sensor{520.0}};
        delete pointer;
    } catch (const pressure_error& error) {
        std::cout << "rejected " << error.value_kpa << '\n';
    }
}
```

在存储分配和输出正常完成的前提下，程序输出如下。

```text
enter constructor: 520
rejected 520
```

`enter constructor: 520` 记录进入构造函数体。读数校验随后抛出异常，传感器尚未构造完成，自身的析构函数不运行。`new` 表达式未产生指针结果，`pointer` 的初始化因此中止。控制流进入 `catch`，输出 `rejected 520`。

> [!IMPORTANT] 构造失败时由创建表达式归还存储
> **非委托构造因异常中止时，先清理已完成构造的成员。`new` 表达式找到匹配的释放函数时，会调用它归还存储，然后让异常继续传播。** 见[构造失败时的成员清理](../../18-exception-propagation-and-failure-state/03-construction-failure-and-member-cleanup.md#对象尚未构造完成成员也可能需要清理)与[C++23 初始化失败时的释放规则](https://timsong-cpp.github.io/cppwp/n4950/expr.new#26)。

本例的 `double` 成员清理时没有可见输出。默认的全局分配与释放函数满足匹配条件，因此 `new` 表达式在进入 `catch` 前调用释放函数。释放时点由语言规则给出。`try` 中的 `delete pointer` 要等创建成功后才会执行。

这项保证只覆盖本次创建过程及按规则清理的成员。构造函数如果直接修改外部状态，或者另行取得了没有交给拥有者的资源，归还传感器所用的存储不会自动撤销那些操作。

## 指针变量不会自动补上清理责任

第一个程序明确执行了 `delete pointer`。如果省去这条语句，离开 `main` 时销毁局部指针，并不会因此销毁动态传感器。裸指针只是保存指针值，其销毁没有“顺便删除目标”的语义。

把一个仍指向动态对象的指针直接赋值为 `nullptr`，只改变指针变量。如果程序因此失去最后一条可以定位该对象的路径，又没有拥有者承担清理，就遗失了释放这项资源的机会。这称为资源泄漏（resource leak）。

反过来，执行 `delete pointer` 也不会自动把 `pointer` 或其他别名改为空指针。指向已释放对象的旧指针不能继续用于访问，也不能再次用于删除。可以给仍然存在的指针变量重新赋值，但修改其中一个变量不会更新其他指针。

> [!WARNING] 单对象删除的指针前提
> 在本篇的同类型情形中，`delete` 的非空操作数须指向由单对象 `new` 创建且仍存活的目标。对普通局部对象的地址执行 `delete`，或用旧指针重复删除同一动态对象，行为未定义。空指针可以用于 `delete`，此时没有对象需要析构。

## 拥有者把成功创建后的清理连接到生命周期

创建成功后，`std::make_unique<pressure_sensor>(240.0)` 把清理责任交给返回的 `std::unique_ptr`。后续由拥有者的默认删除器执行单对象 `delete`，包括创建成功后其他操作抛出异常而展开的路径。见[创建失败与创建成功后的清理](../01-creating-and-owning-dynamic-objects.md#创建失败与创建成功后的清理)。

> [!WARNING] 通过 get 取得的地址只用于借用
> 对 `owner.get()` 的结果手工执行 `delete` 会留下仍保存旧地址的拥有者。若后续把该失效指针交给删除器，会违反删除前提，行为未定义。

## 参考资料

- [C++23 工作草案：new 表达式与初始化失败](https://timsong-cpp.github.io/cppwp/n4950/expr.new#26)
- [C++23 工作草案：delete 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.delete)
- [C++23 工作草案：普通单对象的存储分配与释放函数](https://timsong-cpp.github.io/cppwp/n4950/new.delete.single)
- [C++23 工作草案：构造失败的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：make_unique 的创建语义](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.create)
- [C++23 工作草案：unique_ptr 的默认删除方式](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.dltr.dflt)
