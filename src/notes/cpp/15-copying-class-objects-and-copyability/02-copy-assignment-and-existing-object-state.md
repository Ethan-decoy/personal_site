---
title: 复制赋值与既有对象状态（Copy Assignment and Existing Object State）
date: 2026-09-03
order: 2
---

# 复制赋值与既有对象状态（Copy Assignment and Existing Object State）

显示界面保留着一份轮胎读数记录。取得新读数后，程序需要更新这份已有记录，让先前指向它的访问路径继续有效。

复制赋值运算符（copy assignment operator）定义类怎样用同类型源对象的状态更新已有目标。源对象提供要读取的数据，调用对象接受修改。

## 赋值修改左侧的已有对象

`tire_reading` 保存压力与温度两项整数读数，单位分别为千帕（kPa）和摄氏度（°C）。`displayed` 是已有显示记录，`measured` 保存新取得的读数。

下面是完整程序，类定义位于 `main` 之前，与上一节的类型定义分别使用。本例手写复制赋值运算符，便于观察成员怎样更新，以及函数返回什么。对于本例这种仅包含两个可复制整数成员的类型，通常可以使用语言提供的复制行为，见[隐式复制赋值](03-implicit-copy-operations-and-member-semantics.md#复制赋值按成员修改已有对象)。

```cpp
#include <iostream>

class tire_reading {
  public:
    tire_reading(const int initial_pressure_kpa, const int initial_temperature_c)
        : pressure_kpa{initial_pressure_kpa}, temperature_c{initial_temperature_c} {}

    tire_reading& operator=(const tire_reading& source) {
        pressure_kpa = source.pressure_kpa;
        temperature_c = source.temperature_c;
        return *this;
    }

    int current_pressure_kpa() const {
        return pressure_kpa;
    }

    int current_temperature_c() const {
        return temperature_c;
    }

  private:
    int pressure_kpa;
    int temperature_c;
};

int main() {
    tire_reading displayed{210, 40};
    const tire_reading measured{230, 20};
    const tire_reading* const displayed_identity{&displayed};

    std::cout << displayed.current_pressure_kpa() << ' ' << displayed.current_temperature_c()
              << '\n';

    displayed = measured;

    std::cout << displayed.current_pressure_kpa() << ' ' << displayed.current_temperature_c()
              << '\n';
    std::cout << measured.current_pressure_kpa() << ' ' << measured.current_temperature_c() << '\n';
    std::cout << (displayed_identity == &displayed) << '\n';
}
```

`tire_reading& operator=(const tire_reading& source)` 是当前类的复制赋值运算符。复制赋值运算符是非静态成员函数；在 `displayed = measured` 中，`displayed` 是调用对象，`measured` 绑定到 `source` 引用形参，不为这个形参再建立一个 `tire_reading` 对象。

函数体中的 `source.pressure_kpa` 和 `source.temperature_c` 读取源对象的成员；左侧未加 `source.` 的成员名则指定调用对象中的对应成员。这两条赋值对 `int` 使用内建赋值，不是再次调用类的 `operator=`。

程序输出：

```text
210 40
230 20
230 20
1
```

前两行显示 `displayed` 从压力 `210`、温度 `40` 更新为 `230`、`20`；第三行是没有被当前实现修改的 `measured`。函数体只给已有成员赋值，没有销毁或重新构造 `displayed`。保存地址的指针继续指向原对象，最后的地址比较为 `true`，默认显示为 `1`。

> [!IMPORTANT] 复制构造与复制赋值的目标不同
> **复制构造初始化新的目标对象；复制赋值面对已经存在的目标对象。**本例这样的逐成员赋值让目标及其两个 `int` 成员延续原有身份，用源成员的值更新状态。
>
> 赋值没有把 `displayed` 变成 `measured` 的另一个名称。这里的两个完整对象仍然各有身份，数值相同不表示对象相同。

## operator= 的返回值仍然指代左侧对象

更新状态与产生表达式结果是两项关系。当前返回类型 `tire_reading&` 与函数体末尾的 `return *this;`，让赋值表达式的结果继续指代更新后的左侧对象。

后面的正常变体均保留开篇的头文件与完整类定义，单独用给出的定义整体替换 `main`，彼此不接续：

```cpp
int main() {
    tire_reading displayed{210, 40};
    const tire_reading measured{230, 20};

    tire_reading& updated{displayed = measured};

    std::cout << (&updated == &displayed) << '\n';
    std::cout << updated.current_pressure_kpa() << ' ' << updated.current_temperature_c() << '\n';
}
```

这份变体先输出 `1`，再输出 `230 20`。`this` 指向调用对象 `displayed`，`*this` 是指定它的左值（lvalue）；按引用返回后，`updated` 绑定到这个已有对象，没有建立另一份读数记录。

> [!IMPORTANT] 复制源引用与赋值结果引用
> 在本例 `T& operator=(const T& source)` 这种接口中，`T` 表示当前类。**参数的 `const T&` 提供读取源对象的路径；返回类型 `T&` 配合 `return *this;`，使赋值结果成为指定左侧对象的 `T` 类型左值。**两个引用承担不同角色。
>
> 以 `T&` 接收这一结果时，接收引用绑定到原目标，不建立新的独立副本。使用这个引用时，目标仍须处于生命周期内。

同一份新读数也可以更新显示记录与备用记录。仍单独替换 `main`：

```cpp
int main() {
    tire_reading displayed{210, 40};
    tire_reading backup{200, 35};
    const tire_reading measured{230, 20};

    displayed = backup = measured;

    std::cout << displayed.current_pressure_kpa() << ' ' << displayed.current_temperature_c()
              << '\n';
    std::cout << backup.current_pressure_kpa() << ' ' << backup.current_temperature_c() << '\n';
}
```

两行输出都是 `230 20`。赋值从右向左结合，这条连续赋值按 `displayed = (backup = measured)` 分组。内层先更新 `backup`，结果仍指定 `backup`；外层的 `source` 再绑定到它，用这份已更新的记录修改 `displayed`。

C++ 不强制用户定义的 `operator=` 必须返回 `T&`。当前形式延续了内建赋值的结果模型；若把函数改为返回 `void` 并移除 `return *this;`，单独的赋值仍可更新状态，但上面的引用初始化和连续赋值就不再成立。能怎样使用结果，要看选中函数的返回声明与实现。

## 源对象与目标对象可能相同

两个名称不保证指定两个对象。源引用也可以绑定到调用对象本身；下面的正常变体仍单独替换 `main`：

```cpp
int main() {
    tire_reading displayed{210, 40};
    const tire_reading& alias{displayed};

    displayed = alias;

    std::cout << displayed.current_pressure_kpa() << ' ' << displayed.current_temperature_c()
              << '\n';
}
```

`alias` 与 `displayed` 指定同一个对象，因此这仍然是自赋值（self-assignment），输出为 `210 40`。当前函数体让两个 `int` 成员分别接收自身的值，每项操作都保持原值，不需要为了识别自赋值额外比较地址。

> [!WARNING] 源引用不保证与目标具有不同身份
> 不能因为右侧通过 `const` 引用接收，就把它当成独立且不受目标修改影响的副本。**自赋值时，读取源与修改目标访问的是同一个对象。**
>
> 例如，若把实现改成先将目标的两个成员清零，再从 `source` 读取并赋值，那么这次自赋值读取到的源也已经变为零，原来的 `210`、`40` 就会丢失。当前直接的整数成员赋值没有这项问题；是否需要特殊处理，应看实现会不会在读取源状态前破坏它。

## 可修改性由左右两侧承担不同职责

开篇的 `measured` 是 `const tire_reading`，仍能作为复制源，因为 `source` 只需要提供读取路径。普通可修改对象也能绑定到同一项 `const tire_reading&` 形参。

左侧则由当前成员函数的调用条件约束。`operator=` 没有尾随 `const`，因此不能通过 `const tire_reading` 对象调用。下面是单独考察的错误变体：保留开篇的头文件与完整类定义，只替换 `main`，不与正常变体拼接。

```cpp
int main() {
    const tire_reading displayed{210, 40};
    const tire_reading measured{230, 20};

    displayed = measured; // 错误：当前非 const 成员函数不能通过 const 对象调用
}
```

> [!WARNING] 只读复制源不意味着只读目标也能赋值
> `const` 源对象满足当前引用形参的绑定条件，不代表 `const` 目标也满足调用条件。**上面的调用在匹配当前非 `const` 成员函数时失败，必须得到编译诊断。**
>
> 问题出在左侧调用对象；把右侧改成可修改对象也不能修复它。判断当前赋值能否成立，应分别核对源形参能否接收右侧，以及左侧能否调用所选的赋值函数。

## 参考资料

- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：重载的赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/over.ass)
- [C++23 工作草案：赋值表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
- [C++23 工作草案：函数调用结果的值类别](https://timsong-cpp.github.io/cppwp/n4950/expr.call#13)
- [C++23 工作草案：this 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.this)
