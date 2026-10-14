---
title: 转发构造与特殊成员边界（Forwarding Construction and Special-Member Boundaries）
date: 2026-10-08
order: 9
---

# 转发构造与特殊成员边界（Forwarding Construction and Special-Member Boundaries）

包装类型要把若干实参原样交给成员构造，但包装对象自己的复制与移动仍须维持独立接口。过于宽泛的转发构造可能参与不希望出现的选择。

## 标签区分内部构造与包装复制

`std::in_place` 是 `<utility>` 中的构造标签，类型为 `std::in_place_t`。这里用它明确表示“用这些实参构造所保存的 T”，不把这项通用入口伪装成包装对象的普通复制。

`std::constructible_from<T, Args...>` 在 `<concepts>` 中检查相应构造关系，包括所需销毁条件，不保证业务参数有效。

```cpp
#include <concepts>
#include <iostream>
#include <string>
#include <utility>

template <typename T> class value_box {
  public:
    value_box(const value_box&) = default;
    value_box(value_box&&) = default;
    value_box& operator=(const value_box&) = default;
    value_box& operator=(value_box&&) = default;

    template <typename... Args>
        requires std::constructible_from<T, Args...>
    explicit value_box(std::in_place_t, Args&&... args) : stored(std::forward<Args>(args)...) {}

    const T& read() const {
        return stored;
    }

  private:
    T stored;
};

int main() {
    const value_box<std::string> source{std::in_place, 3, 'x'};
    const auto copied = source;
    std::cout << source.read() << ' ' << copied.read() << '\n'; // xxx xxx
}
```

string 的数量与字符构造形成 xxx。成员初始化使用圆括号，保持这项直接构造关系；换成花括号可能因 initializer_list 改变重载选择，与 constructible_from 所检查的关系不再一致。

## 通用单实参入口需要排除自身关系

不用标签而直接提供 `template<class Value> value_box(Value&&)` 时，非 const 左值包装对象可能使它成为比 const 引用复制构造更好的候选。函数体不能合法构造成员，也不自动让重载选择回退。

应在声明约束中明确排除自身类型，并检查成员实际构造关系；或者像本例这样用不同入口结构消除混淆。标签不是强制风格，目的是保持调用意图和特殊成员边界可推演。

> [!PRACTICE]
> 转发接口先确定要保留哪种初始化形式，再约束那项实际表达式。构造语法、约束检查和复制移动选择要一致，不能仅因为使用 forward 就宣称接口正确。

## 参考资料

- [C++23 工作草案：构造可用性概念](https://timsong-cpp.github.io/cppwp/n4950/concept.constructible)
- [C++23 工作草案：重载决议](https://timsong-cpp.github.io/cppwp/n4950/over.match)
