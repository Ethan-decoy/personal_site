---
title: 推导指引与保存类型（Deduction Guides and Stored Types）
date: 2026-10-08
order: 7
---

# 推导指引与保存类型（Deduction Guides and Stored Types）

构造时传入字符指针，未必意味着对象应该保存字符指针。类模板实参推导（CTAD）需要与对象希望拥有的表示保持一致。

## 推导指引选择类型，不执行构造

推导指引（Deduction Guide）使用 `模板名(形参) -> 目标实例` 的形式，参与类模板实参推导。它没有函数体，不是一项运行时转换函数。

```cpp
#include <iostream>
#include <string>
#include <type_traits>
#include <utility>

template <typename T> class value_box {
  public:
    explicit value_box(T value) : stored{std::move(value)} {}

    const T& read() const {
        return stored;
    }

  private:
    T stored;
};

value_box(const char*) -> value_box<std::string>;
value_box(char*) -> value_box<std::string>;

int main() {
    char text[]{"ready"};
    const value_box value{text};
    static_assert(std::is_same_v<decltype(value), const value_box<std::string>>);
    text[0] = 'x';
    std::cout << value.read() << '\n'; // ready
}
```

指引让这个调用推导出 `value_box<std::string>`。接下来才对该实例执行构造选择；字符数据转换为 string，成员保存拥有型文本。修改原数组不影响保存值。

缺少对应指引时，由按值构造形参形成的普通推导可能保存退化后的字符指针，复制的只是地址。

## 推导与合法构造必须分别成立

指引可以选出一个类型，但所选实例必须真的能够由原实参构造。指引不替类型增加不存在的构造函数，也不修改显式指定 `value_box<const char*>` 的结果。

转发构造函数还须避免无意地成为复制或移动的更优候选。使用这种通用入口时，约束应排除自身类型及不支持的构造关系；仅因为参数写成 `T&&`，不能认为它保留了原类型的特殊成员契约。

> [!PRACTICE]
> 推导应帮助读者从实参判断保存类型。若它改变拥有关系、单位或编码，正文和接口应明确说明；不要把重要的资源决定藏在难以发现的推导规则里。

## 参考资料

- [C++23 工作草案：类模板推导候选](https://timsong-cpp.github.io/cppwp/n4950/over.match.class.deduct)
- [C++23 工作草案：推导指引](https://timsong-cpp.github.io/cppwp/n4950/temp.deduct.guide)
