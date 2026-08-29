---
title: 结构体与函数接口（Structs in Function Interfaces）
date: 2026-08-28
order: 5
---

# 结构体与函数接口（Structs in Function Interfaces）

结构体对象可以像已经认识的对象一样作为实参、参数与返回结果。值、引用和指针形式原有的语义没有改变，但现在一次接口选择会影响一组成员状态，而不只是一个标量值。

## 参数形式作用于完整状态

```cpp
double calculate_projected_temperature_c(tire_state state, double temperature_increase_c) {
    state.temperature_c += temperature_increase_c;
    return state.temperature_c;
}

bool needs_service(const tire_state& state) {
    return state.wear_percent >= 80;
}

void set_pressure_bar(tire_state& state, double pressure_bar) {
    state.pressure_bar = pressure_bar;
}
```

三种形式仍然具有此前建立的参数语义，但现在作用于完整的 `tire_state` 状态：

- 按值参数 `state` 是由实参初始化的独立对象，适合函数确实需要一份自己的状态；
- `const tire_state&` 直接观察调用者对象，不建立结构体副本，也不允许经该参数修改成员；
- `tire_state&` 直接指定调用者对象，成员赋值会修改原对象。

```cpp
tire_state current{2.4, 36.0, 82};

const double projected_temperature_c{calculate_projected_temperature_c(current, 12.0)};
const bool service_required{needs_service(current)};
set_pressure_bar(current, 2.5);
```

`projected_temperature_c == 48.0`，而按值参数中的修改没有传回 `current`；`service_required == true`；最后一个调用才把 `current.pressure_bar` 改为 `2.5`。结构体成员较多时，接口形式同时表达是否复制整组状态、是否允许修改原对象。

## 指针参数保留无目标状态

```cpp
void set_pressure_bar_if_present(tire_state* state, double pressure_bar) {
    if (state != nullptr) {
        state->pressure_bar = pressure_bar;
    }
}
```

`state` 是指针对象，可以保存空指针值。目标存在时，成员访问运算符 `->` 经指针确定被指对象，再选择其中的成员：

```cpp
tire_state current{2.4, 36.0, 18};

set_pressure_bar_if_present(&current, 2.1);
set_pressure_bar_if_present(nullptr, 2.1);
```

第一个调用把 `current.pressure_bar` 修改为 `2.1`；第二个调用明确表示没有目标，不执行成员访问。

对于普通对象指针，`state->pressure_bar` 与 `(*state).pressure_bar` 指定同一个成员子对象。

第二种写法中的括号不可省略：成员访问运算符 `.` 会比一元间接访问运算符 `*` 更紧密地结合。`->` 直接表达“经指针访问成员”，通常更容易阅读。

`->` 不会检查指针是否有效。执行成员访问前，指针仍须非空并且指向生命周期尚未结束的对象；当前函数先检查 `nullptr`，目标生命周期则继续由调用者保证。

## 按值返回建立结果对象

函数需要产生一组新的状态时，可以按值返回结构体：

```cpp
tire_state make_default_tire_state() {
    return tire_state{2.3, 20.0, 0};
}

tire_state spare{make_default_tire_state()};
```

返回表达式建立本次调用的 `tire_state` 值结果，再用它初始化调用者对象 `spare`。调用者获得自己的完整对象，不依赖函数体中某个局部对象继续存在。

引用返回仍然只能把已有对象身份带到调用位置，指针返回还可以表达没有目标；这些形式不会因为返回类型换成结构体而获得新的生命周期能力。

**结构体进入函数接口后，参数与返回形式仍应首先表达是否建立独立状态、是否允许修改以及目标能否缺少。**

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++ Core Guidelines：函数参数传递](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-conventional)
