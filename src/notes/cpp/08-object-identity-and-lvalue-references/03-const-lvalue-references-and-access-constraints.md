---
title: const 左值引用与访问约束（Const Lvalue References and Access Constraints）
date: 2026-08-28
order: 3
---

# const 左值引用与访问约束（Const Lvalue References and Access Constraints）

普通左值引用允许通过引用名称修改被绑定对象。只需要观察对象时，可以让引用的目标类型带有 `const`，把“不能经这条路径修改对象”写入类型。

## const 限定被引用类型

```cpp
int engine_temperature_c{78};
const int& displayed_temperature_c{engine_temperature_c};
```

`const int&` 读作“对 `const int` 的左值引用”。这里的 `const` 属于被引用类型 `const int`，不是把引用本身变成某个 const 对象。引用类型本身不能再被 cv 限定，因此工程交流中常说的“const 引用”，准确含义通常是“对 const 类型的引用”。

引用无论指向 `int` 还是 `const int`，绑定完成后都不能重新绑定。两种声明真正不同的是能否通过相应 lvalue 修改被引用对象：

| 声明 | 引用名称表达式的类型 | 能否经该名称修改对象 |
| --- | --- | --- |
| `int& observed_temperature_c` | `int` | 可以 |
| `const int& displayed_temperature_c` | `const int` | 不可以 |

**`const int&` 中的 `const` 约束通过引用形成的访问路径；引用不能重新绑定，则是所有普通左值引用共同遵守的规则。**

## 受限访问不会改变原对象类型

`displayed_temperature_c` 绑定普通 `int` 对象，并不会把原对象改成 `const int`：

```cpp
int engine_temperature_c{78};
const int& displayed_temperature_c{engine_temperature_c};

engine_temperature_c = 82;    // 正确：通过普通名称修改
displayed_temperature_c = 85; // 错误：不能经此路径修改
```

第一条赋值后，通过 `displayed_temperature_c` 读取会得到 `82`。引用保留的是同一个对象的身份，而不是绑定时数值 `78` 的不可修改快照。

```text
displayed_temperature_c  ──受限访问──>  engine_temperature_c
       const int&                             int 对象
```

同一个对象可以同时存在允许修改和不允许修改的访问路径。**路径上的 `const` 不会冻结对象；它只禁止代码经这条路径执行修改。**

## const 对象只能提供受限访问

对 `const` 对象可以建立 `const` 左值引用：

```cpp
const int maximum_temperature_c{120};
const int& displayed_limit_c{maximum_temperature_c};
```

普通 `int&` 不能绑定这个对象：

```cpp
int& adjustable_limit_c{maximum_temperature_c}; // 错误
```

如果允许这项绑定，就能够通过 `adjustable_limit_c` 给原来的 `const int` 对象赋值，从而绕过对象类型的限制。C++ 因此拒绝这种会丢失 `const` 访问约束的引用初始化。

普通 `int&` 还要求初始化器能够提供相容的 lvalue：

```cpp
int& observed_temperature_c{78}; // 错误：78 是 prvalue
```

这个错误不取决于数值 `78` 是否“看起来稳定”，而取决于初始化器没有提供可供 `int&` 直接绑定的 `int` lvalue。

## 引用与指针的 const 访问约束

`const int&` 与 `const int*` 都禁止经当前路径修改目标，但不会因此成为同一种关系。引用必须完成有效绑定，之后不能改换目标；指针对象仍然可以保存空指针值，也通常可以通过赋值改为指向其他对象。

访问约束与有效性也是两个问题。被引用或被指对象如果先结束生命周期，相应访问路径仍会悬空；被指类型带有 `const`，也不能证明指针当前具有目标。**引用或指针规定怎样到达目标，`const` 规定经这条路径允许怎样访问目标，两项约束不能互相替代。**

## 参考资料

- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
