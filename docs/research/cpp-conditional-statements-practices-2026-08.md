# C++ 条件语句工程实践调研

调研日期：2026-08-13

## 结论

当前“条件语句”章节适合补充或保留下面五条实践。它们都能用本章已经介绍的语法解释，不需要提前引入函数、指针、类或复杂类型转换。

### 1. 本教程统一为条件分支保留花括号

即使分支暂时只有一条语句，也统一写成代码块；`if` / `else if` / `else` 各分支保持一致。这样能让控制边界直接可见，也避免以后添加语句时误以为新语句仍受条件控制。Clang-Tidy 的 [`readability-braces-around-statements`](https://clang.llvm.org/extra/clang-tidy/checks/readability/braces-around-statements.html) 默认会要求所有这类受控语句使用花括号，[`readability-inconsistent-ifelse-braces`](https://clang.llvm.org/extra/clang-tidy/checks/readability/inconsistent-ifelse-braces.html) 还会检查同一条件链中混用两种写法的情况。

这应准确表述为**本教程采用的工程约定**，而不是 C++ 语言的强制规则或业界唯一共识。[Chromium C++ Style Guide](https://chromium.googlesource.com/chromium/src.git/+/main/styleguide/c++/c++.md#27) 明确要求所有条件语句和循环使用 `{}`；[Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html#Looping_and_Branching_Statements) 原则上要求受控语句放进代码块，但保留了简短单行、双行写法的历史例外；[LLVM Coding Standards](https://llvm.org/docs/CodingStandards.html#don-t-use-braces-on-simple-single-statement-bodies-of-if-else-loop-statements) 则明确要求简单单语句分支省略花括号。因此，真正跨项目通用的原则是遵守项目约定并保持一致；对教学代码而言，“始终使用”最稳妥。

### 2. 让条件直接表达要判断的事实

已经是 `bool` 的对象或谓词结果可以直接作为条件，不写冗余的 `== true` 或 `!= false`：

```cpp
if (is_pressure_safe) {
    // ...
}
```

[C++ Core Guidelines ES.87](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es87-dont-add-redundant--or--to-conditions) 反对在条件中添加冗余的 `==` / `!=`，理由是它增加噪声和出错机会。与此同时，Google 要求[变量名应足以说明变量的用途](https://google.github.io/styleguide/cppguide.html#Variable_Names)。据此，本章可以建议把布尔名称写成能读出真假含义的事实，例如 `is_pressure_safe`，但不应把 `is_`、`has_` 等某一种前缀宣称为通用强制规范。

对于计数、温度、压力等数值，条件应写出真正的业务关系，例如 `retry_count > 0`，而不是仅利用“非零转为 `true`”。这不是要求所有标量都显式与零比较；关键区别是：布尔条件避免冗余比较，数值条件则不要隐藏本来需要表达的范围含义。

### 3. 不把赋值藏进条件

本章应把常规习惯写成：先完成状态修改，再用单独的比较或布尔表达式决定分支。`if (retry_count = 0)` 在语法上成立，却很可能是把 `==` 误写成 `=`。Clang-Tidy 的 [`bugprone-assignment-in-selection-statement`](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-selection-statement.html) 专门诊断选择条件中的赋值；MSVC 的官方说明也会以 [`C4706: assignment used as a condition`](https://learn.microsoft.com/en-us/cpp/error-messages/compiler-warnings/compiler-warning-level-4-c4706?view=msvc-170) 报告它，并建议在本意是判断相等时使用 `==`。

官方工具允许程序员用额外括号或显式比较表明“赋值确实是有意的”，但这类输入循环、资源获取等惯用法依赖后续知识。本章无需把例外教成日常写法。还应注意，后续会学到的 `if` 初始化语句和在条件中声明并初始化对象，不等于赋值表达式，不应一概禁止。

### 4. 让连续分支的优先级从排列顺序中显现

`if` / `else if` 链只执行第一个条件成立的分支。因此，当多个范围有重叠时，应先放更具体的范围，再放覆盖它的宽泛范围；或者把各条件写成互斥区间。例如判断 `>= 260` 必须位于 `>= 220` 前面，否则前者永远不会命中。这里的依据首先是 [`if` 的语言语义](https://eel.is/c++draft/stmt.if)，不是某一家公司的排版偏好。

不要扩展成“异常情况永远放前面”或“最常见情况永远放前面”之类绝对规则。分支互斥时，应按业务概念最自然的顺序排列；分支重叠时，则必须让优先级明确并避免分支被前面的条件吞掉。

### 5. `?:` 只承担简单的二选一，不进行嵌套

条件运算符适合在两个简单表达式之间选择一个值，并直接用于初始化对象；包含多条操作、明显状态修改或继续嵌套 `?:` 时，使用 `if` / `else` 更清楚。Clang-Tidy 的 [`readability-avoid-nested-conditional-operator`](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html) 明确把嵌套条件运算符视为降低可读性的形式，并建议拆成若干语句或命名中间结果。[Microsoft 的 `?:` 说明](https://learn.microsoft.com/en-us/cpp/cpp/conditional-operator-q?view=msvc-170) 可作为“两个候选操作数只求值其中一个”的语义来源。

本章还可以顺势重申：只在某个分支使用的临时对象应在该分支内部、接近首次使用处声明和初始化。这符合 [C++ Core Guidelines ES.5](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es5-keep-scopes-small)、[ES.21](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es21-dont-introduce-a-variable-or-constant-before-you-need-to-use-it) 与 [ES.22](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es22-dont-declare-a-variable-until-you-have-a-value-to-initialize-it-with)。不过，该实践在前一篇“代码块、作用域与生命周期”中已经完整解释；条件语句正文不宜再增加一段重复清单，只需让示例遵守即可。

## 建议延后到后续章节

| 实践 | 延后原因与建议位置 |
| --- | --- |
| 用早返回、保护子句减少嵌套 | 依赖函数与 `return`；讲函数后再引入。届时可引用 [LLVM：Use Early Exits](https://llvm.org/docs/CodingStandards.html#use-early-exits-and-continue-to-simplify-code) 和 [Don’t use `else` after a `return`](https://llvm.org/docs/CodingStandards.html#don-t-use-else-after-a-return)。循环中的 `continue` 同样留到循环章节。 |
| `if` 初始化语句、在条件中声明对象 | 涉及声明作用域、初始化与资源获取；等相应语法出现后再讲。可引用 [C++ Core Guidelines ES.6](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es6-declare-names-in-for-statement-initializers-and-conditions-to-limit-scope)。 |
| 把复杂条件提取成具名谓词或函数 | “给复杂判断命名”是好方向，但可操作示例需要函数；当前只能要求表达式保持简单，正式规则留到函数与重构。 |
| 指针、智能指针和用户自定义类型如何写布尔条件 | `if (p)`、`p != nullptr`、`explicit operator bool` 涉及尚未学习的类型语义；不要借 ES.87 提前展开。 |
| `?:` 两个候选表达式如何决定结果类型和值类别 | 属于类型转换、引用和值类别规则，不是本章的工程实践重点。 |
| `[[likely]]` / `[[unlikely]]` 与按概率排列分支 | 需要性能测量、优化器和属性知识；不要用猜测替代分析，也不要在入门条件语句中介绍。 |

## 正文可采用的精简版本

> 条件应直接表达要判断的事实：布尔对象不需要再与 `true` 比较，数值条件则应写清真正关心的范围。不要把赋值藏进条件；即使语法允许，它也容易与相等比较混淆。连续分支按照从上到下的顺序匹配，因此重叠范围应先写更具体的情况。分支统一使用花括号；条件运算符只用于两个简单值之间的选择，并避免嵌套。

## 一手资料

- [C++ Core Guidelines：ES.5 Keep scopes small](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es5-keep-scopes-small)
- [C++ Core Guidelines：ES.6 Limit scope in control-statement initializers and conditions](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es6-declare-names-in-for-statement-initializers-and-conditions-to-limit-scope)
- [C++ Core Guidelines：ES.21 / ES.22 Delay declaration until needed and initializable](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es21-dont-introduce-a-variable-or-constant-before-you-need-to-use-it)
- [C++ Core Guidelines：ES.87 Avoid redundant comparisons in conditions](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es87-dont-add-redundant--or--to-conditions)
- [Google C++ Style Guide：Looping and branching statements](https://google.github.io/styleguide/cppguide.html#Looping_and_Branching_Statements)
- [LLVM Coding Standards：Style issues](https://llvm.org/docs/CodingStandards.html#style-issues)
- [Chromium C++ Style Guide](https://chromium.googlesource.com/chromium/src.git/+/main/styleguide/c++/c++.md)
- [Clang-Tidy：readability-braces-around-statements](https://clang.llvm.org/extra/clang-tidy/checks/readability/braces-around-statements.html)
- [Clang-Tidy：readability-inconsistent-ifelse-braces](https://clang.llvm.org/extra/clang-tidy/checks/readability/inconsistent-ifelse-braces.html)
- [Clang-Tidy：bugprone-assignment-in-selection-statement](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/assignment-in-selection-statement.html)
- [Clang-Tidy：readability-avoid-nested-conditional-operator](https://clang.llvm.org/extra/clang-tidy/checks/readability/avoid-nested-conditional-operator.html)
- [Microsoft Learn：Compiler warning C4706](https://learn.microsoft.com/en-us/cpp/error-messages/compiler-warnings/compiler-warning-level-4-c4706?view=msvc-170)
- [Microsoft Learn：Conditional operator `?:`](https://learn.microsoft.com/en-us/cpp/cpp/conditional-operator-q?view=msvc-170)
- [C++ working draft：The `if` statement](https://eel.is/c++draft/stmt.if)
