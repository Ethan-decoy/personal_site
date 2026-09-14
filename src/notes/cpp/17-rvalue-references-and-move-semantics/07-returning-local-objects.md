---
title: 返回局部对象与隐式移动（Returning Local Objects and Implicit Move）
date: 2026-09-12
order: 7
---

# 返回局部对象与隐式移动（Returning Local Objects and Implicit Move）

有些结果要经过多条语句逐步建立，函数需要先给它一个名字，再把完成的对象返回。此时 `return result;` 指定一个已有对象，与直接返回同类纯右值的情形不同。

需要分别回答两个问题：实现是否可以把这个局部对象直接建成调用结果；如果没有这样做，现有的构造接口能否完成返回。

## 逐步准备结果，再按值交付

下面的函数收集有效的压力采样值。示例约定正数为有效读数，零和负数被忽略；`push_back` 将一个读数追加到序列末尾，成功后序列长度增加一：

```cpp
#include <iostream>
#include <vector>

std::vector<double> collect_valid_samples(const std::vector<double>& source) {
    std::vector<double> result{};

    for (const double value : source) {
        if (value > 0.0) {
            result.push_back(value);
        }
    }

    return result;
}

int main() {
    const std::vector<double> source{240.0, -1.0, 245.0, 0.0};
    const std::vector<double> selected{collect_valid_samples(source)};

    std::cout << source.size() << ' ' << selected.size() << ' ' << selected[0] << '\n';
}
```

在各次操作正常完成的路径上，`selected` 保存 `240.0` 与 `245.0`，`source` 仍有四个元素，程序输出 `4 2 240`。筛选本来就需要建立新的元素，这些工作与返回时是否需要再转交容器，是两个不同阶段。

`result` 是函数体内的局部序列对象。它在循环中可以反复访问，但函数即将返回时，不再需要由这个局部名称继续管理结果。

## 具名返回值优化允许合并对象身份

对于这样的返回，语言允许实现把局部对象直接构造在调用结果的位置。这个特定的复制或移动省略通常称为具名返回值优化（named return value optimization，NRVO）：“具名”表示返回的是带有局部名称的对象。

如果本例采用 NRVO，函数中的 `result` 与调用者的 `selected` 是同一个结果对象的两种访问方式。循环从一开始就在填充这个对象，离开函数时没有另一份局部容器需要向它转交元素。这个对象在 `selected` 的生命周期结束时销毁。

如果没有采用 NRVO，`result` 与 `selected` 就是不同对象。返回过程必须先用 `result` 初始化调用结果，再销毁局部对象；这里选择序列的移动构造，接管已收集的元素。调用结果直接初始化 `selected`，不会在这次返回之后再多移动一次。

两条路径都能让调用者取得筛选结果，但对象身份和执行的构造操作不同。NRVO 属于实现可以选择的复制省略（copy elision），不是每个符合条件的返回都保证采用它。

> [!IMPORTANT]
> 返回具名局部对象时，先确保没有 NRVO 的构造路径也合法，再把 NRVO 视为允许减少工作的一种实现选择。直接返回同类纯右值的构造保证，不能原样套到 `return result;` 上。

在本文的普通函数中，NRVO 要求返回表达式直接命名一个具有自动存储期的非 `volatile` 局部对象；忽略顶层 `const` 等限定后，它与返回类型是同一种类类型。按值形参不在 NRVO 的适用范围内，引用变量也不是可以借此合并的局部对象。

`volatile` 是类型限定符，例如 `volatile int value;` 中的 `volatile`。本篇讨论的 NRVO 与隐式移动均排除带有这项限定的对象。

## 隐式移动让返回位置提供可转交的来源

`result` 在循环里是左值，为什么返回时没有写 `std::move`，仍然可以选择移动构造？

C++23 将符合条件的返回名称表达式按将亡值处理，这称为隐式移动（implicit move）。

适用的来源是在本函数体内或形参列表中声明、具有自动存储期的变量：它要么是非 `volatile` 对象，要么是绑定这类对象的右值引用。`return` 必须直接使用这个变量的名称表达式；仅给名称加括号不影响资格。

因此，`return result;` 中的 `result` 可以绑定到 `std::vector<double>` 移动构造的右值引用形参。这个规则只改变返回位置的表达式类别；它没有让局部对象在函数内的所有使用都变成右值，也没有提前销毁局部对象。

隐式移动同样不保证一定执行移动函数。将亡值交给重载决议之后，仍要看类型提供的构造函数、访问权限以及源对象的限定。如果类型只有可用的 `T(const T&)` 复制构造，它也可能从这个将亡值复制。

这里的 `T` 代表正在返回的具体类类型。C++23 不会因为将亡值初始化不成立，就自动把这个返回表达式重新当作普通左值尝试；只接受 `T&` 的复制构造不能接收它。

## 按值形参可以隐式移动，但不能采用 NRVO

需要修改一份独立采样记录再交付时，函数也可以直接接收按值形参。下面是一个完整程序，调用处用已有序列初始化形参，因此先复制出函数自己的记录：

```cpp
#include <iostream>
#include <vector>

std::vector<double> apply_offset(std::vector<double> samples, double offset_kpa) {
    for (double& value : samples) {
        value += offset_kpa;
    }

    return samples;
}

int main() {
    const std::vector<double> source{240.0, 245.0};
    const std::vector<double> adjusted{apply_offset(source, 5.0)};

    std::cout << source[0] << ' ' << adjusted[0] << '\n';
}
```

`samples` 是独立的按值参数对象，循环修改的是它，输出为 `240 245`。返回时它仍符合隐式移动条件，因此通过移动构造交付结果；但它是函数形参，不符合 NRVO 条件。这次移动转交已经调整好的元素，不撤销调用入口处为保留 `source` 而进行的必要复制。

如果把参数改为 `std::vector<double>& samples`，它就成了对调用者对象的借用，循环会修改调用者数据；左值引用形参的名称也不具备这里的隐式移动资格。按值返回它时通常通过复制建立结果，不能套用上面对按值形参的判断。

## const 与删除构造仍然约束返回

对原筛选函数的局部序列加上 `const` 会阻止循环修改它，因此这里改用一个已经准备好结果的函数来观察限定的影响。下面的函数定义放在包含 `<vector>` 的源文件中：

```cpp
std::vector<double> make_baseline() {
    const std::vector<double> result{240.0, 245.0};
    return result;
}
```

`const` 不排除 NRVO。但没有 NRVO 时，返回表达式仍保留 `const`，无法绑定到需要可修改源对象的 `std::vector<double>&&`，因而选择复制构造。这里存在合法的复制路径，函数能够成立；不能从它推导出“为所有返回局部对象加 `const` 都不影响转交成本”。

删除构造函数带来更直接的边界。下面的完整类型可以原地建立，却不能从已有同类型对象复制或移动。`make_direct` 合法，`make_named` 则刻意展示不能通过编译的返回：

```cpp
struct snapshot {
    int pressure_kpa;

    explicit snapshot(int value) : pressure_kpa{value} {}

    snapshot(const snapshot&) = delete;
    snapshot(snapshot&&) = delete;
};

snapshot make_direct() {
    return snapshot{240};
}

snapshot make_named() {
    snapshot result{240};
    return result; // 错误：选中的移动构造被删除，不能靠可选 NRVO 使其合法
}
```

`make_direct` 用同类纯右值直接构造结果，不需要被删除的两项构造接口。`make_named` 则必须有合法的非省略路径；这里将亡值优先选择显式删除的移动构造，返回不成立。

即使为这个类型恢复 `snapshot(const snapshot&)`，只要显式删除的移动构造仍然是最佳候选，该具名返回仍会报错。没有移动构造、显式删除移动构造，以及默认移动因成员条件被定义为删除，须按[移动操作的生成与选择](05-generation-and-selection-of-move-operations.md#不存在与被删除的移动操作并不相同)分别判断。

## 不要为普通局部返回额外添加移动转换

> [!PRACTICE]
> 对本篇这种按值返回、同类非 `volatile` 局部对象的写法，直接写 `return result;` 就能保留 NRVO 的可能，也能在没有 NRVO 时使用隐式移动规则。
>
> 改成 `return std::move(result);` 后，返回操作数变成函数调用表达式，不再是满足 NRVO 条件的局部对象名称。它仍可提供将亡值，却不能继续使用这项 NRVO 许可。增加转换没有补上缺失能力，反而去掉了一条可省略转交的路径。

这项建议限定于直接返回相应局部对象。返回成员表达式、通过借用得到的对象，或者转换成另一种结果类型，都要根据实际表达式与接口重新判断；不能把“返回局部结果不必写 `std::move`”扩成“所有返回语句都可以自动移动”。

## 参考资料

- [C++23 工作草案：具名局部对象的复制与移动省略](https://timsong-cpp.github.io/cppwp/n4950/class.copy.elision#1.1)
- [C++23 工作草案：隐式移动的对象与表达式条件](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.unqual#4)
- [C++23 工作草案：结果初始化先于局部对象销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.return#5)
- [C++ Core Guidelines：返回局部变量时避免多余的移动转换](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-return-move-local)
