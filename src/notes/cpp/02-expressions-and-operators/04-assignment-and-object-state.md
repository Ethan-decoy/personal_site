---
title: 赋值与对象状态（Assignment and Object State）
date: 2026-08-25
---

# 赋值与对象状态（Assignment and Object State）

记录中还剩 `12` 件物品，发出 `3` 件后，需要把剩余数量改为 `9`。算术表达式可以计算新的数量，赋值则负责把结果写入已经存在的对象；只计算出新值，不会自动更新原来的记录。

本篇讨论普通数值类型的内建赋值、复合赋值、自增与自减。代码片段各自独立，均放在 `main` 函数体内；标为错误的片段用于说明编译诊断。

## 赋值表达式

```cpp
int remaining_count{12};

remaining_count = 9;
```

第二行中的 `=` 是二元赋值运算符（assignment operator）：

- 左操作数 `remaining_count` 指定需要修改的对象；
- 右操作数 `9` 提供准备写入的值；
- `remaining_count = 9` 整体构成赋值表达式。

求值这条赋值表达式后，`remaining_count` 从保存 `12` 改为保存 `9`。初始化负责在对象创建时建立初始状态；这里的赋值修改的是先前已经创建的对象。

> [!IMPORTANT] 赋值的状态修改与表达式结果
> **对于这里的内建数值赋值，写入已有对象是副作用；赋值表达式的结果仍然指定修改后的左侧对象，表达式类型也与左操作数相同。**对象的身份与类型保持不变，改变的是它当前保存的值。

第一段代码把赋值写成独立的表达式语句。末尾的分号结束语句，不属于赋值表达式；表达式的结果没有继续使用，写入仍然完成。

赋值表达式也可以用于提供另一个对象的初值。下面是一个独立示例，圆括号把赋值表达式括在一起：

```cpp
int remaining_count{12};

int recorded_count{(remaining_count = 9)};
```

先把 `remaining_count` 改为 `9`，赋值表达式的结果指定的仍是这个对象；初始化 `recorded_count` 时，再读取其中的 `int` 值 `9`。声明结束后，两个独立对象都保存 `9`，后续修改其中一个不会自动修改另一个。普通状态更新通常单独写成语句，便于直接看见写入发生的位置。

## 右侧表达式先确定待写入结果

赋值运算符的右操作数可以是更大的表达式：

```cpp
int completed_count{3};
int new_count{2};
int total_count{0};

total_count = completed_count + new_count;
```

`completed_count + new_count` 先按照算术运算规则产生 `int` 值 `5`，这个值随后写入 `total_count`。**左侧对象只负责接收结果，不能反向改变右侧表达式此前采用的运算规则。**

右侧结果类型与左侧对象类型不同时，还需要在写入之前转换结果。例如，测量重量用 `double` 保存，整单位显示记录采用 `int`：

```cpp
double measured_weight{5.5};
int displayed_weight{0};

displayed_weight = measured_weight;
```

右侧先提供 `double` 值 `5.5`，赋值时再转换为 `int` 值 `5`。浮点数转换为这里的整数类型会向零丢弃小数部分，因此结果不是四舍五入后的 `6`。执行后，`displayed_weight` 仍是 `int` 对象，保存 `5`；`measured_weight` 仍保存 `5.5`。

> [!IMPORTANT] 先求右侧结果，再转换并写入
> **普通数值赋值先取得右侧表达式的结果，再按目标对象的类型转换并存储。**左侧对象不需要先提供旧值，也不能反向改变右侧表达式的运算类型；目标类型的要求作用在随后这次写入上。
>
> 浮点值转换为 `int` 等非 `bool` 整数类型时，截断后的值必须能由目标整数类型表示，否则在 C++23 中产生未定义行为。允许转换，不保证信息完整，也不保证符合数据用途。

只有显示规则确实要求丢弃小数部分时，上面的转换才符合意图。对象创建时使用花括号，也不会使之后的普通 `=` 自动拒绝这种转换。其他转换类别可查阅[隐式类型转换](../06-constants-literals-and-type-conversions/04-implicit-type-conversions.md#当前数值类型的转换结果)。

## 左操作数必须能够被修改

赋值的左操作数必须指定一个允许修改的对象：

```cpp
int remaining_count{12};

remaining_count = 9; // 正确：remaining_count 指定可修改对象
```

单独的 `9` 只提供整数值，不指定一个可供赋值修改的对象，因此下面的代码不能通过编译：

```cpp
int remaining_count{12};

9 = remaining_count; // 错误：9 不指定可修改对象
```

> [!IMPORTANT] 左侧指定对象，右侧提供值
> **赋值的左操作数必须指定允许修改的对象，右操作数提供待写入的值。**两侧承担不同职责，不能像数学等式两侧那样任意交换；`=` 在这里要求执行一次状态更新。

## 复合赋值运算符（Compound Assignment Operators）

需要读取对象的当前值、进行运算，再把结果写回同一个对象时，可以使用复合赋值运算符。下表用于按符号查阅本章涉及的算术复合赋值：

| 运算符 | 表示的状态更新 |
| --- | --- |
| `+=` | 加法后写回 |
| `-=` | 减法后写回 |
| `*=` | 乘法后写回 |
| `/=` | 除法后写回 |
| `%=` | 取余后写回 |

```cpp
int remaining_count{12};

remaining_count -= 3; // remaining_count == 9
```

这里先读取 `remaining_count` 中的 `12`，减去 `3` 得到 `9`，再把 `9` 写回同一个对象。与普通 `=` 只需指定写入对象不同，复合赋值还需要读取这个对象的旧值；该值必须已经有效。

对于形式 `left op= right`，其行为与下面的结构相对应：

```text
left = left op right;
```

> [!IMPORTANT] 复合赋值先运算，再写回
> **`left op= right` 按相应运算规则计算，再把结果转换为左侧对象的类型并写回。**左操作数表达式只求值一次，但对象既要被读取，也要被写入，不能把它理解成只访问一次对象。
>
> 复合赋值表达式的结果仍然指定更新后的左侧对象，表达式类型与左操作数相同。对象类型不变，不代表中间运算一定采用该类型。

例如，把整单位重量记录增加一个 `double` 增量：

```cpp
int displayed_weight{3};
double added_weight{2.5};

displayed_weight += added_weight;
```

这次更新分为三个步骤：

| 步骤 | 类型与值 |
| --- | --- |
| 读取旧值 | `displayed_weight` 提供 `int` 值 `3`，`added_weight` 提供 `double` 值 `2.5` |
| 执行加法 | 按通常算术转换采用 `double`，得到 `5.5` |
| 写回对象 | 把 `5.5` 转换为 `int` 值 `5`，存入 `displayed_weight` |

执行后，`displayed_weight` 保存 `5`，`added_weight` 仍保存 `2.5`。是否允许舍弃 `0.5`，需要由重量记录的用途决定；使用复合赋值不会自动验证这种损失是否合理。

`/=` 与 `%=` 仍然受到[除数非零、整数商可表示等条件](02-arithmetic-operations-and-result-types.md#除法与取余的失败边界)的约束，复合写法不会改变底层运算边界。

## 自增与自减（Increment and Decrement）

自增运算符 `++` 与自减运算符 `--` 都是一元运算符。对于这里的内建数值运算，前置 `++value` 等价于 `value += 1`，前置 `--value` 等价于 `value -= 1`；实际结果仍受运算和写回规则约束。先看没有接近范围端点的 `int` 对象：

```cpp
int remaining_count{4};

++remaining_count; // remaining_count == 5
--remaining_count; // remaining_count == 4
```

操作数必须指定能够被修改的对象，因此 `++4` 与 `4--` 都不合法。`bool` 也不能作为内建自增或自减运算符的操作数。

## 前置形式与后置形式

`++` 和 `--` 都有前置形式（prefix form）与后置形式（postfix form）。两种形式对对象执行相同的更新，区别在于表达式提供什么结果：

> [!IMPORTANT] 前置与后置怎样提供结果
> **前置形式的结果指定更新后的对象；后置形式产生修改前数值的一份副本，不再指定原对象。**对于本篇使用的数值对象，两种形式的表达式类型都与操作数类型相同。
>
> | 形式 | 对象更新 | 表达式结果 |
> | --- | --- | --- |
> | `++value`、`--value` | 执行加一或减一并写回 | 指定更新后的对象 |
> | `value++`、`value--` | 执行加一或减一并写回 | 提供修改前的值 |

```cpp
int count{5};

int previous_count{count++}; // previous_count == 5，count == 6
int current_count{++count};  // count == 7，current_count == 7
```

初始化 `previous_count` 时，后置自增提供旧值 `5`，并把 `count` 更新为 `6`；这条声明结束时，更新已经完成。下一条声明执行前置自增，把 `count` 更新为 `7`，再读取更新后的值初始化 `current_count`。

`previous_count`、`current_count` 是两个独立对象，最后分别保存 `5`、`7`。虽然 `++count` 的结果指定 `count`，使用它初始化新对象仍然是读取当前值，不会让 `current_count` 与 `count` 自动同步。

当表达式结果没有被使用时，前置和后置形式对对象造成相同的最终更新。此时通常使用前置形式，直接表达“更新对象”；后置形式保留给确实需要修改前数值的场景。

## 自增运算与写回转换

前面的 `int` 例子都没有接近范围端点。换成较小整数类型、或数值接近端点时，还需要分开检查加减在哪种类型中完成，以及结果怎样写回原对象。

> [!IMPORTANT] 分别判断运算、写回与表达式结果
> **整数自增、自减先按整数提升与通常算术转换确定运算类型，完成加减，再把结果转换回原对象的类型。**运算范围检查与写回转换是两个步骤，整个表达式的结果类型也要单独判断。
>
> 运算类型是有符号整数时，数学结果超出该运算类型的范围才构成有符号算术溢出；不能只看原对象是否已经到达范围端点。前置形式仍指定原对象，后置形式仍提供原类型的旧值，内部提升不会把整个自增表达式的类型改成 `int`。

下面明确假设 `short` 为 16 位、`int` 为 32 位：

```cpp
short value{32767};
++value;
```

`value` 提供的值先提升为 `int`，加法得到可表示的 `32768`，因此运算阶段没有溢出。写回 `short` 时，C++23 的整数转换规则选择与源整数模 $2^{16}$ 同余的目标值：这里的模是 $2^{16}=65536$，而 $32768-65536=-32768$，结果落在该 `short` 的范围内。转换前后两个值相差一个模，因此同余。这属于运算后的整数转换，不是有符号算术溢出。

这次 `++value` 的表达式类型仍是 `short`，结果指定写回后保存 `-32768` 的对象。若同样从 `32767` 开始执行后置 `value++`，对象也会写回 `-32768`，但表达式提供的旧值是 `short` 类型的 `32767`。

相对地，已经处于最大值的 `int` 再自增，加法仍在 `int` 中进行，无法表示结果，因而产生未定义行为。无符号运算则按运算类型采用模运算。**判断状态更新时，应分开检查运算阶段的范围与写回阶段的转换；语言行为有定义，也不代表结果仍满足业务上的数量约束。**

### 浮点自增也受舍入约束

浮点自增同样执行加一并写回，但有限精度不保证保存的值恰好比原值大 `1`。**本例假设 `double` 采用 binary64 格式，具有 53 位二进制有效精度，相关运算与存储均按 binary64 精度就近取偶，不保留额外中间精度：**

```cpp
double position{9007199254740992.0};
++position;
```

这里的初值是 $2^{53}$，它与下一个较大的 binary64 可表示值相差 `2`。数学上的加一结果位于二者中间，就近取偶仍选择原值，因此执行后 `position` 仍保存 `9007199254740992.0`。这次更新没有产生可区分的新坐标，前置表达式的结果仍然指定 `position`。

这与[浮点运算与舍入](02-arithmetic-operations-and-result-types.md#浮点运算与舍入)中的精度限制相同；具体结果应按目标实现的格式、求值精度和舍入规则核对，不能把这组数值推广到所有实现。

## 让副作用保持可见

赋值、复合赋值、自增和自减都修改对象。它们可以嵌入其他表达式，但这样会要求读者同时追踪计算结果与对象状态：

```cpp
int base_count{10};
int added_count{3};
int total_count{base_count + (added_count += 2)};
```

`added_count += 2` 读取旧值 `3`，加上 `2` 并写回 `5`。这个表达式的结果指定更新后的 `added_count`，外层加法读取其中的 `5`，与 `base_count` 中的 `10` 相加，得到 `15`。最后 `base_count` 为 `10`、`added_count` 为 `5`、`total_count` 为 `15`。

下面是一个独立的等价写法，把状态更新和结果计算分开：

```cpp
int base_count{10};
int added_count{3};

added_count += 2;
int total_count{base_count + added_count};
```

两种写法得到相同的对象状态，分开之后，哪一步把 `added_count` 改为 `5`、哪一步使用这个新值计算总量，都直接可见。

> [!PRACTICE] 让状态更新成为清楚的步骤
> 普通状态更新尽量写成独立语句，使读取旧值、写入新值和使用结果的位置容易辨认。括号可以说明表达式怎样分组，但不能消除其中的状态修改；表达式承担多项任务时，拆分通常更容易核对。

## 参考资料

- [C++23 工作草案：赋值与复合赋值](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：前置自增与自减](https://timsong-cpp.github.io/cppwp/n4950/expr.pre.incr)
- [C++23 工作草案：后置自增与自减](https://timsong-cpp.github.io/cppwp/n4950/expr.post.incr)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom)
- [C++23 工作草案：通常算术转换](https://timsong-cpp.github.io/cppwp/n4950/expr.arith.conv)
- [C++23 工作草案：整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.integral)
- [C++23 工作草案：浮点与整数转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fpint)
- [C++23 工作草案：浮点表达式的中间精度](https://timsong-cpp.github.io/cppwp/n4950/expr.pre#6)
- [Oracle Numerical Computation Guide：IEEE 格式与舍入规则](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_math.html)
