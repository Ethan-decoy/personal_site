---
title: 空指针、悬空指针与有效性（Null Pointers, Dangling Pointers, and Validity）
date: 2026-08-27
order: 5
---

# 空指针、悬空指针与有效性（Null Pointers, Dangling Pointers, and Validity）

## 明确表示没有目标

指针不必始终指向对象。指针字面量（pointer literal）`nullptr` 可以转换为相应指针类型的空指针值（null pointer value），从而明确表示当前没有目标：

```cpp
int* temperature_target{nullptr};
```

`nullptr` 自身的类型是 `std::nullptr_t`。用它初始化 `int*` 时，会发生空指针转换，得到 `int*` 类型的空指针值。`temperature_target` 已经具有确定状态，只是明确表示当前没有目标；它不是未初始化指针，也不是语言保证的“整数地址 0”。

空指针可以被保存、赋值并与 `nullptr` 比较，但不能用于间接访问对象。

## 四种需要分开的状态

下面只列出当前代码会遇到的状态，不是对标准中全部指针值类别的穷举：

| 状态 | 当前含义 | 使用边界 |
| --- | --- | --- |
| 指向仍在生命周期内的对象 | 具有可用目标 | 可以，但仍须符合类型与 `const` 约束 |
| 空指针 | 具有确定值，但明确没有目标 | 可以保存、赋值和比较，不能间接访问 |
| 悬空指针 | 曾经具有目标，但当前已没有仍在生命周期内、可通过它访问的对象 | 不能再访问原对象 |
| 未初始化的自动存储期指针 | 具有不确定值 | 不可以求取其指针值 |

函数体内具有自动存储期的指针对象如果没有初始化，不会自动成为空指针。下面的代码片段位于函数体内：

```cpp
int* temperature_target;

const bool has_target{
    temperature_target != nullptr
};  // 未定义行为：比较需要读取不确定值
```

在 C++23 中，这个自动存储期指针对象具有不确定值（indeterminate value）。这条声明本身是良构的，也尚未求取该值；一旦求取这个指针值，行为便未定义，因此不能用它进行比较、复制或间接访问。

## 指针存在不等于目标存在

指针对象与被指对象具有独立生命周期：

```cpp
int* temperature_target{nullptr};

{
    int engine_temperature_c{78};
    temperature_target = &engine_temperature_c;

    *temperature_target = 82;
}

const int measured_temperature_c{*temperature_target};
// 未定义行为：engine_temperature_c 的生命周期已经结束
```

离开内层代码块时，`engine_temperature_c` 的生命周期和关联存储期结束。外层的 `temperature_target` 仍然存在，也没有自动变成空指针，但它已经失去原来的活对象目标。这种关系通常称为悬空指针（dangling pointer）。

在这个简单例子中，指针值还因为所指存储区域结束存储期而成为标准所说的无效指针值（invalid pointer value）。间接访问无效指针值会产生未定义行为；C++23 对它的其他使用也只给出由实现决定的行为，因此不应尝试复制或比较它来判断是否悬空。

“悬空”强调原来的对象已经不再存活，并且该指针当前没有重新建立可访问目标；“无效指针值”则是标准定义的具体值类别。当前例子同时满足两者，但两个术语在所有底层情形中并不完全等价。

**指针对象仍然存在或其值不是空指针，都不能证明被指对象仍在生命周期内。**

## 空值检查的能力边界

对于一个具有确定且仍可使用的指针值，与 `nullptr` 比较只能回答它是否为空：

```cpp
int engine_temperature_c{78};
int* checked_temperature_target{&engine_temperature_c};

if (checked_temperature_target != nullptr) {
    *checked_temperature_target = 80;
}
```

这项检查适用于“目标可以存在，也可以明确不存在”的关系。它不能检测悬空状态，也不能延长目标对象的生命周期。普通指针值没有携带一份能够自动追踪目标生死的记录。

当前范围内，安全的使用约束可以归结为：

- 在声明位置把指针初始化为某个对象的地址，或初始化为 `nullptr`；
- 让指针的可使用范围不超过被指对象的生命周期；
- 间接访问前，已经能够保证指针具有确定值、不是空指针，并指向类型关系允许访问的活对象。

## 参考资料

- [C++23 工作草案：不确定值](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)
- [C++23 工作草案：复合类型与指针值](https://timsong-cpp.github.io/cppwp/n4950/basic.compound)
- [C++23 工作草案：存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：空指针转换](https://timsong-cpp.github.io/cppwp/n4950/conv.ptr)
- [C++23 工作草案：nullptr](https://timsong-cpp.github.io/cppwp/n4950/lex.nullptr)
