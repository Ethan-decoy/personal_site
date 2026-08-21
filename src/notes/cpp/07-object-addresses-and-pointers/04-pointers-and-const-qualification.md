---
title: 指针与 const 限定（Pointers and const Qualification）
date: 2026-08-19
---

# 指针与 const 限定

**指针与 `const` 组合时，只需要分别判断两种操作是否允许：**

1. 能否给指针对象写入另一个指针值：`pointer = &other;`
2. 能否通过指针给目标对象写入新值：`*pointer = value;`

四种基本组合如下：

| 类型 | `pointer = &other` | `*pointer = value` |
| --- | --- | --- |
| `int*` | 可以 | 可以 |
| `const int*` | 可以 | 不可以 |
| `int* const` | 不可以 | 可以 |
| `const int* const` | 不可以 | 不可以 |

**这两种写入权限彼此独立。限制指针重新指向，不等于限制目标对象的值；限制通过指针修改目标，也不等于目标对象在整个程序中都不能变化。**

## 四种基本组合

```cpp
int primary_temperature{78};
int backup_temperature{65};

int* writable_temperature{&primary_temperature};
const int* temperature_view{&primary_temperature};
int* const selected_temperature{&primary_temperature};
const int* const fixed_view{&primary_temperature};
```

**普通 `int*` 对两种操作都没有增加限制：**

```cpp
writable_temperature = &backup_temperature;
*writable_temperature = 66;
```

**`const int*` 不允许通过该指针修改目标，但指针本身仍可重新指向：**

```cpp
temperature_view = &backup_temperature;

// *temperature_view = 66; // 错误
```

**`int* const` 固定指针对象保存的指针值，但仍允许修改目标：**

```cpp
*selected_temperature = 81;

// selected_temperature = &backup_temperature; // 错误
```

**`const int* const` 同时限制两种操作：**

```cpp
int observed_temperature{*fixed_view};

// *fixed_view = 81;               // 错误
// fixed_view = &backup_temperature; // 错误
```

这些被注释的语句不是运行时检查。**直接写出它们会违反类型中的 `const` 限定，使程序不合法，编译器必须诊断。**

## const 位于哪一层

**`const int*` 中，`const int` 是目标类型。指针对象仍可赋值，受限的是通过一元 `*` 得到的目标访问：**

```text
const int* temperature_view
^^^^^^^^^
目标类型
```

**`int* const` 中，星号之后的 `const` 限定指针对象自身：**

```text
int* const selected_temperature
     ^^^^^
     指针对象受到限定
```

`const int* const` 同时包含两层限定。**与其使用容易互换的“常量指针”和“指针常量”，不如直接说明受限的是目标访问、指针对象，还是两者。**

`int const*` 与 `const int*` 是同一种类型；两种写法中的 `const` 都属于目标类型。

## 指向 const 的路径

**`const int*` 限制的是通过这条路径执行修改，不会把普通对象变成 `const`：**

```cpp
int primary_temperature{78};
const int* temperature_view{&primary_temperature};

primary_temperature = 81;                    // 正确
int observed_temperature{*temperature_view}; // 得到 81

// *temperature_view = 82; // 错误
```

同一个普通对象可以同时具有可写路径和不可写路径。普通 `int*` 也可以隐式转换为 `const int*`，这种转换称为限定转换（qualification conversion）：

```cpp
int* writable_temperature{&primary_temperature};
const int* observed_temperature{writable_temperature};
```

**两个指针仍然指向同一个对象。转换没有复制目标对象，只减少了通过新指针能够执行的操作。**

**反方向不会隐式发生。实际受到 `const` 限定的对象不能用于初始化普通可写指针：**

```cpp
const int maximum_temperature{120};
const int* limit_view{&maximum_temperature};

// int* writable_limit{&maximum_temperature}; // 错误
// int* another_limit{limit_view};             // 错误
```

否则程序就能借由 `int*` 绕过目标对象自身的 `const` 约束。

## const 不证明指针有效

**`const` 只限制写入权限，不证明指针非空，也不延长目标对象的生命周期。任何一种形式都仍需满足相应的指针有效性要求：**

```cpp
const int* temperature_view{nullptr};
int* const selected_temperature{nullptr};
```

这两个声明都合法，但两个指针都不能解引用。空值、悬空与目标生命周期见[空指针、生命周期与有效性](03-null-pointers-lifetime-and-validity.md)。

## 编程习惯

**指针类型应直接表达当前代码需要的访问能力：**

```cpp
int current_temperature{78};
int calibration_temperature{40};

const int* display_source{&current_temperature};
int* const calibration_target{&calibration_temperature};
```

`display_source` 只用于观察目标，因此不提供修改目标的能力；`calibration_target` 表达校准期间目标固定，但允许更新该目标的值。

- 指针只用于读取目标时，优先使用 `const T*`。
- 只有固定指向关系确实属于当前代码的约束时，才使用 `T* const`。
- 指针对象始终在声明时初始化；`const` 不能代替空值与生命周期检查。
- 阅读声明时分别判断 `pointer = &other` 和 `*pointer = value`，不要依赖容易混淆的中文简称。

相关标准条款：[cv 限定符 dcl.type.cv](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)、[指针声明符 dcl.ptr](https://timsong-cpp.github.io/cppwp/n4950/dcl.ptr)、[限定转换 conv.qual](https://timsong-cpp.github.io/cppwp/n4950/conv.qual)。
