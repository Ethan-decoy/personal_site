---
title: 模板特化与选择范围（Template Specialization and Selection Scope）
date: 2026-10-08
order: 5
---

# 模板特化与选择范围（Template Specialization and Selection Scope）

同一模板的某种类型结构可能需要不同表示。例如一般值、指针和特定整数类型，需要不同的分类文本。特化（Specialization）让这种选择发生在模板实参层面。

## 完整特化指定一项，部分特化指定模式

主模板（Primary Template）给出一般定义。显式完整特化（Explicit Full Specialization）用 `template<>` 指定一组确定实参；部分特化（Partial Specialization）仍保留模板参数，但匹配更具体的实参结构。

```cpp
#include <iostream>
#include <string_view>

template <typename T> struct type_label {
    static constexpr std::string_view text{"value"};
};

template <typename T> struct type_label<T*> {
    static constexpr std::string_view text{"pointer"};
};

template <> struct type_label<int> {
    static constexpr std::string_view text{"integer"};
};

int main() {
    std::cout << type_label<double>::text << '\n'; // value
    std::cout << type_label<int*>::text << '\n';   // pointer
    std::cout << type_label<int>::text << '\n';    // integer
}
```

部分特化中的 `T*` 匹配指针结构；完整特化的 int 指定一项确定类型。选中的类定义负责自己的成员，不是将主模板成员自动拼进新定义。

## 类特化和函数重载分别组织选择

类模板和变量模板可以按规则部分特化；函数模板不能部分特化。函数接口对某类实参需要不同操作时，通常用重载和约束表达可用范围。

函数模板的完整特化也不作为一项普通重载独立竞争：先选择相应主模板等候选，再判断其特化。因此不应凭“这个特化看起来最具体”推演调用选择。

下面的独立完整程序让一项函数完整特化与另一个主模板同时存在。特化声明写在第二个主模板之前，明确属于一般形式 `label(T)`：

```cpp
#include <iostream>
#include <string_view>

template <typename T> std::string_view label(T) {
    return "value";
}

template <> std::string_view label<int*>(int*) {
    return "specialized value";
}

template <typename T> std::string_view label(T*) {
    return "pointer";
}

int main() {
    int value{220};
    std::cout << label(&value) << '\n'; // pointer
}
```

对 int* 实参，两个主模板都能形成精确匹配：一般 `label(T)` 推导出 `T = int*`，指针形式 `label(T*)` 推导出 `T = int`。进一步比较模板时，指针形式更专门，因此选中后者，使用它自己的定义并输出 pointer。

`label<int*>(int*)` 的完整特化属于一般主模板；本次没有选中那个主模板，它也就没有作为第三个独立重载重新竞争。需要直接掌握的是**先确定选中了哪个主模板，再看该模板的相应特化**。扩大重载集或组织跨文件特化时，再查候选比较及声明规则。

特化须在会触发相关隐式实例化的使用前按规则声明，并满足跨翻译单元要求。把特化放在一个调用方看不到的源文件中，不能让其他翻译单元回头重新选择。

> [!PRACTICE]
> 需要改变类型表示或类型属性时考虑类模板特化；只需要改变函数的适用范围时，重载与概念更直接。不要为消除一条诊断向 std 随意添加特化，标准库只在明确允许的扩展点接受用户定义。

## 参考资料

- [C++23 工作草案：部分特化](https://timsong-cpp.github.io/cppwp/n4950/temp.spec.partial)
- [C++23 工作草案：显式特化](https://timsong-cpp.github.io/cppwp/n4950/temp.expl.spec)
- [C++23 工作草案：函数模板重载选择](https://timsong-cpp.github.io/cppwp/n4950/temp.over)
