---
title: 隐式对象形参、this 与实现模型（The Implicit Object Parameter, this, and the Implementation Model）
date: 2026-08-29
order: 1
---

# 隐式对象形参、this 与实现模型（The Implicit Object Parameter, this, and the Implementation Model）

普通函数通过显式形参接收需要处理的对象：

```cpp
bool try_set_value_bar(tire_pressure& pressure, double requested_value_bar);
```

改为成员函数后，调用语法不再把 `pressure` 写入圆括号：

```cpp
front_left.try_set_value_bar(2.5);
```

对象并没有从调用语义中消失。`front_left` 是隐含对象实参（implied object argument），它确定本次成员函数调用所作用的对象。C++ 的语言模型、函数体中的 `this` 表达式与具体平台的调用约定从不同层次描述这项关系，三者不能直接合并成“编译器偷偷传入一个指针”。

## 语言模型中的隐式对象形参

这里讨论的 `value_bar` 与 `try_set_value_bar` 属于隐式对象成员函数（implicit object member function）。在函数匹配的语义模型中，这类函数具有一个隐式对象形参（implicit object parameter），隐含对象实参需要能够与它绑定。

以最终的 `tire_pressure` 接口为例：

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

对于本章使用的左值对象调用，可以用已经认识的引用模型理解它需要的对象访问：

| 成员函数 | 隐式对象形参所表达的当前访问 |
| --- | --- |
| `try_set_value_bar` | `tire_pressure&` |
| `value_bar() const` | `const tire_pressure&` |

这解释了为什么普通对象可以调用两项操作，而 `const tire_pressure` 对象只能调用 `value_bar() const`。这里的引用是标准用于描述函数匹配的语义模型，不是源码中实际声明出来的首形参。上表只覆盖本章实际使用的左值对象调用，不是一条关于所有成员函数形式的机器实现规则。

## 函数体中的 this 表达式

成员函数体可以使用 `this` 表达式取得指向当前调用对象的指针值：

```cpp
double tire_pressure::value_bar() const {
    return this->stored_value_bar;
}

bool tire_pressure::try_set_value_bar(double requested_value_bar) {
    const bool is_valid{requested_value_bar >= 0.0 && requested_value_bar <= 5.0};

    if (!is_valid) {
        return false;
    }

    this->stored_value_bar = requested_value_bar;
    return true;
}
```

在当前 `tire_pressure` 成员函数中：

| 函数语境 | `this` 的类型和值类别 | `*this` |
| --- | --- | --- |
| 非 `const` 成员函数 | `tire_pressure*` 类型的 prvalue | 指定调用对象的 `tire_pressure` 类型 lvalue |
| `const` 成员函数 | `const tire_pressure*` 类型的 prvalue | 指定调用对象的 `const tire_pressure` 类型 lvalue |

`this->stored_value_bar` 与 `(*this).stored_value_bar` 指定同一个成员子对象。未限定的成员名称在当前语境中也按照调用对象解释，因此正常代码可以直接写：

```cpp
return stored_value_bar;
```

而不必机械添加 `this->`。

**隐式对象形参用于描述调用匹配；this 是成员函数体中的指针表达式；它们相互对应，却不是同一个源代码实体。**

## this 不是对象中的隐藏成员

`this` 不是一个由每个 `tire_pressure` 对象额外保存的指针成员，也不是函数体中的可修改指针变量。它是求值时产生指向当前调用对象的指针值的表达式。

这与第九章的数据成员形成直接区别：

```text
tire_pressure 对象
└── stored_value_bar    对象真正包含的成员子对象

成员函数调用期间
└── this                指向调用对象的表达式结果，不是成员子对象
```

成员函数不会因为能够使用 `this` 就让每个对象增加一个指针大小的隐藏字段。`this` 也不拥有对象，不会延长调用对象的生命周期；成员调用仍然要求目标对象处于可以访问的生命周期阶段。

## ABI 可以用地址实现调用

[应用二进制接口（Application Binary Interface）](../../05-functions/deep-dives/02-application-binary-interface.md) 规定编译结果怎样在具体平台上协作。Itanium C++ ABI 等实际接口会把对象地址作为本章这种成员函数调用的隐式 `this` 参数传递，调用方与被调函数按同一约定解释这个值。

这是一种二进制实现契约，而不是 C++ 源码把成员函数定义成普通函数加指针参数的规则。目标平台可以把地址放入寄存器或栈中的约定位置，编译器也可以内联成员函数，使运行时根本不发生独立调用和参数传递。

四个层次可以这样区分：

| 层次 | 当前模型回答的问题 |
| --- | --- |
| 调用语法 | 哪个对象发起这次成员函数调用 |
| 隐式对象形参 | 这个对象能否满足相应成员函数的访问要求 |
| `this` 表达式 | 函数体怎样显式取得当前对象的地址 |
| ABI 调用约定 | 编译结果怎样在特定平台上传递实现调用所需的信息 |

保持这四层分离，既能用 `(*this).member` 理解成员访问的语言语义，也不会把某一种 ABI 的实现选择误认为所有 C++ 程序都必须具有的物理结构。

## 参考资料

- [C++23 工作草案：成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct)
- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：隐式对象形参](https://timsong-cpp.github.io/cppwp/n4950/over.match.funcs.general)
- [C++23 工作草案：this 表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.this)
- [Itanium C++ ABI：this 参数](https://itanium-cxx-abi.github.io/cxx-abi/abi.html#this-parameters)
