---
title: 命名空间与限定名称（Namespaces and Qualified Names）
date: 2026-09-21
order: 1
---

# 命名空间与限定名称（Namespaces and Qualified Names）

维修与生产代码可能都需要名为 `adjust_pressure` 的函数。如果把两项相同参数类型的定义都放在程序最外层，名称就无法区分它们属于哪套接口。不断把组件名称拼进函数名也能减少冲突，但每个名称都要自行维持同一套前缀。

命名空间（namespace）为一组声明建立共同的名称归属。调用者可以明确写出“哪一组接口里的哪个名称”，组内仍能使用简洁的名称。

## 为同名函数指定归属

`namespace` 后面写命名空间名称，再用花括号包住属于它的声明。下面是一个完整程序；两项调整规则分别归属于 `workshop` 和 `factory`：

```cpp
#include <iostream>

namespace workshop {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}
} // namespace workshop

namespace factory {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 10;
}
} // namespace factory

int main() {
    std::cout << workshop::adjust_pressure(220) << '\n';
    std::cout << factory::adjust_pressure(220) << '\n';
}
```

程序依次输出 `225` 和 `230`。两个函数虽然都叫 `adjust_pressure`，参数也都是 `int`，但它们属于不同的命名空间，是不同的函数。

这里的 `::` 是作用域解析运算符（scope resolution operator）。`workshop::adjust_pressure` 是限定名称（qualified name）：`workshop::` 指明查找名称的命名空间，`adjust_pressure` 是要查找的名称。`factory::adjust_pressure` 指定另一套接口。

**命名空间让相同的短名称可以有不同的归属；限定名称把这项归属写进使用位置。**它不会使同一命名空间中的冲突定义合法。如果再向 `workshop` 添加一份参数仍为 `int` 的 `adjust_pressure` 函数定义，依然是在重复定义同一个函数。

## 命名空间组织声明，不是调用对象

`workshop::adjust_pressure(220)` 调用的是一个普通非成员函数。调用者不需要先构造 `workshop` 对象，函数也没有由 `workshop` 提供的调用对象。

命名空间的花括号界定声明归属，不是执行到那里就进入、离开就结束的运行时代码块。可以在其中声明函数、类型和变量，但不能像函数体那样直接写一条独立的赋值语句来要求程序执行。

命名空间定义只能放在命名空间作用域（namespace scope）中，包括程序最外层和其他命名空间内；不能在函数体内或类内定义命名空间。**需要按名称组织接口时使用命名空间；需要创建带状态的对象时，仍由类与对象承担相应职责。**

## 类型也具有自己的归属

以下片段放在 `main` 之前：

```cpp
namespace workshop {
struct reading {
    int pressure_kpa;
};
} // namespace workshop

namespace factory {
struct reading {
    int pressure_kpa;
};
} // namespace factory
```

`workshop::reading` 与 `factory::reading` 是两次独立类定义产生的不同类型。即使成员列表相同，语言也不会把它们视为同一种类型。在 `main` 中使用：

```cpp
const workshop::reading current{220};
const factory::reading copied{current}; // 错误：两种类型没有相应的转换关系
```

失败原因不是复制能力被删除，而是 `current` 根本不是 `factory::reading` 对象；这两个定义也没有提供把一种类型转换成另一种类型的接口。命名空间允许两种类型共享短名称，却不会为它们自动设计转换。

这同样说明，给声明加上命名空间需要反映实际的接口归属，不能把它当成只影响显示效果的装饰。

## 全局命名空间与 std

没有写在其他命名空间、类或函数内部的声明，处于全局命名空间（global namespace）。前面程序中的 `workshop`、`factory` 和 `main` 都在这一层；程序入口 `main` 应定义在全局命名空间中。

全局命名空间没有可拼写的名称。名称最前面的 `::` 表示从这一层开始限定，因此在前面的 `main` 中也可以写：

```cpp
std::cout << ::workshop::adjust_pressure(220) << '\n';
```

`workshop::adjust_pressure` 先根据当前位置查找 `workshop`；`::workshop::adjust_pressure` 则明确指定全局命名空间里的 `workshop`。在这个程序中，两种写法找到相同的函数；前导 `::` 的用途是明确起点。

`std` 是标准库使用的命名空间。`std::cout`、`std::string` 中的 `std::` 表达的正是这种名称归属。相应声明仍须通过正确的标准库头文件提供；写上限定名称不会自动使尚不可见的声明出现。

> [!PRACTICE]
> 将共同提供一套接口的自定义类型和函数放入自己的命名空间，调用处保留能说明来源的限定名称。标准库设施继续显式使用 `std::`；自定义接口放在自有命名空间中，不向 `std` 随意添加声明。

## 参考资料

- [C++23 工作草案：命名空间](https://timsong-cpp.github.io/cppwp/n4950/basic.namespace)
- [C++23 工作草案：命名空间作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.namespace)
- [C++23 工作草案：限定名称查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.qual)
- [C++23 工作草案：类类型](https://timsong-cpp.github.io/cppwp/n4950/class.pre)
- [C++23 工作草案：主函数](https://timsong-cpp.github.io/cppwp/n4950/basic.start.main)
