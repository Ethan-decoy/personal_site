---
title: 成员函数的声明与类外定义（Member Function Declarations and Out-of-Class Definitions）
date: 2026-08-29
order: 6
---

# 成员函数的声明与类外定义（Member Function Declarations and Out-of-Class Definitions）

音量设置提供创建、读取与修改操作。类定义可以集中列出这些操作的声明，把函数体写在类体之外，让接口与具体实现分开阅读。

下面用整数档位记录音量，允许范围为闭区间 `[0, 100]`，初值为 `50`。`try_set_level()` 接受范围内的候选值，越界时返回 `false` 并保留原值；这些[更新约定](05-encapsulation-and-class-invariants.md#修改操作先验证再更新)与函数体放在哪里是两项不同的问题。

## 用限定名称确定所属类型

“类外”指类定义的花括号之外，不要求另开一个源文件。下面的完整程序全部放在同一个 `.cpp` 中：类定义位于 `main` 之前，成员函数的类外定义位于 `main` 之后，都写在文件最外层。

> [!IMPORTANT] 类内声明与类外定义的职责
> **对于这里定义在文件最外层的类，类内成员声明给出函数接口，类外定义为已经声明的成员提供实现。**类外定义仍然属于该类，保留相应的成员访问权。
>
> 给出了类定义，不等于其中声明的每个成员函数都已经有函数体；也不能仅靠一条类外定义，为类增加尚未声明的新成员。

```cpp
#include <iostream>

class volume_setting {
  public:
    volume_setting();
    int level() const;
    bool try_set_level(const int requested_level);

  private:
    int stored_level;
};

int main() {
    volume_setting current{};
    std::cout << current.level() << '\n';

    const bool accepted{current.try_set_level(80)};
    std::cout << accepted << ' ' << current.level() << '\n';
}

volume_setting::volume_setting() : stored_level{50} {}

int volume_setting::level() const {
    return stored_level;
}

bool volume_setting::try_set_level(const int requested_level) {
    const bool valid{(requested_level >= 0) && (requested_level <= 100)};

    if (!valid) {
        return false;
    }

    stored_level = requested_level;
    return true;
}
```

程序先输出 `50`，再输出 `1 80`。构造函数建立初始档位 `50`；设置请求被接受，`accepted` 为 `true`，这里以 `1` 输出，随后读到的档位是 `80`。

`::` 是作用域解析运算符（scope resolution operator）。`volume_setting::level` 是限定名称（qualified name），指明正在定义的是 `volume_setting` 中已经声明的 `level` 成员。三种写法的职责分别是：

| 写法 | 在程序中的作用 |
| --- | --- |
| 类体中的 `int level() const;` | 声明这个类提供的读取函数，尚未提供函数体 |
| `int volume_setting::level() const` | 类外函数定义的开头，确定所属类和对应成员 |
| `current.level()` | 通过具体对象 `current` 调用该成员函数 |

限定名称确定成员属于哪个类，对象调用则确定本次处理哪个对象。类外定义没有把 `level` 变成周围作用域中的同名普通函数。

构造函数也使用限定形式：`volume_setting::volume_setting()` 先确定所属类，再按构造函数的特殊语法写出类名，不写返回类型。后面的 `stored_level{50}` 仍是成员初始化器，直接建立成员初值。

## 类外定义仍然具有成员访问权

在 `current.try_set_level(80)` 中，调用对象是 `current`，形参 `requested_level` 取得 `80`。函数体中的 `stored_level` 指定这个调用对象里的成员，赋值更新的就是 `current` 保存的档位。

`volume_setting::try_set_level` 的定义虽然写在类体外，函数体仍具有该类的成员访问权，所以可以直接使用私有成员名称 `stored_level`。`public:`、`private:` 在类定义中规定访问权限，不需要也不能作为类外函数定义的前缀。

调用位置本身没有因此获得私有访问权。`main` 可以调用公开的 `try_set_level()`，却不能直接使用 `current.stored_level`；访问权属于成员函数身份，不取决于函数体是否写在类定义的花括号内。

## 类外定义必须与声明匹配

本例的普通成员函数需要保留对应的返回类型、参数类型列表和尾随 `const`。例如，`level` 返回 `int` 并带有尾随 `const`；`try_set_level` 返回 `bool`，按值接收一个整数。

> [!IMPORTANT] 声明与定义描述同一个成员函数
> **类外定义必须对应类中已有的成员声明，并保留匹配所需的函数类型信息。**匹配不要求声明与定义逐字相同：
>
> | 比较的部分 | 本例应怎样判断 |
> | --- | --- |
> | 形参名称 | 可以不同，声明中也可以省略；函数体使用定义中给出的名称 |
> | 按值形参自身的 `const` | 声明中的 `int` 与定义中的 `const int` 可以对应同一个函数；这项限定约束定义中的参数副本 |
> | 成员函数的尾随 `const` | 属于成员函数类型；本例只声明了 `int level() const;`，其类外定义必须保留这项限定 |

例如，在完整程序的类定义中，只把 `try_set_level` 的声明替换为下面这一条，保留原来的类外定义，程序仍然得到相同结果：

```cpp
bool try_set_level(int requested_level);
```

定义仍按 `const int requested_level` 接收参数，因此函数体不能给这个参数副本重新赋值。声明中的按值参数不带 `const`，并不会撤销定义内的这项约束；它也没有改变调用者传入一个整数的方式。

尾随 `const` 的作用不同。在开篇完整程序中，只把 `level` 的类外定义替换成下面的错误版本，其他代码保持原样：

```cpp
int volume_setting::level() {
    return stored_level;
}
```

> [!WARNING] 尾随 const 不匹配会导致编译错误
> **类中只声明了带尾随 `const` 的 `level`，省略这项限定的类外定义就不是它的实现。**不带尾随 `const` 的这个成员并未在类中声明，限定名称也不允许在类外补造一个新成员，因此编译器必须诊断这个定义错误。

将错误定义替换回下面的正确版本即可；这次操作是替换，不是在原错误定义之后再追加一个函数体：

```cpp
int volume_setting::level() const {
    return stored_level;
}
```

## 调用处的声明与程序所需的定义

开篇程序的 `main` 写在成员函数体之前。分析 `current.try_set_level(80)` 时，类定义中的声明已经给出了成员名称、访问权限、参数和返回类型；编译器据此检查调用，无需在这个位置先看到范围比较和赋值语句。

> [!IMPORTANT] 调用位置与完整程序需要不同的信息
> **本例的调用位置需要可见的成员声明，不必先看到函数体；完整程序仍须提供这些调用所需的定义。**声明说明怎样调用，定义提供被调用函数的实现。定义写在 `main` 之后，仍然属于这份完整程序。

正常程序中，后面的三个类外定义分别提供构造、读取与修改的实现。若只删除 `try_set_level` 的整个类外定义，保留类内声明和 `main` 中的调用，并且不从其他源文件或库提供实现，就会留下未满足的定义需求。

> [!WARNING] 声明不会补出调用所需的实现
> 在上述只删除定义的版本中，声明仍足以让编译器检查调用，单独编译可以产生目标文件；但链接时仍缺少 `volume_setting::try_set_level` 的实现。常见工具链会报告未定义引用、未解析外部符号等链接错误，具体措辞取决于工具链。
>
> 这与尾随 `const` 不匹配不同：前者缺少所需实现，后者已经在分析函数定义时违反声明匹配规则。

只有声明本身，不会无条件要求作者为每个成员手写函数体。例如，本例若只保留类定义，让 `main` 为空，不创建对象也不使用这些成员，就没有这些调用产生的定义需求。这沿用了[声明与所需定义的关系](../05-functions/04-function-declarations-and-definitions.md#多次声明与一次定义)。

> [!PRACTICE] 按接口阅读需要安排函数体
> 函数体较长、会打断接口阅读时，可以在类内集中保留声明，将实现放在类外。这样更容易查看类提供哪些操作，代价是阅读实现时需要跳到相应定义。
>
> 很短且含义直接的成员函数也可以留在类内。选择以当前代码是否易读、易维护为依据；本例分开的仍是同一组成员函数的声明与实现。

## 参考资料

- [C++23 工作草案：类成员的声明与定义](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员函数与类外定义](https://timsong-cpp.github.io/cppwp/n4950/class.mfct)
- [C++23 工作草案：限定名称](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.id.qual)
- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
- [C++23 工作草案：函数类型与形参限定](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：程序所需的定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr#11)
