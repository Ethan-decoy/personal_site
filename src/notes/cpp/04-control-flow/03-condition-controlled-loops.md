---
title: 条件驱动的循环（Condition-Controlled Loops）
date: 2026-08-26
---

# 条件驱动的循环（Condition-Controlled Loops）

选择语句根据条件保留一条执行路径；迭代语句（iteration statement）则允许一条子语句被重复执行。`while` 与 `do-while` 都由条件决定是否继续，但条件发生在循环体之前还是之后，会改变循环体能够执行的最少次数。

## while 循环

`while` 在每一轮开始前求值条件。条件为 `true` 时执行循环体，循环体正常结束后再回到条件；条件为 `false` 时，整条循环结束：

```cpp
int tire_pressure_kpa{180};

while (tire_pressure_kpa < 220) {
    tire_pressure_kpa += 5;
}
```

第一次求值条件时，`180 < 220` 产生 `true`，循环体把气压增加到 `185`。程序随后重新求值条件，并重复这一过程。气压最终达到 `220`，条件产生 `false`，程序从循环之后继续执行。

每当执行路径重新到达条件，条件表达式都会再次求值，并读取相关对象当时保存的状态；它不是在循环开始时计算一次后永久保存的结果。前一轮循环体中的完整表达式已经完成，下一次条件才开始求值，因此循环体的修改能够被下一次条件观察到。

**`while` 的条件先于每一次循环体执行。**如果第一次求值便产生 `false`，循环体一次也不会进入：

```cpp
int tire_pressure_kpa{220};

while (tire_pressure_kpa < 220) {
    tire_pressure_kpa += 5;
}
```

这里没有发生赋值，`tire_pressure_kpa` 保持 `220`。

## do-while 循环

`do-while` 从循环体开始执行。循环体沿正常路径完成后，程序求值条件；条件为 `true` 时再次进入循环体，为 `false` 时结束循环：

```cpp
int tire_pressure_kpa{215};

do {
    tire_pressure_kpa += 5;
} while (tire_pressure_kpa < 220);
```

循环体先把气压增加到 `220`，随后条件第一次得到 `false`，循环结束。**只要控制到达一条 `do-while` 语句，循环体就会先被进入一次；条件无法阻止这第一次执行。**

右括号后的分号属于 `do-while` 的语法，不能省略。它结束的是整条循环语句，而不是循环体中的某一条语句。

## 判断位置决定最少执行次数

| 循环 | 正常执行路径中的判断位置 | 循环体最少进入次数 |
| --- | --- | ---: |
| `while` | 每轮循环体之前 | 0 |
| `do-while` | 每轮循环体之后 | 1 |

这个区别应当来自问题本身。允许操作一次也不发生时，先判断的 `while` 能够直接表达这一点；第一次操作本来就必须发生，并且只有执行之后才能决定是否继续时，`do-while` 才能准确反映相应过程。

## 循环体中的局部对象

循环体的代码块每次都被重新进入。程序实际执行到局部对象定义时完成初始化，并在本轮离开循环体时结束该对象的生命周期：

```cpp
int remaining_checks{3};

while (remaining_checks > 0) {
    int check_number{4 - remaining_checks};
    --remaining_checks;
}
```

循环体执行三次，因此 `check_number` 也分别创建三次。每一轮的对象都在该轮中保存自己的值，并在重新求值下一轮条件之前销毁。**重复执行同一条定义，不是让一个已经销毁的局部对象重新出现，而是在每次实际到达定义时开始一个新的对象生命周期。**

`remaining_checks` 位于循环外，它在所有轮次中始终是同一个对象；循环体只是反复读取和修改它。

## 终止条件与状态变化

对于预期通过条件结束的循环，执行路径必须使条件有可能最终产生 `false`。开篇示例中的条件观察 `tire_pressure_kpa`，循环体也沿着使 `tire_pressure_kpa < 220` 最终不成立的方向修改同一对象；两者之间的关系可以直接从代码中读出。

如果遗漏状态变化：

```cpp
int tire_pressure_kpa{180};

while (tire_pressure_kpa < 220) {
    // tire_pressure_kpa 没有发生变化
}
```

每次条件求值都会继续观察到 `180`。这段代码没有给出任何使条件产生 `false` 的执行路径，因此循环无法通过当前条件结束；对于原本预期结束的程序，这通常意味着推进关系缺失。

**判断循环能否按预期结束，应当寻找使条件最终不成立的真实执行路径，而不是仅凭循环体看起来执行了某些操作。**状态不必在所有问题中单调变化，但终止机制必须与条件观察的状态具有可解释的关系。

相关语言规则可参阅 C++23 工作草案中的[迭代语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.iter)、[while 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.while)与 [do-while 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.do)。
