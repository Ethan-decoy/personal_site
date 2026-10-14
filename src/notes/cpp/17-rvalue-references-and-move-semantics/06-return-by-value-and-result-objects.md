---
title: 按值返回与结果对象（Return by Value and Result Objects）
date: 2026-09-12
order: 6
---

# 按值返回与结果对象（Return by Value and Result Objects）

函数按值返回类对象时，调用者可以取得自己的结果。但“取得一个结果”不意味着函数必须先建立一个临时对象，再把它移动给调用者。对于同一种类类型的纯右值初始化，结果可以直接在接收它的对象中建立。

这里讨论返回类型为类类型、调用结果用于初始化普通变量的情形。判断的起点是：返回表达式是在描述怎样建立结果，还是在指定一个已经存在的源对象。

## 返回表达式可以直接构造接收对象

纯右值的结果对象（result object），就是由这次求值初始化的对象。它不一定是一个先于接收变量存在的独立临时对象。

下面的登记类型在构造时增加活动计数，在销毁时解除登记。为了看清按值返回是否必须依靠复制或移动，这个定义把两种构造接口都明确删除了：

```cpp
#include <iostream>

class registration {
  public:
    explicit registration(int& count) : counter{&count} {
        ++(*counter);
    }

    registration(const registration&) = delete;
    registration(registration&&) = delete;

    ~registration() {
        --(*counter);
    }

  private:
    int* counter;
};

registration begin_registration(int& count) {
    return registration{count};
}

int main() {
    int count{0};

    {
        registration entry{begin_registration(count)};
        std::cout << count << '\n';
    }

    std::cout << count << '\n';
}
```

`registration{count}` 是 `registration` 类型的纯右值表达式；`begin_registration(count)` 也按值产生同类型的纯右值结果。这里的 `entry` 就是接收结果的对象：`registration(int&)` 直接初始化它，没有另一项登记先在函数内部建立、再通过复制或移动交给它。

`entry` 构造后计数为 `1`，离开内层作用域时销毁，计数恢复为 `0`。函数返回时不会先解除这项登记，因为在该次返回中构造的就是调用者的 `entry`。外部计数对象仍须比登记对象活得更久，按值返回没有改变这项借用关系。

> [!IMPORTANT]
> 用同类纯右值初始化这里的结果对象时，语言规则让初始化直接作用于目标。即使类型不能从已有对象复制或移动，这种按值返回仍然可以成立。
>
> 这不是“编译器碰巧省去一次移动”的运行结果；示例根本没有可调用的复制或移动构造函数。

这项直接构造规则自 C++17 起成立，本文以 C++23 为准。资料中常把它称为“保证的复制省略（guaranteed copy elision）”，但理解代码时应保留对象模型：此处没有一个必须先存在、随后才能被省略转移的源对象。

## 初始化形式不等于实际复制

`return` 以复制初始化的规则初始化调用结果；复制初始化（copy-initialization）这个名称并不要求执行复制构造。在上面的同类纯右值情形中，它直接建立结果。

下面这条声明可以替换程序中 `entry` 的声明：

```cpp
registration entry = begin_registration(count);
```

声明中的 `=` 仍然是初始化语法。它没有先默认构造 `entry`，也不会因为采用这种写法而多出一次复制。

直接构造保证针对的是这条初始化关系，不代表函数或构造函数内部没有工作。登记仍然要递增计数；如果构造的是采样序列，序列仍然要建立自己的元素。省去额外的对象转交，不能省去结果本身所需要的数据和资源。

## 赋值面对的是已经存在的目标

如果目标对象已经存在，返回结果就要交给它的赋值操作。下面用已具备移动赋值能力的采样序列作对照：

```cpp
#include <iostream>
#include <vector>

std::vector<double> make_samples() {
    return std::vector<double>{240.0, 245.0, 250.0};
}

int main() {
    std::vector<double> created{make_samples()};

    std::vector<double> existing{200.0};
    existing = make_samples();

    std::cout << created.size() << ' ' << existing[0] << '\n';
}
```

两次调用都按值产生序列，调用位置却承担不同的任务：

| 调用位置 | 结果对象与接收方的关系 | 后续操作 |
| --- | --- | --- |
| `std::vector<double> created{make_samples()};` | `created` 自身就是调用的结果对象 | 直接完成 `created` 的初始化 |
| `existing = make_samples();` | 调用结果物化为临时序列，`existing` 已经存在 | 临时结果绑定到移动赋值的右值引用形参，执行赋值 |

第二种情形中，移动赋值还要处理 `existing` 原来的状态。临时结果在整条赋值表达式结束时销毁；`existing` 保持原来的对象身份，并管理赋值后取得的元素。因此程序输出 `3 240`。

同类纯右值的直接构造不能用来绕过赋值接口。对于上一个程序中不可复制、不可移动的 `registration`，结果可以直接初始化一个新变量，不代表它也能替换一个已有变量的状态。

## 直接构造仍有类型与生命周期边界

保证成立的关键是同类纯右值与目标初始化的关系。返回一个已经命名的局部对象，或者让结果参与另一种类型的构造，需要按对应规则判断，不能只看函数签名上写了按值返回就断定没有复制或移动。

析构也必须合法。结果对象的析构函数在返回处以及需要销毁它的位置都必须可访问，且不能被删除；没有发生中间对象的复制或移动，不等于不再需要处理结果的最终销毁。

> [!PRACTICE]
> 函数要交付一个新结果，且所需状态可以在返回表达式中直接构造时，可以自然地按值返回。不要为了想象中的中间副本改成返回局部引用，也不必给纯右值结果套上 `std::move`。
>
> 把纯右值传给 `std::move` 时，需要先物化一个临时对象，让它绑定到引用形参；`std::move` 再把这个已有临时对象作为将亡值交给接收方。目标因此可能重新要求可用的移动或复制构造，不能继续套用原来的同类纯右值直接构造关系。

## 参考资料

- [C++23 工作草案：纯右值与结果对象](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：同类纯右值初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init#general-16.6.1)
- [C++23 工作草案：返回结果的初始化与析构要求](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++23 工作草案：临时对象物化](https://timsong-cpp.github.io/cppwp/n4950/conv.rval)
