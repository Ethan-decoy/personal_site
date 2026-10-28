---
title: 自动存储期与局部对象生命周期（Automatic Storage Duration and Local Object Lifetime）
date: 2026-08-26
---

# 自动存储期与局部对象生命周期（Automatic Storage Duration and Local Object Lifetime）

删除图形时，程序需要暂时记录本次删除的数量；删除步骤结束后，图形总数还要继续使用。代码块既限定名称的查找范围，也影响这里的局部对象在运行时何时开始存在、何时不再存在。

以下代码片段各自独立，均放在 `main` 函数体内，使用普通的 `int` 局部数值对象。

## 名称、存储与对象

> [!IMPORTANT] 作用域、存储期与生命周期
> | 概念 | 约束的内容 | 回答的问题 |
> | --- | --- | --- |
> | 作用域（scope） | 声明与名称查找 | 在源代码的当前位置能够找到哪条声明 |
> | 存储期（storage duration） | 对象所关联的存储 | 相应存储按照哪种规则保持可用 |
> | 生命周期（lifetime） | 对象 | 对象在程序运行期间何时实际存在 |
>
> 存储能够使用，不等于其中已经存在某个特定类型的对象；名称能够被找到，也不等于相应对象已经开始生命周期。三者相互关联，但不能互相替代。

## 自动存储期（Automatic Storage Duration）

在代码块中定义一个保存图形总数的对象：

```cpp
{
    int shape_count{3};
}
```

这里由普通变量定义创建的对象是局部对象，具有自动存储期（automatic storage duration）。与它关联的存储按照代码块的执行规则管理，并保持到执行离开相应代码块。

> [!IMPORTANT] 自动存储期约束存储的可用期间
> **自动存储期规定与对象关联的存储按照什么时间规则保持可用，不承诺对象位于某个固定的物理位置。**对象的生命周期还要结合相应初始化与退出代码块的过程判断；“自动”也不保证对象自动取得初值 `0`。

## 生命周期的开始与结束

> [!IMPORTANT] 局部数值对象的生命周期边界
> **对于这里具有自动存储期的普通数值对象，取得满足类型要求的存储并完成相应初始化后，生命周期开始；执行离开它所属的代码块时，生命周期结束。**源代码中出现了一条声明，不表示相应对象在整个程序运行期间始终存在。

下面先计算删除后剩余的数量，再把结果写回总数。两个中间对象只在内层代码块中使用，总数在内层结束后仍要继续使用：

```cpp
{
    int shape_count{3};

    {
        int removed_count{1};
        int remaining_count{shape_count - removed_count};

        shape_count = remaining_count;
    } // 两个内层对象的生命周期结束

    shape_count += 1;
} // shape_count 对象的生命周期结束
```

按这一次顺序执行，各对象的生命周期与当前值如下：

| 执行位置 | `shape_count` 对象 | `removed_count` 对象 | `remaining_count` 对象 |
| --- | --- | --- | --- |
| 外层定义完成 | 开始，保存 `3` | 尚未开始 | 尚未开始 |
| 内层第一个定义完成 | 继续存在，保存 `3` | 开始，保存 `1` | 尚未开始 |
| 内层第二个定义完成 | 继续存在，保存 `3` | 继续存在，保存 `1` | 开始，保存 `2` |
| 赋值完成 | 继续存在，保存 `2` | 继续存在，保存 `1` | 继续存在，保存 `2` |
| 离开内层代码块 | 继续存在，保存 `2` | 结束 | 结束 |
| 外层加法完成 | 继续存在，保存 `3` | 已结束 | 已结束 |
| 离开外层代码块 | 结束 | 已结束 | 已结束 |

内层对象结束时，外层的 `shape_count` 仍然存在，并保存删除后的数量 `2`。最后一次加法继续修改这个对象，使它保存 `3`；赋值改变当前值，不会重新开始它的生命周期。

右花括号是顺序执行中最直观的离开位置，但 `}` 本身不是“销毁运算符”。真正的规则是执行离开对象所属的代码块时结束生命周期。

这里的“初始化完成”还需要与“已经获得确定值”分别判断。省略显式初始化器的普通局部 `int` 也会建立对象，例如：

```cpp
int shape_count;
shape_count = 3;
```

第一条声明属于默认初始化（default-initialization）；对于这里的 `int`，这种初始化不写入数值。声明执行完毕后，对象的生命周期已经开始，但它仍具有不确定值（indeterminate value）。第二条赋值直接写入 `3`，不读取对象原先的值。

> [!IMPORTANT] 对象存在与数值可读分别判断
> **对象的生命周期已经开始，不保证它已有可安全读取的确定值。这里没有显式初值的普通局部 `int` 不会自动得到 `0`；在有效赋值之前读取其不确定值，会在 C++23 中产生未定义行为。**

## 销毁与逆序关系

对于这些普通局部数值对象，离开所属代码块时的销毁（destruction）会结束其生命周期。

> [!IMPORTANT] 本次退出的对象按初始化逆序销毁
> **一次离开代码块时，因这次退出需要销毁、且已经完成相应初始化的自动存储期局部对象，按照初始化顺序的相反顺序销毁。**要先确定这次离开影响哪些对象，再在这些对象之间判断逆序。

回到上面的删除代码，内层先完成 `removed_count` 的初始化，再完成 `remaining_count` 的初始化：

| 离开的位置 | 本次销毁的对象，按先后排列 | 仍然存在的外层对象 |
| --- | --- | --- |
| 内层的 `}` | `remaining_count` → `removed_count` | `shape_count` |
| 外层的 `}` | `shape_count` | 无 |

内层退出时已经结束的两个对象，不会在外层退出时再次销毁。逆序规则描述实际完成初始化、并因本次退出而结束生命周期的对象，不能脱离执行过程，把整份源代码中的全部声明机械倒序处理。

对这里的 `int` 对象，销毁没有额外可观察的清理动作。生命周期结束不要求曾占用的比特立即清零；原来的存储也不能继续被当作这个仍然存活的对象使用。

## 名称生效早于对象生命周期的陷阱

内层同名声明在初始化器之前已经生效。下面初始化器中的 `shape_count` 找到的是内层声明，因而指定正在定义的内层对象：

```cpp
int shape_count{3};

{
    int shape_count{shape_count}; // 未定义行为：读取尚未开始生命周期的内层对象
}
```

> [!WARNING] 能找到声明不保证可以读取对象
> **初始化器中的名称成功找到内层声明，但这个对象尚未完成初始化，生命周期也尚未开始；读取它会在 C++23 中产生未定义行为。**编译器可能发出警告，这不是必须以语法错误拒绝的代码；某次运行产生了数值，也不能证明读取有效。

如果目的是读取外层对象的当前值，应当使用能够区分两个对象的名称：

```cpp
int shape_count{3};

{
    int observed_count{shape_count};
}
```

这里的初始化器找到外层的 `shape_count`，读取它已经保存的 `3`，让新对象 `observed_count` 也保存 `3`。离开内层后，`observed_count` 的生命周期结束，外层对象仍然存在。这也说明，区分不同对象的名称能够避免实际的读取错误。

## 让声明位置表达所需生命周期

计算一次删除后剩余的数量之前，先把图形总数增加 `1`。下面的 `remaining_count` 在计算所需的数据尚未准备好时，以占位值 `0` 创建，随后才通过赋值得到结果：

```cpp
int remaining_count{0};
int shape_count{3};
int removed_count{1};

shape_count += 1;
remaining_count = shape_count - removed_count;
```

当计算所需的数据已经准备好时，再声明并直接初始化对象，名称的作用域和对象的生命周期都会更贴近真实用途：

```cpp
int shape_count{3};
int removed_count{1};

shape_count += 1;

int remaining_count{shape_count - removed_count};
```

两份代码最终都使 `shape_count` 保存 `4`、`removed_count` 保存 `1`、`remaining_count` 保存 `3`。后一份在输入数据就绪后才创建 `remaining_count`，直接建立它当前要表达的状态，省去了先保存占位值、再赋值的阶段。

> [!PRACTICE] 在能够确定有效初值时创建对象
> **局部对象应当在已经能够确定有效初始状态、并且接近第一次使用的位置创建。**声明位置应贴近对象的实际用途，使名称的作用域和对象的生命周期与所需步骤对应，减少需要持续追踪的中间状态。

## 参考资料

- [C++23 工作草案：自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：初始化与默认初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.general)
- [C++23 工作草案：声明的生效位置](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.pdecl)
- [C++23 工作草案：声明语句中的初始化与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++ Core Guidelines：ES.21 不要过早引入变量](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es21-dont-introduce-a-variable-or-constant-before-you-need-to-use-it)
