---
title: 序列复制与函数访问（Sequence Copying and Function Access）
date: 2026-09-11
order: 3
---

# 序列复制与函数访问（Sequence Copying and Function Access）

一批物品的称重读数需要保留原始记录。已知这批读数都比实际值少了 5 克，还需要生成一份修正版。若直接修改原记录，就无法同时保留两组数据；建立独立副本后，才能让它们分别保存修正前后的数值。

修正读数与计算读数总和也有不同的访问需求：前者要改变选定序列的元素，后者只需读取现有元素。函数接口需要表达它正在处理独立数据，还是访问调用者已有的那份数据。

## 副本保存独立的元素

> [!IMPORTANT] 容器副本具有独立的元素
> **用已有的 `std::vector<double>` 对象创建副本时，副本具有相同数量、相同初始值的 `double` 元素；两组元素彼此独立，修改其中一组不会修改另一组。**两个容器分别管理自己的元素。
>
> 这项独立性来自该类型的复制契约，不能推广为“复制任何对象都会复制它能访问的全部数据”。例如，复制指针只复制指针值，不会自动复制被指对象。

下面的完整程序用 `original_g` 保存原始称重读数，单位为克，用 `adjusted_g` 保存修正版。`add_offset_g` 给传入序列的每个读数增加指定偏移量，`total_weight_g` 返回传入序列的读数总和：

```cpp
#include <iostream>
#include <vector>

double total_weight_g(const std::vector<double>& weights_g) {
    double total_g{0.0};

    for (const double value : weights_g) {
        total_g += value;
    }

    return total_g;
}

void add_offset_g(std::vector<double>& weights_g, const double offset_g) {
    for (double& value : weights_g) {
        value += offset_g;
    }
}

int main() {
    const std::vector<double> original_g{240.0, 250.0, 245.0};
    std::vector<double> adjusted_g{original_g};

    add_offset_g(adjusted_g, 5.0);

    std::cout << original_g[0] << '\n';
    std::cout << adjusted_g[0] << '\n';
    std::cout << total_weight_g(original_g) << '\n';
}
```

`adjusted_g{original_g}` 创建独立副本，起初两份序列都保存 `240.0`、`250.0` 和 `245.0`。修正调用完成后，`adjusted_g` 保存 `245.0`、`255.0` 和 `250.0`，`original_g` 仍保存原来的三个读数。

程序输出三行：`240`、`245`、`735`，依次是原记录的首项、修正版的首项，以及原记录的读数总和。

## 参数形式表达需要怎样的数据关系

两个函数中的 `weights_g` 是各自的形参名，它绑定哪个容器，由本次调用的实参决定：

| 调用 | 函数内的 `weights_g` 绑定什么 | 对元素执行什么操作 |
| --- | --- | --- |
| `add_offset_g(adjusted_g, 5.0)` | `main` 中的 `adjusted_g` | 修改修正版的元素 |
| `total_weight_g(original_g)` | `main` 中的 `original_g` | 读取原记录的元素并求和 |

在修改函数中，引用形参 `weights_g` 访问 `adjusted_g` 这个容器，循环里的 `double& value` 再绑定它的某个元素。`value += offset_g` 因而修改修正版中的元素，不需要在函数结束后另行写回。

在求和函数中，`const std::vector<double>& weights_g` 访问已有的 `original_g`，没有建立另一份容器。循环里的 `const double value` 则是每轮创建的元素值副本。函数通过这些数值累计总和，最后按值返回一个独立的 `double` 结果。

通过指针或引用访问已有对象，而不接管它的生命周期，可以称为借用（borrowing）。这里的两份容器及其元素在调用期间都保持有效；借用不是 C++ 自动提供的生命周期检查机制，仍须保证访问目标有效。

> [!IMPORTANT] 形参形式决定复制还是借用
> **本节用已有 `std::vector<double>` 左值初始化按值形参时，会为形参建立独立的容器副本；引用形参直接绑定已有容器时，不建立这份副本。**引用形参实际绑定哪份容器，由本次调用的实参决定。
>
> `const` 引用限制经该参数修改容器，非 `const` 引用允许修改并要求目标可修改。只读引用不排除其他允许的路径修改同一对象；引用绑定也不延长已有调用者对象的生命周期。

这些形式对应的关系是：

| 容器形参形式 | 与传入的已有序列的关系 |
| --- | --- |
| `const std::vector<double>& weights_g` | 直接绑定实参容器，通过该路径只读访问 |
| `std::vector<double>& weights_g` | 直接绑定可修改的实参容器，允许通过该路径修改 |
| `std::vector<double> weights_g` | 用已有序列左值传入时，建立形参自己的容器副本 |

按值声明描述形参是独立对象。表中关于复制的结论限定为已有序列左值，不能据此推导每次按值调用都一定额外复制已有容器。

## 按值形参修改的是自己的副本

下面是独立对照：用这个定义替换开篇的 `add_offset_g`，头文件、求和函数与 `main` 保持不变。与原定义相比，仅去掉第一个形参的 `&`，函数体不变：

```cpp
void add_offset_g(std::vector<double> weights_g, const double offset_g) {
    for (double& value : weights_g) {
        value += offset_g;
    }
}
```

调用仍是 `add_offset_g(adjusted_g, 5.0)`。这次，已有序列 `adjusted_g` 用来初始化独立的按值形参 `weights_g`，随后循环中的 `double& value` 绑定的是形参副本里的元素。修改确实发生了，但只发生在函数自己的容器中。

调用者的 `adjusted_g` 保持 `240.0`、`250.0` 和 `245.0`，程序输出变为 `240`、`240`、`735`。函数没有返回修正结果，对形参副本的修改也不会自动写回，因此这个版本没有完成修改调用者序列的任务。

> [!WARNING] 循环中的引用不改变容器形参的关系
> 即使循环变量声明为 `double&`，它也只绑定当前遍历的那份容器中的元素。容器形参若已从调用者序列复制而来，循环引用访问的就是副本元素，修改不会因此作用于调用者的序列。判断修改落在哪里，要同时追踪容器形参和元素引用。

## 复制成本与处理成本分别判断

开篇程序通过 `adjusted_g{original_g}` 进行一次完整的容器复制，两次函数调用则都通过引用访问已有容器。复制需要让副本独立保存每个 `double` 的值，工作随元素数量增加。标准规定这里的容器复制具有线性复杂度（linear complexity），即复制工作量的上界与元素数量成正比，不承诺某台机器上的具体耗时。

`total_weight_g` 只需要读取已有元素并求和。若把它也改成按值接收已有序列，就会在求和之外增加一份完整容器副本。只读引用省去的是建立额外副本的工作，求和本身仍需遍历所有元素。

> [!IMPORTANT] 参数访问成本与元素处理成本
> **函数怎样取得数据，与它怎样处理元素，是两部分工作。**通过 `const std::vector<double>&` 绑定已有容器，不需要为形参复制整个容器；求和仍需访问每个元素，处理工作随元素数量增加。
>
> 求和循环每轮复制一个 `double`，属于逐项处理；复制容器则要另外建立一整组独立元素。应区分这些操作，不能把“没有容器副本”理解为“没有元素访问和计算”。

修正版需要与原始记录同时保留，因此开篇的容器复制具有实际用途。调用者先建立 `adjusted_g`，再把它交给修改函数；是否保留原始数据由调用者决定，函数只负责修改选定的那份序列。

> [!WARNING] 引用不能替代需要独立保留的副本
> 在开篇程序中，`original_g` 是 `const` 对象。直接改成 `std::vector<double>& adjusted_g{original_g};` 不合法；改成只读引用虽能绑定，却不能传给要求可写引用的 `add_offset_g`。
>
> 若原记录本来允许修改，再用可写引用代替独立副本，修改就会作用于原记录，无法同时保留修正前后的两组数据。省去复制之前，必须先确认程序是否仍满足所需的对象关系。

> [!PRACTICE] 按访问需求选择接口
> 对这里的 `std::vector<double>`，只读取已有元素时，可以用只读引用避免不需要的容器复制；需要修改调用者选定的序列时，用可写引用。确实需要独立数据时，再按需求由调用者显式复制，或让按值形参取得自己的对象。
>
> 偏移量和求和结果只是单个 `double`，按值传递和返回能直接表达独立数值。两者与复制整份序列的工作不同，不能因为容器复制较贵，就把所有数值都改用引用。

## 参考资料

- [C++23 工作草案：容器复制契约与复杂度](https://timsong-cpp.github.io/cppwp/n4950/container.reqmts#13)
- [C++23 工作草案：vector 概览与复制接口](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：引用初始化与访问约束](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++ Core Guidelines：输入参数的按值与只读引用选择](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f16-for-in-parameters-pass-cheaply-copied-types-by-value-and-others-by-reference-to-const)
