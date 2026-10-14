---
title: 重载函数与重载集（Overloaded Functions and Overload Sets）
date: 2026-08-29
order: 1
---

# 重载函数与重载集（Overloaded Functions and Overload Sets）

此前出现的每个函数名通常只对应一个函数。实际接口有时需要让同一项操作接受不同形式的输入，例如分别检查整数和浮点数表示的压力值：

```cpp
bool is_pressure_valid(int pressure_kpa) {
    return pressure_kpa >= 0 && pressure_kpa <= 500;
}

bool is_pressure_valid(double pressure_kpa) {
    return pressure_kpa >= 0.0 && pressure_kpa <= 500.0;
}
```

这两项函数定义位于同一作用域，拥有相同名称，却声明了不同的参数类型。它们是两个不同函数，共同构成一组重载函数（overloaded functions）。

```cpp
const bool whole_value_valid{is_pressure_valid(220)};
const bool precise_value_valid{is_pressure_valid(220.5)};
```

两条调用表达式写出同一个函数名。整数字面量 `220` 具有 `int` 类型，浮点字面量 `220.5` 具有 `double` 类型；编译器根据调用位置可见的同名函数和实参形式确定具体目标。这项编译期选择过程称为重载决议（overload resolution）。

**函数重载（function overloading）让多个函数共享一个名称；一次调用仍然只会选择其中一个具体函数。**这种选择由编译期的语言规则完成，不会等到函数运行后再检查实参对象保存了什么值。

## 调整后的形参类型列表

参数类型不同可以形成重载，参数数量不同也可以：

```cpp
bool is_pressure_valid(double pressure_kpa);
bool is_pressure_valid(double pressure_kpa, double maximum_pressure_kpa);
```

第一项函数接收一个实参，第二项函数接收两个实参。调用者仍然使用名称 `is_pressure_valid`，实参列表则为重载决议提供区分依据。

对于本篇给出的同一作用域函数声明，语言使用调整后的形参类型列表（parameter-type-list）区分这些同名函数。这里的“调整后”表示源代码中的形参声明要先按照函数类型规则处理；本篇范围内最重要的一项结果是，按值形参的顶层 `const` 不会保留为重载区别。

在当前同一作用域的普通函数模型中，这些同名声明形成重载集（overload set）。重载集不是运行期间保存函数的容器，也不会创建一个额外对象；它描述的是名称查找得到的一组函数声明。调用表达式随后从中寻找能够接受当前实参的函数。

形参名称不属于形参类型列表，也不参与重载区分。下面两项声明描述的是同一个函数，而不是两个重载：

```cpp
bool is_pressure_valid(int pressure_kpa);
bool is_pressure_valid(int measured_pressure_kpa);
```

两处 `int` 参数类型相同，名称差异只影响各自声明对参数含义的表达。第二行只是再次声明第一行已经声明的函数。

## 返回类型不能单独区分重载

调用表达式必须先确定正在调用哪个函数，之后才能知道调用结果具有什么类型。因而，只有返回类型不同的声明不能形成重载：

```cpp
int classify_pressure(int pressure_kpa);
bool classify_pressure(int pressure_kpa); // 错误
```

两项声明拥有相同名称和相同参数类型列表。调用 `classify_pressure(220)` 时，实参无法区分目标；把结果用于初始化 `int` 或 `bool` 对象，也不会反过来替调用选择函数。

**在本篇给出的函数声明中，重载由函数名和调整后的形参类型列表区分；结果将被怎样使用不参与建立这项区别。**返回类型仍然必须与相应函数自己的声明和定义一致，只是不能成为唯一的重载依据。

## 按值参数的顶层 const 不形成重载

按值形参是每次调用创建的新对象。在函数体中为它增加顶层 `const`，可以限制函数体修改这份局部副本，却不会改变调用者向函数提供值的方式：

```cpp
int encode_pressure(int pressure_kpa);
int encode_pressure(const int pressure_kpa);
```

这两行仍然声明同一个函数。若分别为它们提供函数体，就会形成对同一函数的重复定义，而不是两个可供选择的重载。

引用参数中的 `const` 处理的是另一项边界：它限定通过引用访问被指代对象的能力。下面两项声明的参数类型不同，因此可以形成重载：

```cpp
int& access_reading(int& reading);
const int& access_reading(const int& reading);
```

这里不是返回类型差异建立了重载；真正的区别在于参数分别是 `int&` 和 `const int&`。前者要求可修改的 `int` 对象，后者允许通过只读访问路径指代对象。

对本篇给出的这些函数，同名声明只有在调整后的形参类型列表确实不同时才表示多个函数。**形参名称、按值形参的顶层 const 和返回类型都不能单独把一项声明变成新的重载。**

## 参考资料

- [C++23 工作草案：可重载声明](https://timsong-cpp.github.io/cppwp/n4950/over.load)
- [C++23 工作草案：函数声明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数重载](https://timsong-cpp.github.io/cppwp/n4950/over)
