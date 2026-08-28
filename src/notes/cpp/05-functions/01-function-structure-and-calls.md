---
title: 函数定义与调用（Function Definitions and Calls）
date: 2026-08-27
---

# 函数定义与调用（Function Definitions and Calls）

此前的代码已经能够创建对象、求值表达式，并通过条件与循环改变执行过程。实际程序还需要把一组共同完成某项工作的语句，组织成可以明确调用的执行单元。C++ 使用函数（function）表达这样的单元。

## 把一段行为命名为函数

下面的函数产生一个默认气压上限：

```cpp
int default_pressure_limit_kpa() {
    return 220;
}
```

这是一条函数定义（function definition）。它由返回类型（return type）、函数名（function name）、参数列表（parameter list）和函数体（function body）组成：

| 组成部分 | 当前示例 | 含义 |
| --- | --- | --- |
| 返回类型 | `int` | 函数调用产生的结果类型 |
| 函数名 | `default_pressure_limit_kpa` | 标识这项可调用行为的名称 |
| 参数列表 | `()` | 表示当前函数不接收输入数据 |
| 函数体 | `{ ... }` | 调用时执行的复合语句 |

函数体沿用已经建立的代码块模型，可以包含声明、表达式语句、选择语句和循环语句。定义末尾的右花括号已经结束整条函数定义，后面不再添加分号。

**函数不是保存语句的对象，定义函数也不会在源码出现的位置执行函数体。函数定义建立的是一项可以被调用的行为。**

## 调用才会进入函数体

在当前表达式语境中，函数名后写一对调用圆括号，就形成函数调用（function call）：

```cpp
int pressure_limit_kpa{default_pressure_limit_kpa()};
```

`default_pressure_limit_kpa()` 是一条调用表达式。执行到这里时：

1. 控制进入 `default_pressure_limit_kpa` 的函数体；
2. `return` 语句（return statement）中的字面量 `220` 完成求值；
3. 这个值建立本次调用的 `int` 结果，当前调用随后结束；
4. 控制回到调用位置，调用结果用于初始化 `pressure_limit_kpa`。

即使函数不接收输入，调用语法中的空圆括号也不能省略。它们表示这里正在发起一次调用，而不是只写出函数名称。

**定义描述调用时做什么，调用才真正使执行路径进入函数体。**当前调用通过 `return` 正常完成后，外围表达式继续使用它产生的结果。

## 函数调用也是表达式

调用结果可以直接参与更大的表达式：

```cpp
int warning_pressure_kpa{default_pressure_limit_kpa() - 20};
```

调用先产生 `int` 值 `220`，减法再产生 `200`，最终用于初始化 `warning_pressure_kpa`。对于当前返回算术值的函数，**调用表达式的类型就是所调用函数声明的返回类型。**因此，这里的调用可以像其他 `int` 表达式一样参与算术运算。

同一个函数可以出现在多个调用表达式中。每次执行到调用时，函数体都会为这一次调用重新执行；函数定义本身不会被复制，也不会因曾经调用过一次而保存某条执行路径。

## 让函数边界表达意图

函数的价值不只在于减少重复代码。名称能够说明一组语句共同完成什么，返回类型则形成调用者与函数体之间的边界。

`default_pressure_limit_kpa` 同时说明结果的业务含义和单位。相比 `process`、`handle` 或 `value`，这样的名称让调用位置无需展开函数体也能理解正在取得什么。

**一个函数应当围绕一项能够被清楚命名的工作组织语句。**如果名称必须同时罗列许多彼此独立的动作，通常说明函数边界没有准确对应问题本身。

## 参考资料

- [C++23 工作草案：函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
