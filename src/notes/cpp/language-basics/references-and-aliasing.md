---
title: 引用与别名
date: 2026-07-23
---

# 引用与别名

本页只说明引用的语言机制。何时选择按值、可变引用或 `const` 引用，见[函数接口设计](../functions/function-interface-design.md)。

## `int&` 为已有对象提供另一个名称

```cpp
int value{5};
int& alias{value};
```

`alias` 不是新的独立 `int` 对象，也没有复制 `value`。它绑定已有对象 `value`，两个名称表示同一个整数对象：

```cpp
alias = 8;
```

此时 `value == 8` 且 `alias == 8`。

## 引用与复制

```cpp
int value{5};
int& alias{value};
int copy{value};
```

| 名称 | 与 `value` 的关系 |
| --- | --- |
| `alias` | 同一对象的另一个名称 |
| `copy` | 用当时值创建的独立对象 |

```cpp
alias = 9;
copy = 2;
```

最终 `value == 9`、`alias == 9`、`copy == 2`。

## 引用必须在声明时绑定

```cpp
int value{6};
int& alias{value};
```

引用不能先空着、以后再绑定：

```cpp
int& alias; // 编译错误
```

引用必须在创建时直接绑定到对象。

## 赋值不会让引用改绑

```cpp
int first{3};
int second{8};
int& alias{first};

alias = second;
```

这条赋值读取 `second` 的值，再写入 `alias` 所表示的 `first`。它不会让 `alias` 改为绑定 `second`。

```cpp
second = 11;
```

最终 `first == 8`、`alias == 8`、`second == 11`。

## 引用名称与被引用对象有各自的范围

```cpp
int value{5};

{
    int& alias{value};
    alias = 12;
}

// value 仍然存在且等于 12
```

块结束后，名称 `alias` 不再可见。外层 `value` 仍在生命周期内，所以它继续存在。

每次通过引用访问对象时，被引用对象都必须仍然存活。对象已经结束生命周期后，引用会悬空。

## 引用形参绑定实参对象

```cpp
int replace_with(int& target, int replacement)
{
    replacement = 11;
    target = replacement;
    return target;
}
```

```cpp
int number{6};
int step{3};
int result{replace_with(number, step)};
```

`target` 绑定 `number`，`replacement` 是用 `step` 的值创建的独立形参。调用结束后：

```text
number == 11
step == 3
result == 11
```

当前范围内，非 `const int&` 绑定具名、可变的 `int` 对象：

```cpp
replace_with(number, step); // 可以
replace_with(6, step);      // 不可以
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

`current` 是可变别名，函数可借它修改实参。`candidate` 是只读别名，函数不能借它修改所绑定的对象。

`const int&` 可以绑定普通 `int`、`const int`，也可以绑定某些临时值。绑定临时值时，语言规则可能延长临时对象的生命周期；具体规则不在本页范围内。

## 局部计算结果按值返回

```cpp
int create_copy(int source)
{
    int copy{source};
    return copy;
}
```

函数返回的是 `copy` 的值。调用方得到独立结果，所以局部对象随后结束生命周期并不会使返回值失效。

不要返回局部对象的引用：

```cpp
int& broken_result()
{
    int local{5};
    return local; // 返回后引用悬空
}
```

## 返回引用要求对象继续存活

```cpp
int& choose_smaller(int& first, int& second)
{
    if (first <= second) {
        return first;
    }

    return second;
}
```

```cpp
int first{10};
int second{6};
int& destination{choose_smaller(first, second)};

destination = 30;
```

`destination` 绑定 `second`，所以赋值会修改调用方的 `second`。这里能够安全返回引用，是因为两个候选对象都属于调用方，并在引用使用期间继续存活。

返回引用传播了对象身份与生命周期约束。普通计算结果应按值返回；具体接口选择见[函数接口设计](../functions/function-interface-design.md)。
