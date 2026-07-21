---
title: 第五课：const 对象与只读约束
date: 2026-07-20
---

# 第五课：const 对象与只读约束

## `const` 对象必须在创建时取得值

```cpp
const int limit{5};
```

`limit` 是一个 `const int` 对象：它有确定的初始值，但初始化完成后不能再通过这个对象修改它。

```cpp
limit = 8; // 编译错误
```

对于当前学习的局部标量，`const` 对象必须初始化：

```cpp
const int minimum{3}; // 可以
const int maximum;    // 不可以
```

初始化不是“一次允许的赋值”。初始化负责创建对象并确定初始状态；赋值要求对象已经存在。

## 只读不等于不能使用

`const` 对象仍然可以被读取、参与表达式和输出：

```cpp
const int base{5};
const int change{3};
const int sum{base + change};

int result{sum};
```

这里 `base`、`change` 和 `sum` 都保持不变，但它们的值可以参与计算，也可以用于初始化新的可变对象 `result`。

`result` 是独立的普通 `int`：

```cpp
result = 10; // 可以，不会改变 sum
```

## 用 `const` 表达稳定值，用普通对象表达演化状态

```cpp
int bounded_score(const int base, const int change, const int maximum)
{
    const int raw{base + change};
    int result{raw};

    if (result < 0) {
        result = 0;
    } else if (result > maximum) {
        result = maximum;
    }

    return result;
}
```

这个函数中：

- `base`、`change`、`maximum` 是只读输入；
- `raw` 是计算后不再改变的中间值；
- `result` 需要根据条件变化，所以保持为普通 `int`。

`const` 的价值不是“让代码看起来更现代”，而是把不应变化的约束交给编译器检查。

## 按值 `const` 形参仍然是独立对象

```cpp
int add_two(const int value)
{
    return value + 2;
}

const int original{6};
int result{add_two(original)};
```

调用时仍然按值创建形参 `value`。它不是 `original` 的别名：

```text
original == 6
result == 8
```

形参上的 `const` 只限制函数体不能重新赋值自己的局部形参：

```cpp
value = 9; // 编译错误
```

即使形参写成普通 `int value`，按值传递本身也不会修改调用方对象。两者的区别在于函数实现内部是否允许修改这份局部副本。

## `const` 不等于编译期常量

`const` 的核心含义是通过该对象不能修改值。它的初始化值可以在运行时才得到：

```cpp
int source{6};
const int snapshot{source};
```

这与专门表达编译期常量的 `constexpr` 不是同一个概念。`constexpr` 将在后续需要时单独学习。

## 使用判断

适合使用 `const`：

- 创建后不应变化的输入；
- 需要保存稳定快照的对象；
- 计算一次后只读的中间值。

不适合使用 `const`：

- 循环控制状态；
- 累计结果；
- 条件分支中需要反复修正的状态。

类型限定应该符合对象在程序中的真实角色，而不是机械地给所有对象添加 `const`。
