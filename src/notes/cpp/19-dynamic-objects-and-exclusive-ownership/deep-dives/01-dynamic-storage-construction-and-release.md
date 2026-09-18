---
title: 动态存储、对象构造与释放（Dynamic Storage, Object Construction, and Release）
date: 2026-09-14
order: 1
---

# 动态存储、对象构造与释放（Dynamic Storage, Object Construction, and Release）

独占拥有者能够在目标构造成功后负责清理，而目标构造失败时，本次取得的存储也会归还。要解释后一条路径，需要进一步区分：**为对象取得存储、在存储中构造对象、销毁对象、归还存储，是四项相关但不同的动作。**

本篇讨论普通单个类对象，使用标准库默认提供的全局分配与释放方式，类不定制这些操作；构造函数直接初始化成员，析构不向外抛出异常。示例中的手工创建和释放用于观察机制，日常独占管理仍采用 [make_unique 与 unique_ptr](../01-creating-and-owning-dynamic-objects.md#一次调用完成创建并交付拥有关系)。

## 创建表达式同时负责存储与初始化

`new pressure_sensor{240.0}` 是一个 new 表达式（new-expression）。`pressure_sensor` 指定要创建的类型，花括号提供初始化实参。对于本篇的类，它先取得适合该对象的存储，再以 `240.0` 构造对象；成功后产生指向该对象的 `pressure_sensor*` 指针值。

这里的存储分配（storage allocation）解决的是“对象放在哪里”，构造解决的是“在这块存储中建立什么状态”。取得一块足够的存储，并不等于类的构造函数已经成功完成。

与之对应，`delete pointer` 是 delete 表达式（delete-expression）。当 `pointer` 指向通过上述方式成功创建、尚未销毁的对象时，它先执行对象的析构过程，再归还该对象所用的存储。

| 表达式 | 对象方面的动作 | 存储方面的动作 |
| --- | --- | --- |
| `new pressure_sensor{240.0}` | 在取得的存储中构造传感器 | 先取得存储 |
| `delete pointer` | 先销毁传感器及其成员 | 随后归还存储 |

下面的传感器在构造时校验压力，并输出构造、析构发生的时点。示例假定存储分配成功，所有输出正常完成；输出本身不承担资源管理职责。

```cpp
#include <iostream>

struct pressure_error {
    double value_kpa;
};

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {
        std::cout << "construct " << value << '\n';

        if (!(value >= 0.0 && value <= 500.0)) {
            throw pressure_error{value};
        }
    }

    ~pressure_sensor() {
        std::cout << "destroy " << value << '\n';
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

程序输出：

```text
construct 240
240
destroy 240
```

`pointer` 保存 `new` 表达式成功产生的指针值。它自身是普通局部指针对象，动态传感器则使用另外取得的存储。`delete pointer` 结束的是传感器的生命周期，局部变量 `pointer` 仍要到作用域结束时才销毁。

## 分配函数与创建表达式承担不同职责

普通单对象的存储分配函数（allocation function）名为 `operator new`，对应的存储释放函数（deallocation function）名为 `operator delete`。这些名称中的 `operator` 是函数名的一部分；函数负责存储操作，`new`、`delete` 表达式还负责协调对象的构造和析构。

因此，把 `new pressure_sensor{240.0}` 理解为“只调用一次分配函数”，就漏掉了对象初始化；把 `delete pointer` 理解为“只调用一次析构函数”，也漏掉了存储归还。这里描述的是语义职责，编译器可以在标准允许的条件下省去或合并分配函数调用，不能据此推断每个表达式必然对应一次操作系统内存申请。

如果本篇采用的默认分配方式无法取得存储，会通过异常报告失败。标准库用 `<new>` 中定义的异常类型 `std::bad_alloc` 表示这种分配失败；这种 `new` 写法不会通过正常返回 `nullptr` 表示失败。此时尚未开始构造传感器，也没有一个传感器等待调用者销毁。

## 构造抛出异常时，存储由创建过程归还

构造失败发生得更晚：存储已经取得，但对象初始化没有完成。保留上例的类型定义，把 `main` 替换为以下版本：

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

在存储分配和输出正常完成的前提下，程序输出：

```text
construct 520
rejected 520
```

构造函数已经开始执行，所以出现 `construct 520`。校验随即抛出异常，构造没有成功完成，因而没有 `destroy 520`；执行也没有到达 `delete pointer`。

这条失败路径依次发生以下动作：

1. 按[构造失败的规则](../../18-exception-propagation-and-failure-state/03-construction-failure-and-member-cleanup.md#对象尚未构造完成成员也可能需要清理)清理已经完成构造的成员。本例只有 `double` 成员，没有用户编写的成员析构动作；若成员是已经建成的独占拥有者，则它负责清理自己的目标。
2. 归还本次为传感器取得的存储。
3. 异常继续传播，进入匹配的处理者。

传感器未完成构造，不调用它自身的析构函数。`new` 表达式也没有成功产生结果，因此 `pointer` 的初始化没有完成，调用者没有收到一个需要手工 `delete` 的传感器。

> [!IMPORTANT]
> 在本篇的普通分配方式下，构造失败时，已完成构造的成员按规则清理，本次取得的存储由创建过程归还。这个归还动作不依赖目标自身的析构函数，也不依赖调用者执行一条尚未到达的 `delete`。

这项保证只覆盖本次创建过程及按规则清理的成员。构造函数如果直接修改外部状态，或者另行取得了没有交给拥有者的资源，归还传感器所用的存储不会自动撤销那些操作。

## 指针变量不会自动补上清理责任

第一个程序明确执行了 `delete pointer`。如果省去这条语句，离开 `main` 时销毁局部指针，并不会因此销毁动态传感器。裸指针只是保存指针值，其销毁没有“顺便删除目标”的语义。

同样，把一个仍指向动态对象的指针直接赋值为 `nullptr`，只改变指针变量。如果程序因此失去最后一条可以定位该对象的路径，又没有拥有者承担清理，就遗失了这项资源的释放机会。这称为资源泄漏（resource leak）；单纯清空指针不能代替资源清理。

反过来，执行 `delete pointer` 也不会自动把 `pointer` 或其他别名改为空指针。指向已释放对象的旧指针不能继续用于访问，也不能再次用于删除。可以给仍然存在的指针变量重新赋值，但修改其中一个变量不会更新其他指针。

> [!WARNING]
> 能够通过指针访问一个对象，不代表可以对它执行 `delete`。本篇的单对象删除必须对应尚未释放的那次动态创建；对普通局部对象的地址执行 `delete`，或重复删除同一动态对象，都具有未定义行为。空指针可以用于 `delete`，但不会因此补救此前已经遗失的目标。

## 拥有者把成功创建后的清理连接到生命周期

对于本例，`std::make_unique<pressure_sensor>(240.0)` 会创建动态传感器，并将成功创建后的清理责任放入返回的 `std::unique_ptr<pressure_sensor>`。它仍需取得存储并调用构造函数；构造失败时仍按上述创建失败路径清理。

构造成功之后，拥有者的默认销毁方式执行单对象删除，从而把“销毁目标、归还存储”连接到拥有者的生命周期。在向处理者展开调用过程时，已完成构造的局部拥有者也能承担同样的清理。

> [!PRACTICE]
> 手工 `new` 与 `delete` 之间一旦加入可能抛出异常的操作，就需要重新判断所有退出路径是否还能到达删除语句。用 `make_unique` 直接取得拥有者，可以让成功创建后的责任立即进入 RAII 对象，由生命周期规则处理这些路径。
>
> 已由拥有者管理的目标，不应再对 `owner.get()` 的结果执行 `delete`。`get()` 只提供借用；手工删除会让拥有者保留失效指针，并在后续清理时重复处理同一目标。

## 参考资料

- [C++23 工作草案：new 表达式与初始化失败](https://timsong-cpp.github.io/cppwp/n4950/expr.new)
- [C++23 工作草案：delete 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.delete)
- [C++23 工作草案：普通单对象的存储分配与释放函数](https://timsong-cpp.github.io/cppwp/n4950/new.delete.single)
- [C++23 工作草案：构造失败的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：make_unique 的创建语义](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.create)
- [C++23 工作草案：unique_ptr 的默认删除方式](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.dltr.dflt)
