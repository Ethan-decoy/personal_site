---
title: 第二课：条件表达式与短路求值
date: 2026-07-17
---

# 第二课：条件表达式与短路求值

## 条件最终要得到布尔值

`if`、`else if` 和逻辑运算符都需要根据条件的真假决定后续行为。比较表达式会直接产生 `bool`：

```cpp
int count{5};

bool empty{count == 0};    // false
bool positive{count > 0};  // true
```

整数也可以在条件中转换为 `bool`：

- `0` 转换为 `false`；
- 非零整数转换为 `true`。

## 逻辑与 `&&` 的短路求值

对于 `A && B`：

1. 先计算左侧的 `A`；
2. 如果 `A` 为 `false`，整个表达式必定为 `false`，因此跳过 `B`；
3. 只有 `A` 为 `true` 时，才会计算 `B`。

这种行为称为**短路求值**。它可以把安全检查放在危险操作之前：

```cpp
int divisor{0};

bool valid{
    divisor != 0 && 12 / divisor >= 3
};
```

`divisor != 0` 为 `false`，所以右侧除法不会执行，`valid == false`。

条件顺序非常重要：

```cpp
bool valid{
    12 / divisor >= 3 && divisor != 0
};
```

这段代码会先尝试执行 `12 / divisor`。当 `divisor == 0` 时，整数除以零会产生未定义行为，后面的检查已经来不及保护它。

## 逻辑或 `||` 的短路求值

对于 `A || B`：

1. 先计算左侧的 `A`；
2. 如果 `A` 为 `true`，整个表达式必定为 `true`，因此跳过 `B`；
3. 只有 `A` 为 `false` 时，才会计算 `B`。

例如：

```cpp
int divisor{0};

bool special{
    divisor == 0 || 12 / divisor >= 3
};
```

`divisor == 0` 为 `true`，所以右侧除法不会执行，`special == true`。

两种短路规则可以概括为：

| 表达式 | 跳过右侧的条件 |
| --- | --- |
| `A && B` | `A` 为 `false` |
| `A || B` | `A` 为 `true` |

## C++ 不支持数学式的连续比较

数学中可以写：

```text
0 ≤ position < limit
```

但下面的 C++ 表达式不能表达同样的含义：

```cpp
0 <= position < limit
```

C++ 会把它理解为：

```cpp
(0 <= position) < limit
```

`0 <= position` 先产生一个 `bool`，随后 `false` 或 `true` 又以 `0` 或 `1` 参与第二次比较，结果通常不符合原本的范围要求。

正确写法是把两个比较明确连接起来：

```cpp
bool inside{
    position >= 0 && position < limit
};
```

它表示 `position` 位于半开区间 `[0, limit)`：包含 `0`，不包含 `limit`。如果第一个比较为 `false`，第二个比较会被短路跳过。

## `if`、`else if` 与 `else`

条件链按照从上到下的顺序执行：

1. 依次计算各个条件；
2. 遇到第一个为 `true` 的条件后，执行对应分支；
3. 后续条件和分支全部跳过；
4. 所有条件都为 `false` 时，才执行最后的 `else`。

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

虽然 `score >= 90` 和 `score >= 60` 都成立，但第一个条件先成立，因此只执行 `grade = 3`，第二个条件不会再计算。

分支顺序会影响结果。处理从高到低的阈值时，通常应先判断更严格的条件；如果先判断 `score >= 60`，那么 `95` 会立即进入该分支，无法到达后面的 `score >= 90`。

## 逻辑非 `!`

逻辑非会反转布尔值：

```cpp
!true   // false
!false  // true
```

通常可以先用正向名称保存判断结果，再在需要处理相反情况时取反：

```cpp
bool inside{
    position >= 0 && position < limit
};

if (!inside) {
    // 处理范围外的值
}
```

## 条件中的赋值与比较

`=` 和 `==` 表达不同的操作：

```cpp
count = 5;   // 赋值：修改 count
count == 5;  // 比较：产生 bool，不修改 count
```

赋值本身也是表达式，因此下面的代码在 C++ 中可以成立，但编译器通常会警告：

```cpp
int count{0};
int result{0};

if (count = 5) {
    result = 1;
} else {
    result = 2;
}
```

`count = 5` 先把 `count` 修改为 `5`，随后新值 `5` 在条件中转换为 `true`，所以最终 `count == 5`、`result == 1`。

如果赋的值为 `0`，条件则转换为 `false`：

```cpp
if (count = 0) {
    // 不执行
} else {
    // 执行
}
```

需要判断是否相等时应使用 `==`。条件中的单个 `=` 往往是把比较误写成赋值的错误。
