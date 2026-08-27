---
title: 列表初始化与窄化（List Initialization and Narrowing）
date: 2026-08-27
order: 5
---

# 列表初始化与窄化（List Initialization and Narrowing）

## 花括号会检查当前初始化边界

使用花括号进行列表初始化（list-initialization）时，语言会拒绝需要窄化转换的初始化：

```cpp
int direct_count{3.8};         // 错误：直接列表初始化发生窄化
int copy_list_count = {3.8};   // 错误：复制列表初始化同样发生窄化
int copy_count = 3.8;          // 允许：复制初始化后得到 3
```

第一行是直接列表初始化（direct-list-initialization），第二行是复制列表初始化（copy-list-initialization）。二者虽然外形不同，但都属于列表初始化。浮点数转换为整数在列表初始化中始终属于**窄化转换（narrowing conversion）**，因此程序不合法，编译器必须诊断。

第三行没有使用列表初始化。语言允许把 `double` 值转换为 `int`，丢弃小数部分，再初始化 `copy_count`。编译器可能发出警告，但这不是语言要求程序必须被拒绝的同一件事。

如果项目把警告视为错误，第三行也可能导致构建失败；那是项目选择的诊断策略，而不是 C++ 把它归类成了不合法的列表初始化。

## 窄化是标准定义的分类

“窄化”不是对所有潜在信息损失的日常统称。C++ 为列表初始化定义了具体的转换类别和例外。表中的浮点转换等级（floating-point conversion rank）描述浮点类型在转换规则中的相对等级，例如 `double` 的等级高于 `float`：

| 转换 | 列表初始化中的判定 |
| --- | --- |
| 浮点数 → 整数 | 始终是窄化，没有常量表达式例外 |
| 较高浮点转换等级 → 较低等级 | 通常是窄化；对于有限的常量表达式，只要转换结果没有超出目标范围，就不算窄化 |
| 整数 → 浮点数 | 通常是窄化；常量表达式能够由目标类型表示，并且转回原整数类型仍得到原值时除外 |
| 整数 → 不能覆盖源类型全部取值的整数类型 | 通常是窄化；常量表达式的实际值能够由目标类型表示时除外 |

因此，花括号拒绝的是语言定义的窄化转换，不是所有可能发生舍入或信息变化的转换。

## 常量表达式例外检查实际值

```cpp
constexpr int wheel_count{4};
short stored_wheel_count{wheel_count};  // 正确：4 能够由 short 表示

int measured_wheel_count{4};
short stored_measurement{measured_wheel_count};  // 错误：潜在窄化
```

两个源对象当前都保存 4，但语言能够在翻译期间验证 `wheel_count` 的值；它不能把普通运行期对象 `measured_wheel_count` 的当前状态当作列表初始化的静态保证。

整数转换为浮点数也有相应的精确表示要求：

```cpp
float exact_count{7};  // 正确：7 能够由 float 精确表示

int measured_count{7};
float runtime_count{measured_count};  // 错误：潜在窄化
```

## C++23 的浮点降级边界

`double` 的浮点转换等级高于 `float`。在 C++23 中，有限的常量表达式从较高等级转换到较低等级时，只要结果仍处于目标类型可表示的范围内，就不属于列表窄化；规则不要求转换前后的值完全相等：

```cpp
float stored_ratio{0.1};  // C++23：正确，结果可能经过舍入

double measured_ratio{0.1};
float runtime_ratio{measured_ratio};  // 错误：源表达式不是常量表达式
```

这条规则说明，不能把花括号概括为“拒绝一切精度损失”。它提供的是一组明确的静态诊断边界。

## 初始化时的花括号不会约束以后

```cpp
int displayed_temperature_c{0};

displayed_temperature_c = 6.9;    // 允许：普通赋值后得到 6
displayed_temperature_c = {6.9};  // 错误：这次赋值本身使用了花括号
```

对象创建时使用花括号，不会使该对象以后只能接收“无窄化”的赋值。第一条赋值按照普通隐式转换规则执行。

第二条赋值的右侧本身是花括号列表。对于当前标量对象，它相当于先按 `int{6.9}` 检查目标值，因此会因窄化而不合法。准确的边界不是“花括号只保护初始化”，而是**花括号检查它所在的那一次列表转换边界**。

## 花括号不会追踪表达式内部

```cpp
int keep_count(int count) {
    return count;
}

int stored_count{keep_count(3.8)};
```

这段代码在语言层面允许成立。调用 `keep_count` 时，`3.8` 已经隐式转换为 `int` 并初始化形参；函数调用表达式最终产生 `int` 值，外层花括号接收到的也是 `int`。外层列表初始化不会回头检查函数调用内部已经发生的 `double` 到 `int` 转换。

因此，优先使用花括号初始化能够尽早暴露一类类型错误，但它不是贯穿整个表达式的数据验证系统。类型范围、业务允许的损失以及转换发生的位置仍然需要单独判断。

## 参考资料

- [C++23 工作草案：列表初始化与窄化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：赋值](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
