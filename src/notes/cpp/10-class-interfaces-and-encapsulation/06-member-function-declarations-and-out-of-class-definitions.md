---
title: 成员函数的声明与类外定义（Member Function Declarations and Out-of-Class Definitions）
date: 2026-08-29
order: 6
---

# 成员函数的声明与类外定义（Member Function Declarations and Out-of-Class Definitions）

函数章节已经区分过声明与定义：声明让名称和函数类型对当前代码可知，定义另外提供函数体。成员函数也可以只在类定义中声明，再在类外提供定义：

```cpp
class tire_pressure {
  public:
    tire_pressure();
    double value_bar() const;
    bool try_set_value_bar(double requested_value_bar);

  private:
    double stored_value_bar;
};
```

这段类定义给出了当前显式设计的公开接口和私有表示，但三个成员函数都还没有函数体。

## 用限定名称确定所属类型

类外定义必须指出正在定义哪个类作用域中的成员：

```cpp
tire_pressure::tire_pressure() : stored_value_bar{2.3} {}

double tire_pressure::value_bar() const {
    return stored_value_bar;
}
```

`::` 是作用域解析运算符（scope resolution operator）。限定名称 `tire_pressure::value_bar` 表示 `tire_pressure` 类作用域中已经声明的 `value_bar` 成员函数，而不是周围作用域中的同名普通函数。

构造函数的类外定义同样使用限定名称。`tire_pressure::tire_pressure()` 左侧的 `tire_pressure::` 确定类作用域，右侧的特殊构造函数语法确定正在定义该类的构造函数；成员初始化列表仍然直接初始化 `stored_value_bar`。

## 类外定义仍然具有成员访问权

```cpp
bool tire_pressure::try_set_value_bar(double requested_value_bar) {
    const bool is_valid{requested_value_bar >= 0.0 && requested_value_bar <= 5.0};

    if (!is_valid) {
        return false;
    }

    stored_value_bar = requested_value_bar;
    return true;
}
```

函数体虽然写在类定义之外，`tire_pressure::try_set_value_bar` 仍然是类成员。函数体可以直接使用类作用域中的成员名称，并具有相应的 `private` 访问权；访问说明符不需要也不能在类外定义前重复书写。

源码中的书写位置不会改变调用形式：

```cpp
tire_pressure front_left{};
const bool updated{front_left.try_set_value_bar(2.5)};
const double current{front_left.value_bar()};
```

调用者只依赖类定义中公开的声明，不需要知道函数体是写在类内还是类外。

## 类外定义必须与声明匹配

类内声明与类外定义必须描述同一个成员函数。返回类型、参数类型和成员函数限定都不能随意改变。下面是一个独立的缩减示例：

```cpp
class tire_pressure {
  public:
    double value_bar() const;

  private:
    double stored_value_bar{2.3};
};

double tire_pressure::value_bar() {
    return 2.3;
}
```

类内声明具有尾随 `const`，类外代码却定义了没有这项限定的成员函数。后者不是前一条声明的定义，因此程序不合法。正确形式必须保留尾随 `const`：

```cpp
double tire_pressure::value_bar() const {
    return stored_value_bar;
}
```

**类外定义改变的是实现的书写位置，不改变函数的成员身份、访问权或调用语义。**

类内集中展示公开接口和私有表示，类外承载较长的实现，可以降低阅读类定义时的噪声。很短且语义直接的成员函数也可以留在类内；选择书写位置不应改变类型对外表达的接口与约束。

## 参考资料

- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct)
- [C++23 工作草案：限定名称](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.qual)
