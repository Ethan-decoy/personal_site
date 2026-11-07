---
title: 对象组合与生命周期关系（Object Composition and Lifetime Relationships）
date: 2026-08-28
order: 6
---

# 对象组合与生命周期关系（Object Composition and Lifetime Relationships）

绘图程序可以用中心位置和半径描述一个圆。中心位置本身包含横向、纵向两个分量，可以作为圆对象中的一个成员。由完整对象与成员子对象逐层建立更大对象的方式称为对象组合（object composition）。

## 以值包含建立成员子对象

这里使用[包含横向、纵向两个分量的 `position`](01-user-defined-types-and-struct-definitions.md#用-struct-定义一种类型)。将下面的 `circle` 定义放在 `position` 定义之后、`main` 之前，对象定义放在 `main` 中，后面的更新片段接在对象定义之后：

```cpp
struct circle {
    position center;
    int radius;
};

circle marker{position{20, 10}, 5};
```

`marker` 是完整 `circle` 对象，其中直接包含：

- 一个 `position` 成员子对象 `marker.center`；
- 一个 `int` 成员子对象 `marker.radius`。

`marker.center` 又包含自己的两个整数成员子对象。

最外层的两个初始化器按 `circle` 的成员声明顺序对应：`position{20, 10}` 用于初始化 `marker.center`，`5` 用于初始化 `marker.radius`。内层 `position{20, 10}` 中的 `20`、`10` 又分别用于初始化 `marker.center.x`、`marker.center.y`。

成员访问可以沿组合关系继续确定目标：

```cpp
marker.center.x = 35;
```

第一个 `.` 在 `marker` 中确定 `center`，第二个 `.` 再在这个 `position` 成员子对象中确定 `x`。最终被赋值的是整数成员 `marker.center.x`；中心的 `y` 仍为 `10`，半径仍为 `5`。

```text
marker
├── center
│   ├── x    35
│   └── y    10
└── radius    5
```

复制 `circle` 时，成员复制规则会逐层应用：新的 `center` 由源对象的 `center` 初始化，其中的两个整数成员再按各自语义复制；若某一层包含指针成员，复制到该层时仍然只复制指针值。

创建 `marker` 时，直接成员按声明顺序初始化，先建立 `marker.center`，再建立 `marker.radius`。`marker.center` 的存储期与 `marker` 相同，并在外层对象的初始化和销毁过程中完成自身的初始化与销毁。

> [!IMPORTANT] 以值包含建立成员子对象
> **直接声明对象类型的数据成员，会在这里的完整对象内部建立真正的成员子对象。**中心位置是这个圆对象的一部分，其存储期随完整对象；引用或指针不能把它保留到包含它的存储期结束之后。

## 指针成员只建立外部关联

程序还可以保存当前选中的位置，让选择记录指向一个独立的位置对象。下面是独立示例：保留 `position` 定义，将新类型定义放在 `main` 之前，其余定义放在 `main` 中：

```cpp
struct position_selection {
    const position* target{nullptr};
};

const position current{20, 10};
const position_selection selected{&current};
```

`selected` 直接包含的是 `const position*` 指针成员子对象。在当前设计中，这个裸指针用于观察外部对象；`current` 仍然位于 `selected` 外部，是独立的完整对象：

```text
selected
└── target  ──指向──>  current
    指针成员子对象       独立 position 对象
```

销毁 `selected` 会结束指针成员的生命周期，不会因此销毁 `current`。反过来，`current` 先结束生命周期时，指针成员也不会自动变为空。

下面是独立的错误片段，使用相同的类型定义，放在 `main` 中仅作生命周期分析；不执行最后一行读取：

```cpp
position_selection selected{nullptr};

{
    const position local_position{20, 10};
    selected.target = &local_position;
}

const int x{selected.target->x}; // 未定义行为：原目标的生命周期已结束
```

离开内层代码块后，`local_position` 的生命周期和自动存储期结束，`selected.target` 成为悬空指针。外层的选择记录仍然存在，但原来选中的位置已经不存在。

> [!IMPORTANT] 指针成员与外部目标的独立性
> **指针成员属于完整对象，被它指向的外部对象并不因此成为这个完整对象的成员子对象。**指针只记录访问关系，不会使外部目标获得与选择记录相同的生命周期。

> [!WARNING] 选择记录仍在，目标也可能已经销毁
> 指针成员没有自动清空，不能证明原目标仍然有效。继续通过上面的旧指针值读取原成员，会产生未定义行为；读取已因存储期结束而失效的旧值再与 `nullptr` 比较，也不是可移植的有效性检查。

## 组合表达强生命周期关系

直接成员与指针成员表达两种不同关系：

| 成员形式 | 完整对象直接包含什么 | 位置对象能否缺少 | 该声明是否直接建立位置子对象 |
| --- | --- | --- | --- |
| `position center;` | `position` 成员子对象 | 不能 | 是 |
| `const position* target;` | 指针成员子对象 | 可以没有目标 | 否 |

选择记录也可以指向其他对象的成员，例如 `marker.center`。这个中心仍是 `marker` 的成员子对象，选择记录直接包含的仍只有指针；访问关系不会改变目标原有的成员归属。

> [!PRACTICE] 根据包含关系选择成员形式
> 中心位置是圆的状态组成部分，应随圆对象一起建立和结束，以值包含能够直接表达这项关系。选择记录只观察独立位置、允许没有目标时，指针成员表达外部关联；使用者必须另外保证目标在访问期间有效。

简单结构体能够把状态组织、复制并逐层组合，却不会自动保证成员值符合业务条件。例如，`radius` 的 `int` 类型允许保存负数，而绘图程序可以要求半径非负。类型需要持续维护这样的条件时，仅有数据组合还不够，还需要安排相应的操作接口。

## 参考资料

- [C++23 工作草案：对象与子对象](https://timsong-cpp.github.io/cppwp/n4950/intro.object)
- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：聚合初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：成员初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
