---
title: 赋值与对象状态（Assignment and Object State）
date: 2026-08-25
---

# 赋值与对象状态（Assignment and Object State）

算术表达式可以计算新的值，赋值表达式则把相应结果写入已经存在的对象。第一章已经从对象角度区分初始化与赋值；这里进一步从表达式角度说明状态修改怎样发生。

## 赋值表达式

```cpp
int remaining_count{12};

remaining_count = 9;
```

第二行中的 `=` 是二元赋值运算符（assignment operator）：

- 左操作数 `remaining_count` 指定需要修改的对象；
- 右操作数 `9` 提供准备写入的值；
- `remaining_count = 9` 整体构成赋值表达式。

求值赋值表达式时，右侧结果用于替换左侧对象当前保存的值。**对象的身份与类型没有改变，发生变化的是对象状态；这个修改就是赋值表达式产生的副作用。**

赋值表达式本身也具有结果，它仍然指定修改后的左侧对象。因此赋值可以嵌入更大的表达式，但普通状态更新通常写成独立的表达式语句，使副作用直接可见：

```cpp
remaining_count = 9;
```

末尾的分号不属于赋值表达式，而是使它形成完整的表达式语句。赋值表达式的结果在这里没有继续使用，副作用仍然完成。

## 右侧表达式先确定待写入结果

赋值运算符的右操作数可以是更大的表达式：

```cpp
int completed_count{3};
int new_count{2};
int total_count{0};

total_count = completed_count + new_count;
```

`completed_count + new_count` 先按照算术运算规则产生 `int` 值 `5`，这个值随后写入 `total_count`。**左侧对象只负责接收结果，不能反向改变右侧表达式此前采用的运算规则。**

如果右侧结果类型与左侧对象类型不同，赋值会按照相应的[隐式类型转换](../06-constants-literals-and-type-conversions/04-implicit-type-conversions.md)规则把结果转换为左侧对象的类型，再完成存储。转换可能丢失信息，因此不同类型之间的赋值必须符合数据本身的含义与范围。

## 左操作数必须能够被修改

赋值的左操作数必须指定一个允许修改的对象：

```cpp
int remaining_count{12};

remaining_count = 9;  // 正确：remaining_count 指定可修改对象
```

普通数值不能充当待修改对象：

```cpp
int remaining_count{12};

9 = remaining_count;  // 错误：9 不指定可修改对象
```

**赋值号左右两侧并不是可以任意交换的两个数值。**右侧提供结果，左侧指定状态将被替换的对象，这种不对称关系是赋值语义的核心。

## 复合赋值运算符（Compound Assignment Operators）

当运算结果需要重新写回同一个对象时，可以使用复合赋值运算符：

| 运算符 | 表示的状态更新 |
| --- | --- |
| `+=` | 加法后写回 |
| `-=` | 减法后写回 |
| `*=` | 乘法后写回 |
| `/=` | 除法后写回 |
| `%=` | 取余后写回 |

```cpp
int remaining_count{12};

remaining_count -= 3;  // remaining_count == 9
```

对于形式 `left op= right`，其行为与下面的结构相对应：

```text
left = left op right;
```

但两者并不是简单的文本替换。**复合赋值只对左操作数求值一次，随后按照相应运算和赋值规则完成状态更新。**`/=` 与 `%=` 仍然受到除零和整数商表示范围的约束，复合写法不会改变底层运算边界。

## 自增与自减（Increment and Decrement）

自增运算符 `++` 与自减运算符 `--` 都是一元运算符。对于当前已经建立的数值对象，它们分别按照对象类型的规则把值增加或减少 `1`：

```cpp
int lap_count{4};

++lap_count;  // lap_count == 5
--lap_count;  // lap_count == 4
```

操作数必须指定能够被修改的对象，因此 `++4` 与 `4--` 都不合法。`bool` 也不能作为内建自增或自减运算符的操作数。

自增和自减不会绕过类型的表示边界：有符号整数越界仍会产生未定义行为，无符号整数仍采用相应的模运算规则。

## 前置形式与后置形式

`++` 和 `--` 都有前置形式（prefix form）与后置形式（postfix form）。两种形式都会修改对象，但表达式结果保留对象身份的方式不同：

| 形式 | 对象状态 | 表达式结果 |
| --- | --- | --- |
| `++value`、`--value` | 完成修改 | 仍然指定修改后的对象 |
| `value++`、`value--` | 完成修改 | 产生修改前的值 |

```cpp
int count{5};

int previous_count{count++};  // previous_count == 5，count == 6
int current_count{++count};   // count == 7，current_count == 7
```

当表达式结果没有被使用时，前置和后置形式对对象造成相同的最终修改。此时通常使用前置形式，直接表达“更新对象”；后置形式保留给确实需要修改前数值的场景。

## 让副作用保持可见

赋值、复合赋值、自增和自减都修改对象。它们可以嵌入其他表达式，但这样会要求读者同时追踪计算结果与对象状态：

```cpp
int base_count{10};
int added_count{3};
int total_count{base_count + (added_count += 2)};
```

更直接的写法把状态更新和结果计算分开：

```cpp
int base_count{10};
int added_count{3};

added_count += 2;
int total_count{base_count + added_count};
```

**副作用通常应当成为独立、清楚的步骤。**括号可以说明表达式怎样分组，但不能消除其中的状态修改。

相关语言规则可参阅 C++23 工作草案中的[赋值与复合赋值](https://eel.is/c%2B%2Bdraft/expr.assign)、[前置自增与自减](https://eel.is/c%2B%2Bdraft/expr.pre.incr)以及[后置自增与自减](https://eel.is/c%2B%2Bdraft/expr.post.incr)。
