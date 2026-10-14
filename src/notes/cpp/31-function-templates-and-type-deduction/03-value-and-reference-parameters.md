---
title: 值与引用形参中的类型推导（Type Deduction for Value and Reference Parameters）
date: 2026-09-23
order: 3
---

# 值与引用形参中的类型推导（Type Deduction for Value and Reference Parameters）

同一个整数对象交给 `T value`、`T& value` 和 `const T& value`，得到的形参并不相同。函数模板实参推导（template argument deduction）需要结合形参的写法，先确定 `T`，再用它形成完整的形参类型。**`T` 是什么，与形参最终是值还是引用，是两个需要分开回答的问题。**

这里限定为普通 `int` 对象、引用和整数实参，集中说明三种形参如何决定复制、借用与可修改性。

## 按值形参修改自己的副本

先只看一次按值调用。`limit` 是只读整数，函数为什么还能递增 `value`？需要确定形参的实际类型，以及它指定哪个对象。

```cpp
#include <iostream>

template <typename T> void increment_copy(T value) {
    ++value;
    std::cout << value << '\n';
}

int main() {
    const int limit{20};
    increment_copy(limit);
    std::cout << limit << '\n';
}
```

输出为 `21`、`20`。对模式 `T value`，本次推导得到 `T = int`，代回后的形参类型也是 `int`。调用读取 `limit` 中的 `20`，用它初始化独立的形参对象 `value`。

`++value` 修改这个副本，所以函数内打印 `21`；调用者随后读取的仍是原对象 `limit`，其值保持 `20`。**能修改形参，不表示能修改实参对象；先辨认这是不是同一个对象。**

## 按值推导忽略实参的顶层 const

对 `T value`，本例中 `limit` 的类型是 `const int`。`const` 限定整数对象本身，属于顶层 const（top-level const）。按值推导忽略这一限定，得到 `T = int`，实际形参也是 `int`。

这与复制关系一致：`limit` 必须保持只读，函数自己的副本不必因此只读。忽略限定发生在推导新形参的类型时，没有移除原对象的 `const`。

## 引用模式保留绑定关系，T 不一定含有引用

现在另外设一个可修改的 `int count{10}`，与前面的只读 `limit` 比较引用模式。目标分别是一个可修改整数和一个只读整数，先确定 `T`，再代回完整形参。

对 `T& value`，形参模式已经写出了左值引用（lvalue reference）。普通整数左值提供被引用对象的类型：`count` 对应 `T = int`，`limit` 对应 `T = const int`。最后再将 `T` 放回 `T&`，分别得到 `int&` 和 `const int&`。

对 `const T& value`，模式已经要求只读访问。无论本例的实参是 `count` 还是 `limit`，都得到 `T = int`，实际形参则是 `const int&`。**推导出的 `T` 没有 `const`，不表示完整形参也没有 `const`。**

现在将三种已经确定的形参关系放进一个完整程序。先看按值的两个调用，再看引用形参是否保留原对象身份：

```cpp
#include <iostream>

template <typename T> void increment_copy(T value) {
    ++value;
    std::cout << value << '\n';
}

template <typename T> void increment_source(T& value) {
    ++value;
}

template <typename T> void print_value(const T& value) {
    std::cout << value << '\n';
}

int main() {
    int count{10};
    const int limit{20};
    int& alias{count};

    increment_copy(limit);
    std::cout << limit << '\n';

    increment_copy(alias);
    std::cout << count << '\n';

    increment_source(alias);
    print_value(count);
    print_value(limit);
    print_value(30);
}
```

程序输出：

```text
21
20
11
10
11
20
30
```

`increment_copy(limit)` 能修改自己的 `value`，却没有修改 `limit`。`increment_copy(alias)` 同样只修改副本；实参是一个引用变量的名字，并不会使按值形参变成引用。

`increment_source(alias)` 的形参绑定 `count`，所以调用后 `count` 变为 `11`。`print_value` 通过只读引用读取实参，它既能接收已有对象，也能在这次调用期间读取由 `30` 产生的临时对象。

`alias` 的声明类型是 `int&`，但使用它的名称表达式是在指定 `count`。推导面对的是这个实参表达式的类型及形参模式，并不会把变量声明中的 `&` 自动带给 `T`。因此：

- `increment_copy(count)` 得到 `T = int`；
- `increment_copy(limit)` 得到 `T = int`；
- `increment_copy(alias)` 也得到 `T = int`。

三项调用的实际形参都是独立的 `int` 对象。这里的规则是忽略**顶层**限定，不能概括为“按值会删除类型中的所有 `const`”。

把程序中的对象分别代入三种模式，可以得到下面的对照：

| 实参表达式 | 形参写作 `T value` | 形参写作 `T& value` | 形参写作 `const T& value` |
| --- | --- | --- | --- |
| `count`，指定可修改的 `int` | `T = int`；形参为 `int` | `T = int`；形参为 `int&` | `T = int`；形参为 `const int&` |
| `limit`，指定 `const int` | `T = int`；形参为 `int` | `T = const int`；形参为 `const int&` | `T = int`；形参为 `const int&` |
| `alias`，仍指定 `count` | `T = int`；形参为 `int` | `T = int`；形参为 `int&` | `T = int`；形参为 `const int&` |
| `30`，提供整数值 | `T = int`；形参为 `int` | 调用不成立：不能把 `int&` 绑定到该临时对象 | `T = int`；形参为 `const int&` |

表格只说明推导和形参绑定，**尚未保证函数体中的操作都能成立**。它也只针对表内的普通整数实参，不是在穷举所有类型的推导规则。

`const T&` 限制的是通过形参进行的访问。原对象如果本来可修改，调用者仍可经其他合法路径修改它；这延续了[只读引用不会改变原对象类型](../08-object-identity-and-lvalue-references/03-const-lvalue-references-and-access-constraints.md#受限访问不会改变原对象类型)的关系。

## T& 不自动保证函数体能够修改对象

在包含 `increment_source` 定义的完整程序中，将 `main` 替换为下面的错误示例：

```cpp
int main() {
    const int limit{20};
    increment_source(limit);
}
```

这次调用能够推导出 `T = const int`，`T&` 因而成为 `const int&`，绑定 `limit` 本身没有问题。失败发生在实例化函数体时：`++value` 试图修改一个只读整数，操作不成立。

如果一个 `T&` 形参的函数只读取 `value`，相同绑定可以合法使用。`T&` 没有预先承诺“`T` 一定不含 `const`”；实际修改能力必须结合推导结果和函数体判断。

作为另一种失败，将这次调用改为 `increment_source(30);`，调用在形参绑定阶段就不成立。这里还没有走到“函数体是否允许递增”的问题。

> [!IMPORTANT]
> 判断模板引用形参时，先确定 `T`，再写出完整形参类型，最后检查函数体使用的操作。`T&` 可能形成 `const int&`；`const T&` 中的 `T` 也可能只是 `int`。只看一个 `T` 或一个 `&` 都不足以判断可修改性。

## 返回引用把实参的生命周期带到调用者

只读引用形参可以避免为输入建立对象副本。若函数进一步返回 `const T&`，调用者得到的仍是对某个实参对象的借用（borrow），没有独立结果对象：

```cpp
#include <iostream>

template <typename T> const T& larger_ref(const T& first, const T& second) {
    if (first < second) {
        return second;
    }

    return first;
}

int main() {
    const int first{3};
    int second{8};

    const int& selected{larger_ref(first, second)};
    std::cout << selected << '\n';

    second = 9;
    std::cout << selected << '\n';

    const int saved{larger_ref(3, 8)};
    std::cout << saved << '\n';
}
```

程序输出 `8`、`9`、`8`。第一次调用选择 `second`，`selected` 保留它的身份；后来修改 `second`，经 `selected` 读到的值也改变。这与[引用返回保留已有对象身份](../08-object-identity-and-lvalue-references/06-reference-returns-and-lifetime-boundaries.md#引用返回保留已有对象身份)相同，模板没有建立另一套生命周期规则。

最后一项初始化也成立。`larger_ref(3, 8)` 的两个临时对象活到包含调用的完整表达式结束；`saved` 在这之前就已读取选中的值，建立了自己的 `int` 对象。

但把接收方也改成引用，关系就不同了。下面是放在同一个 `main` 中的危险对照片段，不应执行注释里的读取：

```cpp
const int& dangling{larger_ref(3, 8)};
// 上一行的完整表达式已经结束，两个临时对象都已销毁。
// std::cout << dangling << '\n'; // 若执行，读取悬空引用是未定义行为。
```

`dangling` 绑定的是函数返回的引用所指定的对象，不是直接绑定一个能随它延长生命周期的新结果。[生命周期延长不会沿引用关系传播](../08-object-identity-and-lvalue-references/04-temporary-objects-and-lifetime-extension.md#生命周期延长不会沿引用关系传播)，所以增加一个接收引用不能保住这两个临时对象。

> [!WARNING]
> `const T&` 能在调用期间安全读取临时实参，不等于函数可以返回一个可长期保存的引用。保存 `larger_ref` 的引用结果时，实际被选中的实参对象必须覆盖后续全部使用；模板推导成功不会提供这项保证。

引用形式是否值得使用，应同时看复制代价和接口关系。普通整数的复制成本低，按值输入和按值返回很直接；对于复制代价较高的对象，只读引用输入可以减少复制，而返回独立值仍能让调用者拥有结果。只有需要保留原对象身份、且调用者能够维持它的有效期时，引用返回才表达了合适的契约。

## 参考资料

- [C++23 工作草案：从函数调用推导模板实参](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.call)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：临时对象与引用形参的生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
