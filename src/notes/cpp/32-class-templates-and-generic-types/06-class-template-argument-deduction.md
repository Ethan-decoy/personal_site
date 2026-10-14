---
title: 类模板实参推导（Class Template Argument Deduction）
date: 2026-09-27
order: 6
---

# 类模板实参推导（Class Template Argument Deduction）

声明 `reading<int> first{220};` 时，`<int>` 选择具体类，`220` 提供构造对象的值。如果构造实参已经足以确定模板参数，能否省略尖括号里的类型？

从 C++17 起，**类模板实参推导（class template argument deduction，CTAD）**允许在某些初始化语境中这样写。它补齐的是具体类的模板实参，结果仍然是类型已经确定的普通对象。

## 从构造形参与实参确定具体类

以下完整程序使用按值接收读数的构造函数：

```cpp
#include <iostream>
#include <utility>

template <typename T> class reading {
  public:
    explicit reading(T value) : stored{std::move(value)} {}

    T value() const {
        return stored;
    }

  private:
    T stored;
};

int main() {
    const reading first{220};
    const reading<double> second{220};

    std::cout << first.value() / 100 << '\n';
    std::cout << second.value() / 100 << '\n';
}
```

输出为 `2` 和 `2.2`。两次初始化都写了整数实参 `220`，但选择具体类的方式不同。

第一项省略模板实参。对这里的普通构造形参 `T value`，推导将它与 `220` 的类型 `int` 匹配，得到 `T = int`，因此 `first` 的类型为 `const reading<int>`。`value()` 返回 `int`，随后的除法采用整数运算。

第二项显式写出 `<double>`，具体类已经选为 `reading<double>`，这里不需要 CTAD。构造函数的形参随之确定为 `double`，整数常量 `220` 可以转换为这个类型。`value()` 返回 `double`，因此除法采用浮点运算。

> [!IMPORTANT]
> CTAD 先确定模板实参，从而得到具体类；随后再按这个具体类的构造规则初始化对象。推导不是先构造一个“不知道 T 的对象”，再根据保存的值修改对象类型。

当前构造函数提供了确定 `T` 所需的信息。推导使用声明中的形参与实参关系，不会执行构造函数体，也不会检查成员最终存下了什么值来猜测类型。这里采用直接列表初始化，`explicit` 不妨碍调用这个构造函数。

## 从已有对象复制，不会自动再包一层

在原程序的 `main` 中、`first` 之后加入：

```cpp
const reading copy{first};

std::cout << copy.value() / 100 << '\n';
```

这行仍输出 `2`。`copy` 的类型是 `const reading<int>`，它通过普通复制构造保存与 `first` 相同的读数。

如果只机械地套用 `reading(T value)`，可能会以为实参类型是 `reading<int>`，于是 `T` 应当变成 `reading<int>`，结果得到嵌套的 `reading<reading<int>>`。这个结论忽略了 CTAD 专门提供的**复制推导候选（copy deduction candidate）**：从同一类模板的已有对象初始化时，它参与具体类型的选择，在本例中使推导结果保持为 `reading<int>`。

这仍然是两个判断：先确定 `copy` 采用 `reading<int>`，再使用该类的复制构造函数。推导没有自行执行复制，也不会保证一个本来禁止复制的类可以复制。

## 推导不会替调用者搜索公共类型

一个构造函数如果在多个位置使用同一个 `T`，那些位置需要给出一致的推导结果。这与[函数模板中同一参数的推导要求](../31-function-templates-and-type-deduction/02-template-argument-deduction-and-explicit-arguments.md#同一个类型参数需要得到一致结果)相同。

下面用一个独立的小类型说明两个位置的情况。把它放在原程序的 `main` 之前：

```cpp
template <typename T> struct reading_pair {
    reading_pair(T first, T second) : first{first}, second{second} {}

    T first;
    T second;
};
```

随后在 `main` 中使用以下声明，会编译失败：

```cpp
const reading_pair mixed{220, 240.5}; // 错误：两个位置分别推导出 int 和 double
```

第一个位置要求 `T = int`，第二个位置要求 `T = double`。这里不存在“因为都能转换为 `double`，所以先采用 `double`”这一步；CTAD 不会为这两个普通按值形参自动搜索公共算术类型。

如果这个接口确实应当保存浮点读数，可以改成：

```cpp
const reading_pair<double> mixed{220, 240.5};
```

此时类型已经指定，构造函数接收两个 `double`，再按普通初始化规则处理转换。指定类型表达了调用者的选择，并未改变模板推导的匹配规则。

## 返回目标类型不反向参与推导

把下面这个错误函数放在原程序的类定义之后、`main` 之前：

```cpp
reading<double> make_reading() {
    return reading{220}; // 错误：右侧推导为 reading<int>，不能转换成返回类型
}
```

返回表达式中的 `reading{220}` 独立地从 `int` 实参推导出 `reading<int>`。函数声明的返回类型不会反向要求这里采用 `T = double`；而当前类没有提供从 `reading<int>` 到 `reading<double>` 的转换接口，所以返回语句失败。

可以把该函数改为以下定义，直接选择需要返回的具体类：

```cpp
reading<double> make_reading() {
    return reading<double>{220};
}
```

也可以写 `return reading{220.0};`：这次实参本身具有 `double` 类型，推导自然得到 `reading<double>`。两种写法的依据不同，但都在形成返回表达式时就确定了正确的具体类型。

## 能省略模板实参的位置有限

CTAD 支持上述对象初始化，并不把 `reading` 变成一个可以独立出现在任意类型位置的具体类型。例如，在类定义之外，下面的函数声明不合法：

```cpp
void show(const reading& source); // 错误：普通函数形参不能这样省略类模板实参
```

如果函数只接收整数读数，应在同一位置声明具体类型：

```cpp
void show(const reading<int>& source);
```

如果函数要接收不同 `T` 对应的读数，可以把函数本身定义为模板，用以下定义替换上述普通函数声明，放在 `reading` 的类定义之后：

```cpp
template <typename T> void show(const reading<T>& source) {
    std::cout << source.value() << '\n';
}
```

在原程序的 `main` 中调用 `show(first);`，函数模板会从实参的 `reading<int>` 类型匹配出 `T = int`。这里明确写着 `reading<T>`，发生的是函数模板实参推导，不是用 CTAD 补齐一个裸的类模板名。

> [!PRACTICE]
> 初始化实参已经准确表达所需类型时，CTAD 可以省去重复信息。如果接口要求特定的表示，例如始终使用 `double` 保存读数，就显式写出 `reading<double>`。在函数参数等需要类型模式的位置，仍按接口意图写具体类型或 `reading<T>`。

## 参考资料

- [C++23 工作草案：推导类模板特化类型的适用位置](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.class.deduct)
- [C++23 工作草案：类模板实参推导与复制推导候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.class.deduct)
- [C++23 工作草案：最佳可行候选的选择](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：函数调用中的模板实参推导](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
