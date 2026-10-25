---
title: 布尔类型（Boolean Type）
date: 2026-08-25
---

# 布尔类型（Boolean Type）

## 两种逻辑状态

圆 A 是否被选中，只需要区分“已选中”和“未选中”两种状态，可以使用布尔类型（Boolean type）`bool` 记录。下面的片段放在 `main` 函数体内：

```cpp
bool circle_selected{false};

circle_selected = true;
```

第一行定义 `circle_selected`，用 `false` 初始化，表示“圆 A 未被选中”。第二行把已有对象的值改为 `true`，表示“圆 A 已被选中”。赋值后，仍然是同一个 `bool` 对象，改变的是它当前记录的状态。

> [!IMPORTANT] 布尔值与逻辑状态
> **`bool` 只有 `true`（真）和 `false`（假）两个值，用于表达含义明确的“是”或“否”。**具体对应什么状态，要结合变量名所表达的问题理解；在 `circle_selected` 中，它们分别表示“已选中”和“未选中”。

## 与整数值的关系

在 C++ 的正式类型分类中，`bool` 属于整型（integral type），但它是一个独立类型，与 `int` 并不是同一种类型。整数或浮点数的值转换为 `bool` 时，零转换为 `false`，非零值转换为 `true`，包括负数。

在上面的片段之后继续执行以下普通赋值，可以观察整数转换为布尔值的结果：

```cpp
circle_selected = 0;  // 保存 false
circle_selected = 2;  // 保存 true
circle_selected = -2; // 保存 true
```

这些赋值没有把 `2` 或 `-2` 作为数值保存到 `circle_selected` 中，它们都先转换成了 `true`。转换结果只有 `true`、`false` 两种，不能从中恢复原整数的大小。

但在花括号初始化中，还需要检查是否发生窄化转换（narrowing conversion）。下面是一条独立的错误声明，同样放在 `main` 函数体内：

```cpp
bool circle_selected{2}; // 错误：int 值 2 到 bool 的列表初始化发生窄化
```

`bool` 不能按原数值保留整数 `2`，这种列表初始化属于窄化，编译器必须诊断。这里不会完成初始化后得到 `true`。直接写出的整数 `0`、`1` 则可以分别用于 `bool` 的花括号初始化；这不意味着任意整数都能放进同样的花括号中。

> [!IMPORTANT] 数值转换与布尔值
> **数值转换为 `bool` 时，零得到 `false`，非零值得到 `true`；具体语境还会限制是否允许进行这种转换。**普通赋值可以把整数 `2` 转换为 `true`，花括号初始化 `bool circle_selected{2};` 则因窄化而不合法。

花括号如何检查转换、哪些数值可以例外保留，见[列表初始化与窄化](../06-constants-literals-and-type-conversions/05-list-initialization-and-narrowing.md#花括号会检查当前初始化边界)。直接表达逻辑状态时，使用 `true`、`false` 比依赖数值转换更清楚；“属于整型”并不表示应当把 `bool` 当作普通计数器。

## 值集合与存储大小

像 `circle_selected` 这样单独定义的 `bool` 对象至少占用一个 C++ 字节，具体大小由实现决定。在当前主流的 8 位字节实现中，它通常恰好占用 1 字节，也就是 8 比特。

> [!IMPORTANT] 值集合与存储大小
> **对象占用多少比特，与它在语言层面具有多少个有效值，是两个不同的问题。**即使一个 `bool` 对象占用 8 比特，它仍然只有 `true` 和 `false` 两个值；$2^8=256$ 是 8 比特能够形成的组合数量，不能据此推断有 256 个不同的 `bool` 值。

## 二元模型的边界

`bool` 适合表示真正只有两种状态的信息。如果“未知”“尚未检查”或“发生故障”也是独立状态，单独一个 `bool` 就无法完整表达业务含义。此时应当选择能够明确列出全部状态的类型，而不是再约定某个隐藏值。

例如，一次检查可能有“通过”“不通过”“尚未检查”三种状态。把后两种都记录为 `false`，读取这个值时就无法区分它们。问题在于需要保留三种状态，而 `bool` 只能区分两种。

## 参考资料

- [C++23 工作草案：基本类型](https://timsong-cpp.github.io/cppwp/n4950/basic.fundamental)
- [C++23 工作草案：布尔转换](https://timsong-cpp.github.io/cppwp/n4950/conv.bool)
- [C++23 工作草案：列表初始化与窄化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
