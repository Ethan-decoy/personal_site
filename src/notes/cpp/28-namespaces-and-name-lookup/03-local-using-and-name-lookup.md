---
title: 局部引入与名称查找（Local Using and Name Lookup）
date: 2026-09-21
order: 3
---

# 局部引入与名称查找（Local Using and Name Lookup）

写出 `metrics::report(value)`，能直接说明要从哪个命名空间查找 `report`。如果一小段代码反复使用同一个名字，也可以把它引入局部作用域，省去重复的限定。但缩短写法之后，需要分清两件事：这个名字能找到哪些声明，以及找到函数后怎样选择重载。

本篇的函数调用只使用 `int`、`double` 等内建类型实参，集中讨论普通名称查找与重载决议的关系。

## 用 using 声明引入一个名字

`using metrics::report;` 是 **using 声明（using-declaration）**：把此处通过 `metrics::report` 查到的声明引入当前作用域，使后面的代码可以直接使用 `report`。

下面是完整程序：

```cpp
#include <iostream>

namespace metrics {
void report(int value) {
    std::cout << "int: " << value << '\n';
}

void report(double value) {
    std::cout << "double: " << value << '\n';
}
} // namespace metrics

int main() {
    using metrics::report;

    report(240);   // int: 240
    report(240.5); // double: 240.5
}
```

这里引入的是名字 `report` 对应的两个函数声明，而不是只挑选某一个参数类型。调用时仍然根据实参进行重载决议，分别选择 `report(int)` 和 `report(double)`。

**using 声明不复制函数，也不改变函数所属的命名空间。** 上面调用的仍然是 `metrics` 中的函数；`metrics::report(...)` 也依然可以使用。局部 using 声明提供的直接访问方式，只在它所在的作用域内、从该声明之后生效。

## 先查到名字，再选择重载

直接写 `report` 属于非限定名称（unqualified name），从使用位置进行非限定名称查找（unqualified name lookup）；写出 `metrics::report` 则通过限定名称查找（qualified name lookup），在指定的命名空间中寻找 `report`。

对于这里的普通非限定查找，编译器先在当前作用域查找名字；没有找到声明，才继续查找外层作用域。**查找在哪一层找到名字，并不由哪一个函数的形参更匹配决定。**

下面是另一份完整程序。全局作用域中的 `report` 接收 `int`，`metrics` 中的同名函数接收 `double`：

```cpp
#include <iostream>

void report(int value) {
    std::cout << "global int: " << value << '\n';
}

namespace metrics {
void report(double value) {
    std::cout << "metrics double: " << value << '\n';
}
} // namespace metrics

int main() {
    using metrics::report;

    report(240);   // metrics double: 240
    ::report(240); // global int: 240
}
```

第一处调用在 `main` 的作用域中找到 using 声明引入的 `metrics::report(double)`，因此不会继续向外收集全局的 `report(int)`。虽然全局版本与实参类型完全匹配，它也没有进入这次调用的候选集合。实际调用把 `240` 转换为 `double`，输出 `metrics double: 240`。

第二处调用用开头的 `::` 明确从全局命名空间查找，找到 `report(int)`，因此输出 `global int: 240`。

> [!IMPORTANT]
> 名称查找先决定能找到哪些声明，重载决议再在相应候选函数中比较调用条件。普通非限定查找找到同名声明后，不会因为参数不匹配或外层函数更合适，就继续向外寻找替代函数。

如果更近的作用域中找到的是同名整数对象，调用表达式也会因该对象不能像函数一样调用而出错，而不会自动改用外层的函数。

## using namespace 扩大查找范围

`using namespace metrics;` 是 **using 指令（using-directive）**。它指定参与查找的命名空间，不会像 using 声明那样在当前作用域中引入指定名称。

沿用上一节中全局 `report(int)` 与 `metrics::report(double)` 的程序，只把 `main` 中的 using 声明替换为 using 指令，其余声明不变：

```cpp
int main() {
    using namespace metrics;

    report(240);   // global int: 240
    ::report(240); // global int: 240
}
```

第一项调用现在也输出 `global int: 240`。using 指令本身没有在 `main` 的块作用域中引入 `report`，查找会继续向外进行。

**在非限定查找中，using 指令使目标命名空间中的名字，在同时包含该指令与目标命名空间的最近外围命名空间这一层参与查找。**这里 `main` 与 `metrics` 都属于全局命名空间，因此查找到全局这一层时，会同时考虑 `::report(int)` 和 `metrics::report(double)`。

两个函数都能接受 `240`；全局版本的 `int` 参数精确匹配，因而优于需要转换为 `double` 的版本。**两种 using 写法改变的是查找得到的候选集合，重载决议仍按相同规则比较候选。**若 `main` 中存在真正的同名局部声明，普通查找仍会先在局部找到它，不再向外收集这些函数。

多个同名声明能否共同使用，还取决于声明的种类。下面的完整程序中，两条 using 指令使两个不同的同名对象在全局这一查找层次共同被找到：

```cpp
#include <iostream>

namespace metrics {
const int limit{240};
} // namespace metrics

namespace display {
const int limit{300};
} // namespace display

int main() {
    using namespace metrics;
    using namespace display;

    // std::cout << limit << '\n'; // 取消注释后错误：limit 有歧义
    std::cout << metrics::limit << '\n'; // 240
    std::cout << display::limit << '\n'; // 300
}
```

非限定的 `limit` 可以指向 `metrics::limit`，也可以指向 `display::limit`。它们是不同对象，查找无法选定其中一个，所以取消注释后程序无法通过编译。调换两条 using 指令的顺序不能解决歧义；限定名称则明确选定要访问的对象。

这也说明，using 指令生效并不意味着同名声明必然冲突；上面两个对象可以正常存在，出错的是试图用有歧义的非限定名称访问它们。

## 后续声明对两种 using 的影响不同

命名空间可以再次打开并增加声明。两种 using 对这些后续声明的处理并不相同：

| 写法 | 对后续声明的影响 |
| --- | --- |
| `using metrics::report;` | 引入此处查到的声明；不会自动引入后来新增的普通函数重载 |
| `using namespace metrics;` | 通过指名的命名空间查找；后来新增、在使用点已经可见的声明，也可能参与查找 |

例如，某处 using 声明只能查到 `report(int)`，而 `metrics` 在它之后才增加 `report(double)`，这个新重载就不会自动加入较早的 using 声明；若在新重载已声明的位置重新写 using 声明，便能引入它。这里的“后来”指源代码中的声明位置，这些关系在编译期间确定。

> [!PRACTICE]
> 在局部代码反复使用某个项目名字时，using 声明可以减少重复，同时保留明确的引入来源。把它放在确实需要的代码块中，容易看清影响范围。using 指令会让名字查找受到整个命名空间变化的影响；范围越大，越难从使用位置判断候选名字来自哪里。标准库名称继续显式保留 `std::`，便于识别接口来源。

## 参考资料

- [C++23 工作草案：using 声明](https://timsong-cpp.github.io/cppwp/n4950/namespace.udecl)
- [C++23 工作草案：using 指令](https://timsong-cpp.github.io/cppwp/n4950/namespace.udir)
- [C++23 工作草案：非限定名称查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.unqual)
