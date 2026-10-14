---
title: 多个接口与基类子对象（Multiple Interfaces and Base Subobjects）
date: 2026-10-08
order: 5
---

# 多个接口与基类子对象（Multiple Interfaces and Base Subobjects）

一个对象可能同时提供“读取”和“重置”两项独立能力。多重继承（Multiple Inheritance）允许对象包含多个基类子对象，并经由不同接口使用同一个完整对象。

## 不同接口可以通向同一个对象

下面两个抽象类各自只有一项职责。`resettable_source` 同时履行它们；每个拥有型基类接口都提供虚析构函数。

```cpp
#include <iostream>

struct readable {
    virtual ~readable() = default;
    virtual int read() const = 0;
};

struct resettable {
    virtual ~resettable() = default;
    virtual void reset() = 0;
};

class resettable_source : public readable, public resettable {
  public:
    int read() const override {
        return stored;
    }

    void reset() override {
        stored = 0;
    }

  private:
    int stored{220};
};

int main() {
    resettable_source value;
    readable& source = value;
    std::cout << source.read() << '\n'; // 220

    auto* control = dynamic_cast<resettable*>(&source);
    if (control != nullptr) {
        control->reset();
    }
    std::cout << source.read() << '\n'; // 0
}
```

这种转换从一个基类接口找到同一完整对象的另一个公开且无歧义的基类接口，通常称为交叉转换（Cross Cast）。源接口具有多态性，目标关系经过运行时检查。

`&source` 和 `control` 不要求具有相同的地址表示。它们可以指向同一完整对象内的不同子对象；不能把一个指针的位模式直接当作另一个接口指针。

## 重复继承同一基类会产生身份问题

如果 `left` 与 `right` 都普通继承 `base`，再让 `combined` 同时继承两者，沿两条非虚继承路径分别形成一份 `base` 子对象：

```text
combined
  +-- left  -- base：一份状态
  +-- right -- base：另一份状态
```

下面的完整程序只改变左侧路径中的状态：

```cpp
#include <iostream>

struct base {
    int stored{220};
};

struct left : base {};
struct right : base {};
struct combined : left, right {};

int main() {
    combined value;
    left& left_path{value};
    right& right_path{value};
    left_path.stored = 230;
    std::cout << left_path.stored << ' ' << right_path.stored << '\n'; // 230 220
}
```

`left_path.stored` 与 `right_path.stored` 属于不同的 `base` 子对象。改写前者不会改变后者，因此这里的歧义来自确实存在两个目标，而不只是名称拼写重复。

此时一般 `combined*` 到 `base*` 的转换有歧义：要选哪一份？经过 `left*` 或 `right*` 可以明确访问路径，但两条路径对应的状态仍是两份。限定名称可以解决“走哪条路径”，不会把两份对象合并。

## 共享基类身份需要另一项契约

虚继承（Virtual Inheritance）让最派生对象中同一虚基类具有一份共享子对象。这是子对象身份规则，和虚函数选择实现是不同的问题。

需要这项关系时，参见[虚基类的构造责任](deep-dives/01-virtual-base-identity.md#最派生类负责初始化共享虚基类)。它同时改变构造责任，并可能带来新的覆盖冲突，不能只为消除一条编译诊断而加入 `virtual`。

> [!PRACTICE]
> 多个小型行为接口可以共存于一个对象。多个携带状态和默认实现的基类则需要额外检查：是否重复保存状态、谁维护共同不变式、哪些名称产生歧义。只有存在真实的共同对象关系时，才引入这种结构。

## 参考资料

- [C++23 工作草案：多重继承与基类子对象](https://timsong-cpp.github.io/cppwp/n4950/class.mi)
- [C++23 工作草案：经检查的运行时转换](https://timsong-cpp.github.io/cppwp/n4950/expr.dynamic.cast)
