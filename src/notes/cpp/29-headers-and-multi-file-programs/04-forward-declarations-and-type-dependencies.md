---
title: 前向声明与类型依赖（Forward Declarations and Type Dependencies）
date: 2026-09-22
order: 4
---

# 前向声明与类型依赖（Forward Declarations and Type Dependencies）

头文件里的函数声明可能需要提到另一个类，但声明接口不一定需要知道这个类有哪些成员。例如，`pressure_margin` 接收 `const reading&`：声明这项操作时，需要确定 `reading` 是哪个类型；实现读取压力的行为时，才需要知道 `pressure_kpa` 成员。两处所需的信息不同，也就不必承担相同的头文件依赖。

## 声明类型存在，不等于定义类型内容

下面是位于全局命名空间中的声明片段：

```cpp
namespace workshop {
struct reading;

int pressure_margin(const reading& value, int target_kpa);
} // namespace workshop
```

`struct reading;` 是类的前向声明（forward declaration）。它没有包含成员的花括号，说明 `workshop` 中存在名为 `reading` 的类类型，却没有提供类定义。`struct reading {};` 则已经定义了一个没有数据成员的类，两者含义不同。

在这里只有前向声明的地方，`reading` 属于不完整类型（incomplete type）。编译器知道它的类型身份，可以区分 `reading*`、`const reading&` 与其他类型，却尚未得到定义对象和访问成员所需的信息。

在同一命名空间中补充定义，就能使这个类成为完整类型（complete type）：

```cpp
namespace workshop {
struct reading {
    int pressure_kpa;
};
} // namespace workshop
```

这是前面那个 `workshop::reading` 的定义，不是新增另一个类型。**类是否完整，取决于使用位置能否获得它的定义；同一个类可以在翻译单元的前面不完整，在定义之后完整。**把定义写在另一个 `.cpp` 中，不会使当前翻译单元自动获得它。

## 把接口依赖与实现依赖分开

下面四个文件构成一个完整程序，放在同一目录中。

`report.hpp` 只声明函数需要借用哪种对象，因此可以只提供类的前向声明：

```cpp
#ifndef CPP_NOTES_REPORT_HPP
#define CPP_NOTES_REPORT_HPP

namespace workshop {
struct reading;

int pressure_margin(const reading& value, int target_kpa);
} // namespace workshop

#endif
```

`reading.hpp` 提供类的完整定义：

```cpp
#ifndef CPP_NOTES_READING_HPP
#define CPP_NOTES_READING_HPP

namespace workshop {
struct reading {
    int pressure_kpa;
};
} // namespace workshop

#endif
```

`report.cpp` 同时包含自己的接口和类定义：

```cpp
#include "reading.hpp"
#include "report.hpp"

namespace workshop {
int pressure_margin(const reading& value, int target_kpa) {
    return value.pressure_kpa - target_kpa;
}
} // namespace workshop
```

包含 `report.hpp`，可以让函数定义与公开声明在同一翻译单元中接受检查；包含 `reading.hpp`，则使函数体能够访问 `value.pressure_kpa`。

`main.cpp` 要创建读数对象并调用函数，因此也直接包含两个头文件：

```cpp
#include "reading.hpp"
#include "report.hpp"

#include <iostream>

int main() {
    const workshop::reading value{220};
    std::cout << workshop::pressure_margin(value, 240) << '\n';
}
```

使用 GCC 时，可以在这些文件所在目录构建：

```sh
g++ -std=c++23 main.cpp report.cpp -o pressure_report
```

运行程序输出 `-20`。两个 `.cpp` 都能获得各自操作需要的信息；`report.hpp` 本身不必包含 `reading.hpp`。

如果从 `report.cpp` 删除 `#include "reading.hpp"`，失败位置是 `value.pressure_kpa`：前向声明没有说明 `reading` 有哪些成员。如果从 `main.cpp` 删除这条包含，失败位置则是 `value` 的对象定义：仅知道类名还不足以创建这个类的对象。另一份源文件拥有完整定义，不能补救这些编译错误。

## 判断的是当前操作需要什么信息

判断类型是否必须完整，要看当前位置的操作。这里会用到 `sizeof` 运算符：`sizeof(reading)` 给出一个 `reading` 对象占用的字节数，因此需要类的完整定义。

对于已经前向声明的普通类 `reading`，以下区别可以直接用于判断当前代码需要哪种依赖：

| 当前操作 | 是否需要 reading 的完整定义 |
| --- | --- |
| 定义 `reading* pointer{nullptr};` 这样的指针对象 | 不需要，定义的是指针对象 |
| 声明接收或返回 `reading*`、`reading&` 的函数 | 不需要 |
| 把已有的 `reading` 引用直接传给接收同类型引用的函数 | 不需要，前提是这次传递不要求额外的类型转换 |
| 定义 `reading` 对象，或让其他类按值包含一个 `reading` 成员 | 需要 |
| 访问 `value.pressure_kpa` 或调用 `value` 的成员函数 | 需要，必须知道类中声明了哪些成员 |
| 计算 `sizeof(reading)` | 需要 |
| 仅声明按值接收或按值返回 `reading` 的函数 | 不需要 |
| 给上述按值函数编写普通函数体，或进行普通求值的调用 | 需要 |

指针或引用的目标类型不完整，并不妨碍函数只把既有访问关系继续交给另一项操作。例如，下面的 `forward.cpp` 可以作为额外源文件加入刚才的程序，只包含 `report.hpp`：

```cpp
#include "report.hpp"

namespace workshop {
int forward_margin(const reading& value, int target_kpa) {
    return pressure_margin(value, target_kpa);
}
} // namespace workshop
```

`forward_margin` 没有创建 `reading` 对象，也没有访问其成员，只把同一个对象的引用传给 `pressure_margin`。因此，编译这个函数体不需要看到 `reading` 的定义。实际读取成员的 `pressure_margin` 仍在 `report.cpp` 中编译，那里需要完整定义。

按值接口则要区分“只作声明”与“真的定义或调用”。下面的片段可以放在 `report.hpp` 的 `workshop` 命名空间内，即使那里只有 `struct reading;` 也合法：

```cpp
reading make_reading(int pressure_kpa);
void record_reading(reading value);
```

这两条声明只确定函数类型，还没有创建返回对象或形参对象。等到编写普通函数体，或者在表达式中真正调用它们时，就需要相应的完整类定义，以处理对象的初始化、传递和销毁。

> [!IMPORTANT]
> 前向声明足以让代码认识一个类的身份，却不提供类的内容。判断依赖时，应看当前位置正在执行哪一种声明或操作，不能把“类型名已经出现过”当作定义已经可用，也不能把“只有函数声明”误认为其中的类必须完整。

## 前向声明必须指向正确的类型

`report.hpp` 把 `struct reading;` 放在 `namespace workshop` 中，是因为接口依赖的类型就是 `workshop::reading`。

如果改为在全局命名空间中单独写 `struct reading;`，声明的会是 `::reading`。它与 `workshop::reading` 是不同类型，即使最后一段名称相同，也不能互相补全。要使这个前向声明的类成为完整类型，必须提供同一类型的定义；给另一个类型添加相同成员没有作用。

这里也不需要为类的每个成员分别补前向声明。当前代码如果要使用类成员，应包含给出类定义的头文件；类外成员函数定义仍然依赖类中已有的成员声明。

## 依赖边界应服从接口语义

本例中的 `report.hpp` 是自包含的头文件（self-contained header）：单独包含它，就能合法理解其中的声明，不要求使用者先按某个顺序包含 `reading.hpp`。自包含并不要求每个被提到的类都在头文件中完整定义；满足当前声明所需的信息即可。

`main.cpp` 自己创建 `reading` 对象，因此直接包含 `reading.hpp`。即使 `report.hpp` 将来恰好又包含了这个头文件，`main.cpp` 也不应依赖这种间接关系。直接依赖说明的是当前源文件自身需要哪些声明与定义，便于在接口调整时保持稳定。

> [!PRACTICE]
> 当接口只需要类的身份，且类由当前项目维护时，可以用前向声明缩小必须暴露的类型定义依赖；需要对象内容的实现再包含相应头文件。接口本来需要按值保存一个对象，就应保留值成员并包含其定义，不应仅为少写一次 `#include` 改成指针，引入新的空值、借用或生命周期问题。

对于标准库类型和第三方类型，应通过它们提供的头文件取得声明，不自行猜测其声明形式。前向声明减少的是当前代码必须知道的信息，不改变对象的所有权、访问权限或生命周期，也不会使引用自动保持有效。

## 参考资料

- [C++23 工作草案：不完整类型与完整类型](https://timsong-cpp.github.io/cppwp/n4950/basic.types.general)
- [C++23 工作草案：类型声明中的类名](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.elab)
- [C++23 工作草案：单一定义规则与需要完整类型的语境](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
- [C++23 工作草案：函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
