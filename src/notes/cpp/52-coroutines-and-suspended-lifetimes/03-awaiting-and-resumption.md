---
title: 等待协议与恢复入口（Awaiting and Resumption）
date: 2026-10-08
order: 3
---

# 等待协议与恢复入口（Awaiting and Resumption）

`co_yield` 用于产出；`co_await` 用于按协议取得一次操作结果。语言提供暂停与恢复连接，具体等待条件、执行位置和错误报告由库协议决定。

## awaiter 决定当前操作如何继续

等待器（Awaiter）描述一次操作怎样判断就绪、安排暂停和取得结果。库可以直接提供等待器，也可以按协议由另一个对象取得它；这里从已经取得等待器开始观察执行过程。

先看使用位置。假定库提供名为 `reading` 的读取等待器，这次操作正常完成时得到整数 220。下面是放在协程函数体内的片段，所用协程返回类型须允许这项等待协议，并已包含 `<iostream>`：

```cpp
const int value = co_await reading;
std::cout << value << '\n'; // 正常取得结果后输出 220
```

`reading` 是等待对象，`co_await reading` 是取得结果的表达式，结果用于初始化 `value`。若协议让当前协程保持暂停，初始化尚未完成，下一行输出也尚未执行；等当前协程被合法恢复并取得结果后，才继续这段代码。

等待器通过三项操作连接这条表达式与暂停过程：

| 操作 | 主要作用 |
| --- | --- |
| await_ready() | 判断是否无需暂停即可取得结果 |
| await_suspend(handle) | 在暂停后接收当前协程恢复入口，安排后续关系 |
| await_resume() | 继续执行或无需暂停时，提供 co_await 的结果 |

`std::coroutine_handle` 位于 `<coroutine>`，访问特定协程状态；它本身是入口，不自动拥有状态。`resume()` 恢复，`destroy()` 销毁，`done()` 查询是否已到相应最终暂停。

## 就绪判断与暂停后的去向

首先调用 `await_ready()`。结果为 true 时，不调用 await_suspend，直接调用 `await_resume()`，并以它的返回值作为 co_await 的结果。结果为 false 时，**当前协程在调用 await_suspend 之前就已被视为暂停**，再把当前句柄交给它。

先沿上面的 `reading` 追踪一条正常路径。假定仍由同一线程驱动，`await_ready()` 返回 false，`await_suspend` 保存恢复入口并返回 true，不在函数体内部自行 resume 当前协程：

1. `await_ready()` 判断尚未就绪，当前协程先进入暂停状态。
2. `await_suspend(handle)` 取得当前句柄并保存它，返回 true；执行先返回调用者或本次恢复协程的代码。`value` 尚未完成初始化。
3. 驱动代码稍后通过保存的入口合法恢复当前协程，才调用 `await_resume()` 取得 220，完成 `value` 的初始化，再执行输出。

返回 true 是一种选择。保持上面的同线程前提、且不在 await_suspend 内部自行恢复当前协程时，其他返回形式对应以下去向：

| await_suspend 的返回形式 | 当前执行接下来怎样继续 |
| --- | --- |
| 返回 void | 当前协程保持暂停，控制返回调用者或本次恢复它的代码 |
| 返回 bool，值为 true | 同样保持暂停，控制返回调用者或恢复者 |
| 返回 bool，值为 false | 立即恢复当前协程，调用 await_resume，然后继续 co_await 后的代码 |
| 返回 coroutine_handle | 语言恢复返回句柄所指的协程；若指向另一协程，当前协程仍保持暂停 |

若 `reading` 的 `await_ready()` 返回 true，就跳过 await_suspend，直接由 await_resume 得到 220。若 await_ready 返回 false，而 await_suspend 返回 false，会经过暂停与立即恢复这一步，仍在本次执行中取得 220、初始化 `value` 并继续输出；不必等外部驱动代码稍后恢复。

**await_resume 负责取得结果，并不负责发起恢复。**它也可以返回 void 或抛出异常；若 await_suspend 本身抛出异常，语言恢复当前协程并在 co_await 处重新抛出该异常，这条路径不调用 await_resume。

调度器、线程切换和 I/O 完成不是关键字自动提供的服务。保持暂停的等待器必须与调用方约定谁在条件满足后恢复协程，否则暂停本身不会让工作继续。

## 当前恢复入口有严格前提

只能恢复仍存活、已暂停且未完成到禁止恢复状态的协程；不能并发恢复同一状态，也不能恢复已经销毁的帧。句柄看起来非空不证明它仍有效。

等待器内部发布句柄给另一线程时，还需另外证明同步与状态寿命；本章生成器和自定义协议均由同一线程顺序驱动，不需要靠多线程才能理解协程。

> [!IMPORTANT]
> co_await 表达协议调用，不统一表示阻塞当前线程。恢复在哪里发生、结果何时可用、谁销毁状态，都必须由返回类型和等待器契约给出。

std::future 在标准中并非自动可 co_await 的类型；std::generator 也不接受任意等待器作为通用异步任务。能调用一个普通函数，不代表其结果已经满足协程等待协议。

## 参考资料

- [C++23 工作草案：co_await](https://timsong-cpp.github.io/cppwp/n4950/expr.await)
- [C++23 工作草案：协程句柄](https://timsong-cpp.github.io/cppwp/n4950/coroutine.handle)
