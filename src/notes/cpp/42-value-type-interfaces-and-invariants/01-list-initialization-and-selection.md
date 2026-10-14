---
title: 列表初始化与构造选择（List Initialization and Constructor Selection）
date: 2026-10-08
order: 1
---

# 列表初始化与构造选择（List Initialization and Constructor Selection）

花括号可以拒绝窄化，但它不是“把括号换一种外观”。当类型提供列表构造接口时，`T{a, b}` 可能选择与 `T(a, b)` 不同的构造函数。

## initializer_list 使一组值成为构造输入

`std::initializer_list<T>` 在 `<initializer_list>` 中表示一组只读元素的轻量访问入口。编译器为对应列表形成承载元素的数组；其元素类型是 const T。

对具有构造函数的类进行非空列表初始化时，先考虑 initializer_list 构造函数；若没有可行的相应构造，再按普通形参考虑列表中的实参。窄化检查仍适用，不能因为列表构造产生窄化就自动退回另一条路线。

```cpp
#include <iostream>
#include <vector>

int main() {
    const std::vector<int> repeated(3, 220);
    const std::vector<int> listed{3, 220};

    std::cout << repeated.size() << ' ' << repeated.front() << '\n'; // 3 220
    std::cout << listed.size() << ' ' << listed.front() << '\n';     // 2 3
}
```

圆括号选择“数量和重复值”的构造；花括号选择“两项元素”的构造。不能只按参数个数推断二者等价。空花括号还需单独考虑默认构造等规则，不能把非空列表的选择步骤无条件套入。

## 列表访问入口不拥有另一份元素

复制 initializer_list 不复制承载元素，两个入口仍指向同一承载数组：

```cpp
#include <initializer_list>
#include <iostream>

int main() {
    const std::initializer_list<int> source{220, 230};
    const auto copied = source;
    std::cout << (source.begin() == copied.begin()) << '\n'; // 1
}
```

直接用列表初始化局部 initializer_list 时，相关承载数组的寿命按绑定规则延长到相应局部对象的范围；复制一个入口不会重新延长数组寿命。返回局部列表、保存短暂实参的入口到成员，都可能留下悬空访问。

vector 的列表构造会把值存入自己的元素对象，因此容器与 initializer_list 的拥有关系不同。列表元素只读也意味着“从列表移走 unique_ptr”不可行：vector 的列表构造需要从这些只读元素形成自己的值，不能满足独占拥有者的复制要求。

> [!TIP]
> 先判断花括号是否进入列表构造，再判断元素怎样复制或构造，最后判断承载数组和接收对象分别活多久。拒绝窄化只是列表初始化的一项规则。

## auto 也要区分列表形式

`auto value{220};` 推导 int；`auto values = {220, 230};` 推导 initializer_list<int>，而不是 vector。`auto values{220, 230};` 不能据此推导出一个普通单值类型。

> [!PRACTICE]
> 数量与重复值的容器构造用能直接表达该契约的圆括号形式；元素列表用花括号。长期保存一组值时使用真正拥有元素的容器，不把 initializer_list 成员当作轻量 vector。

## 参考资料

- [C++23 工作草案：列表初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.list)
- [C++23 工作草案：列表初始化的重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match.list)
- [C++23 工作草案：initializer_list](https://timsong-cpp.github.io/cppwp/n4950/support.initlist)
