---
title: 拥有者成员与外层对象的生命周期（Owning Members and Enclosing Object Lifetimes）
date: 2026-09-14
order: 4
---

# 拥有者成员与外层对象的生命周期（Owning Members and Enclosing Object Lifetimes）

检查对象接管传感器后，要继续保存它供后续访问。把拥有关系放进 `std::unique_ptr<pressure_sensor>` 成员，目标便可以随检查对象交接，也能在外层构造失败时由已经接管它的成员清理。

## 成员接管目标后继续管理它

`inspection` 按值接收拥有者，再用 `std::move(input)` 初始化成员 `sensor`。空检查对象是有效状态，`get_sensor()` 此时返回 `nullptr`。持有传感器时，构造函数要求读数在 `0.0` 到 `500.0` kPa 的范围内，包含端点。

保留[转交一节](02-transferring-ownership-and-object-identity.md#移动构造转交责任保留目标对象)的头文件和带析构计数的 `pressure_sensor` 定义，用以下代码替换原有的 `main`。

```cpp
struct calibration_error {};

class inspection {
  public:
    explicit inspection(std::unique_ptr<pressure_sensor> input) : sensor{std::move(input)} {
        if (sensor) {
            const double value_kpa{sensor->value_kpa()};

            if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
                throw calibration_error{};
            }
        }
    }

    const pressure_sensor* get_sensor() const {
        return sensor.get();
    }

  private:
    std::unique_ptr<pressure_sensor> sensor;
};

int main() {
    int destructions{0};
    std::unique_ptr<pressure_sensor> owner = std::make_unique<pressure_sensor>(240.0, destructions);

    try {
        inspection source{std::move(owner)};
        const pressure_sensor* const observed{source.get_sensor()};
        const inspection target{std::move(source)};

        std::cout << "source empty: " << (source.get_sensor() == nullptr) << '\n';
        std::cout << "same sensor: " << (observed == target.get_sensor()) << '\n';
        std::cout << "destructions while target lives: " << destructions << '\n';
    } catch (const calibration_error&) {
        std::cout << "inspection rejected\n";
        std::cout << "destructions at catch: " << destructions << '\n';
    }

    std::cout << "owner empty: " << !owner << '\n';
}
```

读数为 `240.0` kPa 时，程序输出：

```text
source empty: 1
same sensor: 1
destructions while target lives: 0
owner empty: 1
```

外层的默认移动调用 `sensor` 的移动操作，传感器由 `target` 持有，直到 `target` 离开作用域。拥有者成员的复制操作已删除，因此外层的默认复制也被定义为删除。外层默认析构会让成员完成清理。见[默认移动如何处理成员](../17-rvalue-references-and-move-semantics/05-generation-and-selection-of-move-operations.md#默认移动把成员分别交给相应操作)。

## 值成员和拥有者成员表达不同的生命周期

> [!PRACTICE] 按目标身份和生命周期选择成员
> 只随检查对象保存一份压力设置时，可以用值成员。移动构造的接收对象有自己的设置成员，对原设置的借用仍指向源成员。独占拥有者成员可以让接收方管理同一个动态目标。已有的借用要继续使用，接收方就须维持目标到最后一次访问。

示例的 `get_sensor()` 直接查询成员，所以移空后的源对象仍符合空状态契约。若另外保存会约束传感器是否存在的状态，还要检查移动后两个对象能否同时满足外层不变量。见[组合边界的默认移动](../17-rvalue-references-and-move-semantics/08-design-boundaries-of-move-interfaces.md#在责任边界处实现在组合边界处复用)。

## 外层构造失败，拥有者成员仍然清理目标

把 `main` 中的初始读数改为 `520.0` kPa，程序输出：

```text
inspection rejected
destructions at catch: 1
owner empty: 1
```

校验抛出时，`inspection` 尚未构造完成，`sensor` 已经接管了构造成功的传感器。异常展开析构已建成的 `sensor`，它的默认删除器负责销毁动态目标。调用方看到目标已经析构一次，原拥有者为空。见[构造失败时的成员清理](../18-exception-propagation-and-failure-state/03-construction-failure-and-member-cleanup.md#对象尚未构造完成成员也可能需要清理)。

| 失败的位置 | 当时负责清理什么 |
| --- | --- |
| `make_unique` 中传感器自身的构造失败 | 尚未交付拥有者。按[本章的普通创建方式](deep-dives/01-dynamic-storage-construction-and-release.md#构造抛出异常时存储由创建过程归还)，创建表达式归还本次取得的存储 |
| [普通函数接管后抛出](04-ownership-at-function-boundaries.md#调用失败不会自动退回所有权)，形参仍持有目标 | 按值形参在展开中清理目标 |
| 外层检查对象在成员接管后构造失败 | 已完成构造的拥有者成员在展开中清理目标 |

## 参考资料

- [C++23 工作草案：成员式复制与移动构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor#14)
- [C++23 工作草案：非委托构造失败时的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor#3)
- [C++23 工作草案：拥有者析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor#1)
