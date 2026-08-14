# C++ 函数章节之后的主线课程排序调研

调研日期：2026-08-14

调研问题：当前个人 C++ 笔记已经完成 `00` 至 `05` 的主线内容。下一顶级章应当进入什么主题，才能同时满足“依赖完整、主线建立直觉、附章承载底层机制”，又不机械照搬某一套外部课程？

## 核心结论

下一顶级章建议唯一确定为：

> **06 · 常量、字面量与类型转换（Constants, Literals, and Type Conversions）**

它比“类与结构体”或“指针”更适合作为函数章之后的直接后继。当前笔记已经多次使用字面量、常量表达式和隐式转换，也在赋值篇明确留下了显式转换尚未处理的边界；但 `const`、`constexpr`、字面量类型与 `static_cast` 仍没有形成完整模型。先补齐这一层，后续才能不借用未解释概念地讲清 `const T&`、`const T*`、数组边界、字符串字面量以及 `const` 成员函数。

推荐的近程主线为：

```text
06 常量、字面量与类型转换
└─ 07 引用与指针
   └─ 08 数组、字符序列与 C 风格字符串
      └─ 09 枚举与结构体
         └─ 10 类与封装
```

这里表达的是教学依赖，不是语言语法的硬性限制。C++ 当然允许在没有学过指针时定义一个简单 `struct` 或 `class`；真正的问题是，本项目不满足于只展示外形。要系统解释类的只读接口、`this`、引用传参、对象身份与非拥有关系，先建立 `const`、引用和指针会得到更完整的模型。

## 当前仓库已经覆盖什么

以下审计以 `src/notes/cpp` 当前 `00` 至 `05` 的索引和正文标题为准。

| 顶级章 | 已建立的主要模型 | 对下一步的影响 |
|---|---|---|
| `00 · C++ 导论` | C++ 定位与简史、编译和链接的基本过程、开发工具、token、空白与注释 | 已具备阅读和构建源程序的最小背景；不必再从 Hello World 重启 |
| `01 · 对象、类型与变量` | OOP 直觉、对象、基本整数/字符/浮点/布尔类型、ASCII/Unicode、变量、声明、初始化、局部未初始化风险；附章深入浮点表示 | 基本类型的存储与值模型已经明显超过普通入门课程；固定宽度整数仍可局部补充 |
| `02 · 表达式与运算符` | 表达式、操作数、算术运算、通常算术转换、赋值、窄化、自增自减、比较、逻辑、短路、分组和求值；有符号溢出与无符号回绕 | 隐式转换已经在具体语境中出现，但尚缺统一分类和显式转换；这是当前最直接的未闭合接口 |
| `03 · 代码块、作用域与生命周期` | 复合语句、块作用域、嵌套作用域、自动存储期局部对象和逆序销毁 | 已能支撑函数局部状态、引用悬垂和后续 RAII 直觉 |
| `04 · 控制流` | `if`、`switch`、条件运算符、`while`、`do-while`、`for`、`break`、`continue`、嵌套控制流 | `case` 已经要求“常量表达式”，但 `const`、常量表达式和 `constexpr` 尚未正式区分 |
| `05 · 函数` | 定义与调用、形参与实参、按值传递、参数和返回转换、`void`、提前返回、每次调用的局部状态、调用栈直觉、`main`、命令行参数外形、声明与定义 | 引用传参、指针参数、返回引用和函数重载都有了落脚点，但还缺 `const` 和复合类型前置知识 |

现有内容中有三处尤其能说明下一章不应直接跳到类：

1. [赋值、自增与自减](../../src/notes/cpp/02-expressions-and-operators/03-assignment-increment-and-decrement.md) 已经准确解释赋值转换和列表初始化窄化，并明确把“怎样显式表达有损转换意图”留给类型转换章节。
2. [switch 语句](../../src/notes/cpp/04-control-flow/02-switch-statements.md) 已经使用“编译期可以确定的常量表达式”，但还没有区分普通不可修改对象、常量表达式与 `constexpr` 对象。
3. [`main` 与程序入口](../../src/notes/cpp/05-functions/05-main-function-and-program-entry.md) 展示了 `char* argv[]`，却有意没有提前拆解数组、指针和 C 风格字符串。

这三处分别指向同一条依赖链：先完成常量与转换，再进入引用/指针，最后用数组和字符序列闭合 `argv` 与字符串字面量的真实类型。

## 三种相邻切分方案的直接权衡

下一章真正需要判断的，不只是“讲不讲 `const`”，而是 `const` 应当独立成章、与引用合并，还是让引用/指针先行。

| 方案 | 优点 | 主要问题 | 结论 |
|---|---|---|---|
| **只写 `const` / `constexpr`** | 依赖最纯，能够立即补全 `case` 中的常量表达式 | 顶级章边界过窄；字面量类型和显式转换仍然悬空，写完后还不能干净进入引用，因为窄化、`static_cast` 与转换语境仍要再开一章 | 不采用独立顶级章；作为推荐 `06` 的核心部分 |
| **把 `const` 与引用合为一章** | 可以很快落到 `const T&` 和按只读引用传参，函数章衔接明显 | `const` 同时服务于普通对象、常量表达式、指针和类，不属于引用的附属语法；引用自身又需要值类别、绑定、生命周期与悬垂。合并后章节前半在讲编译期值，后半突然转向对象别名，内部主轴不统一 | 不采用；`const` 先完成，引用在下一顶级章展开 |
| **直接进入引用与指针** | 对函数的按值传递形成最快扩展，也能开始解释地址和 `argv` | 无法专业地讲 `const` 引用、指向 `const` 的指针与 `const` 指针；若暂时跳过这些内容，很快就要回头重构。如果在指针章临时补 `const`/`constexpr`，又会把编译期求值错误地塑造成指针前置语法 | 不采用 |
| **`const` / `constexpr` + 字面量 + 类型转换** | 四者共同回答“表达式产生什么类型的值、这个值能否修改、能否用于编译期语境、怎样变成另一类型”；同时关闭当前笔记在 `case`、窄化和显式转换处留下的接口 | 篇幅比单独讲 `const` 大，需要严格排除用户定义转换和完整编译期编程 | **采用，作为 `06`** |

`const` 与 `constexpr` 放在同一阶段是因为二者必须明确区分；它们与字面量、类型转换合并，则不是简单拼盘。字面量的写法决定初始类型，转换决定表达式如何建立目标类型的值，常量表达式规则又会影响某些窄化判断和编译期语境。四者共享“值、类型与编译期可用性”这一条主轴。引用与指针回答的则是另一组问题：怎样指代已经存在的对象，以及这种关系何时有效。因此顶级章的切缝应当落在两组问题之间。

## 尚未形成独立模型的主要缺口

| 主题 | 当前状态 | 依赖关系 |
|---|---|---|
| `const` 对象 | 尚未正式介绍 | 是 `const` 引用、指向 `const` 的指针和 `const` 成员函数的共同前提 |
| 常量表达式与 `constexpr` | `case` 中使用了术语，尚未建立模型 | 数组边界和许多编译期语境需要常量表达式；`constexpr` 对象同时具有 `const` 属性并要求常量初始化，[C++23 工作草案](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)明确规定了这一点 |
| 字面量及其类型 | 整数、浮点、字符和布尔字面量已经零散出现 | 字面量本身也有类型；后缀、进制和具体类型会直接影响转换、溢出和重载选择 |
| 隐式与显式类型转换 | 通常算术转换、赋值转换、参数转换和返回转换已经分别出现 | 需要统一“转换的是值而不是对象类型”的模型，并引入 `static_cast`；完整转换分类见 [C++23 标准转换](https://timsong-cpp.github.io/cppwp/n4950/conv) |
| 引用 | 尚未介绍 | 需要对象身份、值类别和 `const`；引用可被理解为已有对象的另一个名称，并不要求先建立指针的内存实现，[C++23 引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)也没有规定引用一定占用存储 |
| 裸指针 | 只在 `argv` 外形中出现 | 需要地址、间接访问、空值、有效性和生命周期；所有权不应与基础指针语义同时混入 |
| 数组与 C 风格字符串 | 尚未介绍 | 数组边界是转换后的常量表达式；数组元素连续存储，并在许多表达式中发生数组到指针转换。普通字符串字面量的类型本身就是 `const char` 数组，[C++23 数组](https://timsong-cpp.github.io/cppwp/n4950/dcl.array)与[字符串字面量](https://timsong-cpp.github.io/cppwp/n4950/lex.string)使这条依赖关系非常直接 |
| 枚举、结构体与类 | OOP 篇只建立了直觉，尚未进入语法 | 简单 `struct` 不依赖指针；深入类设计会迅速需要 `const`、引用、指针、对象生命周期和接口语义 |

## 外部课程与官方资料怎样排序

### StudyPlan.dev：先获得 OOP 成果，再补底层模型

[StudyPlan.dev 的 Intro to C++ Programming 目录](https://www.studyplan.dev/intro-to-programming)在“Functions, Conditionals and Loops”之后直接进入“Classes and Structs”，随后是继承；“Memory, References and Pointers”位于类和继承之后，数组与动态内存则更晚。它的 [Types and Literals](https://www.studyplan.dev/intro-to-programming/types-literals) 被标记为可选课，主要覆盖内存宽度、固定宽度整数、溢出、signed/unsigned、浮点宽度和少量字面量后缀。

这种路线服务于一个明确目标：尽快让初学者在游戏对象叙事中创建类、成员和继承关系，从而获得可见的 OOP 成果；底层的对象地址、引用和数组先暂缓。它适合较浅的项目驱动课程，却不适合直接决定本项目的依赖顺序。当前笔记希望在进入类时能够解释真实的对象接口和生命周期，而不是把 `public:`、成员函数与继承先当成模板记住。

StudyPlan.dev 也只能作为主题和节奏参考，不能作为语言语义权威。其 Types and Literals 页面把有符号 `int` 越界统一描述为回绕，但 C++23 对不可表示的有符号算术结果规定的是未定义行为；当前笔记已经正确区分有符号溢出与无符号模运算。该页面还把普通字符串字面量概括为 `char*`，而 C++23 中普通字符串字面量实际具有 `const char` 数组类型。[C++23 算术表达式规则](https://timsong-cpp.github.io/cppwp/n4950/expr.pre)与[字符串字面量规则](https://timsong-cpp.github.io/cppwp/n4950/lex.string)应当优先于课程简化。

### LearnCpp：先补常量与转换，再进入引用和指针

[LearnCpp 官方目录](https://www.learncpp.com/)采用更长的螺旋式主线：

- 第 4 章讲基本类型，并首次引入类型转换和 `static_cast`；
- 第 5 章讲 `const`、字面量、进制、常量表达式、`constexpr`、`std::string` 和 `std::string_view`；
- 第 6 至第 8 章依次处理运算符、作用域和控制流；
- 第 10 章再次系统整理隐式转换、数值转换、窄化、显式转换、类型别名和 `auto`；
- 第 12 章先讲值类别与左值引用，再讲 `const` 引用、引用传参、指针、空指针、指针与 `const`；
- 第 13 章进入枚举和结构体，第 14 至第 15 章进入类；
- 第 16 章先用 `std::vector` 建立现代容器直觉，第 17 章才系统讲 `std::array`、C 风格数组、数组退化、指针运算与 C 风格字符串。

这套顺序与当前项目的“依赖完整”目标最接近。特别值得吸收的是：`const` 先于 `const` 引用和指针，引用/指针先于结构体和完整类，C 风格数组与字符串又晚于基础指针。但不必复制它把函数重载和函数模板整体塞在引用之前的安排；本项目可以让基础函数章保持闭合，把重载、模板和类型推导留到它们真正需要出现的位置。

### Microsoft Learn：资料组织证明主题关联，但不是零基础课程顺序

[Microsoft 的 C++ Language Reference](https://learn.microsoft.com/en-us/cpp/cpp/cpp-language-reference?view=msvc-170)按“词法约定（含字面量）→ 基本概念与内建类型 → 标准转换 → 声明与定义 → 运算符/表达式/语句 → 类与结构体”组织。它是参考资料而非逐课教程，因此不能直接拿目录当课程依赖；但它仍说明，字面量、类型和标准转换属于进入类之前的语言基础。

微软官方课程 [C++ A General Purpose Language and Library](https://learn.microsoft.com/en-us/shows/cplusplus-language-library/02) 则把类型、函数、控制流、运算符、字符串和 `const` 归入 Fundamentals，随后依次安排 C++ Object Model、Pointers and Indirection、RAII。这个顺序更偏向已经会编程的人：先建立 C++ 对象模型全景，再讲间接访问和资源管理。它支持“`const` 应属于基础层”，却不能证明零基础主线应先讲类再讲指针。

[Microsoft 的 C++ 类型系统说明](https://learn.microsoft.com/en-us/cpp/cpp/cpp-type-system-modern-cpp?view=msvc-170)还明确强调 const-correctness 的广泛使用，并将以空字符结尾的字符数组描述为 C 风格字符串，同时建议现代代码优先采用标准库字符串类型。这适合用来确定边界：C 风格字符串必须讲，因为语言和系统接口无法回避；但它应作为数据表示与互操作模型，而不是现代业务代码的默认字符串方案。

### Stanford CS106L：引用可以早于指针，但其受众不是零基础

[Stanford CS106L 2025 课程页](https://web.stanford.edu/class/archive/cs/cs106l/cs106l.1254/)的顺序是 Types and Structs → Initialization and References → Streams → Containers → Iterators and Pointers → Classes → Template Classes and Const Correctness。它证明了一点：引用完全可以先于指针建立，因为引用首先是语言层面的别名和绑定关系，并不要求先把它解释为某种物理指针。

但该课明确要求学生已经掌握或正在掌握函数与对象/类等编程基础，而且只有一学分。结构体放在第一周、完整 const-correctness 放到模板类之后，是在压缩课程中利用先修知识的选择，不适合直接移植到“愿意建立完整模型但不预设 C++ 知识”的个人笔记。

### C++ Core Guidelines：决定实践边界，而不是决定课程序号

[C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)不是教程，但它能校准每个主题应如何落地：

- [ES.25](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es25-declare-an-object-const-or-constexpr-unless-you-want-to-modify-its-value-later-on)建议不准备修改的对象采用 `const` 或 `constexpr`；
- [F.16](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f16-for-in-parameters-pass-cheaply-copied-types-by-value-and-others-by-reference-to-const)把按值参数与 `const` 引用参数放在同一套接口设计规则中；
- [R.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r3-a-raw-pointer-a-t-is-non-owning)和 [R.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r4-a-raw-reference-a-t-is-non-owning)将裸指针和裸引用视为非拥有关系；
- [R.14](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r14-avoid--parameters-prefer-span)指出数组形参会退化并丢失长度信息，接口应优先使用能够保留范围的视图。

因此，基础指针章不应同时把 `new`/`delete` 和手动所有权当作主要用法。先讲对象地址、间接访问、空指针、有效性、悬垂和非拥有语义；动态存储、RAII 与智能指针另设后续主线，能够避免“指针 = 堆内存 = 所有权”这种最常见的概念纠缠。

## 为什么这些路线会不同

| 差异来源 | StudyPlan.dev | LearnCpp | Microsoft | Stanford CS106L | 对本项目的启示 |
|---|---|---|---|---|---|
| 受众 | 真正初学者，强调快速成果 | 可零基础，长篇自学 | 参考资料与面向已有经验者的课程并存 | 已有编程基础的短课 | 应采用零预设的依赖顺序，但保持专业深度 |
| 组织目标 | 游戏/OOP 叙事 | 尽量完整的语言主线 | 按语言领域或对象模型组织 | 一学期内展示现代 C++ 特色 | 不应因外部章节名而牺牲内部依赖 |
| 类与指针顺序 | 类、继承早于指针 | 引用/指针早于结构体和类 | 对象模型早于指针 | 结构体早、引用和指针早于完整类 | 简单类不需要指针，深入类设计需要先有 `const`、引用与对象身份 |
| 数组与字符串 | 指针之后、较晚 | 现代容器先，C 数组/C 字符串更晚 | 明确区分标准字符串与 C 字符数组 | 容器和迭代器优先 | C 表示必须讲，但不应被包装成现代默认方案 |
| `const` | 不是前期独立主轴 | 字面量之后很早建立，后续贯穿 | Fundamentals/类型系统的重要组成 | 完整 const-correctness 较晚 | 本项目已经到函数，应立即补齐，不宜继续推迟 |

课程顺序没有唯一的语言学答案，因为“语法上可写”与“能够深入解释”并不是同一个标准。StudyPlan.dev 可以先展示类，因为其目标是快速可用；Stanford 可以先展示结构体，因为学生已有先修知识；语言参考甚至不承担教学递进。当前项目既不追求快速项目结果，也不愿通过未解释的模板跳过机制，因此更应选择依赖闭合路线。

## 六组关键主题的依赖判断

### 1. `const` 应当先于引用、指针和类

`const` 首先描述对象不能通过相应接口被修改，并不等价于“编译期常量”。`constexpr` 对象则隐含 `const`，并要求初始化表达式满足常量表达式规则。[C++23 `constexpr` 规则](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)明确区分了这两层。

如果跳过这一步直接讲引用或指针，就会很快遇到 `const T&`、`const T*` 与 `T* const`，却无法判断 `const` 究竟修饰哪个类型层次；直接讲类也无法自然解释 `const` 对象为什么只能调用 `const` 成员函数。因此 `const` 不是可在类章中顺手补上的语法点，而是共享前置概念。

### 2. 字面量、常量表达式与转换应当放在同一阶段

字面量不是“没有名字的 const 变量”，而是源代码中直接表示值的词法形式；它本身具有由写法和后缀决定的类型。`3`、`3u`、`3.0` 和 `3.0f` 可能表达相近数学值，却会改变通常算术转换、列表初始化窄化和重载匹配。

常量表达式又连接了两个已经出现的主题：`case` 标签需要转换后的常量表达式，数组边界也要求可转换为 `std::size_t` 的常量表达式。[C++23 常量表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.const)列出了这些编译期语境。因此，把字面量类型、`const`、常量表达式、`constexpr` 和基础转换集中到同一顶级章，可以关闭当前散落在表达式、控制流和函数中的多个缺口。

### 3. 引用可以先于指针，但需要先有对象身份和值类别

语言允许将引用理解为已有对象的另一个名称；标准甚至不规定引用是否必须占用存储。因此，用“编译器把引用实现成隐藏指针”作为开头既不必要也不准确。更自然的顺序是：表达式的身份和值类别 → 左值引用绑定 → `const` 左值引用 → 引用参数与返回引用 → 对象地址与指针。

这与 LearnCpp 和 Stanford 的共同顺序一致。指针随后补充“地址本身也是可以保存、重定向和为空的值”，从而解释引用与指针为何相似、又为何具有不同约束。

### 4. 裸指针基础与动态内存必须拆开

对象地址、`&`、`*`、`nullptr`、有效性、悬垂、指针与 `const` 足以构成第一轮裸指针主线。`new`、`delete`、所有权转移和异常安全不是同一层知识；把它们同时引入，会把地址、生命周期、存储期和资源所有权混成一个问题。

C++ Core Guidelines 将裸指针默认视为非拥有，并建议避免显式 `new`/`delete`。因此，基础裸指针章应服务于对象身份、可选关系和底层接口；动态资源管理应在 RAII、类的特殊成员和智能指针具备前提后单独深入。

### 5. 数组与 C 风格字符串应当位于基础指针之后

C++ 数组首先是包含固定数量、连续元素的对象，不是指针；但数组在许多表达式中会转换为首元素指针，函数数组形参也会发生类型调整。没有指针模型，就只能把这些现象列成例外。

普通字符串字面量又是包含结尾空字符的 `const char` 数组，不是 `char*` 对象。先有 `const`、数组和数组到指针转换，才能准确说明 C 风格字符串为何只靠地址与终止符表达边界、为什么缺少终止符或越界会出错，以及 `argv` 的各层类型关系。现代默认接口再与 `std::string`、`std::string_view` 和范围视图对照，而不必否认 C 表示在系统接口与既有库中的现实存在。

### 6. 自定义类型可以分成“简单聚合”与“完整类设计”

枚举和只含公开数据成员的简单结构体在语法上不依赖指针，Stanford 也据此很早引入 structs。完整类章则会涉及成员函数、只读对象、封装、构造、析构、`this`、引用返回和对象间关系。对当前笔记而言，把“语法能出现”当作“依赖已经完整”会再次形成浅层模板。

因此，引用/指针和数组之后先讲枚举与结构体，再进入类与封装比较稳妥。结构体用于建立“多个成员共同组成一个新类型”的值语义直觉；类章再集中处理受控状态、不变量、成员函数和生命周期机制。

## 建议的 `06` 章边界

### 建议篇目

1. **字面量及其类型（Literals and Their Types）**
   - 区分字面量、对象和命名常量；
   - 整数字面量的十进制、二进制、八进制与十六进制写法；
   - 数字分隔符与整数/浮点后缀；
   - 已经出现的整数、浮点、字符和布尔字面量怎样得到类型；
   - 字符串字面量只给出准确类型边界，不在这里展开数组退化与 C 字符串操作。

2. **不可修改的对象与 `const`（Const Objects）**
   - `const` 属于类型限定，而不是对象命名习惯；
   - `const` 对象必须完成初始化，之后不能通过该对象修改值；
   - 运行期得到的 `const` 值仍然可以不是常量表达式；
   - 默认把不需要修改的对象声明为 `const` 的工程意义。

3. **常量表达式与 `constexpr`（Constant Expressions and `constexpr`）**
   - 编译期语境为何需要额外保证；
   - 普通字面量表达式、`const` 对象和 `constexpr` 对象的区别；
   - `constexpr` 对象隐含 `const`，且初始化器必须满足常量表达式要求；
   - 回接 `case` 标签，并为数组边界建立前提。

4. **隐式转换的统一模型（Implicit Conversions）**
   - 将初始化、赋值、运算、参数建立和返回结果中的转换放到同一模型；
   - 区分提升、数值转换和条件语境中的布尔转换；
   - 链接既有“通常算术转换”，不重复抄写整套共同类型规则；
   - 强调转换作用于表达式产生的值，不会改变源对象的数据类型。

5. **窄化与显式转换（Narrowing and Explicit Conversions）**
   - 列表初始化为什么拒绝特定窄化；
   - `static_cast<T>(expression)` 怎样表达主动转换意图；
   - 浮点到整数的向零截断、目标范围和未定义行为边界；
   - 显式写出转换不等于编译器证明业务安全。

### 本章不应纳入

- `const_cast`、`reinterpret_cast` 和 `dynamic_cast`：分别依赖 cv 限定的更完整接口、对象表示和多态类型；
- C 风格强制转换：可以在命名转换体系完整后作为不推荐写法对比，不必用它建立第一直觉；
- 用户定义转换与转换构造函数：依赖类；
- `constexpr` 函数、`consteval`、`constinit` 的完整规则：可以先用附章承载编译期求值机制，避免主线立即进入 C++23 常量求值的全部边界；
- `auto`、`decltype` 与类型别名：它们属于类型推导和声明形式，不是完成基础数值转换所必需；
- 字符串字面量的数组布局、空字符和退化规则：放入数组与字符序列章；
- 固定宽度整数：它是基本整数类型选择的局部缺口，适合补到现有“对象与数据类型”，不应独自改变顶级主线。

## 排除其他“下一章”候选

### 不选“类与结构体”

这会沿用 StudyPlan.dev 的快速 OOP 路线，却迫使正文要么跳过 `const` 成员函数、引用接口和 `this`，要么在类章内部一次补入多个前置概念。对只求外形的课程可行，对本项目的深度目标不合适。

### 不选“引用与指针”

它已经是紧随其后的正确方向，但现在直接开始会立刻遇到 `const T&`、`const T*`、`T* const` 和函数输入参数的只读约束。先用一章补齐 `const` 和转换，会让引用/指针章本身保持纯净。

### 不选“函数重载与模板”

重载决议依赖隐式转换序列，引用和 cv 限定也会改变候选函数匹配。函数模板还会引入类型推导。当前只完成普通函数模型，立即进入重载/模板会把函数章从稳定基础推向多个未建立的类型规则。

### 不选“数组与字符串”

原生数组会自然引出数组到指针转换，字符串字面量又要求 `const char[N]`。在 `const`、常量表达式和指针之前讲，只能把核心机制暂时当作例外记忆。

### 不选“头文件、预处理与多文件程序”

函数声明与定义已经为接口/实现建立了入口，但跨翻译单元的常量会继续涉及链接属性、`inline constexpr` 变量和头文件定义规则。先完成 `const`/`constexpr`，再进入命名空间、链接和多文件组织会更干净。

### 不选“调试”或“输入输出”作为语言主线

二者都重要，却不会解除当前类型系统的依赖阻塞。调试适合成为贯穿各章的实践线或独立工具篇；流式 I/O 的深入模型又会涉及类、运算符重载和标准库接口。它们可以补充，但不应取代下一语言主线。

## 最终建议

当前仓库不需要追随 StudyPlan.dev 在函数之后立即进入类，也不需要因为“类之前应先懂指针”而直接跳到裸指针。真正缺失的中间层是：源代码怎样写出具有确定类型的值、对象何时不可修改、哪些表达式能够用于编译期语境，以及类型之间怎样隐式或显式地建立新值。

因此，下一顶级章应确定为 **“06 · 常量、字面量与类型转换”**。它完成后，再写“引用与指针”，就可以自然把现有函数章从按值传递扩展到按引用传递和地址传递；再往后写数组/C 字符串，能够完整解释 `argv` 与字符串字面量；最后进入结构体和类时，也已经具备讲清 `const` 接口、对象身份、非拥有关系与生命周期的共同语言。

## 主要来源

- [StudyPlan.dev · Intro to C++ Programming](https://www.studyplan.dev/intro-to-programming)
- [StudyPlan.dev · Types and Literals](https://www.studyplan.dev/intro-to-programming/types-literals)
- [LearnCpp 官方课程目录](https://www.learncpp.com/)
- [Microsoft Learn · C++ Language Reference](https://learn.microsoft.com/en-us/cpp/cpp/cpp-language-reference?view=msvc-170)
- [Microsoft Learn · C++ A General Purpose Language and Library](https://learn.microsoft.com/en-us/shows/cplusplus-language-library/02)
- [Microsoft Learn · C++ type system](https://learn.microsoft.com/en-us/cpp/cpp/cpp-type-system-modern-cpp?view=msvc-170)
- [Stanford CS106L · Winter 2025](https://web.stanford.edu/class/archive/cs/cs106l/cs106l.1254/)
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
- [C++23 working draft N4950](https://timsong-cpp.github.io/cppwp/n4950/)
