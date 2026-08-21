---
title: switch 语句（Switch Statements）
date: 2026-08-13
---

# switch 语句（Switch Statements）

## 基本结构

**当多个分支都在判断同一个值是否等于若干固定值之一时，可以使用 `switch` 语句：**

```cpp
int drive_mode{2};
int throttle_limit{0};

switch (drive_mode) {
case 0:
    throttle_limit = 40;
    break;
case 1:
    throttle_limit = 70;
    break;
case 2:
    throttle_limit = 100;
    break;
default:
    throttle_limit = 0;
    break;
}
```

**执行到 `switch` 时，控制表达式 `drive_mode` 只求值一次。**当前值为 `2`，因此程序从 `case 2:` 标记的位置开始执行；随后遇到 `break`，结束整条 `switch` 语句，最终 `throttle_limit` 保存 `100`。

如果没有任何 `case` 与控制表达式的值匹配，程序便从 `default:` 开始执行。**`default` 可以省略；省略后若没有匹配项，`switch` 内部不会执行任何语句。**

## `case` 标签与贯穿执行

**`case` 和 `default` 并不会分别建立彼此隔离的分支。它们是 `switch` 内部的标签（label），用于标记程序可以从哪里开始执行。**一旦找到匹配的入口，程序便继续向后执行；遇到后续的 `case` 或 `default` 标签时，不会自动停止，也不会重新匹配。

```cpp
int drive_mode{1};
int throttle_limit{0};

switch (drive_mode) {
case 0:
    throttle_limit = 40;
case 1:
    throttle_limit = 70;
case 2:
    throttle_limit = 100;
default:
    throttle_limit = 0;
}
```

程序从 `case 1:` 开始，先将 `throttle_limit` 赋值为 `70`，随后继续执行 `case 2:` 和 `default:` 后面的语句，因此最终保存 `0`。**这种继续进入后续标签的行为称为贯穿执行（fallthrough）。**

对于彼此独立的分支，应当在各自逻辑结束后使用 `break`：

```cpp
switch (drive_mode) {
case 0:
    throttle_limit = 40;
    break;
case 1:
    throttle_limit = 70;
    break;
case 2:
    throttle_limit = 100;
    break;
default:
    throttle_limit = 0;
    break;
}
```

**`break` 会结束最近一层 `switch`，使执行从其右花括号之后继续。更准确地说，每条不应继续贯穿的执行路径，都需要在到达下一个标签前离开 `switch`；目前使用的离开方式就是 `break`。**

多个标签也可以有意共享同一段逻辑：

```cpp
switch (drive_mode) {
case 0:
case 1:
    throttle_limit = 70;
    break;
case 2:
    throttle_limit = 100;
    break;
default:
    throttle_limit = 0;
    break;
}
```

**这里 `case 0:` 后面没有自己的语句，因此值为 `0` 或 `1` 时都会执行同一段赋值。这种连续空标签共享逻辑的写法，不属于意外遗漏 `break`。**

`continue` 不在这里展开：它控制的是循环的下一轮，而不是 `switch`。当 `switch` 位于循环内部时，`continue` 的目标仍然是外层循环。等循环章节再完整说明。

## 控制表达式与标签值

**对于当前已经介绍的类型，`switch` 的控制表达式可以产生整数类型的值：**

```cpp
int drive_mode{2};

switch (drive_mode) {
case 0:
    break;
case 1:
    break;
case 2:
    break;
}
```

浮点类型不能直接作为 `switch` 的控制表达式：

```cpp
double temperature{21.5};

switch (temperature) { // 错误：控制表达式是浮点类型
case 20:
    break;
}
```

**每个 `case` 后面必须是编译期可以确定的常量表达式，而不能依赖程序运行期间才能取得的普通变量；**常量表达式与 `case` 标签的精确要求参见[常量表达式与 constexpr](../06-constants-literals-and-type-conversions/03-constant-expressions-and-constexpr.md)：

```cpp
int selected_mode{1};
int target_mode{1};

switch (selected_mode) {
case target_mode: // 错误：target_mode 不是常量表达式
    break;
}
```

直接写出的整数字面量满足这一要求。**同一条 `switch` 中，各个 `case` 转换后的值还必须互不相同：**

```cpp
switch (selected_mode) {
case 1:
    break;
case 1: // 错误：重复的 case 值
    break;
}
```

枚举类型也可以用于 `switch`，但它的定义与使用规则将在枚举章节完整介绍。届时，枚举项会比 `0`、`1`、`2` 更适合表达真实程序中的有限状态。

## 分支中的块作用域

**`switch` 外侧的花括号形成一个代码块，但 `case` 和 `default` 只是标签，本身不会为各个分支建立独立的块作用域。**

```cpp
switch (drive_mode) {
case 0:
    int throttle_limit{40};
    break;

case 1: // 错误：可能直接跳到这里，越过 throttle_limit 的初始化
    break;
}
```

`throttle_limit` 的声明位于整个 `switch` 代码块中，其作用域会延伸到后续标签。但当 `drive_mode` 为 `1` 时，程序需要直接从 `case 1:` 开始执行，从而越过 `throttle_limit` 的初始化。**C++ 不允许这样进入一个已经生效、却未完成相应初始化的局部对象作用域，因此程序不合法。**

**当不同分支需要各自的局部对象时，可以主动使用复合语句建立独立的块作用域：**

```cpp
switch (drive_mode) {
case 0: {
    int throttle_limit{40};
    // 使用 throttle_limit
    break;
}

case 1: {
    int throttle_limit{70};
    // 使用 throttle_limit
    break;
}

default: {
    break;
}
}
```

每个 `throttle_limit` 都只属于相应分支。进入该分支时对象被创建并初始化；执行 `break` 离开分支时，对象先被销毁，随后结束整个 `switch`。

**如果分支中没有需要限制作用域的局部声明，则不必机械地为每个 `case` 增加代码块；需要分支局部对象时再添加即可。**
