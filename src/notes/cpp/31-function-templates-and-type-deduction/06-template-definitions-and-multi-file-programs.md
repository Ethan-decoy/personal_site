---
title: 模板定义与多文件程序（Template Definitions and Multi-File Programs）
date: 2026-09-23
order: 6
---

# 模板定义与多文件程序（Template Definitions and Multi-File Programs）

普通函数通常可以在头文件中声明，在一个 `.cpp` 中定义。函数模板也可以先声明再定义，但若直接照搬这种文件分工，只把模板函数体藏在一个独立编译的 `.cpp` 中，其他源文件并不能据此为任意类型实例化函数。

关键区别是：**模板定义描述怎样为具体模板实参形成函数；单独编译一份模板定义，不会提前为所有可能的类型提供函数实现。**

本篇沿用普通头文件与隐式实例化（implicit instantiation）的组织方式，不涉及模块或集中提供指定类型实例的其他组织策略。

## 声明说明怎样调用，定义提供怎样实例化

函数模板可以只有声明。例如，下面是可放在命名空间作用域的合法声明：

```cpp
template <typename T> T larger(T first, T second);
```

它已经足以说明模板参数、函数形参和返回类型。看到 `larger(3, 7)` 时，编译器能够推导 `T = int`，形成 `int larger<int>(int, int)` 的声明，并据此检查调用和参与重载选择。**需要完整定义的是隐式实例化函数体，不是仅仅认识这个函数模板名称。**

普通的 `int larger(int, int)` 定义在编译其实现文件时就已经描述一个确定函数。上面的模板声明则没有说明 `larger<int>` 怎样比较和返回值；单独把模板定义放进另一个翻译单元（translation unit），也不会使定义自动进入调用者所在的翻译单元。

在当前依靠调用触发隐式实例化的方式下，使用者所在的翻译单元需要能够取得模板定义。把定义放进共用头文件，让调用者经 `#include` 取得它，是最直接的组织方式。

这不是“声明不合法”，也不是“定义必须写在调用语句之前”的逐行限制。它约束的是需要隐式实例化时，相应翻译单元能否取得定义；将完整定义随头文件提供，可以清楚地满足这项要求。

## 同一个定义供两个源文件使用

下面是一个完整的三文件程序。两个 `.cpp` 都使用 `larger<int>` 和 `larger<double>`，普通辅助函数 `print_helper_values` 则仍按声明与单一定义分工。

`values.hpp`：

```cpp
#ifndef CPP_NOTES_VALUES_HPP
#define CPP_NOTES_VALUES_HPP

template <typename T> T larger(T first, T second) {
    if (first < second) {
        return second;
    }
    return first;
}

void print_helper_values();

#endif
```

`helper.cpp`：

```cpp
#include "values.hpp"

#include <iostream>

void print_helper_values() {
    std::cout << "helper: " << larger(9, 4) << ' ' << larger(9.5, 4.5) << '\n';
}
```

`main.cpp`：

```cpp
#include "values.hpp"

#include <iostream>

int main() {
    std::cout << "main: " << larger(3, 7) << ' ' << larger(3.5, 7.5) << '\n';
    print_helper_values();
}
```

构建并运行：

```sh
clang++ -std=c++23 -Wall -Wextra -Wpedantic -Werror main.cpp helper.cpp -o values_demo
```

输出为：

```text
main: 7 7.5
helper: 9 9.5
```

每个源文件在预处理后都包含相同的模板定义，因而都能对自己的调用进行推导和实例化。`print_helper_values` 则由 `helper.cpp` 提供唯一普通函数定义；`main.cpp` 只需要头文件中的声明。

[分别编译的边界](../29-headers-and-multi-file-programs/01-declarations-across-source-files.md#分别编译保留了各自的检查边界)仍然存在。两个 `.cpp` 不是因为同时出现在构建命令里就合成一个翻译单元；这里能成功，是因为它们各自经头文件取得了所需定义。

## 模板定义可以按 ODR 条件跨翻译单元共享

前面的头文件没有给 `larger` 添加 `inline`。这不会因两个源文件同时包含它而产生普通函数那样的重复定义问题。

[单一定义规则](../29-headers-and-multi-file-programs/03-definition-boundaries-and-inline.md#单一定义规则先区分两种重复)对不同实体有不同要求。当前这种不涉及模块的函数模板，可以在不同翻译单元中具有符合一致性要求的定义；仅为允许这些模板定义跨翻译单元出现，不需要再额外添加 `inline`。

这项允许重复的规则仍有边界：

- 同一翻译单元内不能把同一个模板定义两次，头文件仍需要包含保护。
- 不同翻译单元中的定义需要保持相同的词法记号（token）序列，不能各自维护一份意思相近的函数体。
- 定义中的名称查找和相关操作需要符合 ODR 的一致性要求。对于同一组模板实参，不能让同样写出的调用在不同翻译单元中指向不同函数。

最后一项与[定义一致不只取决于文本](../29-headers-and-multi-file-programs/03-definition-boundaries-and-inline.md#定义一致不只是看起来做了同样的事)相同。共用头文件有助于维持一致，但若头文件依赖包含者预先提供的不同声明，或者宏配置在各处改变了函数体，单靠“包含的是同一个文件”仍然不够。

当前示例没有这些差异：两个位置取得相同的模板定义，同为 `int` 时使用相同的整数比较，同为 `double` 时使用相同的浮点比较。各处使用的 `larger<int>` 在语言上仍是同一个具体函数，`larger<double>` 则是另一个具体函数，不会因调用源文件不同而自动变成各自私有的函数。

> [!IMPORTANT]
> 模板允许按 ODR 条件共享定义，与机器代码最终保留几份是两个问题。编译器和链接器可以采用合并、内联展开等实现方式；语言不要求每个翻译单元都在最终程序中保留一份物理副本。

## 把定义单独搬进 cpp 为什么会缺少实例

现在对前面的程序作一个失败对照：`helper.cpp` 与 `main.cpp` 保持不变，只把 `values.hpp` 改成以下完整内容。

```cpp
#ifndef CPP_NOTES_VALUES_HPP
#define CPP_NOTES_VALUES_HPP

template <typename T> T larger(T first, T second);

void print_helper_values();

#endif
```

另建 `values.cpp`，把模板定义放在其中：

```cpp
#include "values.hpp"

template <typename T> T larger(T first, T second) {
    if (first < second) {
        return second;
    }
    return first;
}
```

即使把这个文件加入构建，也没有完成修复：

```sh
clang++ -std=c++23 -Wall -Wextra -Wpedantic -Werror main.cpp helper.cpp values.cpp -o values_demo
```

在常见的分别编译工具链中，这个程序会在链接时报告缺少 `larger<int>` 和 `larger<double>` 的定义。具体诊断措辞取决于工具链；仅有声明的单个源文件能够完成编译，并不代表整个程序满足模板定义要求。

可以沿着三个翻译单元各自掌握的信息解释失败：

| 翻译单元 | 能看到什么 | 缺少什么 |
| --- | --- | --- |
| `main.cpp` | 模板声明，以及本文件的 `int`、`double` 调用 | 能够实例化对应函数体的模板定义 |
| `helper.cpp` | 同一模板声明，以及本文件的 `int`、`double` 调用 | 能够实例化对应函数体的模板定义 |
| `values.cpp` | 模板声明和完整定义 | 没有需要 `larger<int>` 或 `larger<double>` 定义的使用，本例不会据此自动生成它们 |

链接步骤负责连接已有编译产物中的引用和定义。不能期待它发现一个模板源代码定义后，回头替其他翻译单元尝试所有缺少的类型。这个错误对照违反当前隐式实例化方式所要求的定义可达性；语言对这类违规不要求一定在编译阶段诊断。

> [!WARNING]
> 把模板定义放在一个独立编译的 `.cpp` 中，并不等于已经为其他文件可能使用的所有 `T` 提供了定义。只补上这个 `.cpp` 的构建输入，无法补足本例中缺失的实例。

## 文件后缀不是定义可用性的规则

“把模板定义放在头文件中”是一项满足当前需求的组织策略，不是 C++ 对 `.hpp` 后缀的语法要求。模板定义也可以写在某个 `.cpp` 中，供同一翻译单元内的代码使用；还可以拆进另一个实现文件，再由公共头文件包含它，使使用者仍然取得完整定义。

后一种拆分只改善文件布局，**没有隐藏编译依赖**：调用者经包含链仍然读取定义，定义变化仍可能要求重新编译调用方。

也存在为预先确定的类型集中提供实例的组织方式，但它需要额外安排相应实例，不能由一份孤立的模板定义自动完成。对当前希望调用者按所需类型使用的函数模板，保留同一份自足的头文件定义，更容易同时满足隐式实例化和 ODR 一致性要求。

## 参考资料

- [C++23 工作草案：模板定义的可达性要求](https://timsong-cpp.github.io/cppwp/n4950/temp.pre#10)
- [C++23 工作草案：隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：模板声明参与重载决议](https://timsong-cpp.github.io/cppwp/n4950/temp.over#5)
- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
