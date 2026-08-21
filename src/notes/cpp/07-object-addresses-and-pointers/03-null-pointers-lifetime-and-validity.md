---
title: 空指针、生命周期与有效性（Null Pointers, Lifetime, and Validity）
date: 2026-08-19
---

# 空指针、生命周期与有效性

指针对象可以保存指向目标对象的值，但一个程序并不总能在创建指针时立即确定目标。即使指针当前确实指向某个对象，这段关系也只能在目标对象仍然存在并允许访问时使用。

因此，**判断一次间接访问能否成立，不能只看指针对象是否保存了某个看起来像地址的 bit pattern。至少需要分清三种状态：有意表示“当前没有目标”的空指针、尚未得到确定值的未初始化指针，以及目标已经不再存在的悬空指针。**

## nullptr 表示当前没有目标

**`nullptr` 是指针字面量（pointer literal）。它用于表达一个明确的语义状态：这里当前没有被指向对象。**

```cpp
int* selected_temperature{nullptr};
```

**`selected_temperature` 已经完成初始化，具有确定状态；只是它当前不指向任何 `int` 对象。这与忘记初始化完全不同。**

更精确地说，**`nullptr` 表达式具有独立的 `std::nullptr_t` 类型，它本身不是 `int*`。当它用于初始化 `int*` 对象时，会转换成 `int*` 类型的空指针值（null pointer value）：**

```text
nullptr
类型：std::nullptr_t
        │
        │ 转换到 int*
        ▼
int* 类型的空指针值
        │
        │ 初始化
        ▼
selected_temperature 指针对象
```

**空指针值不是某个普通对象的地址，也不指向一块名为“空”的特殊内存。它是指针类型能够表示的一种无目标状态。**

## 空指针是一种合法状态

空指针可以被保存、复制、比较和重新赋值：

```cpp
int* selected_temperature{nullptr};
int* copied_selection{selected_temperature};

bool has_selection{selected_temperature != nullptr};
```

**此时两个指针对象都保存空指针值，`has_selection == false`。这些操作本身没有错误；空指针的意义正是允许程序在指针类型内部明确表达“暂时没有目标”。**

之后可以用对象地址替换空值：

```cpp
int engine_temperature{78};
int* selected_temperature{nullptr};

selected_temperature = &engine_temperature;
```

赋值完成后，`selected_temperature` 才开始指向 `engine_temperature`。反方向的赋值同样只改变指针对象：

```cpp
selected_temperature = nullptr;
```

**这不会销毁或修改 `engine_temperature`，只会让 `selected_temperature` 不再保存指向它的值。指针对象和目标对象始终是两个独立对象。**

## 空指针不能间接访问

一元 `*` 要通过指针值指定目标对象。空指针没有目标，因此不能对它执行间接访问：

```cpp
int* selected_temperature{nullptr};

// int snapshot{*selected_temperature}; // 行为未定义
// *selected_temperature = 81;           // 行为未定义
```

**通过空指针读取或写入具有未定义行为（undefined behavior）。语言不保证程序一定崩溃，也不保证读取到 `0`、忽略写入或抛出异常；一旦程序执行这种操作，C++ 不再为其结果提供约束。**

操作系统可能在某次运行中通过访问保护终止程序，但这只是可能出现的外在表现。C++ 规则并不把“能否触发系统故障”当作判断间接访问是否合法的标准。

## 判断是否为空

可以显式比较指针与 `nullptr`：

```cpp
if (selected_temperature != nullptr) {
    *selected_temperature = 81;
}
```

指针也可以参与条件语境。空指针值转换为 `false`，其他能够正常求值的指针值转换为 `true`：

```cpp
if (selected_temperature) {
    *selected_temperature = 81;
}
```

对于一个已经确认具有可用状态的指针，这两种形式都可以表达空值检查。第一种把比较对象直接写出，第二种更紧凑；项目内保持一致即可。

**但条件只能回答“这个值是否为空”。它不能证明目标对象的生命周期仍在继续，也不能把一个已经悬空的指针恢复成可访问状态。**

## nullptr 不等于全零 bits

**源码中的 `nullptr` 表达空指针语义，不代表每种实现都必须用全零 bit pattern 保存所有空指针值。不同指针类型怎样表示空值，属于具体实现的选择。**

历史代码还可能使用整数零或宏 `NULL`：

```cpp
int* first_pointer{nullptr};
int* second_pointer{0};
```

值为零的整数字面量可以作为空指针常量，`NULL` 则是标准库提供的实现定义宏。**现代 C++ 新代码使用 `nullptr`，因为它直接表达指针语义，并且不会被普通整数运算混淆。**

**“整数零可以转换为空指针值”和“空指针在内存中必定由全零 bits 表示”是两条不同命题；前者是语言转换规则，后者不是 C++ 的普遍保证。**

## 未初始化指针不是空指针

**块内的普通局部指针若没有初始化，不会自动得到空指针值：**

```cpp
int* temperature_pointer;
```

在当前 C++23 范围内，这个局部指针对象具有不确定值（indeterminate value）。不能把它当作某种未知但仍可安全检查的指针：

```cpp
int* temperature_pointer;

if (temperature_pointer) { // 行为未定义：条件已经读取不确定值
    *temperature_pointer = 81;
}
```

**错误在求值 `temperature_pointer` 时已经发生，不需要等到执行一元 `*`。条件检查无法把未初始化状态“试探”成空或非空。**

指针应当在创建时立即进入两种明确状态之一：

```cpp
int engine_temperature{78};

int* absent_temperature{nullptr};
int* present_temperature{&engine_temperature};
```

**空指针是确定值，未初始化指针没有可供程序正常读取的确定值，两者不能统称为“没有指向”。**

## 指针不会延长目标生命周期

**指针对象和目标对象拥有各自独立的生命周期。保存一个对象的地址，不会使目标对象因此继续存在：**

```cpp
int* observed_temperature{nullptr};

{
    int local_temperature{78};
    observed_temperature = &local_temperature;

    int snapshot{*observed_temperature}; // 合法：目标仍然存在
}

// int later_snapshot{*observed_temperature}; // 行为未定义
```

进入内层代码块后，`local_temperature` 的生命周期开始；离开代码块时，它的生命周期结束，相应的自动存储期也随之结束。外层的 `observed_temperature` 并不会自动执行一次 `= nullptr`，但它已经不能再用于访问原来的局部对象。

**工程中常把这种仍遗留旧指向关系、目标却已经不能继续访问的指针称为悬空指针（dangling pointer）。“悬空”描述的是指针与目标生命周期之间已经断裂的关系，不是空指针的另一种写法。**

```text
内层代码块执行期间
observed_temperature ─────▶ local_temperature

离开内层代码块以后
observed_temperature ─────▶ 原目标已不存在
             悬空，不能间接访问
```

## 返回局部对象的地址

**函数返回并不会延长其局部对象的生命周期：**

```cpp
int* make_temperature_pointer() {
    int local_temperature{78};
    return &local_temperature;
}
```

求值 `return` 时可以取得 `local_temperature` 的地址，但函数结束会销毁这个局部对象。调用者收到的指针不能再用于访问它：

```cpp
int* temperature_pointer{make_temperature_pointer()};

// int snapshot{*temperature_pointer}; // 行为未定义
```

编译器通常会对此给出警告，但程序不能依赖警告来建立正确性。**根本问题是返回的指针关系比目标对象存在得更久。**

## 非空不等于可以间接访问

**悬空指针通常不会自动变成空指针，因此单纯检查 `pointer != nullptr` 不能发现目标生命周期已经结束：**

```cpp
int* observed_temperature{nullptr};

{
    int local_temperature{78};
    observed_temperature = &local_temperature;
}

// 即使旧值并非空值，也不能据此访问原对象。
```

一次正确的间接访问至少依赖以下事实：

- 指针对象已经完成初始化；
- 指针值不是空指针值；
- 它确实对应当前准备访问的目标对象；
- 目标对象的生命周期已经开始且尚未结束；
- 访问方式满足目标类型及相应存储要求。

**C++ 没有提供一个能够接收任意指针、再普遍证明它可以安全解引用的标准运行时检查。**程序必须通过对象的创建位置、作用域、生命周期和接口约定维持这些事实。

**即使某个数值对应操作系统中已经映射且可读写的虚拟地址，也不能单独证明那里当前存在一个允许 C++ 程序以指定类型访问的对象。系统内存权限与 C++ 对象有效性是两个层次的问题。**

## 缩短指针与目标的距离

**避免悬空最直接的方式，不是在每次访问前猜测地址是否仍然可用，而是让指针只在目标生命周期明确覆盖的范围内存在：**

```cpp
int engine_temperature{78};

{
    int* temperature_pointer{&engine_temperature};
    *temperature_pointer = 81;
}
```

这里目标对象在外层，指针对象只在内层短暂存在。指针生命周期结束时，目标仍然存在；整个关系无需依赖额外恢复或试探。

如果业务确实允许“当前没有目标”，使用 `nullptr` 明确表达这一状态，并在能够证明目标存在的路径上再进行间接访问。**`nullptr` 是状态模型的一部分，不是修复任意失效地址的万能检查。**

## 核心结论

- `nullptr` 用于产生相应指针类型的空指针值，明确表示当前没有目标。
- 空指针是已经初始化的合法状态，可以保存、比较和重新赋值，但不能间接访问。
- 未初始化的普通局部指针具有不确定值，读取它进行空值检查就已经具有未定义行为。
- 指针不会延长目标对象的生命周期；目标结束后遗留的指向关系会形成悬空指针。
- `if (pointer)` 只检查空值，不能证明目标仍然存在或间接访问一定成立。
- 指针有效性来自对象关系和生命周期约束，而不是地址文本、系统内存权限或一次通用运行时试探。

相关标准条款：[指针字面量 lex.nullptr](https://timsong-cpp.github.io/cppwp/n4950/lex.nullptr)、[空指针转换 conv.ptr](https://timsong-cpp.github.io/cppwp/n4950/conv.ptr)、[指针的布尔转换 conv.bool](https://timsong-cpp.github.io/cppwp/n4950/conv.bool)、[不确定值 basic.indet](https://timsong-cpp.github.io/cppwp/n4950/basic.indet)、[对象生命周期 basic.life](https://timsong-cpp.github.io/cppwp/n4950/basic.life)、[存储期 basic.stc](https://timsong-cpp.github.io/cppwp/n4950/basic.stc)。
