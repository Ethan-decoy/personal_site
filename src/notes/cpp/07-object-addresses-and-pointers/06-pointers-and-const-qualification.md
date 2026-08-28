---
title: 指针与 const 限定（Pointers and const Qualification）
date: 2026-08-27
order: 6
---

# 指针与 const 限定（Pointers and const Qualification）

## const 可以约束两个不同层次

指针声明同时涉及指针对象和被指类型，`const` 因此可能约束其中任意一层：

| 声明 | 目标有效时，类型是否允许经指针修改 | 指针对象能否重新指向 |
| --- | --- | --- |
| `int* target` | 可以 | 可以 |
| `const int* target` | 不可以 | 可以 |
| `int* const target` | 可以 | 不可以 |
| `const int* const target` | 不可以 | 不可以 |

在表中的这些声明中，`*` 左侧被指类型上的 `const` 限制通过该指针修改对象；`*` 右侧的 `const` 则限定指针对象自身。`const int*` 与 `int const*` 表示相同类型，本笔记统一采用前一种写法。

**被指类型上的 `const` 限制这条访问路径；指针对象上的 `const` 限制它能否保存另一个指针值。**

## 指向 const 的指针限制访问路径

指向 `const` 的指针（pointer to const）`const int*` 既可以指向 `const int`，也可以指向普通 `int`：

```cpp
int engine_temperature_c{78};
int backup_temperature_c{72};

const int* display_temperature_source{&engine_temperature_c};

engine_temperature_c = 82;                    // 正确：通过普通名称修改
display_temperature_source = &backup_temperature_c; // 正确：指针可以重新指向
*display_temperature_source = 80;                  // 错误：不能经此路径修改
```

这里的 `engine_temperature_c` 本身并不是 `const` 对象，仍可通过普通名称或其他允许修改的路径改变。受限制的是 `*display_temperature_source` 这条访问路径。

把 `int*` 转换为 `const int*` 会增加访问限制，因此普通初始化允许这种转换。反方向会丢弃限制，不能由普通初始化完成。

## const 指针固定指向关系

const 指针（const pointer）`int* const` 中的 `const` 限定指针对象。它必须完成初始化，之后不能再保存另一个指针值；被指 `int` 仍然可以通过它修改：

```cpp
int engine_temperature_c{78};
int coolant_temperature_c{65};

int* const calibration_target{&engine_temperature_c};

*calibration_target = 82;                 // 正确：修改被指对象
calibration_target = &coolant_temperature_c; // 错误：不能重新指向
```

`const int* const` 同时固定这段指向关系，并禁止通过该指针修改被指对象。如果它最初指向的是普通 `int`，该对象仍可能通过其他不受限制的访问路径改变。

## const 不表示指针有效

`const` 只管理修改权限，不保证指针具有目标，也不保证目标仍在生命周期内：

- `const int*` 可以保存空指针值；
- `int* const` 可能固定保存一个后来悬空的指针值；
- `const int* const` 同样不会延长被指对象的生命周期。

当一条指针访问路径只需要观察对象时，使用指向 `const` 的指针能够把“不经此路径修改”交给类型系统检查。当指向关系在初始化后必须保持固定时，再用指针对象上的 `const` 表达这一约束。两种限制应分别由真实职责决定。

## 参考资料

- [C++23 工作草案：指针声明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.ptr)
- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++23 工作草案：限定转换](https://timsong-cpp.github.io/cppwp/n4950/conv.qual)
