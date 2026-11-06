---
title: 函数声明与定义（Function Declarations and Definitions）
date: 2026-08-27
---

# 函数声明与定义（Function Declarations and Definitions）

运费函数接收基本费与附加费，返回两者之和。把它的定义写在 `main` 之前，调用位置便能看到完整定义；如果希望先写 `main`，再写具体计算，也可以先提供一条不带函数体的声明。

声明让调用位置知道怎样使用函数，定义还提供函数体。以下使用返回类型与参数类型都显式写出的普通非成员函数（non-member function），金额按整数元记录，输入为非负的小整数。完整程序各自独立，代码片段会注明替换或追加的位置。

## 函数定义同时也是声明

先看一份完整程序。运费函数接收两个 `int`，返回两项费用的和：

```cpp
#include <iostream>

int calculate_shipping_fee(int base_fee, int surcharge) {
    return base_fee + surcharge;
}

int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n'; // 15
    return 0;
}
```

`int calculate_shipping_fee(int base_fee, int surcharge) { ... }` 同时承担两项职责：

| 职责 | 这条定义提供的内容 |
| --- | --- |
| 声明（declaration） | 函数名为 `calculate_shipping_fee`，接收两个按顺序排列的 `int` 参数，返回 `int` |
| 定义（definition） | 函数体把两个参数相加，并通过 `return` 提供结果 |

编译器分析 `main` 中的调用时，前面的定义已经提供了名称和类型信息，因此能够检查两个实参，并确定调用结果是 `int`。程序执行到这次调用时，才进入函数体计算，最终输出 `15`。

> [!IMPORTANT] 函数定义也是声明
> **函数定义一定是声明，但函数声明不一定是定义。**对于这里显式写出类型的普通函数，声明提供名称、返回类型与参数类型等调用所需的信息；带有函数体的定义还提供实现。写出这种函数声明或定义本身，都不会发起一次调用。

## 在定义之前提供声明

把运费函数的定义移到 `main` 之后，并在 `main` 之前补上一条前向声明（forward declaration），程序仍能正常构建并输出 `15`：

```cpp
#include <iostream>

int calculate_shipping_fee(int base_fee, int surcharge);

int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n'; // 15
    return 0;
}

int calculate_shipping_fee(int base_fee, int surcharge) {
    return base_fee + surcharge;
}
```

`int calculate_shipping_fee(int base_fee, int surcharge);` 没有函数体，以分号结束。它声明函数的名称、两个参数的类型和返回类型，尚未说明两项费用具体怎样计算；后面的定义补上函数体。

分析调用时，编译器已经知道：`5` 和 `10` 分别为两个 `int` 形参提供初值，调用产生的 `int` 结果可以初始化 `shipping_fee`。完成这些检查不需要在此处看到加法和 `return`。

> [!IMPORTANT] 调用处需要可见声明，不必先看到定义
> **本节这种普通非成员函数的调用，必须在调用位置拥有通过名称查找可见的声明；此前的函数定义也能充当这份声明。**只有调用所需的声明先可见，函数体才可以放在后面。源码中的声明与定义顺序，用于判断名称能否在当前位置被认识，不是函数体的运行顺序。

在上面的完整程序中，只删除 `main` 之前的前向声明，其余代码保持原样，下面这条初始化语句就无法通过编译：

```cpp
int shipping_fee{calculate_shipping_fee(5, 10)}; // 错误：此处尚无可见声明
```

后文虽然仍有正确的函数定义，也不能补救较早调用处的名称查找失败。此时缺少的是调用位置可用的声明，问题在分析调用时就已经发生。

## 声明中的参数名称

把前向声明版程序中 `main` 之前的那一条函数声明替换为下面三条，其他代码保持不变，程序仍然输出 `15`：

```cpp
int calculate_shipping_fee(int base_fee, int surcharge);
int calculate_shipping_fee(int fee, int extra_fee);
int calculate_shipping_fee(int, int);
```

这三条声明位于同一作用域，函数名、返回类型与按顺序列出的参数类型都相同；参数名称的变化或省略，不会使它们变成不同的函数。文件末尾的原定义仍然提供这一个函数的实现。

声明中的参数名有助于说明输入的含义。它们不会在文件最外层建立可供其他代码使用的变量，也不会在写出声明时创建一次调用的参数对象。函数体中的 `base_fee` 与 `surcharge` 来自定义自己的参数列表；第二条声明中的 `fee` 与 `extra_fee` 不会自动进入这个函数体。

> [!IMPORTANT] 参数类型与参数名称的职责不同
> **在同一作用域中，对本节这种同名、参数类型列表相同的函数作重复声明时，返回类型必须一致；形参名称可以不同或省略。**形参名称不属于函数类型，调用的实参与形参仍按列表位置对应，函数体使用定义中给出的形参名称。

例如，在前向声明版程序中，保留 `main` 之前返回 `int` 的声明，只把文件末尾的运费函数定义替换为下面这段，就会发生类型冲突：

```cpp
double calculate_shipping_fee(int base_fee, int surcharge) { // 错误：与先前声明的返回类型冲突
    return base_fee + surcharge;
}
```

这两处都以同一名称和两个 `int` 参数声明函数，却分别写出 `double` 与 `int` 返回类型，不能把它们当成仅返回类型不同的两个函数。这里的冲突发生在类型上，与参数叫什么无关。

> [!PRACTICE] 用参数名称说明输入含义
> 声明中保留有意义的参数名，并与定义中的名称保持一致，通常更便于阅读和维护。两个参数都是 `int` 时，`base_fee` 与 `surcharge` 能说明各位置接收什么；仅看类型无法区分它们的业务含义。

## 多次声明与一次定义

上一组的三条声明没有创建三个函数，也不要求提供三份实现。前向声明和后面的定义共同描述同一个函数；增加调用次数，同样不需要复制定义。

> [!IMPORTANT] 重复声明不能代替所需定义
> **同一翻译单元中，同一个函数可以有多条相互一致的声明，但最多有一份定义。普通调用所需的函数定义，必须由完整程序提供。**重复声明不会生成函数体；只有声明而没有所需定义，仍然缺少实现。

本节各程序的源码经预处理后形成一个翻译单元（translation unit）。在前向声明版完整程序的末尾，再追加下面这份定义，就会构成同一翻译单元内的重复定义错误：

```cpp
int calculate_shipping_fee(int base_fee, int surcharge) { // 错误：同一函数已在前面定义
    return base_fee + surcharge;
}
```

即使两个函数体逐字相同，也不能在同一个翻译单元中再次定义这个函数。

反过来，如果只删除 `main` 之后的运费函数定义，就会留下以下源文件。这里故意只保留声明与调用，不从其他源文件或库补充实现：

```cpp
#include <iostream>

int calculate_shipping_fee(int base_fee, int surcharge);

int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n';
    return 0;
}
```

仅编译这个源文件时，声明足以让编译器检查调用，并产生目标文件；目标文件仍保留对运费函数实现的需求。按照[编译与链接的分工](../00-introduction/03-source-file-to-executable.md#库与链接补齐程序所需的实现)，如果链接时也没有任何目标文件或库提供相应实现，常见工具链会报告未定义引用、未解析外部符号等链接错误。具体诊断用语取决于工具链。

需要定义的原因是程序中的这次普通调用，**不是只要写过一条声明，就无条件要求提供函数体**。下面这份独立完整程序只声明函数，没有使用它，可以正常构建；运行时没有输出：

```cpp
int calculate_shipping_fee(int base_fee, int surcharge);

int main() {
    return 0;
}
```

几种问题的区别可以按当前缺少的条件判断：

| 当前情况 | 缺少或违反的条件 | 常见表现 |
| --- | --- | --- |
| 调用在前，唯一的定义在后，调用前没有声明 | 调用位置没有可见声明 | 分析调用时报告名称未声明 |
| 调用前有声明，完整程序没有所需定义 | 有接口信息，却没有对应实现 | 单独编译可成功，链接时报告未定义符号 |
| 同一翻译单元中出现同一函数的两份定义 | 违反单一定义规则（one-definition rule，ODR） | 编译时报告重复定义 |
| 只写声明，没有使用这个函数 | 没有因此产生对函数定义的需求 | 可以正常构建 |

## 函数定义不能嵌套

本节的运费函数与 `main` 都写在文件最外层，不属于任何类，是普通非成员函数。它们所在的位置属于命名空间作用域（namespace scope）。

下面这份源文件把运费函数直接定义在 `main` 的函数体内，因此无法通过编译：

```cpp
#include <iostream>

int main() {
    int calculate_shipping_fee(int base_fee, int surcharge) { // 错误：函数定义不能直接嵌套
        return base_fee + surcharge;
    }

    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n';
    return 0;
}
```

函数体可以包含局部对象声明、选择和循环等语句，但不能直接容纳另一个普通非成员函数的定义。把运费函数的定义移回 `main` 外，并在调用位置之前提供声明或定义，才符合这里的组织方式。

> [!IMPORTANT] 普通非成员函数的定义不能直接嵌套
> **普通非成员函数的定义位于命名空间作用域，不能直接嵌套在另一个函数体中。**函数声明与函数定义的放置规则不同：块内可以包含函数声明，但这不允许在块内直接写出普通非成员函数的函数体。

## 参考资料

- [C++23 工作草案：声明与定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def)
- [C++23 工作草案：名称查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.general)
- [C++23 工作草案：函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)
- [C++23 工作草案：同一实体的声明与类型要求](https://timsong-cpp.github.io/cppwp/n4950/basic.link#11)
- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
