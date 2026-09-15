---
title: 函数边界上的借用与所有权转交（Borrowing and Ownership Transfer at Function Boundaries）
date: 2026-09-14
order: 4
---

# 函数边界上的借用与所有权转交（Borrowing and Ownership Transfer at Function Boundaries）

函数需要访问一个传感器，和函数需要接管这个传感器，是两种不同的请求。前者只需要目标在使用期间有效；后者还要明确，调用之后由谁负责结束目标的生命周期。

拥有关系可以直接体现在参数与返回类型中。判断时先看函数是否参与生命周期管理，再决定传递目标的访问关系，还是传递拥有者。

## 只使用目标时，借用目标本身

只读取目标可以使用 `const pressure_sensor&`，需要修改目标可以使用 `pressure_sensor&`。这两种参数都要求调用者提供有效对象，不会接管销毁责任。

下面的类沿用可读取、可修改读数的传感器定义。`print_pressure` 输出当前读数，`apply_offset` 修改所传入传感器的读数；示例使用有限的小数值，不涉及量程校验。

```cpp
#include <iostream>
#include <memory>

class pressure_sensor {
  public:
    explicit pressure_sensor(double value_kpa) : value{value_kpa} {}

    double value_kpa() const {
        return value;
    }

    void set_value_kpa(double value_kpa) {
        value = value_kpa;
    }

  private:
    double value;
};

void print_pressure(const pressure_sensor& sensor) {
    std::cout << sensor.value_kpa() << '\n';
}

void apply_offset(pressure_sensor& sensor, double offset_kpa) {
    sensor.set_value_kpa(sensor.value_kpa() + offset_kpa);
}

int main() {
    const pressure_sensor local{240.0};
    const std::unique_ptr<pressure_sensor> owner{std::make_unique<pressure_sensor>(250.0)};

    print_pressure(local);
    apply_offset(*owner, 5.0);
    print_pressure(*owner);
}
```

程序输出 `240` 和 `255`。`print_pressure` 既能读取普通局部传感器，也能读取动态传感器；它不需要知道目标由哪一种对象负责管理。`apply_offset` 通过引用修改目标，调用结束后 `owner` 仍然拥有原来的传感器。

若函数允许“没有传感器”，可以使用 `const pressure_sensor*` 表达可选的只读目标，或使用 `pressure_sensor*` 表达可选的可修改目标。实现必须定义 `nullptr` 对应的行为，例如跳过本次输出；调用方可以传入 `owner.get()`，空拥有者对应空指针。

引用参数没有这项空状态。调用 `print_pressure(*owner)` 之前必须保证 `owner` 非空，并且在整个调用期间保留目标。不能先解引用空拥有者，再指望函数内部检查引用是否有效。

> [!PRACTICE]
> 函数只需要传感器本身时，参数采用相应的引用或指针，可以同时接受局部对象、成员对象和动态对象。把参数写成 `const std::unique_ptr<pressure_sensor>&` 会额外要求调用方使用这种拥有者，却不会让借用自动获得更长的生命周期。

## 按值接收拥有者，明确接管责任

如果一次最终读取完成后就应退役传感器，函数需要接管它，并在不再需要它时清理。这时可以按值接收 `std::unique_ptr<pressure_sensor>`：函数取得自己的拥有者形参，原来的拥有者交出责任。

下面的定义可放在上例的类定义之后，并替换原有 `main`；同时增加 `<utility>` 头文件以使用 `std::move`。`take_final_reading` 只接受有目标且读数处于 `0.0` 到 `500.0` kPa 的传感器，否则抛出 `sensor_error`。无论是否接受读数，本次调用都接管传感器。

```cpp
struct sensor_error {};

double take_final_reading(std::unique_ptr<pressure_sensor> sensor) {
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
    std::unique_ptr<pressure_sensor> owner{std::make_unique<pressure_sensor>(240.0)};
    const double final_value_kpa{take_final_reading(std::move(owner))};

    std::cout << final_value_kpa << '\n';

    if (!owner) {
        std::cout << "ownership transferred\n";
    }

    std::unique_ptr<pressure_sensor> rejected{std::make_unique<pressure_sensor>(520.0)};

    try {
        const double value_kpa{take_final_reading(std::move(rejected))};
        std::cout << value_kpa << '\n';
    } catch (const sensor_error&) {
        if (!rejected) {
            std::cout << "rejected and retired\n";
        }
    }
}
```

程序输出：

```text
240
ownership transferred
rejected and retired
```

调用 `take_final_reading(std::move(owner))` 时，按值形参通过移动构造取得传感器，`owner` 变空。被管理的传感器没有被移动，移动的是它的拥有关系。

函数返回的是独立的 `double` 读数，形参没有把拥有关系继续转交出去。因此，最迟在调用所在的完整表达式结束时，形参会销毁并清理传感器；之后输出的 `final_value_kpa` 不再依赖传感器存活。

参数具体在函数退出时还是在该完整表达式结束时销毁，由实现选择，不影响下一条语句开始时已经完成清理的结论。

直接调用 `take_final_reading(owner)` 无法编译：命名的 `owner` 表达式是左值，初始化按值形参会要求复制拥有者，而 `unique_ptr` 禁止复制。`std::move` 则允许形参的移动构造接管它。若调用者还需要继续拥有传感器，就不应该选择这个接管接口。

## 调用失败不会自动退回所有权

以 `520.0` 调用时，所有权先在形参初始化中转交，函数体随后才检查读数。检查失败会抛出异常，但不会逆向执行一次移动，把传感器重新交回 `rejected`。

本例的异常传播到调用者的处理者之前，拥有者形参已经销毁，传感器也已经清理；处理者看到 `rejected` 为空。此前若有人保存了对该传感器的借用，这时也已经失效。

> [!WARNING]
> 按值接收独占拥有者表示接管责任，不表示“成功才接管”。函数体执行时交接已经发生；后续失败是否返还对象，需要接口另外设计，不能依赖异常自动恢复调用者原来的拥有关系。

如果业务要求“校验失败时仍由调用方保留对象”，可以先通过借用接口完成校验，再决定是否交出所有权。但交接后若仍有可能失败的操作，就仍然需要说明那条路径上的责任，不能只因前置校验通过就推断后续一定成功。

## 返回类型区分独立值与动态拥有关系

专门创建并返回对象的函数常称为工厂函数（factory function）。它的返回类型也应反映交付内容。

如果只需要一个新传感器值，可以直接返回 `pressure_sensor`。下面两个函数都可以放在首个程序的类定义之后：

```cpp
pressure_sensor make_sensor(double value_kpa) {
    return pressure_sensor{value_kpa};
}

std::unique_ptr<pressure_sensor> make_owned_sensor(double value_kpa) {
    return std::make_unique<pressure_sensor>(value_kpa);
}
```

`make_sensor` 交付一个传感器结果，调用者可以直接用它初始化自己的对象。只有需求确实是独立管理一个动态传感器时，`make_owned_sensor` 的返回形式才准确：它创建动态目标，并把负责清理的拥有者结果交给调用者。

两者都遵循[按值返回的结果对象规则](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md)。这里 `make_unique`、`make_owned_sensor` 的同类型纯右值结果可以直接初始化接收它的拥有者；不需要为了“把结果移出去”而额外写 `std::move`。

如果工厂先建立一个非 `const` 局部拥有者，再在普通 `return owner;` 中返回它，则适用[局部对象的返回规则](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md)：可以直接在结果位置构造，未采用这一省略时也可以隐式移动。被管理的动态目标不会因为拥有者的返回路径不同而需要另建一份。

不能改成返回局部拥有者的 `get()` 来省去拥有者结果。局部拥有者一旦销毁，目标也会清理，调用者取得的裸指针不会延长它的生命周期。

> [!TIP]
> 先判断函数要交付或接收什么：独立数值用值，已有对象的访问用引用或指针，动态对象的清理责任用拥有者。参数按值接收 `unique_ptr`，返回值按值交付 `unique_ptr`，改变的都是责任归属；仅仅读取或修改目标不需要这次交接。

## 参考资料

- [C++23 工作草案：函数调用与形参销毁](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：unique_ptr 的移动构造](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.ctor)
- [C++23 工作草案：unique_ptr 的析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor)
- [C++23 工作草案：返回语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++ Core Guidelines：只在表达生命周期语义时传递智能指针](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-smartptrparam)
- [C++ Core Guidelines：按值接收 unique_ptr 表达接管](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-uniqueptrparam)
