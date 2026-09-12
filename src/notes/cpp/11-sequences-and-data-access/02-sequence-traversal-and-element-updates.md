---
title: 序列遍历与元素修改（Sequence Traversal and Element Updates）
date: 2026-09-11
order: 2
---

# 序列遍历与元素修改（Sequence Traversal and Element Updates）

计算全部压力采样值的总和，或者对每个值应用同一项校准，都需要依次访问序列中的元素。遍历（traversal）关心的是每个元素应当执行什么操作；当下标本身没有额外含义时，可以直接让循环面向元素。

## 每轮取得一个元素

范围 for 语句（range-based for statement）使用 `for (声明 : 序列)` 的形式。冒号右侧给出要遍历的序列，左侧声明本轮使用的变量。对 `std::vector<double>` 而言，每轮按照下标递增的顺序取得一个元素，并用它初始化本轮变量。

```cpp
#include <iostream>
#include <vector>

int main() {
    std::vector<double> samples{240.0, 245.0, 250.0};
    double total_pressure_kpa{0.0};

    for (const double value : samples) {
        total_pressure_kpa += value;
    }

    std::cout << total_pressure_kpa << '\n';

    for (double& value : samples) {
        value += 5.0;
    }

    std::cout << samples[0] << '\n';
}
```

第一次循环依次用三个元素初始化 `value`，总和为 `735.0`。`const double value` 在每轮中都是一个新的局部对象，本轮结束后生命周期结束；`const` 表示循环体只读取这个局部值。

第二次循环的 `double& value` 则在每轮绑定到当前元素。`value += 5.0` 修改这个元素本身，因此序列最终保存 `245.0`、`250.0` 和 `255.0`，第二行输出 `245`。

这两种声明沿用普通变量与引用的语义。范围 for 负责依次提供元素，不会抹平“创建局部值”和“绑定原元素”的区别。

## 局部值的修改不会写回序列

下面是放在函数体内的独立片段：

```cpp
const std::vector<double> samples{240.0, 245.0, 250.0};

for (double value : samples) {
    value += 5.0;
    std::cout << value << '\n';
}
```

循环输出 `245`、`250`、`255`，但 `samples` 的三个元素仍然保存 `240.0`、`245.0` 和 `250.0`。`double value` 建立的是本轮局部对象，修改它没有向元素赋值；去掉 `const` 只允许修改这个局部对象，不会自动让它变成引用。

> 判断循环是否修改原元素，先看本轮变量的声明，再看循环体。`double value` 保存从元素读取的独立值；`double& value` 绑定元素，能通过它修改原数据。对于这里只需读取的 `double`，直接取得小值已经足够，不必为了“避免复制”而统一改成引用。

对具名容器 `samples` 使用这里的范围 for，不会先复制整个容器。按值声明本轮变量，只复制每次访问的那个 `double`。复制整份序列和读取单个小值的工作不能混为一谈。

## 遍历期间保留有效的元素范围

空序列不会执行循环体。非空序列正常执行时，每轮都会建立本轮变量；`break` 结束整个循环，`continue` 结束本轮并转入下一个元素，它们仍遵循普通循环中的控制转移规则。

遍历要求容器、本轮元素的访问关系以及循环使用的结束位置持续有效。本篇只修改已有 `double` 的值，不改变元素数量或存储位置，因此能够维持这些条件。增加或删除元素会改变遍历范围；即使数量不变，更换元素存储也可能让原有的访问关系失效。

> 范围 for 会在进入循环时取得遍历所需的结束位置。不要在这里展示的同一个范围 for 中向被遍历的 `vector` 追加元素：即使追加没有更换元素存储，原来的结束位置也已经失效。需要改变数量时，应当重新设计遍历与修改的先后关系，不能把“当前元素的引用还有效”当作整条循环仍有效的依据。

这项边界不要求遍历前复制数据。应当先判断是否真的需要独立副本；仅仅读取或更新既有元素，可以直接使用原序列。

## 参考资料

- [C++23 工作草案：范围 for 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.ranged)
- [C++23 工作草案：vector 插入操作与失效条件](https://timsong-cpp.github.io/cppwp/n4950/vector.modifiers#2)
- [C++ Core Guidelines：能直接遍历元素时使用范围 for](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es71-prefer-a-range-for-statement-to-a-for-statement-when-there-is-a-choice)
