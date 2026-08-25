---
title: 赋值、自增与自减（Assignment, Increment, and Decrement）
date: 2026-08-12
---

# 赋值、自增与自减（Assignment, Increment, and Decrement）

## 赋值表达式

第一章已经区分初始化与赋值：初始化建立新对象的初始状态，赋值（assignment）修改已经存在的对象。本篇进一步把赋值作为表达式分析：

```cpp
int remaining{12};
remaining = 9;
```

第二行中的 `=` 是二元赋值运算符。左操作数 `remaining` 指定需要修改的对象，右操作数 `9` 提供将要存入的新值；完整的 `remaining = 9` 是一个赋值表达式（assignment expression）。

**求值赋值表达式既产生表达式结果，也对左侧对象产生修改；这种对程序状态的改变称为副作用（side effect）。**这里的直接结果是 `remaining` 改为保存 `9`。相关规则可参阅 [C++ 工作草案中的赋值与复合赋值运算符](https://eel.is/c%2B%2Bdraft/expr.assign)。

## 表达式求值与结果存储

赋值运算符的右操作数可以是另一个完整表达式。**右侧表达式先按照自身的操作数类型与运算符规则完成求值，所得结果再转换为左侧对象的类型，并替换对象当前保存的值。左侧对象的类型不会反过来改变右侧表达式的求值方式。**

```cpp
int distance{9};
int segments{4};
double average{0.0};

average = distance / segments;
```

`distance` 和 `segments` 都是 `int` 对象，因此 `distance / segments` 执行整数除法，产生 `int` 值 `2`。赋值时，这个结果转换为 `double` 值 `2.0`，再存入 `average`。

```cpp
average = distance / 4.0;
```

这一次，`4.0` 是 `double` 值。通常算术转换使除法采用 `double` 作为共同类型，表达式产生 `double` 值 `2.25`，随后存入 `average`。

**`average` 在两次赋值中始终是 `double` 对象；它的类型只决定最终怎样保存结果，不决定右侧除法采用整数运算还是浮点运算。**

## 赋值时的类型转换

**对于内建算术类型，右侧表达式的结果类型与左侧对象的类型不同时，结果会先隐式转换为左侧对象的类型，再存入该对象。**

```cpp
double temperature{14.9};
int displayed_temperature{0};

displayed_temperature = temperature;
```

右侧表达式 `temperature` 产生 `double` 值 `14.9`。赋值时，这个值先转换为 `int` 值 `14`，再存入 `displayed_temperature`。浮点类型与整数类型之间的完整转换规则参见[整数类型与浮点类型之间](../06-constants-literals-and-type-conversions/04-implicit-type-conversions.md#整数类型与浮点类型之间)。

同样的转换如果发生在列表初始化的最外层，则会被判定为窄化转换（narrowing conversion）：

```cpp
double temperature{14.9};
int initial_temperature{temperature};  // 编译错误：列表初始化拒绝窄化
```

因此，下面两种写法遵循不同规则：

```cpp
displayed_temperature = temperature;  // 语言允许，编译器可能警告
int initial_temperature{temperature};  // 程序不合法，编译器必须诊断
```

**赋值允许这项转换，编译器可以选择警告；列表初始化中的同一转换则使程序不合法，编译器必须诊断。**列表初始化的窄化边界、警告与语言诊断的区别，以及显式表达转换意图的方式，参见[窄化与显式类型转换](../06-constants-literals-and-type-conversions/05-narrowing-and-explicit-type-conversions.md)。

## 复合赋值运算符（Compound Assignment Operators）

当算术运算的结果需要重新存入原来的对象时，可以使用复合赋值运算符：

| 运算符 | 对应关系 |
|---|---|
| `+=` | 加法后赋值 |
| `-=` | 减法后赋值 |
| `*=` | 乘法后赋值 |
| `/=` | 除法后赋值 |
| `%=` | 取余后赋值 |

```cpp
int remaining{12};

remaining -= 3;  // remaining == 9
```

对于形式 `E1 op= E2`，其行为等价于：

```cpp
E1 = E1 op E2
```

区别在于，**复合赋值只对左操作数 `E1` 求值一次。**这是一种语义上的等价关系，而不是编译器简单地将代码替换成后一种写法。

复合赋值仍然遵循相应算术运算和赋值的类型规则：

```cpp
int count{5};

count += 2.8;  // count == 7
```

求值时，`count` 提供的 `int` 值 `5` 与 `double` 值 `2.8` 采用 `double` 作为共同类型，加法得到 `double` 值 `7.8`。结果随后转换为左侧对象的 `int` 类型，小数部分被丢弃，最终存入 `7`。

因此，**复合赋值不会阻止窄化，也不具有列表初始化对窄化转换的限制。**`/=` 和 `%=` 还分别遵循除法与取余的规则；整数除数为零时，行为未定义。相关规则可参阅 [C++ 工作草案中的赋值与复合赋值运算符](https://eel.is/c%2B%2Bdraft/expr.assign)。

## 自增与自减运算符（Increment and Decrement Operators）

自增运算符 `++` 和自减运算符 `--` 都是一元运算符。就当前已经介绍的类型而言，**它们可以作用于能够被修改的算术对象，但不能用于 `bool`。**自增按照对象类型的规则执行与 `+= 1` 相同的更新，自减则执行与 `-= 1` 相同的更新。

```cpp
int lap_count{4};

++lap_count;  // lap_count == 5
--lap_count;  // lap_count == 4
```

**操作数必须指代一个能够被修改的对象，因此不能写成 `++4` 或 `4--`。**这些运算同样不会绕过整数类型的可表示范围：有符号整数越界仍会产生未定义行为，无符号整数仍按照相应类型的模运算规则计算。

### 前置形式与后置形式

**`++` 和 `--` 都有前置形式（prefix form）与后置形式（postfix form）。两种形式都会修改对象，区别在于整个表达式产生哪个值：**

| 形式 | 对象的变化 | 表达式的结果 |
|---|---|---|
| `++value`、`--value` | 先修改对象 | 修改后的值 |
| `value++`、`value--` | 对象随后完成修改 | 修改前的值 |

```cpp
int count{5};

int previous{count++};  // previous == 5，count == 6
int current{++count};   // count == 7，current == 7
```

**当表达式的结果没有被使用时，前置和后置形式对对象产生相同的最终修改，此时通常优先使用前置形式；后置形式保留给确实需要修改前数值的场景。**对于内建整数，这项选择主要用于准确表达意图；当这些运算符以后作用于其他类型时，后置形式还可能需要额外保存旧值。

相关规则可参阅 [C++ 工作草案中的前置自增与自减](https://eel.is/c%2B%2Bdraft/expr.pre.incr) 和[后置自增与自减](https://eel.is/c%2B%2Bdraft/expr.post.incr)。

## 让状态修改直接可见

赋值、复合赋值、自增和自减都会产生副作用。它们作为独立语句出现时，修改通常一目了然；嵌入更大的表达式后，读者还需要同时追踪子表达式的结果和对象状态的变化。

```cpp
int base{10};
int count{3};
int total{base + (count += 2)};
```

这段代码合法，但赋值隐藏在初始化表达式内部。拆成顺序明确的语句可以直接呈现状态变化：

```cpp
count += 2;
int total{base + count};
```

一个更大的表达式如果会多次修改同一对象，或者一边修改它、一边又从其他子表达式读取它，应优先拆成独立语句。**括号只能明确表达式的语法分组，不能消除副作用，也不能代替 C++ 对求值顺序的规定。**[C++ Core Guidelines ES.40](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es40-avoid-complicated-expressions) 与 [ES.43](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es43-avoid-expressions-with-undefined-order-of-evaluation) 对此给出了相同方向的建议。
