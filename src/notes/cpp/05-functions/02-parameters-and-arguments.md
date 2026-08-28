---
title: 参数与实参（Parameters and Arguments）
date: 2026-08-27
---

# 参数与实参（Parameters and Arguments）

函数可以通过参数接收调用位置提供的数据。参数让同一项行为能够处理不同的输入，而不必把具体数值固定在函数体中。

## 函数体中的输入对象

下面的函数接收当前气压和变化量，并产生调整后的气压：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa, int change_kpa) {
    pressure_kpa += change_kpa;
    return pressure_kpa;
}
```

参数列表中的 `int pressure_kpa` 和 `int change_kpa` 是两个形参（parameter）声明。每次调用函数时，程序根据这两个声明分别建立并初始化属于本次调用的 `int` 对象；进入函数体之前，它们已经完成初始化。

当前示例中，调用圆括号内用来向形参提供数据的表达式称为实参（argument）：

```cpp
int measured_pressure_kpa{210};

int adjusted_pressure_kpa{calculate_adjusted_pressure_kpa(measured_pressure_kpa, 5)};
```

这里，实参表达式 `measured_pressure_kpa` 对应形参 `pressure_kpa`，字面量 `5` 对应形参 `change_kpa`。对应关系由它们在各自列表中的位置确定。

**在当前按值传递（pass by value）的算术类型模型中，形参是函数边界内接收数据的新对象；实参是调用位置用来提供数据的表达式。**

## 当前的按值传递模型

当前示例中的两个形参都按值传递。调用发生时，每个实参产生的值分别初始化对应的形参对象：

- `measured_pressure_kpa` 产生当前保存的值 `210`，用来初始化 `pressure_kpa`；
- 字面量 `5` 产生 `int` 值 `5`，用来初始化 `change_kpa`。

这两项描述的是实参与形参的对应关系，不表示它们必定按照列出的顺序求值。两个形参都完成初始化之后，函数体才开始执行。

函数体中的赋值把形参 `pressure_kpa` 改为 `215`，不会修改调用位置的 `measured_pressure_kpa`。调用完成后，`measured_pressure_kpa == 210`，而 `adjusted_pressure_kpa == 215`。

**对于当前按值传入的算术对象，形参与调用方对象彼此独立。函数读取的是调用时提供的值，而不是取得调用方对象本身。**

## 实参不必是对象名称

实参不必是已有对象的名称。字面量和计算表达式也可以提供形参所需的值：

```cpp
int measured_pressure_kpa{200};

int adjusted_pressure_kpa{calculate_adjusted_pressure_kpa(measured_pressure_kpa + 10, 2 * 5)};
```

两个实参分别产生 `210` 和 `10`，对应的形参由这两个结果初始化，最终调用结果是 `220`。函数体只接触已经初始化完成的形参，不需要知道这些值来自对象、字面量还是其他表达式。

当前函数声明了两个形参，因此调用时也必须按位置提供两个实参：

```cpp
calculate_adjusted_pressure_kpa(210, 5); // 正确
calculate_adjusted_pressure_kpa(210);    // 错误：缺少一个实参
```

## 对应位置不规定求值先后

实参与形参按照源码位置对应，但这不表示实参表达式必定从左向右求值。C++23 保证每个形参的初始化会完整发生在另一个形参的初始化之前，却不规定哪一个先发生。

```cpp
int encode_pair(int first_digit, int second_digit) {
    return first_digit * 10 + second_digit;
}

int counter{0};
int encoded_value{encode_pair(++counter, ++counter)};
```

进入 `encode_pair` 的函数体之前，两次自增都已经完成，因此 `counter == 2`。如果左侧实参先求值，两个形参分别得到 `1` 和 `2`，结果是 `12`；如果右侧实参先求值，两个形参分别得到 `2` 和 `1`，结果是 `21`。

这两次求值彼此具有先后，不会交错，因此在 C++23 中不构成未定义行为；**没有固定左右顺序，仍然意味着程序不能依赖其中某一个结果。**更清楚的写法是把相互影响的操作拆成独立的完整表达式：

```cpp
int counter{0};

int first_digit{++counter};
int second_digit{++counter};
int encoded_value{encode_pair(first_digit, second_digit)};
```

此时源码明确规定两次自增的先后，`encoded_value` 稳定地得到 `12`。

## 参数名称属于函数边界

形参名称的作用域延伸到函数定义的末尾，因此可以在函数体中使用。相应函数定义之外的源码不能通过这个名称访问形参；同名形参出现在不同函数中，也属于彼此独立的作用域。

对于当前的按值参数，每次调用都会创建本次调用所需的形参对象。调用者继续使用自己的对象和调用表达式产生的结果，形参名称不会成为调用者作用域中的新名称。**参数名称描述函数怎样理解输入，当前按值形参对象则只属于相应的一次调用。**

按值传递算术对象时，参数名称应当说明函数体眼中的业务含义，实参表达式则应让调用位置清楚展示数据来源。带有相互影响副作用的实参应先拆开求值，避免把正确性建立在语言没有规定的左右顺序上。

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：函数参数作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.param)
