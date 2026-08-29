---
title: 对象组合与生命周期关系（Object Composition and Lifetime Relationships）
date: 2026-08-28
order: 6
---

# 对象组合与生命周期关系（Object Composition and Lifetime Relationships）

用户定义类型不仅能包含基本类型成员，也能直接包含另一种结构体对象。由完整对象与成员子对象逐层建立更大对象的方式称为对象组合（object composition）。

## 以值包含建立成员子对象

```cpp
struct wheel_state {
    tire_state tire;
    int rotation_count;
};

wheel_state front_left_wheel{tire_state{2.4, 36.0, 18}, 120};
```

`front_left_wheel` 是完整 `wheel_state` 对象，其中直接包含：

- 一个 `tire_state` 成员子对象 `front_left_wheel.tire`；
- 一个 `int` 成员子对象 `front_left_wheel.rotation_count`。

`front_left_wheel.tire` 又包含自己的三个成员子对象。成员访问可以沿组合关系继续确定目标：

```cpp
front_left_wheel.tire.pressure_bar = 2.5;
```

第一个 `.` 在 `front_left_wheel` 中确定 `tire`，第二个 `.` 再在这个 `tire_state` 成员子对象中确定 `pressure_bar`。最终被赋值的是唯一的 `double` 成员子对象 `front_left_wheel.tire.pressure_bar`。

```text
front_left_wheel
├── tire
│   ├── pressure_bar
│   ├── temperature_c
│   └── wear_percent
└── rotation_count
```

**以值包含另一种对象，会在完整对象内部建立一个真正的成员子对象。**

复制 `wheel_state` 时，成员复制规则会逐层应用：新的 `tire` 成员由源对象的 `tire` 初始化，其中的基本类型成员再按各自语义复制；若某一层包含指针成员，复制到该层时仍然只复制指针值。

创建 `front_left_wheel` 时，直接成员按照声明顺序初始化，先建立 `front_left_wheel.tire`，再建立 `front_left_wheel.rotation_count`。`front_left_wheel.tire` 的存储期与 `front_left_wheel` 相同，并在外层对象的初始化和销毁过程中自动完成自身的初始化与销毁；引用或指针不会把它保留到包含它的存储期结束之后。

## 指针成员只建立外部关联

结构体也可以把指针对象作为成员：

```cpp
struct tire_monitor {
    const tire_state* observed_tire{nullptr};
};

tire_state current{2.4, 36.0, 18};
tire_monitor monitor{&current};
```

`monitor` 直接包含的是 `const tire_state*` 指针成员子对象。在当前类型设计中，这个裸指针用于观察外部对象；`current` 仍然是位于 `monitor` 外部的独立完整对象：

```text
monitor
└── observed_tire  ──指向──>  current
    指针成员子对象             独立 tire_state 对象
```

销毁 `monitor` 会结束指针成员的生命周期，不会因此销毁 `current`。反过来，`current` 先结束生命周期时，指针成员不会自动变为空。下面的片段位于函数体内：

```cpp
tire_monitor monitor{nullptr};

{
    tire_state temporary{2.4, 36.0, 18};
    monitor.observed_tire = &temporary;
}

double pressure_bar{monitor.observed_tire->pressure_bar}; // 未定义行为
```

离开内部代码块后，`temporary` 已经销毁，`monitor.observed_tire` 成为悬空指针。它仍然保存一个非空指针值，但不再具有可访问的目标。

**指针成员属于完整对象；被它指向的外部对象并不因此成为成员，也不会因此获得相同的生命周期。**

## 组合表达强生命周期关系

直接成员与指针成员表达两种不同关系：

| 成员形式 | 完整对象直接包含什么 | 目标能否缺少 | 所表达的对象是否为成员子对象 |
| --- | --- | --- | --- |
| `tire_state tire;` | `tire_state` 成员子对象 | 不能 | 是 |
| `const tire_state* observed_tire;` | 指针成员子对象 | 可以为空 | 否 |

对象在概念上就是完整状态的一部分，并且应当与外层对象共同存在时，以值组合能够直接表达这项约束。只是观察某个独立对象、允许没有目标，或目标由其他作用域维持时，指针成员表达的是外部关联，使用者必须另外保证目标有效。

简单结构体能够把状态组织、复制并逐层组合，却不会自动阻止互相矛盾的成员值。例如，代码仍然可以同时写入负压力和超过合理范围的磨损比例。公开成员适合直接表示没有额外约束的数据；类型需要持续维护成员之间的业务条件时，仅有这种数据组合还不够。

## 参考资料

- [C++23 工作草案：对象与子对象](https://timsong-cpp.github.io/cppwp/n4950/intro.object)
- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：成员初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
