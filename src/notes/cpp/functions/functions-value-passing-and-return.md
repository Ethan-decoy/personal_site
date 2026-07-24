---
title: 函数、值传递与返回值
date: 2026-07-23
---

# 函数、值传递与返回值

本页例子聚焦函数调用机制，并假定示例中的算术结果能由 `int` 表示。怎样把数值范围写进契约，见[结果契约与 optional](result-contracts-and-optional.md)。

## 函数是可调用单元

函数定义包含返回类型、函数名、形参列表和函数体：

```cpp
int difference(int left, int right)
{
    int result{left - right};
    return result;
}
```

调用函数：

```cpp
int answer{difference(9, 4)};
```

实参 `9` 和 `4` 分别初始化形参 `left` 与 `right`。函数返回 `5`，该值用于初始化 `answer`。

## 按值形参是独立的局部对象

```cpp
int add_two(int value)
{
    value = value + 2;
    return value;
}

int original{6};
int result{add_two(original)};
```

调用时，形参 `value` 用 `original` 当时的值初始化。两个对象彼此独立，所以：

```text
original == 6
result == 8
```

函数内修改 `value` 不会修改 `original`。这与普通对象复制是同一种关系：

```cpp
int copy{original};
```

## 每次调用都有自己的局部对象

```cpp
int adjusted(int value)
{
    value = value + 4;
    return value;
}

int first{adjusted(1)};
int second{adjusted(7)};
```

第一次调用创建自己的 `value`，调用结束后该对象结束生命周期。第二次调用会创建另一份 `value`。

最终 `first == 5`、`second == 11`。两次调用互不共享局部状态。

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

1. 计算返回表达式，并由它形成这次调用的返回结果；
2. 离开函数，按作用域规则销毁本次调用的普通局部对象；
3. 控制权回到调用点，返回结果继续参与外层初始化或表达式。

```cpp
int status{classify(5)};
```

`status` 是调用方的独立对象，不属于 `classify` 的局部作用域。

## 函数作用域不会自动共享局部名称

```cpp
void different()
{
    // 这里看不到 main 中的 first_value
}

int main()
{
    int first_value{9};
}
```

`different` 不能直接使用 `main` 的局部名称。若函数需要某个值，应通过形参接收；若要产生值，通常通过返回值交给调用方。

这里使用 `void`，因为示例函数不返回值。除 `main` 的特殊规则等情况外，普通非 `void` 值返回函数若实际执行到函数末尾而没有返回相应的值，会产生未定义行为。编译器通常会警告，但不一定拒绝构建，因此每条可达路径都应明确返回。

## 声明允许先调用、后定义

编译器在处理调用点前必须知道函数接口：

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

前面的声明提供函数名、返回类型和形参类型；后面的定义提供函数体。声明与定义的接口必须匹配。

## 函数可以组合分支和循环

```cpp
int count_steps_to_zero(int value)
{
    if (value < 0) {
        return 0;
    }

    int steps{0};

    while (value > 0) {
        value = value - 1;
        steps = steps + 1;
    }

    return steps;
}
```

这里 `value` 是按值形参，可以作为本次调用的控制状态。`steps` 是局部累计状态。调用方传入的原对象不会被修改。

这个示例对负数返回 `0`，只是为了展示控制流。真实函数是否接受负数、怎样表达失败，应由结果契约决定。

## 下一步：从机制到设计

知道按值调用和返回的机制后，还要根据调用方需求选择参数与结果形式。选择原则见[函数接口设计](function-interface-design.md)。

合法输入、无结果状态和成功结果关系见[结果契约与 optional](result-contracts-and-optional.md)。
