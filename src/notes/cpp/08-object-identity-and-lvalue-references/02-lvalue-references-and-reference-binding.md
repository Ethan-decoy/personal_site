---
title: 左值引用与引用绑定（Lvalue References and Reference Binding）
date: 2026-08-28
order: 2
---

# 左值引用与引用绑定（Lvalue References and Reference Binding）

用已有对象的当前值初始化新对象，会得到一份独立状态。左值引用（lvalue reference）则在初始化时绑定到已有对象，让后续代码通过引用名称访问这个对象。

## 引用绑定保留对象身份

以下代码片段均位于 `main` 的函数体内。正常代码按顺序接续，错误示例与表中的声明单独判断，不加入正常代码。

下面使用已有、可修改的普通 `int` 对象作为绑定目标：

```cpp
int value{7};
int saved{value};
int& alias{value};
```

`int&` 表示“对 `int` 的左值引用”。这里的初始化器 `value` 是指定可修改 `int` 对象的左值（lvalue），能够用于这种直接绑定。

三条声明引入了三个名称，但只创建了两个保存整数的对象：

- `value` 是第一个 `int` 对象，保存 `7`。
- `saved` 是另一个 `int` 对象。它的初始化读取 `value` 中的 `7`，把这个值保存为自己的初始状态。
- `alias` 是绑定到 `value` 的引用。建立绑定不复制整数值，也不创建第三个 `int` 对象；之后使用名称 `alias` 时，访问的是 `value`。

接着通过引用名称赋值：

```cpp
alias = 9;
```

执行后，`value` 保存 `9`，通过 `alias` 读取也得到 `9`，独立对象 `saved` 仍保存 `7`。

再通过原名称修改对象，并修改那份独立副本：

```cpp
value = 11;
saved = 13;
```

各步的结果如下：

| 执行位置 | `value` 的值 | `saved` 的值 | 通过 `alias` 读取 |
| --- | --- | --- | --- |
| 三条声明完成后 | `7` | `7` | `7` |
| `alias = 9;` 后 | `9` | `7` | `9` |
| `value = 11;` 后 | `11` | `7` | `11` |
| `saved = 13;` 后 | `11` | `13` | `11` |

`value` 和 `alias` 始终访问同一个对象，所以经任一名称修改后，经另一个名称读取都能得到该对象的当前值。`saved` 保存的是另一份状态，对它赋值只修改它自己。

> [!IMPORTANT] 引用绑定与值复制
> `int saved{value};` 创建一个独立对象，用 `value` 的当前值初始化；`int& alias{value};` 建立引用绑定，保留已有对象的身份。通过原名称或引用名称访问，操作的都是同一个对象；独立副本的状态则各自变化。

## 声明符与取地址运算符

在 `int& alias{value};` 中，`int&` 表示引用类型，`alias` 是引用的名称，`{value}` 是初始化器，提供要绑定的对象。

其中的 `&` 是引用声明符（reference declarator）中的符号，用来声明引用。它与指针初始化中出现的取地址运算承担不同职责。接着创建一个指针对象：

```cpp
int* target{&value};
```

这里的 `&value` 是表达式，一元取地址运算符 `&` 产生指向 `value` 的 `int*` 值，保存到指针对象 `target` 中。

两处都写了 `&`，但语法位置和结果不同：`int& alias{value};` 声明引用并绑定对象；`int* target{&value};` 创建指针对象并保存指针值。引用初始化中的 `value` 不需要再加取地址运算符。

> [!IMPORTANT] 引用声明与取地址运算
> 声明中的 `&` 用来声明引用；表达式中的一元 `&` 执行取地址运算。对这里的 `int&`，初始化器应提供可绑定的 `int` lvalue；对 `int*` 对象，初始化器可以提供取地址运算得到的指针值。

## 引用必须初始化且不能重新绑定

最初的 `int& alias{value};` 在定义引用时就确定了目标。这里的局部引用变量必须在定义时提供初始化器，不能先留下一个没有绑定目标的引用：

```cpp
int& unbound; // 错误：局部引用变量没有初始化器
```

绑定完成后，后续赋值也不会改变绑定目标。回到正常代码，此时 `value` 保存 `11`，`alias` 仍绑定到它。接着增加另一个整数对象：

```cpp
int other{20};

alias = other;
alias = 30;
```

`alias = other;` 的左侧指定 `value`，右侧读取 `other` 中的整数 `20`，因此赋值修改的是 `value`。下一行仍然给 `value` 赋值：

| 执行位置 | `value` 的值 | `other` 的值 | `alias` 绑定的对象 |
| --- | --- | --- | --- |
| `other` 初始化后 | `11` | `20` | `value` |
| `alias = other;` 后 | `20` | `20` | `value` |
| `alias = 30;` 后 | `30` | `20` | `value` |

第一条赋值后，两对象的值相同，仍然是不同对象。第二条赋值后，`value` 变为 `30`，`other` 保持 `20`，`alias` 始终没有改为绑定 `other`。

> [!IMPORTANT] 初始化建立绑定，赋值修改对象
> 引用初始化确定绑定对象，绑定完成后不能改换。对引用名称赋值，是给被绑定对象赋值。对于这里的整数赋值，右侧的对象只提供当前值，不会成为引用的新目标。

## 普通左值引用的绑定条件

引用初始化需要核对初始化器提供了什么。普通 `int&` 允许经引用修改整数，因而不能绑定到不允许修改的 `const int` 对象；数值计算得到的纯右值（prvalue）也不满足这种绑定所要求的 lvalue 条件。

沿用前面的 `value`，再声明一个 `const int` 对象：

```cpp
const int limit{10};
```

下表每行独立判断一条引用初始化，不把这些声明接到正常代码中：

| 引用初始化 | 是否成立 | 判断依据 |
| --- | --- | --- |
| `int& alias{value};` | 是 | `value` 是可修改的 `int` lvalue |
| `int& alias{7};` | 否 | `7` 是 `int` prvalue |
| `int& alias{value + 0};` | 否 | 加法产生 `int` prvalue，没有提供所需的 lvalue |
| `int& alias{limit};` | 否 | `limit` 是 `const int` lvalue，不能丢弃 `const` 访问约束 |
| `int& alias{&value};` | 否 | `&value` 提供 `int*` 指针值，没有提供所需的 `int` lvalue |

`value + 0` 与 `value` 的当前数值相同，但不能因此把加法结果当成同一个对象。`&value` 虽然能找到该对象的位置，提供的却是指针值，不能拿来直接初始化这里的 `int&`。

> [!IMPORTANT] 普通左值引用的绑定条件
> 在这里普通整数对象的直接绑定中，`int&` 必须用 `int` 类型的可修改 lvalue 初始化。`const int` lvalue、`int` prvalue 与指针值都不满足条件。判断绑定时，应核对类型、值类别与访问约束。

## 引用变量不是对象

最初的三个名称对应两种声明结果。`value` 和 `saved` 的声明各自创建一个对象；`alias` 的声明引入一个引用，并把它绑定到 `value`。

前面使用的 `value`、`saved` 属于对象变量。C++ 也把这里声明的引用归入变量，因此 `alias` 是引用变量（reference variable），但引用本身不是对象。下表对应最初的三条声明：

| 声明 | 引入的变量 | 保存整数状态的对象 |
| --- | --- | --- |
| `int value{7};` | 对象变量 `value` | 新创建的 `value` |
| `int saved{value};` | 对象变量 `saved` | 新创建的 `saved` |
| `int& alias{value};` | 引用变量 `alias` | 已有的 `value` |

名称 `alias` 用于指代引用；在普通表达式中使用它时，访问的是它所绑定的 `value` 对象。

> [!IMPORTANT] 对象变量与引用变量
> 这里的对象变量本身是对象，引用变量则建立到对象的绑定。声明引用变量不会另建一份被引用类型的对象；判断有几份独立的整数状态，应数实际创建的 `int` 对象，不能只数名称。

这里区分的是语言中的对象与引用。引用在机器层面怎样表示，见[引用的语言语义与实现模型](deep-dives/01-reference-semantics-and-implementation-models.md#语言规定绑定关系)。

## 引用名称表达式指定被绑定对象

声明时，`int&` 描述 `alias` 这个引用变量；使用时，名称表达式 `alias` 直接指定被绑定的 `value`。这两处观察的层次不同：前者的声明类型是 `int&`，后者的表达式类型是 `int`，值类别是 lvalue。

两个名称的表达式可以并排比较：

| 名称表达式 | 表达式类型 | 值类别 | 指定的对象 |
| --- | --- | --- | --- |
| `value` | `int` | lvalue | `value` |
| `alias` | `int` | lvalue | 同一个 `value` |

引用变量仍是引用；名称表达式则直接指定它所绑定的对象。和直接写出 `value` 一样，写出 `alias` 首先确定要访问的对象，这一步不读取或复制整数值，后续运算再决定是否需要读取。

前面的赋值完成后，`value` 保存 `30`，`alias` 仍绑定到它。接着分别用引用名称参与算术与取地址：

```cpp
const int next{alias + 1};
const bool same_address{&alias == &value};
```

在 `alias + 1` 中，名称表达式 `alias` 先指定 `value`，加法再读取其中的 `30`，计算得到 `31`，用于初始化独立的 `next` 对象。

在 `&alias` 中，取地址运算只需要确定对象，不读取整数值。由于 `alias` 指定 `value`，`&alias` 和 `&value` 都产生指向同一个对象的 `int*` 值，`same_address` 因而是 `true`。

> [!IMPORTANT] 引用名称表达式访问被绑定对象
> 对这里的 `int&` 引用，名称表达式的类型是 `int`，值类别是 lvalue，指定被绑定的整数对象。后续运算根据语境读取它的值、修改它或取得它的地址；对引用名称取地址，取得的也是被绑定对象的地址。

## 引用也能绑定指针对象

前面创建的 `target` 仍保存 `&value`；此时 `value` 保存 `30`，`other` 保存 `20`。指针对象也可以被引用。接着声明一个绑定到 `target` 的引用：

```cpp
int*& target_alias{target};
```

把被引用类型 `int*` 作为整体看待，`int*&` 就是“对 `int*` 的左值引用”。`target_alias` 绑定的是指针对象 `target`；原来的 `alias` 仍然绑定整数对象 `value`。

先通过新引用给指针对象赋值：

```cpp
target_alias = &other;
```

左侧 `target_alias` 是指定 `target` 的 `int*` lvalue。这条赋值修改 `target` 保存的指针值，使它改为指向 `other`；`target_alias` 与 `target` 的绑定保持不变。

再对该指针执行间接访问：

```cpp
*target_alias = 40;
```

这里先通过 `target_alias` 读取 `target` 中的指针值，再由 `*` 指定它所指的 `other` 对象。因此，这条赋值把 `other` 从 `20` 改为 `40`，`target` 仍指向 `other`，`value` 仍保存 `30`。

| 操作 | 直接修改的对象 | 结果 |
| --- | --- | --- |
| `target_alias = &other;` | 指针对象 `target` | `target` 改为指向 `other` |
| `*target_alias = 40;` | 整数对象 `other` | `other` 的值变为 `40` |

还可以经 `target_alias` 把指针设为空：

```cpp
target_alias = nullptr;
```

这次仍然修改指针对象 `target`。它现在保存空指针值，没有所指的整数对象；`target_alias` 仍绑定到存在的 `target` 对象，因此仍可用来给它赋新指针值。但此时不能执行 `*target_alias` 或 `*target`，因为两者都会对空指针进行间接访问。

> [!IMPORTANT] 引用绑定与指针指向是两层关系
> 对指针的引用绑定到指针对象。经引用名称赋值，修改的是指针对象保存的值；经该指针间接访问，才会到达它所指的对象，并且要求指针当时有效。改变指针值或把它设为空，都不会改换引用所绑定的指针对象。

## 引用与指针表达不同约束

引用与指针都能形成通往已有对象的访问路径。下面比较的是直接绑定已有对象的左值引用和指向已有对象的指针：

| 性质 | 左值引用 | 对象指针 |
| --- | --- | --- |
| 自身是否为对象 | 否 | 是 |
| 建立关系后能否改换目标 | 不能重新绑定 | 指针对象可以通过赋值改换，但指针本身带 `const` 时不行 |
| 是否具有正常的空状态 | 没有 | 可以保存空指针值 |
| 访问目标的语法 | 直接使用引用名称 | 对指针执行间接访问 |
| 是否延长这里已有目标对象的生命周期 | 不会 | 不会 |

这里的 `int&` 初始化必须绑定有效的 `int` 对象，不能用 `nullptr` 表示“暂时没有目标”。但是，引用绑定不会阻止已有目标的生命周期结束。如果目标先结束生命周期，引用就成为悬空引用（dangling reference）；之后再通过它读取或修改该对象，行为未定义。

> [!IMPORTANT] 固定绑定不保证对象仍然存活
> 引用不能重新绑定，也没有表示“未绑定”的正常空状态；这些约束不负责维持目标的生命周期。对于这里直接绑定的已有对象，通过引用读取或修改时，仍须保证目标处于生命周期内。

当访问关系要求有目标，而且绑定固定时，可以用引用表达这些要求。目标允许不存在或关系需要重新指向时，指针具有相应的空状态与赋值能力。选择哪种形式，都需要另外保证目标在被访问时仍然存活。

## 参考资料

- [C++23 工作草案：基本概念与变量](https://timsong-cpp.github.io/cppwp/n4950/basic.pre)
- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：表达式类型](https://timsong-cpp.github.io/cppwp/n4950/expr.type)
- [C++23 工作草案：对象与引用的生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
