---
title: 模板实例化与操作要求（Template Instantiation and Operation Requirements）
date: 2026-09-23
order: 4
---

# 模板实例化与操作要求（Template Instantiation and Operation Requirements）

推导出 `T`，只回答了“这次调用使用哪个类型”。函数体中的比较、成员访问和结果构造能否用于该类型，还要在需要相应定义时通过模板实例化（template instantiation）检查。

一个模板可以用于 `int`，却不能用于某个自定义类型。失败的原因通常不是这个类型不够“通用”，而是函数体要求的一项具体操作没有成立。

## 特化按类型形成，函数体按具体类型检查

下面的 `larger` 通过只读引用接收两个输入，返回其中较大的一个的独立副本。它是可以放在源文件命名空间作用域的完整函数模板定义：

```cpp
template <typename T> T larger(const T& first, const T& second) {
    if (first < second) {
        return second;
    }

    return first;
}
```

确定模板实参后，由模板形成的具体函数称为函数模板特化（function template specialization）。这里的“特化”指同一份模板在具体模板实参下形成的函数，不要求另外手写一份函数体。

| 模板实参 | 实际形参类型 | 返回类型 |
| --- | --- | --- |
| `T = int` | 两个 `const int&` | `int` |
| `T = double` | 两个 `const double&` | `double` |

`larger(3, 8)` 和 `larger(5, 2)` 使用同一个 `int` 特化。实参的**数值**不同，不会因此形成两份不同的特化；比较哪一个更大，仍由每次调用中的值决定。

在这里的普通调用中，需要使用具体函数定义时，相应函数体会被隐式实例化（implicit instantiation）。编译器把 `T` 带入形参、返回类型和依赖它的表达式，核对这个具体函数是否合法。这是程序能够执行之前必须成立的语义条件，不是在运行时先尝试比较，失败了再更换类型。

实例化说明语言怎样确定具体函数的含义，也不保证最终可执行文件一定为每个特化保留一段独立的机器码；内联等优化仍可改变产物形式。

## 结构体不会自动获得小于比较

以下完整程序刻意保留错误。`reading` 只有一个整数成员，没有提供两个读数之间的小于比较：

```cpp
#include <iostream>

template <typename T> T larger(const T& first, const T& second) {
    if (first < second) {
        return second;
    }

    return first;
}

namespace workshop {
struct reading {
    int pressure_kpa;
};
} // namespace workshop

int main() {
    const workshop::reading first{220};
    const workshop::reading second{240};

    const workshop::reading selected{larger(first, second)};
    std::cout << selected.pressure_kpa << '\n';
}
```

两个实参都是 `workshop::reading`，因此 `T` 的推导没有冲突，引用也可以正常绑定。实例化 `larger<workshop::reading>` 时，`first < second` 却找不到适用的比较操作。

**成员能够比较，不意味着包含它的整个结构体会自动采用同一种比较。** 语言也不会猜测应按 `pressure_kpa`、其他成员，还是某种综合规则判断两个对象的先后。

可以为这个类型提供[非成员运算符函数](../13-operator-overloading-and-expression-semantics/02-member-and-non-member-operator-functions.md#非成员形式显式接收两个操作数)。在上面 `workshop` 命名空间中，紧接 `reading` 定义后加入：

```cpp
bool operator<(const reading& first, const reading& second) {
    return first.pressure_kpa < second.pressure_kpa;
}
```

现在比较的含义明确了：按气压值排序。为观察完整结果，可以将程序写成：

```cpp
#include <iostream>

template <typename T> T larger(const T& first, const T& second) {
    if (first < second) {
        return second;
    }

    return first;
}

namespace workshop {
struct reading {
    int pressure_kpa;
};

bool operator<(const reading& first, const reading& second) {
    return first.pressure_kpa < second.pressure_kpa;
}
} // namespace workshop

int main() {
    const workshop::reading first{220};
    const workshop::reading second{240};

    const workshop::reading selected{larger(first, second)};
    std::cout << selected.pressure_kpa << '\n';
    std::cout << larger(3, 8) << '\n';
}
```

程序输出 `240` 和 `8`。同一份模板定义用于两种类型；前一项比较使用非成员 `operator<`，后一项使用整数的内建小于比较。

## 操作要求包括结果构造

这个 `larger` 对类型的要求不能简写成“支持 `<`”。沿着函数体，还能看到其他条件：

| 函数中的位置 | 对本例类型的要求 |
| --- | --- |
| `const T&` 形参 | 调用实参能够绑定到对应的只读引用；这里没有复制输入对象 |
| `if (first < second)` | 两个只读对象之间的 `<` 表达式成立，比较结果能够作为 `if` 条件 |
| `return second;` 与 `return first;` | 能从选中的 `const T` 左值建立一个 `T` 类型的结果 |
| 调用者持有结果 | 结果对象能够按通常的对象规则销毁 |

对本例的 `reading`，两条 `return` 都通过复制构造（copy construction）建立结果。它没有声明特殊的复制行为，整数成员也可复制，所以[隐式复制构造按成员建立新对象](../15-copying-class-objects-and-copyability/03-implicit-copy-operations-and-member-semantics.md#复制构造按成员初始化新对象)足以完成这一步。

如果一个类删除了复制构造，即使 `operator<` 完全合法，这种从 `const T` 左值复制结果的写法仍会失败。给模板换一个名字、显式写出模板实参，或期待编译器优化掉复制，都不能使一个本来不合法的结果构造成为合法操作。

这里也没有对输入进行默认构造或复制赋值，因此不应额外声称类型必须支持这些操作。**模板要求什么，取决于它实际使用了什么表达式和对象操作。**

如果改成返回 `const T&`，结果复制要求会改变，接口却随之变成借用，必须承担[返回引用的实参生命周期边界](./03-value-and-reference-parameters.md#返回引用把实参的生命周期带到调用者)。这是一项接口选择，不能只为绕过复制错误就忽略结果的有效期。

## 普通 if 不会隐藏不成立的操作

运行时未执行某条语句，与实例化时不检查这条语句，是不同的问题。先看一个完整的合法程序：`reading` 提供气压成员，`enabled` 决定本次调用是否输出它。

```cpp
#include <iostream>

namespace workshop {
struct reading {
    int pressure_kpa;
};
} // namespace workshop

template <typename T> void print_if_requested(const T& value, bool enabled) {
    if (enabled) {
        std::cout << value.pressure_kpa << '\n';
    }
}

int main() {
    const workshop::reading current{220};

    print_if_requested(current, false);
    print_if_requested(current, true);
}
```

程序只输出一行 `220`：第一次调用不输出，第二次调用读取并输出气压。两次调用都推导出 `T = workshop::reading`，`value.pressure_kpa` 对这个类型成立；`enabled` 只决定执行时是否进入分支。

现在保留结构体和函数模板定义，只把上面程序的 `main` 替换为以下错误对照：

```cpp
int main() {
    print_if_requested(220, false); // 错误：int 没有 pressure_kpa 成员
}
```

这次实际传入的是整数 `220`，因此推导出 `T = int`，`value` 的形参类型为 `const int&`。程序中虽然仍有 `workshop::reading` 的定义，这次调用却没有使用它。

调用需要实例化 `print_if_requested<int>` 的函数体。即使 `enabled` 的实参明确是 `false`，其中的 `value.pressure_kpa` 仍必须对 `const int` 成立，而整数没有这个成员，所以程序在编译时就失败了。

把条件直接写成 `if (false)` 也不能使这个特化合法。**普通条件分支决定合法程序运行时执行哪条路径，不会免除函数体中表达式的类型要求。**

## 名称查找并非全部推迟到调用处

依赖 `T` 的表达式，需要结合具体类型检查；不依赖模板形参的名字，则在定义处确定其绑定关系。下面的完整程序保留了两个不同作用域中的同名对象：

```cpp
#include <iostream>

const int offset{10};

template <typename T> T add_offset(T value) {
    return value + offset;
}

int main() {
    const int offset{100};

    std::cout << offset << '\n';
    std::cout << add_offset(3) << '\n';
}
```

程序输出 `100` 和 `13`。模板里的 `offset` 是非依赖名（non-dependent name）：它的查找不需要知道 `T`，在模板定义处绑定到全局对象。调用处的局部 `offset` 不会被带入函数体，替换已经确定的名字。

与此对应，`larger` 中 `first < second` 的操作数类型依赖 `T`。实例化为 `workshop::reading` 时，运算符查找可以借助实参依赖查找（argument-dependent lookup，ADL），在该类型关联的 `workshop` 命名空间找到比较函数。

这也解释了前面完整程序的声明顺序：`operator<` 写在 `larger` 的模板定义之后，但写在本例触发实例化的调用之前，并且属于类型关联的命名空间，因此能够参与查找。它承接了[将非成员操作放在类型所属命名空间](../28-namespaces-and-name-lookup/04-argument-dependent-lookup-and-non-member-interfaces.md#将非成员操作放在类型所属的命名空间)的接口组织方式。

这里不能概括为“实例化会重新搜索调用处所有可见函数”。定义处的查找仍有作用；对于这种依赖调用，ADL 提供的是由实参类型确定的额外查找路径。

## 定义本身仍然需要接受检查

模板不是未经解析、等调用时才拼接的文本。下面这个放在命名空间作用域的错误片段，缺失的分号与 `T` 的取值无关：

```cpp
template <typename T> T copy_value(T value) {
    return value // 错误：缺少分号。
}
```

编译器解析模板定义时就可以识别这个语法错误，无需先确定一个具体的 `T`。与它不同，`value.pressure_kpa` 对某些类型成立、对另一些类型不成立，必须在相关实例化中结合类型判断。

这不表示所有未实例化模板中的错误都由标准保证立即诊断。对于没有任何合法特化、又一直未被实例化等情形，标准存在不要求诊断的规则。这里需要保留的边界是：**定义必须是合法的模板；具体特化还必须满足代入类型后的操作要求。** “没有调用”不能作为模板定义本身正确的依据。

## 参考资料

- [C++23 工作草案：隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：模板名称解析](https://timsong-cpp.github.io/cppwp/n4950/temp.res.general)
- [C++23 工作草案：依赖调用的候选函数](https://timsong-cpp.github.io/cppwp/n4950/temp.dep.candidate)
- [C++23 工作草案：return 与结果初始化](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
