---
title: 隐式复制操作与成员语义（Implicit Copy Operations and Member Semantics）
date: 2026-09-03
order: 3
---

# 隐式复制操作与成员语义（Implicit Copy Operations and Member Semantics）

压力记录保存测量时的读数，同时关联当前共用的报警上限。保存一份记录时，需要保留测量值；报警上限仍由外部配置对象提供，配置改变后，各份记录应能读取新的上限。

下面的类定义中没有写出复制构造函数或复制赋值运算符的声明，C++ 会为本例提供相应函数的隐式声明（implicit declaration）。实际复制能否成立，还要看各成员能否完成所需的初始化或赋值。

## 复制构造按成员初始化新对象

`pressure_record` 的 `stored_pressure_kpa` 保存测量值，`observed_warning_limit_kpa` 保存指向外部报警上限的非拥有指针。两个压力数值都以千帕（kPa）解释。`warning_limit_target()` 返回这条观察路径，不为上限建立副本，也不接管其生命周期。

下面是独立的完整程序，类定义位于 `main` 之前。后续注明追加的片段均放在同一个 `main` 的末尾、右花括号之前，按正文顺序接续：

```cpp
#include <iostream>

class pressure_record {
  public:
    pressure_record(const int initial_pressure_kpa, const int* const warning_limit_kpa)
        : stored_pressure_kpa{initial_pressure_kpa}, observed_warning_limit_kpa{warning_limit_kpa} {
    }

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

    const int* warning_limit_target() const {
        return observed_warning_limit_kpa;
    }

  private:
    int stored_pressure_kpa;
    const int* observed_warning_limit_kpa;
};

int main() {
    int warning_limit_kpa{250};

    const pressure_record measured{220, &warning_limit_kpa};
    const pressure_record archived{measured};

    std::cout << archived.pressure_kpa() << ' ' << *archived.warning_limit_target() << '\n';
    std::cout << (&archived == &measured) << '\n';
}
```

类中写出的两参数构造函数接收初始读数和观察目标，不妨碍当前复制构造函数的隐式声明。语言为本例提供了公开的 `pressure_record(const pressure_record&)`，`archived{measured}` 使用的就是这项复制构造函数。

新对象的两个成员按照声明顺序分别初始化：

- `archived.stored_pressure_kpa` 取得源记录中保存的整数 `220`，成为新记录自己的测量值。
- `archived.observed_warning_limit_kpa` 取得源记录中的指针值，仍指向原来的 `warning_limit_kpa`。上限数值 `250` 继续由这一个外部整数对象保存。

程序先输出 `220 250`，分别是归档记录保存的压力与经指针读到的上限；随后输出 `0`，表示 `archived` 与 `measured` 是两个不同对象。外部上限先于记录创建，在这些记录销毁后才结束生命周期，因此本例的间接读取目标始终有效。

> [!IMPORTANT] 隐式复制遵循成员自己的操作
> **对本节这样的简单类，隐式复制构造用源对象的对应成员初始化新成员；隐式复制赋值则给已有目标中的对应成员赋值。**对本例，整数成员复制整数值，指针成员复制指针值。成员本身若是类对象，还需采用该成员类型相应的构造或赋值操作。
>
> “隐式声明”说明函数声明由语言规则提供，不保证操作必然可用。实际复制仍需满足相应成员操作的条件；“按成员”描述语言语义，具体机器指令由实现选择，不能据此把任意类的复制理解为直接复制原始字节。

## 复制赋值按成员修改已有对象

显示记录 `displayed` 已经存在，最初保存压力 `180`，尚未关联报警上限。继续在开篇 `main` 的末尾追加：

```cpp
pressure_record displayed{180, nullptr};
const pressure_record* const displayed_identity{&displayed};

std::cout << displayed.pressure_kpa() << ' ' << (displayed.warning_limit_target() == nullptr)
          << '\n';

displayed = measured;

std::cout << displayed.pressure_kpa() << ' '
          << (displayed.warning_limit_target() == &warning_limit_kpa) << ' '
          << (displayed_identity == &displayed) << '\n';
```

`displayed = measured` 选择当前隐式声明的复制赋值运算符，其形式为 `pressure_record& operator=(const pressure_record&)`。它先把目标的整数成员从 `180` 更新为 `220`，再让指针成员从 `nullptr` 改为指向 `warning_limit_kpa`。两个成员及其完整对象都延续原有身份，`displayed` 没有被销毁或重新构造。

追加部分先输出 `180 1`，表示原压力为 `180`、指针为空；随后输出 `220 1 1`，表示压力已变为 `220`、指针改指外部上限，目标对象仍位于先前的位置。赋值前的空指针没有目标；后文经 `displayed` 读取上限时，这项赋值已经为它建立了有效的观察路径。

## 指针成员复制后保留原有别名

现在三份记录都已存在。继续在同一个 `main` 的末尾追加，先比较目标，再把外部上限从 `250` 改为 `240`：

```cpp
std::cout << (archived.warning_limit_target() == measured.warning_limit_target()) << ' '
          << (displayed.warning_limit_target() == measured.warning_limit_target()) << '\n';

warning_limit_kpa = 240;

std::cout << *measured.warning_limit_target() << ' ' << *archived.warning_limit_target() << ' '
          << *displayed.warning_limit_target() << '\n';
std::cout << measured.pressure_kpa() << ' ' << archived.pressure_kpa() << ' '
          << displayed.pressure_kpa() << '\n';
```

这部分输出：

```text
1 1
240 240 240
220 220 220
```

第一行的两个 `1` 确认三份记录的指针指向同一个目标，关系如下。箭头从各记录的指针成员指向外部整数，方括号表示这个整数的值变化：

```text
measured.observed_warning_limit_kpa  ──┐
archived.observed_warning_limit_kpa  ──┼──> warning_limit_kpa [250 → 240]
displayed.observed_warning_limit_kpa ──┘
```

`warning_limit_kpa = 240` 修改的是这一个外部整数，没有改变三个指针保存的指向。随后每次间接读取都访问同一个上限对象，因此三份记录都读到当前的 `240`；各自保存的测量值仍为 `220`。

> [!IMPORTANT] 指针成员独立，外部目标仍可共享
> **复制当前记录会建立或更新各自的成员对象；指针成员接收的是指针值，外部上限不会因此产生副本。**三个记录及其指针成员各有身份，沿这些指针访问的却是同一个上限对象。
>
> 这种共享来自成员自身的指针语义，不是隐式复制额外建立的同步机制。记录只借用外部目标，复制指针不会延长该目标的生命周期；每次间接访问仍须保证目标有效。

> [!WARNING] const 记录不冻结外部配置
> `archived` 虽然是 `const pressure_record`，它保存的指针也通过 `const int*` 提供只读访问，外部的 `warning_limit_kpa` 仍可通过自己的名称修改。**把归档记录声明为 `const`，不能据此预期它一直读到旧上限 `250`。**本例读取到的是更新后的 `240`。
>
> 当前记录保存的是测量值与观察路径。若要保留保存时的上限数值，就需要另存那一刻的整数值，不能只复制指针。

## 成员约束会传递给完整类

前面的 `observed_warning_limit_kpa` 声明为 `const int*`：`const` 限制通过指针修改上限，指针成员自身仍能在可修改的 `displayed` 中接收新值。若成员对象自身是 `const`，复制构造与复制赋值的条件就可能不同。

下面是另一份独立的完整程序，不与前面的类和 `main` 拼接。`sensor_id` 保存测量来源的编号，`pressure_kpa` 保存压力；编号在记录创建后固定。编号是数据字段，两份独立记录可以保存相同编号：

```cpp
#include <iostream>

struct identified_pressure {
    const int sensor_id;
    int pressure_kpa;
};

int main() {
    const identified_pressure measured{17, 220};
    const identified_pressure archived{measured};
    identified_pressure displayed{23, 180};

    std::cout << archived.sensor_id << ' ' << archived.pressure_kpa << '\n';
    std::cout << displayed.sensor_id << ' ' << displayed.pressure_kpa << '\n';
}
```

程序输出 `17 220` 和 `23 180`。归档记录的编号来自源记录，显示记录则保存创建时给出的编号 `23`。这里让 `displayed` 的完整对象保持可修改，以单独检查其成员的约束。

若在这份 `main` 的末尾追加下面的错误语句，程序就不能通过编译：

```cpp
displayed = measured; // 错误：当前隐式复制赋值不可用
```

两项操作对目标编号成员的要求不同：

| 操作 | 对目标编号成员的要求 | 能否成立 |
| --- | --- | --- |
| `archived{measured}` | 初始化新的 `const int` 成员，使其保存源记录中的 `17` | 可以 |
| `displayed = measured` | 给已有的 `const int` 成员赋值，把编号从 `23` 改为 `17` | 不可以 |

这也说明了开篇“隐式声明不保证操作可用”的含义。语言仍隐式声明当前类的复制赋值运算符，但它因成员约束而不可调用。这条调用在编译时就不合法，无法进入赋值函数执行成员更新。

> [!WARNING] 能复制构造不保证能复制赋值
> **复制构造需要初始化新成员，复制赋值需要修改已有成员，两项操作的条件分别判断。**本例的 `const int` 成员允许取得初值，却不允许后续赋值，因此建立副本合法、给已有对象赋值不合法。
>
> 目标完整对象没有 `const` 限定，也不能绕过其成员自身的约束。隐式声明不保证函数可调用；[默认与删除复制操作](04-defaulted-and-deleted-copy-operations.md#default-不能越过成员约束)进一步说明这类不可用操作的声明与调用规则。

对本节这些简单类，先区分复制构造与复制赋值，再逐一检查对应成员的初始化或赋值是否成立。若某个类类型成员无法完成所需的复制操作，外围类的相应隐式操作也不会绕过它。

## 参考资料

- [C++23 工作草案：复制构造函数的隐式声明](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor#6)
- [C++23 工作草案：复制构造的成员语义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor#14)
- [C++23 工作草案：复制赋值运算符的隐式声明](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign#2)
- [C++23 工作草案：复制赋值的成员语义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign#12)
- [C++23 工作草案：成员约束导致默认赋值不可用](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign#7)
