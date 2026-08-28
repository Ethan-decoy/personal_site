---
title: 比较与逻辑运算（Comparison and Logical Operations）
date: 2026-08-25
---

# 比较与逻辑运算（Comparison and Logical Operations）

算术表达式产生数值结果，比较表达式则判断两个操作数之间是否满足某种关系。逻辑运算符能够进一步反转或组合这些判断，使程序用一个 `bool` 结果表达更完整的条件。

## 比较运算符（Comparison Operators）

| 运算符 | 含义 |
| --- | --- |
| `==` | 等于 |
| `!=` | 不等于 |
| `<` | 小于 |
| `<=` | 小于或等于 |
| `>` | 大于 |
| `>=` | 大于或等于 |

`==` 与 `!=` 称为相等性运算符（equality operators）；`<`、`<=`、`>` 与 `>=` 称为关系运算符（relational operators）。

**比较表达式产生 `bool` 类型的结果：关系成立时得到 `true`，不成立时得到 `false`。**

```cpp
int remaining_count{9};
int capacity{12};

bool empty{remaining_count == 0};
bool available{remaining_count > 0};
bool within_capacity{remaining_count <= capacity};
```

求值结束后，`empty` 为 `false`，`available` 与 `within_capacity` 为 `true`。比较只产生判断结果，不修改 `remaining_count` 或 `capacity`。

## 算术类型之间的比较

两个算术操作数类型不同时，比较之前同样会执行通常算术转换，使参与比较的值采用共同类型；**转换决定比较哪些值，比较表达式本身的结果类型仍然是 `bool`。**

```cpp
int item_count{3};
double limit{3.5};

bool below_limit{item_count < limit};
```

`item_count` 提供的 `int` 值 `3` 转换为 `double` 值 `3.0`，随后执行 `3.0 < 3.5`，得到 `true`。对象 `item_count` 本身没有改变。

有符号与无符号整数比较也服从同一套共同类型规则。负的有符号值可能先转换为较大的无符号值，因此不能把源代码中的数学直觉直接当作比较结果；应先按照[通常算术转换](03-usual-arithmetic-conversions.md#有符号与无符号整数共同运算)确定真正参与比较的值。

## 浮点比较的含义

浮点比较针对对象实际保存的可表示值，不会自动判断两个计算结果在数学意义上是否“足够接近”。在采用常见二进制浮点格式的实现中，十进制写法和中间运算都可能发生舍入，因此两个理论上相等的数学过程未必产生完全相同的浮点值。

**`==` 执行精确的值比较，不包含业务容差。**是否应当采用容差、容差多大以及使用绝对误差还是相对误差，必须由数值尺度和实际问题决定，不能用一个固定常数替代分析。

正零与负零通过 `==` 比较时相等。在支持 NaN 的常见实现中，只要任一操作数是 NaN，`==` 就得到 `false`，`!=` 得到 `true`，`<`、`<=`、`>` 与 `>=` 也都得到 `false`。遇到可能产生 NaN 的数据时，不能只依赖普通大小比较完成有效性判断。

浮点误差形成的原因参见[浮点运算、舍入与误差](deep-dives/01-floating-point-arithmetic-and-error.md)。

## 逻辑运算符（Logical Operators）

逻辑运算符把一个或两个判断组合成新的 `bool` 结果：

| 运算符 | 名称 | 操作数数量 | 结果为 `true` 的条件 |
| --- | --- | ---: | --- |
| `!` | 逻辑非（logical NOT） | 1 | 操作数为 `false` |
| `&&` | 逻辑与（logical AND） | 2 | 两个操作数都为 `true` |
| `\|\|` | 逻辑或（logical OR） | 2 | 至少一个操作数为 `true` |

逻辑非反转判断结果：

```cpp
bool engine_running{false};
bool engine_stopped{!engine_running};
```

`&&` 与 `||` 可以组合多个比较：

```cpp
int position{3};
int limit{5};

bool inside{(position >= 0) && (position < limit)};
bool outside{(position < 0) || (position >= limit)};
```

这里的 `inside` 为 `true`，`outside` 为 `false`。括号明确表明两个逻辑运算符组合的是完整比较表达式。

逻辑运算符的操作数会在相应语境中转换为 `bool`。对于已经建立的算术类型，零转换为 `false`，非零值转换为 `true`；实际代码通常直接使用 `bool` 对象或比较表达式，让每个条件的含义清楚可见。

## 短路求值（Short-Circuit Evaluation）

`&&` 与 `||` 不只是组合两个最终布尔值，它们还规定操作数的求值关系：

- `left && right` 先求值 `left`；左侧为 `false` 时，结果已经确定，`right` 不会被求值；
- `left || right` 先求值 `left`；左侧为 `true` 时，结果已经确定，`right` 不会被求值。

这种按左侧结果跳过右操作数的行为称为短路求值（short-circuit evaluation），是 C++ 保证的表达式语义，不是编译器可以随意取消的优化。

```cpp
int divisor{0};

bool valid{
    (divisor != 0) && ((12 / divisor) >= 3)
};
```

左侧比较得到 `false`，因此右侧除法不会执行，`valid` 得到 `false`。如果把两个操作数交换，除法会先被求值，整数除零将产生未定义行为。

逻辑或可以表达相应的另一种结构：

```cpp
int divisor{0};

bool zero_or_large{
    (divisor == 0) || ((12 / divisor) >= 3)
};
```

左侧得到 `true`，右侧同样被跳过，`zero_or_large` 得到 `true`。

**把保护条件放在会失败的表达式左侧，是短路求值最重要的工程用途之一。**左侧条件必须足以排除右侧的失败边界，并让这种保护关系可以从代码结构中直接读出。

## 参考资料

- [C++23 工作草案：关系运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.rel)
- [C++23 工作草案：相等性运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.eq)
- [C++23 工作草案：逻辑与](https://timsong-cpp.github.io/cppwp/n4950/expr.log.and)
- [C++23 工作草案：逻辑或](https://timsong-cpp.github.io/cppwp/n4950/expr.log.or)
