---
title: 动态对象的创建与独占管理（Creating and Exclusively Owning Dynamic Objects）
date: 2026-09-14
order: 1
---

# 动态对象的创建与独占管理（Creating and Exclusively Owning Dynamic Objects）

压力检查系统可以让一个传感器对象由不同管理方先后负责清理，同时让观察代码继续访问原来的传感器。这里要保留的是同一个对象；另外构造一个值相同的对象，不会让已有指针自动指向它。

`std::vector` 已经展示过两层对象关系：容器是拥有者，它管理的元素是另外的对象。对于需要独立安排生命周期的单个对象，也可以将管理责任放在一个专门的拥有者中。先建立创建、访问与清理的关系，才能准确判断交接时究竟改变了谁。

## 拥有者与被管理对象分别存在

**动态存储期（dynamic storage duration）允许对象所用的存储不直接受创建它的代码块限制。** 本章将这样创建的对象称为动态对象。它仍然需要在使用结束后销毁，并归还所用存储；存储可以独立存在，不代表清理责任可以省略。

独占所有权（exclusive ownership）把这份清理责任交给一个拥有者。拥有者可以转交责任，但不能通过复制自己，让两个拥有者同时负责销毁同一个对象。其他代码仍可以通过指针或引用借用该对象，借用者不因此承担销毁责任。

`std::unique_ptr` 是标准库提供的类模板。`std::unique_ptr<pressure_sensor>` 整体是一个具体类型，表示独占管理一个 `pressure_sensor` 的拥有者。本章使用它的默认销毁方式：需要清理目标时，销毁被管理对象并归还其存储；示例中的目标类型不定制存储分配、释放方式，析构也不向外抛出异常。

拥有者本身可以是普通局部对象。被管理的传感器另有自己的存储，并不是拥有者内部的传感器成员子对象。两者分别创建、分别销毁，拥有关系把它们的生命周期联系起来。

## 一次调用完成创建并交付拥有关系

使用 `std::unique_ptr` 和 `std::make_unique` 都需要包含 `<memory>`。

`std::make_unique` 是用于创建对象的函数模板（function template）。调用 `std::make_unique<pressure_sensor>(240.0)` 时，尖括号指定要创建的类型，圆括号提供构造实参；这里会使用 `240.0` 构造一个动态传感器，成功后按值返回管理它的 `std::unique_ptr<pressure_sensor>`。它不是先复制一个已有传感器。

通过拥有者访问目标时，`*owner` 指定被管理对象，`owner->value_kpa()` 调用该对象的成员函数。它们是 `unique_ptr` 提供的访问操作，使用前必须有有效的被管理对象。

下面的 `pressure_sensor` 只保存并提供一个压力读数：

```cpp
#include <iostream>
#include <memory>

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

  private:
    double value;
};

int main() {
    const std::unique_ptr<pressure_sensor> owner{std::make_unique<pressure_sensor>(240.0)};
    const pressure_sensor& observed{*owner};

    std::cout << owner->value_kpa() << '\n';
    std::cout << observed.value_kpa() << '\n';
}
```

程序输出两行 `240`。`owner` 是拥有者对象，`*owner` 指定动态传感器，`observed` 是对同一传感器的只读借用。绑定引用没有创建另一个传感器，也没有复制拥有关系。

`make_unique` 返回的拥有者结果用于初始化 `owner`，这沿用[同类型纯右值直接建立结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md)的规则。动态传感器的构造与拥有者结果的初始化，是不同对象上的动作。

## 空拥有者仍然是有效对象

空花括号 `std::unique_ptr<pressure_sensor> owner{};` 会创建一个没有管理目标的拥有者，不会默认创建一个传感器。

拥有者可以直接用于 `if` 条件：有目标时条件为真，没有目标时为假。这是该类型提供的布尔判断契约。下面的片段可以替换上述 `main` 函数体：

```cpp
const std::unique_ptr<pressure_sensor> empty{};

if (empty) {
    std::cout << empty->value_kpa() << '\n';
} else {
    std::cout << "no sensor\n";
}
```

输出为 `no sensor`。空拥有者能够正常查询、销毁；需要修改的非 `const` 拥有者还可以接收转交来的对象。

> [!WARNING]
> 拥有者对象存在，不代表它管理着目标。对空拥有者使用 `*` 或通过 `->` 访问成员，违反访问所需的条件，具有未定义行为；这些操作不会自动创建目标，也不能依赖它们抛出异常。

## 正常销毁与创建失败分别怎样清理

第一个程序离开 `main` 的作用域时，`owner` 的析构会销毁传感器并归还其存储。传感器没有用户编写的析构动作，但它的生命周期仍然结束，存储也仍然需要归还。

如果局部拥有者已经完成构造，随后执行的操作抛出异常，在[向处理者展开调用过程](../18-exception-propagation-and-failure-state/02-stack-unwinding-and-scope-cleanup.md)时需要销毁这个拥有者，它也会执行同样的清理。异常展开不改变拥有关系的责任规则。

创建失败发生在更早的位置。对于本章采用的普通分配方式，取得存储失败会抛出异常；目标构造函数也可能抛出异常。这些情况下，`make_unique` 不会正常返回一个表示失败的空拥有者，声明中的 `owner` 也没有完成初始化。

如果存储已经取得而目标构造失败，目标已完成构造的成员按构造失败规则清理，本次取得的存储也会归还。对于本篇由当前构造函数直接初始化成员的方式，目标自身的析构函数不会因为这次未完成的构造而执行。存储归还不依赖一个尚未建成的局部拥有者来完成。

> [!IMPORTANT]
> 拥有者与被管理对象是两个对象。成功创建后，清理责任由拥有者承担；创建过程中抛出异常，则依照失败发生的位置清理已经建立的部分，不会遗留本次为目标取得的存储。

## 独立管理需要有实际的生命周期理由

如果传感器始终由同一个外层对象管理，生命周期也自然跟随它，直接保存一个传感器成员通常更清楚。需要交付一个独立结果时，按值返回也已经能够成立，不必为了让调用者取得结果而额外分配存储。

> [!PRACTICE]
> 当管理方需要交接，而外部访问必须继续指向原来的那个对象时，可以用独占拥有者表达责任，将管理方的变化与目标身份分开。判断时应先确认普通对象的生命周期安排是否已足够，再考虑独立管理。
>
> 动态创建需要取得存储，经拥有者访问目标也增加一层间接关系。是否有性能收益取决于实际省去的工作，不能仅凭使用了指针就推断开销更低。

## 参考资料

- [C++23 工作草案：动态存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.dynamic)
- [C++23 工作草案：独占所有权](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.general)
- [C++23 工作草案：make_unique 创建对象](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.create)
- [C++23 工作草案：拥有者的访问操作](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.observers)
- [C++23 工作草案：拥有者析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor)
- [C++23 工作草案：new 表达式与构造失败](https://timsong-cpp.github.io/cppwp/n4950/expr.new)
