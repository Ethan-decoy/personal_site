---
title: 移动操作的生成与选择（Generation and Selection of Move Operations）
date: 2026-09-05
order: 5
---

# 移动操作的生成与选择（Generation and Selection of Move Operations）

一个检查对象保存轮胎编号和一项校准登记。移动构造可以把已有登记交给新对象。对两个不同检查对象进行移动赋值时，目标还要处理原有登记。登记成员已经实现了这两种操作，外层类什么时候能直接复用？

> [!IMPORTANT] 从类声明判断实际调用
> **对一次同类型构造或赋值，依次判断有哪些声明、重载选中哪一项，以及选中的函数能否调用。**
>
> 1. 确认目标是新对象还是已有对象，再核对相应的构造或赋值声明。默认化后被定义为删除的移动操作会在重载决议中被忽略。
> 2. 根据来源表达式的值类别和 `const` 限定判断哪些候选可以绑定，再确定最佳候选。`std::move(source)` 提供将亡值，并保留来源的 `const` 限定。见[转换不会移除 const](02-std-move-and-expression-category-conversion.md#转换不会移除-const)。
> 3. 检查选中的函数是否被删除、在当前语境能否访问。调用成立后，再按实际操作判断源对象和目标对象的状态。

## 什么时候会隐式声明移动操作

类没有用户声明的复制构造、复制赋值、移动构造、移动赋值或析构函数时，编译器会隐式声明并默认化两个移动操作。普通带参构造函数不影响这两项声明。

用户声明包括写成 `= default` 或 `= delete` 的声明。自行声明上述任一特殊成员，都会抑制两个移动操作的隐式声明。例如，类 `T` 写出 `~T() = default` 后，需要哪一项移动操作，就显式声明哪一项。

默认化的移动操作还可能被定义为删除，移动构造与移动赋值要分别判断。`const int` 非静态数据成员可以用源对象的成员值初始化。有这样的成员时，默认化的移动赋值会被定义为删除，因为赋值需要更新已存在的目标成员。

## 默认移动把成员分别交给相应操作

示例沿用前两篇的 `registration`。它能把解除登记的责任交给目标，并让源进入空状态。对两个不同对象进行移动赋值时，目标原先有登记就先解除。见[登记的移动构造](03-move-construction-and-resource-transfer.md#让源对象能够处于无责任状态)和[登记的移动赋值](04-move-assignment-and-existing-resource-responsibility.md#结束旧责任再接收新责任)。

在前篇的程序中保留 `<iostream>`、`<utility>`、`registration` 及其移动赋值定义，把下面的 `inspection` 定义放在 `main` 之前。`inspection` 是没有基类的非联合类，它的默认移动操作按声明顺序处理 `tire_id` 和 `entry`。

```cpp
struct inspection {
    int tire_id;
    registration entry;

    inspection(const int id, int& count) : tire_id{id}, entry{count} {}
};
```

`inspection` 只声明了普通带参构造函数，因此隐式声明移动构造和移动赋值。`entry` 不能复制，隐式声明的复制构造和复制赋值都会被定义为删除。下列两个 `main` 分别替换前篇程序的 `main`，各自从新的登记状态开始。

### 用源对象构造新对象

```cpp
int main() {
    int count{0};
    inspection source{1, count};
    const inspection target{std::move(source)};

    std::cout << target.tire_id << ' ' << source.tire_id << '\n';
    std::cout << target.entry.is_active() << ' ' << source.entry.is_active() << '\n';
    std::cout << count << '\n';
}
```

默认移动构造使用源对象的对应成员来初始化目标成员。在这个例子中，两个来源成员都作为将亡值参与初始化。`target.tire_id` 取得编号 `1`，源编号仍为 `1`。`target.entry` 选中 `registration` 的移动构造并接手登记，源登记进入空状态。程序按目标、源的顺序输出编号 `1 1` 和活动状态 `1 0`，最后输出活动计数 `1`。

### 给已有对象赋值

目标先登记前轮，源登记后轮。两个计数位于内层作用域之外，存活到两个检查对象都销毁之后。

```cpp
int main() {
    int front_count{0};
    int rear_count{0};

    {
        inspection target{1, front_count};
        inspection source{2, rear_count};

        target = std::move(source);

        std::cout << target.tire_id << ' ' << source.tire_id << '\n';
        std::cout << target.entry.is_active() << ' ' << source.entry.is_active() << '\n';
        std::cout << front_count << ' ' << rear_count << '\n';
    }

    std::cout << front_count << ' ' << rear_count << '\n';
}
```

默认移动赋值先通过整数赋值把目标编号更新为 `2`，再调用 `entry` 的移动赋值。后者解除目标原有的前轮登记，接手后轮登记，并清空源的登记。前两行按目标、源的顺序输出 `2 2` 和 `1 0`。此时前轮与后轮的计数为 `0 1`，离开内层作用域后，目标析构并解除后轮登记，最后输出 `0 0`。

非联合类的默认移动会为类类型成员分别选择相应操作。如果某个成员没有移动候选，而它的复制操作能通过 `const` 左值引用接收将亡值，外层的默认移动可以复制这个成员。

> [!PRACTICE] 组合类型复用成员的交接操作
> 采用默认移动时，要确认逐成员处理之后，源和目标仍符合外层类的约定。`inspection` 允许空登记保留原编号，`entry` 自己负责交接。如果用默认移动从仍有登记的 `registration` 构造另一个对象，两个对象会持有同一个非空计数指针，各自析构时都会解除同一项登记。`registration` 因此需要自行实现交接。

## 显式要求默认实现

类因自行声明析构函数等原因失去隐式移动声明时，可以按需要显式默认化移动操作。要在 `inspection` 上对照这两种写法，可以把下面的声明添加到类定义的普通构造函数之后。

```cpp
inspection(inspection&&) = default;
inspection& operator=(inspection&&) = default;
```

对每个 `main`，隐式默认化和显式默认化的输出相同。显式默认化仍然按子对象的规则生成定义，必要操作被删除或不可访问时，默认化的操作可能被定义为删除。

自行声明移动构造或移动赋值还会使隐式声明的复制构造与复制赋值被定义为删除。类需要同时支持复制时，应显式声明相应的复制操作，并确认它的成员允许实现所需的复制语义。

## 构造函数的隐式声明规则对照

新增或修改构造函数时，可以按下表核对相应的声明规则。`T` 表示正在检查的类。

| 构造接口（常见形式） | 隐式声明与删除规则 |
| --- | --- |
| 默认构造 `T()` | 类没有任何用户声明的构造函数时，隐式声明 |
| 复制构造 `T(const T&)` | 没有用户声明的复制构造函数时，隐式声明。类自行声明了移动构造或移动赋值时，这项隐式复制构造被定义为删除 |
| 移动构造 `T(T&&)` | 没有用户声明的移动构造，且没有用户声明的复制构造、复制赋值、移动赋值或析构函数时，隐式声明 |
| 普通带参构造 `T(int)` | 由类作者按所需的参数提供构造接口 |

`inspection` 的带参构造函数由用户声明，所以类没有隐式默认构造函数。只写这个带参构造函数时，复制构造与移动构造依然满足各自的隐式声明条件。见[默认构造函数的生成条件](../10-class-interfaces-and-encapsulation/04-constructors-and-member-initialization.md#默认构造函数何时由编译器提供)。

## 没有移动操作，也可能接收右值

下面是独立的读数快照程序。`snapshot` 自行声明了复制构造，因而没有隐式移动构造。这里保留非 `const` 的 `source`，用来观察非 `const` 将亡值也能调用复制构造。

```cpp
#include <iostream>
#include <utility>

struct snapshot {
    int value;

    explicit snapshot(const int measured) : value{measured} {}

    snapshot(const snapshot&) = default;
};

int main() {
    snapshot source{240};
    const snapshot copy{std::move(source)};

    std::cout << source.value << ' ' << copy.value << '\n';
}
```

复制构造的 `const snapshot&` 可以绑定 `std::move(source)` 产生的将亡值。这次初始化选中复制构造，源和新快照各自保存同一读数，输出 `240 240`。

如果把 `std::move` 用在 `const T` 对象上，得到的将亡值也带有 `const`，无法绑定常见移动构造函数的 `T&&` 参数。当候选只有 `T(T&&)` 与 `T(const T&)` 时，初始化要由复制构造接收，复制构造不可用则初始化失败。

## 不存在与被删除的移动操作并不相同

对同类型的非 `const` 将亡值，常见的 `T(T&&)` 和 `T(const T&)` 都能绑定时，右值引用绑定使移动构造优先。排查调用结果时，还要根据类声明核对移动构造是否参与选择。

| 移动构造的情况 | 对初始化的影响 |
| --- | --- |
| 没有声明移动构造 | 可用的 `T(const T&)` 可以接收右值 |
| `T(T&&)` 可用 | 在这两个匹配的候选中选中移动构造 |
| 显式写成 `T(T&&) = delete` | 仍参与重载决议。选中它时初始化报错 |
| 默认化的移动构造被定义为删除 | 重载决议忽略它。可用的复制构造仍可能接收右值 |

如果在 `snapshot` 的复制构造声明之后添加 `snapshot(snapshot&&) = delete;`，初始化 `copy` 的那一行会选中已删除的移动构造，程序无法编译。

赋值同样要检查删除的原因。选中显式删除的移动赋值运算符时，赋值报错。默认化后被定义为删除的移动赋值运算符会在重载决议中被忽略。如果此时有能绑定该右值的可用复制赋值运算符，赋值仍可成立。

## 参考资料

- [C++23 工作草案：默认构造函数的隐式声明](https://timsong-cpp.github.io/cppwp/n4950/class.default.ctor#1)
- [C++23 工作草案：用户声明与显式默认化](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.default#5)
- [C++23 工作草案：复制与移动构造的声明、默认定义与删除](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制与移动赋值的声明、默认定义与删除](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：引用绑定的重载优先级](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
