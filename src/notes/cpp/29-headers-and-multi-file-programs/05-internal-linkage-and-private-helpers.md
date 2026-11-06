---
title: 内部链接与文件内辅助函数（Internal Linkage and File-Local Helpers）
date: 2026-09-22
order: 5
---

# 内部链接与文件内辅助函数（Internal Linkage and File-Local Helpers）

两个实现文件可能各自需要一个名为 `adjust_pressure` 的辅助函数，但采用不同的调整方式。希望它们互不干扰，不能只把函数藏在各自的 `.cpp` 中：**文件位置不决定函数身份，未写进头文件也不意味着函数名具有内部链接。**

[外部链接](01-declarations-across-source-files.md#声明可见与实体相同是两件事)允许不同翻译单元中的声明指向同一个函数。现在需要相反的安排：让同名辅助函数在不同翻译单元中分别表示各自的实体。

## 匿名命名空间让辅助函数属于当前翻译单元

匿名命名空间（unnamed namespace）省略命名空间名称，写成 `namespace { ... }`。其中普通函数的名称具有内部链接（internal linkage）：当前翻译单元中的不同作用域可以通过声明和查找指向它，其他翻译单元中同样拼写的名称不会因此指向同一个函数。

下面四个文件组成一个独立项目，保存在同一目录。两个公开操作分别由不同源文件实现；每个实现都使用自己的 `adjust_pressure` 辅助函数。

`pressure.hpp`：

```cpp
#ifndef CPP_NOTES_PRESSURE_HPP
#define CPP_NOTES_PRESSURE_HPP

namespace workshop {
int adjust_front_pressure(int pressure_kpa);
int adjust_rear_pressure(int pressure_kpa);
} // namespace workshop

#endif
```

`front.cpp`：

```cpp
#include "pressure.hpp"

namespace workshop {
namespace {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}
} // namespace

int adjust_front_pressure(int pressure_kpa) {
    return adjust_pressure(pressure_kpa);
}
} // namespace workshop
```

`rear.cpp`：

```cpp
#include "pressure.hpp"

namespace workshop {
namespace {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 10;
}
} // namespace

int adjust_rear_pressure(int pressure_kpa) {
    return adjust_pressure(pressure_kpa);
}
} // namespace workshop
```

`main.cpp`：

```cpp
#include "pressure.hpp"

#include <iostream>

int main() {
    std::cout << workshop::adjust_front_pressure(220) << '\n';
    std::cout << workshop::adjust_rear_pressure(220) << '\n';
}
```

使用 GCC 构建：

```sh
g++ -std=c++23 main.cpp front.cpp rear.cpp -o pressure_demo
```

运行后依次输出：

```text
225
230
```

两个 `workshop` 仍然是同一个具名命名空间。不同之处在于，各翻译单元中嵌套的匿名命名空间彼此不同，所以其中的 `adjust_pressure` 是两个函数。一个增加 `5`，另一个增加 `10`，没有为同一函数提供互相冲突的定义。

同一文件内，匿名命名空间中的名称可以通过外层作用域中的普通查找找到，效果类似在外层引入了指向该匿名命名空间的 `using` 指令。因此，后面的公开函数能够直接写 `adjust_pressure(pressure_kpa)`，无需额外写一条 `using` 指令。

两个公开函数写在匿名命名空间之外，仍具有外部链接。`main.cpp` 通过头文件中的声明调用公开操作，再由对应操作调用本翻译单元的辅助函数。

> [!IMPORTANT]
> 这里有两个对外的操作，也有两个彼此独立的辅助函数。匿名命名空间改变了辅助函数名称的跨翻译单元身份，没有阻止本翻译单元中的其他函数使用它。

## 不写进头文件与改叫 detail 都不能隔离实体

如果只移除 `front.cpp` 和 `rear.cpp` 中包围辅助函数的匿名命名空间，保留所有函数体，两个辅助函数就都直接属于 `workshop`。

此时，两个文件定义的是同一个具有外部链接的普通函数 `workshop::adjust_pressure(int)`。完整程序为它提供了两份定义，违反[单一定义规则](03-definition-boundaries-and-inline.md#单一定义规则先区分两种重复)，常见工具链会在链接时报重复定义。

这个辅助函数始终没有出现在 `pressure.hpp` 中，但它的链接属性不会因此改变。**头文件决定哪些声明被包含者看见，链接属性决定不同声明能否表示同一实体。**

把匿名命名空间改成 `namespace detail { ... }` 也不是同样的解决办法。如果两个文件都把辅助函数放在 `workshop::detail` 中，仍然是在同一个具名命名空间里定义同一个普通函数。`detail` 只是常用来表达“实现细节”的命名约定，不是具有隔离作用的关键字。

链接属性也不是安全边界。例子中的 `main.cpp` 虽然不能靠抄写一份同名声明直接调用另一个翻译单元的内部辅助函数，却可以通过公开操作让该辅助函数执行。这里限制的是名称与实体的对应关系，并不是授权或运行时访问检查。

## 匿名命名空间按翻译单元区分

在同一个翻译单元、同一个外层命名空间中，多次写 `namespace { ... }` 会重新打开同一个匿名命名空间。分成两段书写，不能让相同的函数定义在这个翻译单元中出现两次。

相反，位于不同外层命名空间中的匿名命名空间并不相同。例如，`workshop` 内部的匿名命名空间与全局命名空间直接包含的匿名命名空间，仍有各自的声明归属。

这里的边界是翻译单元，而不是磁盘上的文件。假如把匿名命名空间中的辅助函数定义移进一个头文件，再由两个 `.cpp` 分别包含，每个翻译单元仍会得到自己的函数；头文件只有一份，不代表这些函数成为一个共同实体。

[包含保护](02-headers-and-include-guards.md#包含保护记录本次预处理是否已经见过头文件)只能防止这份定义在同一个翻译单元内反复展开，不能把不同翻译单元中的内部实体合并起来。

> [!WARNING]
> 不要用头文件中的匿名命名空间给共享接口“增加私有性”。这里得到的是不同翻译单元各自的实体；如果接口需要各处指向同一个函数，这种安排就改变了接口所要求的身份关系。

## 命名空间作用域的 static 函数也具有内部链接

对于普通函数，也可以直接在命名空间作用域使用 `static`，使其名称具有内部链接。下面是 `front.cpp` 的完整替代版本，其他三个文件保持不变：

```cpp
#include "pressure.hpp"

namespace workshop {
static int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}

int adjust_front_pressure(int pressure_kpa) {
    return adjust_pressure(pressure_kpa);
}
} // namespace workshop
```

这里的 `static` 作用于命名空间作用域的函数声明，改变的是函数名称的链接属性。它不会让函数只执行一次，也不会改变参数按值传递、执行函数体和返回结果的规则。

这两种写法都能让当前辅助函数保持内部链接，但声明归属并不相同：使用 `static` 时，函数直接属于 `workshop`；使用匿名命名空间时，函数属于其内部的匿名命名空间。

> [!PRACTICE]
> 某个辅助函数只服务于一个实现文件时，可以把它放进该 `.cpp` 的匿名命名空间，让实现内的关系明确留在当前翻译单元。其他源文件真正需要调用的操作，才作为共享接口声明在头文件中；文件组织和链接属性应共同表达这条边界。

## 参考资料

- [C++23 工作草案：程序与链接属性](https://timsong-cpp.github.io/cppwp/n4950/basic.link)
- [C++23 工作草案：匿名命名空间](https://timsong-cpp.github.io/cppwp/n4950/namespace.unnamed)
- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
