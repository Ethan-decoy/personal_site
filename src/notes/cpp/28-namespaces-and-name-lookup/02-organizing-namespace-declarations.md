---
title: 命名空间声明的组织（Organizing Namespace Declarations）
date: 2026-09-21
order: 2
---

# 命名空间声明的组织（Organizing Namespace Declarations）

同属 `workshop` 的接口，不必全部写在连续的一对花括号中。可以把声明和实现分段安排，也可以按功能建立子命名空间。需要分清的是：哪些写法仍在组织同一个命名空间，哪些写法建立了新的归属。

## 分段书写仍属于同一个命名空间

在本篇使用的普通具名命名空间中，**同一外围命名空间里的同名定义，会共同组织同一个命名空间。**这种分段书写通常称为重新打开命名空间（reopening a namespace）。

下面先在 `workshop` 中声明函数，再重新打开 `workshop` 提供定义。两段 `namespace workshop` 都直接位于全局命名空间中：

```cpp
#include <iostream>

namespace workshop {
int adjust_pressure(int pressure_kpa);
}

int main() {
    std::cout << workshop::adjust_pressure(240) << '\n';
}

namespace workshop {
int adjust_pressure(int pressure_kpa) {
    return pressure_kpa + 5;
}
} // namespace workshop
```

程序输出 `245`。前面的声明和后面的定义都属于同一个 `workshop`，并且声明了同一个函数。重新打开命名空间不会复制已有成员，也不会再创建一个同名函数。

这里仍遵循[函数声明与定义的区别](../05-functions/04-function-declarations-and-definitions.md#在定义之前提供声明)：调用位置需要先知道函数的调用边界，函数体则可以放在后面。命名空间分段只改变代码的组织方式。

## 同一归属不意味着所有声明同时可见

分析 `main` 中的调用时，编译器能够使用的是此前已经出现的函数声明。后面的函数定义虽然属于同一个命名空间，也不会反向补足调用位置缺少的信息。

如果把上例中的第一段改为空的 `namespace workshop {}`，保留调用之后的定义，程序就不合法：`workshop` 在调用处已经存在，但此时还没有可以找到的 `adjust_pressure` 声明。失败位置是 `workshop::adjust_pressure(240)`，原因不是缺少函数体，而是调用处尚不知道这个函数。

> [!IMPORTANT]
> 重新打开命名空间解决的是声明的归属与组织；名称能否被找到，仍取决于查找发生的位置。对这里的普通函数调用，应在调用前提供声明，不能靠后面另一段命名空间定义补救。

## 嵌套命名空间表达更具体的归属

当 `workshop` 中既有轮胎相关接口，也有其他功能时，可以把轮胎读数归入嵌套命名空间（nested namespace）`tires`。下面是放在全局命名空间中的声明片段：

```cpp
namespace workshop {
namespace tires {
struct reading {
    int pressure_kpa;
};
} // namespace tires
} // namespace workshop
```

这里有两层归属：`tires` 是 `workshop` 的成员，`reading` 是 `workshop::tires` 的成员。相应类型名是 `workshop::tires::reading`；仅写 `workshop::reading` 并不能在这段代码中找到它。

上面的嵌套定义也可以整体替换为下面的简写，两段是替代关系，不应同时重复定义 `reading`：

```cpp
namespace workshop::tires {
struct reading {
    int pressure_kpa;
};
} // namespace workshop::tires
```

`namespace workshop::tires` 保留了两层命名空间，并不创建一个名字中含有 `::` 的单独命名空间。两种写法也都能重新打开已有的 `workshop::tires`。

**判断是否在重新打开同一个命名空间，要连同外围归属一起看。**全局命名空间中的 `tires` 和 `workshop` 中的 `tires` 属于不同命名空间；只比较最后一段名称不够。

## 命名空间别名保留归属，缩短限定名称

局部代码反复使用 `workshop::tires` 时，可以给这个已有命名空间指定一个较短的命名空间别名（namespace alias）：

```cpp
#include <iostream>

namespace workshop::tires {
struct reading {
    int pressure_kpa;
};
} // namespace workshop::tires

int main() {
    namespace tires = workshop::tires;

    const tires::reading value{240};
    std::cout << value.pressure_kpa << '\n';
}
```

程序输出 `240`。`namespace tires = workshop::tires;` 中，等号右侧必须指定已有命名空间，左侧的 `tires` 是指向它的另一名称，末尾以分号结束。

此处的 `tires::reading` 和 `workshop::tires::reading` 指定同一个类型。**别名不建立新的命名空间，不复制成员，也不改变成员的归属。**它与前面的嵌套定义不同：嵌套定义组织命名空间层级，别名为已有命名空间提供另一种称呼。

这个别名只在 `main` 的相应块作用域中参与查找；它不会改变其他函数中 `tires` 的含义。把只为某段代码服务的简称放在该局部范围内，既能保留 `tires::reading` 所表达的归属，也能避免让这个简称影响更大的范围。

## 参考资料

- [C++23 工作草案：命名空间定义](https://timsong-cpp.github.io/cppwp/n4950/namespace.def.general)
- [C++23 工作草案：命名空间作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.namespace)
- [C++23 工作草案：限定名称查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.qual)
- [C++23 工作草案：命名空间别名](https://timsong-cpp.github.io/cppwp/n4950/namespace.alias)
