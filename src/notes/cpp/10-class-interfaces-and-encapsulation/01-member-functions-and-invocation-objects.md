---
title: 成员函数与调用对象（Member Functions and Invocation Objects）
date: 2026-08-29
order: 1
---

# 成员函数与调用对象（Member Functions and Invocation Objects）

结构体可以把一条轮胎的状态组织成一个对象，普通函数则可以接收这个对象并修改其中的成员：

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;
};

void set_pressure_bar(tire_state& state, double requested_pressure_bar) {
    state.pressure_bar = requested_pressure_bar;
}
```

`set_pressure_bar` 与 `tire_state` 处理的是同一项业务，但它们仍然是两个彼此分离的声明。需要直接访问或维护这种类型状态的操作，可以声明在类型内部，由此建立成员函数（member function）。

## 将操作声明为类型的成员

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;

    void set_pressure_bar(double requested_pressure_bar) {
        pressure_bar = requested_pressure_bar;
    }
};
```

`set_pressure_bar` 现在位于 `tire_state` 的类作用域中，是这个类型的成员函数。它不是某个 `tire_state` 对象内部的成员子对象，也不会让每条轮胎分别保存一份函数代码；所有这种类型的对象都使用同一项成员函数定义。

仅加入当前这种普通成员函数，不会使这个简单的 `tire_state` 失去 C++23 聚合类型的身份，因此后面的对象仍然沿用第九章建立的聚合初始化。

类型定义仍然只是在声明一种对象结构和可用操作。程序执行到成员函数调用之前，函数体中的语句不会因为写在结构体内部而自行执行。

## 由成员访问表达式发起调用

成员函数通过对象与成员函数名组成的表达式调用：

```cpp
tire_state front_left{2.4, 36.0, 18};
tire_state rear_right{2.2, 32.0, 12};

front_left.set_pressure_bar(2.5);
rear_right.set_pressure_bar(2.1);
```

在这个成员访问表达式中，`front_left` 提供调用对象；名称查找则在 `tire_state` 的类作用域中确定 `set_pressure_bar`。函数体中的

```cpp
pressure_bar = requested_pressure_bar;
```

修改的是本次调用对象中的 `pressure_bar` 成员，因此两次调用分别改变两个独立对象：

```text
front_left.set_pressure_bar(2.5)
└── front_left.pressure_bar 变为 2.5

rear_right.set_pressure_bar(2.1)
└── rear_right.pressure_bar 变为 2.1
```

普通函数版本需要把目标对象写成 `tire_state& state` 参数，再通过 `state.pressure_bar` 访问成员。成员函数调用已经由点号左侧提供了目标对象，所以这里只显式保留新的压力值作为参数。

**成员函数定义一种类型能够执行的操作；每次调用仍然必须确定这次操作所作用的具体对象。**

成员函数体位于 `tire_state` 的类作用域中，可以直接使用成员名称。`requested_pressure_bar` 是本次调用创建的形参对象；`pressure_bar` 则表示调用对象中原本存在的成员子对象。赋值读取前者的值，只改变后者的状态，不会让其他 `tire_state` 对象自动同步。

## 参考资料

- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
