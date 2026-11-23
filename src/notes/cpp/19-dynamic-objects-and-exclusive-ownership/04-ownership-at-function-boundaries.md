---
title: 函数边界上的借用与所有权转交（Borrowing and Ownership Transfer at Function Boundaries）
date: 2026-09-14
order: 3
---

# 函数边界上的借用与所有权转交（Borrowing and Ownership Transfer at Function Boundaries）

传感器可以交给函数查看、修改或接管。签名应当让调用方看出目标能否为空，以及调用之后谁负责清理。

## 只使用目标时，借用目标本身

下表用 `T` 表示传感器类型，`owner` 是调用方的 `std::unique_ptr<T>`。引用和指针参数的通用选择见[引用参数与调用者对象](../08-object-identity-and-lvalue-references/05-reference-parameters-and-caller-objects.md#参数形式首先表达接口契约)。

| 函数需要什么 | 形参类型 | 从拥有者调用时传什么 |
| --- | --- | --- |
| 读取必需的目标 | `const T&` | `*owner`，须先确认目标存在 |
| 修改必需的目标 | `T&` | `*owner`，目标须存在且允许修改 |
| 借用可选的目标 | `const T*` 或 `T*` | `owner.get()`，由接口约定收到 `nullptr` 时的行为 |
| 接管目标 | `std::unique_ptr<T>` | `std::move(owner)`，将非空实参的清理责任交给形参 |

> [!PRACTICE] 参数表达函数需要承担的责任
> 只读取或修改传感器时，借用目标本身，这样局部对象、成员对象和动态对象都能用同一个接口。借用须覆盖实际使用期间。函数负责清理目标或继续转交所有权时，按值接收拥有者，并约定失败路径上的责任。

## 按值接收拥有者，明确接管责任

最后一次读取结束后，`take_final_reading` 会清理接管的传感器。它在读取前拒绝空拥有者，有目标时只接受 `0.0` 到 `500.0` kPa 的读数，包含端点。

保留[上一节](02-transferring-ownership-and-object-identity.md#移动构造转交责任保留目标对象)的头文件和带析构计数的 `pressure_sensor` 定义，用以下代码替换原有的 `main`。

```cpp
struct sensor_error {};

double take_final_reading(const std::unique_ptr<pressure_sensor> sensor) {
    if (!sensor) {
        throw sensor_error{};
    }

    const double value_kpa{sensor->value_kpa()};

    if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
        throw sensor_error{};
    }

    return value_kpa;
}

int main() {
    int destructions{0};
    std::unique_ptr<pressure_sensor> owner = std::make_unique<pressure_sensor>(520.0, destructions);

    try {
        const double final_value_kpa{take_final_reading(std::move(owner))};
        std::cout << final_value_kpa << '\n';
    } catch (const sensor_error&) {
        std::cout << "reading rejected\n";
    }

    std::cout << "owner empty: " << !owner << '\n';
    std::cout << "sensor destructions: " << destructions << '\n';
}
```

传入 `520.0` kPa 时，程序输出：

```text
reading rejected
owner empty: 1
sensor destructions: 1
```

把初始读数改为 `240.0` kPa 后，第一行变为 `240`，后两行相同。传感器最迟在初始化 `final_value_kpa` 的完整表达式结束时由形参析构清理。下一条语句输出的是已取得的独立读数。

## 调用失败不会自动退回所有权

按值形参在函数体开始前已取得 `owner` 持有的目标。校验抛出时，异常展开清理仍然持有目标的形参，所以在调用方的异常处理器中，原拥有者已经为空，传感器已经销毁。若直接调用 `take_final_reading(owner)`，则会选中已删除的复制构造。

> [!WARNING] 校验前已经交接所有权
> 如果业务要求校验失败时由调用方保留传感器，可以先通过借用完成校验，成功后再转交。接管之后仍可能失败的操作，要另行约定清理或返还责任。

## 返回类型区分独立值与动态拥有关系

专门创建并返回对象的函数常称为工厂函数（factory function）。需要独立的传感器值时可以返回 `pressure_sensor`，需要把动态传感器的清理责任交付给调用方时可以返回 `std::unique_ptr<pressure_sensor>`。

保留[创建一节](01-creating-and-owning-dynamic-objects.md#一次调用完成创建并交付拥有关系)的头文件和普通 `pressure_sensor` 定义，用以下代码替换原来的 `main`。

```cpp
pressure_sensor make_sensor(const double value_kpa) {
    return pressure_sensor{value_kpa};
}

std::unique_ptr<pressure_sensor> make_owned_sensor(const double value_kpa) {
    return std::make_unique<pressure_sensor>(value_kpa);
}

int main() {
    const pressure_sensor local = make_sensor(240.0);
    const std::unique_ptr<pressure_sensor> owner = make_owned_sensor(240.0);

    std::cout << local.value_kpa() << ' ' << owner->value_kpa() << '\n';
}
```

程序输出 `240 240`。`local` 本身是传感器，`owner` 则是负责清理另一个动态传感器的拥有者。两条声明均使用[同类纯右值初始化结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)。先建立同类型非 `const` 局部拥有者再用 `return owner;` 时，沿用[具名返回与隐式移动规则](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md#具名返回值优化允许合并对象身份)。

返回局部拥有者的 `get()` 只交付借用。局部拥有者在函数退出时清理目标，返回的指针随之失效。返回借用时，接口要能保证目标存活到调用方最后一次访问。

## 参考资料

- [C++23 工作草案：形参初始化与销毁](https://timsong-cpp.github.io/cppwp/n4950/expr.call#6)
- [C++23 工作草案：异常展开](https://timsong-cpp.github.io/cppwp/n4950/except.ctor#2)
- [C++ Core Guidelines：智能指针形参表达生命周期语义](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-smartptrparam)
- [C++ Core Guidelines：按值接收 unique_ptr 表达接管](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-uniqueptrparam)
