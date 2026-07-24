---
title: const 对象与只读状态
date: 2026-07-23
---

# `const` 对象与只读状态

## `const` 对象必须取得初始值

```cpp
const int limit{5};
```

`limit` 是 `const int` 对象。初始化完成后，不能再通过这个对象修改它：

```cpp
limit = 8; // 编译错误
```

对于本页讨论的局部标量，`const` 对象必须初始化：

```cpp
const int minimum{3};
const int maximum; // 编译错误
```

初始化不是“一次允许的赋值”。初始化负责创建对象并确定初始状态；赋值要求对象已经存在。

## 只读对象仍然可以读取

```cpp
const int base{5};
const int change{3};
const int sum{base + change};

int result{sum};
```

`base`、`change` 和 `sum` 都可以参与表达式。`result` 是独立的普通 `int`，修改它不会影响 `sum`：

```cpp
result = 10;
```

## 稳定值与演化状态

```cpp
int clamp_nonnegative(int value)
{
    const int original{value};
    int result{original};

    if (result < 0) {
        result = 0;
    }

    return result;
}
```

`original` 保存进入函数时的值，创建后不再改变。`result` 需要在分支中修正，所以保持可变。

`const` 的作用是把“不应通过这个名称改变”的约束交给编译器，而不是给所有对象统一添加的装饰。

## 按值形参上的 `const`

```cpp
bool is_positive(const int value)
{
    return value > 0;
}
```

`value` 仍是按值创建的函数局部对象。这里的 `const` 只阻止函数体重新赋值这份副本，不会改变调用方看到的函数接口语义。

按值调用的完整机制见[函数、值传递与返回值](../functions/functions-value-passing-and-return.md)。参数是否应该按值或引用传递，见[函数接口设计](../functions/function-interface-design.md)。

## `const` 不等于编译期常量

`const` 的核心含义是不能通过该对象修改值。它的初始值可以在运行时才得到：

```cpp
int source{6};
const int snapshot{source};
```

这与专门表达编译期常量的 `constexpr` 不同。`constexpr` 不在本页范围内。

## 使用判断

适合使用 `const`：

- 创建后不应变化的输入快照；
- 计算一次后只读的中间值；
- 对象角色本身要求保持稳定的值。

通常不适合使用 `const`：

- 循环控制状态；
- 累计结果；
- 分支中需要反复修正的状态。

限定符应匹配对象在程序中的真实角色。
