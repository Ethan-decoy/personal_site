---
title: 常量求值语境与资源（Constant Evaluation Context and Resources）
date: 2026-10-08
order: 1
---

# 常量求值语境与资源（Constant Evaluation Context and Resources）

constexpr 表达“这项函数可以在满足规则时常量求值”，并不意味着每次调用都在编译期发生。某些实现需要区分求值语境，或只在常量求值的内部短暂使用动态资源。

## 检测语境不等于选择模板实例

`std::is_constant_evaluated()` 在 `<type_traits>` 中检测当前是否处于明显的常量求值语境。它不检测优化器是否提前计算了普通调用。

C++23 的 `if consteval` 为常量求值分支提供语境，配合普通运行分支；它不同于 `if constexpr` 对常量条件丢弃分支。

```cpp
#include <iostream>

consteval int compile_time_adjustment(int value) {
    return value + 10;
}

constexpr int adjusted(int value) {
    if consteval {
        return compile_time_adjustment(value);
    } else {
        return value + 10;
    }
}

int main() {
    constexpr int first = adjusted(220);
    int source{230};
    std::cout << first << ' ' << adjusted(source) << '\n'; // 230 240
}
```

consteval 分支中允许以当前参数参与立即函数调用，因为它在对应语境内。普通运行调用走另一个分支。

把 `is_constant_evaluated()` 直接写成 `if constexpr` 的条件会使条件本身处在常量求值语境，不能用来区分这次函数调用原本要在哪种语境执行。

## 编译期分配不能任意逃逸

C++20 起，常量求值可以在规定范围内使用短暂动态分配。例如 vector 可以作为计算的临时工作区，但所用库操作也须支持常量求值。这里需要核对的是**要求成为常量表达式的同一次求值：其中的动态分配必须在这次求值内释放，最终结果不能继续依赖那块存储。**

下面是独立完整程序。sum_readings 用临时 vector 算出一个整数；make_readings 则返回仍拥有存储的 vector，示例按普通运行期调用使用它：

```cpp
#include <iostream>
#include <vector>

constexpr int sum_readings() {
    const std::vector<int> values{220, 230};
    return values[0] + values[1];
}

constexpr std::vector<int> make_readings() {
    return {220, 230};
}

int main() {
    constexpr int total{sum_readings()};
    std::cout << total << '\n'; // 450
    const auto readings = make_readings();
    std::cout << readings.size() << '\n'; // 2
}
```

初始化 total 的整次求值中，临时 values 先取得存储，保存两项并计算总和，再在函数退出时销毁并释放存储；最后交出的只有整数 450。临时资源的结束与常量结果的建立，因此处在同一次求值内。

若在同一个 main 中把 readings 的声明替换为下面这一行，就在常量初始化处失败：

```cpp
constexpr auto readings = make_readings(); // 错误：非空结果仍保有所分配的存储
```

make_readings 本身可以是 constexpr 函数，也可以返回 vector。失败的是这次要求成为常量表达式的初始化：结果还拥有两项记录的动态存储，释放要等结果对象以后销毁，已经超出了该次求值。需要持久的常量结果时，应让临时工作区交出不依赖这块存储的整数或固定值；需要拥有动态结果时，按相应运行期对象的寿命管理。

> [!IMPORTANT]
> 常量求值仍检查对象、资源与执行路径。提前执行不是绕过生命周期的方式，语境检测也不是运行时性能探针。

## 参考资料

- [C++23 工作草案：if consteval](https://timsong-cpp.github.io/cppwp/n4950/stmt.if)
- [C++23 工作草案：常量表达式与动态分配](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：is_constant_evaluated](https://timsong-cpp.github.io/cppwp/n4950/meta.const.eval)
