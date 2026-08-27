---
title: const 对象（Const Objects）
date: 2026-08-27
order: 2
---

# const 对象（Const Objects）

## 初始化后不再修改

有些对象在创建时得到一个值，之后只应被读取：

```cpp
const int wheel_count{4};
```

`const` 是 cv 限定符（cv-qualifier）。这里的对象类型是 `const int`，表示 `wheel_count` 在完成初始化后不能再通过普通的赋值、自增或自减操作修改。

```cpp
wheel_count = 5;  // 错误：不能给 const 对象赋值
++wheel_count;    // 错误：不能递增 const 对象
```

这些语句不是“执行后没有效果”，而是程序本身不合法，编译器必须拒绝。

在当前已经认识的基本类型范围内，定义 `const` 对象时必须建立确定的初始状态：

```cpp
const int maximum_attempts{3};
const int failed_attempts;  // 错误：没有初始化
```

**`const` 把对象不可修改的约束纳入类型系统。**

## const 对象仍然是对象

`const` 对象仍然具有类型、身份、生命周期和当前值。受限制的是对象创建完成后的修改操作，而不是对象本身的存在方式。

```cpp
const int starting_fuel_l{50};
int current_fuel_l{starting_fuel_l};

current_fuel_l = 35;
```

第二行读取 `starting_fuel_l` 当时保存的值，用它初始化一个独立的 `int` 对象。此后修改 `current_fuel_l`，不会影响 `starting_fuel_l`。

`const` 也不是文本替换。每次写下 `starting_fuel_l` 时，表达式仍然在指代同一个已有对象。

## const 不等于编译期常量

`const` 约束的是对象能否被修改，并不单独保证初始化值能够在程序翻译期间确定：

```cpp
int calculate_attempt_limit(int requested_attempts) {
    return requested_attempts + 1;
}

int requested_attempts{3};
const int maximum_attempts{calculate_attempt_limit(requested_attempts)};
```

`maximum_attempts` 创建后不能修改，但它的初始值依赖普通对象和普通函数调用。即使编译器能够通过优化提前算出结果，语言也不会因此自动把这段初始化归类为常量表达式。

**是否允许修改是语言语义中的约束；编译器是否恰好能够提前计算，是另一件事。**

## 用类型表达稳定性

下面两个对象最后都可能一直保持 4，但它们表达的约束不同：

```cpp
int observed_wheel_count{4};
const int required_wheel_count{4};
```

`observed_wheel_count` 的类型允许后续修改，只是当前代码可能还没有这样做。`required_wheel_count` 则把“不应修改”写进类型，普通修改会立即成为编译错误。

当局部对象完成初始化后不再承担状态变化时，使用 `const` 能够把这种意图交给编译器检查。是否添加 `const` 应由对象在程序中的职责决定，而不是由当前值看起来是否像一个固定数字决定。

## 参考资料

- [C++23 工作草案：cv 限定符](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++23 工作草案：类型限定](https://timsong-cpp.github.io/cppwp/n4950/basic.type.qualifier)
