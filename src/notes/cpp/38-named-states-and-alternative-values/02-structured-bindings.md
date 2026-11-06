---
title: 结构化绑定与成员访问（Structured Bindings and Member Access）
date: 2026-10-08
order: 2
---

# 结构化绑定与成员访问（Structured Bindings and Member Access）

一个结果对象可能同时返回压力和样本数。为各成员建立局部名称，不必意味着复制各成员，也不必意味着借用原对象。结构化绑定（Structured Binding）把这种访问写成一条声明，但复制关系仍要从声明形式判断。

## 先建立承载对象，再为成员命名

对于下面的简单公开结构体，`auto [pressure, count] = source;` 会先用 `source` 初始化一个隐含的承载对象，再把两个名称绑定到它的成员。

```cpp
#include <iostream>

struct reading {
    int pressure_kpa;
    int sample_count;
};

int main() {
    reading source{220, 3};

    auto [pressure, count] = source;
    pressure = 230;
    std::cout << source.pressure_kpa << ' ' << pressure << '\n'; // 220 230

    auto& [stored, samples] = source;
    stored = 240;
    samples = count + 1;
    std::cout << source.pressure_kpa << ' ' << source.sample_count << '\n'; // 240 4
}
```

第一条声明复制 `source`，`pressure` 修改的是副本成员。第二条声明的承载对象是对 `source` 的引用，`stored` 和 `samples` 因此访问原对象成员。

名称个数须匹配可分解的成员数。这不是按名称匹配成员：这里的顺序来自成员声明顺序。

| 形式 | 本例中的承载关系 |
| --- | --- |
| `auto [a, b] = source;` | 创建独立副本，名称访问副本成员 |
| `auto& [a, b] = source;` | 借用可修改原对象 |
| `const auto& [a, b] = source;` | 借用原对象并限制此次成员访问为只读 |

## 支持的是特定分解模型

语言支持数组、满足元组式协议的类型，以及符合规则的类成员分解。`std::pair` 在 `<utility>` 中表示两个值的组合，标准库为它提供元组式分解，因此可以用于映射条目的键值访问。

下面是完整程序。`std::map` 的条目具有只读键和可修改的值；结构化绑定不会取消键的只读性质。

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> readings{{"front", 220}, {"rear", 230}};
    for (auto& [name, pressure] : readings) {
        pressure += 5;
        std::cout << name << ' ' << pressure << '\n';
    }
}
```

这里输出 `front 225` 和 `rear 235`。把循环声明改为 `auto [name, pressure]`，会逐次复制条目，修改不再写回映射。

## 有名称不代表独立生命周期

引用形式的绑定仍受目标生命周期和容器失效规则约束。绑定到一个条目的成员，不会让它在条目被删除后继续存活。

对临时对象，`const auto& [a, b] = ...;` 可以按相应局部引用绑定规则延长承载临时对象的生命周期；把成员地址交出当前作用域，仍不能延长到调用方使用结束。

> [!TIP]
> 先找隐含承载对象是独立值还是引用，再判断成员本身的类型和有效期。只看到两个新名称，不能推导出发生了两次独立复制。

## 参考资料

- [C++23 工作草案：结构化绑定声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.struct.bind)
- [C++23 工作草案：pair](https://timsong-cpp.github.io/cppwp/n4950/pairs)
