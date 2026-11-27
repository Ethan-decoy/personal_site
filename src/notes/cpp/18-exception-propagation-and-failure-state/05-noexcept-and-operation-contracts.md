---
title: noexcept 与操作的异常承诺（noexcept and Exception Contracts）
date: 2026-09-12
order: 5
---

# noexcept 与操作的异常承诺（noexcept and Exception Contracts）

把候选结果提交给目标时，如果最后一步能抛出异常，就要继续判断原状态能否保留。析构期间向外传播的异常也可能中断原来的失败处理。这两种情况都需要先确定函数是否允许异常离开。

## 承诺约束异常能否越过函数边界

异常说明（exception specification）描述函数是否允许通过异常退出。`noexcept` 说明符写在参数列表之后。成员函数带有 `const` 或引用限定时，`noexcept` 写在这些限定之后。下面的函数声明具有不抛出的异常说明。

```cpp
void finish_inspection() noexcept;
```

`noexcept` 等价于 `noexcept(true)`。`noexcept(false)` 指定潜在抛出（potentially-throwing）的异常说明，允许异常从函数传播出去。对本节这样的普通函数，省略说明时也是潜在抛出的。析构函数、释放函数以及首次声明即默认化的函数有各自的隐式规则。

> [!IMPORTANT] 不抛出的函数边界
> **`noexcept` 约束的是异常能否离开函数。** 函数内部仍可抛出并处理异常。如果异常试图越过这个函数的边界，语言会调用 `std::terminate`，调用方的处理者接不到这项异常。

下面的 `sensor_error` 表示传感器未就绪。`require_sensor` 在这个条件下抛出异常。`can_inspect` 在内部处理这项失败并返回 `false`，检查通过时返回 `true`。

```cpp
#include <iostream>

struct sensor_error {};

void require_sensor(const bool sensor_ready) {
    if (!sensor_ready) {
        throw sensor_error{};
    }
}

bool can_inspect(const bool sensor_ready) noexcept {
    try {
        require_sensor(sensor_ready);
        return true;
    } catch (const sensor_error&) {
        return false;
    }
}

int main() {
    std::cout << can_inspect(true) << '\n';
    std::cout << can_inspect(false) << '\n';
}
```

程序逐行输出以下两个值。

```text
1
0
```

`catch (const sensor_error&)` 只根据异常类型选择处理动作，所以无需为引用形参命名。异常在 `can_inspect` 内得到处理，调用者通过返回值获知检查失败。

若业务只需查询一个布尔状态，直接返回状态即可。这种转换适用于接入已经通过异常报告失败、且当前接口能够把失败解释为具体结果的操作。

## 违背承诺不会转成普通的调用失败

在上面程序中只替换 `can_inspect` 的定义。第一次调用正常返回，第二次调用会让异常到达不抛出的函数边界。

```cpp
bool can_inspect(const bool sensor_ready) noexcept {
    require_sensor(sensor_ready);
    return true;
}
```

替换后的定义可以通过编译。运行时传入 `false`，`require_sensor` 抛出的 `sensor_error` 试图离开 `can_inspect`，语言会调用 `std::terminate`。这个异常无法到达 `main` 中与它匹配的处理者。

`std::terminate` 调用当前的终止处理器，默认处理会结束程序。异常试图越过不抛出边界时，在调用 `std::terminate` 前是否展开栈、展开到什么程度，由实现规定。

正常返回也可以报告任务失败，例如原程序中的 `false`。操作会保留哪些状态、怎样清理资源，由接口约定和实际执行的动作决定。

## 调用还涉及实参与形参的操作

进入函数体前需要求值实参并初始化形参。向按值接收 `std::vector<double>` 的函数传入已有序列左值时，需要复制构造形参。如果复制抛出异常，函数体尚未开始执行，调用方可以捕获它，即便被调用的函数声明了 `noexcept`。

按值形参的初始化和销毁都发生在调用方的上下文中。具体在函数返回时销毁，还是在包含调用的完整表达式结束时销毁，由实现规定。若形参的析构可以抛出，析构抛出的异常也从调用方开始寻找处理者。判断整个调用时，要同时检查实参求值、形参的初始化与销毁，以及被调用函数的异常说明。

## 析构的默认说明不由函数体推断

对本篇通过成员组合构成的类，没有显式异常说明的析构函数根据可能构造的成员子对象确定说明。只要其中一项析构具有潜在抛出的说明，外层析构也具有潜在抛出的说明。若这些析构均不抛出，外层析构也具有不抛出的说明。类类型的数组成员要检查元素的析构。`int` 和指针成员都无需调用析构函数。

前篇的登记析构先递减计数，再用 `std::cout` 输出。输出是可能抛出的操作。登记类型只保存计数指针与整数编号，因此它的析构函数仍具有不抛出的异常说明。若输出异常试图离开析构，就会触发终止处理。见[作用域清理中的登记类型](02-stack-unwinding-and-scope-cleanup.md#从抛出位置到处理者需要销毁退出范围中的对象)。

> [!WARNING] 展开时异常逃出析构函数会触发终止
> 异常展开销毁对象时，如果被调用的析构函数又以异常退出，程序会调用 `std::terminate`。这一规则也适用于声明为 `noexcept(false)` 的析构函数。

需要向调用者报告结果的结束操作，可以做成显式成员函数供正常控制流调用。析构负责自身能可靠完成的清理。若在析构中捕获失败，处理动作仍须满足类型的清理约定。

## 移动的异常承诺来自实际操作

移动资源拥有者时，要交接责任并维持源对象的有效状态。移动赋值还要处理目标的旧责任。若其中任一步可能抛出，接口需要明确失败时源和目标各自保留什么。

前面的登记移动涉及指针赋值、清空和计数变化。在计数目标有效、运算不溢出且源和目标的责任关系合法时，这些动作都不会抛出 C++ 异常，因此相应的移动操作可以声明 `noexcept`。见[登记的移动赋值](../17-rvalue-references-and-move-semantics/04-move-assignment-and-existing-resource-responsibility.md#结束旧责任再接收新责任)。

默认移动可以根据实际选中的成员操作确定异常说明。在源文件中包含 `<vector>` 后，可以定义下面的 `pressure_record`。

```cpp
class pressure_record {
  public:
    pressure_record() = default;
    pressure_record(pressure_record&&) = default;
    pressure_record& operator=(pressure_record&&) = default;

  private:
    std::vector<double> samples;
};
```

这里的移动构造和移动赋值在首次声明处使用 `= default`，并采用隐式异常说明。所需的成员初始化或赋值中，只要有一项潜在抛出，相应的默认移动就潜在抛出。这些操作都不抛出时，默认移动也不抛出。某个成员实际使用复制时，也要依据所选复制操作判断。

`std::vector<double>` 的普通移动构造不抛出，使用默认分配器时它的移动赋值也不抛出。因此 `pressure_record` 的这两个默认移动操作都具有不抛出的说明。更换成员类型后，要依据实际选中的操作重新判断。见[前篇采用的移动赋值契约](04-failure-state-and-exception-safety.md#把可能失败的准备留在独立对象中)。

手写的移动构造或移动赋值省略异常说明时，接口具有潜在抛出的说明。即使函数体只有指针赋值，语言也按这项声明规则处理。

在 `T(T&&)` 和 `T(const T&)` 都可用的情况下，用 `T` 类型的将亡值直接初始化 `T` 对象会选择 `T(T&&)`。移动构造的潜在抛出说明不改变这项选择。若调用方需要保留源对象的原状态，可以根据接口保证主动选择复制等准备策略。

函数指针的重载选择需要考虑异常说明，因为它是函数类型的一部分。若两个重载分别接收 `void (*)() noexcept` 和 `void (*)()`，传入不抛出函数的指针时，第一个重载的参数类型与实参直接匹配，优先于需要转换的第二个重载。潜在抛出函数的指针只匹配第二个重载。

> [!PRACTICE] 声明 noexcept 前核对调用与失败路径
> 声明 `noexcept` 前，核对函数实际调用的操作、成员操作和失败路径。把它用于提交时，还要确认操作正常返回后会交付完整结果。用于析构时，应确认资源清理在承担的条件下能够完成。

## 参考资料

- [C++23 工作草案：异常说明及特殊成员函数的隐式说明](https://timsong-cpp.github.io/cppwp/n4950/except.spec)
- [C++23 工作草案：触发终止处理的条件与展开边界](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
- [C++23 工作草案：实参求值与形参的初始化和销毁](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：格式化输出的异常处理](https://timsong-cpp.github.io/cppwp/n4950/ostream.formatted.reqmts)
- [C++23 工作草案：vector 的移动接口](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++23 工作草案：函数指针转换](https://timsong-cpp.github.io/cppwp/n4950/conv.fctptr)与[转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
- [C++ Core Guidelines：析构及清理操作不应失败](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Re-never-fail)
