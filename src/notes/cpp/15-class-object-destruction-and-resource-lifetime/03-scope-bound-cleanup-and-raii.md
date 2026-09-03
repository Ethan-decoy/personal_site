---
title: 作用域绑定清理与 RAII（Scope-Bound Cleanup and RAII）
date: 2026-09-03
order: 3
---

# 作用域绑定清理与 RAII（Scope-Bound Cleanup and RAII）

有些程序状态需要成对改变：开始一次外部登记后，使用结束时必须解除登记；临时占用某项设备状态后，离开相应操作范围时必须恢复。这里把这种必须在使用结束后完成配对动作的状态称为资源（resource）。资源强调的是程序承担的结束责任，不限定为某一种存储或外部设施。

## 手动配对容易遗漏退出路径

下面的函数用一个计数表示当前活动的校准登记数量。进入函数后递增计数表示登记开始，正常完成前递减计数表示登记结束：

```cpp
bool inspect_tire_manually(bool sensor_ready, int& active_registration_count) {
    ++active_registration_count;

    if (!sensor_ready) {
        return false;
    }

    --active_registration_count;
    return true;
}
```

当 `sensor_ready` 为 `false` 时，函数直接返回，没有执行对应的递减。调用结束后已经没有活动检查，计数却仍然多出一项登记。每次增加提前返回路径时都依靠调用者手动复制清理语句，会让正确性取决于所有控制流分支是否恰好没有遗漏。

这里的问题不是 `return` 绕过了对象销毁。当前代码没有把登记责任放进对象，因此语言找不到一项需要随作用域结束而执行的析构动作。

## 让对象生命周期承载清理责任

资源获取即初始化（Resource Acquisition Is Initialization, RAII）把成对责任封装进对象生命周期：对象初始化时建立有效的资源关系，销毁时执行相应的释放动作。

```cpp
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

bool inspect_tire(bool sensor_ready, int& active_registration_count) {
    calibration_registration current_registration{active_registration_count};

    if (!sensor_ready) {
        return false;
    }

    return true;
}
```

`current_registration` 构造完成后，计数已经递增，对象的存在表示本次登记仍然有效。无论函数选择 `return false;` 还是 `return true;`，返回结果建立后都要离开函数作用域；局部对象随后销毁，其析构函数把计数递减。调用者不再需要在每条返回路径上重复这项动作。

RAII 不是一项新的存储期，也不会改变 `return` 的控制流含义。它利用已经存在的构造、析构和自动存储期规则，把“必须执行的清理”变成局部对象销毁过程的一部分。

**作用域绑定清理（scope-bound cleanup）的关键不是少写一条语句，而是让已经完成构造的对象在每条离开其作用域的正常控制路径上承担同一项析构责任。**

## 一次构造对应一次析构责任

`calibration_registration` 的构造函数为计数增加一项登记，析构函数则解除一项登记。若使用默认成员复制，新的对象只会复制 `active_count_target` 的指向关系，不会重新执行一次递增；两个对象随后却会分别析构，使同一项登记被解除两次。

这个类型没有定义“复制一项登记”应当建立什么新资源关系，因此明确删除复制构造和复制赋值。删除复制不是 RAII 的固定语法要求，而是当前资源语义的结果：一项只能解除一次的登记责任不能由成员复制伪造出第二份。

## RAII 不延长外部对象的生命周期

`active_count_target` 保存指向调用者计数对象的非拥有关系。析构函数能够安全递减计数，前提是目标对象仍然处于生命周期内。在当前调用中，计数对象由调用者先建立，`current_registration` 是更内层的函数局部对象，因此后者销毁时目标仍然有效。

把一项清理动作放进析构函数，不会自动延长所有关联对象的生命周期，也不会让悬空指针变得可用。RAII 保证的是自身承担的动作随自身销毁执行；这项动作访问的外部对象仍须满足原有的指针与生命周期约束。

**RAII 用对象生命周期表达资源责任：成功构造建立责任，对象存活表示责任有效，析构结束责任。只有资源关系和所有被访问对象的生命周期同时正确，这项自动清理才真正安全。**

## 参考资料

- [C++23 工作草案：析构函数](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
- [C++23 工作草案：声明语句中的控制转移与销毁](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++ Core Guidelines：使用资源句柄和 RAII 自动管理资源](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rr-raii)
