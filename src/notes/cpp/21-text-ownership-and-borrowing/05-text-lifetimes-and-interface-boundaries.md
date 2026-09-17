---
title: 文本借用的有效期与接口边界（Text Lifetimes and Interface Boundaries）
date: 2026-09-15
order: 5
---

# 文本借用的有效期与接口边界（Text Lifetimes and Interface Boundaries）

`string_view` 让函数能够读取现有文本，也让子串无需复制就能传递。代价是字符仍由原来的对象维持：视图自身还存在，不代表它借用的字符仍然有效。

拥有者负责字符存储，视图只记录借用范围。因此，判断视图能否继续访问，需要同时考虑字符的生命周期与字符串发生过的存储变化。

视图也不保存内容快照。通过有效下标原位修改已有字符，视图能够[观察到新值](03-string-views-and-borrowed-text.md)，记录的长度却不会主动跟随拥有者变化。字符串追加时，既要考虑需要读取的范围是否改变，还要先判断旧访问关系是否仍然有效。

## 修改字符串后，不沿用旧借用的有效性假设

`string` 在[增长与重新分配](02-text-comparison-and-composition.md#字符串增长与存储变化)中可能更换字符存储。`string_view` 保存的是建立时的起点与长度，不会重新向拥有者查询字符位置；原字符访问关系失效后，旧视图也就不能继续用于读取。字符串对象仍然存在，并不能维持原来的字符位置。

重新分配是其中一种明确的失效原因。`string` 的追加、整串赋值等操作还允许更广泛的访问失效，不能仅凭“还有容量”就认定旧视图可用；预先调用 `reserve` 也不提供类似 `vector` 容量内追加的借用保证。通过有效下标修改已有字符则保留访问关系。

修改后还要读取当前文本时，可以从仍然有效的拥有者重新建立视图：

```cpp
#include <iostream>
#include <string>
#include <string_view>

int main() {
    std::string field{"sensor=front-left"};
    std::string_view view{field};
    std::cout << view << ' ' << view.size() << '\n';

    field += ";unit=kPa";
    view = std::string_view{field};
    std::cout << view << ' ' << view.size() << '\n';
}
```

程序输出 `sensor=front-left 17` 和 `sensor=front-left;unit=kPa 26`。追加之后的赋值用新的起点与长度替换视图记录，不读取旧视图所指向的字符。之后 `view` 描述整个新字符串；若需要的仍是其中某个字段，应根据新文本重新确定它的范围。这个示例展示修改后重建视图的用法，不依赖本次追加是否实际发生了重新分配。

失效也不会把视图自动置空。`empty()` 和 `size()` 只能报告视图保存的长度，不能检测字符是否已经销毁或换了存储。

> [!WARNING]
> 借用是否有效，要同时检查字符的生命周期和拥有者发生过的操作。`const string_view`、非空长度，以及拥有者尚未离开作用域，都不能单独证明字符访问安全。

## 临时子串也可能成为已经消失的拥有者

`string::substr` 返回拥有字符的新字符串，`string_view::substr` 返回借用原字符的子视图。这个返回类型差别直接影响下面的声明：

```cpp
const std::string field{"sensor=front-left"};
const std::string_view name{field.substr(7)};
```

这是包含 `<string>` 与 `<string_view>` 后可放入函数体的错误用法。`field.substr(7)` 先产生临时 `string`，`name` 借用的是临时字符串中的字符。临时拥有者在这条声明的完整表达式结束时销毁，此后通过 `name` 读取字符具有未定义行为；原来的 `field` 仍然存在，也不能维持另一份字符。

如果要借用 `field`，可把第二行改为 `const std::string_view name{std::string_view{field}.substr(7)};`。这里的临时视图在声明结束时销毁，却没有销毁字符；留下的 `name` 仍然借用 `field`。

如果要保存独立的子串，则使用 `const std::string name{field.substr(7)};`。这时接收结果的对象本身就是拥有者，字符的有效期不再依赖 `field`。

> [!IMPORTANT]
> 临时对象是否危险，取决于它承担什么职责。临时视图的销毁不销毁字符；临时字符串的销毁会结束它所拥有字符的生命周期。把结果接收到视图中，不会延长临时拥有者的生命周期。

## 返回视图时，明确字符留在哪里

按值返回视图，只交付范围记录。下面是一个独立的错误函数；返回的视图借用局部字符串，函数退出后就不能再通过它访问字符：

```cpp
#include <string>
#include <string_view>

std::string_view make_sensor_view() {
    const std::string name{"front-left"};
    return std::string_view{name};
}
```

局部字符串依据字面量的内容建立，但它拥有的是自己的字符。字面量具有静态存储期，不会把这一性质传给局部 `string`。如果函数直接返回 `std::string_view{"front-left"}`，视图借用的才是字面量的字符数组，可以在函数退出后继续读取。

返回输入文本的子视图则适合表达“从现有文本中选出一段”。下面的 `field_value` 返回第一个 `=` 后面的范围。它只负责选择范围，不校验字段名称；没有 `=` 和 `=` 后没有字符时，都返回空视图，因此不能仅凭结果的 `empty()` 区分这两种情况。

`make_sensor_name` 则创建独立结果，因此返回 `string`：

```cpp
#include <iostream>
#include <string>
#include <string_view>

std::string_view field_value(std::string_view field) {
    const std::string_view::size_type separator{field.find('=')};
    if (separator == std::string_view::npos) {
        return std::string_view{};
    }

    return field.substr(separator + 1);
}

std::string make_sensor_name() {
    const std::string field{"sensor=front-left"};
    return std::string{field_value(std::string_view{field})};
}

int main() {
    const std::string field{"sensor=rear-right"};
    const std::string_view borrowed{field_value(std::string_view{field})};
    const std::string owned{make_sensor_name()};

    std::cout << borrowed << '\n';
    std::cout << owned << '\n';
}
```

程序输出 `rear-right` 和 `front-left`。`borrowed` 的字符由 `main` 中的 `field` 维持；`owned` 则从函数内仍然有效的范围复制字符，形成返回结果，再销毁局部拥有者。返回结果的构造遵循[按值返回规则](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md)，不需要为了离开函数而改成视图。

若把临时 `string` 所建立的视图传给 `field_value`，调用过程中字符可以有效，但把返回视图保存到下一条语句并不安全：临时字符串仍会在调用所在的完整表达式结束时销毁。

> [!PRACTICE]
> 函数只在调用期间读取文本时，按值接收 `string_view` 可以表达借用；返回子视图或保存视图供之后使用时，还应说明借用来源及所需的有效期。调用方难以维持原文本，或结果本来就应独立保存时，返回 `string` 更直接。
>
> 借用期间保持拥有者的存储与范围稳定，能简化有效性判断。需要修改字符串时，完成修改后再从拥有者建立当前所需的视图。

## 移动字符串也不能保证旧视图跟随目标

移动构造 `string` 后，目标取得源原来的文本值，源保持有效但状态未指定，不能假定源必然为空。字符的旧访问方式也没有“自动跟随目标”的保证：字符串可能采用不同的[存储方案](deep-dives/02-string-storage-and-move-boundaries.md)，移动并不总是转交同一块外部存储。

因此，移动字符串后需要访问目标文本时，应从目标重新建立视图。不能根据移动前的字符内容，或某次运行中看似没有变化的地址，推断旧视图已经借用目标。

## 参考资料

- [C++23 工作草案：字符串修改与访问失效](https://timsong-cpp.github.io/cppwp/n4950/string.require)
- [C++23 工作草案：string_view 的范围与失效关系](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 工作草案：string 的子串结果](https://timsong-cpp.github.io/cppwp/n4950/string.substr)
- [C++23 工作草案：临时对象的生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：字符串构造、移动与赋值](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
