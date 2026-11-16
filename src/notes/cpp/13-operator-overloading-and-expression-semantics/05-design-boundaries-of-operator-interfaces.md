---
title: 运算符接口的设计边界（Design Boundaries of Operator Interfaces）
date: 2026-08-31
order: 5
---

# 运算符接口的设计边界（Design Boundaries of Operator Interfaces）

同样写成 `left + right`，调用者通常会把它理解为读取两项输入、得到一个新结果。类类型可以通过运算符函数提供这项操作，但函数能被选中，不代表它符合调用者对符号的预期。

设计运算符接口时，需要同时判断语言允许什么，以及当前类型适合表达什么。符号的分组规则、操作数怎样进入函数、操作是否修改对象，分别约束不同的关系。

## 符号应当保持惯常含义

前面的几类运算符接口分别体现了三项惯常约定：

| 运算 | 调用者通常据此理解的语义 |
| --- | --- |
| `left + right` | 读取两个操作数，产生新的组合结果 |
| `left += right` | 修改左操作数，结果继续指代左对象 |
| `left == right` | 只读比较两个对象的逻辑状态 |

语言不强迫函数体兑现这些约定。一个合法的 `operator+` 可以通过可修改引用改写操作数，一个合法的 `operator==` 也可以给出不对称的结果；通过语法与类型检查，不能证明符号与操作含义相符。

> [!PRACTICE] 让符号符合调用者对操作的预期
> 为普通值类型提供运算符时，应使对象关系、结果与副作用符合符号的惯常含义。例如，调用者通常不会预期 `left + right` 改写 `left`。
>
> 操作没有清楚且稳定的符号含义，或需要额外说明目标与副作用时，具名函数通常更直接。名字可能使表达式稍长，却能明确说明准备完成什么，而不是让调用者从符号猜测。

## 重载不会改变表达式文法

下面只对照表达式的分组方式。每项运算能否成立，仍须由相应操作数类型、候选函数与结果类型判断：

| 表达式 | 语法规定的分组 | 当前结构 |
| --- | --- | --- |
| `a + b * c` | `a + (b * c)` | 乘法结果作为加法的右侧输入 |
| `a - b - c` | `(a - b) - c` | 前一次减法结果作为后一次减法的左侧输入 |
| `a + b + c` | `(a + b) + c` | 包含两次二元加法 |

> [!IMPORTANT] 分组与操作数数量由语法规定
> **重载不会改变运算符的优先级、结合性或普通一元、二元形式所需的操作数数量，也不能发明新的运算符符号。**`a + b + c` 不会变成一次接收三个操作数的加法。
>
> 分组说明各项结果怎样组合，不自动保证所有操作数按从左到右的顺序求值。需要另一种分组时，在调用位置明确写出括号；判断求值顺序时，仍要核对相应运算符的规则。

## 重载逻辑运算符不会保留短路

内建布尔 `&&` 在左侧为 `false` 时跳过右侧，内建布尔 `||` 在左侧为 `true` 时跳过右侧。选中重载的运算符函数时，进入函数体前则需要准备好两个操作数所提供的输入。

下面是完整的演示程序，用类类型的 `&&` 观察这项边界。`validation_result` 的 `passed` 成员保存检查是否通过；`secondary_check_ran` 单独记录辅助检查是否执行。辅助函数有意固定返回 `true`，把检查结果与执行记录分开。这份重载只用于演示，并非推荐的普通接口：

```cpp
#include <iostream>

struct validation_result {
    bool passed;
};

validation_result operator&&(const validation_result left, const validation_result right) {
    return validation_result{left.passed && right.passed};
}

bool perform_secondary_check(bool& was_checked) {
    was_checked = true;
    return true;
}

int main() {
    bool secondary_check_ran{false};
    const validation_result first{false};

    const validation_result combined{
        first && validation_result{perform_secondary_check(secondary_check_ran)}};

    std::cout << combined.passed << ' ' << secondary_check_ran << '\n';
}
```

右侧的 `validation_result{...}` 用辅助函数返回的布尔值建立第二份检查结果。求值过程可以分开追踪：

1. 左操作数 `first` 提供未通过的检查结果，`passed` 为 `false`。
2. 右侧调用 `perform_secondary_check`，把执行标志改为 `true`，再用返回的 `true` 建立第二份检查结果。
3. 进入 `operator&&` 时，两份按值形参分别保存 `false` 与 `true`。
4. 函数体里的两个 `passed` 都是布尔成员，这里的内建 `&&` 得到 `false`，按值返回 `passed` 为 `false` 的结果对象。

程序输出 `0 1`：最终检查结果未通过，但辅助检查已经执行。默认布尔输出用 `0`、`1` 分别表示 `false`、`true`。

> [!WARNING] 函数体内的短路不能跳过先前的实参求值
> **选中重载的 `operator&&` 后，左侧结果为 `false` 也不会跳过右操作数。**本例进入函数体时，辅助检查已经执行；函数体里的内建 `bool &&` 只能跳过读取 `right.passed`，不能阻止先前的检查调用。
>
> 对 C++23 中这里的运算符写法，左操作数仍先于右操作数求值。重载的 `operator||` 同样需要先取得两项输入，左侧为 `true` 也不能跳过右侧。条件跳过与左右先后是需要分别判断的关系。

保留开篇的类型与函数定义，用下面片段替换 `main` 的函数体，单独比较内建布尔版本。执行标志重新从 `false` 开始：

```cpp
bool secondary_check_ran{false};
const bool first{false};

const bool combined{first && perform_secondary_check(secondary_check_ran)};
std::cout << combined << ' ' << secondary_check_ran << '\n';
```

这里的两个操作数都是布尔表达式，因此使用内建 `&&`。左侧为 `false`，辅助函数不执行，标志保持 `false`，输出 `0 0`。

两版的“是否通过”结果都为 `false`，右侧是否执行却不同。第一版保存的是类类型结果对象，第二版保存的是 `bool`；当前对照比较的是逻辑判断与执行记录，不表示两项接口在所有语境下等价。

如果两项检查都需要完成，再组合已经取得的结果，可以使用具名函数。下面是另一版接口：保留 `validation_result` 与 `perform_secondary_check`，用这个函数替换演示用的 `operator&&`，定义仍放在 `main` 之前：

```cpp
validation_result combine_results(const validation_result left, const validation_result right) {
    return validation_result{left.passed && right.passed};
}
```

把 `main` 的函数体替换为下面片段，从相同初值独立执行：

```cpp
bool secondary_check_ran{false};
const validation_result first{false};
const validation_result second{perform_secondary_check(secondary_check_ran)};

const validation_result combined{combine_results(first, second)};
std::cout << combined.passed << ' ' << secondary_check_ran << '\n';
```

这一版先执行辅助检查，再把两份结果交给组合函数，输出仍为 `0 1`。修改的是接口表达与执行步骤的可见性，没有把组合操作改成条件执行。

> [!PRACTICE] 区分组合结果与按条件执行检查
> 两项检查都需要取得结果时，可以先明确执行各项检查，再用具名函数组合已有结果。执行步骤在调用处直接可见，函数名称也表明它处理的是已经得到的结果。
>
> 需要由左侧决定右侧是否执行时，保留内建布尔运算的短路，或用 `if` 明确写出控制流。普通具名函数也要先准备实参，不会因为换了名称就自动获得短路；应按实际执行要求选择接口。

## 运算符不能替代领域建模

符号有惯常含义，不表示每个类型都应提供相应运算。两段位移可以合成为总位移，`+` 有明确的值关系；两个网格位置是否应当支持“相加”，则要先说明期望的操作与结果。同样保存整数分量，不能单独成为选择加法接口的理由。

运算符函数仍受适用的构造与访问规则约束。类型承诺的[类不变式](../10-class-interfaces-and-encapsulation/05-encapsulation-and-class-invariants.md#修改操作先验证再更新)则需要接口和实现主动维护：产生新对象时建立有效状态，修改已有对象时使被修改的对象继续满足约束。成员与非成员形式都承担这项责任。

> [!WARNING] 语言不会自动维护类型的不变式
> 若某类型规定档位必须位于 `[0, 100]`，整数 `130` 虽然可以由 `int` 表示，仍然不符合该类型的状态约束。运算符函数通过编译，不代表它验证了这项范围。
>
> 应按类型契约规定有效输入、结果与必要的失败处理，不能把构造、访问检查或运算符语法当成自动维护不变式的机制。

常见表达式还应能确定唯一且符合预期的重载目标。[成员与非成员形式共同参与重载决议](02-member-and-non-member-operator-functions.md#两种形式共同参与重载决议)时，每项定义分别合法，也可能因入口重叠使某条调用产生歧义。语义关系、状态约束与调用匹配都明确后，符号才能稳定地表达这项接口。

## 参考资料

- [C++23 工作草案：内建语义与重载调用规则](https://timsong-cpp.github.io/cppwp/n4950/expr.pre)
- [C++23 工作草案：重载运算符的语法约束](https://timsong-cpp.github.io/cppwp/n4950/over.oper)
- [C++23 工作草案：运算符写法中的求值顺序](https://timsong-cpp.github.io/cppwp/n4950/over.match.oper#2)
- [C++23 工作草案：逻辑与运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.log.and)
- [C++23 工作草案：逻辑或运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.log.or)
- [C++ Core Guidelines：按照惯常含义定义运算符](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#ro-conventional)
