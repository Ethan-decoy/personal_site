---
title: 按值返回与结果对象（Return by Value and Result Objects）
date: 2026-09-12
order: 6
---

# 按值返回与结果对象（Return by Value and Result Objects）

登记对象在构造时增加活动计数，在销毁时解除登记。函数按值交付一项新登记时，哪一个对象负责最后解除它？无论用返回结果初始化新变量，还是用它给已有对象赋值，都要先认出这次调用的结果对象。本文以 C++23 为准。

## 返回表达式可以直接构造接收对象

按值返回类类型的函数调用是纯右值。纯右值的结果对象（result object）是由这个表达式初始化的对象。

> [!IMPORTANT] 同类纯右值直接初始化结果对象
> **返回表达式是与返回类型同类的纯右值时，它直接初始化函数调用的结果对象。** 在 `T result = make();` 中，若 `make()` 按值返回同类结果，`result` 就是这次调用的结果对象。
>
> 类型比较忽略顶层 `const` 和 `volatile`。这条初始化路径不要求可用的复制构造或移动构造。

下面的 `registration` 显式删除了复制构造和移动构造。用它来验证直接建立结果时需要哪一项构造操作。

```cpp
#include <iostream>

class registration {
  public:
    explicit registration(int& count) : counter{&count} {
        ++(*counter);
    }

    registration(const registration&) = delete;
    registration(registration&&) = delete;

    ~registration() {
        --(*counter);
    }

  private:
    int* counter;
};

registration begin_registration(int& count) {
    return registration{count};
}

int main() {
    int count{0};

    {
        const registration entry = begin_registration(count);
        std::cout << count << '\n';
    }

    std::cout << count << '\n';
}
```

`registration{count}` 和 `begin_registration(count)` 都是 `registration` 类型的纯右值。目标是 `const registration`，仍满足同类条件，因此 `registration(int&)` 直接初始化调用者的 `entry`。

函数返回后，仍然由 `entry` 持有这项登记，第一行输出 `1`。`entry` 离开内层作用域时销毁，第二行输出 `0`。`counter` 借用外层的 `count`，该计数对象必须活到 `entry` 解除登记之后。

## 初始化形式不等于实际复制

`return` 用返回表达式对调用的结果对象做复制初始化（copy-initialization）。`main` 中带 `=` 的声明也采用复制初始化，目标 `entry` 正在建立。两处初始化都使用同类纯右值，整个过程只执行一次接收 `int&` 的构造函数。

将第一个程序中 `entry` 的声明换成下面的圆括号直接初始化，程序同样输出 `1` 和 `0`。

```cpp
const registration entry(begin_registration(count));
```

自 C++17 起，这两种接收写法都能由同类纯右值直接构造目标对象。这项规则常称“保证的复制省略（guaranteed copy elision）”。

如果写成 `const registration entry{begin_registration(count)};`，接收变量采用列表初始化。C++23 对 `registration` 这样的非聚合类仍须按列表规则考虑构造函数，本例会选中已删除的移动构造。这个规则缺口有编译器实现分歧，见 [CWG 2311](https://cplusplus.github.io/CWG/issues/2311.html)。

## 赋值面对的是已经存在的目标

下面是独立的采样序列程序。两次调用 `make_samples()` 都按值返回三个读数。第一次调用初始化新变量，第二次调用给已有序列提供赋值来源。

```cpp
#include <iostream>
#include <vector>

std::vector<double> make_samples() {
    return std::vector<double>{240.0, 245.0, 250.0};
}

int main() {
    const std::vector<double> created = make_samples();

    std::vector<double> existing{200.0};
    existing = make_samples();

    std::cout << created.size() << ' ' << existing[0] << '\n';
}
```

| 调用位置 | 调用的结果对象 | 接收方的操作 |
| --- | --- | --- |
| `const std::vector<double> created = make_samples();` | `created` | 直接初始化 `created` |
| `existing = make_samples();` | 物化的临时序列 | 移动赋值的右值引用形参绑定到临时序列，随后更新 `existing` |

两种用法都要建立结果序列的三个元素。赋值还会替换 `existing` 原有的元素，同时保留它的对象身份。临时序列在包含赋值的完整表达式末尾销毁，本例就是该语句结束时。程序输出 `3 240`，分别是新建序列的长度和更新后序列的首个读数。

回到第一个程序，将 `entry` 的声明替换为下面两行，可以单独检查赋值要求。这里让 `entry` 可修改，第一行直接初始化它。

```cpp
registration entry = begin_registration(count);
entry = begin_registration(count);
```

`registration` 自行声明了移动构造，因此编译器不隐式声明移动赋值，隐式声明的复制赋值也被定义为删除。第二行选中已删除的复制赋值，编译失败。相关条件见[移动操作的隐式声明](05-generation-and-selection-of-move-operations.md#什么时候会隐式声明移动操作)和[显式移动声明对复制的影响](05-generation-and-selection-of-move-operations.md#显式要求默认实现)。

## 直接构造仍有类型与生命周期边界

`return result;` 可以指定一个已有的局部对象。此时要按具名返回规则核对可用的构造路径。返回结果用于初始化另一种类型时，应按实际的类型和初始化形式检查转换与构造。具名返回见[返回局部对象与隐式移动](07-returning-local-objects.md#具名返回值优化允许合并对象身份)。

语言规则在返回处将结果对象的析构函数视为可能调用的函数。它必须在返回处可访问且未被删除，调用方销毁结果时也要满足这两个条件。

> [!PRACTICE] 直接按值交付新建的结果
> 函数负责创建新结果，且所需状态可以在返回表达式中建立时，直接返回同类纯右值。调用方也可以直接使用该按值结果初始化变量。函数内的普通局部对象会在函数退出时销毁，返回它的引用会让调用方得到悬垂引用。

另取第一个程序，在源文件开头加入 `#include <utility>`，再把 `entry` 的声明替换成下面这行。

```cpp
const registration entry = std::move(begin_registration(count));
```

`begin_registration(count)` 的纯右值结果先物化为临时对象，以便绑定到 `std::move` 的引用形参。`std::move(...)` 调用表达式是指代这个临时对象的将亡值。现在初始化 `entry` 的来源是将亡值，重载决议选中已删除的移动构造，该声明编译失败。

## 参考资料

- [C++23 工作草案：纯右值与结果对象](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：同类纯右值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init#general-16.6.1)
- [C++23 工作草案：返回结果的初始化与析构要求](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++23 工作草案：临时对象物化](https://timsong-cpp.github.io/cppwp/n4950/conv.rval)
- [C++23 工作草案：临时对象的销毁时机](https://timsong-cpp.github.io/cppwp/n4950/class.temporary#4)
