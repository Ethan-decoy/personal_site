---
title: 从操作要求到模板约束（From Operation Requirements to Template Constraints）
date: 2026-09-27
order: 1
---

# 从操作要求到模板约束（From Operation Requirements to Template Constraints）

判断一个整数是否为偶数，可以检查它除以 `2` 的余数。将这个过程写成函数模板后，函数体需要类型支持相应运算，但调用接口并没有自动获得这项限制。

模板约束（template constraint）把适用条件写在声明上，使条件能够参与接口的选择。**函数体中需要某项操作，与接口明确要求这项操作，是两个不同层次。**

## 函数体的要求不会自动变成参与条件

下面的定义可以放在源文件的命名空间作用域：

```cpp
template <typename T> bool is_even(T value) {
    return value % 2 == 0;
}
```

`is_even(4)` 推导出 `T = int`，取余与比较都成立，得到 `true`。若在 `main` 中调用 `is_even(4.0)`，则推导出 `T = double`，随后在实例化函数体时发现 `double % int` 不合法，程序编译失败。

这与[函数体错误不会使选择退回另一个重载](../31-function-templates-and-type-deduction/05-function-templates-and-overload-resolution.md#函数体错误不会使选择退回另一个重载)是同一个边界：仅仅把 `%` 写在函数体里，没有把“只接受整数类型”变成声明上的条件。

若当前接口本来就只处理内置整数类型，可以明确表达这个范围。

## 用命名概念说明类型条件

C++20 引入的概念（concept）为一组模板实参约束提供名字。标准库在 `<concepts>` 中提供了 `std::integral`：`std::integral<T>` 检查 `T` 是否属于整型。

这里的 `std::integral<int>`、`std::integral<double>` 都是概念名后跟模板实参的表达式，称为概念标识（concept-id）。它们具有 `bool` 类型，可以在编译期确定结果；前者为 `true`，后者为 `false`。这不是创建一个类对象，也不是调用一个接收数值的函数。

`std::integral` 检查的是语言中的类型类别。`bool` 和字符类型也属于这个类别；“整数类型”不等于某项业务中已经合法的编号或数量。

## requires 子句把条件附着到声明

下面是带约束的完整程序：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
    requires std::integral<T>
bool is_even(T value) {
    return value % 2 == 0;
}

int main() {
    std::cout << is_even(4) << ' ' << is_even(5) << '\n';
}
```

程序输出 `1 0`。模板参数列表之后的 `requires std::integral<T>` 是 requires 子句（requires-clause），为下面的函数模板声明指定约束。

对 `is_even(4)`，可以沿着三个判断理解：

1. 从普通函数实参推导出 `T = int`。
2. 检查 `std::integral<int>`，约束满足，这个模板特化可以继续接受可行性与重载选择检查。
3. 调用需要函数定义，实例化并使用对应的函数体。

如果在同一个 `main` 中增加下面一行，会编译失败：

```cpp
std::cout << is_even(4.0) << '\n'; // 错误：T = double 不满足声明上的约束
```

这次失败已经发生在接口选择阶段：`std::integral<double>` 为假，模板提供的这个函数不能成为可行调用。程序中也没有其他可行重载，因此调用报错；不再靠实例化 `value % 2` 才发现不适用。

约束不满足不是让编译器忽略这条调用，而是排除这条不适用的路径。是否还能完成调用，要看有没有其他可行接口。

> [!IMPORTANT]
> 类型推导先确定本次模板实参，声明上的约束再判断它是否适用。约束不满足时，这条路径不可行；约束满足时，所需函数定义仍必须成立。

## 约束不会替推导重新选择类型

`4.0` 的数值虽然没有小数部分，表达式类型仍然是 `double`。`is_even(4.0)` 不会为了满足 `std::integral<T>`，先把实参当作整数，再重新推导 `T = int`。

显式指定模板实参则是另一种调用。在上面程序的 `main` 中，可以写：

```cpp
std::cout << is_even<int>(4.0) << '\n';
```

这行输出 `1`。调用者已经指定 `T = int`，`std::integral<int>` 满足约束；函数形参随之确定为 `int`，`4.0` 再按普通转换规则变成 `4`。这与 `is_even(4.0)` 使用同一个实参，区别在于调用者是否已经确定模板类型。

这不是约束帮忙完成了推导，而是显式类型选择之后发生了[形参初始化与类型转换](../31-function-templates-and-type-deduction/02-template-argument-deduction-and-explicit-arguments.md#显式指定后按具体接口处理转换)。约束检查类型条件，不替调用者决定数值转换是否符合业务含义。

## 约束表达实际承诺的接口范围

当前 `is_even` 选择 `std::integral<T>`，表达“接受内置整型”。如果某个自定义类重载了 `%`，即使它的函数体操作本来可能成立，该类也不会因此变成 `std::integral` 所接受的类型。

反过来，满足整型条件也不保证编号为正、数量非零或某个下标有效。这些是对象值的条件，不能从“`T` 是整型”直接推出。

> [!PRACTICE]
> 约束应当与接口实际承诺的范围一致。明确只处理整型时，可以采用标准库的类型类别概念；需要接纳不同类所提供的共同操作时，应描述这些操作的要求。选择条件的依据是接口含义，不能只为让某个示例通过而随意加减限制。

## 参考资料

- [C++23 工作草案：受约束的声明](https://timsong-cpp.github.io/cppwp/n4950/temp.constr.decl)
- [C++23 工作草案：概念定义与概念表达式](https://timsong-cpp.github.io/cppwp/n4950/temp.concept)
- [C++23 工作草案：标准库算术概念](https://timsong-cpp.github.io/cppwp/n4950/concepts.arithmetic)
- [C++23 工作草案：可行函数的约束检查](https://timsong-cpp.github.io/cppwp/n4950/over.match.viable)
