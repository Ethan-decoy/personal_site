---
title: 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）
date: 2026-09-03
order: 1
---

# 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）

程序新建一份归档记录，保存当前轮胎读数，随后更新当前记录中的压力值。归档值需要保留保存时的状态。

复制构造函数（copy constructor）定义了类怎样从同类型源对象初始化新对象。在这个归档例子中，源表达式指定一个已有的同类型对象，是左值（lvalue）。

## 复制构造建立新的对象身份

`tire_reading` 保存两项整数读数：压力按千帕（kPa）解释，温度按摄氏度（°C）解释。构造函数保存给定数值，读取函数返回记录中的值，`set_pressure_kpa` 更新这份记录的压力字段。

下面是完整程序，类定义放在 `main` 之前。本例手写复制构造函数，并输出 `copy` 标记，以便观察何时采用这条路径。对于这里仅包含两个可复制整数成员的类型，通常可以使用语言提供的复制行为；其机制见[隐式复制操作与成员语义](03-implicit-copy-operations-and-member-semantics.md#复制构造按成员初始化新对象)。

```cpp
#include <iostream>

class tire_reading {
  public:
    tire_reading(const int initial_pressure_kpa, const int initial_temperature_c)
        : pressure_kpa{initial_pressure_kpa}, temperature_c{initial_temperature_c} {}

    tire_reading(const tire_reading& source)
        : pressure_kpa{source.pressure_kpa}, temperature_c{source.temperature_c} {
        std::cout << "copy\n";
    }

    int current_pressure_kpa() const {
        return pressure_kpa;
    }

    int current_temperature_c() const {
        return temperature_c;
    }

    void set_pressure_kpa(const int new_pressure_kpa) {
        pressure_kpa = new_pressure_kpa;
    }

  private:
    int pressure_kpa;
    int temperature_c;
};

int main() {
    tire_reading measured{220, 36};
    const tire_reading archived{measured};

    measured.set_pressure_kpa(225);

    std::cout << measured.current_pressure_kpa() << ' ' << measured.current_temperature_c() << '\n';
    std::cout << archived.current_pressure_kpa() << ' ' << archived.current_temperature_c() << '\n';
    std::cout << (&measured == &archived) << '\n';
}
```

`tire_reading(const tire_reading&)` 是复制构造函数。在 `archived{measured}` 这条直接列表初始化（direct-list-initialization）中，`measured` 是指定已有读数对象的左值，它绑定到 `source` 引用形参。

构造 `archived` 时，源对象保存压力 `220`、温度 `36`。两个成员初始化器读取这些值，初始化新对象中对应的 `int` 成员。构造函数属于同一个类，所以能够读取另一个 `tire_reading` 对象的私有成员 `source.pressure_kpa` 与 `source.temperature_c`。

程序输出：

```text
copy
225 36
220 36
0
```

第一行来自 `archived` 的复制构造。接下来两行分别是当前记录和归档记录的压力、温度：更新 `measured` 的压力后，它保存 `225`，`archived` 仍保存复制时取得的 `220`。最后一行比较两个对象的地址，结果为 `false`，默认显示为 `0`。

> [!IMPORTANT] 复制源引用与新对象身份
> **复制构造初始化新目标对象；源引用只是访问已有源对象的路径，不使目标成为源的另一个名称。**本例的两个完整对象及各自的 `int` 成员具有独立身份，修改一份记录的整数成员不会自动同步另一份。
>
> 新目标也可以是类类型的成员子对象，复制构造并不只用于完整对象。对象身份独立也不保证所有外部数据都独立：若只是复制指针值，被指对象仍可能共享，见[成员复制与外部目标](../09-structures-and-object-composition/04-copying-and-assigning-struct-objects.md#成员复制遵循成员自己的语义)。

除去演示用输出，当前状态复制只需初始化两个 `int` 成员。[复制一份 `std::vector<double>` 采样序列](../11-sequences-and-data-access/03-sequence-copying-and-function-access.md#副本保存独立的元素)则要为新序列建立独立元素，用源序列中的采样值初始化它们。复制构造这个名称不能单独说明成本，还要看类型为了建立副本实际完成哪些工作。

## const 引用描述复制源

本例采用常见的 `const tire_reading&` 复制源形式。引用直接绑定已有源对象，不为这个形参再建立一个 `tire_reading`；`const` 允许同一项接口接受可修改对象和 `const` 对象。

保留开篇的头文件与完整类定义，用以下定义整体替换 `main`。后续正常变体也都单独替换 `main`，彼此不接续：

```cpp
int main() {
    const tire_reading baseline{230, 20};
    const tire_reading parked{baseline};

    std::cout << parked.current_pressure_kpa() << ' ' << parked.current_temperature_c() << '\n';
}
```

这份变体先输出 `copy`，再输出 `230 20`。`source` 绑定到 `baseline`，函数从它的两个成员读取初值；当前实现不修改源对象。形参是引用，复制得到的 `parked` 仍是独立的类对象。

不能把这项复制源形参改成同类型按值接收。下面另作独立的错误类型片段，只检查类声明，不与开篇类型定义拼接：

```cpp
class tire_reading {
  public:
    tire_reading(tire_reading source); // 错误：这种单参数构造声明不合法
};
```

按值传参本身需要初始化一个新的参数对象，不能作为这项同类型复制过程的入口。

> [!WARNING] 同类型按值入口在声明处就不合法
> 用 `T` 表示正在定义的类时，**`T(T)` 这种只有一个同类型按值形参的构造声明不合法，必须得到编译诊断。**错误发生在声明处，不是先运行程序、递归复制，最后才失败。复制构造的引用形参避免了为了传入复制源而再建立一个同类型参数对象的问题。

## 复制初始化不等于复制构造

回到开篇的完整类定义，单独用以下定义替换 `main`。同一项复制构造函数分别由复制初始化（copy-initialization）和直接列表初始化选中：

```cpp
int main() {
    const tire_reading measured{220, 36};
    const tire_reading reported = measured;
    const tire_reading archived{measured};

    std::cout << reported.current_pressure_kpa() << ' ' << reported.current_temperature_c() << '\n';
    std::cout << archived.current_pressure_kpa() << ' ' << archived.current_temperature_c() << '\n';
}
```

输出包含两行 `copy`，随后两行都是 `220 36`。两条声明都从已有的 `measured` 建立新对象，各自调用一次当前的复制构造函数。它没有声明为 `explicit`，因此复制初始化也可以采用这项接口。

> [!IMPORTANT] 初始化形式与构造操作分别判断
> **直接列表初始化、复制初始化描述源码的初始化形式；复制构造描述由哪一类构造函数建立新对象。**两组术语不是同一个维度：
>
> | 术语 | 描述的问题 |
> | --- | --- |
> | 直接列表初始化、复制初始化 | 使用哪种初始化形式，并按对应规则判断构造路径 |
> | 复制构造 | 是否调用复制构造函数初始化新对象 |
>
> 声明中的 `=` 属于初始化语法，不表示先默认构造新对象，再向它赋值。不能仅凭花括号或 `=` 判断是否调用了复制构造函数，还要看源表达式的类型、值类别与对应初始化规则。

类型相同也不保证调用复制构造。仍保留开篇的头文件与完整类定义，以以下定义整体替换 `main`：

```cpp
int main() {
    const tire_reading fresh = tire_reading{220, 36};

    std::cout << fresh.current_pressure_kpa() << ' ' << fresh.current_temperature_c() << '\n';
}
```

这次只输出 `220 36`，没有 `copy` 标记。`tire_reading{220, 36}` 是 `tire_reading` 类型的纯右值（prvalue）表达式，接收两个整数的构造函数直接初始化 `fresh`。这里没有先建立另一个独立读数对象，再把它复制给 `fresh`。

> [!WARNING] 类型相同不保证调用复制构造
> 把同类型初始化一律当成复制构造，会误判上面的 `fresh`。**在 C++23 中，用同类纯右值初始化本例这样的普通完整对象时，初始化直接作用于目标，不调用复制构造函数。**`fresh` 的声明采用复制初始化形式，仍然符合这项规则。
>
> 这是语言的初始化规则。接收两个整数的构造函数仍然完成成员初始化，不能把“没有复制”理解成“构造没有工作”。更完整的结果对象模型见[按值返回与结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)。

赋值面对的则是已经存在的目标。前文[结构体赋值](../09-structures-and-object-composition/04-copying-and-assigning-struct-objects.md#赋值修改已有结构体对象)中的 `current = saved;` 更新已有 `position` 对象的状态；声明 `const tire_reading reported = measured;` 则在初始化新对象。类的[复制赋值接口](02-copy-assignment-and-existing-object-state.md#赋值修改左侧的已有对象)将在下一小节展开。

## 参考资料

- [C++23 工作草案：复制构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：初始化器](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：同类纯右值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general#16.6.1)
- [C++23 工作草案：成员子对象的初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init#7)
