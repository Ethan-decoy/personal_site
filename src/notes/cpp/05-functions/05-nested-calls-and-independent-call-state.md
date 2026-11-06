---
title: 嵌套调用与独立调用状态（Nested Calls and Independent Call State）
date: 2026-08-27
---

# 嵌套调用与独立调用状态（Nested Calls and Independent Call State）

商品金额为 `100` 元，基本运费为 `5` 元，附加费为 `10` 元。计算应付金额时，可以先调用运费函数取得 `15` 元，再把它加到商品金额中，得到 `115` 元。

函数体中继续调用函数，就形成嵌套调用：外层调用尚未完成，执行过程已经进入内层调用。下面的费用示例沿用按整数元记录的非负小整数，形参均按值传递；各个完整程序独立运行。

## 调用可以发生在另一次调用中

运费函数仍把起始费用与附加费相加；应付金额函数先用局部对象 `total` 保存商品金额，再调用运费函数。下面是完整程序：

```cpp
#include <iostream>

int calculate_shipping_fee(int fee, int surcharge) {
    fee += surcharge;
    return fee;
}

int calculate_payable_total(int goods_total, int base_fee, int surcharge) {
    int total{goods_total};
    int shipping_fee{calculate_shipping_fee(base_fee, surcharge)};

    total += shipping_fee;
    return total;
}

int main() {
    int payable_total{calculate_payable_total(100, 5, 10)};
    std::cout << payable_total << '\n'; // 115
    return 0;
}
```

沿着这次应付金额计算，执行关系是：

1. `main` 调用 `calculate_payable_total`，三个形参分别由 `100`、`5` 和 `10` 初始化；
2. 应付金额函数把局部对象 `total` 初始化为 `100`；
3. 为了初始化 `shipping_fee`，外层调用进入 `calculate_shipping_fee`，内层新建的形参 `fee` 与 `surcharge` 分别保存 `5` 和 `10`；
4. 内层执行 `fee += surcharge;`，把自己的 `fee` 改为 `15`，再通过 `return fee;` 提供整数结果；
5. 回到外层，用这个结果完成 `shipping_fee` 的初始化，随后执行 `total += shipping_fee;`，得到 `115`；
6. 外层返回 `115`，`main` 中的初始化完成，下一条语句输出 `115`。

内层计算运费时，外层尚未执行加上运费的语句。它正在等待初始化表达式中的调用完成，`main` 也还在等待整次应付金额计算。

> [!IMPORTANT] 内层正常返回后，外层继续执行
> **普通嵌套调用中，内层调用正常返回后，控制回到外层对应的调用位置，按该表达式和语句的规则继续执行。**内层的 `return` 只结束当前这次调用，不会直接结束尚未完成的外层调用；外层接着执行其他语句还是随即返回，由外层代码决定。

## 独立的是调用状态

跟踪一次尚未完成的调用，需要保留本次的形参、已经完成初始化且仍然存活的普通局部对象，以及等待继续执行的位置。这些信息构成这里所说的调用状态（call state）。

观察开篇程序中，内层刚执行完 `fee += surcharge;`、尚未执行 `return fee;` 的时刻：

| 所属调用 | 名称 | 当时的值或状态 |
| --- | --- | --- |
| 外层 `calculate_payable_total` | 形参 `base_fee` | 仍为 `5` |
| 外层 `calculate_payable_total` | 局部对象 `total` | 已初始化，仍保存 `100` |
| 外层 `calculate_payable_total` | `shipping_fee` 的声明 | 初始化尚未完成，等待内层结果 |
| 内层 `calculate_shipping_fee` | 形参 `fee` | 从 `5` 改为 `15` |
| 内层 `calculate_shipping_fee` | 形参 `surcharge` | 保存 `10` |

内层的 `fee` 由外层 `base_fee` 的值初始化，两者是不同对象。修改 `fee` 没有改写 `base_fee`，也没有影响已经初始化的外层局部对象 `total`。内层返回后，外层才把 `shipping_fee` 初始化为 `15`，再更新自己的 `total`。

> [!IMPORTANT] 每次调用拥有自己的自动对象
> **本节算术类型的按值形参由每次调用分别建立；函数体内的普通自动存储期局部对象，也在各次执行到其定义时分别建立。**即使多次调用执行同一个函数定义，这些形参和局部对象仍分别属于各次调用。外层仍然存活的这类对象，不会因为进入内层调用而自动结束生命周期。

对象仍然存活，也不表示其名称能在内层函数中被找到。内层的函数体不能因为调用来自外层，就直接通过名称 `total` 使用外层局部对象；名称查找仍由源码中的作用域决定。对象的生命周期与名称的可见范围是两项不同的关系。

## 函数可以调用自身

计算从 `1` 累加到 `3` 的和，可以先求从 `1` 累加到 `2` 的和，再加上 `3`。同一项求和工作处理更小的上限，就可以在函数体中再次调用自己；这种自调用称为递归（recursion）。

用 `sum_up_to` 表示这项计算，`upper` 是累加的上限。上限为 `0` 时，没有要相加的正整数，结果取 `0`。以下把输入范围约定为 `0` 到 `10`，结果至多为 `55`，可以由 `int` 表示。下面是完整程序：

```cpp
#include <iostream>

int sum_up_to(int upper) {
    if (upper <= 0) {
        return 0;
    }

    int subtotal{sum_up_to(upper - 1)};
    return upper + subtotal;
}

int main() {
    int total{sum_up_to(3)};
    std::cout << total << '\n'; // 6
    return 0;
}
```

函数定义本身已经在函数体之前声明了函数名，因此函数体中的 `sum_up_to(upper - 1)` 不需要额外的前向声明。这仍然是普通函数调用；`main` 不能被递归调用。

执行 `sum_up_to(3)` 后，正数分支先取得较小上限的求和结果，才能完成 `subtotal` 的初始化。各层调用的等待关系是：

```text
sum_up_to(3)：保留 upper = 3，等待 sum_up_to(2)
    sum_up_to(2)：保留 upper = 2，等待 sum_up_to(1)
        sum_up_to(1)：保留 upper = 1，等待 sum_up_to(0)
            sum_up_to(0)：直接返回 0
```

这里有四次尚未结束的调用，它们执行同一个函数定义，却各自拥有一个 `upper` 形参对象。传入 `upper - 1` 是给内层的新形参提供较小的值，不会把外层保存的 `3` 改成 `2`。

最内层执行 `return 0;` 后，只结束 `upper` 为 `0` 的那次调用。其外层收到 `0`，继续完成自己的声明与加法；结果再逐层交回：

| 正在完成的调用 | 本层的 `subtotal` | 本层接下来提供的结果 |
| --- | --- | --- |
| `sum_up_to(0)` | 没有执行到这个局部对象的定义 | `return 0;`，结果为 `0` |
| `sum_up_to(1)` | 由内层返回的 `0` 初始化 | `1 + 0`，结果为 `1` |
| `sum_up_to(2)` | 由内层返回的 `1` 初始化 | `2 + 1`，结果为 `3` |
| `sum_up_to(3)` | 由内层返回的 `3` 初始化 | `3 + 3`，结果为 `6` |

各层的 `subtotal` 也是不同对象，并不是同一个对象依次保存 `0`、`1` 和 `3`。每层建立自己的整数结果后，离开函数体，本层在函数体内已建立的普通自动局部对象结束生命周期；外层使用返回的整数值继续计算。最终 `main` 收到 `6` 并输出它。

## 递归必须能够停止继续调用

求和函数中的 `upper <= 0` 是终止条件，对应的分支直接返回，不再发起新的递归调用。在约定的非负输入范围内，每次递归传入 `upper - 1`，上限最终到达 `0`，各层才有机会逐层完成。

> [!IMPORTANT] 终止分支与递归推进必须配合
> **用递归完成有限计算时，需要有不再发起递归调用、能够直接完成的终止分支，并使允许的输入沿实际递归路径在有限步内到达它。**只写出条件还不够，递归实参或相关状态的变化必须让终止分支实际可达。

下面两个错误定义都写在其他函数体之外，只用于语法检查与路径分析，不运行。

第一个定义没有任何能够直接返回的分支：

```cpp
int repeat_without_progress(int upper) {
    return repeat_without_progress(upper);
}
```

第二个定义保留了终止分支，却没有让递归实参变小：

```cpp
int sum_without_progress(int upper) {
    if (upper <= 0) {
        return 0;
    }

    int subtotal{sum_without_progress(upper)}; // 错误：把原值继续传给内层
    return upper + subtotal;
}
```

用 `3` 调用第二个函数时，每层新建的 `upper` 都是 `3`，条件始终为假；拥有终止分支，并没有使这条执行路径能够到达它。用 `0` 调用则会直接返回 `0`。失败取决于实际走到的路径，不能把所有调用混为一谈。

> [!WARNING] 无进展的递归没有可靠的运行结果
> 上面两个定义在语法上可以成立，但调用第一个函数，或以正数调用第二个函数，都没有终止路径，也没有输入输出等标准认可的进展操作。在 C++23 中，这些路径会产生未定义行为，不能依赖它们一直增加调用层数、必然栈溢出或以某种固定方式失败。这个边界与[缺少前向进展的循环](../04-control-flow/03-condition-controlled-loops.md#终止条件与状态变化)相同。

即使递归能够终止，扩大输入范围时，仍需重新核对中间结果和最终结果能否由 `int` 表示，以及调用层数是否超过实现可用资源。语言没有规定可移植的最大递归层数，也没有规定资源耗尽时统一产生某个可捕获异常；数学上最终能算完，不足以保证当前程序能够正常完成。

调用层次、各次调用的独立对象与正常返回的次序，是这里用于理解程序的 C++ 语义关系，不要求每次调用都在机器中占据一块固定布局的栈帧。常见实现怎样承载这些状态，见附章[调用栈与栈帧](deep-dives/01-call-stack-and-stack-frames.md#栈帧承载一次活动调用的实现状态)。

## 参考资料

- [C++23 工作草案：程序执行](https://timsong-cpp.github.io/cppwp/n4950/intro.execution)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：自动存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc.auto)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：前向进展](https://timsong-cpp.github.io/cppwp/n4950/intro.progress)
