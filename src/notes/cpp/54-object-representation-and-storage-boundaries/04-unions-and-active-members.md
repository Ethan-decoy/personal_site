---
title: 联合体与活跃成员（Unions and Active Members）
date: 2026-10-08
order: 4
---

# 联合体与活跃成员（Unions and Active Members）

variant 维护当前备选类型和构造销毁。原生联合体（Union）只提供共享存储关系，调用方还要负责当前活跃成员（Active Member）的含义。

## 不同成员使用重叠存储

```cpp
#include <iostream>

union reading_storage {
    int integer;
    double detailed;
};

int main() {
    reading_storage value{220};
    std::cout << value.integer << '\n'; // 220
    value.detailed = 230.5;
    std::cout << value.detailed << '\n'; // 230.5
}
```

初始化选择第一成员；随后对这里简单成员的赋值按联合体规则开始 detailed 的生命周期，integer 不再是当前可按该模型读取的值。

不能再读取 integer 来“看 double 的位”。少数共同初始序列等精细许可有严格条件，不为本例这种跨类型数值解释提供保证。

## 非平凡成员增加管理责任

包含 string 等成员时，默认构造或销毁等操作可能被删除；切换需要明确构造和销毁，还须维护标记、异常状态及复制移动规则。

> [!PRACTICE]
> 应用中的多种可能值通常使用 variant，把活跃项与生命周期作为整体维护。只有底层表示或接口条件确实要求原生联合体时，再显式建立全部状态责任。

## 参考资料

- [C++23 工作草案：联合体与成员生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.union)
