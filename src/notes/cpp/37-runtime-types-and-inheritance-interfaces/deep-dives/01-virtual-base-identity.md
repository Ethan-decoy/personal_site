---
title: 虚基类身份与构造责任（Virtual Base Identity and Construction）
date: 2026-10-08
order: 1
---

# 虚基类身份与构造责任（Virtual Base Identity and Construction）

本篇以前置的基类子对象、构造初始化和多重继承模型为基础。它解释的具体问题是：两条继承路径需要共享同一份基类状态时，这份对象由谁初始化。

## 虚继承共享一份基类子对象

下面的 `left` 和 `right` 都将 `base` 声明为虚基类。`combined` 因此沿两条路径访问同一份 `base`。

```cpp
#include <iostream>

struct base {
    explicit base(int value) : stored{value} {}
    int stored;
};

struct left : virtual base {
    left() : base{1} {}
};

struct right : virtual base {
    right() : base{2} {}
};

struct combined : left, right {
    combined() : base{10}, left{}, right{} {}
};

int main() {
    const combined value{};
    const left& left_path = value;
    const right& right_path = value;
    const base& from_left = left_path;
    const base& from_right = right_path;

    std::cout << value.stored << '\n';                // 10
    std::cout << (&from_left == &from_right) << '\n'; // 1
}
```

地址比较用于证明两条转换得到同一子对象，并不规定它在完整对象中的偏移或布局。

## 最派生类负责初始化共享虚基类

单独创建 `left` 时，`left` 是最派生类，它的 `base{1}` 生效。创建 `combined` 时，最派生类换成 `combined`，由 `combined` 的 `base{10}` 初始化共享虚基类；中间类对应的虚基类初始化项不执行。

虚基类先于普通直接基类初始化。最派生类遗漏虚基类初始化时，会尝试默认初始化它；本例 `base` 没有默认构造函数，因此这样写 `combined` 会编译失败。

> [!IMPORTANT]
> 虚基类身份由完整的最派生对象统一建立，构造责任也随之归于最派生类。中间类的初始化不能替它选择共享状态。

## 共享身份不自动解决所有冲突

两条路径若各自覆盖同一个虚基类虚函数，而最派生类没有提供消除冲突的覆盖，可能不存在唯一的最终覆盖者，类定义会不合法。共享一份状态并不自动指定两份不同实现中该选哪一份。

虚基类也不保证位于某个固定偏移，不能用 `sizeof` 或一次地址打印推出普遍布局。它提供的是语言层面的对象关系。

> [!PRACTICE]
> 当领域真的要求多条接口路径共享一个基类身份时，虚继承能表达这一点。仅需共享一份数据的组件通常可以直接引用共同状态对象，避免把状态共享和继承层次绑在一起。

## 参考资料

- [C++23 工作草案：虚基类子对象](https://timsong-cpp.github.io/cppwp/n4950/class.mi)
- [C++23 工作草案：基类和成员初始化](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++23 工作草案：最终覆盖者](https://timsong-cpp.github.io/cppwp/n4950/class.virtual)
