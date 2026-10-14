---
title: 类型身份与 typeid（Type Identity and typeid）
date: 2026-10-08
order: 2
---

# 类型身份与 typeid（Type Identity and typeid）

经检查转换回答“能否作为某个类型访问”；类型身份判断回答“是否恰好是这个类型”。两者不等价：某个更深层的派生对象也能成功转换成其中的基类，但它的完整对象类型不是那个基类。

## typeid 得到可比较的类型信息

`typeid` 是语言运算符。`typeid(T)` 取得类型 `T` 的信息；`typeid(expression)` 取得表达式所对应的类型信息。使用它要包含 `<typeinfo>`，结果是对长期存在的 `std::type_info` 对象的只读访问。

两个结果用 `==` 判断是否代表同一类型。不要用它们的对象地址代替这种比较。

```cpp
#include <iostream>
#include <typeinfo>

struct pressure_source {
    virtual ~pressure_source() = default;
};

struct calibrated_source : pressure_source {};

int main() {
    const calibrated_source value;
    const pressure_source& source = value;
    const pressure_source* pointer = &value;

    std::cout << (typeid(source) == typeid(calibrated_source)) << '\n';       // 1
    std::cout << (typeid(source) == typeid(pressure_source)) << '\n';         // 0
    std::cout << (typeid(pointer) == typeid(const pressure_source*)) << '\n'; // 1
    std::cout << (typeid(*pointer) == typeid(calibrated_source)) << '\n';     // 1
}
```

`source` 是多态类的左值，`typeid(source)` 反映它所指完整对象的动态类型。`pointer` 本身是指针对象，所以 `typeid(pointer)` 反映指针的静态类型。只有 `*pointer` 才把被指向的类对象交给判断。

## 是否多态决定是否追踪实际对象

对非多态类对象的表达式，`typeid` 使用静态类型，不沿继承关系寻找完整对象。一般非多态操作数不求值；多态类的左值等表达式需要确定实际对象，会求值。

在类型身份比较中，顶层 `const` 和引用限定不会形成另一个被比较类型，例如 `typeid(const int&) == typeid(int)` 成立。这不意味着 `const` 可以从程序接口中移除；这里只说明 RTTI 的比较粒度。

> [!TIP]
> 先判断操作数是指针还是类对象，再判断类对象是否多态。不能把“变量最终指向一个派生对象”直接当作 `typeid` 的统一规则。

## 类型名称不是可移植标识

`typeid(T).name()` 返回实现定义的名称文本。它可能经过编码，也可能随编译器和构建方式变化。它适合辅助诊断，不能直接当作配置文件格式、网络协议类型号或稳定业务标识。

若业务要区分几种固定来源，应设计独立标识和对应约束；若要执行共同操作，应直接使用接口。

## 空目标和失效目标的边界不同

当 `pointer` 是多态类的空指针时，`typeid(*pointer)` 有专门规则：抛出 `std::bad_typeid`。这不是允许任意解引用空指针的通用规则。

悬空指针没有仍存活的目标，不能借此检查“对象是否被删除”。非多态操作数不求值，也不能为其他地方访问无效目标提供保证。

> [!PRACTICE]
> 类型身份适合需要精确类型区别的诊断或分派边界。能够由共同操作、状态类型或经检查的能力转换表达的需求，不必转成类型名称字符串比较。

## 参考资料

- [C++23 工作草案：typeid](https://timsong-cpp.github.io/cppwp/n4950/expr.typeid)
- [C++23 工作草案：type_info](https://timsong-cpp.github.io/cppwp/n4950/type.info)
