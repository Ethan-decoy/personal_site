---
title: 异常的抛出、捕获与传播（Throwing, Catching, and Propagating Exceptions）
date: 2026-09-12
order: 1
---

# 异常的抛出、捕获与传播（Throwing, Catching, and Propagating Exceptions）

校准差值由目标压力减去实测读数得到。实测读数超出允许范围时，随意返回一个数值会让调用者把失败当成差值。异常（exception）允许函数携带失败信息离开当前计算，把控制交给匹配的处理者。

## 先区分计算结果与失败信息

本例校验实测读数，允许范围为 `0.0` 到 `500.0` kPa，包含两端。目标压力 `target_kpa` 由调用方保证有效，程序使用 `240.0` kPa。`checked_pressure` 校验成功时返回实测值，失败时抛出记录该值的 `calibration_error` 对象。

抛出（throw）可写成 `throw 表达式;`。操作数用来初始化异常对象（exception object）。异常对象的类型用于匹配处理者，保存的数据供处理者判断发生了什么。

`try` 和 `catch` 一起组织失败路径。

- `try { ... }` 包围可能失败的语句。从这些语句调用的函数传播出来的异常，也可以由这一组 `catch` 处理。
- 紧随其后的 `catch (const calibration_error& error) { ... }` 是异常处理者（exception handler），也称捕获子句。它匹配本例抛出的 `calibration_error`，通过只读引用 `error` 访问异常对象。

`try`、`catch` 和 `throw` 都是语言关键字。程序引入 `<iostream>` 用于输出。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

double checked_pressure(const double value_kpa) {
    if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
        throw calibration_error{value_kpa};
    }

    return value_kpa;
}

double calibration_delta(const double measured_kpa, const double target_kpa) {
    const double measured{checked_pressure(measured_kpa)};
    return target_kpa - measured;
}

int main() {
    try {
        const double delta{calibration_delta(520.0, 240.0)};
        std::cout << "delta: " << delta << '\n';
    } catch (const calibration_error& error) {
        std::cout << "rejected: " << error.value_kpa << '\n';
    }

    std::cout << "inspection finished\n";
}
```

程序输出以下两行。

```text
rejected: 520
inspection finished
```

`calibration_error` 是用 `struct` 定义的普通类类型，`value_kpa` 是可直接访问的成员。类型表示这一类校验失败，成员记录本次被拒绝的实测值。

## 异常沿正在执行的调用关系传播

> [!IMPORTANT] 异常中断计算并转交控制
> **抛出异常后，沿正在执行的调用关系寻找匹配的处理者。找到后，控制转入该处理者，沿途因异常退出的调用不交付正常返回结果。** 这个过程称为异常传播（exception propagation）。在普通的 `try` 与 `catch` 结构中，处理者正常执行到末尾后，程序从整个结构之后继续。

这次执行依次进入 `main` 中的 `try`、`calibration_delta` 和 `checked_pressure`。`checked_pressure` 遇到 `520.0` 时执行 `throw`，在正常的 `return` 之前退出。

`measured` 的初始化因此中断，`calibration_delta` 没有算出差值，`main` 中的 `delta` 也没有完成初始化。控制转到匹配的 `catch`，它从异常对象读取 `520` 并报告失败。随后执行结构之后的输出，所以程序还会输出 `inspection finished`。

把 `calibration_delta(520.0, 240.0)` 的第一个实参改为 `230.0`，保留目标压力 `240.0`。这次差值计算正常完成，程序在 `try` 块内输出 `delta: 10`，离开整个结构后输出 `inspection finished`。

## 捕获依据类型，不做普通参数转换

一个 `try` 可以跟随多个 `catch`。运行时，从同一线程最近进入且尚未退出的 `try` 块开始，按 `catch` 的书写顺序寻找第一个匹配项。如果这一组都不匹配，搜索继续到运行时外层的 `try` 块。

对于本例这样的同类型匹配，按值捕获比较参数的类型，按左值引用捕获比较被引用的类型，比较时忽略顶层类型限定。因此 `const calibration_error&` 匹配 `calibration_error`，其中的 `const` 使处理者通过 `error` 只读访问异常对象。

数值转换和用户定义转换不参与异常匹配。例如，抛出 `int` 时，`catch (double)` 不匹配。如果同组后面还有 `catch (int)`，它可以捕获这个异常。

`catch (...)` 匹配任意 C++ 异常。如果使用，它必须放在同一个 `try` 的所有处理者最后。这个写法不声明异常变量，适合执行无需读取具体错误数据的统一处理。

## 引用捕获借用的是异常对象

异常处理机制维持 `throw calibration_error{value_kpa};` 建立的异常对象。对象用自己的数值成员保存抛出时的读数，因此 `checked_pressure` 退出后，处理者仍能读取这次失败的数据。

本例的 `catch (const calibration_error& error)` 直接绑定已有的异常对象。如果把这个处理者改成 `catch (const calibration_error error)`，按值参数从指代异常对象的左值复制初始化，所选的复制构造必须可用。

当参数与异常对象去掉顶层限定后同类，且程序含义除参数构造和析构的执行外保持相同，实现可以省略复制，把参数当作异常对象的别名。

本例的处理者结束时，异常对象随之销毁。若需要在处理者之外使用被拒绝的读数，应在 `catch` 中保存 `error.value_kpa` 的值。

## 捕获的位置应能决定失败后的行动

校验函数能辨认无效读数。`calibration_delta` 负责校验成功后的差值计算，并让异常传播到能够报告检查结果的 `main`。

> [!PRACTICE] 在能决定后续行动的位置捕获
> 当某层能决定放弃、替换或重试操作时，可以在该层处理异常。其他层可以让失败继续传播，交给有足够信息决定后续行动的处理者。

查询读数是否达标时，`bool` 可以直接表达查询结果。本例的接口承诺成功时交付有效差值，校验失败通过异常报告。

如果始终找不到匹配的处理者，语言会调用 `std::terminate`，进入程序终止路径。调用前是否进行栈展开由实现定义。见[栈展开的终止边界](02-stack-unwinding-and-scope-cleanup.md#终止路径不能套用正常展开的保证)。

## 参考资料

- [C++23 工作草案：抛出异常与异常对象](https://timsong-cpp.github.io/cppwp/n4950/except.throw)
- [C++23 工作草案：异常处理者与类型匹配](https://timsong-cpp.github.io/cppwp/n4950/except.handle)
- [C++23 捕获参数的复制省略](https://timsong-cpp.github.io/cppwp/n4950/class.copy.elision#1.4)
- [C++23 工作草案：异常终止条件](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
