---
title: 插入、更新与下标访问（Insertion, Updates, and Subscript Access）
date: 2026-09-19
order: 3
---

# 插入、更新与下标访问（Insertion, Updates, and Subscript Access）

收到一条传感器记录时，编号可能还没有登记，也可能已经有压力值。只保存第一次上报和始终保存最新上报，都可以使用同一个 `std::map<int, int>`；差别在于键已存在时，程序希望保留还是覆盖映射值。

## 保留已有值或覆盖已有值

`try_emplace(key, args...)` 表达“缺失才插入”，这里的 `args...` 表示零个或多个后续实参。第一个实参是键，后续实参用于构造映射值：键缺失时建立新元素；键已经存在时保留已有元素，不用这些实参另行构造映射值。例如，`try_emplace(7, 100)` 在需要插入时，用 `100` 初始化编号 `7` 对应的 `int`。

这个调用返回一个 `std::pair`，其中 `first` 是指向新元素或已有元素的迭代器，`second` 是表示本次是否插入的 `bool`。因此，`result.first->second` 访问的是容器元素中的映射值，`result.second` 才是插入标志；两处 `second` 属于不同的 `pair` 对象。

`insert_or_assign(key, value)` 表达“存在就赋值，缺失就插入”。它也返回上述形式的结果：`second` 为 `true` 表示新增元素，为 `false` 表示对已有映射值完成赋值。这里的 `false` 并不表示操作失败。

> [!IMPORTANT]
> 两个接口都能接收一个尚未出现的键，但对已有键的处理不同：`try_emplace` 保留原值，`insert_or_assign` 接受新值。返回的布尔值回答“是否新增了元素”，不能直接解释成“写入是否成功”。

下面的 `sample_pressure()` 用一行输出标记采样动作，再返回一个压力值：

```cpp
#include <iostream>
#include <map>

int sample_pressure() {
    std::cout << "sample\n";
    return 110;
}

int main() {
    std::map<int, int> pressures{};

    const auto first{pressures.try_emplace(7, 100)};
    std::cout << first.second << ' ' << first.first->second << '\n';

    const auto repeated{pressures.try_emplace(7, sample_pressure())};
    std::cout << repeated.second << ' ' << repeated.first->second << '\n';

    const auto updated{pressures.insert_or_assign(7, 120)};
    std::cout << updated.second << ' ' << updated.first->second << '\n';

    const auto added{pressures.insert_or_assign(9, 95)};
    std::cout << added.second << ' ' << added.first->second << '\n';
    std::cout << pressures.size() << '\n';
}
```

输出为：

```text
1 100
sample
0 100
0 120
1 95
2
```

第一次调用建立编号 `7`，第二次遇到已有键而保留 `100`。随后，`insert_or_assign` 将它更新为 `120`，再为编号 `9` 建立新元素，所以最终只有两个元素。

`sample` 仍然出现，因为函数调用的实参表达式会先求值，`try_emplace` 才能接收这些实参并检查键。它避免的是键已存在时对容器内映射值的构造，并不推迟 `sample_pressure()` 这次调用。如果要求已有键时连采样也不发生，应先通过 `find` 或 `contains` 判断，再在缺失分支中采样、插入。

类型也必须支持所选接口的操作：`try_emplace` 要求后续实参能用于构造映射值；`insert_or_assign` 既需要能够构造新映射值，也需要能够给已有映射值赋值。运行时只走其中一个分支，不会消除接口对另一种操作的要求。

## 下标访问会补建缺失元素

对于这里使用的 `std::map<Key, T>`，`map[key]` 返回对应映射值的 `T&`。键已经存在时，它引用已有映射值；键缺失时，它建立由这个键和经过值初始化（value-initialization）的映射值组成的新元素，再返回引用。于是 `int` 从 `0` 开始，`std::string` 从空字符串开始；类类型需要能够不带构造实参建立对象，具体状态由相应的初始化规则和默认构造函数决定，不能统一理解成所有成员都清零。

**下标中的数字是键，不是第几个元素的位置。** `pressures[9]` 访问编号 `9`，不会检查容器是否至少有十个元素。

> [!WARNING]
> 仅仅为了读取而写下 `map[key]`，也可能插入新元素。`const std::map` 不提供这个下标接口；即使确信键已经存在，调用下标接口仍须满足缺失时能够构造映射值的要求。

这一行为是否合适，取决于缺失能否自然地解释为一个初始值。缺少测量不代表测得压力为 `0`；但统计每个传感器的上报次数时，尚未出现的编号确实可以从零次开始。

```cpp
#include <array>
#include <iostream>
#include <map>

int main() {
    std::map<int, int> pressures{{7, 100}};
    std::cout << pressures.size() << '\n';

    const int missing_pressure{pressures[9]};
    std::cout << missing_pressure << ' ' << pressures.size() << '\n';

    const std::array<int, 4> sensor_ids{7, 9, 7, 7};
    std::map<int, int> report_counts{};
    for (const int sensor_id : sensor_ids) {
        ++report_counts[sensor_id];
    }

    for (const auto& entry : report_counts) {
        std::cout << entry.first << ' ' << entry.second << '\n';
    }
}
```

输出为：

```text
1
0 2
7 3
9 1
```

`missing_pressure` 得到了一个程序补建的零，`pressures` 的元素数也从 `1` 增加到 `2`。在计数循环中，相同的补建规则则恰好符合需要：首次上报先建立零，再递增为一；重复上报直接递增已有计数。

> [!PRACTICE]
> 查询已有记录时使用 `find`、`contains` 或 `at`，查询本身不补建缺失的元素。需要登记首次记录时使用 `try_emplace`，需要接纳新值时使用 `insert_or_assign`。只有缺失时的初始映射值本来就符合业务含义，才让 `[]` 承担补建职责，例如这里的次数累加。

## 插入失败与赋值失败的边界不同

插入新元素可能因分配存储或构造对象而抛出异常。`try_emplace` 的单元素插入失败时，不会把一个未完成的新元素留在容器中；不过，调用前已经完成的实参求值不会因此撤销，例如已经发生的采样和输出。

`insert_or_assign` 遇到已有键时执行的是映射值的赋值。示例中的 `int` 赋值不会抛出异常；如果换成赋值可能抛出的类类型，失败后该映射值保留什么状态，要看这个类型自己的赋值保证，不能把“插入失败不改变容器”直接推到已有对象的赋值上。

## 参考资料

- [C++23 工作草案：条件插入与插入或赋值](https://timsong-cpp.github.io/cppwp/n4950/map.modifiers)
- [C++23 工作草案：map 下标访问](https://timsong-cpp.github.io/cppwp/n4950/map.access)
- [C++23 工作草案：关联容器的异常保证](https://timsong-cpp.github.io/cppwp/n4950/associative.reqmts.except)
