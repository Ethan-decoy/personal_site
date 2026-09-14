---
title: 异常展开与作用域清理（Stack Unwinding and Scope Cleanup）
date: 2026-09-12
order: 2
---

# 异常展开与作用域清理（Stack Unwinding and Scope Cleanup）

校准函数已经建立了两项登记，随后因读数无效抛出异常。异常会跳过函数剩余的普通语句，但这些登记不能因此失去解除责任。

[作用域绑定清理与 RAII](../16-class-object-destruction-and-resource-lifetime/03-scope-bound-cleanup-and-raii.md)把责任交给对象析构：对象销毁时，执行它承担的清理动作。当控制因异常转向处理者时，这项关系仍然可以成立，关键在于哪些对象已经构造完成，以及控制离开了哪些作用域。

## 从抛出位置到处理者，需要销毁退出范围中的对象

异常从抛出位置传播到匹配的处理者时，语言会销毁沿途需要退出的作用域中已经构造完成、尚未销毁的自动存储期对象。这一过程称为栈展开（stack unwinding）。

“栈展开”是这一对象销毁过程的名称，当前判断依据是 C++ 的作用域与生命周期规则，不需要先假定某种机器栈布局。对于这些对象，销毁顺序与构造完成顺序相反。

下面延续校准登记模型：构造时递增活动计数，析构时递减。额外的 `id` 和输出只用于辨认销毁顺序；假定计数目标有效、计数不溢出，且演示中的输出正常完成。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

class calibration_registration {
  public:
    calibration_registration(int& count, int id) : counter{&count}, id{id} {
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

程序输出：

```text
leave 3: 2
leave 2: 1
caught 520: 1
leave 1: 0
finished: 0
```

抛出时，三项登记都已完成构造，活动计数为 `3`。`inspect_tire` 因异常退出，先销毁后构造的 `second`，再销毁 `first`。这两项解除动作完成后，才执行处理者的正文，因此其中读到的计数为 `1`。

`inspection succeeded` 没有输出：异常清理会执行该执行路径要求的析构，不能让被跳过的普通语句重新运行。

## try 外的对象可以继续存在

`outer` 在进入 `try` 之前已经建立。异常交给同一层的处理者时，并没有离开 `outer` 所在的外层作用域，因此它仍然承担一项登记，处理者读到的计数才会是 `1`。

等处理者结束、执行到外层花括号末尾时，`outer` 才正常销毁，把计数减至 `0`。这里的三个析构动作原因并不相同：

| 对象 | 何时销毁 | 当前触发原因 |
| --- | --- | --- |
| `second` | 进入处理者正文前，先于 `first` | 异常传播需要退出 `inspect_tire` |
| `first` | 进入处理者正文前，晚于 `second` | 同一次异常展开 |
| `outer` | 处理者执行结束后，外层作用域结束时 | 正常离开作用域 |

> [!IMPORTANT]
> 展开只清理控制转移需要离开的范围。判断某个对象是否销毁，要同时看它是否已完成构造，以及到达处理者是否需要退出它所在的作用域；不能把“抛出了异常”理解为所有局部对象立即销毁。

## 清理由析构承担，不必逐个调用点捕获

`inspect_tire` 没有编写 `catch`，两项登记仍然正确解除。它们的清理责任已经封装在局部对象里，异常展开负责触发销毁。只为解除这些登记而在每个调用处补一段捕获代码，反而重复了对象已经承担的责任。

如果把登记改成裸露的 `++count`，再把 `--count` 放在可能失败的调用之后，异常会跳过后一条语句。语言知道哪些对象需要销毁，却不知道某次数值递增在业务上必须配对哪次递减。

> [!PRACTICE]
> 一项资源取得后，如果后续操作可能失败，应及时把解除责任交给已经完成构造的对象。让析构负责固定的清理，让处理者决定业务上如何回应失败，两者可以处在不同层次。

这条建议仍然依赖资源对象自己的设计。本例没有复制或移动登记，且外部 `count` 比所有登记对象活得更久；RAII 不会替一个错误的析构动作修复悬空访问或重复解除。

## 资源清理不等于撤销全部修改

本例计数回到原值，是因为析构函数明确执行了对应递减。如果检查过程中还修改了调用者的压力序列，销毁登记对象不会自动把序列改回去。

例如，在创建两项登记后先把已有采样值改为 `245.0`，再抛出异常，展开仍能解除登记；采样对象若位于没有退出的外层作用域中，修改后的值也仍然存在。语言没有为普通赋值保存一份自动恢复的历史。

因此，“没有遗漏资源清理”和“失败前后的数据完全相同”是不同的保证。前者可以由当前 RAII 对象完成，后者需要操作本身安排状态更新方式。

## 终止路径不能套用正常展开的保证

上述析构顺序以异常能够转移到处理者、沿途清理可以正常完成为前提。

> [!WARNING]
> 没有匹配的处理者时，语言会调用 `std::terminate`；调用前是否展开栈由实现规定，不能指望所有局部对象一定析构。展开过程中的析构函数如果又让异常从自身逃出，也会触发终止处理。

因此，析构中的输出仅用于本例观测，不能把“记录日志一定成功”当成一般资源清理的前提。

## 参考资料

- [C++23 工作草案：栈展开与对象销毁顺序](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：处理者进入与异常终止](https://timsong-cpp.github.io/cppwp/n4950/except.handle)
- [C++23 工作草案：异常处理无法继续时的终止规则](https://timsong-cpp.github.io/cppwp/n4950/except.terminate)
