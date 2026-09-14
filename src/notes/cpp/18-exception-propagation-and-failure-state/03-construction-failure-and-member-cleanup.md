---
title: 构造失败与成员清理（Construction Failure and Member Cleanup）
date: 2026-09-12
order: 3
---

# 构造失败与成员清理（Construction Failure and Member Cleanup）

一个校准会话包含两项状态：已经建立的登记，以及通过校验的压力设置。如果登记成功之后，压力设置在构造时拒绝了输入，整个会话还没有构造完成，登记却已经真实存在。

这里需要区分两个完成时点：**成员可以先完成构造，包含它的外层对象仍在初始化。** 清理责任取决于失败时哪些对象已经构造完成。

## 对象尚未构造完成，成员也可能需要清理

本篇采用由当前构造函数直接初始化成员的方式。如果成员初始化或构造函数体因异常而退出，正在构造的对象尚未构造完成，不会调用它自身的析构函数。已经完成构造的成员则要销毁，顺序与它们构造完成的顺序相反。

这与[异常展开中的局部对象清理](02-stack-unwinding-and-scope-cleanup.md)使用相同的判断依据：清理已经构造完成的对象；仅仅出现对象声明，并不代表它已经完成初始化。

下面的 `calibration_session` 按成员声明顺序，先构造登记 `entry`，再构造压力设置 `setting`。`pressure_setting` 只接受 `0.0` 到 `500.0` kPa 范围内的值，范围条件不成立就抛出 `calibration_error`。

示例中计数目标始终有效，且不会溢出；析构中的输出只用于区分完整会话是否曾经建成，假定输出正常完成。

```cpp
#include <iostream>

struct calibration_error {
    double value_kpa;
};

class calibration_registration {
  public:
    explicit calibration_registration(int& count) : counter{&count} {
        ++(*counter);
    }

    calibration_registration(const calibration_registration&) = delete;
    calibration_registration& operator=(const calibration_registration&) = delete;

    ~calibration_registration() {
        --(*counter);
    }

  private:
    int* counter;
};

class pressure_setting {
  public:
    explicit pressure_setting(double value_kpa) : value{value_kpa} {
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
    calibration_session(int& count, double value_kpa) : entry{count}, setting{value_kpa} {}

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

程序输出：

```text
rejected 520: 0
ready 240: 1
session destroyed
finished: 0
```

## 失败发生在哪一步，决定谁已承担清理责任

构造 `failed` 时，`entry` 先完成构造，把 `count` 从 `0` 改为 `1`。接着 `setting` 的构造函数发现 `520.0` 不满足范围条件，抛出异常。

此时对象的完成情况如下：

| 对象 | 失败时的状态 | 这条路径上的清理 |
| --- | --- | --- |
| `entry` | 已完成构造，承担一项登记责任 | 调用其析构函数，把计数减回 `0` |
| `setting` | 自身构造函数尚未正常完成 | 不调用 `pressure_setting` 的析构函数；其已完成初始化的成员按规则清理 |
| 完整的 `failed` | 仍在初始化成员，尚未构造完成 | 不调用 `calibration_session` 的析构函数 |

同一规则也适用于成员对象 `setting`：它没有完成构造，所以不调用自己的析构；它已初始化的 `double` 成员没有用户编写的析构动作。处理者开始执行时，`entry` 已经解除登记，因此看到计数为 `0`。

如果类在 `setting` 之后还声明了其他成员，那么这些成员在本次失败中尚未开始初始化，也没有一项已经成立的析构责任。成员顺序依据类中的声明顺序，不能靠调换成员初始化列表的书写顺序改变。

构造 `ready` 时，两项成员和完整对象都成功建立。正常离开作用域会先执行 `calibration_session` 的析构函数体，输出 `session destroyed`，再销毁成员，最终由 `entry` 把计数减回 `0`。因此程序只输出一次完整会话的析构信息。

> [!IMPORTANT]
> 对于本篇直接初始化成员的构造方式，异常中止初始化时，不调用尚未构造完成的对象自身的析构函数，但要销毁已完成构造的成员。资源责任由这些成员承担时，外层对象构造失败也能触发清理。

## 仅把解除动作放进外层析构仍会遗漏

如果省去 `calibration_registration`，改为在会话构造函数体中直接递增计数，再由会话析构函数递减，失败路径会出现缺口。

下面的片段展示这一错误设计的构造与析构定义。它们位于一个名为 `manual_session` 的类中，该类具有 `int* counter;` 成员；`calibration_error` 的定义与上例相同：

```cpp
manual_session(int& count, double value_kpa) : counter{&count} {
    ++(*counter);

    if (!(value_kpa >= 0.0 && value_kpa <= 500.0)) {
        throw calibration_error{value_kpa};
    }
}

~manual_session() {
    --(*counter);
}
```

以初值为 `0` 的计数和 `520.0` 构造该对象时，递增已经发生，随后构造函数抛出异常。完整对象没有建成，`~manual_session()` 不会运行；指针成员本身也不承担解除登记的动作。捕获之后，计数仍为 `1`。

这说明 RAII 不能只看类里是否“写了一个析构函数”。采用 RAII 时，应让已完成构造的对象承担取得资源后的清理。上述错误的原因是递增之后仍有可能失败的步骤，而解除动作只存在于这条路径不会运行的外层析构中。

> [!PRACTICE]
> 能在取得资源前完成的简单校验，可以先完成；如果取得一项资源之后仍有可能失败的步骤，就让这项资源及时进入独立的 RAII 对象或成员。这样后续成员初始化和构造函数体失败，都能触发已有责任的清理。

## 失败意味着本次初始化没有交付对象

成功返回的构造函数应当建立类型承诺的有效状态。本例用异常拒绝无效压力，因此调用者不会获得一个“已经构造成功、但压力无效”的 `calibration_session`。

即使所有成员都已初始化完毕，只要这种构造函数的函数体仍因异常退出，该对象也没有完成构造；清理仍然从已完成构造的成员和局部对象着手。进入构造函数体与完成对象构造，是不同的时点。

## 参考资料

- [C++23 工作草案：构造失败时的子对象清理](https://timsong-cpp.github.io/cppwp/n4950/except.ctor)
- [C++23 工作草案：成员初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
- [C++23 工作草案：析构函数体与成员销毁](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
