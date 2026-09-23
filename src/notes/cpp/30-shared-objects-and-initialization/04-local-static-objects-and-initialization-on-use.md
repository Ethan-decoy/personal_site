---
title: 局部静态对象与按需初始化（Local Static Objects and Initialization on Use）
date: 2026-09-22
order: 4
---

# 局部静态对象与按需初始化（Local Static Objects and Initialization on Use）

多个调用需要沿用同一份状态，并不意味着必须把变量名称放到命名空间作用域。也可以让一个函数负责访问这份状态，并在真正需要它时完成初始化。

这里需要分清两件事：**名称只在函数内部可见，不代表对象必须在函数返回时销毁；对象能够跨调用保留，也不代表每次调用都重新执行初始化。**

## 局部名称也可以对应长期保留的对象

局部静态对象（local static object）是在块作用域内使用 `static` 声明、具有静态存储期的对象。下面的完整程序用它记录某个操作被调用了多少次：

```cpp
#include <iostream>

int record_inspection() {
    static int count{};
    ++count;
    return count;
}

int main() {
    std::cout << record_inspection() << '\n';
    std::cout << record_inspection() << '\n';
}
```

输出为：

```text
1
2
```

`count` 的名称只能在相应块作用域内使用，但它的存储期是静态存储期，函数返回不会结束这个对象的生命周期。第二次调用继续修改同一个对象，所以从 `1` 增加到 `2`。

如果仅删除 `static`，`count` 就成为自动存储期对象：每次调用各自创建、初始化并销毁一个对象，两次输出都会是 `1`。区别来自对象的存储期，而不是名称是否写在函数里。

这里的 `static` 作用于局部变量声明。它不表示“函数只执行一次”：两次调用都执行了 `++count` 和 `return count`；也不能直接套用命名空间作用域 `static` 函数所表达的[内部链接](../29-headers-and-multi-file-programs/05-internal-linkage-and-private-helpers.md#命名空间作用域的-static-函数也具有内部链接)。

`count{}` 的初始化可以在静态初始化阶段完成。**“第一次执行到声明才初始化”准确描述的是局部静态对象的动态初始化，不能无条件套到所有局部静态对象上。**

## 需要动态初始化时在第一次经过声明时完成

有些共享数据需要调用函数才能取得。如果把它放在局部静态对象中，其动态初始化在执行第一次经过声明时进行。只有初始化正常完成，才会把对象视为已经初始化；后续经过同一声明时，直接使用已有对象。

下面是另一个独立完整程序。`load_pressure_settings` 模拟取得默认压力设置：第一次故意抛出异常，第二次成功。`attempts` 与输出用于观察初始化尝试次数，不涉及实际文件读取；假定演示中的输出操作正常完成。

```cpp
#include <iostream>

struct configuration_error {};

struct pressure_settings {
    int target_kpa;

    ~pressure_settings() {
        std::cout << "settings destroyed\n";
    }
};

pressure_settings load_pressure_settings() {
    static int attempts{};
    ++attempts;
    std::cout << "load " << attempts << '\n';

    if (attempts == 1) {
        throw configuration_error{};
    }

    return pressure_settings{240};
}

const pressure_settings& default_pressure_settings() {
    static const pressure_settings settings{load_pressure_settings()};
    return settings;
}

int main() {
    std::cout << "start\n";

    try {
        default_pressure_settings();
    } catch (const configuration_error&) {
        std::cout << "retry\n";
    }

    const pressure_settings& first{default_pressure_settings()};
    const pressure_settings& second{default_pressure_settings()};

    std::cout << first.target_kpa << '\n';
    std::cout << (&first == &second) << '\n';
}
```

输出为：

```text
start
load 1
retry
load 2
240
1
settings destroyed
```

首次调用 `default_pressure_settings` 时，执行到 `settings` 的声明，进入 `load_pressure_settings`。异常使这次初始化失败，函数没有执行到 `return settings`，因此也没有向调用者提供一个尚未初始化完成对象的引用。

`catch` 处理失败后，程序继续执行。初始化 `first` 时再次调用访问函数，执行又经过 `settings` 的声明，于是重新尝试初始化。这一次取得 `240`，初始化正常完成。

初始化 `second` 时，`settings` 已经建立，不再调用 `load_pressure_settings`。两次成功返回的引用指定同一个对象，所以地址比较输出 `1`。

这也给跨文件组织提供了一种接口：在头文件中提供 `pressure_settings` 的类型定义与访问函数声明，把访问函数的唯一普通定义放在一个 `.cpp` 中。各处调用同一个函数，就通过它访问同一个局部静态对象；调用者不需要直接找到内部变量名 `settings`。

## 初始化失败会重试，但不会回滚其他状态

`settings` 初始化失败，并不等于整个调用过程从未发生。第一次尝试已经把 `attempts` 改成 `1`，也已经输出 `load 1`；异常传播没有撤销这些副作用。下一次尝试看到计数已是 `1`，才会增加到 `2` 并成功。

如果被初始化的是具有类类型成员的对象，构造过程中已经完成初始化的成员仍按[构造失败的清理规则](../18-exception-propagation-and-failure-state/03-construction-failure-and-member-cleanup.md#对象尚未构造完成成员也可能需要清理)销毁。尚未构造完成的完整对象，不会调用自身的析构函数。`static` 不会改变这条边界。

因此，“只初始化一次”应理解为**成功完成后不再重复初始化**，不应理解为初始化函数最多调用一次。初始化可能失败多次；由函数执行的文件写入、计数修改等外部动作，也不会自动变成可以安全重复的操作。

> [!WARNING]
> 如果初始化过程又直接或间接调用同一个访问函数，重新进入正在初始化的那条局部静态声明，行为未定义。它不是一次普通重试：重试发生在上次初始化已经因异常退出之后，递归重入发生在上次初始化仍未结束时。

线程（thread）是程序中的一条执行流程。若一个线程正在执行这项动态初始化，另一个线程也到达同一条声明，后者需要等待初始化完成。这个保证只针对初始化，不会自动保护对象后续的共享修改；例如开头的 `++count`，不能仅因 `count` 是局部静态对象，就认为多个线程可以同时安全地执行它。

## 返回引用依赖对象寿命，不依赖名称所在位置

`default_pressure_settings` 返回 `const pressure_settings&`，调用者借用已有设置，不复制一份对象。`const` 限制通过该引用修改设置；对象能够在函数返回后继续存在，则来自静态存储期及其生命周期规则。

这与[返回即将销毁对象的引用](../08-object-identity-and-lvalue-references/06-reference-returns-and-lifetime-boundaries.md#不能返回即将销毁对象的引用)不同。判断引用返回是否有效，应该检查目标是否覆盖使用期间，而不是只看变量声明是否写在函数体内。

在本例从 `main` 正常返回的结束路径上，已经构造完成的 `settings` 会被销毁，所以最后出现 `settings destroyed`。它不是在访问函数返回时销毁，也不是因为 `first` 或 `second` 这样的借用离开作用域而销毁。如果始终没有完成这次构造，就没有对应完整对象的析构。

按需初始化也没有取消程序结束时的依赖问题。某个其他静态对象的析构如果还要访问这份设置，必须保证设置尚未销毁。在其他静态对象的析构期间，若执行再次经过一个已经销毁的局部静态对象的定义，行为未定义，不会把对象重新建立；先前保存的引用也不能继续用于访问已销毁的对象。异常终止等路径也不能直接套用正常结束时的清理保证。

> [!IMPORTANT]
> 局部静态对象把名称范围留在函数内部，把成功初始化后的对象保留在多次调用之间。动态初始化由首次实际到达声明触发；初始化失败可以再次尝试，对象销毁后则不能用“再次调用”恢复它。

## 是否共享状态仍然是接口选择

按需初始化适合确实需要程序范围内共用、初始化较晚才有意义，而且生命周期与结束顺序都明确的数据。访问函数让调用者取得已建立的对象，也避免调用处直接操作初始化过程。

但它仍然引入共享状态。把变量移进函数，并不会让不同调用者自动得到独立实例，也不会让依赖关系出现在参数列表中。如果两个检修任务应当具有不同设置，或一次测试需要替换设置，就不能仅靠这个无参数访问函数表达这种区别。

这时可以由 `main` 或更外层对象持有设置，再把 `const pressure_settings&` 传给需要读取它的操作。对象何时建立、由谁使用、何时销毁，都可以沿普通调用和对象组合关系检查，不需要依赖隐藏的共享实例。

> [!PRACTICE]
> 先判断数据应当属于一次任务、某个拥有者，还是整个程序。显式持有并传递引用适合需要独立实例或替换依赖的接口；局部静态对象适合共享身份本身就是需求的情况。选择依据是身份、初始化时机与生命周期关系，而不是仅仅减少参数。

## 参考资料

- [C++23 工作草案：局部静态对象的初始化与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++23 工作草案：静态存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.static)
- [C++23 工作草案：线程的定义](https://timsong-cpp.github.io/cppwp/n4950/intro.multithread#general-1)
- [C++23 工作草案：程序结束与静态对象销毁](https://timsong-cpp.github.io/cppwp/n4950/basic.start.term)
- [C++23 工作草案：构造失败时的对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
