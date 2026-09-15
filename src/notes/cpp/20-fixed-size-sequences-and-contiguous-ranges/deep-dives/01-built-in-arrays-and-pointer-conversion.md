---
title: 内置数组与指针转换（Built-in Arrays and Pointer Conversion）
date: 2026-09-15
order: 1
---

# 内置数组与指针转换（Built-in Arrays and Pointer Conversion）

`std::array<double, 3>` 把三个元素放在同一个固定长度序列对象中。语言本身也提供内置数组（built-in array）：`double samples[3]`。它同样包含三个元素，但直接复制数组变量、把数组传给函数时，适用的规则与 `std::array` 不同。

理解这种区别，需要分清**数组对象本身、从数组取得的首元素指针，以及函数真正声明的形参类型**。指针不保存元素数量，并不意味着原来的数组对象没有长度。

## 数组类型包含元素类型与数量

在 `double samples[3]{240.0, 250.0, 260.0};` 中，`samples` 的类型是 `double[3]`，读作“包含三个 `double` 的数组”。方括号中的数量称为数组界（array bound），属于类型的一部分；`double[3]` 与 `double[4]` 是不同类型。

这里显式写出的数组界需要是编译期可确定的正整数，不能直接使用任意运行期输入作为长度。标准 C++ 不允许声明零个元素的内置数组；`std::array<double, 0>` 则是合法的空序列类型。

数组对象由这些元素子对象组成，元素连续存放，编号从 `0` 到 `2`。访问 `samples[1]` 就是在访问第二个元素；读写下标必须在已有元素范围内。数组本身并不是一个保存另一区域地址的指针变量。

下面的程序只提供两个初始值，用第三个元素展示未显式列出的元素如何初始化：

```cpp
#include <iostream>

int main() {
    const double samples[3]{240.0, 250.0};

    for (const double value : samples) {
        std::cout << value << '\n';
    }
}
```

程序输出 `240`、`250`、`0`，各占一行。花括号内的值依次初始化元素；对于这里的 `double` 数组，剩余元素初始化为 `0.0`。写成 `double samples[3]{};` 时，三个元素都为 `0.0`，并没有变成空数组。

如果普通局部声明完全省去初始化部分，写成 `double samples[3];`，这些 `double` 元素就没有被初始化为可读取的数值。必须先向相应元素写入有效值，才能读取；不能把上一段的补零规则套用到这种声明上。这里限定的是普通自动存储期局部数组，其他存储期的初始化还受各自规则约束。

## 转换产生首元素指针，数组仍然存在

当需要元素指针时，数组表达式可以发生数组到指针转换（array-to-pointer conversion）。对本篇的 `double[3]`，转换结果是指向首元素的 `double*`，指针值与 `&samples[0]` 相同。

下面的程序通过这个指针修改第一个元素：

```cpp
#include <iostream>

int main() {
    double samples[3]{240.0, 250.0, 260.0};
    double* const first{samples};

    *first = 245.0;
    std::cout << samples[0] << '\n';
    std::cout << (first == &samples[0]) << '\n';
}
```

程序输出 `245` 和 `1`。初始化 `first` 时，数组表达式产生首元素指针；`*first` 与 `samples[0]` 访问同一个 `double`。没有复制三个元素，也没有把数组对象改造成指针对象。

`first` 的类型不包含数量 `3`。把它复制给另一个指针，只会复制访问位置；这些指针都依赖原数组元素仍然存活，不能延长数组的生命周期。对于 `const double[3]`，转换得到的是 `const double*`。

> [!IMPORTANT]
> 内置数组保存元素；从数组转换得到的指针定位首元素。数组界属于数组类型，转换结果的指针类型不再表达这项数量信息。判断当前是否还保留长度，应当看正在使用的是哪个对象或表达式。

并非任何使用数组名字的地方都会发生这项转换。上一个小节的范围 `for` 能遍历全部元素，是因为它直接以数组为范围。标准库也可以在接受整个数组时取得其数量。

## 形参中的方括号不保证传入数量

函数声明还有一条独立规则：形参写成数组形式时，会调整为对应的元素指针类型。`void set_first(double samples[3]);` 实际声明的形参类型是 `double*`，与 `void set_first(double* samples);` 相同。方括号里的 `3` 不构成“必须传入三个元素”的类型检查。

对于有效的目标指针，`samples[0]` 与 `*samples` 访问同一个对象。下面故意保留数组形式的形参，用一个独立的 `double` 展示形参没有数量保证。函数只写首元素，因此本次调用有效：

```cpp
#include <iostream>

void set_first(double samples[3]) {
    samples[0] = 245.0;
}

int main() {
    double sample{240.0};
    set_first(&sample);
    std::cout << sample << '\n';
}
```

程序输出 `245`。调用者并没有提供三个元素，函数也没有取得一个数组副本；`samples` 是收到 `&sample` 的指针形参。

如果这个函数仅根据声明中的 `3` 就继续访问 `samples[1]` 或 `samples[2]`，这次调用便会产生未定义行为。问题不在于调用时少复制了两个元素，而在于函数根本没有取得数量保证。

传入真正的内置数组时，两条规则共同起作用：函数声明先确定形参为指针，调用时数组实参再转换为首元素指针。**形参类型调整与实参表达式转换发生在不同环节**，不能都解释为“整个数组按值传进函数”。

## 数组本身没有普通整体复制操作

内置数组不能像 `std::array` 一样直接以另一个数组变量建立副本，也不能直接整体赋值。下面是放在 `main` 内的错误片段，两处错误分别标明：

```cpp
double samples[3]{240.0, 250.0, 260.0};
double copied[3]{samples}; // Error: an array does not initialize another array this way.
double target[3]{};
target = samples; // Error: built-in arrays cannot be assigned as a whole.
```

第一处不会展开为逐元素复制：花括号中的 `samples` 不能作为一个 `double` 的初始值。第二处也没有可用的数组整体赋值操作。逐个元素赋值仍然可以进行，但“能处理每个元素”与“数组变量支持整体复制”是不同能力。

这项限制针对这里直接操作的内置数组变量；包含数组成员的类，其默认复制可以按成员规则复制各个数组元素。对于需要作为独立值传递、返回或整体赋值的固定长度数据，`std::array` 提供了更直接的接口。

## 借用时保留整个数组的数量

`std::span` 可以直接从内置数组建立借用，并从数组类型取得元素数量，不需要调用者再手写一份长度。下面是在已包含 `<span>` 的程序中，放在 `main` 内的片段：

```cpp
double samples[3]{240.0, 250.0, 260.0};
const std::span<const double> view{samples};
```

`view.size()` 为 `3`，`view` 借用这三个元素，并只允许通过它读取。这里使用接受整个数组的构造方式；若先把 `samples` 转成 `double*` 并只留下该指针，指针本身就不能提供同样的数量信息。

> [!PRACTICE]
> 需要拥有固定数量的元素时，可以用 [std::array](../01-fixed-size-sequences-and-array-objects.md) 表达完整的值；函数只需借用连续数据时，可以用 [std::span](../02-borrowing-contiguous-ranges-with-span.md) 同时传递访问位置与数量。接触内置数组或指针接口时，先确认长度在哪个环节仍然可知，避免在形参方括号中写一个数字就把它当作保证。

## 参考资料

- [C++23 工作草案：数组类型与元素组成](https://timsong-cpp.github.io/cppwp/n4950/dcl.array)
- [C++23 工作草案：聚合初始化中的数组元素](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：默认初始化与值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：数组到指针转换](https://timsong-cpp.github.io/cppwp/n4950/conv.array)
- [C++23 工作草案：函数形参类型调整](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：数组成员的默认复制](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：从数组构造 span](https://timsong-cpp.github.io/cppwp/n4950/span.cons)
