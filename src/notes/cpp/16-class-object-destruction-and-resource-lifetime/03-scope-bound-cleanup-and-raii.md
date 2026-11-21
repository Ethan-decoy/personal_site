---
title: 作用域绑定清理与 RAII（Scope-Bound Cleanup and RAII）
date: 2026-09-03
order: 3
---

# 作用域绑定清理与 RAII（Scope-Bound Cleanup and RAII）

有些程序状态需要成对改变：开始一次外部登记后，使用结束时必须解除登记；临时占用某项设备状态后，离开相应操作范围时必须恢复。这里把这种必须在使用结束后完成配对动作的状态称为资源（resource）。资源强调的是程序承担的结束责任，不限定为某一种存储或外部设施。

## 手动配对容易遗漏退出路径

下面是独立的完整程序，用计数表示当前活动的校准登记数量。进入检查函数后递增计数表示登记开始，正常完成前递减计数表示登记结束。`main` 分别用两个初值为 `2` 的计数考察提前返回与正常返回，表示每次调用前都已有两项其他登记；两个调用互不影响：

```cpp
#include <iostream>

bool inspect_tire_manually(const bool sensor_ready, int& active_registration_count) {
    ++active_registration_count;

    if (!sensor_ready) {
        return false;
    }

    --active_registration_count;
    return true;
}

int main() {
    int early_count{2};
    const bool early_result{inspect_tire_manually(false, early_count)};
    std::cout << early_result << ' ' << early_count << '\n';

    int normal_count{2};
    const bool normal_result{inspect_tire_manually(true, normal_count)};
    std::cout << normal_result << ' ' << normal_count << '\n';
}
```

程序输出：

```text
0 3
1 2
```

每行先输出返回值（`0` 表示 `false`，`1` 表示 `true`），再输出返回后的计数。第一行对应 `sensor_ready` 为 `false` 的提前返回：函数漏掉递减，因此计数从 `2` 增到 `3` 后没有恢复。第二行对应正常返回，计数恢复为 `2`。

提前返回的调用结束后，本次检查已经不再活动，计数却仍然多出一项登记。每次增加提前返回路径时都手动补上清理语句，会让正确性取决于所有控制流分支是否恰好没有遗漏。

这里的问题不是 `return` 绕过了对象销毁。当前代码没有把登记责任放进对象，因此语言找不到一项需要随作用域结束而执行的析构动作。

## 让对象生命周期承载清理责任

> [!IMPORTANT] 对象生命周期承载资源责任
> **资源获取即初始化（Resource Acquisition Is Initialization, RAII）把成对责任绑定到对象生命周期：通过初始化建立有效的资源状态，在对象销毁时完成它仍然承担的清理。**
>
> 已经完成构造的自动存储期类对象，在每条正常离开其作用域的控制路径上都会进入析构过程。让清理随这一边界执行，称为作用域绑定清理（scope-bound cleanup）。

下面是另一份独立的完整程序，与手动版本分别运行。`calibration_registration` 在构造时登记、析构时解除，`main` 沿用相同的初始计数与两种调用条件：

```cpp
#include <iostream>

class calibration_registration {
  public:
    explicit calibration_registration(int& active_registration_count)
        : active_count_target{&active_registration_count} {
        ++(*active_count_target);
    }

    calibration_registration(const calibration_registration&) = delete;
    calibration_registration& operator=(const calibration_registration&) = delete;

    ~calibration_registration() {
        --(*active_count_target);
    }

  private:
    int* active_count_target;
};

bool inspect_tire(const bool sensor_ready, int& active_registration_count) {
    const calibration_registration current_registration{active_registration_count};

    if (!sensor_ready) {
        return false;
    }

    return true;
}

int main() {
    int early_count{2};
    const bool early_result{inspect_tire(false, early_count)};
    std::cout << early_result << ' ' << early_count << '\n';

    int normal_count{2};
    const bool normal_result{inspect_tire(true, normal_count)};
    std::cout << normal_result << ' ' << normal_count << '\n';
}
```

程序输出：

```text
0 2
1 2
```

输出列的含义与前一程序相同。两种返回结果仍分别为 `false` 和 `true`，但返回后的计数都恢复为 `2`：本次新增的登记被解除，原有的两项登记保留。

`current_registration` 构造完成时，计数由 `2` 增到 `3`，登记责任一直由它承担到析构。无论函数选择 `return false;` 还是 `return true;`，返回结果建立后都要离开函数作用域；局部对象随后销毁，其析构函数把计数递减为 `2`。每条返回路径都不再需要显式执行这项动作。

RAII 不是一项新的存储期，也不会改变 `return` 的控制流含义。它利用已经存在的构造、析构和自动存储期规则，把“必须执行的清理”变成局部对象销毁过程的一部分。

## 一次构造对应一次析构责任

`calibration_registration` 的构造函数为计数增加一项登记，析构函数则解除一项登记。若使用默认成员复制，新的对象只会复制 `active_count_target` 的指向关系，不会重新执行一次递增；两个对象随后却会分别析构，使同一项登记被解除两次。

这个类型没有定义“复制一项登记”应当建立什么新资源关系，因此明确删除复制构造和复制赋值。删除复制不是 RAII 的固定语法要求，而是当前资源语义的结果：一项只能解除一次的登记责任不能由成员复制伪造出第二份。

## RAII 不延长外部对象的生命周期

`active_count_target` 保存指向调用者计数对象的非拥有关系，登记对象负责解除本次登记，不负责结束计数对象的生命周期。

> [!IMPORTANT] 清理动作访问的外部对象必须仍然有效
> **RAII 不会自动延长所借用对象的生命周期。**析构中的清理动作通过指针或引用访问外部对象时，目标仍须处于生命周期内；把动作放进析构函数，不会让悬空关系变得可用。

在上面的 `main` 中，`early_count` 与 `normal_count` 分别在调用 `inspect_tire` 前建立。函数内的 `current_registration` 先随函数返回而销毁，调用者中的计数对象随后仍然存在，因此析构时能够安全递减目标计数。

## 参考资料

- [C++23 工作草案：析构函数](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
- [C++23 工作草案：声明语句中的控制转移与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++23 工作草案：返回结果与局部对象销毁的顺序](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++ Core Guidelines：使用资源句柄和 RAII 自动管理资源](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii)
