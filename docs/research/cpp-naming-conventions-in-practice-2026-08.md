# 成熟 C++ 生态中的命名风格

> 调研日期：2026-08-12
> 调研范围：C++ 标准库、C++ Core Guidelines、Google、Chromium、LLVM、Qt 与 Microsoft 的官方资料。
> 资料原则：只采用语言规范、项目编码规范及厂商官方文档；示例代码只作为该生态实际用法的补充证据，不把示例误写成强制规则。

## 结论先行

C++ 没有一种能够脱离项目语境而称为“现代最佳”的大小写风格。`frontLeftPressure`、`front_left_pressure` 和 `FrontLeftPressure` 都出现在成熟的 C++ 生态中，但各项目不仅选择不同，还会根据名称代表的是变量、成员变量、函数还是类型采用不同规则。

为了避免术语本身的歧义，本文统一使用：

| 名称 | 形式 | 示例 |
| --- | --- | --- |
| 小驼峰命名法（lower camel case） | 首词小写，后续单词首字母大写 | `frontLeftPressure` |
| 蛇形命名法（snake case） | 单词小写，以 `_` 分隔 | `front_left_pressure` |
| 大驼峰命名法（Pascal case / upper camel case） | 每个单词首字母大写 | `FrontLeftPressure` |

官方资料有时把后两种驼峰形式都简称为 `camel case`，下文按实际拼写归入以上三类。

如果只讨论当前笔记中的普通变量，可以得到三个直接结论：

1. **lower camel case 是成熟方案**：Qt 明确使用它命名变量，Microsoft 的 C++/WinRT 官方示例也大量采用这一形式命名局部变量。
2. **snake case 同样是成熟方案**：Google 和继承其规则的 Chromium 使用它命名普通变量；C++ 标准库的公开名称也广泛使用小写加下划线。
3. **Pascal case 不能简单排除在变量风格之外**：LLVM 当前规范明确要求变量名以大写字母开头的 camel case；不过在 Google、Qt 等体系中，Pascal case 主要用于类型，因此跨项目混用时可能传递错误的类别信号。

因此，当前笔记继续把 `frontLeftPressure` 作为自有示例是合理的，但应把它说明为**本笔记采用的统一风格**，而不是“现代 C++ 的最佳命名法”。

## 各生态的实际规则

### C++ 语言与标准库

C++ 的语言规则规定哪些字符可以组成标识符、标识符区分大小写，以及哪些下划线形式保留给实现；它不规定用户变量必须使用哪一种大小写风格。来源：[C++ working draft — Identifiers](https://eel.is/c%2B%2Bdraft/lex.name)。

C++ 标准库的公开 API 则形成了鲜明的小写下划线风格，例如类型 `unique_ptr`、成员类型 `element_type`、函数 `make_unique_for_overwrite`，以及 `vector` 的 `size_type` 和 `push_back`。来源：[C++ working draft — `unique_ptr`](https://eel.is/c%2B%2Bdraft/unique.ptr)、[C++ working draft — `vector`](https://eel.is/c%2B%2Bdraft/vector)。

这里必须保持边界：**标准库采用 snake case，不等于 C++ 语言要求用户代码也采用 snake case**。标准库名称可以证明这种风格属于 C++ 的核心生态，却不能直接充当用户局部变量的语言规则。

[C++ Core Guidelines 的命名与布局部分](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-naming)把 `underscore_style` 作为没有其他约束时的默认建议，理由之一正是它来自 C/C++ 传统并用于标准库；但同一指南同时强调：现实项目风格很多，真正目标是保持一致，已有项目的约定优先于个人偏好。它还明确建议自有代码采用一致的 house style，而导入的库保留原来的命名方式。

### Google C++

[Google C++ Style Guide — Naming](https://google.github.io/styleguide/cppguide.html#Naming)不是为所有类别选择同一种拼写，而是利用名称形状帮助读者识别实体类别：

| 类别 | 规则 | 官方示例 |
| --- | --- | --- |
| 普通变量与函数参数 | snake case | `table_name` |
| `struct` 数据成员 | snake case | `num_entries` |
| `class` 数据成员 | snake case，并添加尾随 `_` | `table_name_` |
| 类型 | Pascal case | `UrlTableProperties` |
| 普通函数 | Pascal case | `AddTableEntry()` |
| 访问器与修改器 | 可以按变量风格命名 | `count()`、`set_count()` |

这说明“项目采用 snake case”仍然只是简写。更准确的说法是：Google 对变量采用 snake case，同时对类型和普通函数采用 Pascal case，并用尾随下划线区分 `class` 成员变量。

### Chromium

[Chromium C++ style guide](https://chromium.googlesource.com/chromium/src/%2B/main/styleguide/c%2B%2B/c%2B%2B.md)明确说明：除列出的例外外，Chromium 遵循 Google C++ Style Guide。因此，其普通变量沿用 snake case，类型沿用 Pascal case，`class` 数据成员沿用带尾随 `_` 的 snake case。

Chromium 自己也保留局部例外，例如简单的内联访问器通常使用 `snake_case()`。这再次表明，大型工程的命名规范是一套按实体类别和既有 API 形成的体系，而不是一个可以覆盖全部名称的单一大小写选项。

### LLVM

[LLVM Coding Standards — Name Types, Functions, Variables, and Enumerators Properly](https://llvm.org/docs/CodingStandards.html#name-types-functions-variables-and-enumerators-properly)采用另一套成熟组合：

| 类别 | 规则 | 官方示例 |
| --- | --- | --- |
| 变量 | Pascal case | `Leader`、`Boats`、`Headlight` |
| 类型 | Pascal case | `TextFileReader`、`VehicleMaker` |
| 函数 | lower camel case | `openFile()`、`isFoo()` |
| 公有成员变量 | Pascal case | 与类型相同的首字母大写形式 |
| 模仿 STL 的接口 | 可使用 snake case | `push_back()`、`global_begin()` |

LLVM 还把“修改现有代码时遵循当地已有风格”称为 golden rule，并明确说明 `libc++` 因受 C++ 标准库约定约束而偏离 LLVM 的通用规范。LLVM 也承认其较新的命名规则尚未在整个历史代码库中统一实现，并反对为此进行大规模无关重命名。来源：[LLVM Coding Standards — Introduction](https://llvm.org/docs/CodingStandards.html#introduction)。

因此，Pascal case 不只是类型命名法；LLVM 确实把它用于变量。但如果代码库同时采用 Google 或 Qt 的类别约定，突然把某个普通变量写成 `FrontLeftPressure`，读者又很可能先把它识别成类型。这种视觉含义由项目规范决定，而非由 C++ 语法决定。

### Qt

[Qt Coding Style — Declaring variables](https://wiki.qt.io/Qt_Coding_Style#Declaring_variables)明确规定变量和函数以小写字母开头，后续单词首字母大写，即 lower camel case；类以大写字母开头，即 Pascal case。其示例包括：

```cpp
char *nameOfThis;
char *nameOfThat;
char itemDelimiter = ' ';
```

Qt 还建议避免无意义的短名称和缩写，并让变量等到需要时再声明。公开类通常带 `Q` 前缀，公开函数往往带 `q` 前缀，这些又属于 Qt 自己的生态标识，而不是 lower camel case 本身的必然后果。

Qt 文档同样承认现实代码存在历史差异：当某个文件或模块已经形成风格时，应以当地最普遍的写法为准；有争议时由模块维护者决定。这与 LLVM 的“遵循现有代码”原则一致。

### Microsoft C++ 生态

Microsoft 并未在 MSVC 官方文档中给出一套覆盖所有原生 C++ 项目的统一大小写规则。[Visual Studio 的 C++ `lnt-naming-convention`](https://learn.microsoft.com/en-us/cpp/ide/lnt-naming-convention)要求项目在 `.editorconfig` 中自行定义大小写、前缀和其他规则，工具负责检查项目选择的风格。这个设计本身说明 MSVC 并不把某一种风格视为编译器的默认答案。

Microsoft 生态内部也存在多套历史与平台约定：

- [C++/WinRT 官方入门示例](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/get-started)中的局部变量使用 lower camel case，如 `rssFeedUri`、`syndicationClient` 和 `titleAsHstring`，而投影出的 Windows Runtime 类型与方法使用 Pascal case，如 `SyndicationClient` 和 `RetrieveFeedAsync()`。这些示例能证明 lower camel case 是 Microsoft 现代 C++ 代码中的实际用法，但该页面没有把它宣布为所有 MSVC 项目的强制规范。
- 传统 Win32 代码常见匈牙利命名法（Hungarian notation）。[Microsoft 的 Windows Coding Conventions](https://learn.microsoft.com/en-us/windows/win32/learnwin32/windows-coding-conventions)说明这种历史来源，同时明确指出 C++ Core Guidelines 不鼓励用前缀编码类型信息，并称 Windows 团队内部已经不再使用它；旧示例和文档中仍可能保留。
- [C++/WinRT naming conventions](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/naming)主要规定 `winrt` 命名空间内哪些大小写和前缀保留给框架，并不是一份通用的局部变量风格指南。

因此，不能把 C#/.NET 的命名规范直接称作“Microsoft C++ 规范”，也不能仅凭 Visual Studio 的默认体验推导出原生 C++ 的统一风格。

## 三种风格分别由谁实际采用

### lower camel case

- Qt：变量与函数的正式项目规则。
- Microsoft C++/WinRT：官方现代 C++ 示例中的局部变量实际采用；但不是 MSVC 的全局强制规则。
- LLVM：函数采用 lower camel case，但变量采用 Pascal case。

lower camel case 的常见优势是容易与采用 Pascal case 的类型形成视觉区别，例如 `SyndicationClient syndicationClient`。它的代价是缩写的大小写边界需要另作约定；Qt 明确要求把 acronym 当普通单词处理，例如 `QXmlStreamReader`，而不是 `QXMLStreamReader`。

### snake case

- Google：普通变量、参数和数据成员的正式规则；`class` 成员另加尾随 `_`。
- Chromium：默认继承 Google 的规则。
- C++ 标准库：大量公开类型、函数和成员类型采用小写下划线形式。
- C++ Core Guidelines：在没有外部约束时给出的默认建议，但明确让位于已有项目风格。

snake case 与 C++ 标准库接口放在一起时视觉连续性较强，也无需依靠大写字母识别单词边界。是否给成员添加 `_`、`m_` 或其他标记，则是另一层独立规则，不能由 snake case 自动推出。

### Pascal case

- LLVM：变量与类型的正式规则，函数改用 lower camel case。
- Google、Qt：主要用于类型；Google 的普通函数也采用 Pascal case。
- Microsoft Windows Runtime API：类型与公开方法广泛使用 Pascal case，但这不能自动推广成局部变量规则。

Pascal case 在多个生态中承担“类型名称”的视觉信号，但 LLVM 证明它也可以成为成熟的变量风格。因此，不能说 Pascal case 变量在语法上或工程上错误；只能说它是否清晰取决于项目怎样区分不同类别的名称。

## 为什么不存在单一的“现代最佳”

### C++ 只规定合法性，不规定审美分类

语言标准关心标识符是否合法、如何查找名称，以及哪些名称保留给实现。`frontLeftPressure`、`front_left_pressure` 和 `FrontLeftPressure` 在相同上下文中都可以是合法变量名；大小写风格不会改变对象的类型、存储、性能或运行语义。

### 命名规则通常是一套分类系统

成熟规范常借名称形状传递额外信息。例如 Google 用 Pascal case 表示类型和普通函数，用 snake case 表示变量，再用尾随 `_` 标出 `class` 数据成员；Qt 用 Pascal case 表示类、lower camel case 表示变量和函数；LLVM 则用 Pascal case 表示变量与类型、lower camel case 表示函数。只比较“哪一种看起来更现代”会忽略这套组合关系。

### 生态兼容性比个人偏好更持久

代码会直接调用 `std::push_back`、Qt 的 `isEmpty()` 或 Windows Runtime 的 `RetrieveFeedAsync()`。这些外部 API 不会为了遵循本项目 house style 而改名。真实项目必然同时阅读多种风格；一致性的目标是让**项目拥有的名称**保持可预测，而不是把所有依赖伪装成同一种拼写。

### 既有代码的局部一致性通常胜过全局改名

LLVM 与 Qt 都明确要求修改现有模块时遵循当地风格，并承认历史代码可能不完全符合最新规范。为了统一大小写而进行大规模重命名会制造无关 diff、增加审查成本，还可能破坏公开 API 或下游代码。成熟工程因此常选择渐进维护，而不是追求表面上的绝对统一。

## “保持一致”的实际边界

一致性不等于“整个程序只能出现一种大小写”，更可操作的边界是：

1. **同一种实体类别保持一致**：项目可以规定普通变量统一 lower camel case，同时让类型统一 Pascal case；两者不同并不构成不一致。
2. **项目拥有的代码遵循 house style**：新建项目可以选定一套完整规则；修改既有项目时优先遵循相邻文件、模块或仓库的既定规则。
3. **公开 API 比局部变量更需要稳定**：局部变量重命名影响范围有限，公开类、函数和序列化名称可能被外部代码长期依赖，不应只为风格变化轻易改名。
4. **第三方与标准库保留原名**：调用 `std::push_back()`、Qt API 或 WinRT API 时沿用其声明的名称，不需要也无法把它们改成项目风格。
5. **生成代码、平台接口与兼容层遵循其来源**：这些区域的名称往往由工具、协议或 ABI 决定，应与普通业务代码分开看待。
6. **历史模块允许局部差异**：如果统一会产生大量无关变更，保持文件或模块内部一致通常比强行重写整个代码库更安全。

一个采用 lower camel case 变量的项目完全可以自然地出现：

```cpp
double frontLeftPressure{2.0}; // 项目自己的变量
std::vector<double> samples;   // 标准库类型沿用其原名
```

这里 `frontLeftPressure` 与 `vector` 的拼写不同，不是风格失控，而是两者属于不同命名所有者与不同实体类别。

## 对当前笔记正文的建议

当前章节只介绍变量，因此正文可以先做到以下程度：

- 介绍 lower camel case、snake case 和 Pascal case 的构词方式；
- 用 Qt、Google/Chromium 和 LLVM 说明三种变量形式都有成熟项目采用；
- 明确 C++ 没有统一规定，本笔记选择 lower camel case 作为自有变量示例；
- 说明这只是变量规则，类型、函数、成员变量等名称会在相应概念首次出现时分别讨论；
- 把“遵循所在项目的既有规范”放在“个人最喜欢哪一种”之前。

不宜在当前正文中写成“Pascal case 普遍用于变量”。更准确的表达是：它普遍用于类型，同时 LLVM 是将其用于变量的成熟代表。也不宜把标准库的 snake case 直接写成用户变量的强制惯例；它更适合作为历史与生态背景。

## 官方来源

- [C++ working draft — Identifiers](https://eel.is/c%2B%2Bdraft/lex.name)
- [C++ working draft — `unique_ptr`](https://eel.is/c%2B%2Bdraft/unique.ptr)
- [C++ working draft — `vector`](https://eel.is/c%2B%2Bdraft/vector)
- [C++ Core Guidelines — Naming and layout](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#S-naming)
- [Google C++ Style Guide — Naming](https://google.github.io/styleguide/cppguide.html#Naming)
- [Chromium C++ style guide](https://chromium.googlesource.com/chromium/src/%2B/main/styleguide/c%2B%2B/c%2B%2B.md)
- [LLVM Coding Standards](https://llvm.org/docs/CodingStandards.html)
- [Qt Coding Style](https://wiki.qt.io/Qt_Coding_Style)
- [Microsoft Learn — `lnt-naming-convention`](https://learn.microsoft.com/en-us/cpp/ide/lnt-naming-convention)
- [Microsoft Learn — Get started with C++/WinRT](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/get-started)
- [Microsoft Learn — C++/WinRT naming conventions](https://learn.microsoft.com/en-us/windows/uwp/cpp-and-winrt-apis/naming)
- [Microsoft Learn — Windows Coding Conventions](https://learn.microsoft.com/en-us/windows/win32/learnwin32/windows-coding-conventions)
