---
title: 析构函数与类对象销毁（Destructors and Class Object Destruction）
date: 2026-09-03
order: 1
---

# 析构函数与类对象销毁（Destructors and Class Object Destruction）

初始化完成使类对象开始生命周期；对象到达销毁边界时，程序还需要结束这段生命周期，并执行类型规定的销毁过程。析构函数（destructor）是类为这一过程提供的特殊成员函数：

```cpp
#include <iostream>

class inspection_trace {
  public:
    explicit inspection_trace(int inspection_number) : inspection_number{inspection_number} {}

    ~inspection_trace() {
        std::cout << "finish inspection " << inspection_number << '\n';
    }

  private:
    int inspection_number;
};

int main() {
    std::cout << "before block\n";

    {
        inspection_trace current{17};
        std::cout << "inside block\n";
    }

    std::cout << "after block\n";
}
```

程序输出：

```text
before block
inside block
finish inspection 17
after block
```

`~inspection_trace()` 是 `inspection_trace` 的析构函数。声明在类名前写 `~`，不写返回类型，参数列表必须为空。`~inspection_trace` 整体标识当前类的析构函数。

## 销毁边界自动调用析构函数

执行进入内层代码块并完成 `current` 的初始化后，这个对象开始存在。执行离开内层代码块时，`current` 到达销毁边界，程序隐式调用它的析构函数；析构函数输出一行文本，完成相应销毁过程后，控制才继续执行外层的下一条语句。

右花括号是这个例子中最直观的边界，但不是专门调用析构函数的运算符。正常顺序执行到代码块末尾，或者 `return`、`break`、`continue` 使控制离开某个局部对象仍然生效的范围时，已经完成构造而不再生效的自动存储期对象都会按照生命周期规则销毁。只有实际完成构造的对象才需要经历相应销毁。

临时类对象同样具有销毁边界。它通常在相应完整表达式结束时销毁；若特定引用初始化延长了临时对象的生命周期，析构函数也随延长后的生命周期边界调用。析构时机来自对象的生命周期规则，不来自对象是否具有程序员提供的名称。

> [!IMPORTANT]
> 析构函数不决定对象应当存活多久；生命周期规则决定何时开始销毁，析构函数定义类对象进入销毁过程时需要执行的类特定动作。

## 析构开始是类对象生命周期的精确终点

对于类类型，标准把析构函数调用开始规定为相应对象生命周期的结束点。析构函数体随后仍然能够读取 `inspection_number`，并不表示完整对象继续处于普通生命周期中。C++ 对销毁期间的成员访问另有专门规则，而且成员子对象此时还没有完成各自的销毁。

因此，析构函数体能够利用尚未销毁的成员完成类特定动作；函数体结束后，成员子对象还会按照成员销毁规则继续处理。不能把这个过程简化成“所有成员先消失，再调用一个普通函数”，也不能根据完整对象的生命周期已经结束，反推出析构函数体不能访问成员。

## 不把析构函数当作普通清理调用

普通局部对象不需要调用者手动执行析构函数。它到达作用域确定的销毁边界时，语言会自动发起调用。

析构过程开始后，不能继续把原对象当作仍在生命周期内的普通对象使用。析构也不是把成员清零、再让同一对象恢复到默认状态的操作；若类需要在生命周期内切换业务状态，应当由具有相应含义的普通成员函数表达。

**正常使用类对象时，构造建立对象，生命周期边界触发析构；调用者通过控制对象所处的作用域来约束存活时间，而不是手动配对构造函数与析构函数调用。**

## 参考资料

- [C++23 工作草案：析构函数](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：声明语句中的控制转移与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
