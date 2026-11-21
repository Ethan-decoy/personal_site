---
title: 失败后的对象状态与异常安全（Object State After Failure and Exception Safety）
date: 2026-09-12
order: 4
---

# 失败后的对象状态与异常安全（Object State After Failure and Exception Safety）

逐项给压力采样值增加校准偏移时，前几项可能已经写回，计算后面的校准结果时才发现越界。捕获异常后，调用者需要判断记录是否保持原样、当前序列是否仍然有效，以及能否直接重试。

**异常安全（exception safety）关注异常能否越过操作边界，以及异常退出时资源与程序状态仍满足哪些保证。** 析构会执行已经安排好的资源清理。撤销此前的赋值也需要操作专门安排，见[异常展开后的数据状态](02-stack-unwinding-and-scope-cleanup.md#资源清理不等于撤销全部修改)。

## 有效状态不一定是原来的状态

下面的校准操作要求每个采样值都在 `[0.0, 500.0]` kPa 内，偏移量在 `[-10.0, 10.0]` kPa 内。这些调用前提保证加法结果处在浮点类型的有限范围内。每个校准结果还要通过 `[0.0, 500.0]` kPa 的范围检查。

`calibration_error` 的 `value_kpa` 保存越界的校准值。函数先检查新值，通过检查后再写回当前元素。

```cpp
#include <iostream>
#include <vector>

struct calibration_error {
    double value_kpa;
};

void add_pressure_offset_kpa(std::vector<double>& samples, const double offset_kpa) {
    for (double& value : samples) {
        const double adjusted{value + offset_kpa};

        if (adjusted < 0.0 || adjusted > 500.0) {
            throw calibration_error{adjusted};
        }

        value = adjusted;
    }
}

int main() {
    std::vector<double> samples{240.0, 498.0, 250.0};

    try {
        add_pressure_offset_kpa(samples, 5.0);
    } catch (const calibration_error& error) {
        std::cout << error.value_kpa << '\n';
    }

    for (const double value : samples) {
        std::cout << value << '\n';
    }
}
```

程序先输出被拒绝的校准值，再逐行输出异常退出后的采样值。

```text
503
245
498
250
```

第一项已经增加偏移，第二项的新值 `503.0` 未通过检查，所以第二项仍是 `498.0`。第三项尚未处理。直接以相同偏移量重试时，第一项会再次增加到 `250.0`，并且仍会在同一个越界值处停止。

原地操作保留了序列的资源，也维持了本例的不变式，即元素数目不变，每个压力值仍在允许的范围内。若业务还要求一条记录中的所有采样值处于同一校准阶段，部分校准后的记录便违反了这项要求。

> [!WARNING]
> 捕获异常后，已经写入的修改可能仍然生效。如果操作允许部分生效，从头重试可能会再次应用已经完成的修改。使用失败后的对象时，要依据操作的状态承诺判断它仍满足哪些条件。

## 把可能失败的准备留在独立对象中

如果调用者要求校准全部成功后才替换记录，可以复制出一个候选序列，在候选上完成校准。最后把准备好的结果应用于目标，这一步称为提交（commit）。

> [!IMPORTANT] 准备与提交如何保留原状态
> **准备阶段只修改独立的候选对象，保留约定要保护的原状态。提交成功时，目标取得完整的准备结果。** 如果提交也可能抛出，异常退出时同样要保留这部分原状态。

本例用 `std::vector<double>` 的移动赋值提交结果。它使用默认分配器 `std::allocator<double>`，可以在移动赋值时把源的分配器传给目标，因此这项赋值满足不抛出条件。对两个不同的容器，移动赋值正常返回时，目标包含源在赋值前的序列。

在原程序中加上 `#include <utility>`，并在 `main` 前定义 `replace_with_adjusted_pressures_kpa`。

```cpp
void replace_with_adjusted_pressures_kpa(std::vector<double>& samples, const double offset_kpa) {
    std::vector<double> candidate{samples};
    add_pressure_offset_kpa(candidate, offset_kpa);
    samples = std::move(candidate);
}
```

从相同的初始数据开始，将 `main` 中的校准调用替换为 `replace_with_adjusted_pressures_kpa(samples, 5.0);`。越界值仍是 `503.0`，处理者结束后读到的三项采样值都与初始值相同。

```text
503
240
498
250
```

把替换式校准示例中第二项初始值改为 `495.0`，其余条件保持一致。三项校准结果都在允许区间内，提交完成，程序逐行输出新的序列。

```text
245
500
255
```

| 阶段 | 正常完成时的结果 | 异常退出时的结果 |
| --- | --- | --- |
| 复制原序列 | 得到独立的 `candidate` | 容器清理副本构造过程取得的资源，原序列保持不变 |
| 校准 `candidate` | 候选序列包含完整的校准结果 | 展开时销毁候选对象，原序列保持不变 |
| 移动赋值给 `samples` | 原序列被替换为候选的完整校准结果 | 本例的移动赋值不抛出 |

成功提交后，`samples` 仍指调用者的同一个容器对象。在本例的移动赋值中，原元素的生命周期结束，之前指向它们的引用随之失效。访问新元素时应从 `samples` 重新取得引用。

## 用保证描述调用者可以依赖什么

基本保证和强保证约定异常退出后保留哪些状态。不抛出保证约束异常能否越过操作边界，正常返回时交付什么由各操作的接口约定。

| 保证 | 含义 | 本篇对应关系 |
| --- | --- | --- |
| 基本保证（basic guarantee） | 异常退出后资源没有泄漏，约定的不变式依然成立。具体值可以变化 | 原地校准保留元素数目和压力范围，允许部分元素已经校准 |
| 强保证（strong guarantee） | 满足基本保证，且异常退出时约定的可观察状态保持不变 | 替换式校准失败时，调用者的原记录保持不变 |
| 不抛出保证（no-throw guarantee） | 在满足操作前提时，异常不会传播给调用者 | 替换式校准中用来提交的 `std::vector<double>` 移动赋值 |

这些保证适用于具体操作及其约定范围。本例的强保证保护调用者的原记录。若承诺还涉及对外发送消息、修改其他对象或写入日志，就要为这些副作用设计相应的异常处理。关于函数如何声明异常传播的边界，见 [`noexcept` 与操作的异常承诺](05-noexcept-and-operation-contracts.md#承诺约束异常能否越过函数边界)。

这些保证以操作满足使用前提为基础。通过悬空引用访问对象，或用 `std::vector` 的 `operator[]` 越界访问元素，都会导致未定义行为。

> [!PRACTICE]
> 独立候选对象能隔离校准失败，代价是复制和临时存储。若业务允许部分校准，可以直接约定原地操作在失败时保留哪些不变式。若要求全部生效，且能在完整验证之后保证随后的写入不会失败，也可以先验证再修改。

## 参考资料

- [Boost：异常安全保证与泛型组件](https://docs.cppalliance.org/user-guide/exception-safety.html)
- [C++23 工作草案：容器的移动赋值要求](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts)
- [C++23 工作草案：vector 接口与异常说明](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：默认存储分配策略的移动属性](https://timsong-cpp.github.io/cppwp/n4950/default.allocator)
- [C++23 工作草案：异常展开中的对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
