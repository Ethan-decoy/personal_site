---
title: 状态变化与所含对象的生命周期（State Changes and Contained Object Lifetime）
date: 2026-09-19
order: 3
---

# 状态变化与所含对象的生命周期（State Changes and Contained Object Lifetime）

一个 `optional<T>` 可以先没有值，再保存结果，之后重新变为无值。要判断这些操作的成本与失败后果，需要区分外层 `optional` 对象和它可能包含的 `T` 对象：外层一直存在，不代表内层一直存在。

## 空状态不构造所含对象

默认构造 `optional<T>` 只建立无值状态，不调用 `T` 的默认构造函数。因此，`T` 即使没有默认构造函数，也可以先有一个无值的 `optional<T>`。

有值时，所含 `T` 对象位于 `optional` 自身的存储中，`optional` 不会为了单独放置这个 `T` 而另外分配动态存储。这与 `unique_ptr<T>` 拥有外部动态对象的关系不同。若 `T` 是 `string`，字符串自身仍可能为字符分配存储；外层的存储方式不能消除内层类型的资源需求。

这种安排同时预留了容纳 `T` 的空间和记录存在状态所需的信息，不能据此假定 `optional<T>` 的大小恰好是 `sizeof(T)` 加一个字节；[对齐与具体布局](../09-structures-and-object-composition/deep-dives/01-object-layout-alignment-and-padding.md#sizeofalignof-与成员偏移回答不同问题)会影响大小。无值主要省去的是 `T` 对象的构造及其所管理的资源，不意味着外层对象本身没有存储成本。

## 赋值根据当前状态工作

以 `optional<string>` 为例，给它赋一个 `string` 值时：原来无值，就在内部构造字符串；原来有值，就给已有字符串赋值。两种情况下，成功后都有值，但对所含对象执行的操作不同。

`reset()` 将 `optional` 变为无值：如果原来有值，先销毁所含对象；本来无值则保持不变。赋值 `std::nullopt` 也能达到同样的状态。

```cpp
#include <iostream>
#include <optional>
#include <string>

int main() {
    std::optional<std::string> name{};
    std::cout << name.has_value() << '\n';

    name = std::string{"front-left"};
    std::cout << *name << '\n';

    name = std::string{};
    std::cout << name.has_value() << ' ' << name->size() << '\n';

    name.reset();
    std::cout << name.has_value() << '\n';
}
```

输出为 `0`、`front-left`、`1 0`、`0`。赋入空字符串仍然保留一个存在的字符串对象；`reset()` 才结束所含字符串的生命周期。外层 `name` 在最后一次输出时仍然有效，只是不能再解引用。

把另一个同类型 `optional` 赋给它时，还要看来源是否有值。假定源和目标是两个不同对象，相关构造与赋值操作可用且成功，状态关系如下：

| 目标原状态 | 来源状态 | 对目标所含对象的操作 | 目标新状态 |
| --- | --- | --- | --- |
| 无值 | 无值 | 不构造对象 | 无值 |
| 无值 | 有值 | 构造 `T` | 有值 |
| 有值 | 无值 | 销毁 `T` | 无值 |
| 有值 | 有值 | 给已有 `T` 赋值 | 有值 |

赋值可能需要构造，也可能需要调用 `T` 的赋值运算符。如果其中的构造或赋值抛出异常，目标原来的有值或无值状态保持不变；但原来有值时，内部 `T` 的内容能否保持原样，还取决于它的赋值操作提供的异常保证。存在标志没有变化，不等于内容已经回滚。

## 原位构造会先结束旧值

成员函数 `emplace(args...)` 在 `optional` 内部直接用给定实参构造 `T`，称为原位构造（in-place construction）。这里的 `args...` 表示可以传入构造该 `T` 所需的实参，不是要求在调用代码里写省略号；例如 `optional<pressure_setting>` 的 `emplace(250)` 把 `250` 交给 `pressure_setting` 的构造函数。成功后，`emplace` 返回新对象的 `T&`，也可以像下面这样不接收返回值。

**如果已经有值，`emplace` 先销毁旧对象，再构造新对象。** 它不会把参数交给旧对象的赋值运算符，也不会等到新对象构造成功后才替换旧对象。

下面的设置对象只接受 `0` 到 `400` 范围内的压力值，单位为 kPa。它没有默认构造函数，构造与销毁时的输出用于显示对象实际存在的阶段。不合适的实参通过 `std::invalid_argument` 报告：这是 `<stdexcept>` 提供的标准异常类型，可以用描述文本构造，并按该类型捕获。

```cpp
#include <iostream>
#include <optional>
#include <stdexcept>

class pressure_setting {
  public:
    explicit pressure_setting(int pressure_kpa) : pressure_kpa_{pressure_kpa} {
        if (pressure_kpa < 0 || pressure_kpa > 400) {
            throw std::invalid_argument{"pressure out of range"};
        }
        std::cout << "construct " << pressure_kpa_ << '\n';
    }

    ~pressure_setting() {
        std::cout << "destroy " << pressure_kpa_ << '\n';
    }

  private:
    int pressure_kpa_;
};

int main() {
    std::optional<pressure_setting> setting{};
    std::cout << setting.has_value() << '\n';

    setting.emplace(250);
    try {
        setting.emplace(-1);
    } catch (const std::invalid_argument&) {
        std::cout << "rejected\n";
    }

    std::cout << setting.has_value() << '\n';
}
```

输出依次为 `0`、`construct 250`、`destroy 250`、`rejected`、`0`。第一次 `emplace` 才开始构造所含对象；第二次调用先销毁 `250` 对应的旧对象，新构造因实参不合法而抛出异常，因此 `setting` 留在无值状态。

失败的新对象没有完成构造，不会再执行一次 `pressure_setting` 的析构函数。外层 `setting` 仍然可以查询、再次构造新值，也可以正常离开作用域。

> [!WARNING]
> 新对象的构造函数在 `emplace` 内抛出异常时，旧对象已经销毁，`optional` 将处于无值状态。需要“更新失败时保留旧设置”的接口，不能仅凭原位构造就得到这个保证。

实参表达式则在进入 `emplace` 前求值。如果求值本身先抛出异常，调用尚未开始，不能套用“旧对象已经销毁”的结论。失败发生在什么阶段，决定了哪些状态可能改变。

## 借用跟随所含对象的有效期

对一个有值的 `optional` 使用 `*`、`->` 或 `value()`，取得的是对所含对象的访问关系。`reset()` 会结束该对象的生命周期；外层 `optional` 仍然存在，也不能让原来的引用或指针继续访问已经销毁的值。

重新构造之后，应从当前有值的 `optional` 重新取得所需借用，而不是仅凭 `has_value()` 又为真就认定旧访问关系仍然适用。即便只是对已有 `string` 赋值，没有销毁字符串对象，之前借用的字符范围仍须遵守[字符串修改的失效规则](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md#修改字符串后不沿用旧借用的有效性假设)。外层状态、内层对象和内层管理的资源，需要分别判断。

`optional` 自身销毁时，若仍有值，也会销毁所含对象。因此普通作用域退出和异常展开都能沿着已有的 RAII 规则完成清理；不需要为了清理资源而在每条退出路径手动调用 `reset()`。

> [!PRACTICE]
> 更新已有值时，赋值表达的是修改现有对象，`emplace` 表达的是重新构造对象，应依据对象行为选择。若失败后必须保留原内容，可以先在独立对象中完成可能失败的准备，再采用有足够保证的提交操作；[准备与提交](../18-exception-propagation-and-failure-state/04-failure-state-and-exception-safety.md#把可能失败的准备留在独立对象中)都要检查，仅有临时对象还不足以保证整个更新不破坏旧值。

## 参考资料

- [C++23 工作草案：optional 的对象存储与空构造](https://timsong-cpp.github.io/cppwp/n4950/optional.optional)
- [C++23 工作草案：optional 赋值与原位构造的状态变化](https://timsong-cpp.github.io/cppwp/n4950/optional.assign)
- [C++23 工作草案：reset](https://timsong-cpp.github.io/cppwp/n4950/optional.mod)
- [C++23 工作草案：optional 的析构](https://timsong-cpp.github.io/cppwp/n4950/optional.dtor)
