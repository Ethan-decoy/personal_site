---
title: 形参与实参（Parameters and Arguments）
date: 2026-08-14
---

# 形参与实参（Parameters and Arguments）

在[函数的结构与调用](01-function-structure-and-calls.md)中，函数定义与函数调用分别出现了两组内容：

```cpp
int add(int left, int right) {
    return left + right;
}

int total{add(2, 3)};
```

定义中的 `left`、`right` 与调用中的 `2`、`3` 分别承担不同角色。

## 形参（Parameter）

函数定义中，参数列表内声明的 `left` 和 `right` 称为形参（parameter）：

```text
int add(int left, int right)
            ↑         ↑
          形参       形参
```

每个形参都具有自己的数据类型和名称。对于这里的 `int left` 与 `int right`，函数每次被调用时都会建立两个属于本次调用的 `int` 参数对象；函数体通过名称 `left` 和 `right` 使用它们。

## 实参（Argument）

函数调用中，实参列表内的 `2` 和 `3` 称为实参（argument）：

```text
add(2, 3)
    ↑  ↑
  实参 实参
```

实参通常是表达式，不必是一个已经命名的对象。字面量、对象名称以及更大的表达式都可以出现在实参位置：

```cpp
int value{4};

add(2, 3);           // 两个字面量表达式
add(value, 3);       // 对象名称与字面量
add(value + 1, 3);   // 加法表达式与字面量
```

## 实参与形参的对应关系

实参按照位置与形参对应：第一个实参对应第一个形参，第二个实参对应第二个形参，依此类推。

```cpp
add(2, 3);
```

在这次调用中，实参 `2` 对应形参 `left`，实参 `3` 对应形参 `right`。所有实参都会在进入函数体之前完成求值，其结果用于初始化对应的形参。

对于固定参数列表、没有默认实参的函数，调用提供的实参数量需要与形参数量一致；每个实参也必须能够按照相应的初始化规则建立对应形参。

## 按值传递（Pass by Value）

当形参写成 `int pressure` 这样的普通对象声明时，实参求值所得的值用于初始化一个新的参数对象。这种基本传递方式称为按值传递（pass by value）。

```cpp
int decrease_pressure(int pressure, int amount) {
    pressure -= amount;
    return pressure;
}

int original_pressure{240};
int displayed_pressure{
    decrease_pressure(original_pressure, 20)
};
```

下面按照实参与形参的对应关系说明这次调用，不表示它们在运行时按照所列顺序求值：

- 实参 `original_pressure` 求值得到 `int` 值 `240`，用于初始化新的参数对象 `pressure`；
- 实参 `20` 用于初始化另一个参数对象 `amount`；
- 所有参数初始化完成后，函数体将参数对象 `pressure` 修改为 `220`，随后返回这个值。

调用结束后，`displayed_pressure` 保存 `220`，而调用者中的 `original_pressure` 仍然保存 `240`。`pressure` 是由实参值初始化出来的独立对象，修改它不会自动修改提供原值的对象。这与此前“由已有对象初始化新对象”的模型一致。

按值传递描述的是初始化一个独立参数对象，不应简单理解为源代码中必然发生某一种固定形式的物理复制。

## 实参与形参的类型

实参表达式的类型不必与形参类型字面相同，但它必须能够按照语言规则初始化相应形参。需要转换时，转换发生在建立参数对象的过程中：

```cpp
int whole_pressure(int pressure) {
    return pressure;
}

double measured_pressure{240.8};
int displayed_pressure{
    whole_pressure(measured_pressure)
};
```

`measured_pressure` 产生 `double` 值 `240.8`，而形参 `pressure` 是 `int` 对象。这次调用在语言层面允许将 `240.8` 转换为 `int` 值 `240`，编译器可能给出警告。

外层的花括号初始化接收的是函数最终产生的 `int` 结果，不能阻止此前已经发生的 `double` 到 `int` 转换。因此，函数接口的参数类型同样决定调用者的数据会怎样被接收；允许调用不等于转换不会丢失信息。

## 参数名称的作用域

形参名称属于相应函数的参数作用域，可以在函数体中使用。调用函数的代码不能通过这个名称直接访问参数对象：

```cpp
int decrease_pressure(int pressure, int amount) {
    pressure -= amount; // 可以使用本次调用的参数对象
    return pressure;
}

int pressure{240};
int result{decrease_pressure(pressure, 20)};
```

调用者中的 `pressure` 与形参 `pressure` 恰好使用相同拼写，但它们是作用域不同的两个对象。函数体内的名称指向参数对象，调用位置的名称则指向调用者自己的对象。

每次调用都会拥有各自的按值参数对象；这些对象只服务于相应调用。

## 多个实参的求值顺序

所有实参都会在进入函数体前完成求值，但 C++23 不保证多个实参按照源代码中从左到右的顺序求值。每个参数的初始化会完整完成，不会与另一个参数的初始化交错；究竟先完成哪一个，则没有固定顺序。

```cpp
int difference(int left, int right) {
    return left - right;
}

int value{1};
int result{difference(value++, value++)};
```

如果左侧实参先求值，形参得到 `left == 1`、`right == 2`，结果为 `-1`；如果右侧实参先求值，则形参得到 `left == 2`、`right == 1`，结果为 `1`。两种情况下 `value` 最终都保存 `3`，但不能依赖 `result` 具体是哪一种。

在 C++23 中，这两个参数初始化彼此具有确定的先后关系，只是顺序未指定，因此该示例不是由无序交错引起的未定义行为。它仍然难以阅读，结果也没有由语言规则唯一确定。更清晰的写法是先把有状态变化的步骤分开：

```cpp
int value{1};
int left_value{value++};
int right_value{value++};
int result{difference(left_value, right_value)};
```

相关语言规则可参阅 C++23 工作草案中的[函数调用与参数初始化](https://timsong-cpp.github.io/cppwp/n4950/expr.call)及[函数参数作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.param)。
