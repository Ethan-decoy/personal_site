---
title: 多路选择与标签（Multiway Selection and Labels）
date: 2026-08-26
---

# 多路选择与标签（Multiway Selection and Labels）

连续条件分支能够表达任意布尔判断，但有些选择始终在询问同一个离散值是否等于若干固定值之一。`switch` 语句先取得一个控制值，再把执行位置转移到相应标签。

## 从控制值选择入口

```cpp
char command{'p'};
int speed_limit_kmh{80};

switch (command) {
case 's':
    speed_limit_kmh = 0;
    break;
case 'p':
    speed_limit_kmh = 40;
    break;
default:
    speed_limit_kmh = 80;
    break;
}
```

执行到 `switch` 时，控制表达式 `command` 只求值一次。`char` 属于整数类型，并在匹配前进行相应的整数提升；当前值与 `case 'p':` 匹配，因此程序从这个标签后面的语句开始执行。

整数类型可以作为这里使用的控制表达式；`float`、`double` 或 `long double` 不能直接用于 `switch`。**`switch` 不会从上到下依次求值每个 `case`；标签值在程序运行前已经确定，运行时根据控制值选择入口。**

如果没有任何 `case` 匹配，程序会从 `default` 标签开始执行。`default` 最多出现一次，也可以省略；没有匹配项且不存在 `default` 时，`switch` 内部的语句不会执行。

## case 标签的值

`case` 后面的值必须是转换后的常量表达式（converted constant expression），能够按照语言规则在编译期确定，并转换为控制表达式完成整数提升后用于匹配的类型。当前使用的整数和字符字面量满足这项要求，普通可修改变量不满足：

```cpp
int selected_mode{1};
int service_mode{1};

switch (selected_mode) {
case service_mode: // 错误：service_mode 不是常量表达式
    break;
default:
    break;
}
```

同一条 `switch` 中，各个 `case` 值经过转换后还必须互不相同：

```cpp
int selected_mode{1};

switch (selected_mode) {
case 1:
    break;
case 1: // 错误：重复的入口值
    break;
default:
    break;
}
```

这些约束使每个控制值至多对应一个 `case` 入口；`default` 则处理没有对应入口的其余值。

## 标签不会自动停止执行

`case` 与 `default` 是标记入口位置的标签（label），不是彼此隔离的分支。控制进入某个标签后会继续向后执行；遇到后续标签时既不会重新匹配，也不会自动停止：

```cpp
char command{'p'};
int speed_limit_kmh{80};

switch (command) {
case 'p':
    speed_limit_kmh = 40;
case 's':
    speed_limit_kmh = 0;
    break;
default:
    break;
}
```

程序从 `case 'p':` 开始，先把速度限制改为 `40`，随后继续执行 `case 's':` 后面的赋值，最终得到 `0`。这种越过后续标签继续执行的行为称为贯穿执行（fallthrough）。

在当前结构中，`break` 结束这条 `switch`，并把控制转移到整条语句之后。**彼此独立的入口必须保证相应执行路径在到达下一个标签前离开 `switch`。**

## 共享逻辑与有意贯穿

多个连续标签可以共享同一段语句：

```cpp
char command{'p'};
int speed_limit_kmh{80};

switch (command) {
case 'p':
case 'r':
    speed_limit_kmh = 40;
    break;
default:
    break;
}
```

`case 'p':` 后面没有需要单独执行的语句，因此 `'p'` 与 `'r'` 都会进入同一段赋值。这种连续空标签不属于遗漏 `break`。

如果一个入口先执行自己的语句，然后有意继续进入下一个标签，应使用标准属性（standard attribute）`[[fallthrough]]` 明确意图：

```cpp
char command{'w'};
int warning_count{0};
int speed_limit_kmh{80};

switch (command) {
case 'w':
    ++warning_count;
    [[fallthrough]];
case 's':
    speed_limit_kmh = 0;
    break;
default:
    break;
}
```

`[[fallthrough]];` 不改变运行时控制流；它标明这次贯穿是有意行为，并可避免相应编译器警告。末尾的分号属于这条带属性的空语句（null statement），不能省略。沿当前路径，它后面将要执行的下一条语句必须带有同一条 `switch` 的 `case` 或 `default` 标签。

`default` 同样只是入口标签，不要求位于源码中的最后位置。控制从它进入后仍会按源码顺序继续，因此也可能贯穿后续标签。

## 标签与局部对象作用域

通常写法中的 `switch` 外层花括号形成一个代码块，而 `case` 和 `default` 本身不会建立作用域。直接在某个标签后定义的局部变量，其作用域可能延伸到后续标签：

```cpp
char command{'p'};
int speed_limit_kmh{80};

switch (command) {
case 'p':
    int reduced_speed_limit_kmh{40};
    speed_limit_kmh = reduced_speed_limit_kmh;
    break;
case 's': // 错误：可能直接跳到这里并绕过 reduced_speed_limit_kmh 的初始化
    break;
default:
    break;
}
```

控制值为 `'s'` 时，程序需要从 `switch` 条件直接跳转到 `case 's':`，从而绕过 `reduced_speed_limit_kmh` 带初始化器的定义，却进入该名称已经生效的区域。C++ 不允许这样的标签跳转；前一个入口已经写有 `break` 也不能修复这条直接进入后续标签的路径。

**某个入口需要经过初始化的局部对象时，应使用复合语句为它建立独立的块作用域：**

```cpp
char command{'p'};
int speed_limit_kmh{80};

switch (command) {
case 'p': {
    int reduced_speed_limit_kmh{40};
    speed_limit_kmh = reduced_speed_limit_kmh;
    break;
}
case 's': {
    speed_limit_kmh = 0;
    break;
}
default: {
    break;
}
}
```

只有执行路径实际进入相应复合语句并到达对象定义时，局部对象才会创建；进入方式既可能是控制值直接选择，也可能是从前一标签贯穿而来。执行 `break` 离开相应代码块时，已经创建的对象先结束生命周期，随后整条 `switch` 结束。

## switch 与条件分支的选择

`switch` 适合把同一个整数结果与若干固定值进行相等匹配。范围判断、多个对象之间的关系，或者彼此结构不同的布尔条件，应使用 `if` 与连续条件分支直接表达。

**选择 `switch` 的理由是问题本身具有一个离散控制值和多个固定入口，而不是分支数量看起来较多。**无论采用哪种形式，入口、停止位置和未覆盖值都应当从代码结构中清楚可见。

## 参考资料

- [C++23 工作草案：switch 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.switch)
- [C++23 工作草案：break 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.break)
- [C++23 工作草案：控制转移与局部变量](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++23 工作草案：fallthrough 属性](https://timsong-cpp.github.io/cppwp/n4950/dcl.attr.fallthrough)
