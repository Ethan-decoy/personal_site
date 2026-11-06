---
title: 对象身份与表达式结果（Object Identity and Expression Results）
date: 2026-08-28
order: 1
---

# 对象身份与表达式结果（Object Identity and Expression Results）

对象身份（object identity）回答“正在处理哪一个对象”。对象保存的值可以改变，它仍然是同一个对象；两个对象也可以保存相同的值。

表达式有时指定某个已有对象，有时为当前语境提供计算所得的值。仅知道表达式的类型，还不能完整区分这两种结果。C++ 使用值类别（value category）描述表达式结果的这种性质。

## 类型与值类别是两个维度

这里的示例使用已经初始化的普通 `int`、`const int` 对象与内建运算，涉及左值（lvalue）和纯右值（prvalue）两种值类别；这不是 C++ 全部值类别的穷举。

除另行说明的函数定义外，代码片段均位于 `main` 函数体内；注明接续或沿用时保留相应正常示例的定义，其余片段彼此独立。错误语句单独考察。

```cpp
int value{7};
const int result{value + 0};
```

`value`、字面量 `7` 与表达式 `value + 0` 都具有 `int` 类型。从 `value` 取得的数值与加法计算所得的数值也都是 `7`，但这些表达式的结果关系不同：

| 表达式 | 类型 | 值类别 | 求值结果 |
| --- | --- | --- | --- |
| `value` | `int` | lvalue | 指定已有的 `value` 对象 |
| `7` | `int` | prvalue | 为所在语境提供整数 `7` |
| `value + 0` | `int` | prvalue | 计算整数 `7`，用于初始化 `result` |

`value` 指定已经存在的对象；`value + 0` 计算出一个值，用它初始化独立的 `result` 对象。得到相同整数，不能据此把两种表达式的结果视为相同的对象关系。

> [!IMPORTANT] 类型与值类别
> **类型与值类别是对表达式结果的两项判断：类型说明结果按什么类型解释，值类别说明结果与对象身份、值的提供之间的关系。**相同类型的表达式可以具有不同值类别；提供相同数值也不能用于判定值类别。值类别划分的是表达式，不是对象或对象中保存的数值。

## lvalue 确定已有对象的身份

在当前对象语境中，lvalue 的求值结果确定正在使用的那个对象。对象名称是最直接的例子；对有效对象指针进行间接访问，也会得到指定被指对象的 lvalue：

```cpp
int value{7};
const int other{7};
int* target{&value};
```

`value` 与 `other` 当前都保存整数 `7`，却是两个不同的对象。`value` 与 `*target` 则是指定同一个 `value` 对象的两条路径，这两个表达式都是 lvalue。

接续这组定义，通过两条路径先后赋值：

```cpp
value = 8;
*target = 9;
```

两条赋值的左操作数都指定原来的 `value` 对象。执行后，`value` 保存 `9`，独立对象 `other` 仍保存 `7`；两次赋值都直接修改目标对象。

已经认识的部分内建表达式也会保留对象身份。下表逐项说明分类，不作为按行接续执行的程序：

| 表达式 | 值类别 | 结果 |
| --- | --- | --- |
| `value` | lvalue | 指定 `value` 对象 |
| `*target` | lvalue | 指定同一个 `value` 对象 |
| `value = 8` | lvalue | 指定完成赋值后的 `value` 对象 |
| `++value` | lvalue | 指定完成递增后的 `value` 对象 |

> [!IMPORTANT] lvalue 与对象身份
> **在这里的对象语境中，lvalue 求值确定要使用的对象。**对象名称和有效指针的间接访问表达式可以指定同一个对象；不能仅凭表达式写在赋值号左边或右边来判定它是否为 lvalue。

## lvalue 不一定允许修改

指定对象，不等于允许修改这个对象。下面是独立的正常示例：

```cpp
const int limit{7};
const int saved{limit};
```

名称表达式 `limit` 的类型是 `const int`，值类别仍然是 lvalue，因为它指定已有的 `limit` 对象。初始化 `saved` 需要的是整数值 `7`；取值所得的结果作为 prvalue 供初始化使用。`saved` 是另一个独立对象。

沿用这组定义，下面这条语句不合法：

```cpp
limit = 9; // 错误：不能给 const int 对象赋值
```

内建整数赋值要求左操作数是可修改的 lvalue。`limit` 是 lvalue，但其类型具有 `const` 限定，因此编译器必须诊断这条赋值。首例中的 `value + 0` 则是 prvalue，也不能作为这种赋值的左操作数。

> [!IMPORTANT] lvalue 与可修改性
> **lvalue 说明表达式能够指定对象，不单独保证对象可以修改。**普通整数赋值还要求目标是可修改的 lvalue；`const int` 名称仍是 lvalue，却不能接受赋值。实际访问对象时，也仍须满足生命周期、值已确定等相应条件。

## prvalue 为所在语境计算值

prvalue 用于初始化对象，或计算运算符所需的值。在当前基本类型范围内，字面量、内建算术结果和按值返回函数的调用都是常见的 prvalue。

先在 `main` 之前定义下面这个函数：

```cpp
int add_one(int value) {
    return value + 1;
}
```

下面的调用片段位于 `main` 函数体内，沿用这个函数定义：

```cpp
const int result{add_one(7)};
```

字面量 `7`、函数中的加法 `value + 1` 和调用表达式 `add_one(7)` 都是 `int` 类型的 prvalue。调用提供整数 `8`，用于初始化 `result`；这个结果不指定函数中的参数对象 `value`，也不依赖该参数在函数返回后继续存在。

下面是另一个独立的正常示例。后置自增会修改对象，同时产生修改前数值对应的 prvalue：

```cpp
int count{4};
const int previous{count++};
```

执行后，`count` 保存 `5`，`previous` 保存 `4`。`count++` 的结果提供旧整数 `4`，它的副作用则使原来的 `count` 增加到 `5`。

> [!IMPORTANT] 值类别与副作用
> **值类别描述表达式结果，副作用描述求值对对象或执行环境产生的作用，两项分别判断。**这里的内建后置自增产生 prvalue，同时修改对象；内建赋值和前置自增有副作用，其结果则是 lvalue。不能只凭结果的值类别判断表达式是否修改对象。

## 从对象身份读取当前值

需要区分转换前的表达式与取值所得的结果。对于这里的普通整数对象，当语境需要其保存的值时，可以通过左值到右值转换（lvalue-to-rvalue conversion），从指定对象的 lvalue 得到 prvalue。下面以普通 `int` 对象的读取为例：

```cpp
int value{7};
const int next{value + 1};
```

内建加法需要两个用于计算的值，因此：

1. 转换前的名称表达式 `value` 是 `int` 类型的 lvalue，指定已有的 `value` 对象；
2. 左值到右值转换读取其中保存的 `7`，产生 `int` 类型的 prvalue 结果；
3. 这个结果与字面量 `1` 提供的值参与加法；
4. 加法产生 prvalue `8`，用于初始化独立的 `next` 对象。

> [!IMPORTANT] 指定对象与取得值的两个层次
> **本篇的对象名称与有效指针间接访问表达式，在取值转换前以 lvalue 指定对象；当前语境需要数值时，左值到右值转换进一步取得对象的值，并产生 prvalue 结果。**应分别辨认原表达式与转换的结果，不能根据表达式写在初始化器或运算符的哪一侧来判断值类别。

并非每次写出对象名称都会读取其中的值：

```cpp
int value{7};
int* target{&value};

value = 9;
```

`&value` 需要指定要取地址的对象，赋值左侧的 `value` 需要指定待修改对象；这两个位置都不需要先读出原来的整数 `7`。执行赋值后，`value` 保存 `9`，`target` 仍指向同一个对象。

对这里的普通 `int` 对象，可以按使用位置区分：

| 使用位置 | 例子中的对应部分 | 对 `value` 的取值要求 |
| --- | --- | --- |
| 取地址运算的操作数 | `&value` 中的 `value` | 指定对象，不读取其整数值 |
| 赋值的左操作数 | `value = 9` 左侧的 `value` | 指定待修改对象，不读取旧整数值 |
| 算术运算的操作数 | `value + 1` 中的 `value` | 指定对象后，取得其当前整数值参与计算 |
| 普通值初始化器 | `const int saved{value};` 中的 `value` | 取得整数值，用于初始化另一个对象 |

取地址和赋值左侧只需要指定对象，当前普通整数运算还需要进一步取值；两项判断形成前后相接的过程。

## 参考资料

- [C++23 工作草案：值类别](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：左值到右值转换](https://timsong-cpp.github.io/cppwp/n4950/conv.lval)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：前置自增与自减](https://timsong-cpp.github.io/cppwp/n4950/expr.pre.incr)
- [C++23 工作草案：后置自增与自减](https://timsong-cpp.github.io/cppwp/n4950/expr.post.incr)
