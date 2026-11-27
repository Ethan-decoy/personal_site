---
title: 文本借用的有效期与接口边界（Text Lifetimes and Interface Boundaries）
date: 2026-09-15
order: 5
---

# 文本借用的有效期与接口边界（Text Lifetimes and Interface Boundaries）

`std::string_view` 可以在函数之间传递已有文本的访问范围。修改字符串、保存子视图或把视图返回给调用方时，都须判断借用的字符在读取时是否仍然有效。

> [!IMPORTANT] 字符借用的有效条件
> 视图保存借用的起点和长度。继续读取前，先确认所借字符的生命周期覆盖这次访问，再核对拥有者发生过的操作是否使原访问关系失效。访问范围以视图记录的长度为准。

## 修改字符串后，不沿用旧借用的有效性假设

通过有效下标原位改写已有字符时，原来的访问关系保持有效，视图会读到新值。视图仍保留建立时记录的长度。[原位修改与视图读取](03-string-views-and-borrowed-text.md#视图保存范围字符由来源维持)

字符串重新分配存储会使旧字符访问失效。即使容量足够，追加、整串赋值等操作仍允许使原有的字符指针和引用失效。预先调用 `reserve` 后，追加仍适用字符串自身的失效规则。[字符串增长与存储变化](02-text-comparison-and-composition.md#字符串增长与存储变化)

下面的程序在追加后用当前的 `field` 重新建立视图，再读取文本。

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

程序输出 `sensor=front-left 17` 和 `sensor=front-left;unit=kPa 26`。追加后的赋值直接用当前 `field` 的起点和长度覆盖旧记录，之后 `view` 描述整个新字符串。若只需要其中某个字段，应从当前文本重新确定它的范围。

字符访问失效后，尚未更新的视图仍保留原来的长度记录。`size()` 返回这个长度，`empty()` 判断它是否为零。

> [!WARNING] 修改字符串可能使现有视图失效
> 即使视图是 `const`、记录的长度非零，且字符串仍在作用域内，字符串的修改也可能已经使旧字符访问失效。

## 临时子串也可能成为已经消失的拥有者

`std::string::substr` 返回拥有字符的新字符串，`std::string_view::substr` 返回借用原字符的子视图。下面的声明从前一种结果建立视图。

```cpp
const std::string field{"sensor=front-left"};
const std::string_view name{field.substr(7)};
```

这两行可放入已包含 `<string>` 与 `<string_view>` 的函数体。`field.substr(7)` 产生临时字符串，`name` 借用它拥有的字符。临时字符串在这条声明的完整表达式结束时销毁，此后通过 `name` 读取字符是未定义行为。

如果要借用 `field`，先从 `field` 建立视图，再从这份视图取得子串。第二行可改为 `const std::string_view name{std::string_view{field}.substr(7)};`。临时视图在语句结束时销毁，`name` 继续借用由 `field` 维持的字符。

如果要保存独立的子串，则使用 `const std::string name{field.substr(7)};`。这时接收结果的对象本身就是拥有者，字符的有效期不再依赖 `field`。

> [!IMPORTANT] 临时字符串与临时视图
> 从临时视图取得的子视图仍借用原来的字符，读取取决于这些字符的有效期。借用来自临时字符串时，字符串销毁会结束这些字符的生命周期，此后通过视图读取它们是未定义行为。

## 返回视图时，明确字符留在哪里

按值返回视图，只交付范围记录。下面的独立函数返回了借用局部字符串的视图，函数退出后，通过这个视图读取字符是未定义行为。

```cpp
#include <string>
#include <string_view>

std::string_view make_sensor_view() {
    const std::string name{"front-left"};
    return std::string_view{name};
}
```

局部 `name` 由字面量初始化，返回的视图借用的是 `name` 所拥有的字符。若直接返回 `std::string_view{"front-left"}`，视图借用具有静态存储期的字面量，函数退出后仍可读取这些字符。

`field_value` 负责选取第一个 `=` 之后的全部内容。找到分隔符时，函数返回借用输入字符的子视图，调用者须让所借字符保持有效直至最后一次读取。找不到分隔符时，函数直接返回默认空视图。如果分隔符恰好在末尾，返回的子视图也为空。这两种结果的 `empty()` 都是 `true`。[查找分隔符与选取范围](04-searching-and-selecting-text.md#先确认位置再建立两侧范围)

`make_sensor_name` 在源字符仍然有效时复制选中的内容，按值返回独立的 `std::string`。

```cpp
#include <iostream>
#include <string>
#include <string_view>

std::string_view field_value(const std::string_view field) {
    const std::string_view::size_type separator{field.find('=')};
    if (separator == std::string_view::npos) {
        return std::string_view{};
    }

    constexpr std::string_view::size_type separator_width{1};
    return field.substr(separator + separator_width);
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

程序输出 `rear-right` 和 `front-left`。`borrowed` 的字符由 `main` 中的 `field` 维持。构造 `owned` 的字符复制在 `make_sensor_name` 的局部字符串销毁前完成。[按值返回与结果对象](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md#返回表达式可以直接构造接收对象)

在 `field_value` 的实参中直接构造临时字符串并传入它的视图时，若结果借用这段文本，可以在调用所在的完整表达式内读取字符。临时字符串在该完整表达式结束时销毁，此后再通过返回的子视图读取字符是未定义行为。若未找到分隔符，函数返回长度为零、数据指针为空的默认空视图。

> [!PRACTICE] 保存或返回视图时明确源字符有效期
> 函数只在调用期间读取文本时，可以按值接收 `std::string_view`。返回子视图或保存视图供之后使用时，说明它借用哪一段文本，以及源字符须保持有效到何时。需要独立保存结果时，在借用仍有效时复制字符，按值返回 `std::string`。

## 移动字符串也不能保证旧视图跟随目标

移动构造 `std::string` 后，目标取得源原来的文本值，源保持有效，状态未指定。C++23 允许把字符串传给接收非 `const` 引用的标准库函数时使旧字符指针和引用失效。移动构造的源参数是 `std::string&&`，适用这条规则。[C++23 字符串失效规则](https://timsong-cpp.github.io/cppwp/n4950/string.require#4)

例如，采用内嵌存储的实现可以把短文本保存在目标对象内部，旧视图的记录仍是移动前的起点和长度。需要读取移动后的目标文本时，应从目标重新建立视图。[字符串的存储选择与移动边界](deep-dives/02-string-storage-and-move-boundaries.md#短文本可以直接放进拥有者对象)

## 参考资料

- [C++23 工作草案：字符串修改与访问失效](https://timsong-cpp.github.io/cppwp/n4950/string.require)
- [C++23 工作草案：string_view 的范围与失效关系](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
- [C++23 工作草案：string 的子串结果](https://timsong-cpp.github.io/cppwp/n4950/string.substr)
- [C++23 工作草案：临时对象的生命周期](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：字符串构造、移动与赋值](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
