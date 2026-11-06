---
title: 失败后的对象状态与异常安全（Object State After Failure and Exception Safety）
date: 2026-09-12
order: 4
---

# 失败后的对象状态与异常安全（Object State After Failure and Exception Safety）

为一组压力采样值增加校准偏移时，前几个值可能已经修改，某个后续值才被发现超出允许范围。异常能让调用者知道校准没有完成；但调用者还需要知道：原来的记录是否保留，当前序列是否仍然有效，能否直接重试。

**异常安全（exception safety）讨论操作通过异常失败时，资源与程序状态仍然满足哪些保证。** 析构能够完成资源清理，却不会自动撤销此前执行过的赋值。

## 有效状态不一定是原来的状态

下面的校准操作要求输入采样值是 `0.0` 至 `500.0` kPa 之间的有限数值，偏移量是 `-10.0` 至 `10.0` kPa 之间的有限数值。这些是调用前提，保证本例的加法不会超出浮点类型的有限范围。操作还要检查每个校准结果是否落在允许的压力区间内。

`calibration_error` 是保存失败结果的异常类型，成员 `value_kpa` 表示超出允许区间的那个校准值。函数先检查新值，再写回当前元素：

```cpp
#include <iostream>
#include <vector>

struct calibration_error {
    double value_kpa;
};

void add_pressure_offset_kpa(std::vector<double>& samples, double offset_kpa) {
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

程序依次输出 `503`、`245`、`498`、`250`。第一个元素已经增加偏移，第二个元素的新值 `503.0` 未通过检查，因此没有写回；第三个元素尚未处理。

此时序列仍然拥有三个有效的元素，每个压力值也仍处于允许区间内。资源没有丢失，数据的范围约束没有破坏，但“所有元素应用同一次校准”没有完成。直接用相同偏移量重试，会再次增加第一个元素的值。

这里把“元素数目保持不变，压力值始终处于允许区间内”作为必须维持的不变式，即操作必须保住的条件。若业务还要求“一条记录中的所有采样值必须处于同一校准阶段”，这个原地实现就不能维持业务要求，不能仅凭容器仍可使用便称它安全。

> [!WARNING]
> 捕获异常以后可以继续执行，不代表失败的操作没有留下变化。是否可以读取、重试或重新使用对象，要看操作承诺保留的状态；重试一个已经部分生效的操作，可能再次应用已完成的修改。

## 把可能失败的准备留在独立对象中

如果调用者要求“校准全部成功才替换记录，失败时保留原记录”，可以先建立候选序列，在候选上完成校准，最后再交付结果。

这里需要一个明确的库契约：对本篇直接使用的 `std::vector<double>`，移动赋值可以结束目标原有元素的生命周期并接管源序列的存储，该操作不通过异常报告失败。这个结论针对这种具体容器类型及其普通移动赋值接口，不能从 `std::move` 的写法推广到任意类型。

在上面程序中增加 `<utility>`，并在 `main` 之前加入以下函数：

```cpp
void replace_with_adjusted_pressures_kpa(std::vector<double>& samples, double offset_kpa) {
    std::vector<double> candidate{samples};
    add_pressure_offset_kpa(candidate, offset_kpa);
    samples = std::move(candidate);
}
```

将 `main` 中的校准调用替换为 `replace_with_adjusted_pressures_kpa(samples, 5.0);`，程序输出就变成 `503`、`240`、`498`、`250`。失败仍由同一个异常报告，但调用者的原记录保持不变。

这个保证来自各阶段的安排：

| 阶段 | 如果通过异常失败 | 对调用者原序列的影响 |
| --- | --- | --- |
| 复制得到 `candidate` | 副本构造未完成，已取得的内部资源由容器负责清理 | 原序列未被修改 |
| 修改 `candidate` | 已完成构造的候选对象在异常展开时销毁 | 原序列未被修改 |
| 移动赋值给 `samples` | 本例采用的操作不通过异常失败 | 原记录被替换为完整的校准结果 |

最后把准备好的结果应用于目标，可以称为提交（commit）。这里的提交只是本次操作的设计阶段，不是 C++ 的新语法。**先准备、后提交能保留原状态，依赖于准备阶段不改动原状态，以及提交阶段能够履行所需的失败保证。** 如果最后一步也可能改到一半再抛出，单独准备一份副本并不足以得到这个结论。

成功替换记录时，`samples` 这个容器对象仍然存在，但它原来的元素已经结束生命周期。调用者先前保存的原元素引用不能继续使用。失败时保留原记录的承诺，也不意味着成功时保持原元素身份。

## 用保证描述调用者可以依赖什么

常见的异常安全保证可以按操作失败后留下的状态区分：

| 保证 | 含义 | 本篇对应关系 |
| --- | --- | --- |
| 基本保证（basic guarantee） | 异常失败后不泄漏资源，并维持约定的不变式；具体值可以变化 | 原地校准保留元素数目和压力范围，但允许部分元素已经校准 |
| 强保证（strong guarantee） | 异常失败对约定的可观察状态没有影响 | 替换式校准失败时，调用者的原记录保持不变 |
| 不抛出保证（no-throw guarantee） | 在满足操作前提时，不以异常把失败传播给调用者 | 本例最后采用的 `std::vector<double>` 移动赋值 |

这些保证属于具体操作及其约定范围，不能只给一个类型整体贴上“强保证”的标签。强保证也不等于撤销程序中的所有副作用：如果准备阶段已经向外部系统发送消息、修改其他对象或输出日志，这些变化必须另行纳入接口约定与设计。

异常安全同样不能把悬空引用、越界访问等未定义行为变成可恢复的失败；上述推理始终以操作满足其使用前提为基础。

> [!PRACTICE]
> 需要保留完整原记录时，独立候选对象提供了清楚的失败隔离，但会增加复制与临时存储。若业务允许部分处理，可以选择更弱而明确的状态承诺；若要求全部生效，也可以根据操作性质考虑先验证再修改。选择的依据是调用者需要什么保证，以及每个阶段实际上可能怎样失败。

## 参考资料

- [Boost：异常安全保证与泛型组件](https://docs.cppalliance.org/user-guide/exception-safety.html)
- [C++23 工作草案：容器的移动赋值要求](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts)
- [C++23 工作草案：vector 接口与异常说明](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：默认存储分配策略的移动属性](https://timsong-cpp.github.io/cppwp/n4950/default.allocator)
- [C++23 工作草案：异常展开中的对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)