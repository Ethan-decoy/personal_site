---
title: 构造函数与成员初始化（Constructors and Member Initialization）
date: 2026-08-29
order: 4
---

# 构造函数与成员初始化（Constructors and Member Initialization）

上一节的计数器先取得默认计数 `0`，再通过公开操作改变计数。有时，对象创建完成时就应当记录调用者提供的数量：例如，一个计数器从 `3` 开始，另一个从 `8` 开始。

构造函数（constructor）在类对象的初始化过程中建立相应的成员初值。下面是独立的完整程序，与上一节的 `counter` 定义分开使用。这里的正常示例使用非负初值，构造函数只接收并保存给定整数，尚未检查输入范围：

```cpp
#include <iostream>

class counter {
  public:
    counter(const int initial_value) : stored_value{initial_value} {}

    int value() const {
        return stored_value;
    }

  private:
    int stored_value;
};

int main() {
    const counter first{3};
    const counter second{8};

    std::cout << first.value() << ' ' << second.value() << '\n';
}
```

程序输出 `3 8`。两次创建使用同一项构造函数定义，各自取得自己的初始计数。

## 创建对象时调用构造函数

`counter(const int initial_value)` 是构造函数的特殊声明形式：在通常出现函数名的位置写出类名，不写返回类型。`initial_value` 是按值接收初始计数的形参。

冒号后的 `stored_value{initial_value}` 属于成员初始化列表（member initializer list），直接初始化当前对象的 `stored_value` 成员；最后的 `{}` 是空函数体。空函数体并不表示成员没有取得初值。

两次创建中的对应关系是：

| 对象定义 | 构造形参 `initial_value` 的值 | 新对象的成员初值 |
| --- | ---: | --- |
| `const counter first{3};` | `3` | `first` 中的 `stored_value` 为 `3` |
| `const counter second{8};` | `8` | `second` 中的 `stored_value` 为 `8` |

> [!IMPORTANT] 构造函数参与建立对象的初始状态
> **调用构造函数时，实参先初始化相应形参；当前对象的成员再按成员初始化规则取得初态。**成员初始化器可以使用形参为成员提供初值。构造函数没有普通函数那样的返回值，对象的初始化也不是对已有对象赋值。

花括号的外观相同，不代表都按成员位置接收初值。下表同时沿用第九章只含 `x`、`y` 两个整数成员的 [`position` 定义及其复制规则](../09-structures-and-object-composition/04-copying-and-assigning-struct-objects.md#用已有对象初始化新对象)，只比较列出的几种形式：

| 写法 | 此处怎样建立对象初态 |
| --- | --- |
| `position point{20, 10};` | 聚合初始化：两项分别对应 `x`、`y` |
| `position copy{point};` | 从同类型的已有对象初始化整个新对象，形成副本 |
| `counter first{3};` | 选择本例可接受一个整数的构造函数，由成员初始化器建立计数 |

`position` 是聚合类型，也不能把它的每一种花括号初始化都解释为逐项填写成员。本例的 `counter` 具有用户声明的构造函数，不属于聚合类型。

## 成员初始化列表直接初始化成员

开篇构造函数中的 `stored_value{initial_value}` 直接为成员提供初值。若只把这个构造函数替换成下面的版本，保留开篇没有默认成员初始化器的 `int stored_value;`，就改成了在函数体中赋值：

```cpp
counter(const int initial_value) {
    stored_value = initial_value;
}
```

仍在 `main` 中创建自动存储期对象，并以 `3` 为实参。两种版本的构造过程不同：

| 构造版本 | 刚进入函数体时的 `stored_value` | 函数体执行的操作 | 构造结束后的值 |
| --- | --- | --- | ---: |
| 开篇的成员初始化列表版本 | 已经初始化为 `3` | 空函数体 | `3` |
| 上面的函数体赋值版本 | 默认初始化没有给这个整数设置确定值 | 赋值为 `3` | `3` |

赋值版本本身合法：它在读取成员之前先写入了 `3`，两个版本最终也得到相同的计数。相同结果并不意味着初始化与赋值是同一项操作。

> [!IMPORTANT] 成员初始化先于构造函数体
> **成员子对象先按各自的规则初始化，随后才执行构造函数体。**成员初始化器在建立成员初态时起作用；函数体中的普通赋值修改已经存在的成员。没有显式提供初值，也不能仅凭函数体即将赋值，就认为成员此前已经保存 `0`。

> [!WARNING] const 成员不能等到函数体中再赋初值
> 如果在这组对照中把成员声明单独改成 `const int stored_value;`，开篇的成员初始化列表版本仍能为它提供初值；函数体赋值版本则会编译失败。这个 `const int` 成员既没有默认成员初始化器，也没有在成员初始化列表中取得初值，之后也不允许对它赋值。
>
> 这组 `const` 成员对照单独使用；后面的完整程序各自给出新的类定义。

## 默认成员初始化器仍然参与选择

同一种类型可以既接受调用者给出的计数，也提供从 `0` 开始的创建方式。下面是另一份独立的完整程序，替换前面的所有 `counter` 示例：

```cpp
#include <iostream>

class counter {
  public:
    counter() {}

    counter(const int initial_value) : stored_value{initial_value} {}

    int value() const {
        return stored_value;
    }

  private:
    int stored_value{0};
};

int main() {
    const counter empty{};
    const counter started{8};

    std::cout << empty.value() << ' ' << started.value() << '\n';
}
```

这里两个构造函数的参数列表不同：不提供实参时选择 `counter()`，提供一个整数时选择接收 `initial_value` 的版本。允许调用者不提供实参的构造函数称为默认构造函数（default constructor），`counter()` 是其中一种形式；“默认”不表示它一定由编译器提供。

程序输出 `0 8`。`empty` 使用的构造函数没有在成员初始化列表中指定 `stored_value`，所以成员声明中的 `{0}` 提供初值。`started` 使用 `stored_value{initial_value}` 取得 `8`，不使用成员声明中的 `{0}`。

> [!IMPORTANT] 成员初值按当前构造路径选择
> 对本节这些构造函数中的普通数据成员，依次判断：
>
> 1. 成员初始化列表指定了该成员：使用这里的初始化器，忽略该成员的默认成员初始化器。
> 2. 列表没有指定该成员，但成员声明提供了默认成员初始化器：使用默认成员初始化器。
> 3. 两处都没有提供初始化器：对该成员执行默认初始化，结果还要根据成员类型及初始化语境判断。
>
> **成员不是先取得默认成员初值，再被列表中的值覆盖。**每个成员按本次构造路径选择初始化来源；函数体中若另有赋值，那是后续的操作。

## 默认构造函数何时由编译器提供

默认成员初始化器可以提供计数 `0`，并不要求作者为此手写一个空的默认构造函数。下面又是一份独立的完整程序，其中没有用户声明的构造函数：

```cpp
#include <iostream>

class counter {
  public:
    int value() const {
        return stored_value;
    }

  private:
    int stored_value{0};
};

int main() {
    const counter current{};
    std::cout << current.value() << '\n';
}
```

程序输出 `0`。这个类有私有数据成员，不是聚合类型；`current{}` 使用编译器隐式声明（implicitly declare）的默认构造函数，再由 `stored_value{0}` 提供成员初值。

> [!IMPORTANT] 默认构造入口与隐式声明条件
> **类中没有用户声明的构造函数时，编译器会隐式声明一个公开的无参数默认构造函数；该入口是否可用，仍取决于成员初始化能否成立。**用户声明（user-declared）指作者明确写出的构造函数声明，普通成员函数的声明不影响这项条件。
>
> 默认构造函数描述的是不提供实参也能调用的构造形式；由作者写出还是由编译器提供，需要另行判断。

例如，只把本节这版类的成员声明改成 `const int stored_value;`，去掉默认成员初始化器，空实参创建就会失败：隐式默认构造无法为这个 `const int` 成员提供所需初值。由编译器提供声明，不等于成员可以省去必要的初始化条件。

## 带参构造与空实参入口

编译器不会仅根据一个 `int` 数据成员，就自动生成接收初始计数的 `counter(int)`。本例这种接收业务初值的入口需要作者声明。

回到上一节那版没有用户声明构造函数、保留 `int stored_value{0};` 的完整程序，只在类的 `public` 部分加入下面这一项：

```cpp
counter(const int initial_value) : stored_value{initial_value} {}
```

下面两条对象定义分别放在 `main` 中考察，错误行作为独立的编译错误示例，不接入正常程序：

```cpp
const counter started{3}; // 正确：使用刚加入的带参构造
const counter empty{};    // 错误：当前没有可接受空实参的构造函数
```

第一项创建让 `stored_value` 直接取得 `3`，成员声明中的默认初值 `0` 不参与。第二项则找不到可调用的默认构造函数。

> [!WARNING] 成员有默认初值不等于保留空实参构造入口
> **在这版类中加入用户声明的带参构造后，编译器不再隐式声明无参数默认构造函数。**即使成员仍有 `{0}`，`counter empty{};` 也会因没有可接受空实参的构造函数而编译失败。成员初值的来源不能代替构造函数的调用资格。

如果 `0` 是合理默认状态，接口又需要支持两种创建方式，可以采用前面同时声明 `counter()` 和带参构造的版本。若创建时必须明确给出数量，则可以只提供带参入口。

## 初始化顺序由声明顺序决定

横向线段的右端点可以由左端点与长度确定，因此初始化右端点时，需要使用已经建立的左端点。下面是独立的完整程序：长度取非负的小整数，并保证左端点与长度相加的结果可以由 `int` 表示。

```cpp
#include <iostream>

class horizontal_span {
  public:
    horizontal_span(const int initial_left, const int length)
        : left{initial_left}, right{left + length} {}

    int left_endpoint() const {
        return left;
    }

    int right_endpoint() const {
        return right;
    }

  private:
    int left;
    int right;
};

int main() {
    const horizontal_span span{20, 10};
    std::cout << span.left_endpoint() << ' ' << span.right_endpoint() << '\n';
}
```

`left` 先声明，先取得 `20`；随后初始化 `right`，读取已建立的 `left` 并计算 `20 + 10`，取得 `30`。两个成员初始化完成后才进入空函数体，程序输出 `20 30`。

> [!IMPORTANT] 成员初始化按声明顺序执行
> **同一类中的成员子对象按它们在类定义中的声明顺序初始化，成员初始化列表的书写顺序不改变真实先后。**初始化器读取另一个成员时，需要确保该成员在此之前已经取得可读取的有效值。

仍以 `main` 中的 `span{20, 10}` 为对象，分别考察以下变体；表中列表项省略了外层的构造函数声明：

| 成员声明顺序 | 成员初始化列表的书写顺序 | 实际初始化顺序与结果 |
| --- | --- | --- |
| `left`、`right` | `left{initial_left}, right{left + length}` | 先把 `left` 初始化为 `20`，再把 `right` 初始化为 `30` |
| `left`、`right` | `right{left + length}, left{initial_left}` | 仍先把 `left` 初始化为 `20`，再把 `right` 初始化为 `30` |
| `right`、`left` | `left{initial_left}, right{left + length}` | 先初始化 `right` 时读取尚未初始化的 `left`；未定义行为，不运行 |

第二行只反写列表，成员声明没变，所以结果仍是 `20 30`；编译器可能给出重排警告。正常代码应让列表顺序与成员声明顺序一致，使阅读顺序与真实执行顺序相符。

> [!WARNING] 调整列表顺序不能修复错误的成员依赖
> **如果本例把 `right` 声明在 `left` 之前，初始化 `right` 时就会先读取尚未初始化的 `left`。**对于这里在 `main` 内创建的自动存储期对象，这会在 C++23 中产生未定义行为；将列表写成 `left{...}, right{...}` 不能改变真实顺序，也不能修复这次读取。
>
> 需要调整成员声明或初始化依赖，让被读取的成员先建立有效值。这类错误不要求编译器给出诊断，不能依靠某次运行结果证明它正确。

本篇的计数器构造示例尚未验证非负约定：传入 `-1` 仍会得到保存 `-1` 的对象。构造函数参与建立初态，不会自动审查业务条件；要持续保持有效状态，还须由创建与修改接口共同维护约束，见[封装与类不变式](05-encapsulation-and-class-invariants.md#初始化建立第一个有效状态)。

## 参考资料

- [C++23 工作草案：构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.ctor)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：默认构造函数的隐式声明与可用条件](https://timsong-cpp.github.io/cppwp/n4950/class.default.ctor)
- [C++23 工作草案：基类与成员初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++ Core Guidelines：构造函数应建立类不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-complete)
