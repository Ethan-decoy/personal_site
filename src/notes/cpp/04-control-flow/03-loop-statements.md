---
title: 循环语句（Loop Statements）
date: 2026-08-13
---

# 循环语句（Loop Statements）

## `while` 语句

`while` 语句会先判断一个条件。只要条件为 `true`，就执行循环体；每次执行完循环体后，再次判断条件：

```text
while (condition) {
    statement_sequence
}
```

这里的 `condition` 和 `statement_sequence` 是用于说明语法结构的占位符，并不是实际的 C++ 代码。`statement_sequence` 表示由零条或多条完整语句组成的语句序列；每条具体语句是否需要以分号结束，由该语句自身的语法决定。

例如：

```cpp
int remaining_laps{3};

while (remaining_laps > 0) {
    --remaining_laps;
}
```

第一次判断时，`remaining_laps > 0` 得到 `true`，循环体将其减为 `2`。程序随后重新判断条件，并继续执行循环体，直到 `remaining_laps` 变为 `0`。此时条件得到 `false`，循环结束。

在这个例子中，条件共被求值四次，循环体执行三次。由于 `while` 在进入循环体之前就会判断条件，如果条件第一次求值便得到 `false`，循环体一次也不会执行。

## `do-while` 语句

`do-while` 语句会先执行一次循环体，然后求值条件。条件为 `true` 时继续下一轮，为 `false` 时结束循环：

```text
do {
    statement_sequence
} while (condition);
```

这里末尾的分号是 `do-while` 语法的一部分，不能省略。

例如：

```cpp
int tire_pressure{210};

do {
    tire_pressure += 5;
} while (tire_pressure < 220);
```

程序先将 `tire_pressure` 修改为 `215`，随后第一次判断条件。由于 `215 < 220`，循环体再次执行，将其修改为 `220`；第二次判断得到 `false`，循环结束。

与 `while` 不同，即使条件第一次判断便是 `false`，`do-while` 的循环体也已经执行了一次。因此，它适合必须先完成一次操作，之后才能决定是否继续的场景。

## `for` 语句

`for` 语句把循环开始前的初始化、每轮执行前的条件和每轮结束后的更新集中写在一起。它的基本结构可以表示为：

```text
for (initialization; condition; update) {
    statement_sequence
}
```

三个部分的执行顺序是：

1. `initialization` 只执行一次；
2. 求值 `condition`，结果为 `false` 时结束循环；
3. 条件为 `true` 时执行循环体；
4. 执行 `update`；
5. 回到第二步，重新求值条件。

例如：

```cpp
int completed_laps{0};

for (int lap{0}; lap < 3; ++lap) {
    ++completed_laps;
}
```

`lap` 首先被初始化为 `0`。随后依次以 `0`、`1` 和 `2` 通过条件判断并执行循环体，使 `completed_laps` 最终保存 `3`。第三轮结束后，`lap` 更新为 `3`，条件 `lap < 3` 得到 `false`，循环结束。

圆括号内的两个分号用于分隔三个组成部分；它们不能因为每个部分较短而省略。

## 循环中的作用域与生命周期

循环体使用复合语句时，也会形成块作用域。每次进入循环体，执行到局部对象的声明时，都会初始化一个新的对象；本轮循环体结束时，该对象随之销毁。

```cpp
for (int lap{0}; lap < 3; ++lap) {
    int current_lap{lap + 1};
}
```

`lap` 在 `for` 的初始化部分只初始化一次。循环期间，条件、更新部分和循环体始终使用同一个 `lap` 对象；整个 `for` 语句结束后，它的生命周期才结束。

`current_lap` 则属于循环体的块作用域。循环体每执行一次，都会创建一个新的 `current_lap` 对象；到达循环体末尾时将其销毁，然后才执行 `++lap`。因此，这段代码共创建并销毁了三个不同的 `current_lap` 对象。

## 可以省略的组成部分

`for` 圆括号内的初始化、条件和更新部分都可以省略，但用于分隔它们的两个分号仍须保留。

```cpp
int lap{0};

for (; lap < 3;) {
    ++lap;
}
```

这里没有初始化部分，更新也被放进了循环体。这段代码合法，但其结构实际更接近 `while`：

```cpp
int lap{0};

while (lap < 3) {
    ++lap;
}
```

省略条件时，循环条件视为始终成立：

```cpp
for (;;) {
    // 循环不会因条件变为 false 而结束
}
```

这种写法表示有意构造无限循环。如何从循环体内部改变正常执行过程，将在后续介绍 `break` 和 `continue` 时说明。

## 循环语句的选择

`while`、`do-while` 和 `for` 往往能够描述相同的重复过程，但不同写法会突出不同的程序结构。

| 循环语句 | 适合表达的结构 |
|---|---|
| `for` | 存在明确的循环变量，其初始化、条件和更新可以集中表达 |
| `while` | 是否继续主要取决于某个状态，没有自然且固定的循环变量更新过程 |
| `do-while` | 必须先执行一次操作，之后才能判断是否继续 |

例如，下面的循环拥有明确的 `lap`，并且它的初始化、判断和更新共同构成完整的控制过程，因此使用 `for` 更自然：

```cpp
for (int lap{0}; lap < 3; ++lap) {
    // ...
}
```

不同循环语句之间并非存在绝对的能力差异。选择它们的主要目的，是让代码结构直接反映循环得以开始、继续和结束的方式。

## 基本编码习惯

### 集中表达循环控制

使用 `for` 表达由循环变量控制的重复过程时，通常应在初始化部分声明循环变量，并在更新部分统一修改它：

```cpp
int completed_laps{0};

for (int lap{0}; lap < 3; ++lap) {
    ++completed_laps;
}
```

不应在更新部分之外再次修改同一个循环变量：

```cpp
for (int lap{0}; lap < 6; ++lap) {
    ++completed_laps;
    ++lap;
}
```

第二段代码每轮都会将 `lap` 修改两次，实际依次处理的是 `0`、`2` 和 `4`。循环的推进方式已经无法只通过 `for` 的开头看清，也更容易产生遗漏或越过边界的问题。

如果循环状态需要根据循环体中的情况以不同方式变化，`while` 通常能够更直接地表达这种结构。

### 让终止条件与推进过程对应

循环条件依赖的状态，应当在循环过程中朝着使条件变为 `false` 的方向变化：

```cpp
int tire_pressure{180};

while (tire_pressure < 220) {
    tire_pressure += 5;
}
```

这里的条件取决于 `tire_pressure`，而每轮循环都会将其增加 `5`。当它达到 `220` 时，条件得到 `false`，循环结束。

如果遗漏了相应的状态修改：

```cpp
int tire_pressure{180};

while (tire_pressure < 220) {
    // tire_pressure 始终没有变化
}
```

条件会一直得到 `true`，程序也就无法通过该条件结束循环。阅读一个普通循环时，应当能够清楚找到条件所依赖的状态，以及这个状态如何逐步接近终止条件。

无限循环有时是有意设计的；这种情况下，应使用 `for (;;)` 等能够明确表达意图的结构，而不是让它看起来像一次遗漏了更新操作的错误。
