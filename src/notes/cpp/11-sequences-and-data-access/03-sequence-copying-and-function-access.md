---
title: 序列复制与函数访问（Sequence Copying and Function Access）
date: 2026-09-11
order: 3
---

# 序列复制与函数访问（Sequence Copying and Function Access）

同一组压力采样值可以用于不同工作：保留原始记录、建立一份应用校准后的记录，或者只计算总和。它们对对象关系的要求不同。**需要独立修改的数据时建立副本；只需读取现有数据时，访问原对象就已经能够完成工作。**

## 副本保存独立的元素

`std::vector<double>` 提供复制操作。用一个已有序列初始化另一个序列，会建立相同数量、相同初始值的 `double` 元素；两组元素彼此独立，修改副本不会修改源序列。

下面的程序保留原始采样值，并在副本中增加 `5.0` kPa 的校准偏移：

```cpp
#include <iostream>
#include <vector>

double total_pressure_kpa(const std::vector<double>& samples) {
    double total{0.0};

    for (const double value : samples) {
        total += value;
    }

    return total;
}

void add_pressure_offset_kpa(std::vector<double>& samples, double offset_kpa) {
    for (double& value : samples) {
        value += offset_kpa;
    }
}

int main() {
    const std::vector<double> samples{240.0, 245.0, 250.0};
    std::vector<double> adjusted{samples};

    add_pressure_offset_kpa(adjusted, 5.0);

    std::cout << samples[0] << '\n';
    std::cout << adjusted[0] << '\n';
    std::cout << total_pressure_kpa(samples) << '\n';
}
```

`adjusted{samples}` 用已有序列 `samples` 建立副本。程序输出 `240`、`245`、`735`，分别展示原记录保持不变、副本已经修改，以及读取原记录得到的总和。

这里的独立性来自 `std::vector<double>` 的复制契约。它不是“复制任何类对象都会复制所能访问的全部数据”这一普遍规则。例如，复制一个指针，只会复制指针值，不会自动复制被指对象。

## 参数形式表达需要怎样的数据关系

两个函数通过不同引用表达不同访问需求：

| 接口中的参数形式 | 与调用者已有序列的关系 | 当前用途 |
| --- | --- | --- |
| `const std::vector<double>& samples` | 绑定原序列，通过本接口只读访问 | 计算总和 |
| `std::vector<double>& samples` | 绑定原序列，允许修改它 | 修改调用者选定的那份数据 |
| `std::vector<double> samples` | 用已有序列左值传入时，为形参建立独立副本 | 函数确实需要自行修改一份独立数据时 |

`total_pressure_kpa` 没有建立另一份序列。它只需要在调用期间读取原有元素，完成计算后返回一个 `double` 结果。通过指针或引用暂时访问已有对象的用法，可以称为借用（borrowing）；这里的“借用”描述接口关系，不是 C++ 为引用自动提供的生命周期检查机制。

`add_pressure_offset_kpa` 修改调用者传入的序列。是否保留原始数据由调用者决定：本例先建立 `adjusted`，再把它交给修改函数，因此函数无需同时负责决定是否复制。

只读引用也不是整个对象的独占访问权。`const` 限制的是通过该参数进行的操作；它不会阻止其他可修改访问路径改变同一个对象，也不负责延长调用者对象的生命周期。

## 复制成本与处理成本分别判断

复制这个序列需要让副本独立保存每个 `double` 的值，工作随元素数量增加。标准规定这里的容器复制具有线性复杂度（linear complexity），即复制工作量的上界与元素数量成正比。这说明工作规模与元素数量的关系，不承诺某台机器上的具体耗时。

如果计算总和前先复制一份序列，就同时做了“建立独立副本”和“读取元素求和”两项工作。`total_pressure_kpa` 只需读取元素求和，不需要修改或保留一份独立记录，因此只读引用能够省去建立副本的工作。

> [!IMPORTANT]
> 避免复制序列，并不意味着处理序列不再有成本。通过 `const std::vector<double>&` 求和仍需读取所有元素；循环每次取得一个 `double`，也与建立整份序列副本是不同规模的工作。

相反，校准结果需要与原始记录同时保留时，副本的独立性就是需求的一部分。用引用替代这份副本，会让修改作用于原数据，改变程序含义。性能判断必须保留所需的对象关系，才能比较哪些工作可以省去。

> [!PRACTICE]
> 参数传入的是整份序列时，先判断函数是否需要拥有独立数据；只读取现有元素时，用只读引用表达访问即可。对于偏移量和计算结果这样的单个 `double`，按值传递和返回能够直接表达独立数值，不能因为序列复制较贵就推导出“所有值都应改用引用”。

上表关于按值形参复制的结论，限定为用一个已有序列左值初始化它。按值声明描述形参是独立对象，本身不意味着每次调用都一定额外复制一份已有序列。

## 参考资料

- [C++23 工作草案：容器复制契约与复杂度](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts#13)
- [C++23 工作草案：vector 构造与复制接口](https://timsong-cpp.github.io/cppwp/n4950/vector.cons)
- [C++ Core Guidelines：输入参数的按值与只读引用选择](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f16-for-in-parameters-pass-cheaply-copied-types-by-value-and-others-by-reference-to-const)
