---
title: 封装与类不变式（Encapsulation and Class Invariants）
date: 2026-08-29
order: 5
---

# 封装与类不变式（Encapsulation and Class Invariants）

播放器用整数保存音量档位，约定只接受闭区间 `[0, 100]`：`0` 表示静音，`100` 表示界面允许的最高档位。`int` 也能表示 `-1`、`150`，因此“能存进整数”并不等于“可以作为音量设置”。

类型需要让新对象从合法档位开始，并在后续操作中继续满足范围约束。这里把“音量档位始终位于 `[0, 100]`”作为类不变式（class invariant）。

> [!IMPORTANT] 类不变式与可变状态
> **类不变式是对象完成初始化后，以及公开操作完成后应当满足的条件。**成员值可以改变，例如从 `50` 改为 `80`；不变的是这些状态都符合相同的约束。构造函数负责建立初始的有效状态，后续操作负责维持它。
>
> 这是类型设计对使用者的承诺。C++ 不会因为成员被声明为 `private`，就自动检查其数值是否符合业务条件。

## 初始化建立第一个有效状态

下面是独立的完整程序。`volume_setting` 从固定的合法档位 `50` 开始，不提供接收任意整数初值的构造函数：

```cpp
#include <iostream>

class volume_setting {
  public:
    volume_setting() : stored_level{50} {}

    int level() const {
        return stored_level;
    }

    bool try_set_level(const int requested_level) {
        const bool valid{(requested_level >= 0) && (requested_level <= 100)};

        if (!valid) {
            return false;
        }

        stored_level = requested_level;
        return true;
    }

  private:
    int stored_level;
};

int main() {
    const volume_setting current{};
    std::cout << current.level() << '\n';
}
```

`current{}` 调用默认构造函数，成员初始化器 `stored_level{50}` 直接给出初值。`50` 位于约定范围内，因此对象完成初始化时已经满足不变式，程序输出 `50`。

`level()` 按值读取当前档位；`try_set_level()` 接受一个候选档位，返回的 `bool` 表示请求是否被接受。私有成员限制外部代码直接使用 `stored_level` 这个名称，修改操作则负责验证准备保存的新值。

## 修改操作先验证再更新

保留上面的头文件和类定义，只把 `main` 替换为下面的版本。两次修改在同一个对象上按顺序发生：

```cpp
int main() {
    volume_setting current{};
    std::cout << current.level() << '\n';

    const bool accepted{current.try_set_level(80)};
    std::cout << accepted << ' ' << current.level() << '\n';

    const bool out_of_range_accepted{current.try_set_level(150)};
    std::cout << out_of_range_accepted << ' ' << current.level() << '\n';
}
```

程序依次输出 `50`、`1 80`、`0 80`；这里的布尔输出以 `1`、`0` 分别表示 `true`、`false`。对应的对象状态是：

| 执行完成的位置 | 请求是否被接受 | `current.level()` |
| --- | --- | ---: |
| 创建 `current` 后 | 尚无修改请求 | `50` |
| `try_set_level(80)` 后 | `true` | `80` |
| `try_set_level(150)` 后 | `false` | `80` |

`80` 满足两个范围比较，函数把它写入成员，再返回 `true`。`150` 不满足上限条件，函数在赋值之前返回 `false`，因此成员仍保存先前的 `80`。同样，`-1` 会被拒绝；边界值 `0`、`100` 都可以接受。

> [!IMPORTANT] 成功与失败后的对象状态
> **维护类不变式的修改操作，在完成后应当把对象留在有效状态；报告失败也不例外。**本例先验证候选值，再决定是否赋值：接受请求后保存合法的新档位，拒绝请求后保留原来的合法档位。
>
> 失败时保留原值是这个接口明确采用的行为。类不变式本身要求的是操作完成后仍满足约束，并不单独规定失败时必须怎样处理。

## 读取接口不暴露修改路径

下面的片段接在上一份 `main` 的末尾、右花括号之前。此时 `current` 保存 `80`：

```cpp
int observed{current.level()};
observed = 150;

std::cout << observed << ' ' << current.level() << '\n';
```

这次输出 `150 80`。`observed` 是独立的整数对象，修改它不会改写 `current` 的成员。`150` 可以作为普通 `int` 的值存在，音量类型的范围约束针对的是音量对象保存的状态。

现在单独考察一个会破坏约束的版本：只在开篇类定义的 `public` 部分加入下面的成员，其他成员保持不变。这个版本与前面的正常调用过程分开使用：

```cpp
int& unsafe_level() {
    return stored_level;
}
```

保留头文件和扩充后的类定义，把 `main` 替换为下面的独立版本：

```cpp
int main() {
    volume_setting current{};
    current.unsafe_level() = 150;

    std::cout << current.level() << '\n';
}
```

`unsafe_level()` 返回的引用指定 `current` 中原来的整数成员，调用方经它赋值，修改的就是这个成员。程序可以正常编译并输出 `150`；这次写入没有调用 `try_set_level()`，对象已经违反范围约束。

> [!WARNING] private 不会收回接口交出的修改能力
> **`private` 限制成员名称可以在哪些位置被使用；公开接口交出的可修改引用或指针，仍允许调用方经别名修改成员。**如果这条写入路径绕过范围验证，就可能破坏类不变式。
>
> 上面的调用没有直接使用私有名称，赋值也符合 C++ 的语言规则。被破坏的是类型承诺的业务约束，语言不要求编译器为此给出诊断。

对本例复制成本很低的 `int`，按值返回能够提供当前状态，又不交出内部成员的修改路径。返回可修改别名会把写入能力交给调用方，不适合让这个类型独立维护当前范围约束。

## 复制与赋值也要保持约束

回到没有 `unsafe_level()` 的正常类定义，以及成功设置为 `80` 后拒绝 `150` 的 `main`。把下面片段接在按值读取片段之后；`current` 仍保存 `80`：

```cpp
const volume_setting saved{current};
volume_setting restored{};
restored = saved;

std::cout << saved.level() << ' ' << restored.level() << '\n';
```

`saved` 从 `current` 建立副本，保存 `80`。`restored` 先按默认构造取得 `50`，随后通过整对象赋值接收 `saved` 的状态，改为 `80`，所以输出 `80 80`。

在这个只有一个 `int` 数据成员的类中，语言提供的复制和赋值操作按成员复制状态；私有数据成员不妨碍这些整对象操作。源对象已经保存合法档位，因此复制得到的对象、赋值后的目标对象也满足当前范围约束。这沿用了第九章[建立副本与复制赋值](../09-structures-and-object-composition/04-copying-and-assigning-struct-objects.md#赋值修改已有结构体对象)的成员语义。

`try_set_level()` 控制候选整数的写入，整对象赋值从已有的有效对象取得状态。它们都属于当前类型允许的状态变化；维护不变式需要覆盖全部创建与修改路径。

## 封装服务于约束而不是隐藏本身

> [!IMPORTANT] 封装集中维护状态约束
> **封装（encapsulation）将内部状态和操作这些状态的接口组织在同一类型中，使类型能够集中规定创建与修改的规则。**对于需要维持类不变式的类型，私有表示限制直接名称访问，公开操作规定可接受的状态变化，具体实现共同维护对使用者承诺的约束。

第九章的 [`position`](../09-structures-and-object-composition/01-user-defined-types-and-struct-definitions.md#用-struct-定义一种类型) 把横向、纵向坐标组织为一份位置记录，允许调用方分别读写两个分量。当前 `volume_setting` 则需要限制可接受的档位，由类型负责维护这项条件。

> [!PRACTICE] 根据数据约束选择接口形式
>
> | 建模需要 | 合适的接口安排 |
> | --- | --- |
> | 一组允许调用方独立读写的数据，例如当前的 `position` | 使用公开成员的 `struct`，直接提供数据记录 |
> | 对象需要持续满足约束，例如档位受限的 `volume_setting` | 使用 `class` 表达维护约束的意图，以公开操作保护私有表示 |
>
> 选择依据是数据允许怎样被使用，以及哪些条件需要由类型维护。`struct` 与 `class` 都能声明公开或私有成员；上表是建模约定，语言上的[默认成员访问区别](03-access-control-and-class-interfaces.md#struct-与-class-的默认访问)并没有改变。

## 参考资料

- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
- [C++23 工作草案：复制赋值的可用性与成员语义](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++ Core Guidelines：class 用于维持不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-class)
- [C++ Core Guidelines：构造函数应建立类不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-complete)
