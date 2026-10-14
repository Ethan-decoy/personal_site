---
title: 临时对象与生命周期延长（Temporary Objects and Lifetime Extension）
date: 2026-08-28
order: 4
---

# 临时对象与生命周期延长（Temporary Objects and Lifetime Extension）

prvalue 为所在语境计算值，但不能因此把每个 prvalue 都想象成已经占据存储的匿名对象。当引用绑定确实需要对象身份时，C++ 可以根据 prvalue 物化临时对象（temporary object），再让引用绑定到这个对象。

## 引用绑定会使临时对象物化

```cpp
const int& answer{40 + 2};
```

`40 + 2` 是 `int` 类型的 prvalue。为了初始化 `const int&`，引用初始化先按被引用类型调整 cv 限定，再发生临时对象物化（temporary materialization）：程序建立一个保存 `42` 的临时 `const int` 对象，并把 `answer` 绑定到这个对象。

```text
40 + 2  ──计算──>  prvalue 42  ──物化──>  临时 const int 对象
                                                 ↑
                                              answer
```

临时对象没有由程序员提供的名称，但仍然是对象，具有类型、身份和生命周期。`answer` 是引用变量，不是这个临时对象本身。

## 直接绑定可以延长临时对象的生命周期

普通临时对象通常在包含其创建位置的完整表达式结束时销毁。前面的声明属于一项特定的生命周期延长（lifetime extension）语境：引用变量通过相应的临时物化结果直接完成绑定，临时对象因此持续到 `answer` 的生命周期结束。

如果这条声明位于普通函数代码块中，临时 `const int` 对象会与 `answer` 一同保持到离开相应作用域：

```cpp
{
    const int& answer{40 + 2};

    int recorded_answer{answer}; // 正确：临时对象仍然存在
} // answer 与被延长生命周期的临时对象到达结束边界
```

`recorded_answer` 是读取 `answer` 所指对象后创建的独立 `int` 对象，不依赖临时对象继续存活。

**不是引用本身普遍让目标“续命”，而是特定的引用初始化语境改变了相应临时对象的销毁时刻。**

## 类型转换可能改变实际绑定目标

`const` 左值引用能够接受比普通左值引用更广的初始化器，但它不保证始终绑定初始化器原先指定的对象。初始化需要改变类型时，绑定目标可能是转换结果对应的临时对象：

```cpp
short sample_count{3};
const int& displayed_count{sample_count};

sample_count = 4;
```

`displayed_count` 的目标类型是 `const int`，而 `sample_count` 是 `short` 对象。初始化过程读取 `sample_count` 当前保存的 `3`，提升为 `int` 值 `3`，物化一个临时 `const int` 对象，再把引用绑定到这个临时对象。

因此，最后 `displayed_count` 仍然读取到 `3`，并不会跟随 `sample_count` 变成 `4`：

```text
sample_count ──读取并提升──> 临时 const int 对象 3
    short 对象                           ↑
                                    displayed_count
```

**引用是否保留初始化器原对象的身份，取决于引用初始化能否直接绑定；只看初始化器中出现了哪个对象名称并不充分。**

## 生命周期延长不会沿引用关系传播

生命周期延长取决于创建临时对象时的初始化语境。再让另一个引用绑定已有目标，只增加一条访问关系，不会重新决定这个目标的销毁时刻。

因此，判断引用是否有效，要先找到实际目标，再按最初的创建与绑定语境确定结束点。前面的 `answer` 直接绑定物化结果，目标与它一同结束；`displayed_count` 则绑定类型转换产生的新目标，并没有保留 `sample_count` 的身份。

函数边界还会带来另一种情况：临时对象绑定引用参数后，只持续到包含调用的完整表达式结束。即使函数返回同一对象的引用，调用者再次绑定也不能延长它。将参数与返回组合起来的[完整过程](06-reference-returns-and-lifetime-boundaries.md#临时实参不会因引用返回而延长)放在引用返回的对象关系之后。

## 合法特性不等于默认写法

`const int& answer{40 + 2};` 是说明临时对象与生命周期规则的合法示例。对于 `int` 这种直接保存即可的简单结果，通常创建值对象更清楚：

```cpp
const int answer{40 + 2};
```

这条声明直接创建保存 `42` 的 `const int` 对象，不需要读者追踪引用目标和生命周期延长。引用绑定临时对象在接口适配中具有实际作用，但不应仅为了避免一个简单数值对象而成为默认选择。

## 参考资料

- [C++23 工作草案：值类别](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：临时对象](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
