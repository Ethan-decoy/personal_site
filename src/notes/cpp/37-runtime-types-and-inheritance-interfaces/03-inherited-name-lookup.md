---
title: 继承中的名称查找（Inherited Name Lookup）
date: 2026-10-08
order: 3
---

# 继承中的名称查找（Inherited Name Lookup）

派生类已经继承一个函数，并不意味着所有同名重载都自动出现在派生类调用中。名称查找先决定找到哪些声明，重载决议再选函数，虚调用最后决定实现。把这三个步骤混在一起，会误以为所有差异都由 `virtual` 决定。

## 派生类的同名声明可以隐藏整组基类名称

基类定义 `read()` 和 `read(int)`，派生类只覆盖 `read()` 时，从派生类作用域找到的 `read` 会隐藏基类的同名声明。这称为名称隐藏（Name Hiding），与参数是否相同无关。

`using pressure_source::read;` 是使用声明（Using Declaration），把基类的这组名称引入当前查找，使其可以与派生类声明共同参加选择。

```cpp
#include <iostream>

class pressure_source {
  public:
    virtual ~pressure_source() = default;

    virtual int read() const {
        return 220;
    }

    int read(int adjustment) const {
        return read() + adjustment;
    }
};

class calibrated_source : public pressure_source {
  public:
    using pressure_source::read;

    int read() const override {
        return 230;
    }
};

int main() {
    const calibrated_source value;
    const pressure_source& source = value;
    std::cout << value.read() << '\n';   // 230
    std::cout << value.read(5) << '\n';  // 235
    std::cout << source.read(5) << '\n'; // 235
}
```

删除使用声明后，`value.read(5)` 编译失败：查找只找到派生类的无参 `read`，它无法接收一个参数。`source.read(5)` 仍能从基类接口找到相应重载。

## 选中的普通函数内部仍可能执行虚调用

`read(int)` 本身不是虚函数；它的函数体调用无参 `read()`，这项调用是虚调用，因此到达派生类返回 `230` 的实现，再加上 `5`。

使用声明不会把普通函数变成虚函数，也不会改变覆盖关系。覆盖是否合法仍由函数签名、虚函数规则和 `override` 检查。

> [!IMPORTANT]
> 查找决定可见声明，重载决议决定调用接口，虚分派决定已选虚函数的最终实现。只改变其中一步的规则，不能代替另外两步。

## 显式限定可以选定基类实现

在上面 `main` 中增加这段代码：

```cpp
std::cout << value.pressure_source::read() << '\n'; // 220
```

基类限定调用抑制本次虚分派，直接执行基类实现。它仍然在 `value` 的基类子对象上工作，没有创建一个独立基类对象。

在派生类实现中复用一项确切的基类行为时，这种限定可能合理；若调用者期望实际对象实现，就不应无意中加入限定。

## 参考资料

- [C++23 工作草案：类成员查找](https://timsong-cpp.github.io/cppwp/n4950/class.member.lookup)
- [C++23 工作草案：使用声明](https://timsong-cpp.github.io/cppwp/n4950/namespace.udecl)
- [C++23 工作草案：虚函数](https://timsong-cpp.github.io/cppwp/n4950/class.virtual)
