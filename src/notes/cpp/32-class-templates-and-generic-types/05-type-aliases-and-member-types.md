---
title: 类型别名与成员类型（Type Aliases and Member Types）
date: 2026-09-27
order: 5
---

# 类型别名与成员类型（Type Aliases and Member Types）

泛型函数接收整个容器类型时，往往还需要知道“这个容器保存什么类型的值”。把元素类型另传一次容易重复信息，也可能与容器本身不一致。类可以为相关类型提供一个公开名字，让使用方从类类型出发取得它。

这先需要区分两件事：给已有类型起另一个名字，与定义一种新的类型。

## using 为已有类型起别名

类型别名（type alias）是同一类型的另一个名字。`using 名字 = 类型;` 是别名声明（alias declaration），右侧写一个已经能够确定的类型，左侧引入今后可以用来命名它的名字。

下面是完整程序：

```cpp
#include <iostream>
#include <vector>

using pressure_samples = std::vector<int>;

void append_sample(std::vector<int>& samples, int value) {
    samples.push_back(value);
}

int main() {
    pressure_samples samples{220, 240};
    append_sample(samples, 230);

    std::cout << samples.size() << '\n';
}
```

程序输出 `3`。`samples` 的类型就是 `std::vector<int>`，所以可以直接绑定到 `append_sample` 的 `std::vector<int>&` 形参，函数修改的也是原来的容器。

**别名改变类型的写法，不改变类型身份。** `pressure_samples` 没有额外的数据成员、构造函数或转换步骤，也不能据此与 `std::vector<int>` 区分出两个函数重载。如果需要让“气压序列”和其他整数序列成为不同类型，需要定义自己的类来表达这种边界。

这里的 `using` 与[命名空间中的两种 using](../28-namespaces-and-name-lookup/03-local-using-and-name-lookup.md#用-using-声明引入一个名字)作用不同：`using std::vector;` 把已有名字引入当前作用域，`using namespace ...;` 扩大非限定查找的范围，`using pressure_samples = std::vector<int>;` 则为指定类型声明一个别名。不能只看见相同的关键字，就把它们当成同一种操作。

## 类把相关类型放进自己的接口

别名也可以声明在类内。此时它是类作用域中的成员类型名（member type name），通过类名与 `::` 访问。下面让 `reading<T>` 公开它所保存的值类型：

```cpp
#include <iostream>
#include <utility>

template <typename T> class reading {
  public:
    using value_type = T;

    explicit reading(T value) : stored{std::move(value)} {}

    T value() const {
        return stored;
    }

  private:
    T stored;
};

int main() {
    const reading<int> pressure{220};
    const reading<int>::value_type copy{pressure.value()};

    std::cout << copy << '\n';
}
```

程序输出 `220`。在 `reading<int>` 中，`value_type` 是 `int` 的别名；在 `reading<double>` 中，它是 `double` 的别名。

`value_type` 位于 `public` 区域，因此类外可以使用。它不是对象，不在每个 `reading` 对象内额外保存一份数据，也无需先创建 `reading` 对象才能写出 `reading<int>::value_type`。

这里用 `value_type` 表达“这个类关联的值类型”，是接口作者的命名选择。C++ 不会为每个类自动生成这个名字；没有声明它的类，就不能因为保存了某种数据而被当作具有 `value_type`。标准容器也会在自己的公开接口中明确提供这样的名字，例如：

| 类类型 | 它公开的值类型 |
| --- | --- |
| `std::vector<int>` | `std::vector<int>::value_type` 是 `int` |
| `std::array<double, 3>` | `std::array<double, 3>::value_type` 是 `double` |
| 当前的 `reading<int>` | `reading<int>::value_type` 是 `int` |

这些类的结构、模板参数数量和操作可以不同。成员类型名只让外部代码按各自公开的接口取得关联类型，并不使它们获得相同的成员函数。

## 函数模板通过容器取得元素类型

如果只想立刻复制一个已有元素，`auto` 通常已经足够。显式成员类型名则能在还没有具体元素表达式时命名类型，也能让泛型代码明确写出“使用这个容器规定的值类型”。

下面的完整程序按值复制并输出容器中的首元素。函数先处理空容器，保证不访问不存在的元素：

```cpp
#include <array>
#include <iostream>
#include <vector>

template <typename Container> void print_first_copy(const Container& values) {
    if (values.empty()) {
        std::cout << "empty\n";
        return;
    }

    const typename Container::value_type first{values[0]};
    std::cout << first << '\n';
}

int main() {
    const std::vector<int> pressures{220, 240};
    const std::array<double, 2> temperatures{21.5, 22.0};
    const std::vector<int> empty{};

    print_first_copy(pressures);
    print_first_copy(temperatures);
    print_first_copy(empty);
}
```

输出为：

```text
220
21.5
empty
```

`Container` 分别由实参推导为 `std::vector<int>` 和 `std::array<double, 2>`。函数无须分别列出容器的全部模板参数，就能通过 `Container::value_type` 取得 `int` 或 `double`，并建立一份局部副本。

在这个局部变量声明中，`Container::value_type` 依赖尚未确定的模板形参。解析函数模板时，编译器不能仅凭名字 `value_type` 就认定它一定表示类型。因此这里在前面写 `typename`，明确要求把这个限定名解释为类型；`const` 再把局部副本声明为只读对象。

`template <typename Container>` 中的 `typename` 用来声明类型模板形参；函数体中 `typename Container::value_type` 的 `typename` 则用于标明依赖名是类型。两处关键字相同，承担的语法角色不同。

> [!IMPORTANT]
> 这里需要 `typename` 的是函数体内尚未被确定为类型的 `Container::value_type`。不能扩大成“所有依赖名之前都必须加 `typename`”：`values[0]` 是下标访问，`Container` 自己已经是类型形参，而 `reading<int>::value_type` 的类类型也已明确。

`typename` 不会创建类型，也不会改变成员的访问权限。实例化时仍必须在具体 `Container` 中找到可访问的类型成员 `value_type`；若传入的类没有这个成员，或同名成员实际是一个值，当前声明仍然不成立。

## 有成员类型名，还要满足实际使用的操作

`print_first_copy` 对输入的要求来自整个函数体，不能缩写成“存在 `value_type`”：

- 对只读容器调用 `empty()`，结果能够作为 `if` 条件。
- 通过 `values[0]` 取得非空只读容器的首元素，并能从该元素建立一个 `value_type` 副本。
- 该副本能够通过 `std::cout` 输出。

当前的 `reading<int>` 虽然公开了 `value_type`，却没有 `empty()` 和下标访问接口，所以不能作为这个函数的实参。关联类型名让泛型代码能够表达要求，不会自动补齐其余接口。

空容器的分支解决的是运行时的元素访问边界。即使这次实参恰好为空，相应函数特化中的复制和输出表达式仍必须合法；普通 `if` 不会消除[实例化时的操作要求](../31-function-templates-and-type-deduction/04-instantiation-and-operation-requirements.md#普通-if-不会隐藏不成立的操作)。

## 参考资料

- [C++23 工作草案：别名声明与类型身份](https://timsong-cpp.github.io/cppwp/n4950/dcl.typedef)
- [C++23 工作草案：依赖类型名与 typename](https://timsong-cpp.github.io/cppwp/n4950/temp.res.general)
- [C++23 工作草案：vector 的公开类型与成员](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：array 的公开类型与成员](https://timsong-cpp.github.io/cppwp/n4950/array.overview)
