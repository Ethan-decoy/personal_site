---
title: 异常展开与作用域清理（Stack Unwinding and Scope Cleanup）
date: 2026-09-12
order: 2
---

# 异常展开与作用域清理（Stack Unwinding and Scope Cleanup）

校准函数建立了两项局部登记，调用者也已有一项活动登记。函数抛出异常时，哪几项登记会在进入处理者前解除？

登记对象在构造时开始承担责任，在析构时执行解除。异常传播经过对象的作用域时，也要据此判断清理何时执行。见[作用域绑定清理与 RAII](../16-class-object-destruction-and-resource-lifetime/03-scope-bound-cleanup-and-raii.md#让对象生命周期承载清理责任)。

## 从抛出位置到处理者，需要销毁退出范围中的对象

控制从抛出位置转移到匹配的处理者时，语言按规则销毁沿途需要清理的对象。这个过程称为栈展开（stack unwinding）。

> [!IMPORTANT] 栈展开中的局部对象清理
> **异常向匹配的处理者传播时，具有自动存储期、已完成构造且尚未销毁的局部对象随其作用域退出而销毁。** 同一次展开中，这些对象按构造完成的逆序销毁。

实测范围沿用前篇的 `0.0` 到 `500.0` kPa。下面的 `inspect_tire` 在两项登记都建立后，用预先选定的越界读数 `520.0` kPa 直接抛出异常，以便在固定的失败位置观察清理顺序。见[前篇的校验约定](01-throwing-catching-and-propagating-exceptions.md#先区分计算结果与失败信息)。

计数 `count` 在所有登记对象之前建立，存活到它们完成析构。登记构造递增计数，析构时递减。编号 `id` 和析构输出用于辨认顺序，以下输出以写入正常完成为前提。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

class calibration_registration {
  public:
    calibration_registration(int& count, const int id) : counter{&count}, id{id} {
        ++(*counter);
    }

    calibration_registration(const calibration_registration&) = delete;
    calibration_registration& operator=(const calibration_registration&) = delete;

    ~calibration_registration() {
        --(*counter);
        std::cout << "leave " << id << ": " << *counter << '\n';
    }

  private:
    int* counter;
    int id;
};

void inspect_tire(int& count) {
    const calibration_registration first{count, 2};
    const calibration_registration second{count, 3};

    throw calibration_error{520.0};
}

int main() {
    int count{0};

    {
        const calibration_registration outer{count, 1};

        try {
            inspect_tire(count);
            std::cout << "inspection succeeded\n";
        } catch (const calibration_error& error) {
            std::cout << "caught " << error.value_kpa << ": " << count << '\n';
        }
    }

    std::cout << "finished: " << count << '\n';
}
```

程序输出以下五行。

```text
leave 3: 2
leave 2: 1
caught 520: 1
leave 1: 0
finished: 0
```

抛出时，三项登记都已完成构造，活动计数为 `3`。退出 `inspect_tire` 时，先销毁后构造的 `second`，再销毁 `first`。这两项解除动作在处理者正文之前完成。`inspect_tire(count)` 后面报告成功的语句被跳过。

## try 外的对象可以继续存在

`outer` 在包含整个 `try` 与 `catch` 的外层作用域中建立。控制转入处理者时仍在这个作用域内，因此处理者读到的计数为 `1`。

处理者正常结束后，控制到达外层花括号末尾，`outer` 随作用域退出而销毁，把计数减至 `0`。

| 对象 | 何时销毁 | 当前触发原因 |
| --- | --- | --- |
| `second` | 进入处理者正文前，先于 `first` | 异常传播需要退出 `inspect_tire` |
| `first` | 进入处理者正文前，晚于 `second` | 同一次异常展开 |
| `outer` | 处理者执行结束后，外层作用域结束时 | 正常离开作用域 |

用上述程序做对照，把 `outer` 的声明移进 `try` 块，放在 `inspect_tire(count);` 之前。异常传播现在还要退出 `outer` 所在的块，所以在 `second` 和 `first` 之后析构 `outer`，先输出 `leave 1: 0`，再由处理者输出 `caught 520: 0`。

## 清理由析构承担，不必逐个调用点捕获

`inspect_tire` 没有编写 `catch`，两项登记仍然正确解除。它们的清理责任已经封装在局部对象里，异常展开负责触发销毁。只为解除这些登记而在每个调用处补一段捕获代码，反而重复了对象已经承担的责任。

回到 `outer` 位于 `try` 外的原程序。如果用两次 `++count` 代替 `inspect_tire` 中的两个登记对象，并在可能抛出异常的检查调用之后用两次 `--count` 手动配对，抛出时就会跳过这两次递减。此时处理者读到的计数为 `3`，`outer` 正常析构后，最终计数仍为 `2`。

> [!PRACTICE] 让已构造的对象承担资源清理
> 一项资源取得后，如果后续操作可能失败，应及时把解除责任交给已经完成构造的对象。让析构负责固定的清理，让处理者决定业务上如何回应失败，两者可以处在不同层次。

这项清理依赖登记对象的设计。每项登记由一个对象负责解除，析构时借用的计数仍然有效。

## 资源清理不等于撤销全部修改

本例计数回到原值，是因为析构函数明确执行了对应递减。如果检查过程中还修改了调用者的压力序列，销毁登记对象不会自动把序列改回去。

例如，检查函数通过引用把外层采样值从 `240.0` 改为 `245.0`，随后抛出异常。登记对象的析构完成了计数清理。采样对象仍在调用者的作用域中，在处理者里读取它会得到 `245.0`。

因此，“没有遗漏资源清理”和“失败前后的数据完全相同”是不同的保证。前者可以由当前 RAII 对象完成，后者需要操作本身安排状态更新方式。

## 终止路径不能套用正常展开的保证

上述析构顺序以异常能够转移到处理者、沿途清理可以正常完成为前提。

> [!WARNING] 未捕获异常与析构异常的终止条件
> 找不到匹配的处理者时，语言会调用 `std::terminate`，调用前是否展开栈由实现定义。正在为一个异常展开时，如果又有异常从参与清理的析构函数中逃出，也会调用 `std::terminate`。

因此，析构中的输出仅用于本例观测，不能把“记录日志一定成功”当成一般资源清理的前提。

## 参考资料

- [C++23 工作草案：栈展开与对象销毁顺序](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：处理者进入与异常终止](https://timsong-cpp.github.io/cppwp/n4950/except.handle)
- [C++23 工作草案：异常处理无法继续时的终止规则](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
