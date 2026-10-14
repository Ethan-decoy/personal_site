---
title: 经检查的类型转换（Checked Type Conversion）
date: 2026-10-08
order: 1
---

# 经检查的类型转换（Checked Type Conversion）

共同接口负责共同操作。有时一个可选能力只属于某种实现，例如只有可校准的压力来源提供修正量。此时需要回答的是“这个对象是否真的具有该能力”，而不是把基类指针强行改写成希望得到的类型。

## dynamic_cast 检查对象关系

运行时类型信息（Run-Time Type Information，RTTI）支持根据实际对象判断类型。`dynamic_cast<T>(expression)` 是进行经检查转换的语言运算符。

这里先限定为：通过**具有虚函数的基类**，访问正常使用期中仍然存活的对象；目标是完整定义的派生类。具有虚函数的类称为多态类（Polymorphic Class），虚析构函数也满足这个条件。

`dynamic_cast<const calibrated_source*>(pointer)` 尝试取得该对象的 `calibrated_source` 部分。关系成立时返回指针；检查失败时返回 `nullptr`。这次转换不会复制对象，也不接管其生命周期。

```cpp
#include <iostream>

class pressure_source {
  public:
    virtual ~pressure_source() = default;
    virtual int read() const = 0;
};

class fixed_source : public pressure_source {
  public:
    int read() const override {
        return 220;
    }
};

class calibrated_source : public pressure_source {
  public:
    int read() const override {
        return 230;
    }

    int adjustment() const {
        return 10;
    }
};

void show_adjustment(const pressure_source& source) {
    const auto* calibrated = dynamic_cast<const calibrated_source*>(&source);
    if (calibrated != nullptr) {
        std::cout << calibrated->adjustment() << '\n';
    } else {
        std::cout << "unavailable\n";
    }
}

int main() {
    const fixed_source fixed;
    const calibrated_source calibrated;
    show_adjustment(fixed);      // unavailable
    show_adjustment(calibrated); // 10
}
```

指针类型中的 `const` 保留只读访问；`dynamic_cast` 不能移除它。空基类指针转成派生类指针仍得到空指针。

> [!IMPORTANT]
> 经检查的指针转换把“对象不具备这种类型关系”表示成空结果。只有结果非空且对象仍然存活时，才能通过它访问派生类成员。

## 引用转换用异常表示检查失败

引用不能像指针一样表示没有目标。`dynamic_cast<const calibrated_source&>(source)` 失败时抛出 `std::bad_cast`；这个异常类型由 `<typeinfo>` 声明。

下面是接在上述类定义之后、替换原 `main` 的程序部分：

```cpp
#include <typeinfo>

int main() {
    const fixed_source fixed;
    try {
        const auto& calibrated = dynamic_cast<const calibrated_source&>(fixed);
        std::cout << calibrated.adjustment() << '\n';
    } catch (const std::bad_cast&) {
        std::cout << "type mismatch\n";
    }
}
```

对于正常允许“没有这种能力”的查询，指针形式通常直接。引用形式适合调用方要求该关系成立，并让失败沿异常路径处理的接口。两种形式建立相同的对象关系，失败表达方式不同。

## 静态转换不替你完成运行时检查

`static_cast` 在允许的基类到派生类转换中，依据代码给出的类型关系执行转换，不检查当前实际对象是否确实包含目标派生对象。对于这里只是一个 `fixed_source` 的对象，把它当作 `calibrated_source` 是错误的对象假设。

> [!WARNING]
> 基类访问入口本身不证明目标派生类型成立。用未经检查的向下转换代替查询，需要额外的、真实成立的对象类型保证；转换语法通过编译并不能提供这项保证。悬空指针也不能交给 RTTI 来验证，它已经失去有效对象前提。

## 查询类型应当服务于真实接口差异

如果每次读取都先判断 `fixed_source` 或 `calibrated_source`，再分别调用相同的 `read`，已有的虚函数接口更准确。经检查转换适合可选扩展能力、与已有多态接口的边界协作，不应惯性地替代共同操作。

构造与析构期间，对“实际类型”的判断还有阶段边界；这与[虚调用的阶段模型](../36-inheritance-and-runtime-polymorphism/06-virtual-calls-during-construction-and-destruction.md#调用范围随当前构造析构阶段变化)属于同一对象生命周期问题。这里的查询都发生在完整构造之后、销毁开始之前。

## 参考资料

- [C++23 工作草案：dynamic_cast](https://timsong-cpp.github.io/cppwp/n4950/expr.dynamic.cast)
- [C++23 工作草案：构造析构期间的对象操作](https://timsong-cpp.github.io/cppwp/n4950/class.cdtor)
