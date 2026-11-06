---
title: 生成器与暂停执行（Generators and Suspended Execution）
date: 2026-10-08
order: 1
---

# 生成器与暂停执行（Generators and Suspended Execution）

一个函数要逐项提供读数，不必先收集全部结果。协程（Coroutine）可以暂停执行并保留状态，再从暂停位置继续；它不自动创建线程。

## generator 提供逐项读取契约

C++23 的 `std::generator<T>` 位于 `<generator>`，是同步、单遍的生成范围。`co_yield` 提供当前值并暂停；`co_return` 或相应正常结束完成生成。

```cpp
#include <generator>
#include <iostream>

std::generator<int> readings() {
    std::cout << "start\n";
    co_yield 220;
    co_yield 230;
    std::cout << "finish\n";
}

int main() {
    auto source = readings();
    std::cout << "created\n";
    for (const int value : source) {
        std::cout << value << '\n';
    }
}
```

输出依次为 created、start、220、230、finish。该 generator 调用先形成暂停状态；开始遍历时执行函数体，推进时继续到下一次产出或结束。

这是 generator 的协议选择，不是“全部协程都一调用就暂停”的语言通则。

> [!IMPORTANT]
> 协程把函数执行拆成多个继续点。generator 的遍历驱动继续，当前线程即可执行整个过程；暂停不代表另一个线程正在替它工作。

## 单遍读取不提供重复快照

generator 只能移动，不能普通复制；已经开始遍历后不能随意再次调用 begin 作为一轮全新生成。产出值的借用也可能只在当前暂停期间有效；保存独立结果时按值取得或存入容器。

需要 `<generator>` 的标准库支持；仅启用 C++23 语言模式不保证本地库已经实现它。

## 参考资料

- [C++23 工作草案：generator](https://timsong-cpp.github.io/cppwp/n4950/coro.generator)
- [C++23 工作草案：协程定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.coroutine)
