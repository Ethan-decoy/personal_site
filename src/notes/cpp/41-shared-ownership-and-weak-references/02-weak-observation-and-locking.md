---
title: 弱观察与临时拥有（Weak Observation and Temporary Ownership）
date: 2026-10-08
order: 2
---

# 弱观察与临时拥有（Weak Observation and Temporary Ownership）

观察者希望在对象仍存活时使用它，但不希望因为自己存在就阻止对象销毁。`std::weak_ptr<T>` 保存对共享所有权组的弱观察（Weak Observation），不增加共享拥有者计数。

## lock 将观察变成有期限的拥有

`weak.lock()` 尝试取得 shared_ptr。对象仍由共享拥有者维持时，返回一份临时拥有者；已不能取得拥有关系时，返回空 shared_ptr。检查与取得共同责任作为一项操作完成。

```cpp
#include <iostream>
#include <memory>

int main() {
    auto owner = std::make_shared<int>(220);
    std::weak_ptr<int> observer = owner;

    {
        const auto lease = observer.lock();
        owner.reset();
        if (lease) {
            std::cout << *lease << '\n'; // 220
        }
        std::cout << observer.expired() << '\n'; // 0
    }

    std::cout << observer.expired() << '\n';                 // 1
    std::cout << static_cast<bool>(observer.lock()) << '\n'; // 0
}
```

`lease` 在其作用域内维持目标。离开作用域后，最后的共享拥有者消失，整数对象销毁。observer 本身仍然存在，不能再恢复已结束的目标生命周期。

## expired 只是一项观察

`expired()` 判断共享拥有者是否已经全部消失。先检查它，再假定稍后仍可取得目标，是两项分离的操作；有其他执行线程参与时，状态可能在两者之间改变。

> [!IMPORTANT]
> 真正使用目标时直接尝试 lock，并持有所得 shared_ptr 到使用结束。弱观察不允许绕过临时拥有者直接解引用，也不能让已经销毁的对象复活。

所得目标仍须符合自己的访问与同步契约。lock 维持寿命，不为可修改成员加锁。

## 目标销毁与管理信息释放可以分开

共享拥有者归零后，目标对象结束生命周期；仍有 weak_ptr 时，所有权管理信息可能继续存在。make_shared 常采用联合分配，这可能使分配的存储保留到弱观察也释放，但**不表示目标对象还活着**。

## 参考资料

- [C++23 工作草案：weak_ptr 与 lock](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.weak)
- [C++23 工作草案：共享创建设施](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.shared.create)
