---
title: 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）
date: 2026-09-03
order: 1
---

# 同类型初始化与复制构造（Same-Type Initialization and Copy Construction）

程序需要保存当前轮胎读数，再更新当前记录中的压力值。归档记录应当保留保存时的读数，因此需要一份具有独立状态的新对象。

复制构造函数（copy constructor）是从同类型源对象初始化新对象的一类构造函数。在这个归档例子中，复制源是已经存在的当前记录，目标是正在建立的归档记录。

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

`tire_reading(const tire_reading&)` 是本例的复制构造函数。`archived{measured}` 采用直接列表初始化（direct-list-initialization），选择这项构造函数。过程可以分为三步：

1. `measured` 是指定已有读数对象的左值（lvalue），`source` 引用形参直接绑定到它。
2. 成员初始化器中，`pressure_kpa`、`temperature_c` 指定新目标的成员，`source.pressure_kpa`、`source.temperature_c` 指定源对象的成员。新成员分别用源中的 `220` 和 `36` 初始化。
3. 两个成员初始化完成后，执行构造函数体，输出一次 `copy`。

构造函数属于同一个类，因此可以读取另一个 `tire_reading` 对象的私有成员。复制这两个整数的工作发生在成员初始化中，输出语句只是标记这条构造路径。

程序输出：

```text
copy
225 36
220 36
0
```

两行读数分别来自当前记录和归档记录：更新 `measured` 的压力后，它保存 `225`，`archived` 仍保存复制时取得的 `220`。最后一行比较两个对象的地址，结果为 `false`，默认显示为 `0`。

> [!IMPORTANT] 复制源引用与新对象身份
> **复制构造初始化新目标对象；源引用只是访问已有源对象的路径，不使目标成为源的另一个名称。**本例的两个完整对象及各自的 `int` 成员具有独立身份，修改一份记录的整数成员不会自动同步另一份。

对象身份独立不保证外部数据也独立：若只是复制指针值，被指对象仍可能共享，见[成员复制与外部目标](../09-structures-and-object-composition/04-copying-and-assigning-struct-objects.md#成员复制遵循成员自己的语义)。

## const 引用描述复制源

本例采用常见的 `const tire_reading&` 复制源形式，其中 `&` 与 `const` 承担不同职责：

- `&` 让形参直接绑定已有源对象，不为这个形参再建立一个 `tire_reading`。
- `const` 限制经 `source` 修改本例的整数成员，同时允许同一项接口接受可修改对象和 `const` 对象。

源引用上的 `const` 与目标对象的 `const` 也要分别判断。开篇的 `archived` 自身声明为 `const tire_reading`，因此不能调用 `set_pressure_kpa`；同一项复制构造函数也可以用来建立可修改的 `tire_reading` 对象。

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

`const tire_reading reported = measured;` 采用复制初始化（copy-initialization）。声明中的 `=` 属于初始化语法，`reported` 是正在建立的新对象，并没有先被默认构造，再接受赋值。普通赋值面对已经存在的目标，类的[复制赋值接口](02-copy-assignment-and-existing-object-state.md#赋值修改左侧的已有对象)在下一小节展开。

> [!IMPORTANT] 初始化形式与构造操作分别判断
> **直接列表初始化、复制初始化描述源码的初始化形式；复制构造描述由哪一类构造函数建立新对象。**不能仅凭花括号或 `=` 判断是否调用复制构造函数，还要看源表达式的类型、值类别与对应初始化规则。

保留开篇的头文件与完整类定义，用以下定义整体替换 `main`。这里将 `measured` 声明为 `const` 对象，它仍可作为 `reported` 与 `archived` 的复制源：

```cpp
int main() {
    const tire_reading measured{220, 36};
    const tire_reading reported = measured;
    const tire_reading archived{measured};
    const tire_reading fresh = tire_reading{220, 36};

    std::cout << reported.current_pressure_kpa() << ' ' << reported.current_temperature_c() << '\n';
    std::cout << archived.current_pressure_kpa() << ' ' << archived.current_temperature_c() << '\n';
    std::cout << fresh.current_pressure_kpa() << ' ' << fresh.current_temperature_c() << '\n';
}
```

程序输出：

```text
copy
copy
220 36
220 36
220 36
```

前两行分别来自 `reported` 与 `archived` 的构造。它们都从已有的 `measured` 建立新对象，各自调用一次当前的复制构造函数；`measured` 虽然是 `const` 对象，仍能绑定到 `const tire_reading&`。这项构造函数没有声明为 `explicit`，因此复制初始化也可以采用它。

构造 `fresh` 没有输出 `copy`。它的初始化器 `tire_reading{220, 36}` 是 `tire_reading` 类型的纯右值（prvalue）表达式，接收两个整数的构造函数直接初始化 `fresh`，没有先建立另一个独立读数对象，再把它复制给 `fresh`。

三份目标最初保存相同的读数，但源表达式、初始化形式与构造函数的组合不同：

| 目标 | 源表达式及值类别 | 初始化形式 | 本例采用的构造函数 |
| --- | --- | --- | --- |
| `reported` | `measured`：左值 | 复制初始化 | 复制构造函数 |
| `archived` | `measured`：左值 | 直接列表初始化 | 复制构造函数 |
| `fresh` | `tire_reading{220, 36}`：纯右值 | 复制初始化 | 接收两个整数的构造函数，直接初始化 `fresh` |

> [!WARNING] 类型相同不保证调用复制构造
> 把同类型初始化一律当成复制构造，会误判上面的 `fresh`。**在 C++23 中，用同类纯右值初始化本例这样的普通完整对象时，初始化直接作用于目标，不调用复制构造函数。**`fresh` 的声明采用复制初始化形式，仍然符合这项规则。
>
> 这是语言的初始化规则。接收两个整数的构造函数仍然完成成员初始化，不能把“没有复制”理解成“构造没有工作”。更完整的结果对象模型见[按值返回与结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)。

## 参考资料

- [C++23 工作草案：复制构造函数](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：初始化器](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：同类纯右值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general#16.6.1)
- [C++23 工作草案：成员子对象的初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init#7)
