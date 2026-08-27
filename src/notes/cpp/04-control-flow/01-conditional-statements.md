---
title: 条件选择（Conditional Selection）
date: 2026-08-26
---

# 条件选择（Conditional Selection）

语句通常沿着当前执行路径依次完成，但程序还需要根据运行时状态选择下一条语句，或者跳过某一段操作。C++ 使用选择语句（selection statement）表达这种执行关系。

**控制流（control flow）描述程序完成当前语句后，接下来会执行哪一条语句。没有被选择、没有被进入或尚未到达的语句不会执行。对于具有自动存储期（automatic storage duration）的普通局部对象，执行路径只有实际到达定义并完成初始化，才会开始对象的生命周期。**

## if 语句

`if` 根据条件决定是否执行随后的一条子语句（substatement）：

```cpp
int tire_pressure_kpa{180};

if (tire_pressure_kpa < 200) {
    tire_pressure_kpa += 20;
}
```

执行到 `if` 时，程序先求值条件 `tire_pressure_kpa < 200`。比较产生 `true`，因此执行后面的复合语句，最终 `tire_pressure_kpa` 保存 `200`。如果初始气压为 `240`，条件便产生 `false`，整个复合语句被跳过。

**`if` 的条件会按语境转换为 `bool`（contextual conversion to `bool`）；只有条件求值完成后，程序才会根据结果决定是否执行子语句。**上例的比较表达式直接提供 `bool` 结果。

`if` 在语法上控制一条子语句。复合语句能够容纳多条语句，却仍然只占据一条语句的位置，因此可以作为完整分支体。语言也允许省略花括号并直接控制一条简单语句；即使分支只有一条简单语句，也保留花括号，使分支边界不依赖缩进或后续修改。

## else 分支

`else` 为条件不成立的情况提供第二条子语句：

```cpp
int tire_pressure_kpa{240};

if (tire_pressure_kpa < 200) {
    tire_pressure_kpa += 20;
} else {
    tire_pressure_kpa -= 5;
}
```

条件只求值一次。结果为 `true` 时执行第一条子语句，结果为 `false` 时执行 `else` 后的第二条子语句；**两条分支中只会有一条沿当前执行路径被进入。**这个例子进入 `else` 分支，最终气压为 `235`。

`else` 总是与前面距离最近、尚未拥有 `else` 的 `if` 结合。统一使用复合语句能够让这种从属关系直接体现在花括号结构中，而不要求读者根据缩进猜测。

## 连续条件分支

`else` 后面的子语句本身也可以是另一条 `if`，由此形成连续条件分支：

```cpp
int tire_pressure_kpa{270};
int speed_limit_kmh{80};

if (tire_pressure_kpa >= 260) {
    speed_limit_kmh = 40;
} else if (tire_pressure_kpa >= 240) {
    speed_limit_kmh = 60;
}
```

源码中的 `else if` 是相邻出现的 `else` 与 `if`，不是一个独立关键字。程序先求值第一个条件；只有它为 `false` 时，才会继续求值第二个条件。

这里第一个条件已经产生 `true`，因此 `speed_limit_kmh` 被改为 `40`，第二个条件不会求值。**连续分支从上到下选择第一条条件成立的路径，条件顺序因而属于程序语义。**像这样逐级划分范围时，应先判断限制更严格的范围，避免较宽条件提前覆盖后续分支。

最后的 `else` 可以省略。所有条件都不成立时，程序直接从整条选择语句之后继续；上例中的 `speed_limit_kmh` 会保留原本表示正常状态的 `80`。

## 分支中的局部对象

分支体使用复合语句时会建立块作用域。局部对象只有在相应分支真正执行，并且程序实际到达其定义时才会开始生命周期：

```cpp
int tire_pressure_kpa{180};

if (tire_pressure_kpa < 200) {
    int pressure_deficit_kpa{200 - tire_pressure_kpa};
    tire_pressure_kpa += pressure_deficit_kpa;
}
```

条件为 `true` 时，`pressure_deficit_kpa` 完成初始化并在分支内使用；离开分支体时，它的生命周期结束。条件为 `false` 时，程序没有进入这个代码块，也就不会创建相应对象。

**块作用域始终由源码结构确定，对象生命周期则取决于运行时执行路径是否真正到达定义。**

## 条件表达式

有时程序需要选择的不是一组操作，而是用于初始化或继续计算的一个结果。条件运算符（conditional operator）使用三个操作数构成条件表达式（conditional expression）：

```cpp
int tire_pressure_kpa{180};

int pressure_adjustment_kpa{
    (tire_pressure_kpa < 200) ? 20 : -5
};
```

程序先求值 `?` 前面的第一个操作数，并将其按语境转换为 `bool`。结果为 `true` 时只求值 `20`，结果为 `false` 时只求值 `-5`；未被选择的候选表达式不会求值。第一个操作数的求值先序于被选择的候选表达式。

**运行时不求值某个候选表达式，不表示它可以在源代码中语法错误或类型不合法。**两个候选都必须是合法表达式，并共同决定整个条件表达式的类型。

这个例子中的两个候选表达式都产生 `int` 结果，因此整个条件表达式可以直接初始化 `int` 对象。两个候选表达式都具有算术类型且结果类型不同时，通常算术转换会确定共同类型：

```cpp
bool use_fine_step{true};

double pressure_step_kpa{
    use_fine_step ? 0.25 : 1
};
```

第二个候选表达式产生 `double`，第三个产生 `int`；算术转换使候选结果采用共同的 `double` 类型，因此 `pressure_step_kpa` 保存 `0.25`。

**以上结论适用于两个候选表达式都具有算术类型的情形。**在这个范围内，条件求值、候选求值和结果类型都能够由布尔语境与算术转换规则准确确定。

## 选择语句还是选择结果

`if` 与条件运算符都根据一个条件保留一条执行路径，但它们组织的是不同语法单位：

| 形式 | 选择的内容 | 适合表达的问题 |
| --- | --- | --- |
| `if`、`if` / `else` | 一条子语句 | 根据条件执行不同操作 |
| 条件表达式 | 两个候选表达式之一 | 根据条件取得一个简单结果 |

条件表达式适合直接初始化一个对象或组成简单计算。候选路径包含多条语句、明显的状态修改，或者需要嵌套多个条件时，`if` 通常能够更清楚地呈现控制流。

## 让条件保持可读

条件应当直接回答代码正在判断的问题。已经是 `bool` 的对象可以直接使用；数值拥有多个业务状态时，通常写出明确比较。赋值、自增和自减虽然可以出现在表达式中，却不应惯性地隐藏在条件里，使读者同时追踪判断与状态修改。

**分支结构应让读者直接看见条件、可选路径和最终汇合位置，而不是要求读者证明缩进或表达式副作用恰好产生了预期结果。**

相关语言规则可参阅 C++23 工作草案中的 [if 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.if)、[语句中的条件](https://timsong-cpp.github.io/cppwp/n4950/stmt.pre)与[条件运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.cond)。
