---
title: 一份最小协程拥有者（A Minimal Coroutine Owner）
date: 2026-10-08
order: 1
---

# 一份最小协程拥有者（A Minimal Coroutine Owner）

本篇在暂停、恢复与资源责任模型上解释生成接口如何连接语言协议。示例仅生成 int，协程体只在 co_yield 处中途暂停，由单线程依次调用 next；不实现标准 generator 的迭代器、嵌套产出等完整契约。

## promise_type 连接返回对象与执行阶段

返回类型的 `promise_type` 告诉语言怎样形成返回对象、选择初始与最终暂停、保存产出值和处理未捕获异常。这里的 promise 是协程协议对象，与 std::promise 的结果通道分别建模。

`std::suspend_always` 是每次请求暂停的基本等待器。最终也暂停，让拥有者稍后明确 destroy；它不是让状态在函数体结束时自行销毁。

移动构造使用 `<utility>` 中的 `std::exchange(object, replacement)`：它取出对象原值作为返回值，同时为对象赋入新值。这里 `std::exchange(source.state, {})` 返回源句柄，并把源句柄设为空；对 has_value 使用同样操作，将标记转交后把源设为 false。

`<exception>` 中的 `std::rethrow_exception` 把非空 exception_ptr 保存的异常重新抛出。本例先检查 failure，再在 next 的调用位置报告协程体中的失败。

```cpp
#include <cassert>
#include <coroutine>
#include <exception>
#include <iostream>
#include <utility>

class int_generator {
  public:
    struct promise_type {
        int current{};
        std::exception_ptr failure;

        int_generator get_return_object() {
            return int_generator{std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always initial_suspend() noexcept {
            return {};
        }
        std::suspend_always final_suspend() noexcept {
            return {};
        }
        std::suspend_always yield_value(int value) noexcept {
            current = value;
            return {};
        }
        void return_void() noexcept {}
        void unhandled_exception() noexcept {
            failure = std::current_exception();
        }
    };

    int_generator(const int_generator&) = delete;
    int_generator& operator=(const int_generator&) = delete;
    int_generator& operator=(int_generator&&) = delete;

    int_generator(int_generator&& source) noexcept
        : state{std::exchange(source.state, {})},
          has_value{std::exchange(source.has_value, false)} {}

    ~int_generator() {
        if (state) {
            state.destroy();
        }
    }

    bool next() {
        has_value = false;
        if (!state || state.done()) {
            return false;
        }
        state.resume();
        if (state.promise().failure) {
            std::rethrow_exception(state.promise().failure);
        }
        has_value = !state.done();
        return has_value;
    }

    int value() const {
        assert(has_value);
        return state.promise().current;
    }

  private:
    explicit int_generator(std::coroutine_handle<promise_type> handle) : state{handle} {}
    std::coroutine_handle<promise_type> state;
    bool has_value{false};
};

int_generator readings() {
    co_yield 220;
    co_yield 230;
}

int main() {
    auto source = readings();
    while (source.next()) {
        std::cout << source.value() << '\n';
    }
}
```

输出 220、230。先沿这一次 `readings()` 调用追踪接口与语言协议怎样接上：

| 调用阶段 | 协程执行到哪里 | 拥有者看到的状态与结果 |
| --- | --- | --- |
| 创建 `source` | `get_return_object()` 交出句柄，`initial_suspend()` 请求暂停，尚未进入函数体 | 有句柄，`has_value` 为 false，尚不能读取值 |
| 第一次 `next()` | `resume()` 进入函数体；`co_yield 220` 调用 `yield_value(220)` 保存 220，然后暂停 | 帧未完成，`has_value` 设为 true；`next()` 返回 true，`value()` 读取 220 |
| 第二次 `next()` | 从上次产出之后恢复；`yield_value(230)` 保存 230，然后暂停 | 再次返回 true，`value()` 读取 230 |
| 第三次 `next()` | 从第二次产出之后恢复，函数体结束，调用 `return_void()`，到 `final_suspend()` 暂停 | `done()` 为 true，`has_value` 为 false，`next()` 返回 false，循环结束 |
| `source` 析构 | 对仍拥有的句柄调用 `destroy()` | 释放协程状态，完成唯一的销毁责任 |

每次 `next()` 先清除上次的值有效标记，再恢复；`value()` 要求上次 `next()` 成功。**本例以“帧未最终完成”判断有新值，依赖协程体只在 `co_yield` 处中途暂停这一约定。**若允许在其他 `co_await` 处暂停，`!done()` 本身不证明刚产出了值，接口就需要额外的产出状态。

协程体抛出未捕获异常时，`unhandled_exception()` 保存失败，恢复返回后由 `next()` 在驱动位置重新抛出；它不会报告一次成功产出。拥有者析构仍负责释放自己保持的状态。

## 协程帧必须恰好有一份销毁责任

移动转交句柄并清空源，禁止复制避免重复 destroy。状态到最终暂停后不能再 resume，拥有者仍须销毁它。普通 coroutine_handle 的复制本身不会提供这些保护。

> [!IMPORTANT]
> 语言协议负责暂停点与 promise 调用；返回对象负责用户接口和帧的拥有关系。实现协程类型的核心是状态机与生命周期，不能只把几个协议函数名凑齐。

## 参考资料

- [C++23 工作草案：协程函数变换与 promise](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.coroutine)
- [C++23 工作草案：协程句柄操作](https://timsong-cpp.github.io/cppwp/n4950/coroutine.handle)
- [C++23 工作草案：exchange](https://timsong-cpp.github.io/cppwp/n4950/utility#utility.exchange)
- [C++23 工作草案：保存与重新抛出异常](https://timsong-cpp.github.io/cppwp/n4950/propagation)
