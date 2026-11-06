---
title: 友元与协作接口（Friends and Cooperative Interfaces）
date: 2026-10-08
order: 3
---

# 友元与协作接口（Friends and Cooperative Interfaces）

某项操作同时比较两个对象，不一定属于其中某个对象的成员接口。若实现确需访问内部表示，可以明确授权该协作函数，而不必把表示公开给所有调用方。

## friend 授权访问，不改变函数归属

友元（Friend）声明允许指定的函数或类访问当前类的非公开成员。定义在类中的友元非成员函数仍不是成员函数，没有当前对象的 this。

```cpp
#include <iostream>

class pressure {
  public:
    explicit pressure(int value) : stored{value} {}

    friend int difference(const pressure& left, const pressure& right) {
        return left.stored - right.stored;
    }

  private:
    int stored;
};

int main() {
    const pressure front{230};
    const pressure rear{220};
    std::cout << difference(front, rear) << '\n'; // 10
}
```

示例使用已知的小整数，差值可表示；若接口接收任意 int，减法还须有数值范围契约。授权访问不提供数值安全。

这个函数通过与实参类型相关的查找找到。它在类内定义且没有另一个普通可见声明时，常称隐藏友元（Hidden Friend）；不能因此假定无实参的普通名称查找也总能找到它。

> [!IMPORTANT]
> friend 放宽指定协作者的访问权限，不把私有成员变成公开，也不让非成员函数变成成员。授权按指定关系成立，不自动传递、继承或互为友元。

## 协作关系应围绕稳定操作

比较、输出和对称运算常适合非成员接口。是否授权内部访问，取决于实现能否使用足够清楚的公开操作，以及这项操作是否属于类型所承诺的语义。

公开一个通用的“取出全部内部状态”接口，只为绕开一项友元授权，反而可能扩大表示依赖。另一面，过多友元也会使类型内部表示被许多位置耦合。

> [!PRACTICE]
> 将友元用于确属类型接口的一小组协作操作。调用者依赖操作含义，授权实现维护封装；不要让业务上无关的工具取得内部修改权限。

## 参考资料

- [C++23 工作草案：友元](https://timsong-cpp.github.io/cppwp/n4950/class.friend)
- [C++23 工作草案：实参依赖查找](https://timsong-cpp.github.io/cppwp/n4950/basic.lookup.argdep)
