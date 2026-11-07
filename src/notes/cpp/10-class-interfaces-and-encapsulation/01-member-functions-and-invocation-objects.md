---
title: 成员函数与调用对象（Member Functions and Invocation Objects）
date: 2026-08-29
order: 1
---

# 成员函数与调用对象（Member Functions and Invocation Objects）

绘图程序用 `position` 保存横向位置 `x` 和纵向位置 `y`。向右移动时，程序增加 `x`，保持 `y` 不变。这个操作既可以由接收位置对象的普通函数完成，也可以声明为位置类型的成员。

普通函数 `move_right` 通过 `position&` 接收要修改的位置，通过 `dx` 接收向右移动的距离。以下坐标与位移均使用非负的小整数，并保证相加结果可以由 `int` 表示。下面是完整程序：

```cpp
struct position {
    int x;
    int y;
};

void move_right(position& target, const int dx) {
    target.x += dx;
}

int main() {
    position first{20, 10};
    position second{60, 10};

    move_right(first, 15);
    move_right(second, 5);
}
```

两次调用分别将 `first.x` 改为 `35`、`second.x` 改为 `65`，两个 `y` 都保持 `10`。引用形参 `target` 在本次调用中绑定哪个对象，操作就修改哪个对象。

## 将操作声明为类型的成员

同一项移动操作可以写在 `position` 的类型定义中，成为成员函数（member function）。调用时写成 `first.move_right(15)`，由点号左侧的对象提供修改目标。下面是另一个独立的完整程序，与开篇程序分开使用：

```cpp
struct position {
    int x;
    int y;

    void move_right(const int dx) {
        x += dx;
    }
};

int main() {
    position first{20, 10};
    position second{60, 10};

    first.move_right(15);
    second.move_right(5);
}
```

`move_right` 现在位于 `position` 的类作用域中。函数体中的 `x += dx;` 在调用发生时执行，不会因为写在类体内就在定义类型时自行执行。

> [!IMPORTANT] 成员函数与成员子对象
> **在这里的 `position` 中，`x` 和 `y` 是数据成员，各对象分别包含自己的整数成员子对象；`move_right` 是成员函数，不是对象内部的成员子对象。**同一项成员函数定义可以用于不同位置对象的调用。

加入这里的普通成员函数后，`position` 仍满足 C++23 的聚合要求，花括号中的 `20`、`10` 仍按声明顺序初始化数据成员 `x`、`y`。

## 由成员访问表达式发起调用

在 `first.move_right(15)` 中，点号左侧的 `first` 提供调用对象；右侧的 `move_right` 在 `position` 的类作用域中确定成员函数，括号里的 `15` 用来初始化形参 `dx`。

两份程序完成相同的移动，目标对象的提供方式不同：

| 对照项 | 普通函数版本 | 成员函数版本 |
| --- | --- | --- |
| 调用写法 | `move_right(first, 15)` | `first.move_right(15)` |
| 目标对象 | 引用形参 `target` 绑定到实参 `first` 指定的对象 | 点号左侧的 `first` 提供调用对象 |
| 移动距离 | `15` 初始化形参 `dx` | `15` 初始化形参 `dx` |
| 函数体中的成员访问 | `target.x` | `x` |

成员函数体中的 `dx` 是本次调用初始化的独立形参对象。名称查找把 `x` 确定为 `position` 的数据成员，因此它在第一次调用中指定 `first.x`，在第二次调用中指定 `second.x`。

> [!IMPORTANT] 调用对象决定成员访问的目标
> **本节这种成员函数的调用需要有效的目标对象；函数体中确定为数据成员的名称，指代本次调用对象中的相应成员子对象。**本例的 `move_right` 用于可修改的 `position` 对象。同一定义用于不同对象，不会让这些对象共享一份成员状态。

逐次追踪成员函数版本的状态：

| 执行位置 | `first.x` | `first.y` | `second.x` | `second.y` |
| --- | ---: | ---: | ---: | ---: |
| 两个对象初始化后 | `20` | `10` | `60` | `10` |
| `first.move_right(15);` 后 | `35` | `10` | `60` | `10` |
| `second.move_right(5);` 后 | `35` | `10` | `65` | `10` |

两个位置对象都由 `main` 创建，并在调用期间保持有效。每次调用只修改对应对象的 `x`，另一对象的状态和两个 `y` 都按上表保留。

## 参考资料

- [C++23 工作草案：类成员](https://timsong-cpp.github.io/cppwp/n4950/class.mem.general)
- [C++23 工作草案：非静态成员函数](https://timsong-cpp.github.io/cppwp/n4950/class.mfct.non.static)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++23 工作草案：聚合初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.aggr)
