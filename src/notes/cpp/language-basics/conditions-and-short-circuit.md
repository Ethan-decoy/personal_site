---
title: 条件表达式与短路求值
date: 2026-07-23
---

# 条件表达式与短路求值

## 条件最终产生真假

`if`、`else if` 和逻辑运算符根据条件的真假决定行为。比较表达式会直接产生 `bool`：

```cpp
int count{5};

bool empty{count == 0};
bool positive{count > 0};
```

整数也可以在条件中转换成 `bool`：`0` 转换为 `false`，非零整数转换为 `true`。

## 逻辑与 `&&`

对于 `A && B`：

1. 先计算 `A`；
2. 若 `A` 为 `false`，跳过 `B`；
3. 只有 `A` 为 `true` 时才计算 `B`。

这种行为称为短路求值。它可以把安全检查放在危险操作之前：

```cpp
int divisor{0};

bool valid{
    divisor != 0 && 12 / divisor >= 3
};
```

左侧为 `false`，右侧除法不会执行，`valid == false`。

条件顺序很重要：

```cpp
bool valid{
    12 / divisor >= 3 && divisor != 0
};
```

这段代码先执行除法。当 `divisor == 0` 时，整数除以零会产生未定义行为，后面的检查已经无法保护它。

## 逻辑或 `||`

对于 `A || B`：

1. 先计算 `A`；
2. 若 `A` 为 `true`，跳过 `B`；
3. 只有 `A` 为 `false` 时才计算 `B`。

```cpp
int divisor{0};

bool special{
    divisor == 0 || 12 / divisor >= 3
};
```

左侧为 `true`，右侧除法不会执行，`special == true`。

| 表达式 | 跳过右侧的条件 |
| --- | --- |
| `A && B` | `A` 为 `false` |
| `A || B` | `A` 为 `true` |

## C++ 不支持数学式连续比较

数学中的 `0 ≤ position < limit` 不能直接写成：

```cpp
0 <= position < limit
```

C++ 会把它理解成：

```cpp
(0 <= position) < limit
```

第一个比较产生 `bool`，随后 `false` 或 `true` 又以 `0` 或 `1` 参与第二次比较，通常不符合原本的范围要求。

正确写法是明确连接两个比较：

```cpp
bool inside{
    position >= 0 && position < limit
};
```

它表示半开区间 `[0, limit)`：包含 `0`，不包含 `limit`。

## `if`、`else if` 与 `else`

条件链从上到下执行。遇到第一个为 `true` 的条件后，只执行对应分支；后续条件和分支都会跳过。所有条件都为 `false` 时才执行 `else`。

```cpp
int score{95};
int grade{0};

if (score >= 90) {
    grade = 3;
} else if (score >= 60) {
    grade = 2;
} else {
    grade = 1;
}
```

按 `score` 的值看，`score >= 60` 也会为真；但程序在第一个条件成立后根本不会再计算这个 `else if` 条件。最终 `grade == 3`。处理从高到低的阈值时，通常应先判断更严格的条件。

## 逻辑非 `!`

逻辑非会反转布尔值：

```cpp
!true   // false
!false  // true
```

可以先保存正向判断，再在处理相反情况时取反：

```cpp
bool inside{
    position >= 0 && position < limit
};

if (!inside) {
    // 处理范围外的值
}
```

## 条件中的赋值与比较

`=` 和 `==` 是不同操作：

```cpp
count = 5;   // 赋值：修改 count
count == 5;  // 比较：产生 bool
```

赋值本身也是表达式，因此下面的代码可以编译，但编译器通常会警告：

```cpp
int count{0};
int result{0};

if (count = 5) {
    result = 1;
} else {
    result = 2;
}
```

赋值先把 `count` 改成 `5`，随后非零值转换为 `true`。最终 `count == 5`、`result == 1`。

需要判断相等时应使用 `==`。条件中的单个 `=` 往往是把比较误写成赋值。
