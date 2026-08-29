---
title: 指针类型、指针值与指针对象（Pointer Types, Pointer Values, and Pointer Objects）
date: 2026-08-27
order: 2
---

# 指针类型、指针值与指针对象（Pointer Types, Pointer Values, and Pointer Objects）

## 取得对象的地址

一元取地址运算符（address-of operator）`&` 可以根据已有对象产生一个指向该对象的指针值：

```cpp
int engine_temperature_c{78};
int* temperature_target{&engine_temperature_c};
```

第二行同时出现了三个容易混淆的层次：

| 代码 | 含义 |
| --- | --- |
| `engine_temperature_c` | 一个 `int` 对象 |
| `&engine_temperature_c` | 取地址表达式，产生指向该对象的 `int*` 值 |
| `temperature_target` | 一个 `int*` 对象，保存上面的指针值 |

`engine_temperature_c` 是这段指向关系的目标。`temperature_target` 则是另一个独立对象：它有自己的类型、身份、生命周期和当前值，只是它当前保存的值指向 `engine_temperature_c`。

**取地址表达式产生指针值；变量声明创建指针对象。指针对象与目标对象是两个独立对象。**

取地址运算符需要一个能够指定已有对象的表达式。整数字面量只产生一个值，不能像具名对象一样直接被取地址：

```cpp
int* invalid_observer{&42};  // 错误：42 不指定一个可取地址的已有对象
```

## 指针类型约束目标类型

`int*` 读作“指向 `int` 的指针”。它是由 `int` 构成的指针类型（pointer type），属于复合类型，而不是另一种整数类型。C++ 也没有规定指针值必须采用某种固定整数 bit pattern；具体机器表示由实现决定。

取一个 `int` 对象的地址会产生 `int*` 值；取一个 `double` 对象的地址则会产生 `double*` 值。不同对象指针类型不能因为都在描述地址就任意混用：

```cpp
double pressure_bar{2.4};
int* observed_pressure{&pressure_bar};  // 错误：double* 不能初始化 int*
```

目标类型让编译器知道这段指向关系面向什么类型的对象，也约束了之后能够通过该指针进行的访问。

## 指针对象与目标对象彼此独立

创建 `temperature_target` 不会复制 `engine_temperature_c`，也不会把后者变成指针的一部分。两者的生命周期同样彼此独立：取得一个对象的地址，不会延长该对象的生命周期。

在上面的 `int* temperature_target` 中，`*` 用来构成指针声明符（pointer declarator），没有对任何对象执行间接访问。为了让指针归属一目了然，本笔记把 `*` 写在类型一侧，并且每条声明只定义一个对象。

## 参考资料

- [C++23 工作草案：指针声明符](https://timsong-cpp.github.io/cppwp/n4950/dcl.ptr)
- [C++23 工作草案：一元运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.op)
- [C++23 工作草案：复合类型](https://timsong-cpp.github.io/cppwp/n4950/basic.compound)
