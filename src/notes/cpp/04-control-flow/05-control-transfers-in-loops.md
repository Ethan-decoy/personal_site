---
title: 循环中的控制转移（Control Transfers in Loops）
date: 2026-08-26
---

# 循环中的控制转移（Control Transfers in Loops）

程序依次记录第 `1` 到第 `3` 箱的装箱数量，每箱 `3` 件。假设第 `2` 箱需要复核，可能有两种处理要求：停止本批的后续记录，或者暂不计入这一箱、继续记录后面的箱子。

`break` 与 `continue` 都属于跳转语句（jump statement）。它们直接改变后续执行的位置，不需要先让循环条件变为 `false`；但“结束整条循环”与“跳过本轮剩余处理”会产生不同结果。

以下代码片段各自独立，均放在 `main` 函数体内。示例中的局部对象都具有自动存储期。

## break 结束循环

如果要求遇到第 `2` 箱就停止本批记录，可以在累计这一箱之前执行 `break`：

```cpp
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    if (box_number == 2) {
        break;
    }

    packed_items += 3;
}
```

`box_number` 保存当前箱号，`packed_items` 累计已经记录的件数。第 `1` 箱使累计值从 `0` 变为 `3`；箱号推进到 `2` 后，`if` 的条件为 `true`，执行 `break`，直接结束这条 `for`。

第 `2` 箱尚未执行的 `packed_items += 3` 被跳过，`++box_number` 与下一次条件判断也不再执行，第 `3` 箱不会被处理。循环结束后，`packed_items` 保存 `3`；第 `1` 箱已经完成的累计不会被撤销。

> [!IMPORTANT] break 直接结束目标循环
> **当 `break` 的目标是循环时，它会结束整条循环，从循环之后继续执行，无须先让循环条件变为 `false`。**本轮剩余的循环体与下一次条件判断都不再执行；若目标是 `for`，本轮的迭代表达式也被跳过。跳转前已经完成的操作不会被撤销。

## continue 放弃当前一轮

如果第 `2` 箱只是暂不计入，本批仍需继续记录后面的箱子，就把同一位置的 `break` 换成 `continue`，其余代码不变：

```cpp
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    if (box_number == 2) {
        continue;
    }

    packed_items += 3;
}
```

第 `2` 箱执行 `continue` 后，本轮的累计语句被跳过，但整条 `for` 没有结束。程序先执行 `++box_number`，把箱号推进到 `3`，再判断 `3 <= 3`，随后记录第 `3` 箱。

| 箱号 | 使用 `break` | 使用 `continue` |
| ---: | --- | --- |
| `1` | 记录 `3` 件 | 记录 `3` 件 |
| `2` | 结束循环，不再记录 | 跳过本箱，继续推进 |
| `3` | 不会到达 | 再记录 `3` 件 |
| 最终累计 | `3` 件 | `6` 件 |

> [!IMPORTANT] continue 跳过本轮剩余语句，再到达继续位置
> **`continue` 跳过包围它的最内层循环中，本轮循环体尚未执行的部分；它不结束整条循环，也不撤销本轮已经完成的操作。**下一步取决于循环形式：
>
> | 循环形式 | 执行 `continue` 后的下一步 |
> | --- | --- |
> | `while` | 重新求值条件 |
> | `do-while` | 求值循环体之后的条件 |
> | `for` | 先求值迭代表达式（若有），再判断条件；省略条件时视为 `true` |
>
> 因此，“跳过当前一轮”指跳过这一轮剩余的循环体，不表示整轮从未发生，也不能一概理解成直接回到循环开头。

## 嵌套结构中的目标

逐件检查时，外层循环选择箱子，内层循环选择箱内物品。假设各箱的第 `2` 件都需要复核；遇到它时，停止当前箱的记录，再检查下一箱：

```cpp
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    for (int item_number{1}; item_number <= 3; ++item_number) {
        if (item_number == 2) {
            break;
        }

        ++packed_items;
    }
}
```

每箱只记录第 `1` 件。执行 `break` 后，内层 `for` 结束，外层仍执行自己的 `++box_number`，转到下一箱；下一箱的内层循环又从 `item_number{1}` 开始。三箱共记录 `3` 件，`packed_items` 最终保存 `3`。

如果只把内层的 `break` 改为 `continue`，它仍然只针对内层循环：跳过本箱第 `2` 件，然后推进到第 `3` 件。这样每箱记录 `2` 件，最终累计 `6` 件；它不会直接转到下一箱。

回到按整箱累计的规则。如果用 `switch` 区分第 `2` 箱和其他箱子，两种跳转可以同时出现：

```cpp
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    switch (box_number) {
    case 2:
        continue;
    default:
        break;
    }

    packed_items += 3;
}
```

| 箱号 | `switch` 内的路径 | 是否执行之后的累计语句 | 本轮之后的累计件数 |
| ---: | --- | --- | ---: |
| `1` | `default` 中的 `break` 只结束 `switch` | 是 | `3` |
| `2` | `case 2` 中的 `continue` 针对外层 `for` | 否 | `3` |
| `3` | `default` 中的 `break` 只结束 `switch` | 是 | `6` |

这里 `break` 后仍会执行循环体中的 `packed_items += 3`；`continue` 则跳过它，转到 `for` 的 `++box_number`。

> [!IMPORTANT] break 与 continue 的目标
> **判断转移到哪里，要从跳转语句的位置沿语法嵌套关系向外，找到最近的合法目标。**
>
> | 语句 | 目标与转移结果 |
> | --- | --- |
> | `break` | 最内层包围它的循环或 `switch`；结束整个目标结构，从其后继续 |
> | `continue` | 最内层包围它的循环；跳过本轮剩余循环体，到达该循环的继续位置；`switch` 不是它的目标 |
>
> `if` 分支与普通代码块都不会成为这两种跳转的目标。只处在 `switch` 内、没有循环包围的 `continue` 不合法。

## 控制转移与局部对象生命周期

在循环体中，用 `packed_count` 保存本箱数量，再用外层的 `checked_boxes` 累计已经检查的箱数。把检查计数放在跳转之前，就能区分“已经检查”与“已经计入装箱总量”：

```cpp
int checked_boxes{0};
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    int packed_count{3};
    ++checked_boxes;

    if (box_number == 2) {
        continue;
    }

    packed_items += packed_count;
}
```

第二轮到达 `continue` 时，`packed_count` 已经完成初始化，`checked_boxes` 也已经增加到 `2`。转移不会把这次检查计数减回 `1`；程序先离开本轮循环体，结束本轮 `packed_count` 的生命周期，再执行 `++box_number`。

如果只把这条 `continue` 改为 `break`，第二轮同样已经创建了 `packed_count`，也已经计入一次检查，但程序会离开整条 `for`：

| 对象 | 第二轮执行 `continue` | 第二轮改为执行 `break` |
| --- | --- | --- |
| 本轮的 `packed_count` | 生命周期结束，早于迭代表达式求值 | 生命周期结束，随后离开整条 `for` |
| 初始化语句中的 `box_number` | 仍是同一个对象，由迭代表达式推进到 `3` | 随着离开整条 `for`，生命周期结束 |
| 外层的 `checked_boxes` 与 `packed_items` | 继续存在，供后续处理使用 | 继续存在，循环之后仍可使用 |

使用 `continue` 时，最终检查 `3` 箱、累计 `6` 件；改为 `break` 时，最终检查 `2` 箱、累计 `3` 件。跳转之前已经完成的检查都保留。

对象是否创建，还要看执行路径有没有到达定义。只把 `packed_count` 的定义移到判断之后：

```cpp
int checked_boxes{0};
int packed_items{0};

for (int box_number{1}; box_number <= 3; ++box_number) {
    ++checked_boxes;

    if (box_number == 2) {
        continue;
    }

    int packed_count{3};
    packed_items += packed_count;
}
```

这次第 `2` 轮在定义之前就转移了，没有创建本轮的 `packed_count`；它只在第 `1`、第 `3` 轮创建，共 `2` 次。前一段把定义放在判断之前，因此三轮都创建了这个对象。两段代码的检查箱数与累计件数相同，但对象创建的次数不同。

> [!IMPORTANT] 是否到达定义决定创建，离开相应范围决定生命周期结束
> **对于这里具有自动存储期的普通局部对象，执行到定义并完成初始化才开始生命周期；控制转移离开它所属的范围时，仍须结束相应对象的生命周期。**已经创建的对象即使本轮没有再被使用，也不会因此免去生命周期结束；没有执行到的定义，则没有对应的本轮对象。
>
> `continue` 离开本轮循环体，但保留 `for` 初始化语句中的循环变量；`break` 若结束整条 `for`，还会结束该循环变量的生命周期。定义在循环外、所属范围尚未退出的累计对象继续存在，已经写入的计数也不会被撤销。

## continue 与循环推进

`continue` 到达继续位置，不代表状态一定得到推进。如果更新写在循环体中，它也可能被一起跳过。

要依次处理 `0` 到 `4`，略过 `2`，并用 `processed_count` 记录实际处理数量，下面的 `while` 遗漏了一条推进路径：

```cpp
int processed_count{0};
int value{0};

while (value < 5) {
    if (value == 2) {
        continue;
    }

    ++processed_count;
    ++value;
}
```

按源码中的控制关系推演，`value` 到达 `2` 时，`continue` 直接转到 `value < 5`，绕过了唯一的 `++value`。条件读取的仍是 `2`，跳过条件也没有改变，预期的状态推进被切断。

> [!WARNING] 跳过唯一推进路径会破坏终止
> **上例没有其他终止路径或标准认可的进展操作，其无限执行在 C++23 中具有未定义行为。**反复读取普通局部对象不满足[前向进展要求](03-condition-controlled-loops.md#终止条件与状态变化)，不能保证实际程序会一直停留在 `value == 2` 的循环中，也不能用某次运行结果证明这种行为可靠。

保持相同的起始值、处理范围与跳过条件，把统一推进移到 `for` 的迭代表达式中：

```cpp
int processed_count{0};

for (int value{0}; value < 5; ++value) {
    if (value == 2) {
        continue;
    }

    ++processed_count;
}
```

执行 `continue` 时，`++value` 仍把 `2` 推进到 `3`，下一轮能够继续处理。实际计入的是 `0`、`1`、`3`、`4`，最终 `processed_count` 保存 `4`；最后一次推进使 `value` 变为 `5`，条件为 `false`，循环结束。

修复时还要核对实际处理范围。如果仅把错误片段中的 `++value` 提到 `if` 之前，第一轮处理的会是 `1`，最后一轮还会处理 `5`，已经改变了原定的 `0` 到 `4`；最终计数相同也不能证明处理正确。

> [!IMPORTANT] continue 不会自动推进状态
> **`continue` 只负责转到循环规定的继续位置，不会自动增加循环变量，也不保证条件最终变为 `false`。**`for` 只有在迭代表达式确实承担推进时，才能由该位置继续更新；省略迭代表达式，就没有这一步操作。
>
> 对于依靠状态更新退出的循环，要逐条检查可能执行 `continue` 的路径，确认它没有反复绕过预期终止所依赖的更新。`while` 与 `do-while` 中写在循环体内的推进尤其需要核对；这不要求所有状态每轮单调变化。

## 让提前转移保持局部而明确

`break` 与 `continue` 是否合适，要结合它们能否让停止或略过的原因更容易辨认。已经找到目标时，`break` 可以直接表达“循环完成”；某一轮不需要继续处理时，靠近判断位置的 `continue` 可以减少后续代码的嵌套。

> [!PRACTICE] 让触发条件、转移目标与推进关系容易辨认
> 提前转移适合表达局部而明确的停止或略过条件；在较长循环体或多层嵌套中分散许多转移，会增加追踪所有出口与继续位置的负担。选择写法时，同时核对触发条件、最近目标和之后的推进步骤是否清楚，不机械禁用 `break` 或 `continue`。
>
> 需要结束当前单层循环时，直接写出 `break` 通常比修改循环变量、制造隐蔽状态来模拟退出更清楚。

## 参考资料

- [C++23 工作草案：跳转语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.jump)
- [C++23 工作草案：break 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.break)
- [C++23 工作草案：continue 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.cont)
- [C++23 工作草案：控制转移时的局部对象销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++ Core Guidelines：ES.77 减少循环中的 break 与 continue](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es77-minimize-the-use-of-break-and-continue-in-loops)
