---
title: 多态对象的所有权与虚析构（Polymorphic Ownership and Virtual Destruction）
date: 2026-10-05
order: 4
---

# 多态对象的所有权与虚析构（Polymorphic Ownership and Virtual Destruction）

基类引用可以统一访问不同对象，但借用本身不负责销毁。如果函数在运行时选择压力来源，创建对象并把它交给调用方，返回的拥有者也需要保留共同接口。

`std::unique_ptr<pressure_source>` 可以拥有不同的具体派生对象。它能否正确清理，取决于基类是否提供了相应的销毁契约。

## 通过基类销毁必须到达实际类型

在基类析构函数声明前使用 `virtual`，将它声明为虚析构函数（Virtual Destructor）。例如，以下成员声明放在 `pressure_source` 的公开部分：

```cpp
virtual ~pressure_source() = default;
```

`= default` 采用默认析构行为；`virtual` 使通过基类指针删除对象时能够从实际派生类开始析构。派生类的析构函数也因此是虚函数，不需要重复写 `virtual`；写 `override` 可以检查这项覆盖关系。

本篇沿用普通动态对象的分配与删除方式，使用 `std::unique_ptr` 的默认删除器（Default Deleter）。对于非空的 `std::unique_ptr<pressure_source>`，销毁目标时，删除器对保存的 `pressure_source*` 执行单对象删除。若这个指针实际指向派生对象的基类部分，基类需要具有虚析构函数。

这项要求与 `read` 是否为虚函数无关。一个类拥有虚成员，并不自动使它的析构函数也成为虚函数。

> [!WARNING]
> 在这种普通单对象删除中，通过基类指针删除实际派生对象时，若基类析构函数不是虚函数，行为未定义。后果不能描述成“只是少执行一次派生析构”，也不能依靠程序能够编译来证明安全。

## 拥有者转换转交责任，不复制目标

`std::make_unique<calibrated_source>(...)` 创建具体对象，返回 `std::unique_ptr<calibrated_source>`。在公开且可明确定位的基类关系下，默认删除器的 `std::unique_ptr<calibrated_source>` 可以通过转换移动构造建立 `std::unique_ptr<pressure_source>`。

这个转换把拥有责任交给新的拥有者，保存用于基类访问的指针；原来的具体对象仍然存在，没有复制成 `pressure_source`。

下面是完整程序。`make_source` 根据布尔实参选择实现，返回统一的拥有者类型。派生析构中的输出只用于显示销毁路径。

```cpp
#include <iostream>
#include <memory>

class pressure_source {
  public:
    virtual ~pressure_source() = default;

    virtual int read() const = 0;
};

class fixed_source : public pressure_source {
  public:
    explicit fixed_source(int value) : stored{value} {}

    int read() const override {
        return stored;
    }

  private:
    int stored;
};

class calibrated_source : public pressure_source {
  public:
    calibrated_source(int value, int adjustment) : stored{value}, offset{adjustment} {}

    ~calibrated_source() override {
        std::cout << "calibrated source destroyed\n";
    }

    int read() const override {
        return stored + offset;
    }

  private:
    int stored;
    int offset;
};

std::unique_ptr<pressure_source> make_source(bool calibrated) {
    if (calibrated) {
        return std::make_unique<calibrated_source>(220, 10);
    }

    return std::make_unique<fixed_source>(220);
}

int main() {
    const std::unique_ptr<pressure_source> source{make_source(true)};
    std::cout << source->read() << '\n'; // 230
}
```

`main` 结束时，`source` 负责清理它拥有的对象。尽管拥有者的类型是 `std::unique_ptr<pressure_source>`，销毁仍会进入 `calibrated_source` 的析构函数，输出 `calibrated source destroyed`，再完成基类部分的销毁和存储释放。

若改成 `make_source(false)`，读数为 `220`，拥有者管理的是 `fixed_source`。调用方的类型和读取表达式都不需要跟着改变。

`make_source` 的类型选择发生在普通函数的分支中。构造函数本身不能是虚函数：创建时已经选择了具体类型，随后才把对象交给共同的拥有接口。

## 按对象组成的反序完成销毁

对于示例中单层继承的校准对象，销毁依次包括：

1. 执行 `calibrated_source` 的析构函数体；
2. 销毁 `calibrated_source` 的成员；
3. 执行 `pressure_source` 的析构函数体；
4. 销毁 `pressure_source` 的成员。

基类默认析构即使没有需要执行的自定义语句，仍然参与这个过程。这与[析构函数体先于成员销毁](../16-class-object-destruction-and-resource-lifetime/02-implicit-destructors-and-reverse-member-destruction.md#析构函数体先于成员销毁)相接，并把基类子对象纳入同一条销毁链。

若派生类拥有 `std::vector`、`std::string` 或其他管理资源的成员，到达派生析构路径后，这些成员会按自己的语义自动清理。通常不需要为了释放这些成员再手写清理代码。

> [!IMPORTANT]
> 基类指针提供共同的访问入口，虚析构提供通向实际对象的销毁入口，`unique_ptr` 承担调用这个入口并释放资源的拥有责任。这三项关系各有职责，不能互相代替。

## 借用接口和拥有接口仍然分开

如果函数只读取目标，形参可以继续使用 `const pressure_source&`；它不需要知道目标由局部变量还是 `unique_ptr` 维持。以下函数定义放在上面的类定义之后、`main` 之前：

```cpp
int read_pressure(const pressure_source& source) {
    return source.read();
}
```

在上面 `main` 中，`source` 仍然非空且目标仍然存在时，可以写：

```cpp
std::cout << read_pressure(*source) << '\n'; // 230
```

解引用得到目标的基类访问入口，没有把拥有关系转交给 `read_pressure`。函数退出也不会销毁目标。

只有接口确实要接管、返回或修改拥有关系时，才需要把拥有者本身作为参数或结果。这仍然遵循[函数边界的所有权规则](../19-dynamic-objects-and-exclusive-ownership/04-ownership-at-function-boundaries.md#只使用目标时借用目标本身)。

> [!PRACTICE]
> 需要返回一个在运行时选择的具体实现，并让调用方独占管理其生命周期时，可以返回 `std::unique_ptr<pressure_source>`，同时在公开基类接口中提供虚析构。普通读取函数借用 `pressure_source` 本身，避免让不涉及所有权的调用也依赖拥有者类型。

继承本身不要求每个基类都具有虚析构。若对象始终按具体类型持有和销毁，基类仅作借用入口，就没有执行本篇的基类删除操作。设计重点是明确销毁是否被允许通过基类发生；公开的多态拥有接口应当提供可用的虚析构契约。

## 参考资料

- [C++23 工作草案：删除表达式与通过基类删除](https://timsong-cpp.github.io/cppwp/n4950/expr.delete)
- [C++23 工作草案：独占拥有者的转换移动构造](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.ctor)
- [C++23 工作草案：默认删除器](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.dltr.dflt)
- [C++23 工作草案：析构函数与子对象销毁](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
