---
title: 自动存储期与局部对象生命周期（Automatic Storage Duration and Local Object Lifetime）
date: 2026-08-26
---

# 自动存储期与局部对象生命周期（Automatic Storage Duration and Local Object Lifetime）

块作用域能够确定一个名称在源代码中的查找边界，却不能单独回答对象在运行时何时开始存在、何时不再存在。还需要区分存储期（storage duration）与生命周期（lifetime）。

## 名称、存储与对象

| 概念 | 约束的内容 | 回答的问题 |
| --- | --- | --- |
| 作用域（scope） | 声明与名称查找 | 在源代码的当前位置能够找到哪条声明 |
| 存储期（storage duration） | 对象所关联的存储 | 相应存储按照哪种规则保持可用 |
| 生命周期（lifetime） | 对象 | 对象在程序运行期间何时实际存在 |

**存储能够使用，不等于其中已经存在某个特定类型的对象；名称能够被找到，也不等于相应对象已经开始生命周期。**三者相互关联，但不能互相替代。

## 自动存储期（Automatic Storage Duration）

本篇把代码块中由普通变量定义创建的对象称为局部对象，例如：

```cpp
{
    int tire_count{4};
}
```

这条定义创建的 `int` 对象具有自动存储期（automatic storage duration）。与这个对象关联的存储会保持到程序执行离开相应代码块。

**自动存储期规定与对象关联的存储按照什么时间规则保持可用，但不承诺对象位于某个固定的物理位置。**在当前讨论的局部对象范围内，对象何时开始与结束生命周期，则由初始化、销毁及相应语句的规则共同确定。

## 生命周期的开始与结束

对于当前讨论的普通局部对象，程序每次实际执行到变量定义并完成初始化后，对象的生命周期开始；执行离开相应代码块时，对象的生命周期结束：

```cpp
{
    int tire_count{4}; // 初始化完成，tire_count 对象开始存在

    {
        int damaged_count{1}; // damaged_count 对象开始存在
    } // damaged_count 对象的生命周期结束

    tire_count += 1; // tire_count 对象仍然存在
} // tire_count 对象的生命周期结束
```

源代码中写有一条声明，不代表程序在任何时候都已经创建了相应对象。**只有执行实际到达声明并完成初始化，对象才会开始生命周期；只有已经建立的对象，才需要在离开相应代码块时销毁。**

右花括号是顺序执行中最直观的离开位置，但 `}` 本身不是“销毁运算符”。真正的规则是执行离开对象所属的代码块时结束生命周期。

## 销毁与逆序关系

对象生命周期的结束称为销毁（destruction）。一次执行离开代码块时，因这次离开而结束生命周期、并且已经完成初始化的自动存储期局部对象，会按照完成初始化顺序的相反顺序销毁：

```cpp
{
    int front_tire_pressure{240}; // 先完成初始化
    int rear_tire_pressure{250};  // 后完成初始化
} // 先销毁 rear_tire_pressure，再销毁 front_tire_pressure
```

对当前使用的 `int` 对象，生命周期结束没有额外可观察的清理动作。**销毁也不表示对象占用过的 bits 必须立即清零；它首先表示该对象已经不再存在，原来的存储不能继续被当作这个仍然存活的对象使用。**

逆序规则描述的是实际完成初始化的对象，而不是要求程序脱离执行过程，机械地把源文件中的全部声明倒序处理。

## 名称生效早于对象生命周期的陷阱

名称在初始化器之前已经能够参与查找，而对象要到初始化完成后才开始生命周期。这两个边界在同名声明中可能相遇：

```cpp
int tire_pressure{240};

{
    int tire_pressure{tire_pressure};
}
```

内层声明的变量名在初始化器中已经生效，因此花括号里的 `tire_pressure` 找到的是正在声明的内层变量，并不是外层对象。此时内层对象尚未完成初始化，生命周期也尚未开始；尝试读取它会在 C++23 中产生未定义行为。编译器可以发出警告，但这不是必须以语法错误拒绝的代码。

如果目的是读取外层对象的当前值，应当使用能够区分两个对象的名称：

```cpp
int tire_pressure{240};

{
    int observed_pressure{tire_pressure};
}
```

这也是避免在嵌套作用域中重复使用变量名的语义理由，而不只是排版偏好。

## 让声明位置表达所需生命周期

下面的 `pressure_difference` 先以没有业务意义的 `0` 创建，直到较晚的位置才通过赋值得到真正需要的状态：

```cpp
int pressure_difference{0};
int front_tire_pressure{240};
int rear_tire_pressure{250};

front_tire_pressure += 5;
pressure_difference = rear_tire_pressure - front_tire_pressure;
```

当计算所需的数据已经准备好时，再声明并直接初始化对象，名称的作用域和对象的生命周期都会更贴近真实用途：

```cpp
int front_tire_pressure{240};
int rear_tire_pressure{250};

front_tire_pressure += 5;

int pressure_difference{
    rear_tire_pressure - front_tire_pressure
};
```

**局部对象应当在已经能够确定有效初始状态、并且接近第一次使用的位置创建。**这既避免无意义的占位状态，也缩短了需要持续维护对象有效状态的时间。

## 参考资料

- [C++23 工作草案：自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：声明语句中的初始化与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++ Core Guidelines：ES.21 不要过早引入变量](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es21-dont-introduce-a-variable-or-constant-before-you-need-to-use-it)
