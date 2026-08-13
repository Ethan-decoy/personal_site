---
title: 条件语句（Conditional Statements）
date: 2026-08-13
---

# 条件语句（Conditional Statements）

## `if` 语句

`if` 语句根据一个条件，决定是否执行随后的一条语句。它的基本结构可以表示为：

```text
if (condition)
    statement;
```

其中，条件外侧的圆括号 `()` 是语法的一部分。条件为 `true` 时执行随后的语句，为 `false` 时跳过它。

当一个分支需要执行多条语句时，可以使用复合语句将它们组成一条语句：

```text
if (condition) {
    statement_1;
    statement_2;
}
```

即使分支中暂时只有一条语句，工程实践中通常也保留花括号。这样可以让分支边界始终清晰，并避免后续增加语句时意外将它写到 `if` 的控制范围之外。后续笔记中的条件语句将统一使用花括号：

```text
if (condition) {
    statement;
}
```

代码块内部需要分号的简单语句仍然以 `;` 结束，而右花括号 `}` 后不需要额外添加分号。

下面的条件由一个比较表达式提供：

```cpp
int tire_pressure{180};

if (tire_pressure < 200) {
    tire_pressure = 200;
}
```

执行到 `if` 时，程序先对条件表达式 `tire_pressure < 200` 求值。当前比较得到 `bool` 值 `true`，因此进入代码块并执行赋值，最终 `tire_pressure` 保存 `200`。

如果初始值改为 `240`，比较结果就是 `false`，整个代码块被跳过，`tire_pressure` 仍然保存 `240`。每次执行到一条 `if` 语句时，其条件都会先被求值，再由得到的布尔结果决定是否执行对应语句。

## `else` 分支

`else` 可以跟在 `if` 之后，指定条件为 `false` 时执行的语句：

```text
if (condition) {
    statement_when_true;
} else {
    statement_when_false;
}
```

例如：

```cpp
int tire_pressure{180};

if (tire_pressure < 200) {
    tire_pressure = 200;
} else {
    tire_pressure -= 5;
}
```

条件只求值一次，并且两个分支中只会执行一个。这里条件为 `true`，因此执行第一个代码块，`tire_pressure` 最终保存 `200`；如果初始值为 `240`，则跳过第一个代码块并执行 `else` 分支，最终保存 `235`。

`else` 本身不包含条件，它表示前面的 `if` 条件不成立时采用的执行路径。

## 连续条件分支

当两条执行路径不足以表达全部情况时，可以让 `else` 后面的语句本身成为另一条 `if` 语句：

```cpp
if (condition_1) {
    statement_1;
} else {
    if (condition_2) {
        statement_2;
    } else {
        statement_3;
    }
}
```

`if` 语句整体也是一条语句，因此第二条 `if` 不必额外放入代码块，通常将上面的结构平铺为：

```cpp
if (condition_1) {
    statement_1;
} else if (condition_2) {
    statement_2;
} else {
    statement_3;
}
```

C++ 中的 `else if` 并不是一个独立关键字，而是相邻出现的 `else` 和 `if`。在这段结构中，第一个 `else` 属于第一条 `if`，最后的 `else` 属于第二条 `if`，因此每条 `if` 仍然最多只有一个 `else`。

一般来说，`else` 会与前面距离最近且尚未拥有 `else` 的 `if` 结合。统一使用花括号可以让这种从属关系更加清楚。

连续条件从上到下依次求值。遇到第一个结果为 `true` 的条件后，只执行对应的分支，后续条件不会继续求值；只有前面的条件全部为 `false` 时，才执行最后的 `else`：

```cpp
int tire_pressure{270};
int pressure_level{0};

if (tire_pressure >= 260) {
    pressure_level = 2;
} else if (tire_pressure >= 220) {
    pressure_level = 1;
} else {
    pressure_level = 0;
}
```

这里的第一个条件已经得到 `true`，因此 `pressure_level` 被赋值为 `2`，第二个条件不再求值。连续分支的排列顺序会直接影响执行结果；像这样逐级划分范围时，应当先判断范围更严格的条件。

## 条件表达式

`if` 的条件本身是一个表达式。表达式求值后，其结果会在条件语境中转换为 `bool`。因此，条件不一定原本就是比较表达式或 `bool` 对象。对于目前接触的算术类型，零转换为 `false`，非零值转换为 `true`：

```cpp
int retry_count{3};

if (retry_count) {
    --retry_count;
}
```

这段代码合法，因为 `retry_count` 当前提供非零值，条件转换为 `true`。不过，如果真正需要表达的是“仍有大于零的重试次数”，直接写出比较通常更加准确：

```cpp
if (retry_count > 0) {
    --retry_count;
}
```

显式比较还能避免负数同样被转换为 `true`。

条件中的 `=` 与 `==` 具有完全不同的含义：

```cpp
if (retry_count = 0) {
    // ...
}
```

这里的 `retry_count = 0` 是赋值表达式。它先将 `retry_count` 修改为 `0`，随后以赋值表达式产生的值参与条件判断，因此条件为 `false`。这段代码在语言层面可以成立，编译器通常会发出警告。如果目的是判断是否等于零，应当使用相等性运算符：

```cpp
if (retry_count == 0) {
    // ...
}
```

## 分支中的局部对象

条件分支使用的复合语句会建立块作用域。只有相应分支实际执行时，其中的局部对象才会被创建和初始化；离开该分支的代码块时，这些对象的生命周期结束：

```cpp
int tire_pressure{180};

if (tire_pressure < 200) {
    int adjustment{200 - tire_pressure};
    tire_pressure += adjustment;
} // adjustment 的生命周期结束
```

`adjustment` 的名称只在这个分支内部可见。如果条件为 `false`，程序会跳过整个代码块，`adjustment` 对象也不会被创建。

## 条件运算符

当程序需要根据一个条件从两个表达式中选择一个时，可以使用条件运算符（conditional operator）：

```text
condition ? expression_when_true : expression_when_false
```

它先求值 `condition`。条件为 `true` 时，只求值 `?` 后面的表达式；条件为 `false` 时，只求值 `:` 后面的表达式。未被选择的表达式不会求值。由于它拥有三个操作数，条件运算符也常称为三元运算符（ternary operator）。

例如，下面的 `if` / `else` 先创建了一个只用于占位的初始状态，随后才通过赋值建立真正需要的值：

```cpp
int tire_pressure{180};
int displayed_pressure{0};

if (tire_pressure < 200) {
    displayed_pressure = 200;
} else {
    displayed_pressure = tire_pressure;
}
```

条件运算符本身是表达式，因此可以直接用它的结果初始化对象：

```cpp
int tire_pressure{180};

int displayed_pressure{
    (tire_pressure < 200) ? 200 : tire_pressure
};
```

这里的条件为 `true`，因此选择整数值 `200`，`displayed_pressure` 从创建开始就具有最终需要的值。

条件运算符适合在两个简单表达式之间选择结果，不适合代替包含多条语句或明显状态修改的 `if` / `else`。嵌套多个条件运算符也容易隐藏执行关系，应优先选择更清晰的条件语句。两个候选表达式怎样共同决定整个条件表达式的类型，涉及更完整的类型规则，将在后续相关内容中继续展开。

## 基本编码习惯

### 让条件直接表达问题

对于本来就是 `bool` 的对象，直接使用它或对它取反，不必再与布尔字面量比较：

```cpp
bool pressure_valid{true};

if (pressure_valid) {
    // ...
}

if (!pressure_valid) {
    // ...
}
```

下面的写法虽然合法，却增加了没有必要的比较：

```cpp
if (pressure_valid == true) {
    // ...
}
```

但整数通常拥有两个以上的业务状态，因此应当明确写出需要判断的关系：

```cpp
if (retry_count > 0) {
    --retry_count;
}
```

而不是仅仅依赖“非零转换为 `true`”：

```cpp
if (retry_count) {
    --retry_count;
}
```

这与 C++ Core Guidelines [ES.87：不要在条件中加入冗余的比较](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es87-dont-add-redundant-or--to-conditions)所说明的边界一致：布尔条件避免冗余比较，数值条件则通常应明确表达零代表什么。

### 不在条件中隐藏状态修改

条件首先应当清楚回答一个问题。赋值、自增或自减等状态修改混入条件后，读者还必须同时追踪对象何时发生变化：

```cpp
if (retry_count = 3) {
    // ...
}
```

即使修改是有意的，也更适合拆开表达：

```cpp
retry_count = 3;

if (retry_count > 0) {
    // ...
}
```

Clang-Tidy 专门提供了 [`bugprone-assignment-in-if-condition`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-if-condition.html) 和 [`bugprone-inc-dec-in-conditions`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/inc-dec-in-conditions.html) 检查，因为这类写法既容易把 `=` 误写成 `==`，也容易隐藏求值期间的状态变化。
