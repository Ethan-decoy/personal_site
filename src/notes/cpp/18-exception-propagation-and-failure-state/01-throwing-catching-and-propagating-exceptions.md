---
title: 异常的抛出、捕获与传播（Throwing, Catching, and Propagating Exceptions）
date: 2026-09-12
order: 1
---

# 异常的抛出、捕获与传播（Throwing, Catching, and Propagating Exceptions）

一个函数承诺计算校准差值，但输入的压力读数超出了设备范围。此时它不能交付有效差值；如果随意返回一个普通数值，调用者就可能把失败当成计算结果继续使用。

异常（exception）提供了另一条控制路径：操作无法完成时，可以携带失败信息离开当前计算，把控制交给能够处理这项失败的位置。是否使用异常属于接口设计；它不是把每个返回 `false` 的函数都改写一遍。

## 先区分计算结果与失败信息

本例约定压力范围为 `0.0` 到 `500.0` kPa，包含两端。校验函数成功时返回原数值，失败时抛出一个记录请求值的 `calibration_error` 对象。

抛出（throw）使用 `throw 表达式;`。表达式提供异常对象（exception object）的初始信息；异常对象的类型用于寻找相应的处理者，保存的数据则供处理者判断发生了什么。

处理位置使用 `try` 和 `catch` 组织：

- `try { ... }` 包围一次可能失败的执行过程，其范围也包括从里面调用的函数。
- 紧随其后的 `catch (const calibration_error& error) { ... }` 是异常处理者（exception handler），也称捕获子句。它接收 `calibration_error` 类型的异常，通过只读引用 `error` 访问异常对象。

这些关键字属于语言，不需要专门包含头文件。下面的头文件用于输出：

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

double checked_pressure(double value_kpa) {
    if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
        throw calibration_error{value_kpa};
    }

    return value_kpa;
}

double calibration_delta(double measured_kpa, double target_kpa) {
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

程序输出：

```text
rejected: 520
inspection finished
```

`calibration_error` 是普通的自定义类类型；`struct` 使这里的成员能够直接访问。它不需要某个特殊关键字才有资格携带失败信息。不同的错误类型可以表达不同的失败种类，成员则补充这一次失败的数据。

## 异常沿正在执行的调用关系传播

这次调用依次进入 `main` 中的 `try`、`calibration_delta` 和 `checked_pressure`。最后一层发现 `520.0` 不符合范围条件，执行 `throw`。

此后，`checked_pressure` 不会执行自己的 `return value_kpa;`；`calibration_delta` 中的 `measured` 没有完成初始化，差值也没有算出。异常继续向调用方传播，直到交给 `main` 中匹配的处理者。`delta` 同样没有完成初始化，输出差值的语句不会执行。

这里的异常传播（exception propagation）依据运行时的调用关系，不要求抛出语句在源代码中直接写进 `try` 的花括号。中间函数没有捕获异常时，也不必逐层编写一个“失败返回值”来传递同一信息。

> [!IMPORTANT]
> 函数通过异常离开时，没有向调用者交付正常返回结果。捕获之后也不会回到抛出位置或失败调用的下一条语句，继续那次被中断的计算。

本例的处理者正常执行到末尾后，程序继续执行整个 `try` 与 `catch` 结构之后的语句，所以仍会输出 `inspection finished`。如果输入改为 `230.0`，校验正常返回，差值为 `10.0`，处理者就不会进入。

## 捕获依据类型，不做普通参数转换

一个 `try` 可以依次跟随多个 `catch`。执行时，从当前执行关系中最近的 `try` 开始，按书写顺序寻找匹配的处理者；这一组都不匹配，就继续向外寻找。

本例抛出 `calibration_error`，处理者使用同类型或它的左值引用就能匹配，顶层 `const` 不影响这种匹配。因此，`catch (const calibration_error& error)` 能捕获这里的错误。

异常匹配不采用普通参数传递中的一般转换规则。例如，抛出 `int` 时，`catch (double value)` 不会因为整数能转换为浮点数而捕获它；用户定义转换也不会参与匹配。

`catch (...)` 使用的三个点表示匹配任意 C++ 异常，不声明一个可供读取的错误变量；如果使用，它必须放在同一个 `try` 的所有处理者最后。它可以承担统一的失败出口，但不会自动提供每一种错误的具体数据。

## 引用捕获借用的是异常对象

`throw calibration_error{value_kpa};` 建立的异常对象由异常处理机制维持生命周期。它不是对 `checked_pressure` 某个局部变量的引用，因此函数因失败而退出后，处理者仍能读取其中的 `value_kpa`。

`catch` 中的 `const calibration_error&` 沿用只读借用关系：处理者访问已有的异常对象，无需为了捕获再复制一份类对象。如果改成按值捕获 `calibration_error error`，则声明了自己的捕获参数对象，并涉及从异常对象初始化它。

在本例这种捕获后直接处理结束的路径中，异常对象随后销毁。因此，不能把指向 `error` 所引用对象的指针保存下来，假定处理者结束后仍可使用。

## 捕获的位置应能决定失败后的行动

校验函数知道读数无效，`main` 则决定如何报告这次检查失败。中间的 `calibration_delta` 不需要了解输出方式，也不应在无法计算差值时伪造一个 `0.0` 继续返回。

> [!PRACTICE]
> 在能够决定放弃、替换或重试哪项操作的位置处理异常。如果某层既不能恢复，也不能把失败转换为自己明确承诺的另一种结果，就可以让异常继续传播；为每次调用都包一层 `try` 并不能增加处理能力。

这不意味着异常总比状态返回合适。如果“读数是否达标”本来就是查询结果，返回 `bool` 可以直接表达问题；本例则约定成功时交付有效差值，无法完成该承诺时使用异常。调用者需要依据接口区分正常结果和失败路径。

如果始终找不到匹配的处理者，语言会调用标准库的 `std::terminate`，进入程序终止路径，不能回到失败调用处继续执行。它不是自动输出错误后安全收尾的保证，不能依赖未处理异常一定执行所有局部对象的析构。

## 参考资料

- [C++23 工作草案：抛出异常与异常对象](https://timsong-cpp.github.io/cppwp/n4950/except.throw)
- [C++23 工作草案：异常处理者与类型匹配](https://timsong-cpp.github.io/cppwp/n4950/except.handle)
- [C++23 工作草案：异常终止条件](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
