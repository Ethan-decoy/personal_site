---
title: 动态对象的创建与独占管理（Creating and Exclusively Owning Dynamic Objects）
date: 2026-09-14
order: 1
---

# 动态对象的创建与独占管理（Creating and Exclusively Owning Dynamic Objects）

检查系统创建传感器后，可能需要把它交给另一个对象管理，同时让观察代码继续访问同一个传感器。要推演这种交接，先找出动态目标和负责清理它的拥有者。

## 拥有者与被管理对象分别存在

`std::make_unique` 通过 `new` 表达式取得存储并构造对象。这样创建的传感器具有动态存储期（dynamic storage duration）。即使发起创建的代码块已经结束，只要目标仍由继任的拥有者管理，它就可以继续存活。

> [!IMPORTANT] 拥有者与目标各有生命周期
> **`std::unique_ptr<T>` 与它管理的动态对象是两个对象。** 对本章采用默认删除器的单对象拥有者，析构时若仍持有目标，就销毁目标并归还存储。独占所有权（exclusive ownership）将这份清理责任交给一个拥有者，可以通过移动转交。其他代码可以借用存活的目标。

## 一次调用完成创建并交付拥有关系

`std::unique_ptr` 和 `std::make_unique` 都在 `<memory>` 中。`std::make_unique<pressure_sensor>(240.0)` 构造一个保存 `240.0` kPa 读数的传感器，成功后按值返回管理它的拥有者。这里用同类型纯右值直接初始化 `owner`。见[按值返回中的结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)。

```cpp
#include <iostream>
#include <memory>

class pressure_sensor {
  public:
    explicit pressure_sensor(const double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

    void set_value_kpa(const double value_kpa) {
        value = value_kpa;
    }

  private:
    double value;
};

int main() {
    const std::unique_ptr<pressure_sensor> owner = std::make_unique<pressure_sensor>(240.0);
    std::cout << owner->value_kpa() << '\n';

    pressure_sensor& observed{*owner};
    observed.set_value_kpa(245.0);
    std::cout << owner->value_kpa() << '\n';
}
```

程序先输出 `240`，随后输出 `245`。`*owner` 提供的是同一个传感器的引用，经这条借用写入的读数也能通过拥有者读到。

## 确认拥有者有目标再访问

空拥有者也是有效对象，可以查询和销毁。`std::unique_ptr<pressure_sensor> empty{};` 得到一个空拥有者。仍可修改的空拥有者也可以接收转交来的目标。

| 表达式 | 作用与条件 |
| --- | --- |
| `if (owner)` | 拥有者保存的指针非空时进入分支 |
| `owner.get()` | 取得保存的指针以借用目标。空拥有者返回 `nullptr` |
| `*owner`、`owner->value_kpa()` | 取得目标引用或访问目标成员。拥有者须持有可访问的目标 |

> [!WARNING] 空拥有者没有可访问的目标
> 对空拥有者执行 `*owner`，或用 `owner->` 访问成员，会违反访问前提，行为未定义。调用方要先确认目标存在，借用的使用也须落在目标的生命周期内。

## const 限制拥有者还是限制目标

> [!IMPORTANT] 拥有者的 const 与目标的 const
> **`const std::unique_ptr<T>` 中的 `const` 固定拥有关系，`std::unique_ptr<const T>` 中的 `const` 限制经拥有者对目标的修改。** 因此首例的 `owner` 可以提供可写引用。第二种拥有者本身仍可重置。

保留首例的头文件与类定义，用以下代码替换 `main` 函数体。`readonly_owner` 拥有一个实际创建为 `const pressure_sensor` 的传感器。无参 `reset()` 清空拥有者，并清理它原先持有的目标。

```cpp
std::unique_ptr<const pressure_sensor> readonly_owner =
    std::make_unique<const pressure_sensor>(250.0);
std::cout << readonly_owner->value_kpa() << '\n';
readonly_owner.reset();
std::cout << (readonly_owner.get() == nullptr) << '\n';
```

程序依次输出 `250` 和 `1`。在重置前加入 `readonly_owner->set_value_kpa(255.0);`，会因试图修改只读目标而编译失败。在首例末尾加入 `owner.reset();`，会因试图修改 `const` 拥有者而编译失败。

## 创建失败与创建成功后的清理

创建失败时，调用方尚未取得拥有者。分配失败时尚无传感器可清理。如果取得存储后目标的构造抛出异常，已完成构造的成员按规则销毁。本章采用的普通单对象分配方式有匹配的释放函数，创建表达式会归还所取得的存储。见[构造失败时的存储归还](deep-dives/01-dynamic-storage-construction-and-release.md#构造抛出异常时存储由创建过程归还)。

创建成功后，清理由拥有者接手。本章使用默认删除器，非空拥有者析构时通过单对象 `delete` 销毁传感器并归还存储。正常离开作用域和异常展开都会调用已构造完成的局部拥有者的析构函数。见[作用域绑定清理与 RAII](../16-class-object-destruction-and-resource-lifetime/03-scope-bound-cleanup-and-raii.md#让对象生命周期承载清理责任)。

## 参考资料

- [C++23 工作草案：存储期与创建方式](https://timsong-cpp.github.io/cppwp/n4950/basic.stc#1)
- [C++23 工作草案：独占所有权](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.general)
- [C++23 工作草案：make_unique 创建对象](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.create)
- [C++23 工作草案：拥有者的访问操作](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.observers)
- [C++23 工作草案：拥有者析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor#1)
- [C++23 工作草案：默认删除器](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.dltr.dflt)
- [C++23 工作草案：new 表达式与构造失败](https://timsong-cpp.github.io/cppwp/n4950/expr.new#26)
