---
title: 键的比较等价与有序边界（Key Equivalence and Ordered Boundaries）
date: 2026-09-19
order: 4
---

# 键的比较等价与有序边界（Key Equivalence and Ordered Boundaries）

`map` 不仅需要决定哪个键排在前面，还需要判断新键是否已经存在。这两件事使用同一套比较关系。因此，自定义比较器会同时影响遍历顺序、查找命中和重复键的判定。

## 比较关系同时决定顺序与唯一性

`std::map<Key, T, Compare>` 的第三个类型指定比较器类型。容器保存一个该类型的比较对象，用它比较两个键。调用 `comp(left, right)` 返回真，表示 `left` 应排在 `right` 前面；比较对象必须建立[严格弱序](../24-sorting-ordering-and-ordered-search/02-comparators-and-strict-weak-ordering.md#严格弱序让局部判断形成一致的次序)。

两个键是否属于同一组，用[比较等价](../24-sorting-ordering-and-ordered-search/02-comparators-and-strict-weak-ordering.md#比较等价不要求值完全相同)判断：`!comp(left, right) && !comp(right, left)`。`map` 对每个等价组最多保存一个元素；它不会另调用键的 `operator==` 来推翻这项判断。

例如，一份导入记录同时携带传感器编号和来源标签，但业务规定编号相同就指同一传感器。下面的 `sensor_key` 保存这两项，`by_sensor_id` 只比较编号。它使用已建立的[函数对象接口](../23-callable-objects-and-lambda-expressions/01-function-objects-and-call-operators.md#让对象支持调用表达式)，无需给整个键定义 `<` 或 `==`。

声明 `std::map<sensor_key, int, by_sensor_id> readings{};` 时，容器默认构造一个 `by_sensor_id` 对象作为比较器；`sensor_key` 是键类型，`int` 是压力类型，第三项不是某次比较得到的布尔值。

```cpp
#include <iostream>
#include <map>
#include <string>

struct sensor_key {
    int id;
    std::string label;
};

struct by_sensor_id {
    bool operator()(const sensor_key& left, const sensor_key& right) const {
        return left.id < right.id;
    }
};

int main() {
    std::map<sensor_key, int, by_sensor_id> readings{};
    const auto first{readings.try_emplace(sensor_key{10, "front-left"}, 240)};
    const auto repeated{readings.try_emplace(sensor_key{10, "renamed"}, 250)};

    std::cout << first.second << ' ' << repeated.second << ' ' << readings.size() << '\n';
    std::cout << repeated.first->first.label << ' ' << repeated.first->second << '\n';
}
```

输出为 `1 0 1` 和 `front-left 240`。两个键的标签不同，但两次方向相反的编号比较都为假，所以它们等价。第二次 `try_emplace` 返回已有元素的位置，没有插入，也没有覆盖压力或替换原来的键。

`repeated.first` 是返回结果中的迭代器；`repeated.first->first` 才是容器元素中保存的键；最后的 `.label` 读取该键的标签。这里保留的是首次插入的 `front-left`，不会因为后来用另一个等价键查询或登记，就自动变成 `renamed`。

> [!IMPORTANT]
> 比较器定义了容器识别“同一个键”的方式。键对象的某些字段没有参与比较时，这些字段不同也可能命中同一条关联；已有元素保存的键不会随查询键改变。

如果标签需要随最新数据更新，更直接的设计通常是把 `id` 单独作为键，把标签和压力组成映射值。哪些信息负责识别，哪些信息允许更新，应由数据关系决定。

## 容器存在期间保持比较关系稳定

`map` 按比较关系组织记录，键在元素中为 `const`，正是为了限制普通的直接改写。但 `const` 不能保证比较器读到的一切都不变：比较器可能借用外部配置，键也可能是借用外部字符的 `string_view`。

对于已经保存在同一个容器中的两个键，它们的比较结果必须保持一致。若外部开关使比较从升序变成降序，或借用字符被原位修改后改变了两个键的先后，即使视图本身仍有效，也可能破坏这个要求。容器不会因此重新组织已有记录，之后不能再依赖原来的查找与顺序保证。

> [!WARNING]
> 键对象可读、比较器可调用，还不足以保证映射有效。参与比较的数据必须保持有效，并维持已有键之间的比较关系。文本键需要长期保存时，拥有字符的 `std::string` 通常比借用外部字符更容易满足这些条件。

## 成员边界查找定位一段键

需要查询一段编号时，`map` 提供成员函数 `lower_bound(key)` 和 `upper_bound(key)`。它们返回元素位置，普通容器返回 `iterator`，`const` 容器返回 `const_iterator`；没有满足条件的元素则返回 `end()`。

两者采用容器保存的比较关系，与[有序区间的边界](../24-sorting-ordering-and-ordered-search/05-equivalent-ranges-and-comparison-direction.md#两个边界使用相反方向的比较)具有同样的方向区别，只是比较对象是元素的键：

| 接口 | 返回第一个满足的条件 | 默认整数升序中的含义 |
| --- | --- | --- |
| `lower_bound(target)` | `!comp(entry.first, target)` | 键不小于目标 |
| `upper_bound(target)` | `comp(target, entry.first)` | 键大于目标 |

下面输出编号在闭区间 `[20, 40]` 中的记录。两个数值端点都包含在业务范围内，对应的迭代器范围则仍是半开区间：

```cpp
#include <iostream>
#include <map>

int main() {
    const std::map<int, int> readings{{10, 235}, {20, 240}, {30, 245}, {40, 250}, {50, 255}};
    const auto first{readings.lower_bound(20)};
    const auto last{readings.upper_bound(40)};

    for (auto position{first}; position != last; ++position) {
        std::cout << position->first << ' ' << position->second << '\n';
    }
}
```

输出为 `20 240`、`30 245` 和 `40 250`。`last` 指向编号 `50`，它只是尾后边界，不属于要处理的范围；若没有大于 `40` 的键，`last` 就是 `end()`。

这种组合要求下限不大于上限。对合法数值区间，即使端点对应的键不存在，也仍能选出范围内的记录；范围内没有键时，两个位置相等。若把上下限反过来，取得的位置可能前后颠倒，不能直接用递增循环把它们当作有效区间。

`lower_bound` 单独返回一个非结束位置，只说明找到了分界，不保证这个键等于目标。例如，本例的 `lower_bound(25)` 指向 `30`。需要精确的等价键时，直接使用 `find` 表达意图更清楚。

## 使用容器维护的顺序

两个成员边界查找都具有对数复杂度；定位后逐个处理 `k` 条记录，仍然要遍历这 `k` 个元素。比较规则改变时，表中的数值升序解释也要相应改变，不能把函数名中的“下”和“上”固定理解成数值大小。

`map` 的成员查找能够利用容器内部的组织关系。把它的双向迭代器交给通用二分查找，即使正确提供了键比较方式，[位置推进仍可能需要线性工作量](../24-sorting-ordering-and-ordered-search/04-lower-bound-and-search-preconditions.md#每次比较为什么能排除半段)。因此按键查找边界时，优先使用容器的成员接口。

映射已经持续维护键的顺序，也不适合交给 `std::sort`：其迭代器没有随机访问能力，元素中的键也不允许像普通序列那样通过赋值重排。如果需要按压力高低展示，应先建立合适的序列，再按压力排序；那是展示顺序，与映射用来识别传感器的键顺序是两项不同需求。

## 参考资料

- [C++23 工作草案：关联容器的键等价、稳定比较与边界查找](https://timsong-cpp.github.io/cppwp/n4950/associative.reqmts)
- [C++23 工作草案：map 的比较器类型与迭代器](https://timsong-cpp.github.io/cppwp/n4950/map.overview)
- [C++23 工作草案：try_emplace 的重复键行为](https://timsong-cpp.github.io/cppwp/n4950/map.modifiers)
- [C++23 工作草案：通用二分查找的比较与推进成本](https://timsong-cpp.github.io/cppwp/n4950/alg.binary.search)
