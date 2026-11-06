---
title: 从具体函数到函数模板（From Concrete Functions to Function Templates）
date: 2026-09-23
order: 1
---

# 从具体函数到函数模板（From Concrete Functions to Function Templates）

比较两次压力读数，既可能使用整数，也可能使用浮点数。如果比较过程相同，只是参数和结果的类型不同，为每一种类型维护一份函数体，就会反复描述同一项操作。

函数模板（function template）用模板参数描述一组相关函数。它让类型成为可以确定的参数，同时保留每个具体函数自己的参数类型、返回类型和操作规则。

## 相同的过程可以只有类型不同

下面两份重载定义可以放在源文件的命名空间作用域中：

```cpp
int larger(int first, int second) {
    if (first < second) {
        return second;
    }

    return first;
}

double larger(double first, double second) {
    if (first < second) {
        return second;
    }

    return first;
}
```

这里约定输入是需要按数值比较的普通读数，浮点输入为有限值。两份函数都在第二个值更大时返回它，否则返回第一个值；形参按值接收，结果也按值返回。

[函数重载](../12-function-overloading-and-overload-resolution/05-design-boundaries-of-overloaded-interfaces.md#同一个名称应当表达同一项操作)让同一名称提供不同接口，但不会替作者统一两份函数体。若操作过程本身应当一致，可以进一步把类型差异写成参数。

## 用类型参数描述函数

以下模板定义替代前面的两个普通函数：

```cpp
template <typename T> T larger(T first, T second) {
    if (first < second) {
        return second;
    }

    return first;
}
```

`template <typename T>` 是紧接着的函数声明的模板参数部分。这里的类型模板形参（type template parameter）`T` 表示一个待确定的类型；`typename` 说明这个参数接收的是类型。

当 `T` 确定为 `int` 时，返回类型以及 `first`、`second` 的类型都是 `int`；当 `T` 确定为 `double` 时，这三处类型都随之成为 `double`。**同一个 T 在当前模板中表达同一个类型，不是每出现一次就重新选择。**

`T` 只是这个参数的名称，可以换成其他合法名称。它不是一个保存“类型编号”的运行期变量，也没有创建名为 `T` 的对象。在这种类型参数声明位置，`template <class T>` 与 `template <typename T>` 含义相同，`class` 不会把实参限制为类类型。

需要分别看待两层参数：

| 层次 | 当前例子 | 提供什么 |
| --- | --- | --- |
| 模板形参 | `typename T` | 为函数确定一个类型 |
| 模板实参（template argument） | `int` 或 `double` | 本次采用的具体类型 |
| 函数形参 | `first`、`second` | 每次调用使用的对象 |
| 函数调用实参 | `220`、`240` 等表达式 | 本次调用传入的值 |

## 具体调用使用具体函数

调用时可以从实参类型确定 `T`，这个过程称为模板实参推导（template argument deduction）。下面是只保留模板定义的完整程序：

```cpp
#include <iostream>

template <typename T> T larger(T first, T second) {
    if (first < second) {
        return second;
    }

    return first;
}

int main() {
    std::cout << larger(220, 240) << '\n';
    std::cout << larger(220.5, 240.25) << '\n';
}
```

输出为：

```text
240
240.25
```

第一处调用从两个 `int` 实参得到 `T = int`，第二处从两个 `double` 实参得到 `T = double`。函数模板与具体模板实参对应的具体函数，称为该模板的函数特化（function template specialization）。

根据模板和实参形成所需具体声明或定义的过程，称为实例化（instantiation）。这里没有手动编写各类型的具体函数定义；当调用需要它们时，由语言规定的隐式实例化（implicit instantiation）规则处理。

这使程序能够得到相当于 `int larger(int, int)` 和 `double larger(double, double)` 的具体接口，但它们来自函数模板。不能把这些说明接口形状的写法再当作普通函数声明加进程序，否则会引入另一组普通函数。

**模板描述一组可能的函数，具体调用使用其中类型已经确定的函数。**它不要求编译器预先为所有 C++ 类型建立函数；同一类型下传入不同数值，也不会仅因此形成不同特化。

> [!IMPORTANT]
> 模板实参决定具体函数，函数调用实参决定本次传入的值。确定类型和检查所需定义发生在翻译程序的过程中；函数体里的比较与返回仍然描述调用时的操作，不能把“使用模板”理解为所有业务计算都必须提前完成。

## 统一写法仍然保留操作要求

`typename T` 没有承诺任意类型都能使用这个函数。当前函数体要求能够比较 `first < second`，并能把选中的值作为 `T` 返回；按值传参本身也要能完成相应对象的初始化。

整数和本例中的浮点数满足这些要求。对于自定义类，比较、复制或移动是否可用，仍由该类型的接口决定。把类型名称换成 `T`，不会自动产生缺失的操作，也不会取消原有的访问与生命周期规则。

泛型编程（generic programming）在这里体现为：把一项操作依赖的类型要求和实现过程组织起来，使满足要求的不同类型复用这份描述。真正需要统一的是操作的含义；仅仅两段代码长得相似，还不足以说明它们应该共用同一个模板。

> [!PRACTICE]
> 多种类型遵循同一过程时，可以用函数模板减少重复维护。若不同类型需要不同的业务含义或处理过程，分别设计接口或重载会更直接。已有标准库设施能够准确表达操作时，仍应优先使用；这里手写较大值选择，是为了观察类型参数怎样形成具体函数。

## 参考资料

- [C++23 工作草案：函数模板](https://timsong-cpp.github.io/cppwp/n4950/temp.fct.general)
- [C++23 工作草案：模板参数](https://timsong-cpp.github.io/cppwp/n4950/temp.param)
- [C++23 工作草案：函数调用中的模板实参推导](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
- [C++23 工作草案：隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
