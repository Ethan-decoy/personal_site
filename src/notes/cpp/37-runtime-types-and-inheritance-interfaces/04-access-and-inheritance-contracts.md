---
title: 访问控制与继承契约（Access Control and Inheritance Contracts）
date: 2026-10-08
order: 4
---

# 访问控制与继承契约（Access Control and Inheritance Contracts）

继承建立对象关系，访问控制决定哪些代码可以使用相关入口。`public`、`protected` 和 `private` 分别出现在成员声明与继承列表时，约束的对象不同。

## 成员访问和基类访问分别判断

公开成员供一般调用方使用；私有成员只允许类自身及授权的协作接口使用。受保护成员（Protected Member）另允许派生类的成员在符合访问规则时使用。

`class derived : public base` 的公开继承保留基类公开接口面向外部的可访问性。`private base` 的私有继承使基类关系不再作为外部可用的转换入口；基类原有私有成员仍然不能被派生类直接访问。

| 声明位置 | 所表达的问题 |
| --- | --- |
| 成员前的 `public:`、`protected:`、`private:` | 谁可以直接使用这个成员名称 |
| 继承列表中的 `public base` 等 | 谁可以经由当前派生类访问基类关系及其接口 |

`struct` 的默认成员访问与默认基类访问是公开，`class` 的默认值是私有。显式写出继承方式能让接口关系更容易判断。

## protected 不代表能访问任意基类对象

下面通过派生类对象调整自己的基类状态。受保护入口用函数表达，避免暴露可任意改写的成员。

```cpp
#include <iostream>

class pressure_source {
  public:
    int read() const {
        return stored;
    }

  protected:
    void set_pressure(int value) {
        stored = value;
    }

  private:
    int stored{220};
};

class calibrated_source : public pressure_source {
  public:
    void calibrate(int value) {
        set_pressure(value);
    }

    void copy_setting_from(const calibrated_source& source) {
        set_pressure(source.read());
    }
};

int main() {
    calibrated_source value;
    value.calibrate(230);
    std::cout << value.read() << '\n'; // 230
}
```

如果 `calibrated_source` 的成员试图通过一个一般 `pressure_source&` 调用 `set_pressure`，仍然不满足受保护访问的对象要求。对于这里的非静态成员，派生类成员经对象访问受保护基类成员时，目标的静态类型要属于该派生类或其进一步派生类，不能任意伸入别的基类对象。

例如放在 `calibrated_source` 的成员函数体中：

```cpp
pressure_source other;
// other.set_pressure(240); // 取消注释会编译失败：目标是一般基类对象
```

这项限制保护“派生对象自己的扩展入口”，而不是把基类内部状态开放给所有派生类代码。

## 私有继承不是替换共同接口的一种写法

私有继承可以服务于实现复用，但外部 `derived*` 到 `base*` 的访问转换受限。若设计意图是“任何派生对象都可以作为共同基类接口使用”，应采用满足替代契约的公开继承。

> [!PRACTICE]
> 只需保存一个对象并复用它的行为时，组合通常清楚。需要公开的对象替代关系时选择公开继承；需要扩展钩子时考虑受保护函数，并说明派生类须维护的不变式。访问说明符本身不会检查业务契约。

## 参考资料

- [C++23 工作草案：基类访问](https://timsong-cpp.github.io/cppwp/n4950/class.access.base)
- [C++23 工作草案：受保护成员访问](https://timsong-cpp.github.io/cppwp/n4950/class.protected)
