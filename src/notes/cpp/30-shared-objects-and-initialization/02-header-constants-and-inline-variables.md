---
title: 头文件常量与 inline 变量（Header Constants and inline Variables）
date: 2026-09-22
order: 2
---

# 头文件常量与 inline 变量（Header Constants and inline Variables）

几个源文件都需要使用目标压力 `240 kPa`，可以把这个值的定义集中放在头文件中。但“每处读到相同的值”和“每处访问同一个对象”是两项不同的要求。

对于只参与数值计算的常量，各处对象不同未必影响使用。一旦接口返回它的地址或引用，对象身份就成为接口的一部分。本篇讨论普通头文件中的命名空间变量，不涉及模板或模块。

## 共享头文件可以得到同值的不同对象

在普通命名空间中，像 `const int target_pressure_kpa{240};` 这样的变量，如果没有先前的外部链接声明，也没有使用 `extern` 或 `inline`，其名称默认具有内部链接。`constexpr int` 同样声明了一个 const 对象，因此也适用这里的规则。

让两个源文件包含以下头文件，能够直接观察对象身份。三个文件共同组成一个独立程序。

`pressure.hpp`：

```cpp
#ifndef CPP_NOTES_PRESSURE_HPP
#define CPP_NOTES_PRESSURE_HPP

namespace workshop {
constexpr int target_pressure_kpa{240};

const int* target_address();
} // namespace workshop

#endif
```

`helper.cpp`：

```cpp
#include "pressure.hpp"

namespace workshop {
const int* target_address() {
    return &target_pressure_kpa;
}
} // namespace workshop
```

`main.cpp`：

```cpp
#include "pressure.hpp"

#include <iostream>

int main() {
    const int* const other_address{workshop::target_address()};

    std::cout << workshop::target_pressure_kpa << '\n';
    std::cout << *other_address << '\n';
    std::cout << (&workshop::target_pressure_kpa == other_address) << '\n';
}
```

构建后运行得到三行输出：

```sh
g++ -std=c++23 main.cpp helper.cpp -o pressure_demo
```

```text
240
240
0
```

`main.cpp` 和 `helper.cpp` 各自取得了一份变量定义。由于名称具有内部链接，它们定义的是两个对象，不是同一外部对象的两份定义。`target_address` 返回 `helper.cpp` 中那个对象的地址；`main.cpp` 对自己看到的变量取地址，得到另一个地址。

两个值都为 `240`，指针比较却为 `false`；流的默认布尔输出将它显示为 `0`。这不违反单一定义规则，因为两个对象各有自己的定义。

这些对象具有静态存储期，不会在 `target_address` 返回时被销毁。因此这里可以返回非拥有指针，用于观察其身份；它并不是一个指向函数局部临时对象的悬空指针。

> [!IMPORTANT]
> 头文件只负责把定义带入各个翻译单元，不会自动让这些定义表示同一个对象。对这里具有内部链接的常量，每个翻译单元拥有自己的对象；相同的初值不改变这个关系。

## inline constexpr 让各处使用同一个常量对象

内联变量（inline variable）是在变量声明中使用 `inline` 得到的变量形式。对这里具有外部链接的变量，它允许一致的定义出现在多个翻译单元中，同时仍然表示同一个对象。

现在只修改 `pressure.hpp` 中的常量定义：

```cpp
inline constexpr int target_pressure_kpa{240};
```

其余文件和构建命令不变，输出变为：

```text
240
240
1
```

这次定义中的 `inline` 使变量不再适用上述“命名空间 const 变量默认内部链接”的规则。在当前具名命名空间中，其名称具有外部链接。两个翻译单元中的定义共同描述同一个对象，所以两处取得的地址相等。

这一行中的两个说明符分别承担不同职责：

- `constexpr` 要求初始化满足常量表达式条件，并使这个对象不可修改。这里的值也可以用于要求常量表达式的位置。
- `inline` 使当前外部链接变量可以按一致性规则在多个翻译单元中定义，并保持同一对象身份。

**命名空间中的 constexpr 变量不会仅因写了 constexpr 就自动成为 inline 变量。**反过来，`inline` 也不隐含 `const`：若在同一头文件的 `namespace workshop` 内写 `inline int completed_count{0};`，得到的是可修改的共享对象。允许共享一个定义，并不意味着业务状态应该全部放到头文件中。

## inline 仍然要求定义可用且保持一致

[inline 函数的定义边界](../29-headers-and-multi-file-programs/03-definition-boundaries-and-inline.md#inline-允许按条件共享同一个函数的定义)也能帮助理解这里的组织方式：使用 inline 变量的翻译单元需要能够取得它的定义，通常由共同包含的头文件提供。

不能仅在一个 `.cpp` 中写 `inline constexpr int target_pressure_kpa{240};`，让其他源文件只看见普通 `extern const int target_pressure_kpa;`，再依靠链接把缺少的 inline 声明和定义补齐。让所有使用者包含同一个完整定义，才能维持一致的组织。

对本篇的简单整数常量，把同一份 `inline constexpr` 定义放进自包含头文件，可以同时保持定义的词法记号和所依赖的语义一致。不能在不同翻译单元中分别写成 `{240}` 和 `{250}`，也不能让共同定义中的同一个名称在不同地方绑定不同实体；这类跨翻译单元 ODR 违规可能没有诊断。

> [!WARNING]
> 对象身份也影响头文件中的函数定义。若保留最初的非 inline 常量，却把返回 `&target_pressure_kpa` 的函数改成外部链接的 inline 函数并放入头文件，各份函数定义就会取不同对象的地址，违反定义一致性要求。
>
> 内部链接常量本身可以合法放在头文件中；问题出在同一外部 inline 函数依赖了不同对象的身份。标准允许的部分“只读取相同常量值”的例外，不适用于这里的取地址操作。

## extern const 可以共享对象而不公开初值

如果调用者只需要在运行时读取一个不可修改的共享对象，并不需要把它的值用于常量表达式，可以由头文件声明、一个源文件定义。

下面是替代前面程序的另一组三文件内容。

`pressure.hpp`：

```cpp
#ifndef CPP_NOTES_PRESSURE_HPP
#define CPP_NOTES_PRESSURE_HPP

namespace workshop {
extern const int target_pressure_kpa;
}

#endif
```

`pressure.cpp`：

```cpp
#include "pressure.hpp"

namespace workshop {
const int target_pressure_kpa{240};
}
```

`main.cpp`：

```cpp
#include "pressure.hpp"

#include <iostream>

int main() {
    const int target{workshop::target_pressure_kpa};
    std::cout << target << '\n';
}
```

构建并运行，输出为 `240`：

```sh
g++ -std=c++23 main.cpp pressure.cpp -o pressure_demo
```

这里，头文件中的 `extern const int` 声明已经赋予名称外部链接。`pressure.cpp` 包含头文件后再写定义，沿用该链接属性；它不会因为定义处只写了 `const` 就变成另一个内部链接对象。

但是，`main.cpp` 只知道这个对象存在、类型为 `const int`，并不知道它的初始化内容。把 `main` 中的局部声明改成以下代码，会在该声明处编译失败：

```cpp
constexpr int target{workshop::target_pressure_kpa};
```

定义所在源文件写了字面量 `240`，也不能让调用方凭一个看不见初值的声明，将该对象的值用于常量表达式。链接能够连接同一对象的引用，不会倒过来补全编译当前翻译单元时所需的常量表达式条件。

## 按值需求和身份需求选择定义形式

以下比较限定于本篇的普通命名空间整数常量，且头文件被多个翻译单元包含：

| 定义形式 | 各翻译单元是否使用同一对象 | 调用方能否将这里的值用于常量表达式 |
| --- | --- | --- |
| 头文件中 `constexpr int value{240};`，无先前外部链接声明 | 否，各自拥有内部链接对象 | 能 |
| 头文件中 `inline constexpr int value{240};` | 是，定义必须满足一致性要求 | 能 |
| 头文件中 `extern const int value;`，一个源文件提供定义 | 是，定义集中在一个源文件 | 仅看见该声明时不能 |

> [!PRACTICE]
> 只在一个实现文件内部使用的常量，可以留在该文件中。需要公开编译期数值、但不依赖对象身份时，头文件中的普通 constexpr 常量能够满足需求；需要各处共享同一身份时，inline constexpr 可以在公开初值的同时给出一个对象。只需共享运行时可读的常量对象、希望由实现文件维护初值时，可以使用 extern const。
>
> 选择依据是调用方需要什么值、是否依赖同一对象，以及初值是否需要成为公开接口的一部分，而不是只看哪种写法字符更少。

## 参考资料

- [C++23 工作草案：程序与链接](https://timsong-cpp.github.io/cppwp/n4950/basic.link)
- [C++23 工作草案：inline 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.inline)
- [C++23 工作草案：constexpr 与 consteval 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
- [C++23 工作草案：常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
