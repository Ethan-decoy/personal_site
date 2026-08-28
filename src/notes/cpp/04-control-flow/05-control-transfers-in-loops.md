---
title: 循环中的控制转移（Control Transfers in Loops）
date: 2026-08-26
---

# 循环中的控制转移（Control Transfers in Loops）

循环通常在条件不再成立时结束，并沿正常路径完成每一轮。但循环体内部有时已经能够确定当前过程不必继续：目标已经找到时可以结束整个循环，当前数据无需处理时可以放弃本轮剩余语句。

`break` 与 `continue` 都属于跳转语句（jump statement）。它们不会修改循环条件，而是直接改变当前语句完成后将要执行的位置。

## break 结束循环

```cpp
int processed_count{0};

for (int value{1}; value <= 10; ++value) {
    if (value == 4) {
        break;
    }

    ++processed_count;
}
```

当 `value` 保存 `4` 时，程序执行 `break`，立即结束包围它的 `for`。本轮尚未执行的 `++processed_count` 被跳过，`for` 的迭代表达式 `++value` 和下一次条件也不会再求值；最终 `processed_count` 保存 `3`。

**`break` 结束包围它的最内层循环或 `switch`，控制从该结构之后继续。**它结束的是循环本身，不只是触发它的 `if` 分支，也不要求循环条件先变成 `false`。

## continue 放弃当前一轮

```cpp
int processed_count{0};

for (int value{1}; value <= 5; ++value) {
    if (value == 3) {
        continue;
    }

    ++processed_count;
}
```

当 `value` 保存 `3` 时，`continue` 跳过本轮剩余的 `++processed_count`，却没有结束整个循环。程序仍然求值 `for` 的迭代表达式 `++value`，随后重新判断条件；最终只有四轮增加了 `processed_count`。

**`continue` 结束的是当前一轮尚未完成的循环体，不是整条循环。**它接下来到达的位置由循环形式决定：

| 循环形式 | 执行 continue 后的下一步 |
| --- | --- |
| `while` | 重新求值条件 |
| `do-while` | 求值循环体之后的条件 |
| `for` | 先求值迭代表达式，再重新求值条件 |

因此，把 `continue` 简单理解为“直接回到循环开头”并不准确；对于 `for` 和 `do-while`，它都必须先经过相应的后续组成部分。

## 嵌套结构中的目标

循环可以嵌套，`switch` 也可以出现在循环体中。`break` 与 `continue` 只作用于各自最近的合法目标：

| 语句 | 目标 |
| --- | --- |
| `break` | 最内层包围它的循环或 `switch` |
| `continue` | 最内层包围它的循环；`switch` 不是它的目标 |

```cpp
int processed_sections{0};

for (int lap{0}; lap < 3; ++lap) {
    for (int section{0}; section < 4; ++section) {
        if (section == 2) {
            break;
        }

        ++processed_sections;
    }
}
```

每轮外层循环中，内层循环只处理 `section` 为 `0` 和 `1` 的两轮。`break` 结束内层 `for`，外层循环仍然继续，因此 `processed_sections` 最终保存 `6`。

当 `switch` 位于循环内部时，直接属于 `switch` 的 `break` 只结束 `switch`；其中的 `continue` 没有 `switch` 目标，会作用于包围它的最近循环。代码结构较深时，必须从语法嵌套关系判断目标，不能根据缩进附近出现了哪个关键字猜测。

## 控制转移与局部对象生命周期

`break` 和 `continue` 可以跳过尚未执行的语句，却不能绕过已经创建的局部对象在离开作用域时的销毁：

```cpp
int processed_count{0};

for (int lap{0}; lap < 3; ++lap) {
    int lap_number{lap + 1};

    if (lap_number == 2) {
        continue;
    }

    ++processed_count;
}
```

第二轮执行 `continue` 时，`lap_number` 已经完成初始化。程序先离开循环体并结束这个对象的生命周期，然后求值 `++lap`，再进入下一次条件判断。

如果这里执行 `break`，当前 `lap_number` 同样先被销毁；随后程序离开整条 `for`，初始化语句创建的 `lap` 也结束生命周期。写在控制转移之后、执行路径没有到达的对象定义不会执行初始化，也就没有相应对象需要销毁。

**控制转移改变的是接下来的执行位置，不会撤销已经发生的初始化，也不会取消离开作用域所要求的生命周期结束。**

## continue 与循环推进

`for` 把迭代表达式放在独立位置，因此执行 `continue` 后仍会完成统一推进。`while` 和 `do-while` 的状态修改通常写在循环体里，`continue` 可能意外跳过它：

```cpp
int value{0};

while (value < 5) {
    if (value == 2) {
        continue;
    }

    ++value;
}
```

`value` 依次变为 `1` 和 `2`。此后当前执行路径每轮都会进入 `continue`，没有机会到达 `++value`，条件也就持续产生 `true`。

**在 `while` 与 `do-while` 中，每一条可能执行 `continue` 的路径都必须与原本的循环推进关系一致。**这不要求所有状态每轮单调变化，但不能让控制转移反复绕过预期终止所依赖的更新。

## 让提前转移保持局部而明确

`break` 与 `continue` 不是应当机械避免的写法。已经找到目标时，`break` 能直接表达“循环完成”；某一轮不需要继续处理时，靠近判断位置的 `continue` 也可以缩短主要执行路径。

真正需要限制的是在较长循环体或多层嵌套中分散许多控制转移，使读者难以找到所有出口和继续位置。**提前转移应靠近触发它的条件，并且只有在比继续增加嵌套更清楚时使用。**结束当前单层循环时，也不应通过篡改循环变量或制造隐蔽状态来模拟本可直接表达的 `break`。

## 参考资料

- [C++23 工作草案：跳转语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.jump)
- [C++23 工作草案：break 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.break)
- [C++23 工作草案：continue 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.cont)
- [C++23 工作草案：控制转移时的局部对象销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++ Core Guidelines：ES.77 减少循环中的 break 与 continue](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es77-minimize-the-use-of-break-and-continue-in-loops)
