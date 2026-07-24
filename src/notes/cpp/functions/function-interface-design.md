---
title: 函数接口设计
date: 2026-07-23
---

# 函数接口设计

函数接口由函数名、形参、返回类型和调用方可观察到的副作用组成。设计时应从调用方需要什么开始，而不是先选择一种语法。

本页的短例子聚焦接口形状，并假定所示算术结果可以由 `int` 表示。接受范围更广的输入时，还必须补充完整的数值范围契约。

## 先识别数据角色

对每项数据分别询问：

1. 函数只需要读取一个值，还是必须修改调用方对象？
2. 函数产生普通结果，还是要返回某个已有对象的别名？
3. 这个信息是独立输入，还是可以从其他输入得到？
4. 函数是否还会读写标准流或全局状态？

引用的绑定与生命周期规则见[引用与别名](../language-basics/references-and-aliasing.md)。

## 小型只读输入通常按值传递

```cpp
int coordinate_sum(int x, int y)
{
    return x + y;
}
```

`x` 和 `y` 只是两个整数值。函数不需要共享调用方对象身份，也不需要修改调用方状态，所以按值传递最直接。

如果函数职责要求调用方观察到修改，才使用可变引用：

```cpp
void move(int& x, int& y, int x_step, int y_step)
{
    x = x + x_step;
    y = y + y_step;
}
```

`x`、`y` 是被修改的调用方状态；`x_step`、`y_step` 只提供数值。

对于 `int` 这类复制成本很低的类型，只读输入通常无需写成 `const int&`。其他类型可能因为复制成本、对象身份或生命周期要求而选择 `const&`，应根据具体接口判断。

## 普通结果优先按值返回

```cpp
int calculate_change(int paid, int cost)
{
    return paid - cost;
}
```

差额是函数产生的普通结果，直接返回最清楚。不要为了使用引用而增加输出参数：

```cpp
void calculate_change(int paid, int cost, int& result);
```

可变引用表达的是“函数会修改这个调用方对象”。它不应成为普通返回值的默认替代品。

若算术可能溢出或某些输入没有结果，必须在契约中处理，见[结果契约与 optional](result-contracts-and-optional.md)。

## 一个逻辑结果使用一个结果通道

下面的接口同时通过返回值和引用交付同一个结果：

```cpp
int larger_value(int left, int right, int& copied_result);
```

调用方必须猜测两个结果是否始终同步。单一普通结果只需按值返回：

```cpp
int larger_value(int left, int right)
{
    if (left >= right) {
        return left;
    }

    return right;
}
```

返回值、输出引用、标准输出和可变全局状态都可能成为结果或副作用通道。一个逻辑结果保留一个明确通道，可以减少同步义务。

## 只接收最小充分输入

如果答案能由其他输入唯一且便宜地得到，就不应要求调用方重复提供：

```cpp
int larger_value(
    int left,
    int right,
    int supplied_larger
);
```

`supplied_larger` 与前两个参数可能矛盾。更紧凑的接口是：

```cpp
int larger_value(int left, int right);
```

“最小充分”不是参数越少越好。外部测量、独立业务数据或计算代价很高的既有结果，都可能是合理输入。关键是它是否为当前职责所需的独立信息。

## 输入输出属于边界层

计算函数通常只通过参数接收数据，并通过返回值交付结果：

```cpp
int calculate_final_score(int raw_score)
{
    if (raw_score < 0) {
        return 0;
    }

    return raw_score;
}
```

控制台程序可以由 `main` 负责 `std::cin` 和 `std::cout`。图形界面、服务器或测试程序则由各自的边界层负责输入输出。

因此规则不是“永远让 `main` 输出”，而是把交互放在调用方或边界层，让领域计算不依赖某一种输入输出设备。

## 有独立含义的中间结果保存一次

```cpp
// 调用片段：假设这两个函数已经声明
int subtotal{calculate_subtotal(price, count)};
int final_total{add_delivery_fee(subtotal, delivery_fee)};
```

若 `subtotal` 还要输出或重复使用，保存一次可以表达处理步骤，并避免重复计算。

如果子表达式只使用一次，也没有值得命名的独立含义，直接组合调用同样可以清楚。不要机械地给每个子表达式都创建对象。

## 形参与实参同名没有特殊语义

```cpp
int calculate_total(int price, int count);

int main()
{
    int price{7};
    int count{4};
    int total{calculate_total(price, count)};
}
```

形参名称属于函数作用域，实参名称属于调用方作用域。同名不会产生引用关系，也不是坏习惯。是否按值或按引用传递，由形参类型决定。

名称是否相同，应由两处是否表达同一个概念决定。实参也可以是字面量或表达式，并不一定有名称。

## 函数名应表达职责

返回 `bool` 的谓词通常像一个能够回答真假的问题：

```cpp
bool is_valid(int value);
bool has_stock(int count);
bool can_enter(int age);
bool should_retry(int attempts);
```

- `is_`：是否处于某种状态；
- `has_`：是否拥有某项内容；
- `can_`：能否执行某个动作；
- `should_`：是否应该执行某个动作。

`check` 往往含糊，因为它可能意味着返回 `bool`、记录日志、抛出异常或修改数据。名称不必追求唯一正确的英文单词，但应让调用方理解主要职责。

## 布尔模式可能隐藏两个职责

```cpp
void update_timer(
    int& seconds_remaining,
    int requested_seconds,
    bool cancel
);
```

`cancel == true` 时取消计时，`false` 时设置时间。这个接口把两个操作藏在一个布尔值中，而且取消时 `requested_seconds` 没有意义。

可以拆成两个职责清楚的函数：

```cpp
void set_timer(int& seconds_remaining, int requested_seconds);
void cancel_timer(int& seconds_remaining);
```

并非所有 `bool` 参数都不好。若布尔值本身就是要处理的数据，它是正常输入。需要警惕的是它是否只用于选择两个本可独立命名的操作。

## 接口检查清单

1. 函数是否只有一个清楚职责？
2. 每个参数都是职责所需的独立信息吗？
3. 只读小型值是否按值传递？
4. 可变引用是否确实表示必须修改的调用方对象？
5. 普通单一结果是否只通过返回值交付？
6. 输入输出是否留在合适的边界层？
7. 名称是否让调用方理解职责？
8. 布尔模式是否隐藏了两个独立操作？

输入是否合法、失败怎样表示，属于结果契约问题，而不是参数语法本身的问题。
