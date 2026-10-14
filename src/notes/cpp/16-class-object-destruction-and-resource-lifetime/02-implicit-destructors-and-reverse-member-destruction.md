---
title: 隐式析构函数与成员逆序销毁（Implicit Destructors and Reverse Member Destruction）
date: 2026-09-03
order: 2
---

# 隐式析构函数与成员逆序销毁（Implicit Destructors and Reverse Member Destruction）

完整对象的析构函数体只负责这个类直接规定的动作。函数体完成后，语言还会继续销毁完整对象中的成员子对象；类作者不需要在析构函数体中逐个调用成员的析构函数。

```cpp
#include <iostream>

class sensor_channel {
  public:
    explicit sensor_channel(int channel_number) : channel_number{channel_number} {}

    ~sensor_channel() {
        std::cout << "destroy channel " << channel_number << '\n';
    }

  private:
    int channel_number;
};

class tire_monitor {
  public:
    tire_monitor() : front_channel{1}, rear_channel{2} {}

    ~tire_monitor() {
        std::cout << "finish monitor body\n";
    }

  private:
    sensor_channel front_channel;
    sensor_channel rear_channel;
};

int main() {
    tire_monitor monitor{};
}
```

程序输出：

```text
finish monitor body
destroy channel 2
destroy channel 1
```

## 析构函数体先于成员销毁

`main` 结束时，`monitor` 到达销毁边界。程序先执行 `tire_monitor::~tire_monitor()` 的函数体，因此第一行输出来自完整对象自己的析构动作。

函数体完成后，`rear_channel` 与 `front_channel` 才分别进入销毁过程。析构函数体不需要显式提到这两个成员；成员销毁是完整对象析构过程的一部分，不是函数体碰巧调用的普通操作。

**进入完整对象的析构函数体时，其成员子对象尚未自动销毁；函数体完成后，语言再继续销毁成员子对象。**这使类特定的结束动作仍然能够读取成员状态，同时保证成员自身的析构责任最终得到执行。

## 成员按照构造完成顺序的反序销毁

`front_channel` 在类定义中先声明，`rear_channel` 后声明，因此构造 `tire_monitor` 时先完成前者的初始化，再完成后者的初始化。销毁按照构造完成顺序的相反顺序进行，所以先销毁 `rear_channel`，再销毁 `front_channel`。

> [!TIP]
> 成员初始化列表的书写顺序不能改变这项关系。构造顺序由成员声明顺序决定，成员销毁则反向使用同一顺序：
>
> ```text
> 构造：front_channel → rear_channel → tire_monitor 构造函数体
> 销毁：tire_monitor 析构函数体 → rear_channel → front_channel
> ```
>
> 这项逆序关系允许较晚构造的成员在销毁时继续使用较早构造、尚未销毁的成员。若成员之间存在生命周期依赖，声明顺序同时决定构造和销毁两端的有效关系，不能只为了排版随意排列。

## 默认析构仍然销毁成员

如果 `tire_monitor` 没有额外的类特定销毁动作，可以明确采用默认析构语义：

```cpp
class tire_monitor {
  public:
    tire_monitor() : front_channel{1}, rear_channel{2} {}

    ~tire_monitor() = default;

  private:
    sensor_channel front_channel;
    sensor_channel rear_channel;
};
```

`= default` 请求语言定义默认化的析构函数。这个函数没有自定义函数体，但销毁 `tire_monitor` 时仍会依次销毁两个 `sensor_channel` 成员。若连 `~tire_monitor() = default;` 也不声明，编译器会为当前类隐式声明一个默认化的析构函数，成员销毁关系仍然存在。

因此，没有手写析构函数不等于没有销毁过程。只要成员类型本身正确管理销毁，外围类通常可以让这种责任通过对象组合自动传递。

## 默认析构不能绕过成员约束

默认化的析构函数能够成立，仍然要求相应成员子对象可以完成销毁。若某个类类型成员的析构函数被删除，或者从外围类的析构语境不可访问，语言不能为外围类生成一条绕过该成员的清理路径；外围类的默认化析构函数会被定义为删除的。

当一项对象定义、临时对象创建或其他操作可能需要调用这个已删除的析构函数时，程序不合法。即使执行路径看起来很快离开对象所在位置，也不能以“来不及使用对象”为理由省略一项必须成立的销毁操作。

**完整对象的默认析构由成员各自的析构语义组合而成：析构函数体先完成，成员随后按构造完成顺序的反序销毁；成员无法销毁时，外围类也不能获得一份假装成功的默认析构。**

## 参考资料

- [C++23 工作草案：析构函数与成员销毁顺序](https://timsong-cpp.github.io/cppwp/n4950/class.dtor)
- [C++23 工作草案：基类与成员初始化顺序](https://timsong-cpp.github.io/cppwp/n4950/class.base.init)
