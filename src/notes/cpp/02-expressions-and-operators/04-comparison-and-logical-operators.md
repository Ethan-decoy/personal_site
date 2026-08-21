---
title: 比较与逻辑运算（Comparison and Logical Operations）
date: 2026-08-12
---

# 比较与逻辑运算（Comparison and Logical Operations）

## 比较运算符（Comparison Operators）

比较运算符用于判断两个操作数之间是否满足某种关系：

| 运算符 | 含义 |
|---|---|
| `==` | 等于 |
| `!=` | 不等于 |
| `<` | 小于 |
| `<=` | 小于或等于 |
| `>` | 大于 |
| `>=` | 大于或等于 |

**比较表达式产生 `bool` 类型的结果：关系成立时得到 `true`，不成立时得到 `false`。**

```cpp
int remaining{9};
int capacity{12};

bool empty{remaining == 0};                    // false
bool available{remaining > 0};                 // true
bool within_capacity{remaining <= capacity};   // true
```

**比较只产生判断结果，不会修改参与比较的对象。**执行这些表达式后，`remaining` 仍为 `9`，`capacity` 仍为 `12`。

`==` 和 `!=` 称为相等性运算符（equality operators）；`<`、`<=`、`>` 和 `>=` 称为关系运算符（relational operators）。两类运算符都会产生 `bool` 结果。相关规则可参阅 [C++ 工作草案中的相等性运算符](https://eel.is/c%2B%2Bdraft/expr.eq) 与[关系运算符](https://eel.is/c%2B%2Bdraft/expr.rel)。

### 算术类型之间的比较

**比较运算符的两个操作数都是算术类型时，会在比较之前执行通常算术转换，使参与比较的值采用共同类型。比较表达式本身的结果仍然是 `bool`。**

```cpp
int item_count{3};
double limit{3.5};

bool below_limit{item_count < limit};  // true
```

求值 `item_count < limit` 时，`item_count` 提供的 `int` 值 `3` 转换为 `double` 值 `3.0`，随后执行 `3.0 < 3.5`，得到 `bool` 值 `true`。转换只作用于参与这次比较的值，`item_count` 仍然是保存整数 `3` 的 `int` 对象。

有符号整数与无符号整数之间的比较同样遵循通常算术转换：

```cpp
int adjustment{-1};
unsigned int count{1};

bool smaller{adjustment < count};  // false
```

`int` 与 `unsigned int` 具有相同的转换等级，因此共同类型是 `unsigned int`。参与比较的 `-1` 转换为 `unsigned int` 的最大可表示值，比较实际得到 `false`。

**这不是比较运算符对负数采用了特殊规则，而是比较发生前的共同类型转换改变了参与比较的值。**[C++ 工作草案中的关系运算符](https://eel.is/c%2B%2Bdraft/expr.rel) 和[相等性运算符](https://eel.is/c%2B%2Bdraft/expr.eq) 都规定算术操作数需要先执行通常算术转换。

## 逻辑运算符（Logical Operators）

比较表达式一次只能判断一种关系。多个判断之间可以通过逻辑运算符组合成新的表达式：

| 运算符 | 名称 | 操作数数量 | 结果为 `true` 的条件 |
|---|---|---:|---|
| `!` | 逻辑非（logical NOT） | 1 | 操作数为 `false` |
| `&&` | 逻辑与（logical AND） | 2 | 两个操作数都为 `true` |
| `\|\|` | 逻辑或（logical OR） | 2 | 至少一个操作数为 `true` |

`!` 是一元运算符，用于反转一个布尔值：

```cpp
bool engine_running{false};
bool engine_stopped{!engine_running};  // true
```

`&&` 和 `||` 是二元运算符，可以组合两个比较表达式：

```cpp
int position{3};
int limit{5};

bool inside{position >= 0 && position < limit};   // true
bool outside{position < 0 || position >= limit};  // false
```

**这些逻辑运算符都产生 `bool` 类型的结果。**其真值关系可以表示为：

| `left` | `right` | `left && right` | `left \|\| right` |
|---|---|---|---|
| `false` | `false` | `false` | `false` |
| `false` | `true` | `false` | `true` |
| `true` | `false` | `false` | `true` |
| `true` | `true` | `true` | `true` |

逻辑运算符的操作数会在相应语境中转换为 `bool`。对于已经接触过的算术类型，零转换为 `false`，非零值转换为 `true`：

```cpp
bool first{!0};       // true
bool second{2 && 5};  // true
bool third{0 || 3};   // true
```

**实际代码通常直接组合 `bool` 对象或结果为 `bool` 的比较表达式，以清楚表达每个条件的含义。**相关规则可参阅 [C++ 工作草案中的逻辑非运算符](https://eel.is/c%2B%2Bdraft/expr.unary.op)、[逻辑与运算符](https://eel.is/c%2B%2Bdraft/expr.log.and) 与[逻辑或运算符](https://eel.is/c%2B%2Bdraft/expr.log.or)。

### 短路求值（Short-Circuit Evaluation）

**`&&` 和 `||` 保证先求值左操作数，并根据左侧结果决定是否求值右操作数。**这种行为称为短路求值（short-circuit evaluation）。

### 组合比较表达式

多个比较可以通过逻辑运算符组合成一个表达式：

```cpp
int position{3};
int limit{5};

bool inside{
    (position >= 0) && (position < limit)
};
```

**`&&` 的两个操作数分别是完整的比较表达式。**这里的括号并非语法所必需，但能够直接表明表达式由两个独立判断组成。

数学中的连续比较不能直接写入 C++：

```cpp
bool inside{0 <= position < limit};
```

关系运算符采用左结合，因此该表达式按照下面的结构解析：

```cpp
bool inside{(0 <= position) < limit};
```

`0 <= position` 先产生 `bool` 结果，随后这个 `false` 或 `true` 又分别以 `0` 或 `1` 参与第二次比较。**它并不表示“`position` 同时不小于 `0` 且小于 `limit`”。**

相等性比较同样不能连写：

```cpp
bool all_equal{first == second == third};
```

它表示：

```cpp
bool all_equal{(first == second) == third};
```

而不是同时判断三个值是否相等。多个相等条件也应分别比较，再通过逻辑运算符组合。
