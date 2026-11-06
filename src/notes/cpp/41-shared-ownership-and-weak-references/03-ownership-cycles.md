---
title: 拥有环与关系方向（Ownership Cycles and Relationship Direction）
date: 2026-10-08
order: 3
---

# 拥有环与关系方向（Ownership Cycles and Relationship Direction）

“对象之间有关联”和“对象之间互相维持生命周期”不是同一件事。若两个对象都通过 shared_ptr 拥有对方，外部入口全部释放后，彼此仍各保留一份拥有责任，计数就不会归零。

## 强关系组成环时无法自然结束

拥有环（Ownership Cycle）可以经过两个对象，也可以经过更多对象或回调闭包。问题是没有最后一个拥有者退出，而不是 shared_ptr 忘记执行析构。

为层级关系规定方向：父对象拥有子对象，子对象只弱观察父对象。

```cpp
#include <iostream>
#include <memory>

struct node {
    explicit node(int value) : pressure_kpa{value} {}

    ~node() {
        std::cout << "destroy " << pressure_kpa << '\n';
    }

    int pressure_kpa;
    std::shared_ptr<node> child;
    std::weak_ptr<node> parent;
};

int main() {
    auto root = std::make_shared<node>(220);
    auto child = std::make_shared<node>(230);
    root->child = child;
    child->parent = root;
    child.reset();

    root.reset(); // 依次输出 destroy 220、destroy 230
}
```

root 的析构体先输出；随后成员 `child` 释放对子对象的最后责任。子对象的 parent 不维持父对象，因此形成可结束的责任链。

## 选弱关系依据生命周期含义

不能把任何一条边任意改成 weak_ptr 就认为设计完成。若某个组件承诺自己存在时目标必然存活，却只保存弱观察，它可能在执行前失去必要对象。

反向导航、缓存索引、非必要订阅关系适合弱观察；任务需要一直执行到完成的资源，可能需要真实拥有。关系须由业务生命周期决定。

> [!WARNING]
> 捕获 shared_ptr 的闭包若被保存回同一对象中，可能形成“对象拥有回调，回调拥有对象”的环。闭包看起来只有一个捕获，也须审查整条保存路径。

解除订阅、显式关闭或集中拥有也可以破除环。弱观察只是一种工具，不是所有共享关系的统一答案。

## 参考资料

- [C++23 工作草案：shared_ptr 销毁与计数](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.shared)
- [C++23 工作草案：weak_ptr](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.weak)
