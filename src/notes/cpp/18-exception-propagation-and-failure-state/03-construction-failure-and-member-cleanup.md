---
title: 构造失败与成员清理（Construction Failure and Member Cleanup）
date: 2026-09-12
order: 3
---

# 构造失败与成员清理（Construction Failure and Member Cleanup）

一个校准会话包含一项登记和一个经过校验的压力设置。如果压力设置在构造时拒绝输入，会话尚未构造完成，先建立的登记已经生效。

这里需要区分两个完成时点：**成员可以先完成构造，包含它的外层对象仍在初始化。** 清理责任取决于失败时哪些对象已经构造完成。

## 对象尚未构造完成，成员也可能需要清理

示例中的构造函数各自负责初始化成员，属于非委托构造函数（non-delegating constructor）。

> [!IMPORTANT] 构造失败时如何清理已完成的成员
> **非委托构造期间，成员初始化或构造函数体因异常退出时，已完成构造的成员在展开中按构造完成的逆序销毁。** 外层对象尚未完成构造，它自身的析构函数不会运行。

这与[异常展开中的局部对象清理](02-stack-unwinding-and-scope-cleanup.md#从抛出位置到处理者需要销毁退出范围中的对象)使用同样的判断依据。清理时要看相关对象的初始化是否已经完成。

下面的 `calibration_session` 按非静态数据成员的声明顺序，先构造登记 `entry`，再构造压力设置 `setting`。`pressure_setting` 只接受 `0.0` 到 `500.0` kPa 的值，包含两个端点。范围条件不成立时抛出 `calibration_error`。

计数 `count` 在登记之前建立，并存活到登记完成析构。登记通过引用借用它，构造时递增，析构时递减。示例假定计数不会溢出，输出可以正常完成。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

class calibration_registration {
  public:
    explicit calibration_registration(int& count) : counter{count} {
        ++counter;
    }

    calibration_registration(const calibration_registration&) = delete;
    calibration_registration& operator=(const calibration_registration&) = delete;

    ~calibration_registration() {
        --counter;
    }

  private:
    int& counter;
};

class pressure_setting {
  public:
    explicit pressure_setting(const double value_kpa) : value{value_kpa} {
        if (!(value >= 0.0 && value <= 500.0)) {
            throw calibration_error{value};
        }
    }

    double value_kpa() const {
        return value;
    }

  private:
    double value;
};

class calibration_session {
  public:
    calibration_session(int& count, const double value_kpa) : entry{count}, setting{value_kpa} {}

    ~calibration_session() {
        std::cout << "session destroyed\n";
    }

    double value_kpa() const {
        return setting.value_kpa();
    }

  private:
    calibration_registration entry;
    pressure_setting setting;
};

int main() {
    int count{0};

    try {
        const calibration_session failed{count, 520.0};
        std::cout << "ready " << failed.value_kpa() << ": " << count << '\n';
    } catch (const calibration_error& error) {
        std::cout << "rejected " << error.value_kpa << ": " << count << '\n';
    }

    {
        const calibration_session ready{count, 240.0};
        std::cout << "ready " << ready.value_kpa() << ": " << count << '\n';
    }

    std::cout << "finished: " << count << '\n';
}
```

程序输出以下四行。

```text
rejected 520: 0
ready 240: 1
session destroyed
finished: 0
```

## 失败发生在哪一步，决定谁已承担清理责任

构造 `failed` 时，`entry` 先完成构造，把 `count` 从 `0` 改为 `1`。接着 `setting` 的构造函数发现 `520.0` 不满足范围条件，抛出异常。

进入处理者前，各对象的清理取决于构造进行到了哪一步。

| 对象 | 失败时的状态 | 这条路径上的清理 |
| --- | --- | --- |
| `entry` | 已完成构造，承担一项登记责任 | 调用其析构函数，把计数减回 `0` |
| `setting` | 自身构造函数尚未正常完成 | 其已完成初始化的成员按规则清理，`pressure_setting` 自身的析构函数不运行 |
| 会话对象 `failed` | 仍在初始化 `setting`，尚未构造完成 | `calibration_session` 自身的析构函数不运行 |

`setting` 已初始化的 `double` 成员没有可观察的析构动作。`entry` 的析构则会解除登记，因此处理者读到的计数为 `0`。

如果在 `setting` 之后还声明了非静态数据成员，失败时这些成员尚未开始初始化。它们的初始化顺序由类定义中的声明顺序确定，调换成员初始化列表的书写顺序也不会改变结果。

`ready` 正常离开作用域时，先执行 `calibration_session` 的析构函数体，输出 `session destroyed`，再依次销毁 `setting` 和 `entry`。`entry` 解除登记后，计数回到 `0`。

## 仅把解除动作放进外层析构仍会遗漏

在下面的独立程序中，`manual_session` 在构造函数体中递增计数，在析构函数体中递减计数。压力校验沿用相同的范围，计数仍从 `0` 开始。传入 `520.0` kPa 会在递增后触发异常。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

class manual_session {
  public:
    manual_session(int& count, const double value_kpa) : counter{count} {
        ++counter;

        if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
            throw calibration_error{value_kpa};
        }
    }

    manual_session(const manual_session&) = delete;
    manual_session& operator=(const manual_session&) = delete;

    ~manual_session() {
        --counter;
    }

  private:
    int& counter;
};

int main() {
    int count{0};

    try {
        const manual_session failed{count, 520.0};
    } catch (const calibration_error& error) {
        std::cout << "rejected " << error.value_kpa << ": " << count << '\n';
    }
}
```

程序输出一行。

```text
rejected 520: 1
```

`counter` 只借用计数，递减动作写在 `~manual_session()` 中。异常使构造中止时，外层对象的析构函数不会运行，处理者就读到了 `1`。上例在压力校验前已让 `entry` 承担解除责任，处理者读到的是清理后的 `0`。

> [!PRACTICE]
> 能在取得资源前做的简单校验，可以先完成。如果必须先取得资源，应在后续可能失败的步骤前，让一个 RAII 对象完成构造并承担解除责任。这样，后续成员初始化或构造函数体失败引起展开时，清理由已构造的 RAII 对象的析构函数执行。

## 失败意味着本次初始化没有交付对象

成功返回的构造函数应当建立类型承诺的有效状态。本例用异常拒绝无效压力，因此调用者不会获得一个“已经构造成功、但压力无效”的 `calibration_session`。

如果把失败点移到 `calibration_session` 的构造函数体，此时 `entry` 和 `setting` 都已完成构造。异常退出时，先销毁函数体中随栈展开而退出作用域的已构造局部对象，再依次销毁 `setting` 和 `entry`。会话自身的析构函数仍不会运行。

## 参考资料

- [C++23 工作草案：构造失败时的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：成员初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++23 工作草案：析构函数体与成员销毁](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
