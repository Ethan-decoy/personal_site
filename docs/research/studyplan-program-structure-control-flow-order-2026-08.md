# StudyPlan.dev 程序结构与控制流顺序调研

调研日期：2026-08-13

范围：StudyPlan.dev 的 [Intro to C++ Programming](https://www.studyplan.dev/intro-to-programming)；重点核对 `main`、语句、代码块、作用域、生命周期、函数与控制流是何时正式讲解的，以及是否存在“先使用、后解释”。

## 结论

StudyPlan.dev 的主线不是“先完整建立程序结构，再进入控制流”，而是“先给出一份可以运行的固定骨架，随着需求逐步解释其中的组成”。这种顺序适合快速获得可运行结果，但确实大量采用了先使用、后正式讲解：`main` 和函数体的 `{}` 从第 1 课开始出现，`main` 到第 8 课才被解释为特殊函数；`if` 在第 10 课出现，而 block scope 到第 15 课才正式讲解；对象生命周期则更晚才随着构造、析构、指针问题逐步出现。

因此，它值得借鉴的是依赖关系和节奏，而不是逐课照搬。当前仓库已经比它更早、更深入地建立对象、类型、初始化、表达式和运算规则。下一步应补齐较小的“程序结构与语句”桥梁，再进入控制流；没有必要把完整普通函数章节搬到 `if` 之前，也不宜像 StudyPlan.dev 那样等到条件分支之后才解释块作用域。

## StudyPlan.dev 的准确课次顺序

该课程共 61 课；第 1 章为 7 课，第 2 章从全课程第 8 课开始。第 2 章导航给出的完整次序是：

| 全课程课次 | StudyPlan.dev 课程 | 与本次问题相关的正式内容 |
|---:|---|---|
| 1 | [Setting up a C++ Development Environment](https://www.studyplan.dev/intro-to-programming/cpp-ide) | 首次使用完整 `int main() { ... }`；正式给出 statement 的入门定义，但不解释 `main` 是函数，也不解释 compound statement、block 或 scope |
| 8 | [Creating and Calling Functions](https://www.studyplan.dev/intro-to-programming/functions) | 首次正式解释函数、函数体、调用，以及 `main` 是程序入口 |
| 9 | [The Call Stack and Debugging Functions](https://www.studyplan.dev/intro-to-programming/debugging-functions) | 函数调用栈 |
| 10 | [Conditional Logic](https://www.studyplan.dev/intro-to-programming/conditional-logic) | `if`、`else`、`else if`；需要多条语句时直接用 `{}` 包围，但仍未给 compound statement 的正式语言分类 |
| 11 | [Switch Statements](https://www.studyplan.dev/intro-to-programming/switch-statements) | `switch`、`case`、`default`、fallthrough；首次正式用 `break` 控制 `switch` |
| 12 | [Function `return` Statements](https://www.studyplan.dev/intro-to-programming/return-values) | 函数返回值、`return`、提前返回 |
| 13 | [Implicit Conversions and Narrowing Casts](https://www.studyplan.dev/intro-to-programming/implicit-conversions) | 与本题无直接关系 |
| 14 | Function Arguments and Parameters | 函数参数与实参 |
| 15 | [Scope](https://www.studyplan.dev/intro-to-programming/scope) | 首次系统讲 global/file scope、block scope、参数作用域、嵌套作用域访问和 name hiding |
| 16 | Forward Declarations | 函数前向声明 |
| 17 | [Loops](https://www.studyplan.dev/intro-to-programming/loops) | 在同一课依次讲 `while`、`do while`、`for`；后半正式讲循环中的 `continue` 与 `break` |
| 18–20 | Modulus、Fizz Buzz、Short-circuit Evaluation | 控制流练习与短路求值 |

第 2 章的课序可由任一章内页面底部的 [Chapter Navigation](https://www.studyplan.dev/intro-to-programming/functions) 直接核对。`Creating and Calling Functions` 页面同时明确标为下一课（全课程第 9 课之前的一课），因此它是全课程第 8 课。

## 各概念是正式讲解，还是提前使用

### `main` 与程序入口

- **首次使用：第 1 课。** 第一个 Hello World 直接给出 `int main() { ... }`。页面明确承认暂时会跳过一些内容，并要求读者先只改 `{}` 之间的区域。
- **首次正式解释：第 8 课。** [Creating and Calling Functions](https://www.studyplan.dev/intro-to-programming/functions) 的 “The `main` Function” 才说明 `main` 是函数和可执行程序的入口，`main` 结束时程序结束。
- **判断：明显先用后讲。**

### statement（语句）

- **首次正式定义：第 1 课。** [Statements](https://www.studyplan.dev/intro-to-programming/cpp-ide) 将 statement 简化为交给计算机执行的一项指令，并说明示例中的语句以分号结束。
- **覆盖深度：只是入门定义。** 没有建立 C++ statement 的类别，也没有区分 expression statement、declaration statement、compound statement、selection statement、iteration statement 和 jump statement。
- **判断：较早讲解，但并未形成严谨语法体系。**

### compound statement、block 与 `{}`

- **首次使用：第 1 课。** `main` 的函数体已经使用 `{}`。
- **第 8 课：** 将函数的 `{}` 之间称为函数体（body），解释它容纳函数要执行的操作。
- **第 10 课：** 讲 `if` 时说明，如果条件成立后要执行多条语句，可用 `{}` 将它们包围为一块代码。
- **第 15 课：** [Scope](https://www.studyplan.dev/intro-to-programming/scope) 才正式说明一对 `{}` 建立 block scope，并说明裸代码块也可以单独出现。
- **缺失：** 课程没有在控制流前正式把 `{ ... }` 定义为 compound statement，并说明它在语法上是一条 statement。这是其讲解深度较浅的明显位置。

### scope（作用域）

- **此前使用：** 函数体从第 1 课出现，`if` block 从第 10 课出现，`switch` body 从第 11 课出现。
- **首次正式讲解：第 15 课。** 位置在函数、条件分支、`switch`、函数返回和函数参数之后，但在循环之前。
- **判断：先使用多个作用域构造，再统一解释；循环因此能直接复用已经讲过的块作用域规则。**

### object lifetime（对象生命周期）

- **第 15 课的 Scope 并未严谨区分 scope 与 lifetime。** 它有时用“对象只存在于 block 内”描述名字不可访问，但主体讲的是名称可见性与嵌套访问。
- **第 23 课左右的 [Constructors and Destructors](https://www.studyplan.dev/intro-to-programming/constructors) 才借析构函数明确演示：在函数内创建的对象于函数结束时销毁。**
- **第 34 课的 [Dangling Pointers and References](https://www.studyplan.dev/intro-to-programming/dangling-pointers) 才结合 automatic/static/thread/dynamic storage duration 系统讨论更广的存续问题。**
- **判断：生命周期不是控制流前的独立基础课，而是在作用域、类、指针阶段逐层补充。**

### 普通函数

- **第 8 课正式讲创建与调用。** `main` 也在这一课被解释。
- **第 12 课补返回类型和值，第 14 课补参数，第 16 课补前向声明。** 函数不是一次讲完，而是与条件逻辑交错展开。
- **判断：StudyPlan.dev 把普通函数放在 `if` 之前，但完整函数体系并没有放在 `if` 之前。**

### `if` / `else`、`switch`

- **第 10 课：** `if`、`else`、`else if`。
- **第 11 课：** `switch` 紧随其后，并在此介绍 switch 的 `break` 和 fallthrough。
- **判断：条件分支依赖此前已经讲过的 `bool`、表达式和最小函数体直觉；这条依赖顺序值得保留。**

### `while` / `do while` / `for`、`break` / `continue`

- **第 17 课统一正式讲解。** 顺序为 `while` → `do while` → `for` → 循环作用域与嵌套 → `continue` → `break` → 循环中的 `return`。
- **`break` 并非首次出现。** 它已在第 11 课为阻止 `switch` fallthrough 正式出现；第 17 课才讲其退出循环的含义。
- **`continue` 首次正式出现于第 17 课。**

## 与本仓库现有进度的对照

当前笔记已有：

- `00-introduction`：语言与工具，另已新增空白与注释；
- `01-objects-types-and-variables`：OOP 直觉、对象与内建类型、变量/声明/初始化；
- `02-expressions-and-operators`：表达式、运算符、算术转换、赋值、自增自减、比较、逻辑、短路、分组与求值。

相较 StudyPlan.dev，我们已经提前完成了它在第 13 课才讲的常用算术转换，以及第 20 课才单列的短路求值，也远比它更细致地区分对象、值、初始化和表达式类型。真正的结构缺口不是再补更多运算，而是：尚未解释最小程序入口、statement 的正式角色、compound statement / block、以及最小限度的 block scope。

## 建议：借鉴依赖关系，不照搬课次

### 值得借鉴

1. **先有 `bool`、比较和逻辑表达式，再讲 `if`。** 当前笔记已经满足。
2. **`if` 后紧接 `switch`。** 两者都是 selection statement，放在同一控制流章节便于比较适用场景。
3. **作用域必须早于循环中的局部变量讨论。** StudyPlan.dev 把 scope 放在 loops 前，这一点正确。
4. **循环内部保持 `while` → `do while` → `for` 的顺序。** `while` 最能直接表达“条件为真就重复”；`for` 再将初始化、条件和更新集中起来。
5. **生命周期分层讲。** 现在先解释 automatic local object 离开 block 时结束；storage duration、悬垂引用和资源管理应在指针/RAII 处深入，不必一次讲完。

### 不适合直接照搬

1. **不应复制“第 1 课给骨架，第 8 课才解释 `main`”的跨度。** 这些笔记追求概念闭环，现在应先补一篇 `main` 与程序入口。
2. **不应等到 `if`、`switch` 和参数之后才解释 block scope。** 对高深度笔记而言，读者在第一次看到控制流花括号前就应知道 `{ ... }` 是 compound statement，以及它引入 block scope。
3. **不应把完整普通函数教程强行放在控制流之前。** 这会提前引入参数、返回值、声明/定义分离、调用栈等大量新依赖。此处只需要把 `main` 作为特殊函数解释到足以承载语句；普通函数可在控制流之后系统展开。
4. **不应把 scope 与 lifetime 混写。** 现在可以并列建立最小直觉：scope 约束名称能在源代码何处使用；lifetime 约束对象在执行期间何时存在。名称和对象不是同一事物，后续仍需分别深入。
5. **不应采用“所有以分号结尾的都是语句”这类初学者近似。** 应说明某些 statement 以分号结束，而 compound、selection、iteration 等 statement 的外形不同。

## 对下一阶段目录的明确建议

### `03 · 程序结构与语句`

1. **`main` 与程序入口**：只解释 hosted C++ 程序需要的入口、`int main()` 的当前外形、函数体和正常结束；明确普通函数以后系统讲。
2. **语句与顺序执行**：定义 statement，区分当前已经见过的 declaration statement、expression statement，并概览 compound / selection / iteration / jump statement；避免把分号误写成所有 statement 的统一结束符。
3. **复合语句与代码块**：说明 `{ ... }` 是 compound statement，在语法上把零条或多条 statement 组合为一条；区分函数体/控制流 block 与列表初始化的 `{}`。
4. **块作用域与局部对象**：讲声明点、父子 block 的可见性与遮蔽风险；同时以独立小节区别 scope 和 lifetime，只给 automatic local object 的当前规则。

### `04 · 控制流`

1. `if`、`else if`、`else`
2. `switch`、`case`、`default`、fallthrough 和 switch 中的 `break`
3. `while`
4. `do while`
5. `for`
6. 循环中的 `break`、`continue`

### `05 · 函数`

再系统讲普通函数的声明与定义、调用、参数、返回值、局部状态、调用栈和前向声明。这里会重新回看 `main`，将前面刻意保留的细节补全。

这种顺序比 StudyPlan.dev 多一层程序结构基础，但没有为了“先讲函数”而把大量函数细节塞到控制流之前，既满足当前笔记的严谨度，也保留了主线推进速度。
