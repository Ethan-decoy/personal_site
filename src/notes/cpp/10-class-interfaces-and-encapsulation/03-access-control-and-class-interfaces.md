---
title: 访问控制与类接口（Access Control and Class Interfaces）
date: 2026-08-29
order: 3
---

# 访问控制与类接口（Access Control and Class Interfaces）

程序用计数器记录数量，并约定数量不能为负。如果保存计数的数据成员直接公开，外部代码只要具有可修改的访问路径，就能直接给它赋值，包括写入违反这项约定的负数。下面是独立的完整程序：

```cpp
#include <iostream>

struct counter_state {
    int count;
};

int main() {
    counter_state current{3};
    current.count = -1;
    std::cout << current.count << '\n';
}
```

程序输出 `-1`。这个值可以由 `int` 表示，因此赋值符合语言规则；但它不符合当前计数业务的约定。C++ 的访问控制（access control）可以把外部代码能够请求的操作与类内部使用的数据分开，让类型控制修改入口。

## public 接口与 private 表示

`class` 与 `struct` 一样可以定义类类型。`public` 与 `private` 是访问说明符（access specifier），用来指定后续成员的访问权限。下面的 `counter` 公开读取、设置操作，把保存计数的成员放在 `private` 部分。这是另一个独立的完整程序，与开篇程序分开使用：

```cpp
#include <iostream>

class counter {
  public:
    int value() const {
        return stored_value;
    }

    void set_value(const int requested_value) {
        stored_value = requested_value;
    }

  private:
    int stored_value{0};
};

int main() {
    counter current{};
    current.set_value(3);
    std::cout << current.value() << '\n';
}
```

`counter current{}` 创建一个计数器，类中的默认成员初始化器 `stored_value{0}` 为它提供初始计数 `0`。这里没有按聚合成员的顺序向私有成员传入初值。随后，`set_value(3)` 把计数改为 `3`，`value()` 按值返回当前计数，所以程序输出 `3`。

`value()` 与 `set_value()` 是显式声明的公开操作，构成类接口（class interface）的一部分；`stored_value` 是实现这些操作所使用的私有表示。

> [!IMPORTANT] 公开接口与私有表示的访问边界
> **`public` 成员没有这项名称访问限制；`private` 成员只能由这个类的成员及其他被语言规则授予访问权的代码使用。**本例的 `main` 可以调用 `value()`、`set_value()`，却不能直接使用私有成员名称 `stored_value`。
>
> 公开接口描述外部代码能够请求的操作；私有表示由类内部的实现使用。调用公开成员函数不会让调用者自身获得私有成员的访问权。

访问说明符从出现的位置开始作用于后续成员声明，直到下一个访问说明符或类定义结束。因此，`public:` 管理上面的两个成员函数，`private:` 管理 `stored_value`。

沿用这个 `counter` 程序，把下面的语句作为独立错误示例，插入 `main` 中的 `current` 定义之后：

```cpp
current.stored_value = 3; // 错误：main 不能直接访问 private 成员
```

这里的 `current` 可以修改，赋入的 `3` 也符合计数约定；失败原因是赋值使用了外部代码无权访问的成员名称。`set_value` 的函数体属于 `counter`，可以使用这个私有名称，所以外部代码能够通过公开调用请求同一次更新。

`public` 也不会取消上一节的 [`const` 访问约束](02-const-member-functions-and-read-only-access.md#const-对象只能提供受限访问)：通过只读路径可以调用本例的 `value()`，不能调用 `set_value()`。访问许可与修改权限需要分别判断。

`private` 限制源代码中的成员访问，成员仍然属于对象；它不会把成员数据加密。

## 访问权属于类

类的成员函数可以访问同类其他对象的私有成员。把下面的函数添加到前面 `counter` 定义的 `public` 部分，原有成员保持不变：

```cpp
void copy_from(const counter& other) {
    stored_value = other.stored_value;
}
```

`copy_from` 将另一个计数器记录的数量复制到当前计数器。

> [!IMPORTANT] 同类访问权不局限于当前对象
> **类的成员函数可以访问同类其他对象的私有成员；名称访问许可不会解除目标已有的 `const` 访问限制。**在 `copy_from` 中，`other.stored_value` 的私有名称访问合法，但 `other` 是 `const counter&`，因此只能经它读取这个整数成员，不能给它赋值。
>
> `private` 判断当前位置能否使用成员名称，`const` 约束经当前路径允许进行的修改；通过其中一项检查，不代表另一项也成立。

保留头文件和扩充后的类定义，把 `main` 替换为下面的版本：

```cpp
int main() {
    counter source{};
    counter target{};

    source.set_value(8);
    target.set_value(3);

    target.copy_from(source);

    std::cout << source.value() << ' ' << target.value() << '\n';
}
```

在 `target.copy_from(source)` 中，调用对象是 `target`，形参 `other` 绑定到 `source`。函数体中赋值左侧的 `stored_value` 指定 `target` 的成员，右侧的 `other.stored_value` 指定 `source` 的成员：

| 执行位置 | `source.value()` | `target.value()` |
| --- | --- | --- |
| 两次 `set_value` 调用后 | `8` | `3` |
| `target.copy_from(source)` 后 | `8` | `8` |

程序输出 `8 8`。被更新的是 `target`，`source` 保持原值；两个对象仍然各自保存自己的计数。

## struct 与 class 的默认访问

`struct` 与 `class` 都能拥有数据成员、成员函数和访问说明符。只比较本节的成员访问时，两个关键字的差别是没有显式访问说明符时采用的默认值：

> [!IMPORTANT] struct 与 class 的默认成员访问
> **未写访问说明符时，`struct` 的成员默认是 `public`，`class` 的成员默认是 `private`。**显式访问说明符则决定其作用范围内成员的权限。
>
> | 定义使用的关键字 | 未写访问说明符时的成员访问 |
> | --- | --- |
> | `struct` | `public` |
> | `class` | `private` |
>
> 这里讨论成员访问，不涉及继承的默认访问。

把前面定义中的 `class counter` 改为 `struct counter`，已经显式写出的 `public:`、`private:` 仍然生效，上述调用与访问结果不会改变。`struct` 可以拥有私有成员，`class` 也可以提供公开成员，它们都定义类类型。

访问控制建立了名称访问边界，但没有自动验证公开操作接收的数值：

> [!WARNING] private 不会自动保证计数有效
> **把保存计数的成员设为 `private`，不会让公开修改函数自动拒绝负数。**在前面只使用 `current` 的 `counter` 程序中，把 `current.set_value(3)` 改为 `current.set_value(-1)`，程序仍然可以编译运行，输出会变为 `-1`，违反开篇的非负计数约定。
>
> 当前 `set_value` 没有验证输入。这个版本只控制外部代码通过哪个入口修改计数，还没有保证该入口只接受有效值；公开修改操作仍须决定哪些输入可以写入。

## 参考资料

- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
- [C++23 工作草案：cv 限定符与访问路径](https://timsong-cpp.github.io/cppwp/n4950/dcl.type.cv)
- [C++ Core Guidelines：class 与 struct](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-struct)
