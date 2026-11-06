---
title: 按键查找与缺失结果（Key Lookup and Missing Results）
date: 2026-09-19
order: 2
---

# 按键查找与缺失结果（Key Lookup and Missing Results）

按传感器编号查询压力时，程序可能需要取得这条记录，也可能只需要知道它是否存在。缺失如何报告，是查询接口的一部分：返回一个可检查的位置和抛出异常，适合不同的调用契约。

`map` 的这些查询都根据键进行。它们不会因为没有找到编号，就自动给这个编号建立一条读数。

## 需要位置时，检查查找返回值

成员函数 `readings.find(key)` 查找与 `key` 比较等价的键。有匹配时返回指向整条关联的迭代器；没有匹配时返回 `readings.end()`。默认整数键比较下，这就是按整数相等寻找编号。

容器可修改时，返回类型为 `std::map<Key, T>::iterator`；容器为 `const` 时，返回 `const_iterator`。两者都不能改写元素的键，后者还禁止通过它修改映射值。

找到位置后，`position->first` 取得键，`position->second` 取得映射值。解引用仍以找到元素为前提；无匹配时返回的是结束边界，不能把它当成一个内容为零的元素。

**这里的 `map::find` 是按键查询的成员函数。** 它与接收半开区间的 `std::find` 不是同一个接口。后者逐个比较区间元素，前者利用容器按键组织的数据关系，并提供对数复杂度的查找保证。若容器有 `n` 个元素，查找工作量按 `log n` 的量级增长，而不必顺序检查全部键；键本身的比较成本仍会影响实际耗时。

## 只问是否存在，或要求必须存在

成员函数 `contains(key)` 返回 `bool`：存在比较等价的键时为真，否则为假。它适合只需要存在性判断的场合；若判断之后还要读取数据，直接使用 `find` 返回的位置可以避免再次查找。

成员函数 `at(key)` 则返回对应映射值的引用：对普通 `map` 返回 `T&`，对 `const map` 返回 `const T&`。缺失时，它抛出 `<stdexcept>` 中的 `std::out_of_range`。它检查的是键是否存在，不是键是否小于 `size()`。

| 当前需要 | 接口 | 键缺失时 |
| --- | --- | --- |
| 取得记录位置，并自行处理缺失 | `find(key)` | 返回 `end()` |
| 只判断是否有这条记录 | `contains(key)` | 返回 `false` |
| 取得映射值，缺失按异常处理 | `at(key)` | 抛出 `std::out_of_range` |

这三个成员都能用于 `const map`，都不会插入元素。下面查询已经存在的编号 `20` 和尚未记录的编号 `30`：

```cpp
#include <iostream>
#include <map>
#include <stdexcept>

int main() {
    const std::map<int, int> readings{{10, 240}, {20, 245}};
    const auto position{readings.find(20)};

    if (position != readings.end()) {
        std::cout << position->second << '\n';
    }
    std::cout << readings.contains(30) << '\n';

    try {
        std::cout << readings.at(30) << '\n';
    } catch (const std::out_of_range&) {
        std::cout << "missing sensor\n";
    }

    std::cout << readings.size() << '\n';
}
```

输出为 `245`、`0`、`missing sensor` 和 `2`。查不到编号 `30` 没有改变容器内容；它仍然只包含最初的两条记录。

程序中的 `const auto position` 固定的是迭代器变量，迭代器提供只读访问则是因为来源 `readings` 为 `const`。如果从普通 `map` 的 `find` 取得迭代器，即使把迭代器变量声明为 `const`，仍可以通过 `position->second` 修改映射值。

> [!WARNING]
> `find` 返回 `end()` 表示没有这条关联，不能继续解引用。`at` 的缺失检查会抛异常，也不会替调用者选择默认压力；缺失后的业务行为仍要由接口明确规定。

## 返回位置与交付读数是不同契约

`find` 返回的位置适合继续访问容器中的原元素。调用方若需要修改该记录，可以在确认命中后操作 `position->second`；调用方若只需要一个独立的压力结果，则没有必要暴露容器迭代器。

例如，一个返回 `std::optional<int>` 的查询函数可以在命中时复制 `position->second`，缺失时返回 `std::nullopt`。这样保留[有值与无值的区别](../25-optional-values-and-absence/01-optional-values-and-result-contracts.md#无值是独立状态)，但得到的是读数副本；之后修改原容器，不会更新已经返回的整数。

相反，保留位置或绑定 `at` 返回的引用，会继续依赖原元素的有效期。访问接口返回引用不等于必然建立副本：`const int pressure{readings.at(20)};` 复制一个整数，`const int& pressure{readings.at(20)};` 则借用原来的整数对象。

> [!PRACTICE]
> 缺失是正常业务分支时，用 `find` 保留位置并处理缺失；调用者只需要真假时，用 `contains`。如果缺失应按异常传播，`at` 可以直接表达这一契约。函数边界再根据是否需要原记录，决定交付借用还是独立的可选值。

## 参考资料

- [C++23 工作草案：关联容器的 find、contains 与查找复杂度](https://timsong-cpp.github.io/cppwp/n4950/associative.reqmts)
- [C++23 工作草案：map 的 at 与异常边界](https://timsong-cpp.github.io/cppwp/n4950/map.access)
