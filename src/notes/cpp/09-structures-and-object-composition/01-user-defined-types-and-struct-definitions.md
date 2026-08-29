---
title: 用户定义类型与结构体定义（User-Defined Types and Struct Definitions）
date: 2026-08-28
order: 1
---

# 用户定义类型与结构体定义（User-Defined Types and Struct Definitions）

基本类型能够分别保存压力、温度和磨损程度，却不能表达这些状态共同描述一条轮胎：

```cpp
double pressure_bar{2.4};
double temperature_c{36.0};
int wear_percent{18};
```

这些名称能够让读者看出关联，但对 C++ 而言仍是三个彼此独立的对象。某个函数的参数列表可以只接收其中一部分，也可以把另一条轮胎的温度与当前压力组合在一起；命名约定本身不能构成一种新的数据类型。

## 用 struct 定义一种类型

C++ 可以使用 `struct` 定义用户定义类型（user-defined type）：

```cpp
struct tire_state {
    double pressure_bar;
    double temperature_c;
    int wear_percent;
};
```

`tire_state` 是新类型的名称，花括号中的三条声明描述这种类型具有哪些数据成员。右花括号后的分号结束这条类型声明；它不是结构体中最后一个成员声明的分号。

这段定义只建立类型，没有创建 `tire_state` 对象，也没有为某条具体轮胎保存状态。定义完成后，`tire_state` 才能像已经认识的类型名称一样出现在对象声明中：

```cpp
tire_state front_left{2.4, 36.0, 18};
tire_state rear_right{2.2, 32.0, 12};
```

这里创建了两个类型相同、身份独立的对象。每个对象都能把一组相关状态作为一个整体参与初始化、赋值和函数调用。

**结构体定义描述一种对象应当由哪些成员构成；结构体对象才是在程序运行期间保存具体成员状态的实体。**

## struct 定义的是类类型

在 C++ 的类型分类中，`struct` 是 class-key，使用它定义的类型属于类类型（class type）。这里的 class 是语言标准中的分类，不是对程序组织方式的额外判断，也不要求改用 `class` 关键字。

`struct` 与基本类型之间最重要的新区别，是程序现在能够定义自己的对象结构。当前的 `tire_state` 仍然只由已经认识的基本类型成员组成，但这个新类型可以继续用于创建变量、声明函数参数，或成为另一个对象的一部分。

## 结构体内部形成类作用域

结构体定义的花括号形成类作用域（class scope）。`pressure_bar`、`temperature_c` 和 `wear_percent` 都是在 `tire_state` 类作用域中声明的成员名称，不是定义位置周围作用域中的三个普通变量。

```cpp
double pressure_bar{2.4};

struct tire_state {
    double pressure_bar;
};
```

这两个 `pressure_bar` 位于不同作用域，表示不同实体。结构体外部需要先指定一个 `tire_state` 对象，再通过成员访问表达式确定其中的成员。

在没有写出访问说明符时，`struct` 中声明的成员默认为 public，因此当前代码可以从结构体外部直接访问它们。这项默认规则只说明名称能否被访问，不改变成员仍然属于相应结构体对象的事实。

## 参考资料

- [C++23 工作草案：类类型](https://timsong-cpp.github.io/cppwp/n4950/class.pre)
- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
