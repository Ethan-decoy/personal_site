---
title: 第四课：函数、值传递与返回值
date: 2026-07-20
---

# 第四课：函数、值传递与返回值

## 函数把一段行为封装成可调用单元

一个简单函数定义包含返回类型、函数名、形参列表和函数体：

```cpp
int difference(int left, int right)
{
    int result{left - right};
    return result;
}
```

调用函数时：

```cpp
int answer{difference(9, 4)};
```

实参 `9` 和 `4` 分别初始化形参 `left` 与 `right`，函数计算出 `5`，`return` 把这个值交回调用点，最终 `answer == 5`。

## 按值形参是独立的函数局部对象

```cpp
int add_two(int value)
{
    value = value + 2;
    return value;
}

int original{6};
int result{add_two(original)};
```

调用发生时，形参 `value` 用实参 `original` 当时的值 `6` 初始化。它们是两个独立对象：

```text
original == 6
result == 8
```

函数内修改 `value` 不会修改 `original`。这与下面的普通对象复制是同一种独立关系：

```cpp
int copy{original};
```

## 每次调用都有自己的一组局部对象

```cpp
int adjusted(int value)
{
    value = value + 4;
    return value;
}

int first{adjusted(1)};
int second{adjusted(7)};
```

两次调用分别创建自己的 `value`。第一次调用结束后，它的形参生命周期结束；第二次调用再创建一个新的形参对象。

最终：

```text
first == 5
second == 11
```

## `return` 返回值并结束当前调用

```cpp
int classify(int value)
{
    if (value < 0) {
        return -1;
    }

    return 1;
}
```

执行到 `return` 时：

1. 计算返回表达式；
2. 把结果交回调用点；
3. 当前函数调用结束；
4. 本次调用的局部对象结束生命周期。

调用方用返回值初始化的对象是独立对象：

```cpp
int status{classify(5)};
```

这里的 `status` 不属于 `classify` 的局部作用域。

## 函数作用域之间不会自动共享局部名称

```cpp
int different()
{
    // 这里看不到 main 中的 first_value
}

int main()
{
    int first_value{9};
}
```

另一个函数不能直接使用 `main` 的局部名称。若函数需要某个值，应通过形参接收；若需要产生结果，通常通过返回值交给调用方。

## 声明允许先调用、后定义

编译器在处理调用点之前必须知道函数的接口：

```cpp
int difference(int left, int right);

int main()
{
    int answer{difference(9, 4)};
}

int difference(int left, int right)
{
    return left - right;
}
```

前面的函数声明告诉编译器函数名、返回类型和形参类型；后面的函数定义提供函数体。声明和定义的接口必须匹配。

## 函数可以组合分支和循环

```cpp
int sum_to(int limit)
{
    if (limit < 0) {
        return -1;
    }

    int total{0};

    while (limit > 0) {
        total = total + limit;
        limit = limit - 1;
    }

    return total;
}
```

这里：

- 无效输入通过提前返回处理；
- `limit` 是按值形参，可以作为本次调用的循环控制状态；
- `total` 是函数局部累计状态；
- 调用方传入的原对象不会被修改。

## 计算与输出尽量分离

如果函数的职责是计算一个值，让它返回结果通常比在函数内部直接输出更容易复用和验证：

```cpp
int doubled(int value)
{
    return value + value;
}
```

调用方可以决定把结果用于继续计算、保存还是输出。输入输出和纯计算的更完整接口设计将在后续继续展开。
