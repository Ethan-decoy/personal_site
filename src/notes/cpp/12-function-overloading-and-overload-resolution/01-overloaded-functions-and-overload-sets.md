---
title: 重载函数与重载集（Overloaded Functions and Overload Sets）
date: 2026-08-29
order: 1
---

# 重载函数与重载集（Overloaded Functions and Overload Sets）

压力检查可以采用约定的上界，也可以由调用者为某次检查指定上界。两种形式都在判断读数是否落入允许范围，可以共享同一个操作名称。

本例以千帕（kPa）表示压力，约定下界为 `0.0`，常用上界为 `500.0`；单次检查也可以指定其他非负上界。这些数值是示例的接口约定。

## 同名函数接受不同数量的实参

下面是独立的完整程序。两个普通函数定义都放在文件最外层、`main` 之前，调用放在 `main` 的函数体中：

```cpp
#include <iostream>

bool is_pressure_valid(const double pressure_kpa) {
    return (pressure_kpa >= 0.0) && (pressure_kpa <= 500.0);
}

bool is_pressure_valid(const double pressure_kpa, const double maximum_pressure_kpa) {
    return (pressure_kpa >= 0.0) && (pressure_kpa <= maximum_pressure_kpa);
}

int main() {
    const bool standard_valid{is_pressure_valid(220.0)};
    const bool configured_valid{is_pressure_valid(220.0, 200.0)};

    std::cout << standard_valid << ' ' << configured_valid << '\n';
}
```

这两个函数位于同一作用域，名称相同，形参数量不同。函数重载（function overloading）允许这种同名安排；它们仍然是两个不同的重载函数（overloaded functions）。

| 调用 | 本例选中的函数 | 检查结果 |
| --- | --- | --- |
| `is_pressure_valid(220.0)` | 接收一个实参的版本 | `220.0` 位于 `[0.0, 500.0]`，返回 `true` |
| `is_pressure_valid(220.0, 200.0)` | 接收两个实参的版本 | `220.0` 超过指定上界 `200.0`，返回 `false` |

这两个定义都要求实参数量与各自的形参数量相同：第一条调用不能匹配需要两个实参的函数，第二条调用也不能匹配只接收一个实参的函数。程序输出 `1 0`，分别是两个布尔结果的默认输出形式。

第二条调用返回 `false`，表示被选中的函数完成比较后判定读数越界，不表示重载选择失败。

> [!IMPORTANT] 重载集与一次调用的目标
> **在本节的同一作用域普通函数中，可见的同名函数组成重载集（overload set）；一次合法调用会按实参形式确定一个具体函数。**这项编译期选择过程称为重载决议（overload resolution）。
>
> 重载集描述名称查找得到的一组函数声明，不是运行期间保存函数的容器，也不会创建额外对象。共享名称不会把函数合并，函数运行后的比较结果也不会反过来改变已经选定的调用目标。

后面的声明片段分别独立考察，均放在文件最外层；需要接入开篇程序时会明确说明。调用目标可以根据声明判断，实际执行调用所需的函数定义仍须另行提供。

## 参数类型与调用目标

形参数量相同、类型不同，也可以形成重载。下面的独立声明片段用整数与浮点参数表示这种区别：

```cpp
bool is_pressure_valid(int pressure_kpa);
bool is_pressure_valid(double pressure_kpa);
```

若某次调用前可见的重载只有这两项，下面两种调用分别选择与实参类型一致的版本：

| 调用表达式 | 实参类型 | 选中的声明 |
| --- | --- | --- |
| `is_pressure_valid(220)` | `int` | `bool is_pressure_valid(int)` |
| `is_pressure_valid(220.5)` | `double` | `bool is_pressure_valid(double)` |

`int` 与 `double` 之间也允许相应的数值转换，但在这里，与实参类型一致的匹配优于需要数值转换的匹配。因此，不能把选择过程简单理解为“找到任意一个能接收该值的函数”。更完整的比较规则见[标准转换序列的匹配等级](03-best-viable-functions-and-ambiguous-calls.md#标准转换序列的匹配等级)。

实参的类型与它保存的数值也要分别判断。一个 `double` 对象即使保存 `220.0`，通过该名称传入时仍参与 `double` 版本的选择，不会因数值没有小数部分而改选 `int` 版本。

这里用声明比较函数身份和调用目标。对于开篇那种小范围数值检查，单个 `double` 参数已经能够接收所示的整数与浮点读数，不必仅因输入写法不同就额外增加一个重载。

## 调整后的形参类型列表

对于本篇给出的同一作用域函数声明，语言使用调整后的形参类型列表（parameter-type-list）区分这些同名函数。这里的“调整后”表示源代码中的形参声明要先按照函数类型规则处理；本篇范围内最重要的一项结果是，按值形参的顶层 `const` 不会保留为重载区别。

形参名称不属于形参类型列表，也不参与重载区分。下面两项声明描述的是同一个函数，而不是两个重载：

```cpp
bool is_pressure_valid(int pressure_kpa);
bool is_pressure_valid(int measured_pressure_kpa);
```

两处 `int` 参数类型相同，名称差异只影响各自声明对参数含义的表达。第二行只是再次声明第一行已经声明的函数。

> [!IMPORTANT] 不同写法不一定声明不同函数
> **对本节同一作用域中的普通函数，形参数量或调整后的形参类型列表不同，可以区分同名函数；形参名称和按值形参的顶层 `const` 不参与这项区分。**不能只数源代码中写了几条声明，就断定存在几个函数。
>
> 同一函数可以有多次一致的声明，声明与定义也可以使用不同的形参名称。它们仍须满足同一函数各项声明之间的类型一致性要求。

## 返回类型不能单独区分重载

返回类型属于函数类型的一部分，但不能单独用来区分普通函数重载。下面是独立的文件作用域错误片段：

```cpp
int classify_pressure(int pressure_kpa);
bool classify_pressure(int pressure_kpa); // 错误：同一函数的返回类型冲突
```

这两项声明拥有相同名称和相同形参类型列表，对应的是同一个函数，却给出了不同的返回类型。第二条声明本身就与第一条冲突，即使没有任何调用，程序也不合法。

> [!WARNING] 返回类型冲突发生在声明处
> 只有返回类型不同的这组声明，不能先构成合法重载集，再等待调用者选择。把调用结果交给 `int` 或 `bool` 对象，都不能修复已经发生的声明冲突。
>
> 这与“已有合法重载，但某次调用无法确定唯一目标”的调用歧义不同。应先确认声明是否合法，再判断调用能否选中具体函数。

对本节的普通函数调用，调用结果随后怎样使用，不会反过来帮助选择重载。返回类型仍须与同一函数自己的声明和定义一致。

## 按值参数的顶层 const 不形成重载

按值形参是每次调用创建的独立对象。在函数定义的形参声明中使用顶层 `const`，可以限制函数体修改这个参数副本，却不会改变调用者向函数提供值的方式。

下面这个独立片段中的两项声明对应同一个函数：

```cpp
int encode_pressure(int pressure_kpa);
int encode_pressure(const int pressure_kpa);
```

形成函数类型时，按值形参的这一级 `const` 被忽略；定义中的参数对象仍保留自己的 `const` 约束。开篇两个函数定义中的只读数值形参都采用了这种写法。

例如，把下面这条声明放在开篇完整程序的两个函数定义之前，其余代码保持不变，程序仍然输出 `1 0`：

```cpp
bool is_pressure_valid(double pressure_kpa);
```

它与开篇接收一个实参的 `const double` 定义对应同一个函数，不会再增加一个重载。声明中不带顶层 `const`，也没有撤销定义里对形参副本的只读限制。

> [!WARNING] 同一函数不能在同一翻译单元重复定义
> 在同一翻译单元中，若分别为 `encode_pressure(int)` 和 `encode_pressure(const int)` 提供函数体，就会形成同一函数的重复定义，编译器会诊断错误。它们不是两个可以同时保留、供调用时选择的重载。

引用参数中的 `const` 处理的是另一项边界：它限定通过引用访问目标对象的能力。下面是另一组独立声明，可以分别为读数提供可写和只读访问：

```cpp
int& access_reading(int& reading);
const int& access_reading(const int& reading);
```

这里的参数分别是 `int&` 和 `const int&`，属于不同类型。前者要求可绑定的、允许修改的 `int` 对象，后者通过只读访问路径指代对象。这种被引用类型上的 `const` 不会像按值形参的顶层 `const` 那样被忽略。

不同重载可以具有不同返回类型，但这一对声明能够形成重载的原因，是引用参数类型不同。返回类型的差异没有单独建立重载。

## 参考资料

- [C++23 工作草案：函数重载与重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.pre)
- [C++23 工作草案：声明的对应关系](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.scope#4)
- [C++23 工作草案：同一实体的声明类型要求](https://timsong-cpp.github.io/cppwp/n4950/basic.link#11)
- [C++23 工作草案：形参类型调整](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct#5)
- [C++23 工作草案：标准转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank#4)
