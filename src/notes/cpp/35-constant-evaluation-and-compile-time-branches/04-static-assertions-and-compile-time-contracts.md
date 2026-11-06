---
title: 静态断言与编译期契约（Static Assertions and Compile-Time Contracts）
date: 2026-09-28
order: 4
---

# 静态断言与编译期契约（Static Assertions and Compile-Time Contracts）

一组压力预设能够计算出来，并不代表它符合项目的使用要求。例如，下界可能超过上界，也可能把允许区间配置得过宽。如果这些值属于固定配置，就可以要求编译程序时验证这些关系。

**静态断言（static assertion）是检查常量条件的声明：`static_assert(condition, "message");` 要求条件转换为 `bool` 后是值为 `true` 的常量表达式。**在需要检查这项断言时，条件不满足会使程序编译失败，而不是在运行时抛出异常。

## 用断言说明固定配置之间的关系

下面的完整程序把“有效压力区间”的判断写成 `constexpr` 函数，再用静态断言检查预设：

```cpp
#include <iostream>

constexpr bool valid_pressure_limits(int lower_kpa, int upper_kpa) {
    return 0 <= lower_kpa && lower_kpa <= upper_kpa && upper_kpa <= 400;
}

constexpr int minimum_pressure_kpa{220};
constexpr int maximum_pressure_kpa{260};

static_assert(valid_pressure_limits(minimum_pressure_kpa, maximum_pressure_kpa),
              "pressure limits must be ordered and lie within 0..400 kPa");
static_assert(maximum_pressure_kpa - minimum_pressure_kpa <= 60);

int main() {
    std::cout << minimum_pressure_kpa << ' ' << maximum_pressure_kpa << '\n';
}
```

程序输出 `220 260`。第一项断言表达合法范围，第二项断言表达项目要求：预设的区间宽度不能超过 `60 kPa`。二者都满足，因此程序可以继续编译；断言本身不产生运行期输出。

`static_assert` 是语言声明，不需要为它包含专用头文件。它可以放在命名空间作用域、类定义中或函数体内。消息可以省略，因此 `static_assert(condition);` 也是完整写法。C++23 的消息形式使用字符串字面量，不接受用运行期字符串拼接出的说明。

把程序中的上界改成 `300` 后，范围检查仍成立，但宽度变成 `80`，第二项断言失败。这样可以把“该值本身能计算”与“该值满足当前系统关系”分开：`constexpr` 建立常量求值要求，`static_assert` 表达额外的真假条件。

若把第一项断言改成以下形式，编译也会失败：

```cpp
static_assert(valid_pressure_limits(260, 220), "minimum pressure must not exceed maximum");
```

这里调用可以进行常量求值，但返回 `false`。编译器应在诊断中包含提供的消息文本，具体格式由实现决定。消息宜说明缺少的性质或违反的关系，使修改配置的人知道应该检查什么。

## 可以通过已有类接口检查对象

静态断言的条件也可以包含成员调用，只要整项条件满足常量表达式规则。沿用[常量构造示例中的 `pressure_limits` 定义](./03-constexpr-construction-and-class-objects.md#构造与查询共同组成常量表达式)，把以下声明放在该类定义之后、`main` 之前：

```cpp
constexpr pressure_limits preset{220, 260};

static_assert(preset.minimum_kpa() <= preset.maximum_kpa(), "preset bounds must be ordered");
static_assert(preset.contains(240), "preset must accept the nominal pressure");
```

第一项断言核对上下界关系，第二项断言核对业务上的标称压力。两项都通过公开查询接口读取状态，不需要把类的私有成员改成公开成员。

如果类的构造函数已经保证上下界有序，第一项可以省略；第二项仍有独立意义。类可以允许多种有效区间，而当前预设可能另有“必须接受 `240 kPa`”的用途。**类的不变式约束所有有效对象，配置断言可以进一步约束某个特定对象的用途。**

## 普通函数形参不是断言可直接读取的常量

`constexpr` 函数的一次调用可以成为常量表达式，但这不会把函数的普通形参自动变成定义内部可独立读取的常量。下面是一个完整但应当编译失败的函数定义：

```cpp
constexpr bool valid_pressure_limits(int lower_kpa, int upper_kpa) {
    static_assert(lower_kpa <= upper_kpa, "pressure limits must be ordered"); // 错误
    return 0 <= lower_kpa && upper_kpa <= 400;
}
```

断言需要自己满足常量条件要求，而读取这两个普通形参的值不满足该要求。即使程序只打算调用 `valid_pressure_limits(220, 260)`，也无法修复这个函数定义。

正确做法就是开头的写法：用普通 `return` 计算判断结果，再在调用处写 `static_assert(valid_pressure_limits(220, 260));`。检查的是整次函数调用；形参由这次常量求值中的实参初始化，随后可以参与计算。

如果函数既要接受固定配置，又要接受运行期输入，就让它照常返回判断结果，分别由调用方选择静态断言、运行期分支或错误处理方式。形参声明为 `const int` 也只是禁止函数内修改形参，并不能改变这项边界；C++ 还不允许把普通函数形参声明为 `constexpr`。

> [!WARNING]
> `static_assert` 检查编译期条件，不会在程序执行时检查输入，也不会抛出异常。把它放进普通 `if`，不能用“运行时不进入该分支”跳过编译检查；把它放进 `try`，也不能用 `catch` 恢复编译失败。

例如，下面这个独立程序即使条件恒为 `false`，仍会编译失败：

```cpp
int main() {
    if (false) {
        static_assert(220 > 260, "this declaration still needs checking");
    }
}
```

普通 `if` 决定执行哪条路径，不会让分支中的声明免于语言规则检查。静态断言一旦失败，程序就没有进入运行期再处理这项失败的机会。

## 依赖模板参数的断言按所需实例检查

[值模板参数](../32-class-templates-and-generic-types/04-value-template-parameters-and-defaults.md#用值决定固定批次的类型)则不同：形成具体模板实例时，`N` 已经代表确定的编译期值。可以在类定义中断言某个实例必须具有的内部性质。

下面的完整程序规定，一组校准读数至少包含两个采样点，以便比较首尾读数：

```cpp
#include <array>
#include <cstddef>
#include <iostream>

template <std::size_t N> class calibration_points {
    static_assert(N >= 2, "calibration requires at least two readings");

  public:
    explicit calibration_points(std::array<int, N> values) : stored{values} {}

    bool endpoints_equal() const {
        return stored.front() == stored.back();
    }

  private:
    std::array<int, N> stored;
};

int main() {
    const calibration_points<3> readings{{220, 240, 260}};
    std::cout << readings.endpoints_equal() << '\n';
}
```

程序输出 `0`。定义 `readings` 需要完整的 `calibration_points<3>`，因而实例化类定义并检查 `N >= 2`，此时条件为真。

在同一 `main` 中增加以下定义会编译失败，原因来自类内的断言：

```cpp
const calibration_points<1> insufficient{{240}}; // 错误：N >= 2 不成立
```

只把它换成指针声明则不需要完整类定义。下面片段可以放入原程序的 `main`，并额外输出 `1`：

```cpp
calibration_points<1>* unbuilt{nullptr};
std::cout << (unbuilt == nullptr) << '\n';
```

这里没有实例化 `calibration_points<1>` 的类定义，所以没有触发其中的断言。若继续创建对应对象，或进行其他要求完整类型的操作，就会遇到这项失败。检查位置遵守[类定义与成员定义的按需实例化规则](../32-class-templates-and-generic-types/03-class-instantiation-and-member-use.md#类类型完整与成员函数有定义是两层要求)：类体中的断言在类定义需要实例化时检查，成员函数体中的依赖断言则随所需的函数定义检查。

## 断言失败与不满足 requires 的职责不同

若“至少两个采样点”就是类模板公开的适用范围，可以用已经建立的 [requires 子句](../33-template-constraints-and-concepts/05-constraining-class-templates-and-members.md#类模板约束在形成类型名字时就需要满足)约束 `N >= 2`。这时形成 `calibration_points<1>` 这个具体类型名字就无法满足约束，不能靠外面的指针避开检查。

同样，对于函数模板，requires 子句参与判断候选能否用于一次调用；放在函数体里的 `static_assert` 则在相应定义需要实例化时检查。后者失败会报告程序错误，不会自动把函数从候选中排除，再替调用者尝试另一个重载。

> [!PRACTICE]
> 用约束表达模板接受哪些实参、哪些操作能够参加调用；用静态断言核对固定配置的关系，或诊断已经需要实例化的定义内部必须成立的性质。不要只为了提供一条自定义消息，就把本应参与接口选择的条件藏进函数体。

## 参考资料

- [C++23 工作草案：静态断言的语法与失败规则](https://timsong-cpp.github.io/cppwp/n4950/dcl.pre#10)
- [C++23 工作草案：constexpr 函数与形参限制](https://timsong-cpp.github.io/cppwp/n4950/dcl.constexpr)
- [C++23 工作草案：常量表达式允许的读取](https://timsong-cpp.github.io/cppwp/n4950/expr.const)
- [C++23 工作草案：类与成员的隐式实例化](https://timsong-cpp.github.io/cppwp/n4950/temp.inst)
- [C++23 工作草案：可行函数的约束要求](https://timsong-cpp.github.io/cppwp/n4950/over.match.viable#3)
