---
title: 第六课：引用、别名与引用形参
date: 2026-07-20
---

# 第六课：引用、别名与引用形参

## `int&` 为已有对象提供另一个名称

```cpp
int value{5};
int& alias{value};
```

`alias` 不是新的独立 `int` 对象，也没有复制 `value` 的值。它绑定到已有对象 `value`，此后两个名称都表示同一个整数对象：

```cpp
alias = 8;
```

结果：

```text
value == 8
alias == 8
```

## 引用与复制的区别

```cpp
int value{5};
int& alias{value};
int copy{value};
```

| 名称 | 关系 |
| --- | --- |
| `value` | 原来的 `int` 对象 |
| `alias` | `value` 的别名 |
| `copy` | 用 `value` 当时的值初始化出的独立对象 |

继续执行：

```cpp
alias = 9;
copy = 2;
```

最终：

```text
value == 9
alias == 9
copy == 2
```

## 引用必须在声明时绑定

```cpp
int value{6};
int& alias{value}; // 可以
```

下面的写法不成立：

```cpp
int& alias;  // 错误：引用没有绑定对象
alias = value;
```

第二行不能补救第一行，因为赋值不是绑定。引用必须在创建时直接绑定到已有对象。

## 给引用赋值不会让它重新绑定

```cpp
int first{3};
int second{8};
int& alias{first};

alias = second;
```

`alias = second` 读取 `second` 的值 `8`，再把它写入 `alias` 所绑定的 `first`。它不会让 `alias` 改为绑定 `second`。

```cpp
second = 11;
```

最终：

```text
first == 8
alias == 8
second == 11
```

引用一旦完成绑定，就不能通过赋值改绑到另一个对象。

## 引用名称也受作用域限制

```cpp
int value{5};

{
    int& alias{value};
    alias = 12;
}

// alias 在这里不可见
// value 仍然存在，且 value == 12
```

内层引用名称在块结束时离开作用域，但外层 `value` 的生命周期尚未结束，因此它仍然存在，并保留经引用完成的修改。

使用引用时，被引用对象必须在引用的每次使用期间仍然存活。若对象已经结束生命周期，继续通过引用访问会产生悬空风险。

## 函数引用形参绑定调用方对象

```cpp
int add_to(int& target, int amount)
{
    amount = amount + 2;
    target = target + amount;
    return target;
}
```

调用：

```cpp
int number{6};
int step{3};
int result{add_to(number, step)};
```

进入函数时：

| 形参 | 与实参的关系 |
| --- | --- |
| `target` | 引用形参，绑定调用方的 `number` |
| `amount` | 按值形参，用 `step` 的值初始化独立副本 |

函数体先把局部 `amount` 从 `3` 改为 `5`，因此调用方的 `step` 仍然是 `3`。随后通过 `target` 把 `number` 从 `6` 改为 `11`。返回的是一个普通 `int` 值，因此 `result` 也是独立对象。

调用结束后：

```text
number == 11
step == 3
result == 11
```

当前只把非 `const int&` 绑定到已有的具名可变 `int`：

```cpp
add_to(number, step); // 可以
add_to(6, step);      // 不可以：字面量 6 不能绑定到 int&
```

## `const int&` 是只读别名

```cpp
int replace_if_larger(int& current, const int& candidate)
{
    if (candidate > current) {
        current = candidate;
    }

    return current;
}
```

这里两种引用承担不同职责：

- `current` 是可变引用，函数可以通过它修改调用方对象；
- `candidate` 是 `const` 引用，函数直接绑定并读取调用方对象，但不能通过该名称修改它。

`const int&` 可以绑定普通 `int`，也可以绑定 `const int`：

```cpp
int first{7};
const int second{10};

replace_if_larger(first, second);
```

对于 `int` 这种很小、复制成本很低的标量，如果函数只需要读取数值，普通按值形参通常更简单：

```cpp
int doubled(int value);
```

因此不要机械地把所有只读参数都写成 `const int&`。应根据接口是否需要别名关系、是否需要修改调用方对象以及对象复制成本来选择参数形式。

## 局部计算结果通常按值返回

```cpp
int create_adjusted(int base)
{
    int adjusted{base + 4};
    return adjusted;
}
```

`adjusted` 是函数局部对象，调用结束时会销毁，但 `return adjusted` 返回的是它的值。调用方得到的是独立结果，因此这种写法是安全的。

普通计算结果优先按值返回，不要返回局部对象的引用：

```cpp
int& broken_result()
{
    int local{5};
    return local; // 错误设计：调用结束后 local 已不存在
}
```

这里返回的引用会悬空，之后通过它访问对象会产生未定义行为。

## 返回引用必须指向调用后仍存活的对象

当函数确实需要返回“某个已有对象本身”时，可以返回引用，但必须保证该对象在调用结束后仍然存活：

```cpp
int& choose_smaller(int& first, int& second)
{
    if (first <= second) {
        return first;
    }

    return second;
}
```

调用：

```cpp
int first{10};
int second{6};
int& destination{choose_smaller(first, second)};

destination = 30;
```

`destination` 最终绑定 `second`，所以赋值会修改原来的 `second`。这里安全的关键不是“返回引用”本身，而是被返回的对象属于调用方，并且在引用使用期间仍然存活。

## 参数和返回形式应表达调用方需求

| 调用方需求 | 常见形式 |
| --- | --- |
| 只读取一个小型 `int` 的值 | `int value` |
| 函数必须修改调用方对象 | `int& value` |
| 需要只读别名关系 | `const int& value` |
| 返回普通计算结果 | `int` |
| 返回调用后仍存活对象的别名 | `int&` |

引用不是“避免复制就更高级”的默认选项。可变引用会暴露副作用，返回引用会传播生命周期约束；只有接口语义确实需要这些关系时才使用它们。

下一篇将把这些参数、返回值与生命周期规则用于完整的函数接口设计。
