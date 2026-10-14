# C++ 表达式与运算符编码实践调研

调研日期：2026-08-12

## 结论

### 用括号明确非显然的分组，而不是机械包围所有表达式

[C++ Core Guidelines ES.41](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es41-if-in-doubt-about-operator-precedence-parenthesize) 建议在不确定运算符优先级时使用括号，理由是减少错误并改善可读性；同时也指出，程序员仍应掌握基本算术与逻辑运算的优先级。因此，更准确的实践不是“不要依赖优先级”，而是：代码不应要求读者查表才能确认意图；当表达式混合不同运算符类别、默认分组不够直观或括号能够显露业务结构时，显式写出括号。

[C++ Core Guidelines ES.40](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es40-avoid-complicated-expressions) 同时反对过于复杂的表达式，也反对把自然的简单计算机械拆成许多临时变量。尺度应是表达式的分组、转换和副作用能否被直接理解，而不是运算符数量本身。

### 不需要修改前的旧值时，优先使用前置自增与自减

[Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html#Preincrement_and_Predecrement) 与 [LLVM Coding Standards](https://llvm.org/docs/CodingStandards.html#prefer-preincrement) 都建议：除非明确需要后置表达式产生的旧值，否则使用 `++value` 或 `--value`。

根据 C++ 工作草案，[前置 `++value`](https://eel.is/c%2B%2Bdraft/expr.pre.incr) 与 `value += 1` 等价；[后置 `value++`](https://eel.is/c%2B%2Bdraft/expr.post.incr) 的表达式结果则是修改前数值的副本。对于内建整数，优化后的性能通常没有实际差异；对于迭代器或其他用户定义类型，后置形式可能需要构造旧值副本。这里首先是语义选择，其次才可能是性能选择。

### 避免把多个修改和读取塞进一个表达式

[C++ Core Guidelines ES.40](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es40-avoid-complicated-expressions) 与 [ES.43](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es43-avoid-expressions-with-undefined-order-of-evaluation) 都强调，隐藏在子表达式中的赋值和对同一对象的多次修改容易产生误解，部分形式还涉及未定义或未指定的求值顺序。[ES.44](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es44-dont-depend-on-order-of-evaluation-of-function-arguments) 进一步要求不要依赖函数实参之间的求值顺序。

当前章节适合形成的规则是：让一次语句中的状态修改保持直接可见；同一对象需要多次修改，或一次计算同时依赖其修改前后状态时，拆成顺序明确的语句。括号只改变语法分组，不能用来指定一般意义上的运行时求值顺序。

### 避免混合有符号与无符号算术

[C++ Core Guidelines ES.100](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es100-dont-mix-signed-and-unsigned-arithmetic) 建议不要混合有符号与无符号算术，因为通常算术转换可能产生违背直觉的结果。[ES.102](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es102-use-signed-types-for-arithmetic) 建议普通算术采用有符号类型；无符号类型更适合确实需要的位操作或模运算，而不应只因为某个数量“不应为负”就选用无符号类型。

### 避免隐蔽的有损转换和越界假设

[C++ Core Guidelines ES.46](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es46-avoid-lossy-narrowing-truncating-arithmetic-conversions) 建议避免有损的窄化或截断转换。[Clang-Tidy 的 narrowing-conversions 检查](https://clang.llvm.org/extra/clang-tidy/checks/bugprone/narrowing-conversions.html) 也会诊断赋值、复合赋值和二元运算中一些不会被列表初始化阻止的静默窄化。[C++ Core Guidelines ES.103](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es103-dont-overflow) 则要求不要依赖数值越界。

当前章节可以强调：先让参与运算的类型符合业务含义；不要把编译器允许的赋值转换等同于安全转换；不要依赖有符号整数回绕。显式转换的选择与范围验证可留到类型转换章节展开。

## 建议的正文位置

不建议另建一篇脱离语境的“最佳实践清单”。更适合把实践放回其规则所在的文章：

- “算术运算与通常算术转换”：避免混合 signed/unsigned、避免无意窄化、不要依赖越界；
- “赋值、自增与自减”：不需要旧值时使用前置形式；让状态修改直接可见；
- “表达式的分组与求值”：对非显然分组使用括号；避免过度复杂的表达式；不要把括号误认为求值顺序控制工具。

赋值出现在条件中应随控制流介绍；浮点比较应随浮点数值算法介绍；用具名常量替代魔法数字需要先引入 `const` 或 `constexpr`。这些内容不宜为了形成一张完整清单而提前塞入本章。
