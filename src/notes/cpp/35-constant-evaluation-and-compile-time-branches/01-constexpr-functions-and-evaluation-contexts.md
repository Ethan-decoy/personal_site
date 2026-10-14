---
title: constexpr 函数与求值语境（constexpr Functions and Evaluation Contexts）
date: 2026-09-28
order: 1
---

# constexpr 函数与求值语境（constexpr Functions and Evaluation Contexts）

固定批次的数量可能来自两个数相乘，也可能来自一段更复杂的计算。把计算提取为函数后，调用结果能否继续用来初始化 `constexpr` 对象，或者决定 `std::array` 的长度？

[常量表达式由语言规则判定](../06-constants-literals-and-type-conversions/03-constant-expressions-and-constexpr.md#容易计算不等于常量表达式)。一个普通函数即使只返回两个整数之积，调用也不能因此用于常量表达式。`constexpr` 函数（constexpr function）为函数提供了参与常量求值的能力；某一次调用是否必须满足常量表达式要求，还要看结果用在哪里。

## 让同一个计算用于两种语境

下面的 `sample_count` 接收组数与每组数量，返回总数量。函数返回类型前的 `constexpr` 修饰函数，不是把它的形参声明成常量：

```cpp
#include <array>
#include <cstddef>
#include <iostream>

constexpr std::size_t sample_count(std::size_t groups, std::size_t per_group) {
    return groups * per_group;
}

int main() {
    constexpr std::size_t fixed_count{sample_count(2, 3)};
    const std::array<double, fixed_count> samples{};

    std::size_t groups{2};
    ++groups;
    const std::size_t current_count{sample_count(groups, 3)};

    std::cout << samples.size() << ' ' << current_count << '\n';
}
```

输出为：

```text
6 9
```

`fixed_count` 是 `constexpr` 对象，它的初始化要求常量表达式。`sample_count(2, 3)` 的定义已知，传入的值可用于这次常量计算，函数执行的乘法也满足要求，因此得到的 `6` 可以继续作为 [`std::array` 的长度实参](../32-class-templates-and-generic-types/04-value-template-parameters-and-defaults.md#数量必须能用于常量表达式)。

`current_count` 只是普通 `const` 对象。它在初始化时读取可修改对象 `groups` 的当前值，再调用同一个函数；这次调用不满足常量表达式要求，但可以作为普通调用成立。函数仍然计算两个参数的乘积，结果为 `9`。

如果把 `current_count` 的声明改为下面这样，程序便无法通过编译：

```cpp
constexpr std::size_t current_count{sample_count(groups, 3)}; // 错误：读取 groups
```

修改的是结果所在的语境。`constexpr` 对象要求常量初始化，而此处对普通可修改对象 `groups` 的读取不满足这个要求；给函数加上 `constexpr` 不会消除该限制。

> [!IMPORTANT]
> `constexpr` 函数提供参与常量求值的能力。需要常量表达式的语境会检查具体调用是否满足要求；不要求常量表达式的语境仍可按普通函数调用使用它。

## 函数说明符与对象说明符各自约束什么

`constexpr` 写在不同声明上，约束的对象不同：

| 写法 | 表达的要求 |
| --- | --- |
| `constexpr int calculate(int value)` | 函数能够参与常量求值，具体调用仍须满足相应规则 |
| `constexpr int result{calculate(3)}` | `result` 是常量对象，初始化必须满足常量表达式要求 |
| `const int result{calculate(value)}` | `result` 初始化后不可通过该对象修改，初始化不因此被要求为常量表达式 |
| `int result{calculate(value)}` | 普通可修改对象，初始化不要求常量表达式 |

表中的 `const` 行没有否定 [`const` 整数对象用于常量表达式的条件](../06-constants-literals-and-type-conversions/03-constant-expressions-and-constexpr.md#const-整数对象的精确边界)：合适的 `const` 整数对象可以用于常量表达式，但 `const` 声明本身并不强制初始化满足该条件。

对函数而言，`constexpr` 也不是“每次调用都在翻译时完成”的命令。例如 `int count{sample_count(2, 3)};` 不属于必须进行常量初始化的局部对象声明，编译器可能直接生成结果，也可能保留相应运算。这是实现和优化的选择。

相反，`constexpr` 对象初始化和数组长度这样的语境提出的是**语言要求**：不满足常量表达式规则，程序就不成立。观察一次输出或生成的机器代码，不能替代这个判断。

## 常量求值的位置必须能使用函数定义

通常的非 `inline` 函数可以在调用处只提供声明，由其他源文件提供定义；常量求值需要在求值位置使用函数定义，仅有声明还不够。

下面是同一个源文件中故意写错的命名空间作用域片段，省略了 `main`：

```cpp
constexpr int sample_count(int groups, int per_group);

constexpr int fixed_count{sample_count(2, 3)}; // 错误：此处尚不能使用函数定义

constexpr int sample_count(int groups, int per_group) {
    return groups * per_group;
}
```

把函数定义移到 `fixed_count` 之前，初始化才具备所需条件。函数体写在文件后面，并不会让前面的常量初始化追溯使用它。

当多个源文件都需要用一个函数进行常量求值时，通常应把定义放进共同包含的头文件。`constexpr` 函数隐含 `inline`，可按 [`inline` 的定义一致性要求](../29-headers-and-multi-file-programs/03-definition-boundaries-and-inline.md#inline-允许按条件共享同一个函数的定义)在多个翻译单元中提供同一函数的定义；这里的 `inline` 仍然不是强制展开调用的优化指令。同一函数的各次声明也必须一致地使用 `constexpr`。

> [!PRACTICE]
> 当一个计算既用于固定配置、类型中的数量，也用于普通输入时，可以让同一个 `constexpr` 函数承载计算规则。选择它的理由是接口需要支持常量表达式，而不是单凭函数短小就推断会更快；调用能否成立，还要检查它实际读取的数据和执行的操作。

## 参考资料

- [C++23 工作草案：constexpr 说明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
