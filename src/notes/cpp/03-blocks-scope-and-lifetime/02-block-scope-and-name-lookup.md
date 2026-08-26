---
title: 块作用域与名称查找（Block Scope and Name Lookup）
date: 2026-08-26
---

# 块作用域与名称查找（Block Scope and Name Lookup）

变量声明为对象引入名称，但这个名称并不是在源文件的所有位置都表示同一个对象。代码块除了组合语句，还会建立名称参与查找的边界。

## 块作用域（Block Scope）

**作用域（scope）描述一条声明能够在源代码的哪些区域参与名称查找（name lookup）。复合语句会引入一个覆盖该代码块的块作用域（block scope）。**

假设外围作用域中不存在其他名为 `tire_count` 的声明。下面的 `tire_count` 只能在相应声明生效后，由这个代码块的剩余部分找到：

```cpp
{
    tire_count += 1; // 错误：这里还找不到 tire_count 的声明

    int tire_count{4};
    tire_count += 2; // 正确：找到上面的声明
}

tire_count += 1; // 错误：已经离开相应的块作用域
```

这些错误属于名称查找失败。源代码中曾经出现过 `tire_count` 的声明，不代表任何位置都可以继续使用这个名称。

## 声明的生效位置

变量声明并不是等到分号之后才让名称生效。对于 `int tire_pressure{240};` 这种当前使用的简单变量声明，名称在变量名之后、初始化器之前已经生效。因此，初始化器开始求值时，`tire_pressure` 已经能够参与当前块作用域中的名称查找。

**名称能够被查找到，只说明查找已经选中相应声明，并不保证这个声明所定义的对象已经完成初始化。**

## 嵌套作用域中的名称查找

在当前只使用普通变量名的代码中，名称查找从名称所在的最内层块作用域开始；如果没有找到匹配声明，再继续查找外层作用域：

```cpp
{
    int tire_count{4};

    {
        int damaged_count{1};
        tire_count -= damaged_count;
    }

    tire_count += 1;
    damaged_count += 1; // 错误：外层找不到内层声明
}
```

内层代码能够找到外层的 `tire_count`，因为内层没有声明同名变量；`damaged_count` 的声明只属于内层块作用域，离开内层代码块后便不再参与外层的名称查找。

## 名称隐藏（Name Hiding）

内层代码块可以声明一个与外层变量同名的新变量。名称查找进入这条内层声明的生效区域后，会先找到内层声明，外层声明因而被隐藏（hidden）：

```cpp
{
    int tire_pressure{240};

    {
        int tire_pressure{200};
        tire_pressure += 5; // 修改内层对象，得到 205
    }

    tire_pressure += 10; // 再次找到外层对象，得到 250
}
```

这里存在两个彼此独立的 `int` 对象。内层声明只改变名称查找结果，不会修改外层对象当前保存的值；离开内层代码块后，外层声明重新成为查找结果。

同一个块作用域中不能用相同名称定义两个不同变量：

```cpp
{
    int tire_pressure{240};
    int tire_pressure{200}; // 错误：同一作用域中的声明冲突
}
```

因此需要区分：

| 情况 | 语言结果 |
| --- | --- |
| 同一块作用域中的冲突变量声明 | 程序不合法 |
| 本篇这种普通嵌套代码块重新使用外层名称 | 合法，但内层声明会隐藏外层声明 |

名称隐藏迫使读者持续判断当前名称究竟指定哪个对象。**变量名应当限制在满足用途的最小合理作用域中，并避免在嵌套作用域中重复使用相同名称。**

相关语言规则可参阅 C++23 工作草案中的[块作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.block)、[声明的生效位置](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.pdecl)与[非限定名称查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.unqual)。相关工程实践可参阅 C++ Core Guidelines 的 [ES.5：保持较小的作用域](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es5-keep-scopes-small)与 [ES.12：不要在嵌套作用域中重用名称](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es12-do-not-reuse-names-in-nested-scopes)。
