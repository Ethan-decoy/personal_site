---
title: 第七课：函数接口、纯计算与契约
date: 2026-07-21
---

# 第七课：函数接口、纯计算与契约

## 接口应直接表达调用方需要什么

函数接口主要由函数名、形参、返回类型和调用方可观察到的修改组成。设计接口时，先判断每项数据在调用中的角色：

1. 函数只是读取这个值，还是必须修改调用方对象？
2. 函数产生的是普通计算结果，还是某个已有对象的别名？
3. 调用方需要知道哪些失败信息？
4. 调用之前必须满足哪些条件？

不要先看到引用语法，再寻找使用它的理由。参数形式应由调用方需求决定。

## 小型只读输入通常按值传递

```cpp
int coordinate_sum(int x, int y)
{
    return x + y;
}
```

`x` 和 `y` 只是两个整数输入。按值传递会创建函数局部副本，函数不需要与调用方共享对象身份，也不需要修改调用方状态。

如果函数必须让调用方看到修改，才使用可变引用：

```cpp
int move_and_get_sum(int& x, int& y, int x_step, int y_step)
{
    x = x + x_step;
    y = y + y_step;
    return x + y;
}
```

这里：

- `x`、`y` 必须被调用方观察到修改，因此使用 `int&`；
- `x_step`、`y_step` 只提供数值，因此使用普通 `int`；
- 新的坐标和是普通结果，因此按值返回。

## 普通结果优先使用返回值

```cpp
int calculate_change(int paid, int cost)
{
    return paid - cost;
}
```

差额是函数产生的普通结果，直接 `return` 最清楚。不要为了“使用引用”而改成输出参数：

```cpp
void calculate_change(int paid, int cost, int& result); // 通常没有必要
```

可变引用适合表达“函数的职责就是修改这个调用方对象”，不应成为承载普通返回结果的默认方式。

## 让 `main` 负责输入与输出

输入、处理和输出分离后，每部分职责更清楚：

```text
std::cin 输入 → 纯计算函数处理 → std::cout 输出
```

例如：

```cpp
int calculate_raw_score(int correct_count, int wrong_count, int penalty_per_wrong)
{
    return correct_count * 2 - wrong_count * penalty_per_wrong;
}

int calculate_final_score(int raw_score)
{
    if (raw_score < 0) {
        return 0;
    }

    return raw_score;
}
```

这两个函数：

- 只通过形参接收数据；
- 只通过返回值产生结果；
- 不读取 `std::cin`；
- 不写入 `std::cout`；
- 不依赖或修改可变全局状态。

`main` 负责把它们组织起来：

```cpp
int raw_score{
    calculate_raw_score(correct_count, wrong_count, penalty_per_wrong)
};
int final_score{calculate_final_score(raw_score)};

std::cout << "raw_score = " << raw_score
          << ", final_score = " << final_score << '\n';
```

这种纯计算函数更容易复用、组合和单独验证。低层计算函数不应为了方便而随意打印。

## 中间结果有独立含义时保存一次

如果一个计算结果既要继续参与计算，又要输出或重复使用，应为它建立清楚的对象：

```cpp
int subtotal{calculate_subtotal(price, count)};
int final_total{add_delivery_fee(subtotal, delivery_fee)};
```

随后输出时直接使用已经保存的 `subtotal`：

```cpp
std::cout << "subtotal = " << subtotal
          << ", final_total = " << final_total << '\n';
```

这样不会为了输出和后续计算而再次调用 `calculate_subtotal`。保存中间结果可以表达处理步骤，也能避免不必要的重复计算；如果结果只使用一次且没有值得命名的独立含义，直接组合函数调用同样可以很清楚。不要机械地给每个子表达式都创建对象。

## 形参与实参同名没有特殊语义

```cpp
int calculate_total(int price, int count);

int price{7};
int count{4};
int total{calculate_total(price, count)};
```

形参 `price`、`count` 是函数作用域中的名称；实参名称属于调用方作用域。按值调用时，形参仍然是用实参值初始化出的函数局部对象。

实参甚至不一定有名称：

```cpp
calculate_total(7, 4);
calculate_total(price + 1, count);
```

因此同名本身既不会产生引用，也不是坏习惯。名称是否相同应由它们是否表达同一概念决定。参数是按值还是按引用，由形参类型决定。

## 函数名应描述职责，而不是笼统写“判断”

返回 `bool` 的谓词函数通常像一个可以回答真假的问题：

```cpp
bool is_valid(int value);
bool has_stock(int count);
bool can_enter(int age);
bool should_retry(int attempts);
```

常见前缀：

- `is_`：是否处于某种状态；
- `has_`：是否拥有某项内容；
- `can_`：能否执行某个动作；
- `should_`：是否应该执行某个动作。

`check` 往往比较含糊：它可能表示返回 `bool`、抛出异常、记录日志或修改数据。若函数返回处理后的 `int`，名称应描述产生的结果或执行的转换，例如 `calculate_final_score`，而不是让调用方猜测“检查”之后会发生什么。

名称不需要追求唯一正确的英文单词，但应让调用方从接口就能理解主要职责。

## 前置条件是调用之前必须成立的条件

函数契约不仅说明“返回什么”，还可以说明调用方必须先保证什么：

```cpp
// 前置条件：group_count > 0
int items_per_group(int total_items, int group_count)
{
    return total_items / group_count;
}
```

`group_count > 0` 是这个函数的前置条件。调用方有义务在调用前保证它成立；函数体在契约范围内只处理有效调用。

C++ 不会仅因为写了一行前置条件注释就自动检查它。如果调用方传入 `0`，上例会执行整数除以零并产生未定义行为。其他前置条件被违反时的后果则取决于函数实现和契约，不能一概称为未定义行为。

## 前置条件与可恢复错误不是同一件事

下面两种接口表达的是不同契约。

只接受有效调用：

```cpp
// 前置条件：group_count > 0
int items_per_group(int total_items, int group_count);
```

接受无效输入并报告失败：

```cpp
int items_per_group_or_error(int total_items, int group_count)
{
    if (group_count <= 0) {
        return -1;
    }

    return total_items / group_count;
}
```

第二个函数把 `group_count <= 0` 纳入自己处理的输入范围，`-1` 成为一种错误表达。它不再是“调用方绝对不能传入”的同一个前置条件模型。

实际接口还可能使用状态结果、`std::optional`、`std::expected` 或异常表达失败，但应根据调用方是否需要恢复、是否需要错误详情以及失败性质来选择。不要在尚未确定契约前随意用裸 `bool` 或特殊整数隐藏错误原因。

## 当前接口检查清单

设计一个简单函数时，可以依次检查：

1. 函数是否只有一个清楚职责？
2. 只读小型输入是否按值传递？
3. 只有必须修改调用方对象的参数才使用可变引用吗？
4. 普通计算结果是否直接按值返回？
5. 返回引用指向的对象是否在调用后仍然存活？
6. 计算函数是否避免直接读写标准流和可变全局状态？
7. 函数名、参数名和返回类型是否让调用方能理解职责？
8. 前置条件和可恢复错误是否被正确区分？

接口质量不是由引用数量或语法复杂度决定，而是由调用方能否清楚、安全地使用它决定。
