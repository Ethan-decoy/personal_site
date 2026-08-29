---
title: const 成员函数与只读访问（Const Member Functions and Read-Only Access）
date: 2026-08-29
order: 2
---

# const 成员函数与只读访问（Const Member Functions and Read-Only Access）

读取轮胎状态的操作不需要改变调用对象。成员函数可以在参数列表之后写出 `const`，把这种访问约束声明为函数接口的一部分：

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;

    void set_pressure_bar(double requested_pressure_bar) {
        pressure_bar = requested_pressure_bar;
    }

    bool needs_service() const {
        return wear_percent >= 80;
    }
};
```

这里的 `const` 位于成员函数声明的尾部，限定的是成员函数通过本次调用对象获得的访问能力。它不修饰返回类型，也不把 `needs_service` 的 `bool` 结果变成某种新的类型。

## const 对象只能提供受限访问

```cpp
const tire_state parked{2.4, 28.0, 82};
const bool parked_service_required{parked.needs_service()};
```

`parked` 是 `const tire_state` 对象。调用 `needs_service` 只读取它的 `wear_percent`，与成员函数声明的只读访问约束一致，因此这次调用合法。

普通的非 `const` 对象也可以调用 `const` 成员函数：

```cpp
tire_state front_left{2.4, 36.0, 18};
const bool front_left_service_required{front_left.needs_service()};
```

非 `const` 对象能够提供比函数所需更强的访问能力，而函数在本次调用中仍然只按 `const` 接口使用它。

与之相对，普通的非 `const` 成员函数没有作出这项承诺：

```cpp
parked.set_pressure_bar(2.5); // 错误
```

允许这次调用就可能通过 `parked` 改变对象，因此 `const` 对象不能调用当前这种非 `const` 成员函数。

## 函数体受到同一项约束

在 `const` 成员函数中，调用对象的普通数据成员不能通过这条访问路径被修改：

```cpp
bool needs_service() const {
    wear_percent = 100; // 错误
    return wear_percent >= 80;
}
```

这与 `const int&` 不能用于修改其所指代对象的模型一致：`const` 描述的是当前访问路径允许进行什么操作。原本可修改的对象不会因为调用一次 `const` 成员函数而永久变成 `const`，函数返回后仍可通过其他非 `const` 路径修改它。

**尾随 const 约束成员函数通过调用对象进行的访问，而不是宣称整个程序中的对象状态都不会改变。**

## 外部对象仍然可能改变

如果调用对象包含指向外部对象的指针成员，尾随 `const` 会阻止函数改写这个指针成员本身，却不会自动为被指向对象增加 `const`：

```cpp
struct tire_monitor {
    tire_state* observed_tire;

    void mark_observed_tire_as_worn() const {
        observed_tire->wear_percent = 100;
    }
};

tire_state front_left{2.4, 36.0, 18};
const tire_monitor monitor{&front_left};

monitor.mark_observed_tire_as_worn();
```

在 `mark_observed_tire_as_worn` 中，下面的操作不合法：

```cpp
observed_tire = nullptr; // 错误：试图改写调用对象的指针成员
```

但 `observed_tire` 保存的是 `tire_state*`，指针值仍然允许修改它所指向的非 `const` 对象。于是合法调用会把 `front_left.wear_percent` 改为 `100`。

尾随 `const` 不保证函数不会改变外部对象。它只准确表达一条边界：当前成员函数不能通过调用对象修改它的普通成员子对象。

## 参考资料

- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：this 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.this)
- [C++ Core Guidelines：const 成员函数](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-const)
