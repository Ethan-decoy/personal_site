---
title: 内置数组与指针转换（Built-in Arrays and Pointer Conversion）
date: 2026-09-15
order: 1
---

# 内置数组与指针转换（Built-in Arrays and Pointer Conversion）

`std::array<double, 3>` 把三个元素放在同一个固定长度序列对象中。C++ 也提供内置数组（built-in array），例如 `double samples[3]`。

阅读内置数组相关代码时，要分清**数组对象本身、从数组取得的首元素指针，以及函数真正声明的形参类型**。数组类型保留元素数量，函数能否取得这项信息取决于形参类型。

## 数组类型包含元素类型与数量

用 `double samples[3]{240.0, 250.0, 260.0};` 保存三个以千帕（kPa）为单位的压力读数。`samples` 的类型是 `double[3]`，读作“包含三个 `double` 的数组”。方括号中的数量称为数组界（array bound），属于类型的一部分。因此 `double[3]` 和 `double[4]` 是不同类型。

显式数组界必须是 `std::size_t` 类型的经转换常量表达式，且值大于零。对这里的整数写法，数量须在编译期确定，并且能无窄化地转换为 `std::size_t`。长度为零的固定序列可以用 `std::array<double, 0>` 表示。

数组对象由这些元素子对象组成，元素连续存放，编号从 `0` 到 `2`。访问 `samples[1]` 就是在访问第二个元素；读写下标必须在已有元素范围内。数组本身并不是一个保存另一区域地址的指针变量。

这里的 `double` 内置数组也遵循[聚合初始化规则](../01-fixed-size-sequences-and-array-objects.md#初始化值不足不会缩短数组)。使用花括号时，未显式给出初值的元素补为零。对于完全省略初始化器的自动存储期局部数组，C++23 中读取未写入的元素值会导致未定义行为。

## 转换产生首元素指针，数组仍然存在

当需要元素指针时，数组表达式可以发生数组到指针转换（array-to-pointer conversion）。

> [!IMPORTANT] 数组界保留在数组类型中
> `double[3]` 表达元素类型和数组界。对这种数组表达式进行数组到指针转换时，得到指向首元素的 `double*`。原数组保存元素，首元素指针提供访问位置。只持有元素指针时，需要从其他来源取得元素数量。

下面的程序先通过转换得到的指针修改首元素，再遍历整个数组。

```cpp
#include <iostream>

int main() {
    double samples[3]{240.0, 250.0, 260.0};
    double* const first{samples};

    *first = 245.0;
    std::cout << (first == &samples[0]) << '\n';

    for (const double value : samples) {
        std::cout << value << '\n';
    }
}
```

程序先输出 `1`，表明 `first` 和 `&samples[0]` 指向同一个元素。随后依次输出 `245`、`250` 和 `260`，其中第一项是经由 `*first` 更新的值。

范围 `for` 绑定整个 `samples` 数组，从数组类型取得界 `3`。它使用首元素指针作为起点，并依据数组界确定尾后位置。

复制 `first` 只复制首元素的访问位置。通过指针访问元素要求原元素仍然有效。对 `const double[3]` 进行这项转换，得到的是 `const double*`。

## 形参中的方括号不保证传入数量

函数声明会把数组类型的形参调整为对应的元素指针类型。`void set_first(double samples[3]);` 和 `void set_first(double* samples);` 声明的是同一个函数，形参类型是 `double*`。调用方需要根据函数实际访问的元素范围提供有效的指针。

下面保留形参的数组写法，对照向同一个函数传单个对象的地址和直接传入数组。函数只通过 `samples[0]` 写入指针指向的一个 `double`，这两次调用都提供了有效的目标。

```cpp
#include <iostream>

void set_first(double samples[3]) {
    samples[0] = 245.0;
}

int main() {
    double sample{240.0};
    set_first(&sample);
    std::cout << sample << '\n';

    double samples[3]{240.0, 250.0, 260.0};
    set_first(samples);
    std::cout << samples[0] << '\n';
}
```

程序输出两行 `245`。第一次调用的实参 `&sample` 已经是 `double*`，写入的是单个 `sample` 对象。第二次调用的实参 `samples` 发生数组到指针转换，写入的是原数组的首元素。

**形参类型调整发生在函数声明中，实参表达式的转换发生在调用时。**方括号里的 `3` 在形参调整后没有成为长度要求。若函数继续访问 `samples[1]` 或 `samples[2]`，第一次调用会越界并产生未定义行为。

## 数组本身没有普通整体复制操作

下面两处错误可以在 `main` 中分别验证。两种情形都先声明 `samples`，然后分别尝试初始化 `copied`，或先声明 `target` 再执行整体赋值。

```cpp
double samples[3]{240.0, 250.0, 260.0};
double copied[3]{samples}; // Error: an array does not initialize another array this way.
double target[3]{};
target = samples; // Error: built-in arrays cannot be assigned as a whole.
```

第一处的 `samples` 用来初始化一个 `double` 元素，因此类型不匹配。第二处尝试给内置数组整体赋值，因而无法编译。需要复制读数时，可以在有效下标范围内逐个给目标元素赋值。

对包含数组成员的非联合类，可用的默认复制构造会用源数组中的对应元素初始化目标数组的各个元素。可用的默认复制赋值会将源元素逐个赋给目标数组中已有的元素。需要把固定长度序列作为独立值传递、返回或整体赋值时，可以使用 `std::array`。

## 借用时保留整个数组的数量

`std::span` 可以直接从内置数组建立借用。构造函数的数组引用形参绑定整个数组，从数组类型取得元素数量。下面的片段可以放在包含 `<span>` 的程序的 `main` 中。

```cpp
const double samples[3]{240.0, 250.0, 260.0};
const std::span<const double> view{samples};
```

`view.size()` 返回 `3`。这里的 `std::span<const double>` 把 `3` 记为视图的长度，并提供对这三个元素的只读访问。接口只取得 `const double*` 时，建立同样的借用范围还需要可靠的元素数量。

> [!PRACTICE] 按拥有和借用选择 array 或 span
> 需要拥有固定数量的元素时，可以用 [std::array](../01-fixed-size-sequences-and-array-objects.md#元素随数组对象一起存在) 表达完整的值；函数只需借用连续数据时，可以用 [std::span](../02-borrowing-contiguous-ranges-with-span.md#将连续元素作为一段范围交给函数) 同时传递访问位置与数量。接触内置数组或指针接口时，先确认长度在哪个环节仍然可知，避免在形参方括号中写一个数字就把它当作保证。

## 参考资料

- [C++23 工作草案：数组类型与元素组成](https://timsong-cpp.github.io/cppwp/n4950/dcl.array)
- [C++23 工作草案：聚合初始化中的数组元素](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：默认初始化与值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：不确定值与读取规则](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)
- [C++23 工作草案：数组到指针转换](https://timsong-cpp.github.io/cppwp/n4950/conv.array)
- [C++23 工作草案：以数组为范围的 for 循环](https://timsong-cpp.github.io/cppwp/n4950/stmt.ranged)
- [C++23 工作草案：函数形参类型调整](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：数组成员的默认复制构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：数组成员的默认复制赋值](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：从数组构造 span](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
