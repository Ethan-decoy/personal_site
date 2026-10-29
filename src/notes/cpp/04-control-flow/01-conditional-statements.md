---
title: 条件选择（Conditional Selection）
date: 2026-08-26
---

# 条件选择（Conditional Selection）

库存有 `5` 件，订单需要 `3` 件，可以发货并把库存扣减为 `2`；如果订单需要 `6` 件，库存就不够，需要先补货。

下面的库存示例约定：库存数量非负，订单数量为正，物品按整数件计算；只有库存足以满足整笔订单时才扣减，不进行部分发货。

程序执行过程中，语句之间的先后、选择与跳过关系称为控制流（control flow）。C++ 使用选择语句（selection statement）根据条件决定沿哪条路径继续。

以下代码片段各自独立，均放在 `main` 函数体内。

## if 语句

`if` 根据条件决定是否执行随后的一条子语句（substatement）。下面用 `stock_count` 保存库存数量，用 `order_count` 保存订单需要的数量：

```cpp
int stock_count{5};
int order_count{3};

if (stock_count >= order_count) {
    stock_count -= order_count;
}

int recorded_stock{stock_count};
```

本例先比较 `5 >= 3`，得到 `true`，因此执行分支体，把库存从 `5` 改为 `2`。分支结束后，继续定义 `recorded_stock`，让它保存处理后的库存 `2`。

> [!IMPORTANT] 先判断条件，再决定是否进入分支
> **执行到这里的普通 `if` 时，先求值条件并按语境转换为 `bool`（contextual conversion to `bool`）；结果为 `true` 时执行子语句，为 `false` 时跳过。**在本例中，分支执行完毕或被跳过后，两条路径都继续到整条 `if` 后面的语句。

保持初始库存为 `5`，改变订单数量，可以看到两条路径及恰好满足订单的边界：

| `order_count` | 是否扣减库存 | `if` 结束后的 `stock_count` | `recorded_stock` |
| ---: | --- | ---: | ---: |
| `3` | 是 | `2` | `2` |
| `5` | 是 | `0` | `0` |
| `6` | 否 | `5` | `5` |

库存不足时，只跳过扣减操作，仍会执行共同的后续定义。`recorded_stock` 因而保存尚未扣减的 `5`。

这里的比较表达式直接产生 `bool` 结果，已经记录好的 `bool` 对象也可以直接用作条件。数值类型同样能用于条件：零转换为 `false`，非零值转换为 `true`，包括负数。不过，`stock_count > 0` 只回答“是否还有库存”；`stock_count >= order_count` 才回答“是否足以满足这笔订单”。

`if` 在语法上控制一条子语句。语言允许省略花括号，直接使用一条简单语句作为分支体；这里的 `{...}` 则是一条复合语句，能够把多步操作组织成完整分支体。花括号之外的 `recorded_stock` 定义属于共同的后续代码。

## else 分支

库存不足时，还可以记录为满足这笔订单需要补入多少件。`else` 为条件不成立的情况提供第二条子语句：

```cpp
int stock_count{5};
int order_count{6};
int shortage_count{0};

if (stock_count >= order_count) {
    stock_count -= order_count;
} else {
    shortage_count = order_count - stock_count;
}

int recorded_stock{stock_count};
```

本例的 `5 >= 6` 为 `false`，进入 `else` 分支，计算需要补足的 `6 - 5`，使 `shortage_count` 保存 `1`。库存没有扣减，`stock_count` 与 `recorded_stock` 都保存 `5`。

把订单数量改为 `3`，比较 `5 >= 3` 得到 `true`，扣减后库存为 `2`，缺口记录仍为 `0`。虽然扣减后的库存已经小于订单数量，也不会回头重新判断并执行 `else`。

> [!IMPORTANT] 一次选择只进入一条分支
> **在这样一次执行中，条件只求值一次：为 `true` 时进入 `if` 分支，为 `false` 时进入 `else` 分支。**分支中的状态修改不会让程序回头重新判断条件，也不会使另一条分支接着执行；本例两条路径随后都继续定义 `recorded_stock`。

`else` 与前面距离最近、尚未拥有 `else` 的 `if` 结合。嵌套选择时，花括号能把这种从属关系直接呈现在代码结构中。

## 连续条件分支

将一个数值分入多个等级时，可以按顺序判断多个条件。以 `0` 到 `100` 分的成绩为例，这里约定：达到 `90` 分记为 `'A'`，达到 `60` 分但不足 `90` 分记为 `'B'`，其余记为 `'C'`。

`else` 后面的子语句本身也可以是另一条 `if`，由此形成连续条件分支：

```cpp
int score{92};
char grade{'C'};

if (score >= 90) {
    grade = 'A';
} else if (score >= 60) {
    grade = 'B';
}
```

源码中的 `else if` 是相邻出现的 `else` 与 `if`，不是一个独立关键字。本例先判断 `92 >= 90`，得到 `true`，把等级改为 `'A'`；后面的 `score >= 60` 不会求值。

> [!IMPORTANT] 连续分支只选择第一条成立的路径
> **`else if` 只有在前面的条件为 `false` 时才会被判断；选中一条分支后，不再求值后续条件。**没有最后的 `else` 且所有条件都不成立时，分支体都不执行，程序从整条选择语句后面继续。

分别改变成绩，可以看到边界处的选择：

| `score` | `score >= 90` | `score >= 60` | 最终的 `grade` |
| ---: | --- | --- | --- |
| `59` | `false` | `false` | `'C'` |
| `60` | `false` | `true` | `'B'` |
| `89` | `false` | `true` | `'B'` |
| `90` | `true` | 未求值 | `'A'` |
| `92` | `true` | 未求值 | `'A'` |

如果去掉连接两个判断的 `else`，就得到两个独立的 `if`：

```cpp
int score{92};
char grade{'C'};

if (score >= 90) {
    grade = 'A';
}

if (score >= 60) {
    grade = 'B';
}
```

现在两个条件都会被判断，而且都为 `true`。等级先改为 `'A'`，再改为 `'B'`，最终结果与连续分支不同。两个独立的 `if` 适合分别判断、分别执行的任务；需要在这些范围之间选择一条路径时，用连续分支表达互斥关系。

本例的 `>= 90` 范围包含在 `>= 60` 范围内。如果把较宽的 `>= 60` 分支写在前面，成绩为 `92` 时便会直接选中 `'B'`，后面的较窄范围没有机会被判断。条件顺序必须体现这里要优先处理较窄范围的意图。

## 分支中的局部对象

回到库存扣减，把操作展开为“计算剩余数量，再写回库存”，就会产生一个只在分支内使用的中间对象：

```cpp
int stock_count{5};
int order_count{3};

if (stock_count >= order_count) {
    int remaining_count{stock_count - order_count};
    stock_count = remaining_count;
}

int recorded_stock{stock_count};
```

条件为 `true` 时，`remaining_count` 完成初始化，保存剩余数量 `2`，再把这个值写回库存。离开分支体后，`remaining_count` 的生命周期结束，外层库存对象仍然存在，`recorded_stock` 保存更新后的 `2`。

如果把订单数量改为 `6`，条件为 `false`，则不会创建 `remaining_count`，库存保持 `5`，共同的后续定义让 `recorded_stock` 保存 `5`。

> [!IMPORTANT] 作用域由结构确定，生命周期沿执行路径开始
> **分支体中的复合语句建立块作用域；对于这里具有自动存储期的普通局部对象，实际进入分支、执行到定义并完成相应初始化后，生命周期才开始，离开分支体时结束。**能在哪些源代码位置找到声明，与一次运行是否创建了对象，需要分别判断。

`remaining_count` 的声明属于分支体中的块作用域。在分支体之后使用这个名称，仍会发生名称查找失败，即使这一次确实执行过相应分支。

> [!IMPORTANT] 运行时跳过不会取消编译检查
> **本节的普通 `if` 即使条件为 `false`，未进入的分支仍需通过语法、名称查找和类型等编译检查。**运行时是否执行一条语句，与源代码是否构成合法程序，需要分别判断。

下面是一个独立的错误片段：

```cpp
if (false) {
    missing_count += 1; // 错误：missing_count 没有声明
}
```

`missing_count` 在当前使用位置没有对应声明，因此代码必须被诊断为不合法。

## 条件表达式

只计算补货缺口时，可以直接选择计算结果。条件运算符（conditional operator）使用三个操作数构成条件表达式（conditional expression）：

```cpp
int stock_count{2};
int order_count{3};

int shortage_count{(stock_count < order_count) ? order_count - stock_count : 0};
```

这里，`stock_count < order_count` 是条件，`order_count - stock_count` 是条件为 `true` 时的候选，`0` 是条件为 `false` 时的候选。本例用 `3 - 2` 得到的 `1` 初始化 `shortage_count`；如果初始库存改为 `5`，就选择 `0`，表示没有缺口。两种情况下，表达式都只计算缺口，不修改库存。

> [!IMPORTANT] 条件表达式只求值一个候选
> **先求值 `?` 前面的条件并按语境转换为 `bool`；为 `true` 时只求值 `:` 前面的候选，为 `false` 时只求值 `:` 后面的候选。**第一个操作数的求值先序于被选择的候选表达式。

这里的两个候选直接产生数值结果：`order_count - stock_count` 与 `0` 都是 `int` 类型，整个条件表达式也是 `int` 类型。

选择订单的包装规格时，还可能遇到混合算术类型。假设小包装重量按 `0.25` 千克记录，常规包装按 `1` 千克记录：

```cpp
bool use_small_package{false};

double package_weight_kg{use_small_package ? 0.25 : 1};
```

第二个操作数 `0.25` 具有 `double` 类型，第三个操作数 `1` 具有 `int` 类型。通常算术转换确定共同类型为 `double`；本例虽然选中整数候选 `1`，仍会把它转换为 `double` 值 `1.0`，再用于初始化 `package_weight_kg`。

> [!IMPORTANT] 候选选择与结果类型分别判断
> **对于这里两个候选直接产生算术类型数值结果的写法，候选类型相同，结果保留该类型；候选具有不同算术类型时，通常算术转换确定共同的结果类型。**两个候选都须是合法表达式，并共同决定结果类型；运行时只求值其中一个。

共同类型由候选确定，外层对象在之后接收结果。把 `use_small_package` 改为 `true`，会选择另一个候选，但不会改变条件表达式的 `double` 类型。

已有对象的名称作为候选时，条件表达式还可能指定被选中的那个对象；上面的数值结果规则有其适用范围。

## 选择语句还是选择结果

`if` 与条件运算符都根据一个条件保留一条执行路径，但它们组织的是不同语法单位：

| 形式 | 选择的内容 | 适合表达的问题 |
| --- | --- | --- |
| `if`、`if` / `else` | 一条子语句 | 根据条件执行不同操作 |
| 条件表达式 | 两个候选表达式之一 | 根据条件取得一个简单结果 |

条件表达式适合直接初始化一个对象或组成简单计算。候选路径包含多条语句、明显的状态修改，或者需要嵌套多个条件时，`if` 通常能够更清楚地呈现控制流。

## 让条件保持可读

条件应当直接回答代码正在判断的问题。已经是 `bool` 的对象可以直接使用；数值拥有多个业务状态时，通常写出明确比较。

例如，要检查库存是否为零，却把比较写成赋值：

```cpp
int stock_count{3};
bool empty{false};

if (stock_count = 0) { // 含义错误：先把库存改成 0，条件为 false
    empty = true;
}
```

赋值把 `stock_count` 改成 `0`，赋值结果再转换为 `false`，分支被跳过，`empty` 仍为 `false`。编译器可能对条件中的赋值发出警告；这里的检查还意外改写了原来的库存记录。

使用 `==` 后，条件只比较原来的值：

```cpp
int stock_count{3};
bool empty{false};

if (stock_count == 0) {
    empty = true;
}
```

现在库存保持 `3`，`empty` 为 `false`。如果初始库存为 `0`，比较得到 `true`，`empty` 改为 `true`；错误的赋值版本则仍会跳过分支。如果只需要保存比较结果，直接写 `bool empty{stock_count == 0};` 即可。

> [!WARNING] 比较条件与赋值有不同作用
> **`==` 产生相等判断，`=` 修改对象；赋值出现在条件中时，还要把赋值结果转换为 `bool`。**合法表达式也可能表达错误意图，不能只根据代码能否编译判断它是否完成了所需检查。

> [!PRACTICE] 让分支边界与状态修改直接可见
> 即使分支只有一条简单语句，也保留花括号，让分支边界与 `else` 的从属关系直接可见。赋值、自增和自减应当放在能够清楚体现修改意图的位置，使读者能够分别核对判断与状态变化。
>
> 分支结构应直接呈现条件、可选路径和共同的后续代码。候选路径包含多步操作或复杂状态修改时，用 `if` 展开过程，比把多层选择塞进一个表达式更容易核对。

## 参考资料

- [C++23 工作草案：if 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.if)
- [C++23 工作草案：语句中的条件](https://timsong-cpp.github.io/cppwp/n4950/stmt.pre)
- [C++23 工作草案：条件运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.cond)
