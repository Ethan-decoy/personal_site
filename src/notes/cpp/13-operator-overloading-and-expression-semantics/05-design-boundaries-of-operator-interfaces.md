---
title: 运算符接口的设计边界（Design Boundaries of Operator Interfaces）
date: 2026-08-31
order: 5
---

# 运算符接口的设计边界（Design Boundaries of Operator Interfaces）

运算符接口让类类型通过已有符号表达操作。相应表达式仍然按照运算符规则建立候选，并通过重载决议确定是否调用某项运算符函数；编译器却不能判断某个符号是否准确表达了类型的业务语义。

**只有当符号的惯常含义与类型所表达的操作一致时，运算符重载才会使接口更加清晰。**

## 符号应当保持惯常含义

前面的几类运算符接口分别体现了三项惯常约定：

| 运算 | 调用者通常据此理解的语义 |
| --- | --- |
| `left + right` | 读取两个操作数，产生新的组合结果 |
| `left += right` | 修改左操作数，结果继续指代左对象 |
| `left == right` | 只读比较两个对象的逻辑状态 |

语言不强迫函数体兑现这些约定。一个合法的 `operator+` 可以修改操作数或记录外部状态，一个合法的 `operator==` 也可以给出不对称的结果；通过编译只说明函数与表达式满足语言规则，不能证明符号与操作含义相符。

调用者阅读 `left + right` 时通常不会预期 `left` 被改写。若操作没有稳定且广为接受的符号含义，具名函数能够更直接地表达意图，也为参数角色和副作用留下清晰名称。

## 重载不会改变表达式文法

运算符函数改变类类型参与某项运算时执行的操作，不会创造新的表达式文法。即使相关类型同时重载 `+` 与 `*`，表达式

```text
a + b * c
```

仍然按照

```text
a + (b * c)
```

分组。重载减法也不会改变

```text
a - b - c
```

按照

```text
(a - b) - c
```

分组的规则。需要另一种结构时，应当在调用位置显式写出括号。

优先级和结合性描述源代码怎样分组，不等同于各子表达式在运行时采用什么求值顺序。运算符重载不会把这两项规则合并。

同样，`a + b + c` 仍然包含两次二元加法，不会因为某个 `operator+` 的声明而变成一次接收三个操作数的运算。程序只能重载语言允许的既有运算符形式，不能发明新的符号，也不能改变普通一元、二元运算符所需的操作数数量。

**运算符重载能够改变类类型参与运算时的语义，不能改变承载这项运算的语法结构。**

## 重载逻辑运算符不会保留短路

内建 `&&` 和 `||` 会根据左操作数的结果决定是否跳过右操作数。类类型也可以重载这两个运算符，但选中运算符函数时，两侧表达式都必须完成求值，函数才能取得两个结果。下面的类型只用于观察这项边界，并不是推荐的接口设计：

```cpp
struct validation_result {
    bool passed;
};

validation_result operator&&(validation_result left, validation_result right) {
    return validation_result{left.passed && right.passed};
}

validation_result perform_secondary_check(bool& was_checked) {
    was_checked = true;
    return validation_result{true};
}
```

执行：

```cpp
bool secondary_check_ran{};
const validation_result first{false};

const validation_result combined{first && perform_secondary_check(secondary_check_ran)};
```

虽然 `first.passed` 为 `false`，`perform_secondary_check` 仍然执行，因此 `secondary_check_ran == true`。两个操作数求值结束后，`operator&&` 才进入函数体；此时函数已经无法撤销右操作数产生的副作用。

对于这里的运算符写法，左操作数仍然先于右操作数求值。失去的是“根据左侧结果完全跳过右侧”的短路能力，而不是左右求值顺序本身。重载 `operator||` 具有相同边界。

调用者通常会把短路视为 `&&` 和 `||` 的基本语义，因此普通接口不应使用这两个符号表达必须求值两侧的组合操作。

## 运算符不能替代领域建模

符号具有惯常含义，不表示每个类型都应当提供相应运算。两个压力变化量相加能够表示总变化量；两个绝对压力值相加是否具有业务意义，则取决于领域模型。语法能够实现 `operator+`，不能替设计者作出这项判断。

类维护不变式时，运算符函数也必须遵守与其他公开操作相同的状态边界。产生新对象的运算应当建立有效结果，修改已有对象的运算则应当在完成后继续保持调用对象有效。使用符号不会绕过构造、访问控制或不变式。

设计运算符接口时，可以检查：

- 符号是否具有稳定而惯常的含义；
- 操作数与结果是否构成明确的领域关系；
- 运算是否以调用者能够预期的方式修改对象；
- 常见表达式是否能够得到唯一而自然的重载选择；
- 运算符是否丢失了调用者依赖的内建特殊语义。

**运算符重载适合让类类型自然进入已有的运算语汇，不适合把缺少清晰名称的操作包装成更短的符号。**

## 参考资料

- [C++23 工作草案：表达式总则](https://timsong-cpp.github.io/cppwp/n4950/expr.pre)
- [C++23 工作草案：重载运算符](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：表达式中的运算符重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper)
- [C++23 工作草案：逻辑与运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.log.and)
- [C++23 工作草案：逻辑或运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.log.or)
- [C++ Core Guidelines：按照惯常含义定义运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-conventional)
