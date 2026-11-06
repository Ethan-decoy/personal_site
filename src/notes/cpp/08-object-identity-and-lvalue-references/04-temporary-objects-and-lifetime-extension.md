---
title: 临时对象与生命周期延长（Temporary Objects and Lifetime Extension）
date: 2026-08-28
order: 4
---

# 临时对象与生命周期延长（Temporary Objects and Lifetime Extension）

`const` 左值引用既可以绑定已有对象，也可以在初始化时绑定由计算结果建立的临时对象（temporary object）。判断引用能否继续使用，要分别找出实际目标，以及这个目标何时结束生命周期。

以下示例使用普通整数类型，代码片段均位于 `main` 的函数体内，各片段彼此独立。这里先讨论块作用域中的局部 `const` 左值引用。

## 引用何时需要临时绑定目标

```cpp
const int value{42};
const int& view{value};
const int& answer{40 + 2};
```

`view` 的初始化器 `value` 是指定已有对象的 lvalue，因此引用直接绑定到 `value`。这次绑定不需要读取并复制其中的整数。

`answer` 的初始化器 `40 + 2` 则是 `int` 类型的 prvalue，提供计算结果 `42`。为了得到可绑定的目标，引用初始化用这个结果建立一个新的临时 `const int` 对象，再让 `answer` 绑定到它。这个过程称为临时对象物化转换（temporary materialization conversion）；新目标的类型由这里的 `const int&` 初始化规则确定。

这种局部 `const int&` 初始化还会让临时目标保持到 `answer` 的生命周期结束。绑定完成后，通过两个引用读取都能得到 `42`，但它们指定的是不同对象：

| 引用初始化 | 初始化器的类型与值类别 | 实际绑定目标 |
| --- | --- | --- |
| `const int& view{value};` | `const int` lvalue | 已有的具名对象 `value` |
| `const int& answer{40 + 2};` | `int` prvalue | 新物化的临时 `const int` 对象 |

这里有两个整数对象：`value` 和临时目标。临时目标具有自己的类型、身份和生命周期，只是没有通过对象声明获得单独的变量名；`answer` 是引用的名称，通过它可以访问该目标。`view` 与 `answer` 都是引用变量，引用本身不是对象。

> [!IMPORTANT] prvalue 与临时绑定目标
> **在这里的 `const int&` 初始化中，算术 prvalue 可以通过物化建立临时目标，供引用绑定。**算术表达式仍是 prvalue；绑定后的引用名称表达式是指定临时对象的 lvalue。临时对象与引用是不同实体，临时对象有自己的身份和生命周期。

## 局部引用初始化的生命周期延长

对这里的初始化声明，完整表达式（full-expression）包含初始化器的求值、必要的转换以及完成初始化的过程；声明末尾的分号标记这次求值结束。

临时对象通常在创建它的完整表达式结束时销毁，但下面这个局部引用初始化满足生命周期延长（lifetime extension）的条件：临时目标越过声明末尾的分号，继续保持到引用 `answer` 的生命周期结束。

下面是独立示例。用于保存数值的 `saved` 在内层块之外创建：

```cpp
int saved{0};

{
    const int& answer{40 + 2}; // 临时目标在本行分号之后仍然存在

    saved = answer;
} // answer 的生命周期结束，临时目标在这里销毁

const int result{saved}; // 42
```

`saved = answer;` 在临时目标仍存在时读取其中的 `42`，写入外层已经存在的 `saved` 对象。它保存的是整数值，不是对临时目标的引用：

| 执行位置 | 临时目标的状态 | `saved` 的值 |
| --- | --- | --- |
| `answer` 声明末尾的分号之后 | 仍然存在，销毁点是内层块结束处 | `0` |
| `saved = answer;` 之后 | 仍然存在，可以读取 | `42` |
| 离开内层块之后 | 已销毁 | `42` |

因此，块外仍能从 `saved` 读取 `42` 来初始化 `result`。临时目标的销毁不影响外层对象已经保存的值。

> [!IMPORTANT] 临时对象的默认销毁点与延长边界
> **临时对象通常在创建它的完整表达式结束时销毁；对这里的块作用域局部 `const int&` 变量，用 prvalue 物化的临时对象完成初始化时，临时目标保持到该引用的生命周期结束。**本例中，声明末尾的分号结束本次求值，内层块结束时才销毁临时目标。直接绑定初始化之前已有的具名对象，不会因此延长该对象的生命周期。

> [!WARNING] 保存地址不会延长临时目标的生命周期
> 临时目标的生命周期结束后，指向它的指针会悬空。把目标地址保存在外层指针对象中，不会延长目标的生命周期；目标销毁后再通过该指针读取原对象，是未定义行为。若要在目标销毁后保留数值，应在目标仍存活时把值复制到独立对象中。

## 类型转换可能改变实际绑定目标

初始化器写出对象名称，也不保证引用最终绑定那个原对象。下面让同一个 `short` 对象分别初始化两种引用，只改变被引用的整数类型：

```cpp
short source{3};
const short& view{source};
const int& converted{source};

source = 4;
```

`view` 的被引用类型是 `const short`，可以直接绑定已有的 `short` 对象 `source`。增加只读访问限制不需要复制整数，原对象仍是它的目标。

`converted` 的被引用类型是 `const int`，不能直接把 `short` 对象作为 `int` 对象访问。初始化先读取 `source` 中的 `3`，转换为 `int` 值 `3`，再物化临时 `const int` 对象，并把 `converted` 绑定到这个新目标。

最后一条赋值修改原来的 `source`，两条引用路径因此读到不同的值：

| 引用 | 实际绑定目标 | `source = 4;` 后读取 |
| --- | --- | --- |
| `view` | 原来的 `short` 对象 `source` | `4` |
| `converted` | 转换结果对应的临时 `const int` 对象 | `3` |

这里的临时目标同样因局部引用初始化而延长到 `converted` 的生命周期结束。它保存初始化时转换得到的 `3`，后续修改 `source` 不会改写它。

> [!IMPORTANT] 访问限定与数值转换形成不同关系
> **对这里的普通整数对象，增加 const 访问限制可以继续绑定原对象；初始化若需要数值转换，则会建立转换结果对应的临时目标。**判断引用访问谁，要同时核对初始化器与被引用类型，不能只看初始化器中出现了哪个名称。

## 生命周期延长不会沿引用关系传播

引用绑定完成后，引用名称表达式是指定已有目标的 lvalue。用它初始化另一个能够直接绑定同一目标的引用，只是增加一条访问关系。

> [!IMPORTANT] 新增引用不重新决定目标的结束点
> **当新引用通过已有引用的名称直接绑定同一目标时，不会创建新临时对象，也不会重新触发生命周期延长。**目标的结束点仍由最初创建它的初始化语境决定，不能按当前还有多少引用来判断。若初始化需要数值转换，应先识别新产生的临时目标，再判断该目标的结束边界。

下面的独立示例让内层的 `second` 与外层的 `first` 访问同一个临时目标：

```cpp
{
    const int& first{40 + 2};

    {
        const int& second{first};
        const int saved{second}; // 42
    } // second 结束，临时目标仍然存在

    const int current{first}; // 42
} // first 结束，临时目标在这里销毁
```

`first` 的初始化物化临时目标，并确定它保持到 `first` 的生命周期结束。初始化 `second` 时，名称表达式 `first` 已经是指定该目标的 `const int` lvalue；`second` 直接绑定同一个对象，不需要读取整数来物化另一个目标。

`second` 的生命周期完全位于 `first` 的生命周期之内。内层块结束时，`second` 这条访问关系结束；临时目标仍按 `first` 初始化时确定的边界存活，所以外层仍可通过 `first` 读取 `42` 来初始化 `current`。离开外层块时，目标才销毁。

掌握引用参数与引用返回后，可以结合[临时实参跨函数传递的过程](06-reference-returns-and-lifetime-boundaries.md#临时实参不会因引用返回而延长)，观察“后来绑定的引用仍然存在，临时目标却已销毁”的情形。

## 合法特性不等于默认写法

`const int& answer{40 + 2};` 可以用来说明临时目标的产生与结束边界。只需要保存一个简单整数结果时，通常直接创建值对象更清楚：

```cpp
const int answer{40 + 2};
```

这条声明直接创建保存 `42` 的具名 `const int` 对象，计算结果用于初始化它，不需要为引用另建一个临时目标。它也说明 prvalue 不等于已经存在的匿名临时对象：同一个计算表达式，在不同初始化语境中可以用于初始化值对象，也可以用于物化引用所需的临时目标。

对于这样的简单数值，值对象让保存内容和存活范围直接对应到自己的声明。确实需要引用关系时，再按实际绑定目标与初始化语境判断生命周期。

## 参考资料

- [C++23 工作草案：值类别](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：临时对象物化转换](https://timsong-cpp.github.io/cppwp/n4950/conv.rval)
- [C++23 工作草案：临时对象](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：完整表达式与顺序执行](https://timsong-cpp.github.io/cppwp/n4950/intro.execution)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
