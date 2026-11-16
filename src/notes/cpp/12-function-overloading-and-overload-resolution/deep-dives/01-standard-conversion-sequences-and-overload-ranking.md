---
title: 标准转换序列与重载排序（Standard Conversion Sequences and Overload Ranking）
date: 2026-08-29
order: 1
---

# 标准转换序列与重载排序（Standard Conversion Sequences and Overload Ranking）

一个 `short` 左值传给 `int` 形参，既需要读取对象的值，又需要整数提升；整条匹配怎样得到一个等级？两个匹配都属于 Exact Match 时，又依据什么分出优劣？

隐式转换序列（implicit conversion sequence）描述一个实参怎样初始化对应形参，重载决议据此比较各个可行函数的匹配质量。本附章讨论普通函数中的内建算术类型、左值引用和一层对象指针，涉及的路径都属于标准转换序列（standard conversion sequence）。

序列记录语言规定的类型、限定和值类别关系。编译期先据此确定调用目标；运行时不会先为每个候选转换一份实参，也不按机器指令数量选择函数。

以下各份程序彼此独立。函数定义位于文件作用域，实际调用位于 `main` 的函数体中；错误程序会单独标明。

## 当前示例中的转换阶段

对这里的算术类型与对象指针，按值初始化形参时可能依次需要以下步骤：

| 阶段 | 当前涉及的变化 | 例子 |
| --- | --- | --- |
| 从左值取得值 | 左值到右值转换，读取对象当前保存的值 | 从 `short` 对象取得 `short` 值 |
| 调整数值类型 | 整数或浮点提升，或者其他数值转换 | `short` 提升为 `int` |
| 调整限定 | 限定转换（qualification conversion），增加被指类型的限定 | `int*` 转换为 `const int*` |

每个阶段至多发生一次，也可以不发生。数值阶段只能选择一次提升或转换，不能为了匹配某个重载而自由串联任意多项数值转换。这是当前示例用到的阶段子集，不是全部标准转换的分类。

下面的函数按值接收并输出一个整数：

```cpp
#include <iostream>

void print_value(const int value) {
    std::cout << value << '\n';
}

int main() {
    const short source{7};

    print_value(source);
    print_value(7);
    print_value(7L);
}
```

三次调用都输出 `7`，初始化形参所需的序列却不同：

- `source` 是 `const short` lvalue：先读取一个 `short` 值，再把它提升为 `int`。
- `7` 已经是 `int` prvalue：不需要读取对象或调整数值类型，匹配采用恒等转换（identity conversion）。
- `7L` 是 `long` prvalue：需要把 `long` 值转换为 `int` 值；这里的 `7` 能被 `int` 表示，数值保持不变。

形参声明中的顶层 `const` 限制函数体修改形参对象，不单独形成一项限定转换。这里把按值匹配的目标类型记作 `int`。

相同输出只说明三次调用最终都取得整数 `7`，不说明转换过程相同。阶段列表用于重建这类初始化过程，能够沿实参表达式追踪各步即可，无需背诵整段程序。

## 序列的组成决定整体等级

序列中的各项转换有自己的等级，整条序列也有一个等级：

> [!IMPORTANT] 整体等级由最差等级的组成部分决定
> **标准转换序列的等级依次为精确匹配（Exact Match）、提升（Promotion）、转换（Conversion），前者优于后者。**整体等级同时考虑各项转换及引用绑定：
>
> - 只要有 Conversion 等级的组成部分，整体就是 Conversion；
> - 没有 Conversion、但有 Promotion，整体就是 Promotion；
> - 否则，整体就是 Exact Match。
>
> 等级不是把转换步骤相加得到的分数，也不表示执行成本。

前一程序的三次调用可以这样归类：

| 实参 | 序列中的转换及其等级 | 整体等级 |
| --- | --- | --- |
| `source` | 左值到右值转换：Exact Match；`short` 到 `int` 的整数提升：Promotion | Promotion |
| `7` | 恒等转换：Exact Match | Exact Match |
| `7L` | `long` 到 `int` 的整数转换：Conversion | Conversion |

第一条序列中的取值步骤不会让它成为 Exact Match：后续的整数提升决定了整体的 Promotion 等级。

> [!WARNING] 类型更大不等于提升
> Promotion 是标准规定的一组转换关系，不能用“变成更大的类型”代替。`short` 到 `int` 是整数提升，`int` 到 `long` 则仍是 Conversion 等级的整数转换。
>
> 即使某个平台上 `long` 的范围更大，也不能据此把后一条序列排在其他 Conversion 之前；那样会错误预测重载选择或漏掉歧义。

## Exact Match 不等于没有转换

> [!IMPORTANT] 精确匹配可以包含转换
> **Exact Match 是等级，恒等转换是具体的序列情形，两者不能互换。**左值到右值转换、这里的指针限定转换都属于 Exact Match；仅包含这些步骤的标准转换序列仍然是精确匹配。

下面用指针观察取值和限定转换怎样组合。这里及后面的引用示例用于对照匹配规则；普通接口若只需要一个简单整数，按值传递通常更直接。

```cpp
#include <iostream>

void print_pointee(const int* const pointer) {
    std::cout << *pointer << '\n';
}

int main() {
    int value{7};
    int* const pointer{&value};

    print_pointee(pointer);
}
```

实参表达式 `pointer` 是 `int* const` lvalue，按值初始化指针形参需要两步：

| 步骤 | 得到的结果 | 等级 |
| --- | --- | --- |
| 读取指针对象中的值 | 指向 `value` 的 `int*` prvalue | Exact Match |
| 进行限定转换 | 仍指向 `value` 的 `const int*` prvalue | Exact Match |

因此整条序列仍是 Exact Match。增加的是被指整数类型上的 `const`，它限制经形参修改 `value`，没有改变目标对象的身份。指针对象自身的 `const` 只表示它不重新指向其他目标，不单独参与这项限定转换。

函数体中的 `*pointer` 随后读取整数，程序输出 `7`。这次读取发生在函数执行期间，不属于调用处把指针实参匹配到形参的转换序列。

## 引用绑定先决定可行性

引用形参需要一个可以绑定的对象。对这里的整数对象，`int&` 要求可修改的 `int` lvalue；`const int&` 还可以接受只读对象、同类型 prvalue，以及允许的数值转换所产生的结果。

下面的两个函数在输出中标明自己的引用形参类型。所有输入的数值都取 `7`，区别来自类型、限定和值类别：

```cpp
#include <iostream>

void print_binding(int& value) {
    std::cout << "int&: " << value << '\n';
}

void print_binding(const int& value) {
    std::cout << "const int&: " << value << '\n';
}

int main() {
    int value{7};
    const int fixed{7};
    const short source{7};

    print_binding(value);
    print_binding(fixed);
    print_binding(7);
    print_binding(source);
}
```

> [!IMPORTANT] 引用绑定的可行性、等级与限定关系
> **先按实参的类型、限定和值类别检查能否完成引用绑定，再比较可行函数的转换序列。**在这里的基础类型范围内，同一基础类型的直接绑定按恒等转换处理，属于 Exact Match；需要先进行数值转换再绑定临时目标时，等级还要计入该数值转换。
>
> 同一个可修改 `int` lvalue 能直接绑定 `int&` 和 `const int&`。两条序列都是 Exact Match；当这两个左值引用只在被引用类型的 `const` 限定上有区别时，绑定到限定更少的 `int&` 更好。这依据引用绑定的限定关系，不需要为只读引用复制一份整数。

四次调用的判断如下：

| 实参 | `int&` 版本 | `const int&` 版本 | 选中版本 |
| --- | --- | --- | --- |
| `value`：`int` lvalue | 直接绑定原对象，Exact Match | 直接绑定同一对象，Exact Match | `int&` |
| `fixed`：`const int` lvalue | 不可行，不能丢弃 `const` | 直接绑定原对象，Exact Match | `const int&` |
| `7`：`int` prvalue | 不可行，不能绑定该结果 | 物化临时对象后直接绑定，Exact Match | `const int&` |
| `source`：`const short` lvalue | 不可行，不能绑定 `short` 对象或提升所得结果 | 读取、提升后物化临时对象并绑定，Promotion | `const int&` |

程序依次输出 `int&: 7`，随后三次输出 `const int&: 7`。只有第一行需要在两个可行函数之间比较；其余三行中，`int&` 版本已经被绑定条件排除。

最后一行不会把原来的 `source` 变成 `int` 对象。它先读取 `short` 值 `7`，提升为 `int`，再建立临时 `const int` 对象供形参绑定。与之不同，`7` 本来就是 `int` prvalue，无需数值转换。

> [!WARNING] 直接绑定不等于目标早已存在
> `const int&` 绑定同类型的 `int` prvalue 时，会物化临时对象，但按引用初始化规则仍属于直接绑定，其匹配序列是 Exact Match。不能因为出现临时对象，就断定它不是直接绑定或属于 Conversion。
>
> 判断目标是否为原对象，要看初始化表达式和实际绑定过程；判断等级，要看排序规则计入哪些转换。两项判断不能互相代替。

这里两次临时绑定的目标都在各自调用所在的完整表达式结束时销毁。函数只在调用期间读取目标，没有把引用保存到调用之外。

## 同等级序列仍可能继续比较

相同等级不能单独决定两个序列是否同样好。下面两个重载都输出被指整数，并在行首标出采用的指针参数类型：

```cpp
#include <iostream>

void print_pointee(int* const pointer) {
    std::cout << "int*: " << *pointer << '\n';
}

void print_pointee(const int* const pointer) {
    std::cout << "const int*: " << *pointer << '\n';
}

int main() {
    int value{7};
    int* const pointer{&value};

    print_pointee(pointer);
}
```

两个版本都可行，完整序列分别是：

| 按值形参类型 | 完整序列 | 整体等级 |
| --- | --- | --- |
| `int*` | 左值到右值转换，取得 `int*` 值 | Exact Match |
| `const int*` | 左值到右值转换，取得 `int*` 值；再转换为 `const int*` | Exact Match |

第一条序列也要读取指针对象，不能把它直接称为恒等转换。要继续比较，需要使用标准规定的子序列关系：

> [!IMPORTANT] 子序列比较排除左值变换
> **比较标准转换序列的子序列关系时，先按规定顺序列出步骤，并排除左值变换（Lvalue Transformation）；本附章涉及的就是左值到右值转换。**如果从一条序列删除至少一个转换步骤、保留其余步骤及顺序，可以得到另一条序列，后者是真子序列（proper subsequence），也就是更好的匹配。
>
> 恒等序列按规则视为任何非恒等序列的子序列。这项比较依据转换之间的包含关系，不能简化为“步骤更少就更好”。

在本例的子序列比较中排除读取指针值的步骤后，`int*` 路径不剩其他转换，按恒等序列比较；`const int*` 路径还保留限定转换。前者因此更好，程序输出 `int*: 7`。

前面的引用对照则使用引用绑定的限定关系分出优劣。共同点是：Exact Match 只确定等级，具体序列仍可能由其他适用规则区分。

### 少一次取值也可能仍然歧义

下面是另一份独立的错误程序。两个声明分别表示按值输出整数、通过只读引用输出整数；仅根据声明就能确定调用存在歧义，因此这里不需要补充函数体：

```cpp
void print_value(int value);
void print_value(const int& value);

int main() {
    const int value{7};

    print_value(value); // 错误：调用存在歧义
}
```

`int` 形参需要读取 `value`，属于 Exact Match；`const int&` 形参直接绑定 `value`，按恒等转换处理，也属于 Exact Match。引用绑定少了读取实参值的步骤，但这一步不参与子序列比较。排除它后，两个序列无法据此区分。

这里也不能套用 `int&` 与 `const int&` 的比较：现在只有一个候选采用引用形参。没有其他适用规则能选出唯一最佳函数，所以编译器在调用处报告歧义。

> [!WARNING] 少一次取值不保证匹配更好
> 按值形参需要取值、引用形参可以直接绑定，并不意味着引用版本优先。左值到右值转换被排除出子序列比较后，两条序列仍可能无法区分，调用因而具有歧义。
>
> 相同等级既不保证歧义，也不保证能选出更好版本；必须检查是否有适用的比较规则，不能用执行步骤或预想成本打破平局。

> [!TIP] 核对一次调用的匹配序列
> 先写出实参表达式的类型、限定和值类别，再逐一列出初始化各候选形参需要的转换或绑定。指针应分清自身的顶层 `const` 与被指类型上的 `const`；引用应确认实际绑定哪个对象，以及绑定条件是否成立。
>
> 对剩余可行函数，核对序列组成、整体等级和适用的子序列或引用限定规则。同等级仍不能确定时，带着这些具体关系查阅[转换序列排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#3.2)和[引用绑定的序列规则](https://timsong-cpp.github.io/cppwp/n4950/over.ics.ref)，不要只凭类型名称或步骤数量判断。

一条序列只对应一个实参位置。多个实参时，还要按主线的[整体比较规则](../03-best-viable-functions-and-ambiguous-calls.md#多个实参必须整体比较)，检查某个候选是否在每个位置都不更差、且至少一处更好，并最终优于每个其他可行函数。

## 参考资料

- [C++23 工作草案：隐式转换序列与按值形参](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics.general)
- [C++23 工作草案：标准转换序列的组成与等级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.scs)
- [C++23 工作草案：引用绑定对应的转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.ics.ref)
- [C++23 工作草案：子序列与引用限定的排序规则](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#3.2)
- [C++23 工作草案：整数提升](https://timsong-cpp.github.io/cppwp/n4950/conv.prom#1)
- [C++23 工作草案：限定转换](https://timsong-cpp.github.io/cppwp/n4950/conv.qual)
- [C++23 工作草案：直接绑定与临时目标](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref#5)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general#2)
