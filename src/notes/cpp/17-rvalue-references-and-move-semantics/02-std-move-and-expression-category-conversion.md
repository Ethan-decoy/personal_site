---
title: std::move 与表达式类别转换（std::move and Expression Category Conversion）
date: 2026-09-05
order: 2
---

# std::move 与表达式类别转换（std::move and Expression Category Conversion）

把已有对象提供为可复用状态的来源时，逐次写出具体的右值引用转换类型会重复对象的类型信息。标准库提供的 `std::move` 可以根据传入表达式得到相应的右值引用，使调用位置直接表达这种意图。

## 一个只改变表达式类别的标准库工具

使用 `std::move` 需要包含标准库头文件 `<utility>`，并保留表示标准库命名空间的 `std::` 前缀。对于普通对象表达式，它返回指向同一个对象的右值引用，保留该对象类型上的 `const` 等限定，不创建新对象，也不执行资源转移。

下面是一个完整程序：

```cpp
#include <iostream>
#include <utility>

int main() {
    int value{240};
    int&& alias{std::move(value)};
    const int copy{std::move(value)};

    alias = 245;

    std::cout << value << ' ' << copy << '\n';
}
```

对于类型为 `int` 的局部对象 `value`，`std::move(value)` 的作用相当于 `static_cast<int&&>(value)`：调用表达式是表示原对象的将亡值。

`alias` 因此绑定到原来的整数对象。初始化 `copy` 时，整数初始化规则从这个对象取得数值 `240`，建立独立的记录；没有任何一步把源整数清零。随后通过引用赋值只改变 `value`，所以程序输出 `245 240`。

> [!IMPORTANT]
> `std::move` 提供一种允许接收方复用源对象状态的表达式，不负责执行这种复用。真正发生什么，取决于接收表达式的构造函数、赋值运算符或其他函数。

## 转换不会移除 const

下面的片段同样需要 `<utility>`，放在函数体内：

```cpp
const int value{240};
const int&& alias{std::move(value)};

// int&& writable{std::move(value)}; // 错误：不能丢弃 const
```

`std::move(value)` 是表示 `const int` 对象的将亡值。它可以绑定到 `const int&&`，但不能让原本只读的对象变得可写。如果接收方需要修改源对象才能完成交接，这个只读来源就不满足相应接口的要求。

因此，不能只看到调用位置写了 `std::move`，就断言某项资源一定会被转走。源对象的限定和接收方实际提供的操作仍然共同决定结果。

## 不延长通过函数调用传回的临时对象

> [!WARNING]
> 右值引用的类型本身不保证生命周期延长。`int&& alias{240};` 直接绑定临时对象，临时对象可以一直存活到该局部引用的生命周期结束。
>
> 改写为 `int&& alias{std::move(240)};` 就不同了：临时对象先绑定到 `std::move` 的引用形参，再通过返回的引用交给局部引用。绑定到引用形参的临时对象只存活到包含这次调用的完整表达式结束，也就是这条声明的分号处。
>
> 后一种写法在类型上可以成立，但分号之后 `alias` 已经成为悬空引用（dangling reference），不能再用于读取或修改那个整数。函数返回一条指向临时对象的引用，不会把临时对象的生命周期继续传递给调用方的引用。

对于已有的局部对象，`std::move` 同样不改变其销毁时刻。表达式类别、对象状态与对象生命周期必须分别判断。

## 参考资料

- [C++23 工作草案：forward 与 move](https://timsong-cpp.github.io/cppwp/n4950/utility#forward)
- [C++23 工作草案：临时对象的生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
