---
title: 第八课：结果契约、optional 与接口审查
date: 2026-07-22
---

# 第八课：结果契约、optional 与接口审查

一个函数不仅要“算出正确答案”，还要通过接口准确表达：调用方必须提供什么、哪些调用是允许的、失败怎样表示、成功结果与输入是什么关系，以及函数会不会修改调用方状态。

## 完整结果契约回答三个问题

对于一个可能没有结果的函数，契约至少应区分三部分：

1. **前置条件**：调用之前必须成立、由调用方保证的条件；
2. **无结果条件**：调用本身合法，但在哪些情况下没有结果；
3. **成功结果关系**：有结果时，其中的值如何由输入决定。

例如：

```cpp
// 前置条件：base_score >= 5 && base_score <= 95
// 无结果：adjustment < -5 || adjustment > 5
// 有结果时：result.value() == base_score + adjustment
std::optional<int> adjusted_score_if_accepted(
    int base_score,
    int adjustment
);
```

这三行分别说明：

- `base_score` 来自可信记录，调用方不能违反它的范围要求；
- 任意 `adjustment` 都可以传入，但超出 `[-5, 5]` 时返回无结果；
- 接受调整时，返回值不是任意整数，而必须等于两个输入之和。

边界是否包含在范围内也是契约的一部分。闭区间 `[-5, 5]` 包含 `-5` 和 `5`，因此真正的无结果条件是 `< -5` 或 `> 5`。

## 前置条件违反与合法的无结果不是一回事

```cpp
// 前置条件：end_time >= start_time
int elapsed_time(int start_time, int end_time)
{
    return end_time - start_time;
}
```

这个接口只接受调用方已经确认过先后关系的可信记录。`end_time < start_time` 不在它承诺处理的调用范围内。

原始输入接口可以采用不同契约：

```cpp
std::optional<int> elapsed_time_from_input(
    int start_time,
    int end_time
)
{
    if (end_time < start_time)
    {
        return std::nullopt;
    }

    return elapsed_time(start_time, end_time);
}
```

这里任意两个 `int` 都是合法调用输入。时间颠倒时没有结果；关系有效时，函数先完成验证，再调用只处理可信输入的核心函数。这样不会在两个函数中重复核心减法。

注意，`start_time` 为负并不自动代表无效。这个领域规则关心的是 `end_time >= start_time` 的相对关系，而不是某个参数表面上是否为负数。

## `std::optional<int>` 表达“可能有一个整数”

使用前需要包含头文件：

```cpp
#include <optional>
```

`std::optional<int>` 有两种状态：

- 有值：内部保存一个 `int`；
- 无值：内部没有 `int`。

返回无结果：

```cpp
return std::nullopt;
```

返回有值结果：

```cpp
return 0;
return end_time - start_time;
```

在返回类型为 `std::optional<int>` 的函数中，返回一个 `int` 会构造“有值”的 `optional`。因此，有值且值为 `0` 与无值完全不同：

```text
0                → 有结果，结果恰好是 0
std::nullopt     → 没有结果
```

这也是 `optional` 比 `-1` 等哨兵值更清楚的地方。哨兵值要求某个普通整数同时承担业务值和失败标记；一旦该整数也可能是合法结果，含义就会冲突。

## 读取前先检查是否有值

```cpp
std::optional<int> result{
    elapsed_time_from_input(7, 7)
};

if (result.has_value())
{
    std::cout << result.value() << '\n';
}
else
{
    std::cout << "no result\n";
}
```

- `result.has_value()` 返回 `bool`，回答内部是否保存了一个 `int`；
- `result.value()` 取得内部保存的 `int`。

不要把 `std::optional<int>` 本身当成普通整数直接输出，也不要在未确认有值时调用 `.value()`。空状态调用 `.value()` 会抛出 `std::bad_optional_access`；当前安全模式是先检查，再读取。

## 从调用点审查接口

接口审查应从调用方的需求开始，而不是从函数体中现有的参数开始。可以连续问三个问题：

1. 调用方真正必须提供哪些独立信息？
2. 函数产生的一个逻辑结果通过哪个唯一通道交付？
3. 函数是否还会产生调用点不容易看出的副作用？

这些问题会暴露冗余输入、重复结果通道和不必要的状态修改。

## 只接收最小充分输入

如果结果能够由已有输入唯一且便宜地算出，就不应要求调用方再提供一次答案：

```cpp
int rectangle_area(
    int width,
    int height,
    int supplied_area
); // supplied_area 可以由 width * height 得出
```

更紧凑的接口是：

```cpp
int rectangle_area(int width, int height)
{
    return width * height;
}
```

删除冗余参数不仅是让参数变少，也会消除调用方能够表达的矛盾组合。例如旧接口允许传入 `width == 6`、`height == 4`、`supplied_area == 99`，迫使函数决定应该相信哪一份信息。

“最小充分”不等于“参数越少越好”。外部测量值、真正独立的业务数据、计算代价很高且已由其他组件得到的结果，都可能值得作为参数传入。关键在于它是不是当前职责所需的独立信息。

## 一个逻辑结果只使用一个结果通道

下面的接口同时通过返回值和可变引用交付同一个普通结果：

```cpp
int larger_value(
    int left,
    int right,
    int& copied_result
);
```

调用方随后可能需要猜测两个结果是否始终相同：

```cpp
int copied{};
int returned{larger_value(9, 4, copied)};
```

如果函数只产生一个普通 `int` 结果，也不需要修改已有领域对象，应只按值返回：

```cpp
int larger_value(int left, int right)
{
    if (left >= right)
    {
        return left;
    }

    return right;
}
```

```cpp
int result{larger_value(9, 4)};
```

返回值、输出引用、标准输出和可变全局状态都可能成为结果或副作用通道。对单一普通结果保留一个清楚通道，可以减少同步义务，也让调用点直接表达数据流。

## 用布尔模式切换操作时应重新检查职责

```cpp
void update_timer(
    int& seconds_remaining,
    int requested_seconds,
    bool cancel
);
```

当 `cancel` 为 `true` 时取消计时，为 `false` 时设置时间，这个接口实际上把两个不同操作藏在一个布尔模式中。调用点中的 `true` 或 `false` 也很难直接表达意图。

如果两条路径代表独立职责，可以拆成两个名字清楚的函数：

```cpp
void set_timer(int& seconds_remaining, int requested_seconds);
void cancel_timer(int& seconds_remaining);
```

并非所有 `bool` 参数都不好。如果布尔值本身就是函数需要处理的数据，它可以是正常输入。需要警惕的是：它是否只用于选择两个本可独立命名的操作，并导致部分参数在某种模式下没有意义。

## 接口与结果契约检查清单

1. 每个参数都是函数职责所需的独立信息吗？
2. 调用方能否提供彼此矛盾的冗余输入？
3. 普通单一结果是否只通过返回值交付？
4. 可变引用是否真的表示必须修改的调用方对象？
5. 函数是否还通过输出、全局状态或其他通道重复交付结果？
6. 布尔模式是否隐藏了两个不同职责？
7. 前置条件是否只约束调用方必须保证的内容？
8. 合法但可能无结果的调用是否使用了清楚的错误通道？
9. `std::nullopt` 的条件和有值时的结果关系是否完整？
10. 调用方是否先检查 `optional`，再读取其中的值？

好的接口会减少调用方能够表达的无意义状态，并让必要输入、结果、失败和副作用在调用点尽可能清楚。
