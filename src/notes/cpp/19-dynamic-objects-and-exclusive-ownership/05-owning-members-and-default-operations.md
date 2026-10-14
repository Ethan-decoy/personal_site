---
title: 独占所有者的组合与默认操作（Owning Members and Default Operations）
date: 2026-09-14
order: 5
---

# 独占所有者的组合与默认操作（Owning Members and Default Operations）

一个检查对象需要接管传感器，并允许把整项检查交给另一个管理对象。观察代码仍然借用原来的传感器，因此交接不能另造一个传感器来替换它。

将 `std::unique_ptr<pressure_sensor>` 作为成员后，传感器的清理与交接已经由成员类型承担。外层设计需要回答的是：**成员的默认操作能否同时维持整个检查对象的有效状态？**

## 把已有所有权交给成员

下面的 `inspection` 按值接收拥有者，再将参数中的所有权移动到成员 `sensor`。参数是具名对象，初始化成员时仍要通过 `std::move(input)` 表达转交。

检查对象允许没有传感器。`has_sensor()` 查询是否有目标，`get_sensor()` 返回只读借用，有目标时才能经返回的指针访问传感器。返回类型中的 `const` 限制这条借用的修改能力；它不延长传感器的生命周期。

```cpp
#include <iostream>
#include <memory>
#include <utility>

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

  private:
    double value;
};

class inspection {
  public:
    explicit inspection(std::unique_ptr<pressure_sensor> input) : sensor{std::move(input)} {}

    bool has_sensor() const {
        return sensor.get() != nullptr;
    }

    const pressure_sensor* get_sensor() const {
        return sensor.get();
    }

  private:
    std::unique_ptr<pressure_sensor> sensor;
};

int main() {
    inspection source{std::make_unique<pressure_sensor>(240.0)};
    const pressure_sensor* const observed{source.get_sensor()};

    inspection target{std::move(source)};

    std::cout << source.has_sensor() << ' ' << target.has_sensor() << '\n';
    std::cout << (observed == target.get_sensor()) << '\n';
    std::cout << observed->value_kpa() << '\n';
}
```

在创建与输出正常完成时，程序输出：

```text
0 1
1
240
```

`source` 与 `target` 是两个检查对象，各有自己的拥有者成员。移动构造 `target` 时，默认移动调用成员的移动构造，传感器由 `target.sensor` 接管，`source.sensor` 变空。

`observed` 指向单独存在的动态传感器。转交没有改变该传感器的身份，因此它仍然能读到 `240`；指向检查对象 `source` 本身的借用则仍然指定 `source`，不会改指 `target`。

## 外层操作沿用成员的责任规则

`inspection` 只声明了普通业务构造函数，没有自行声明复制、移动或析构函数，满足[隐式声明移动操作的条件](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#什么时候会隐式声明移动操作)。它获得的操作由成员语义决定。下表中的转交以源、目标为不同对象为前提：

| 外层操作 | 当前成员带来的结果 |
| --- | --- |
| 复制构造 | 需要复制 `sensor`；`unique_ptr` 不能复制，因此外层隐式复制构造被定义为删除 |
| 复制赋值 | 需要向已有 `sensor` 复制赋值；成员不支持，因此外层隐式复制赋值被定义为删除 |
| 移动构造 | 移动构造拥有者成员，接管同一个传感器，使来源对象的成员变空 |
| 移动赋值 | 对拥有者成员执行移动赋值，清理目标原来管理的传感器，再接管来源对象的目标 |
| 析构 | 销毁拥有者成员；非空成员销毁传感器并归还其存储，空成员没有目标需要清理 |

例如，在上述 `main` 中继续创建一个持有 `260.0` 读数的检查对象，再把 `target` 移动赋值给它，接收方原来的传感器会被销毁，随后负责原来读数为 `240.0` 的传感器。指向旧目标的借用因此失效，`observed` 则仍指向接管来的对象。

这里没有调用 `pressure_sensor` 的复制或移动操作。传感器本身能够复制，也不意味着它的拥有者可以复制；成员的类型是 `unique_ptr<pressure_sensor>`，外层默认操作首先服从这个拥有者类型的契约。

> [!IMPORTANT]
> 资源规则已经封装在成员中时，外层可以通过默认操作复用它们。默认移动转交成员的所有权，默认析构清理仍由成员拥有的目标；外层无需再维护一份传感器清理逻辑。

如果只为“确保清理”而增加 `~inspection() = default;`，反而会改变其他操作的生成条件：这也是用户声明的析构函数，会阻止隐式声明移动操作。此时 `std::move(source)` 不能调用不存在的移动构造，而复制构造又因成员不可复制而被删除，示例就无法编译。

确有额外析构动作时，应连同需要的移动接口一起判断；若仍采用成员式移动，可以显式将对应移动操作声明为 `= default`。当前类的成员已经承担全部清理责任，因此省去这些特殊成员声明就能表达所需行为。

## 源成员变空，外层状态也必须成立

`inspection` 接受空状态，因此移动之后的 `source.has_sensor()` 为假，仍然符合接口契约。调用者可以查询、销毁它，也可以通过移动赋值让它接收另一项检查；取得传感器借用后，仍要遵守目标存在与生命周期的条件。

如果额外保存一个 `bool ready`，并把 `true` 定义为“当前一定有传感器”，默认移动就未必足够。源对象中的 `sensor` 会变空，普通布尔成员却会保留原来的值；源对象可能出现 `ready == true` 而没有传感器的冲突状态。

示例中的 `has_sensor()` 直接检查拥有者，不单独保存这项事实。因此成员变空时，查询结果自然改变，也没有第二份状态需要同步。如果实际业务还区分等待校准、校准完成等状态，则应分别定义这些状态与传感器之间的关系，不能把所有业务状态都等同于指针是否为空。

> [!PRACTICE]
> 判断默认移动是否合适，需要同时检查成员操作和外层不变量。能从拥有者直接推导的状态，可以通过查询获得；确实需要独立保存的业务状态，则要明确交接后两边应当满足什么关系。成员各自有效，不自动保证任意跨成员约束仍然成立。

## 外层构造失败，拥有者成员仍然清理目标

接管传感器后，检查对象仍可能因为读数不符合当前要求而拒绝构造。假设在 `inspection` 之前声明异常类型 `struct calibration_error {};`，并把它的构造函数替换为：

```cpp
explicit inspection(std::unique_ptr<pressure_sensor> input) : sensor{std::move(input)} {
    if (sensor) {
        const double value_kpa{sensor->value_kpa()};

        if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
            throw calibration_error{};
        }
    }
}
```

这一版本仍允许空状态；非空时，只接受 `0.0` 到 `500.0` kPa 的读数。在有匹配处理者的调用路径中，以 `std::make_unique<pressure_sensor>(520.0)` 构造检查对象，会在构造函数体中抛出异常。

此时参数中的所有权已经转入 `sensor`，成员也已完成构造。检查对象自身尚未构造完成，不调用它自身的析构函数；但[已完成构造的成员必须清理](../18-exception-propagation-and-failure-state/03-construction-failure-and-member-cleanup.md#对象尚未构造完成成员也可能需要清理)，所以 `sensor` 的析构会销毁动态传感器并归还存储。移空的参数随后销毁时，没有目标需要再次清理。

传感器不是检查对象的成员子对象，因此并非语言直接把它列入外层成员清理顺序。**语言先销毁已经建成的拥有者成员，再由拥有者履行对动态目标的清理责任。** 这使动态对象也能接入普通成员的正常销毁与构造失败路径。

接管仍然遵守函数边界上的责任约定：如果调用者先有一个拥有者，再将它移入参数，外层构造失败不会把传感器恢复给调用者。清理成功意味着没有遗留资源，不意味着撤销了所有权转交。

## 独立所有权服务于对象关系

当前设计需要让检查对象交接，而对传感器的已有借用继续指向同一目标，因此把传感器与检查对象分开存储具有实际作用。

如果成员只是一份随检查对象保存的普通压力设置，直接保存 `pressure_setting` 值成员通常更合适。它的生命周期自然跟随外层，复制与移动也依照值成员的接口进行，无须增加动态分配与间接访问。选择拥有者成员的依据是需要怎样的身份和生命周期关系；成员一旦能够表达这项关系，再判断外层默认操作是否满足业务约束。

## 参考资料

- [C++23 工作草案：复制与移动构造的隐式声明和成员式定义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制与移动赋值的隐式声明和成员式定义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：拥有者析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor)
- [C++23 工作草案：构造失败时的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
