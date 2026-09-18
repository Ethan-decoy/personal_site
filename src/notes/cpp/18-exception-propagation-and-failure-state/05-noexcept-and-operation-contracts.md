---
title: noexcept 与操作的异常承诺（noexcept and Exception Contracts）
date: 2026-09-12
order: 5
---

# noexcept 与操作的异常承诺（noexcept and Exception Contracts）

把候选结果提交给目标时，如果最后一步还能通过异常失败，原状态是否保留就需要继续分析。类似地，析构正在清理资源时再向外传播异常，也可能让原来的失败处理无法继续。调用方需要能够从接口判断：这个函数是否允许异常离开。

## 承诺约束异常能否越过函数边界

异常说明（exception specification）描述函数是否允许通过异常退出。`noexcept` 说明符写在函数参数列表之后；成员函数如果带有 `const` 限定，就写在 `const` 后面。它表示异常不能越过该函数的边界。例如，以下是一个不允许异常向调用者传播的函数声明：

```cpp
void finish_inspection() noexcept;
```

`noexcept` 等价于 `noexcept(true)`；`noexcept(false)` 则表示允许异常传播。普通函数（包括非特殊成员函数）未写异常说明时，具有潜在抛出（potentially-throwing）的说明。这描述接口允许的行为，不表示每次调用都会抛出异常，也不是编译器逐条分析函数体后得出的结论。

> [!IMPORTANT]
> `noexcept` 承诺异常不从函数中传播出去。函数内部可以执行可能抛出的操作，也可以在内部捕获异常；如果异常确实要越过这条边界，程序会进入终止处理，调用者不能再用外层 `catch` 接住它。

下面的 `sensor_error` 表示传感器未就绪。`require_sensor` 在无法满足检查要求时抛出它；`can_inspect` 把这项明确的失败转换为 `false`，正常通过检查则返回 `true`：

```cpp
#include <iostream>

struct sensor_error {};

void require_sensor(bool sensor_ready) {
    if (!sensor_ready) {
        throw sensor_error{};
    }
}

bool can_inspect(bool sensor_ready) noexcept {
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

程序输出 `1`、`0`。`catch (const sensor_error&)` 没有给引用形参命名，因为处理代码只需要识别失败类型，不需要读取异常对象。异常在 `can_inspect` 内部已经处理，所以没有越过它的函数边界。

这个例子用来显示函数内部抛出与接口向外传播的区别。若业务本来只需查询一个布尔状态，直接返回状态即可；转换包装适合接入已经使用异常报告失败、且当前接口确实能够解释该失败的操作。

## 违背承诺不会转成普通的调用失败

在上面程序中，若把 `can_inspect` 的定义替换为以下版本，第二次调用就会违背承诺：

```cpp
bool can_inspect(bool sensor_ready) noexcept {
    require_sensor(sensor_ready);
    return true;
}
```

这个定义在语言层面可以编译，编译器也可以给出警告。传入 `false` 时，`sensor_error` 没有在函数内得到处理；当异常传播试图离开 `can_inspect`，异常机制会调用 `std::terminate` 进行终止处理。即使在 `main` 中用匹配的 `try` / `catch` 包住调用，也不能使这次调用恢复成普通的异常传播。

`std::terminate` 是标准库的终止入口；默认处理会结束程序。这里不需要显式调用它，语言的异常机制会触发这个动作。也不能假设进入这种终止路径之前一定完成了所有局部对象的清理：对于异常越过不抛出边界的情形，展开程度由实现规定。

不抛出异常与总能成功完成任务也不同。接口可以通过已经约定的返回值报告失败；写上 `noexcept` 本身既不会恢复被修改的数据，也不会补上清理动作。

## 调用前的准备仍可能失败

函数自身的说明不覆盖调用前的全部准备。向按值接收 `std::vector<double>` 的函数传入已有序列左值，需要先复制构造形参；这一步可能在进入函数体前失败，即使被调用函数声明了 `noexcept`，调用者仍可能接到这次构造抛出的异常。

因此，判断整个调用表达式时，还要计入实参求值与形参初始化，不能只看被调用函数的异常说明。

## 析构的默认说明不由函数体推断

普通函数未写 `noexcept` 时允许异常传播，不能把这条规则直接套用到析构函数上。对本篇只通过成员组合构成的类，析构函数没有显式异常说明时，只要相关类类型成员中有一项析构允许异常传播，这个析构就具有潜在抛出的说明；相关成员的析构全都不抛出时，它才具有不抛出的说明。内置类型成员不会引入抛出操作。

例如，[作用域清理中的登记类型](02-stack-unwinding-and-scope-cleanup.md#从抛出位置到处理者需要销毁退出范围中的对象) 保存计数指针与登记编号。其析构执行递减，没有会抛出的成员析构，因此即使没写 `noexcept`，它的异常说明仍是不抛出。后来向这个析构函数体加入一个可能抛出的调用，不会让接口自动变成允许抛出。

> [!WARNING]
> 异常展开正在销毁对象时，如果析构又以另一个异常退出，就会触发终止处理。把析构改成 `noexcept(false)` 也不能让这种双重传播变成可恢复的路径。

析构内部捕获并处理一项失败，与让异常离开析构是不同的情况。需要向调用者报告的结束操作，可以设计成显式成员函数，让调用者在正常控制流中处理结果；析构仍须完成其能够可靠承担的清理。不能仅仅捕获并忽略错误，就宣称资源一定已经正确释放。

## 移动的异常承诺来自实际操作

移动需要交接新责任并维持源对象的有效状态；移动赋值还要处理目标的旧责任。如果其中任一步可能通过异常失败，就需要说明失败时双方各自保留什么；一个右值引用参数不会自动提供不抛出保证。

当登记移动只涉及有效指针的赋值、清空以及约定范围内的计数变化时，这些动作不通过 C++ 异常失败，可以给相应移动操作声明 `noexcept`。前提仍包括计数目标有效、计数变化不溢出，以及源和目标的责任关系合法；`noexcept` 不负责检查这些条件。

默认移动则可以从成员操作组合出异常说明。以下是一个可放在源文件中的类定义片段，需要包含 `<vector>`：

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

这里的移动构造和移动赋值在首次声明处使用 `= default`，且没有显式指定异常说明。所需的成员初始化或赋值中，只要有一项潜在抛出，相应的默认移动就潜在抛出；全部不抛出时，它才不抛出。某个成员实际由复制接收时，也要依据所选复制操作判断。

本例 `std::vector<double>` 的普通移动构造和移动赋值都不抛出，所以 `pressure_record` 的这两个默认移动操作也不抛出。更换成员类型后，需要根据新成员的操作重新判断。

这与自己编写移动函数体不同：手写的移动构造或移动赋值没有显式异常说明时，接口仍是潜在抛出，编译器不会因为函数体看起来只做指针赋值便自动补上 `noexcept`。

异常说明也不直接改变普通重载决议的选择。某个移动构造可能抛出，并不意味着用将亡值初始化对象时，语言就自动改选复制构造。需要保留旧状态的调用方，可以根据接口保证选择不同策略；这种策略与构造函数的重载选择需要分别判断。

> [!PRACTICE]
> 把 `noexcept` 用作经过核实的接口承诺。需要在失败时保留旧状态的代码，可以把不抛出的操作作为最后提交步骤；负责清理的类型也应让结束责任的路径可靠。是否能作出承诺，要检查调用、成员操作和失败处理的全过程，不能仅凭函数叫“移动”或“清理”来决定。

## 参考资料

- [C++23 工作草案：异常说明及特殊成员函数的隐式说明](https://timsong-cpp.github.io/cppwp/n4950/except.spec)
- [C++23 工作草案：触发终止处理的条件与展开边界](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
- [C++23 工作草案：vector 的移动接口](https://timsong-cpp.github.io/cppwp/n4950/vector.overview)
- [C++ Core Guidelines：析构及清理操作不应失败](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Re-never-fail)
