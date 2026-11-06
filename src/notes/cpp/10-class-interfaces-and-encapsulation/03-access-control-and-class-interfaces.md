---
title: 访问控制与类接口（Access Control and Class Interfaces）
date: 2026-08-29
order: 3
---

# 访问控制与类接口（Access Control and Class Interfaces）

公开数据成员让结构体成为透明的数据组合，任何能够访问对象的代码都可以直接改写其中的状态：

```cpp
struct tire_state {
    double pressure_bar;
};

tire_state front_left{2.4};
front_left.pressure_bar = -3.0;
```

C++ 的访问控制（access control）可以区分类型对外提供的操作与只由类型自身实现使用的成员。

## public 接口与 private 表示

```cpp
class tire_pressure {
  public:
    double value_bar() const {
        return stored_value_bar;
    }

    void set_value_bar(double requested_value_bar) {
        stored_value_bar = requested_value_bar;
    }

    void copy_value_from(const tire_pressure& other) {
        stored_value_bar = other.stored_value_bar;
    }

  private:
    double stored_value_bar{2.3};
};
```

`public` 与 `private` 是访问说明符（access specifier）：

- `public` 成员可以由具有相应对象的外部代码访问；
- `private` 成员只能由这个类的成员以及其他被语言规则授予访问权的代码使用。

`value_bar()` 和 `set_value_bar()` 是当前显式声明的公开操作，构成类接口（class interface）的一部分；`stored_value_bar` 是实现这些操作所使用的私有表示。外部函数可以通过引用参数使用已有对象的公开接口：

```cpp
double calibrate(tire_pressure& pressure) {
    pressure.set_value_bar(2.4);
    return pressure.value_bar();
}
```

同一个外部函数却不能直接命名私有成员：

```cpp
void overwrite_pressure(tire_pressure& pressure) {
    pressure.stored_value_bar = -3.0; // 错误：stored_value_bar 是 private 成员
}
```

访问说明符从出现的位置开始生效，直到遇到下一个访问说明符或类定义结束。它改变的是成员名称能否在某段源代码中使用，不会把私有数据加密，也不会移除成员在对象中的存储。

**类接口描述使用者能够要求对象完成什么；私有表示保留对象怎样完成这些操作的实现选择。**

## 访问权属于类

成员函数的 `private` 访问权属于整个类，而不只属于本次调用对象。一个 `tire_pressure` 成员函数也可以访问另一个 `tire_pressure` 对象的私有成员：

`copy_value_from` 的函数体既能修改调用对象的 `stored_value_bar`，也能通过 `other.stored_value_bar` 读取另一个同类型对象的私有成员。`other` 是 `const tire_pressure&`，所以这条访问路径只能读取目标对象；`private` 决定名称访问权限，`const` 决定通过该路径允许执行的操作，两者处理的是不同问题。

## struct 与 class 的默认访问

`struct` 和 `class` 都能定义类类型，也都可以拥有数据成员、成员函数和访问说明符。在当前不涉及继承的范围内，两种 class-key 的直接差别是默认成员访问：

| class-key | 未写访问说明符时的成员访问 |
| --- | --- |
| `struct` | `public` |
| `class` | `private` |

这项默认值不会把两者分成不同层级：它们都定义类类型，也都可以显式改变成员访问。当前表格只讨论成员访问；继承尚未参与这个模型。

访问控制只关闭了外部直接改写私有成员的路径。当前 `set_value_bar` 仍然会接受并写入 `-3.0`，所以这个类型还不能维持有效压力的业务约束；接口必须同时决定哪些状态转换可以发生。

## 参考资料

- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
- [C++ Core Guidelines：class 与 struct](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-struct)
