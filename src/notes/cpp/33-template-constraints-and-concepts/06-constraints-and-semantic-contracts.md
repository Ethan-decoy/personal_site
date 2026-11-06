---
title: 约束检查与语义契约（Constraint Checking and Semantic Contracts）
date: 2026-09-27
order: 6
---

# 约束检查与语义契约（Constraint Checking and Semantic Contracts）

概念（concept）能把类型、表达式和转换关系的要求写入接口，并让约束参与候选选择。不过，“约束检查通过”与“这项操作符合全部使用契约”仍然是两件事。

编译器根据约束定义检查能够静态表达的条件；操作实际代表什么、函数体能否适用于所需实参，以及当前对象状态是否允许调用，还需要各自的依据。

## 可以调用，不代表比较关系正确

严格弱序（strict weak ordering）要求比较器在所处理的值域上形成一致的先后关系。[比较器的契约](../24-sorting-ordering-and-ordered-search/02-comparators-and-strict-weak-ordering.md#严格弱序让局部判断形成一致的次序)包括：自身不能排在自身之前，先后关系具有传递性，按两个方向都不在前定义的等价关系也具有传递性。

`<concepts>` 提供 `std::strict_weak_order<Compare, T, U>`。本例只使用 `T`、`U` 都为 `int` 的情况：编译期条件检查相应的比较调用是否成立、结果是否符合库的布尔测试要求；示例的返回类型直接使用 `bool`。

完整的语义契约还要求比较调用不修改比较器和实参，同样的输入产生同样的结果，输入对象没有改变时重复调用保持结果稳定，并在相关值域上建立上述严格弱序。

这些语义要求并没有全部编码成编译器能够自动证明的条件。下面的完整程序直接比较一个整数与它自己：

```cpp
#include <concepts>
#include <iostream>

struct less_equal {
    bool operator()(int left, int right) const {
        return left <= right;
    }
};

int main() {
    const less_equal compare{};
    const int value{240};

    std::cout << "concept = " << std::strict_weak_order<less_equal, int, int> << '\n';
    std::cout << "comp(x, x) = " << compare(value, value) << '\n';
}
```

输出为：

```text
concept = 1
comp(x, x) = 1
```

第一行说明概念的编译期约束为真：对象可以接收两个 `int`，结果也能按 `bool` 使用。第二行却已经推翻了严格弱序要求的非自反性（irreflexivity）：`240 <= 240` 为真，一个值被判定为排在自身之前。

标准库区分**满足（satisfy）概念的可检查约束**与**建模（model）该概念的完整要求**。本例通过了前者，却因比较关系错误而没有做到后者。把 `std::strict_weak_order` 写进函数的 requires 子句，同样不会让编译器自动证明比较结果之间的规律。

示例没有把这个比较器交给排序算法。单独计算 `240 <= 240` 是合法操作；但据此实现的比较器不满足排序需要的严格弱序契约，不能凭概念结果为真就认为它可以安全用于排序。

## 调用表达式成立，不等于函数体已经验证

约束检查与语义契约的差别之外，还要区分函数声明与函数定义。requires 表达式（requires-expression）检查某个调用是否成立，并不普遍要求把所调用的模板函数体一并实例化。

下面的完整程序保留 `pressure_source` 的定义，另用一个类模板把读取操作转交给成员。`read()` 显式声明返回 `double`：

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept pressure_source = requires(const T& value) {
    { value.read() } -> std::convertible_to<double>;
};

template <typename T> struct deferred_source {
    T stored;

    double read() const {
        return stored.read();
    }
};

int main() {
    std::cout << pressure_source<deferred_source<int>> << '\n';
}
```

程序输出 `1`。检查 `pressure_source<deferred_source<int>>` 时，编译器能从声明中知道这个类型具有可在只读对象上调用的 `read()`，调用结果为 `double`。本次检查不需要 `read()` 的定义，因此没有因为概念检查而实例化 `return stored.read();`。

现在只在上述 `main` 中加入以下语句：

```cpp
const deferred_source<int> source{240};
std::cout << source.read() << '\n'; // 错误：所需的 read() 定义中，int 没有 read()。
```

这次调用需要 `deferred_source<int>::read()` 的函数体。实例化之后，`stored` 的类型为 `int`，`stored.read()` 非法，程序编译失败。失败发生在所需的成员定义中；并不是概念先得到 `true`，运行到这里又重新算成了 `false`。

这一结果沿用[类实例化与成员定义分开处理](../32-class-templates-and-generic-types/03-class-instantiation-and-member-use.md#对象可以建立不代表每项成员操作都成立)的规则。`pressure_source` 检查的是它写出的调用表达式，没有自动复制被调用函数体中的所有内部要求。

> [!WARNING]
> 不能把本例概括成“约束检查绝不会涉及函数体”。本例明确给出了 `double` 返回类型；如果返回类型需要从函数体推导，检查调用所需的信息就可能使函数体实例化。准确边界是：一个调用表达式通过检查，不构成对任意模板实现的完整正确性证明。

## 概念名称和运行时状态都要有明确依据

自定义名称 `pressure_source` 说明作者打算把满足要求的类型用作压力来源，但这个名字本身不会增加检查。当前定义要求 `read()` 的结果满足 `std::convertible_to<double>`，没有编码压力单位、读数范围或传感器当前是否可用。

如果接口要求所有读数都以 kPa 表示，就需要在接口文档和实现中建立这项约定。不能因为概念名字包含 `pressure`，就把它没有声明的承诺归给所有满足约束的类型。标准库概念具有标准规定的语义要求，也仍需由提供类型或操作的实现来满足；这些要求不会因编译器无法全部自动证明而消失。

运行时前提（runtime precondition）则涉及具体调用时的对象状态。例如，[读取序列的下标 `0` 要求序列非空](../11-sequences-and-data-access/01-vectors-and-element-access.md#元素数量决定有效下标)，[访问视图描述的元素要求借用仍然有效](../20-fixed-size-sequences-and-contiguous-ranges/02-borrowing-contiguous-ranges-with-span.md#范围长度不能代替有效期)。同一种类型的两个对象可以处于不同状态；本章这些针对类型和表达式的约束，不会自动检查某个对象此刻的长度或目标的生命周期。

> [!IMPORTANT]
> 使用受约束接口时，分别判断它写出了哪些可检查条件、实现是否满足这些操作应有的语义，以及本次调用的对象状态是否符合前提。概念检查可以把不合适的类型挡在接口外，却不能替代函数定义、语义关系和运行时状态各自的正确性要求。

## 参考资料

- [C++23 工作草案：标准库概念的满足与建模](https://timsong-cpp.github.io/cppwp/n4950/res.on.requirements#1)
- [C++23 工作草案：严格弱序概念与关系条件](https://timsong-cpp.github.io/cppwp/n4950/concept.strictweakorder)
- [C++23 工作草案：可调用概念及其语义要求](https://timsong-cpp.github.io/cppwp/n4950/concepts.callable)
- [C++23 工作草案：相等性保持与稳定性](https://timsong-cpp.github.io/cppwp/n4950/concepts.equality)
- [C++23 工作草案：requires 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.req)
- [C++23 工作草案：成员与函数定义的隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：模板函数返回类型的推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto#12)
