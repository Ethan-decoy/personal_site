---
title: 复合语句、块作用域与局部对象生命周期
date: 2026-08-13
---

# 复合语句、块作用域与局部对象生命周期

## 复合语句与代码块

变量声明能够创建对象，表达式后接分号能够形成表达式语句。C++ 还允许将零条或多条语句放在一对花括号之间，使它们在语法上组成一个整体：

```cpp
{
    int remaining_count{3};
    remaining_count += 1;
}
```

花括号内部第一行的变量声明构成声明语句（declaration statement），第二行是表达式语句；包括花括号在内的整个结构本身也是一条语句。**这种能够容纳多条语句的结构称为复合语句（compound statement），也称为代码块（block）。**

复合语句可以包含任意数量的语句，也可以不包含任何语句。空的复合语句写作：

```cpp
{
}
```

**复合语句由右花括号 `}` 结束，其后不需要分号。**

### 不同语法位置中的花括号

此前已经在变量初始化中使用过花括号：

```cpp
int count{3};
```

这里的 `{3}` 是初始化器，不是代码块。相比之下，下面最外层的一对花括号构成复合语句，内部的 `{3}` 仍然是初始化器：

```cpp
{
    int count{3};
}
```

因此，**花括号本身并不始终表示代码块；它的含义取决于所在的语法位置。**

## 块作用域

声明引入的名称并不是在源文件的所有位置都可以使用。**名称能够参与查找的源代码区域称为它的作用域（scope）。复合语句会建立一个块作用域（block scope）；**在其中声明的名称，从声明生效的位置开始，可以在该代码块的剩余部分使用：

```cpp
{
    int tire_count{4};
    tire_count += 2; // 可以找到 tire_count
}
```

**越过代码块末尾的右花括号后，这个块作用域随之结束，后面的代码不能再通过 `tire_count` 找到这条声明：**

```cpp
{
    int tire_count{4};
}

tire_count += 2; // 错误：这里找不到 tire_count
```

### 嵌套作用域

一个复合语句可以出现在另一个复合语句内部，由此形成嵌套的块作用域。内层代码块可以使用在外层作用域中已经生效的名称：

```cpp
{
    int tire_count{4};

    {
        tire_count += 2; // 可以找到外层声明的 tire_count
        int damaged_count{1};
    }

    tire_count += 1;    // 仍然可以找到 tire_count
    damaged_count += 1; // 错误：这里找不到 damaged_count
}
```

**`tire_count` 声明在外层代码块中，因此它的作用域覆盖相应的内层代码块。`damaged_count` 只声明在内层代码块中，它的名称不能越过该代码块的右花括号进入外层作用域。**

## 局部对象的生命周期

**作用域描述名称能够在源代码的哪些位置参与查找，生命周期（lifetime）则描述对象在程序运行期间实际存在的时间。**对于目前讨论的普通局部对象，程序执行到它的声明并完成初始化后，对象的生命周期开始；离开它所在的代码块时，生命周期结束。

```cpp
{
    int tire_count{4}; // 初始化完成，tire_count 对象开始存在

    {
        int damaged_count{1}; // damaged_count 对象开始存在
    } // damaged_count 对象的生命周期结束

    tire_count += 1; // tire_count 对象仍然存在
} // tire_count 对象的生命周期结束
```

对象生命周期的结束也称为销毁（destruction）。**销毁并不表示对象占用的内存一定会被立即清零；它首先表示该对象不再存在，原来的存储不能再被当作这个仍然存活的对象使用。**

**同一代码块中的局部对象，会按照完成初始化顺序的相反顺序销毁：**

```cpp
{
    int front_tire_pressure{240}; // 先完成初始化
    int rear_tire_pressure{250};  // 后完成初始化
} // 先销毁 rear_tire_pressure，再销毁 front_tire_pressure
```

对于 `int` 这样的基本类型，销毁通常没有可以直接观察到的额外动作。但以后接触能够管理文件、内存或锁等资源的对象时，逆序销毁会成为 C++ 自动释放资源的重要基础。

> 这里讨论的是随代码块执行而创建和销毁的普通局部对象；其他存储方式以及对象销毁时能够执行的具体操作，将在后续内容中继续展开。

## 基本编码习惯

**局部对象应在已经能够确定初始值、并且即将首次使用的位置声明，同时放在满足其用途的最小合理作用域中。这样既能避免名称在无关代码中被误用，也能让对象在不再需要时结束生命周期。**

下面的 `pressure_difference` 在尚不需要时就已经被声明，先用没有实际意义的 `0` 初始化，之后才通过赋值建立真正需要的值：

```cpp
{
    int pressure_difference{0};
    int front_tire_pressure{240};
    int rear_tire_pressure{250};

    front_tire_pressure += 5;

    pressure_difference =
        rear_tire_pressure - front_tire_pressure;
}
```

更清晰的写法是在计算所需的数据准备好之后，再声明并直接初始化 `pressure_difference`：

```cpp
{
    int front_tire_pressure{240};
    int rear_tire_pressure{250};

    front_tire_pressure += 5;

    int pressure_difference{
        rear_tire_pressure - front_tire_pressure
    };
}
```

此时，`pressure_difference` 的名称只在真正需要的位置之后生效，对象也不会提前进入一个没有用途的状态。通过调整声明位置便可以自然缩小作用域，不需要机械地增加花括号。

**在嵌套作用域中，也应避免为不同对象重复使用相同的变量名，以免读者误判代码实际访问的是哪一个对象。**

相关实践可参阅 C++ Core Guidelines 的 [ES.5：保持较小的作用域](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es5-keep-scopes-small)、[ES.12：不要在嵌套作用域中重用名称](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es12-do-not-reuse-names-in-nested-scopes)与 [ES.21：不要过早引入变量](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es21-dont-introduce-a-variable-or-constant-before-you-need-to-use-it)。
