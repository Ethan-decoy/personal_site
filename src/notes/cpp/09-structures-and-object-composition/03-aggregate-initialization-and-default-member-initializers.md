---
title: 聚合初始化与默认成员初始化器（Aggregate Initialization and Default Member Initializers）
date: 2026-08-28
order: 3
---

# 聚合初始化与默认成员初始化器（Aggregate Initialization and Default Member Initializers）

下面的简单 `position` 满足 C++23 对聚合（aggregate）的要求。聚合初始化（aggregate initialization）可以用花括号中的初始化器，依次建立各成员子对象的初始状态。

`struct` 与 aggregate 不是同义词：`struct` 是定义类类型使用的关键字，aggregate 则是类型满足一组语言条件时获得的分类。这里分析当前简单结构体的聚合行为，不把结论扩展到所有类类型。

## 初始化器按成员声明顺序对应

下面的类型定义放在 `main` 之前，对象定义放在 `main` 的函数体内：

```cpp
struct position {
    int x;
    int y;
};

const position current{20, 10};
```

花括号中的两个初始化器按成员声明顺序，分别用于初始化：

| 初始化器 | 成员子对象 | 成员声明中的类型 |
| --- | --- | --- |
| `20` | `current.x` | `int` |
| `10` | `current.y` | `int` |

> [!IMPORTANT] 初始化器的位置对应成员声明顺序
> **对这里的聚合类型，位置初始化器按成员声明顺序对应各成员。**第一个数用于 `x`，第二个数用于 `y`。交换成员声明顺序，会改变同一初始化列表的含义；成员顺序是这种初始化方式的一部分。

## 每个成员仍遵循自身初始化规则

聚合初始化不会绕过成员类型的语言规则。保留上面的类型定义，将下面的错误对象定义放在 `main` 中单独考察：

```cpp
const position invalid{20, 10.5}; // 错误：double 到 int 的窄化
```

第一个初始化器能够用于 `x`，第二个初始化器却不能通过列表初始化建立 `int` 类型的 `y`。这使整条对象定义不合法。

当前类型只有两个整数成员，初始化器的数量也不能超过两个。下面是另一条单独考察的错误对象定义，仍放在 `main` 中：

```cpp
const position invalid{20, 10, 5}; // 错误：初始化器多于成员
```

> [!WARNING] 初始化器必须满足数量与类型约束
> 对这里仅含两个整数成员的结构体，位置初始化器最多有两项，每项还必须符合对应成员的初始化规则。初始化器过多，或者其中一项需要窄化转换，都会使整条对象定义不合法，编译器必须给出诊断。

## 默认成员初始化器提供默认状态

数据成员声明可以带有默认成员初始化器（default member initializer），为成员提供没有另行指定初值时使用的默认状态。

一条横向线段由左、右端点的位置确定。如果程序选择从 `0` 到 `10` 作为默认线段，可以把这两个默认初值写入类型定义。下面是独立示例，类型定义放在 `main` 之前：

```cpp
struct horizontal_span {
    int left{0};
    int right{10};
};
```

`left{0}` 和 `right{10}` 中的初始化器属于成员声明。下面的对象定义放在 `main` 中：

```cpp
const horizontal_span baseline{};
const horizontal_span shortened{5};
const horizontal_span custom{20, 30};
const horizontal_span defaulted;
```

前三条定义使用聚合初始化。`baseline` 没有显式提供任何成员的初值，两个成员都使用默认成员初始化器；`shortened` 显式给出左端点 `5`，右端点仍使用默认的 `10`；`custom` 的两项显式初值分别用于两个成员。

最后一条定义没有写对象初始化器，执行默认初始化（default-initialization）。这里的两个成员都有默认成员初始化器，仍会分别取得 `0` 和 `10`，所以这条 `const` 对象定义也合法。

| 对象 | `left` | `right` |
| --- | ---: | ---: |
| `baseline` | `0` | `10` |
| `shortened` | `5` | `10` |
| `custom` | `20` | `30` |
| `defaulted` | `0` | `10` |

> [!IMPORTANT] 聚合初始化中成员初值的来源
> **对这里的整数成员，聚合初始化逐个判断成员的初值来源：**
>
> 1. 有对应的位置初始化器时，使用该初始化器。
> 2. 没有对应的位置初始化器，但成员声明提供了默认成员初始化器时，使用默认成员初始化器。
> 3. 两者都没有时，从空初始化列表初始化该整数成员，得到 `0`。
>
> 默认成员初始化器不是必定先执行、随后又被覆盖的赋值。每个成员按当前初始化语境选择初值，并完成一次初始化。

## 没有默认状态的成员

去掉 `horizontal_span` 成员声明中的默认成员初始化器后，仍需根据对象的初始化形式判断成员值。用下面的类型定义替换前面的版本，类型定义仍放在 `main` 之前，对象定义放在 `main` 中；这组示例与上一节分开使用：

```cpp
struct horizontal_span {
    int left;
    int right;
};

const horizontal_span ready{}; // left == 0，right == 0
```

聚合初始化使用空花括号时，两个整数成员既没有对应的位置初始化器，也没有默认成员初始化器，因而都从空初始化列表取得零值。

前面的 `baseline{}` 得到左端点 `0`、右端点 `10`，这里的 `ready{}` 则得到 `0`、`0`。两次都写了空花括号，区别来自成员声明是否提供默认成员初始化器。

若把 `ready` 的定义替换为下面这条位于 `main` 中的定义，初始化形式就不同了：

```cpp
horizontal_span pending;
```

这里对具有自动存储期（automatic storage duration）的 `pending` 执行默认初始化。当前类型没有默认成员初始化器，两个整数成员不会因此得到确定值。定义本身合法，但读取它们之前必须先通过赋值等方式建立有效状态。

把前后两版类型的结果并排比较。下表中的对象均在 `main` 内定义；省略对象初始化器的两项，分别对应前面的 `defaulted` 和这里的 `pending`：

| 成员声明 | 对象使用空花括号 | 对象省略初始化器 |
| --- | --- | --- |
| `int left{0}; int right{10};` | `left == 0`，`right == 10` | `left == 0`，`right == 10` |
| `int left; int right;` | `left == 0`，`right == 0` | 两个整数都没有确定值 |

> [!WARNING] 空花括号与省略初始化器的结果不同
> 对这里没有默认成员初始化器的简单类型，`horizontal_span ready{};` 使两个整数成员得到零值；函数体内的 `horizontal_span pending;` 不会为它们设置确定值。在 C++23 中，读取这些尚未取得确定值的整数会产生未定义行为。若同一无初始化器的定义位于命名空间作用域，对象还会先经过零初始化，不能把当前自动存储期的结论直接推广到所有情形。

默认状态应当符合对象的实际含义。需要让省略初值的对象取得特定初始状态时，可以在成员声明中明确提供默认成员初始化器；类型没有合理默认状态时，应在使用处明确提供所需初值。

## 成员按照声明顺序初始化

如果程序希望省略右端点时，线段的长度为 `10`，可以让 `right` 的初值依赖同一对象中 `left` 已经建立的值。使用这条默认成员初始化器时，要求 `left + 10` 的结果可由 `int` 表示。下面用另一版独立的 `horizontal_span` 定义替换前面的版本，仍将类型定义放在 `main` 之前，对象定义放在 `main` 中：

```cpp
struct horizontal_span {
    int left{0};
    int right{left + 10};
};

const horizontal_span baseline{};
const horizontal_span shifted{20};
```

`baseline.left` 先使用默认初值 `0`，随后 `baseline.right` 读取它并计算 `0 + 10`，得到 `10`。`shifted.left` 先使用显式初值 `20`，随后 `shifted.right` 读取同一个对象中已经初始化的 `left`，计算 `20 + 10`，得到 `30`。

两次初始化采用相同的成员顺序，但较早成员的初值不同，后续默认成员初始化器得到的结果也不同。若显式提供右端点，它就使用显式初值，仍遵循前面的初值选择规则。

> [!IMPORTANT] 成员初始化的依赖顺序
> **本例中的成员按声明顺序初始化，较晚成员可以使用已经初始化的较早成员。**默认成员初始化器在用于初始化当前对象的成员时求值，读取的是同一个对象中此前已建立的状态。

把依赖关系写在相反的声明顺序中，就会读取尚未初始化的整数成员。下面是独立的错误示例，用它替换上面的类型定义与对象定义；类型仍放在 `main` 之前，对象放在 `main` 中，仅分析其初始化过程，不运行：

```cpp
struct horizontal_span {
    int right{left + 10}; // 错误：此时 left 尚未初始化
    int left{0};
};

const horizontal_span invalid{}; // 初始化会产生未定义行为
```

这里先初始化 `right`，计算 `left + 10` 时，`left` 还没有取得初值。成员名称可以出现在表达式中，不代表该成员的值已经可读。

> [!WARNING] 默认成员初始化器不能读取尚未初始化的成员
> 对这里的自动存储期对象，初始化按成员声明顺序进行。计算 `right` 的初值时读取尚未初始化的 `left`，会在 C++23 中产生未定义行为；随后再把 `left` 初始化为 `0`，不能修复先前的无效读取。这类错误不要求编译器给出诊断。

## 参考资料

- [C++23 工作草案：聚合](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：初始化与默认初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：默认成员初始化器](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：不确定值](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)
- [C++ Core Guidelines：始终初始化对象](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Res-always)
