---
title: 比较与逻辑运算（Comparison and Logical Operations）
date: 2026-08-25
---

# 比较与逻辑运算（Comparison and Logical Operations）

算术表达式产生数值结果，比较表达式则判断两个操作数之间是否满足某种关系。逻辑运算符能够进一步反转或组合这些判断，使程序用一个 `bool` 结果表达更完整的条件。

本篇讨论算术类型的内建比较与逻辑运算。代码片段各自独立，均放在 `main` 函数体内。

## 比较运算符（Comparison Operators）

下表用于按符号查阅本篇涉及的比较运算：

| 运算符 | 含义 |
| --- | --- |
| `==` | 等于 |
| `!=` | 不等于 |
| `<` | 小于 |
| `<=` | 小于或等于 |
| `>` | 大于 |
| `>=` | 大于或等于 |

`==` 与 `!=` 称为相等性运算符（equality operators）；`<`、`<=`、`>` 与 `>=` 称为关系运算符（relational operators）。

> [!IMPORTANT] 比较产生判断，赋值更新对象
> **这里的比较表达式产生 `bool` 类型的结果：关系成立时得到 `true`，不成立时得到 `false`。**`==` 判断两个值是否相等；`=` 则把右侧结果写入左侧对象，二者承担不同职责。

例如，用当前剩余数量判断库存状态：

```cpp
int remaining_count{9};
int capacity{12};

bool empty{remaining_count == 0};
bool available{remaining_count > 0};
bool within_capacity{remaining_count <= capacity};
```

`9 == 0` 得到 `false`，`9 > 0` 与 `9 <= 12` 都得到 `true`，因此 `empty` 为 `false`，`available` 与 `within_capacity` 为 `true`。这些比较仅读取对象，不修改 `remaining_count` 或 `capacity`；三个 `bool` 对象记录的是这一次求值的结果。

## 算术类型之间的比较

> [!IMPORTANT] 比较使用共同类型，结果仍是布尔值
> **算术类型的比较先执行通常算术转换，使参与比较的值采用共同类型；比较表达式的结果类型仍然是 `bool`。**只有整数参与时，仍须先完成整数提升，再判断共同类型；原来的类型相同，也不能跳过这一步。

例如，整数数量与 `double` 上限比较：

```cpp
int item_count{3};
double limit{3.5};

bool below_limit{item_count < limit};
```

`item_count` 提供的 `int` 值 `3` 转换为 `double` 值 `3.0`，随后执行 `3.0 < 3.5`，得到 `true`。对象 `item_count` 本身没有改变。

有符号与无符号整数比较也服从同一套规则。沿用数量修正值与无符号数量，可以看到转换怎样改变比较结果：

```cpp
int adjustment{-1};
unsigned int count{0};

bool below{adjustment < count};
```

`int` 与 `unsigned int` 的转换等级相同，共同类型为 `unsigned int`。设该无符号类型的位宽为 $N$，`adjustment` 提供的 `-1` 先转换为最大值 $2^N-1$，再与无符号值 `0` 比较。实际判断是 $2^N-1<0$，因此 `below` 为 `false`。

两个源对象仍分别保存 `-1` 和 `0`；发生变化的是参与比较的值。这个示例刻意展示混合符号的风险，编译器可能发出相关警告。遇到其他类型组合，应按[混合符号的共同类型规则](03-usual-arithmetic-conversions.md#有符号与无符号整数共同运算)核对等级与全部取值范围，再判断实际比较的值。

## 浮点比较的含义

浮点比较针对对象实际保存的可表示值，不会自动判断两个计算结果在数学意义上是否“足够接近”。在采用常见二进制浮点格式的实现中，十进制写法和中间运算都可能发生舍入，因此两个理论上相等的数学过程未必产生完全相同的浮点值。

例如，分别计算两份重量之和，并与直接写出的预期总重量比较。**本例假设 `double` 采用 binary64 格式，十进制字面量转换、加法与存储均按 binary64 精度就近取偶，不保留额外中间精度：**

```cpp
double first_weight{0.1};
double second_weight{0.2};
double total_weight{first_weight + second_weight};
double expected_weight{0.3};

bool equal{total_weight == expected_weight};
```

在这些前提下，两个对象保存的是不同的 binary64 值：

| 对象 | 所保存值的十进制近似展开 |
| --- | ---: |
| `total_weight` | `0.30000000000000004` |
| `expected_weight` | `0.29999999999999999` |

`0.1`、`0.2`、`0.3` 的初始化与随后加法都受有限精度约束，两条路径得到不同的可表示值，因此 `equal` 为 `false`。这些展开用于辨认数值差别；判断依据是实际转换与运算的舍入过程，不能把这一组结果推广到所有 C++ 实现。

> [!IMPORTANT] 精确相等与满足误差要求
> **`==` 判断实际参与比较的浮点值是否相等，不包含业务容差。**检测一个保存的值是否恰好为零，或比较已知精确值时，精确比较可以符合目的；判断两个计算结果是否足够接近，则需要另外规定允许的差异。
>
> 是否采用容差、容差多大，以及使用绝对误差还是相对误差，必须由数值尺度和实际问题决定，不能用一个固定常数替代分析。

浮点误差形成的原因参见[浮点运算与误差](deep-dives/01-floating-point-arithmetic-and-error.md#浮点运算与误差)，两种误差度量的区别见[绝对误差与相对误差](deep-dives/01-floating-point-arithmetic-and-error.md#绝对误差与相对误差)。

### 正负零与 NaN

以下以遵循 IEEE 754 相应数值与比较规则的实现为前提：

> [!IMPORTANT] 正负零与 NaN 的比较
> **正零与负零通过 `==` 比较时相等。只要任一操作数是 NaN，`==` 就得到 `false`，`!=` 得到 `true`，`<`、`<=`、`>` 与 `>=` 都得到 `false`。**NaN 即使与自身比较，也不会通过 `==` 得到 `true`。

因此，对 NaN 执行“小于零”判断得到 `false`，不能据此认定它“大于或等于零”；后一个比较也得到 `false`。可能出现 NaN 的数据需要另外确认有效性，普通大小比较不能完整承担这项检查。

## 逻辑运算符（Logical Operators）

> [!IMPORTANT] 逻辑运算怎样组合真假
> **逻辑运算把实际求值的操作数按相应语境转换为 `bool`，结果类型也是 `bool`。**对于已经建立的算术类型，零转换为 `false`，非零值转换为 `true`。
>
> | 运算符 | 名称 | 操作数数量 | 结果为 `true` 的条件 |
> | --- | --- | ---: | --- |
> | `!` | 逻辑非（logical NOT） | 1 | 操作数为 `false` |
> | `&&` | 逻辑与（logical AND） | 2 | 两个操作数都为 `true` |
> | `\|\|` | 逻辑或（logical OR） | 2 | 至少一个操作数为 `true`，包括两者都为 `true` |

逻辑非反转判断结果：

```cpp
bool engine_running{false};
bool engine_stopped{!engine_running};
```

`engine_running` 为 `false`，逻辑非产生 `true`，因此 `engine_stopped` 为 `true`。原来的 `engine_running` 没有被修改。

`&&` 与 `||` 可以组合多个比较：

```cpp
int position{3};
int limit{5};

bool inside{(position >= 0) && (position < limit)};
bool outside{(position < 0) || (position >= limit)};
```

`3 >= 0` 与 `3 < 5` 都为 `true`，逻辑与得到 `true`；`3 < 0` 与 `3 >= 5` 都为 `false`，逻辑或得到 `false`。因此 `inside` 为 `true`，`outside` 为 `false`。

这里判断的整数区间包含 `0`，不包含上限 `5`：`position` 为 `0` 时在区间内，为 `5` 时在区间外。括号表明逻辑运算符组合的是两个完整比较。表达这个区间需要分别比较后组合，写成 `0 <= position < limit` 不能得到同样的判断，原因见[连续比较不能表达数学区间](06-expression-structure-and-evaluation-order.md#连续比较不能表达数学区间)。

实际代码通常直接使用 `bool` 对象或比较表达式，让每个条件的含义清楚可见。逻辑或允许两个条件同时为真，不表示必须恰好一个成立。

## 短路求值（Short-Circuit Evaluation）

内建 `&&` 与 `||` 先求值左操作数，再决定是否需要右侧。按左侧结果跳过右操作数的行为称为短路求值（short-circuit evaluation）。

> [!IMPORTANT] 先求值左侧，再决定是否求值右侧
> **内建 `&&` 在左侧为 `false` 时跳过右侧；内建 `||` 在左侧为 `true` 时跳过右侧。其余情况下，右侧参与求值并决定最终结果。**这是语言保证的求值关系，程序的可观察行为必须遵守它。
>
> | 表达式 | 左侧结果 | 是否求值右侧 | 最终结果 |
> | --- | --- | --- | --- |
> | `left && right` | `false` | 否 | `false` |
> | `left && right` | `true` | 是 | 由右侧的布尔值决定 |
> | `left \|\| right` | `true` | 否 | `true` |
> | `left \|\| right` | `false` | 是 | 由右侧的布尔值决定 |

先检查除数，再决定是否求值除法，可以建立明确的保护关系：

```cpp
int divisor{0};

bool valid{(divisor != 0) && ((12 / divisor) >= 3)};
```

左侧比较得到 `false`，因此右侧除法不会执行，`valid` 得到 `false`。如果把两个操作数交换，除法会先被求值，整数除零将产生未定义行为。

逻辑或可以表达“除数为零，或者商不小于 `3`”这个不同的条件：

```cpp
int divisor{0};

bool zero_or_large{(divisor == 0) || ((12 / divisor) >= 3)};
```

左侧得到 `true`，右侧同样被跳过，`zero_or_large` 得到 `true`。这个 `true` 表示整个“零或商满足限制”的条件成立，不表示除法可以执行。

分别把上述两个独立片段中的 `divisor` 改为以下值，可以对照跳过与继续求值两条路径：

| `divisor` | 两段代码是否求值右侧除法 | `valid` | `zero_or_large` |
| ---: | --- | --- | --- |
| `0` | 否 | `false` | `true` |
| `3` | 是，整数商为 `4` | `true` | `true` |
| `5` | 是，整数商为 `2` | `false` | `false` |

除数非零时，第一段的左侧为 `true`，第二段的左侧为 `false`，两者都必须继续求值右侧，才能得到最终结果。

### 被跳过的副作用也不会发生

右侧包含自增时，跳过求值也会跳过这次状态更新：

```cpp
bool enabled{false};
int check_count{0};

bool accepted{enabled && (++check_count > 0)};
```

`enabled` 为 `false`，右侧的 `++check_count` 不执行，`check_count` 仍是 `0`，`accepted` 为 `false`。若在另一个独立版本中把 `enabled` 的初值改为 `true`，右侧就会把计数更新为 `1`，再比较 `1 > 0`，使 `accepted` 为 `true`。自增表达式在这里用于显现求值差别；常规状态更新仍应让修改发生的位置清楚可见。

> [!PRACTICE] 保护条件必须排除右侧的失败边界
> 把保护条件放在会失败的表达式左侧，是短路求值最重要的工程用途之一。左侧条件必须足以排除右侧的失败边界，并让这种保护关系可以从代码结构中直接读出。

## 参考资料

- [C++23 工作草案：关系运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.rel)
- [C++23 工作草案：相等性运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.eq)
- [C++23 工作草案：通常算术转换](https://timsong-cpp.github.io/cppwp/n4950/expr.arith.conv)
- [C++23 工作草案：逻辑非](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.op#9)
- [C++23 工作草案：布尔转换](https://timsong-cpp.github.io/cppwp/n4950/conv.bool)
- [C++23 工作草案：逻辑与](https://timsong-cpp.github.io/cppwp/n4950/expr.log.and)
- [C++23 工作草案：逻辑或](https://timsong-cpp.github.io/cppwp/n4950/expr.log.or)
- [C++23 工作草案：浮点表达式的中间精度](https://timsong-cpp.github.io/cppwp/n4950/expr.pre#6)
- [Oracle Numerical Computation Guide：IEEE 格式与舍入规则](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_math.html)
- [Oracle Numerical Computation Guide：NaN 与特殊值](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)
