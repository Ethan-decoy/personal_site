---
title: 别名模板与类型属性（Alias Templates and Type Traits）
date: 2026-10-08
order: 1
---

# 别名模板与类型属性（Alias Templates and Type Traits）

泛型接口常重复出现“某种类型的序列”或“去掉引用后的类型”。这两类需求分别是给类型表达式命名，以及查询、变换类型，不能把它们都误认为运行时转换。

## 别名模板命名一族类型

别名模板（Alias Template）用模板参数形成类型别名。它不产生新的独立类型，也不额外建立对象层。

`<type_traits>` 中的类型特征（Type Trait）用于查询或变换类型：`std::is_same_v<A, B>` 是两类型是否相同的常量；`std::remove_cvref_t<T>` 是去掉引用及顶层 const、volatile 后的类型。

```cpp
#include <type_traits>
#include <vector>

template <typename T> using reading_list = std::vector<T>;

template <typename T> using stored_type = std::remove_cvref_t<T>;

int main() {
    static_assert(std::is_same_v<reading_list<int>, std::vector<int>>);
    static_assert(std::is_same_v<stored_type<const int&>, int>);
}
```

这里没有创建容器或转换一个整数对象。`stored_type<const int&>` 只计算一个类型结果，实际保存值仍须执行相应初始化。

## 名称不能替代所有权契约

别名叫作 `reading_list` 不会限制它只保存压力，也不改变 vector 的再分配规则。需要建立独立单位或受控不变式时，应设计具名类型，而不是期待 using 拒绝底层类型的混用。

`remove_cvref` 只去掉外层限定。对 `const int*`，它不会变成 `int*`，因为 const 属于所指目标，不是指针对象的顶层限定。

别名模板不能像类模板那样单独进行部分特化。确需按类型结构选择表示时，可在一个类模板特征中组织选择，再由别名读取结果。

> [!TIP]
> 区分“为现有类型换一个名字”“产生新的类型身份”和“计算类型表达式”。只有后两项中的真实接口或构造过程，才可能改变对象能做什么。

## 参考资料

- [C++23 工作草案：别名模板](https://timsong-cpp.github.io/cppwp/n4950/temp.alias)
- [C++23 工作草案：类型特征](https://timsong-cpp.github.io/cppwp/n4950/meta)
