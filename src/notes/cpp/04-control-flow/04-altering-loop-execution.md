---
title: 改变循环执行（Altering Loop Execution）
date: 2026-08-13
---

# 改变循环执行（Altering Loop Execution）

循环通常按照自身的条件和更新过程不断执行，但有时在循环体内部已经能够确定后续行为。例如，找到目标后便不再需要继续搜索；遇到不需要处理的数据时，也可以直接进入下一轮循环。

C++ 提供了两条改变循环执行过程的语句：

**- `break` 立即结束整个循环；**
**- `continue` 跳过本轮尚未执行的部分，进入下一轮循环。**

它们不会改变循环条件本身，而是在执行到相应语句时，直接改变程序接下来执行的位置。

## `break` 语句

**执行到 `break` 时，当前循环立即结束，程序从循环之后的第一条语句继续执行。**循环原本的条件是否仍为 `true`，不会影响这次结束。

```cpp
int first_matching_value{0};

for (int value{1}; value <= 10; ++value) {
    if (value == 4) {
        first_matching_value = value;
        break;
    }
}
```

当 `value` 为 `4` 时，条件成立，`first_matching_value` 被赋值为 `4`，随后执行 `break`。循环立即结束，**本轮之后的更新以及所有剩余轮次都不再执行。**

`break` 常用于已经找到目标、继续循环不再具有意义的场景。**它结束的是包含它的循环，而不只是包围它的 `if` 语句。**

## `continue` 语句

**执行到 `continue` 时，本轮循环体中尚未执行的语句会被跳过，随后开始下一轮循环：**

```cpp
int processed_count{0};

for (int value{1}; value <= 5; ++value) {
    if (value == 3) {
        continue;
    }

    ++processed_count;
}
```

当 `value` 为 `3` 时，`continue` 跳过本轮的 `++processed_count`。但它不会结束整个循环：`for` 的更新部分 `++value` 仍会执行，之后再次求值循环条件。最终，`processed_count` 保存 `4`。

`continue` 之后具体执行的位置取决于循环语句：

| 循环语句 | 执行 `continue` 后 |
|---|---|
| `for` | 先执行更新部分，再求值条件 |
| `while` | 直接重新求值条件 |
| `do-while` | 求值循环体之后的条件 |

因此，**`continue` 表示放弃本轮剩余工作，而 `break` 表示结束整个循环。**

## 嵌套循环

循环体中还可以包含另一条循环语句，由此形成嵌套循环。**`break` 和 `continue` 出现在嵌套循环中时，只作用于直接包含它们的最内层循环。**

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

每一轮外层循环中，内层循环都会处理 `section` 为 `0` 和 `1` 的两轮；当 `section` 为 `2` 时，`break` 结束内层循环，但外层循环仍会继续。因此，`processed_sections` 最终保存 `6`。

如果将这里的 `break` 换成 `continue`，被跳过的也只是内层循环的当前一轮，随后执行内层循环的更新部分。外层循环不会因此直接进入下一轮。

## 与 `switch` 嵌套

**`break` 既可以结束循环，也可以结束 `switch`。当二者相互嵌套时，它只结束直接包含它的最内层循环或 `switch`：**

```cpp
int drive_mode{0};
int completed_laps{0};

for (int lap{0}; lap < 3; ++lap) {
    switch (drive_mode) {
    case 0:
        break;
    }

    ++completed_laps;
}
```

这里的 `break` 直接属于 `switch`，因此只结束 `switch`。外层 `for` 仍然继续执行，`completed_laps` 最终保存 `3`。

**`continue` 只能作用于循环，不能以 `switch` 为目标。**如果将示例中的 `break` 换成 `continue`，它会跳过外层循环本轮剩余的 `++completed_laps`，随后执行 `for` 的更新部分并进入下一轮。

## 提前离开循环体时的对象生命周期

**`break` 和 `continue` 会改变接下来执行的位置，但不会跳过已经创建的局部对象所需的销毁过程。**

```cpp
int processed_count{0};

for (int lap{0}; lap < 3; ++lap) {
    int current_lap{lap + 1};

    if (current_lap == 2) {
        continue;
    }

    ++processed_count;
}
```

第二轮执行到 `continue` 时，`current_lap` 已经完成初始化。程序在离开本轮循环体前先销毁这个对象，然后执行 `for` 的更新部分。`continue` 后面的 `++processed_count` 被跳过。

如果这里使用 `break`，本轮已经创建的局部对象同样会先被销毁，随后才从整个循环之后继续执行。**写在 `break` 或 `continue` 之后且未被执行到的声明，则不会创建相应对象。**

对于 `int`，销毁通常没有可观察的额外动作；以后局部对象开始管理内存、文件或锁等资源时，这条规则会直接决定资源何时被释放。

## `continue` 与循环状态更新

**在 `for` 中执行 `continue` 后，更新部分仍然会执行；`while` 没有独立的更新部分，因此需要特别注意不要跳过维持循环推进的状态修改：**

```cpp
int value{0};

while (value < 5) {
    if (value == 2) {
        continue;
    }

    ++value;
}
```

当 `value` 变为 `2` 后，`continue` 会反复跳过 `++value`。条件 `value < 5` 始终为 `true`，循环无法结束。

如果存在明确的循环变量，将更新集中在 `for` 的更新部分通常更清晰：

```cpp
for (int value{0}; value < 5; ++value) {
    if (value == 2) {
        continue;
    }

    // 处理其他值
}
```

**使用 `while` 或 `do-while` 时，每条可能执行 `continue` 的路径都不应破坏循环状态原本的推进过程。**

## 基本编码习惯

### 让控制转移保持清晰

**`break` 和 `continue` 并非需要避免的错误。当目标已经找到时，`break` 能够直接表达“搜索结束”；当某一轮不需要继续处理时，`continue` 也能直接表达“跳过本轮”。**

真正需要警惕的是在较长或多层嵌套的循环体中分散使用许多 `break` 和 `continue`。读者可能难以发现这些语句，也难以判断程序接下来会进入哪一层结构。

**因此，它们应当靠近触发控制转移的条件，并只在能够明显简化执行关系时使用。**不要为了退出循环而间接修改循环变量，也不要用额外的布尔对象模拟本可直接表达的 `break`。

C++ Core Guidelines 的 [ES.77](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es77-minimize-the-use-of-break-and-continue-in-loops) 同样建议限制循环中 `break` 与 `continue` 的数量；重点不是禁止使用，而是避免它们隐藏在复杂循环体中。
