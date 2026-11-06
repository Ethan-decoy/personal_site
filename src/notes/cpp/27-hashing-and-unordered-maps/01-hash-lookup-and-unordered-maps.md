---
title: 哈希查找与无序映射（Hash Lookup and Unordered Maps）
date: 2026-09-21
order: 1
---

# 哈希查找与无序映射（Hash Lookup and Unordered Maps）

维护传感器的当前压力时，有些程序只需要按编号确认记录、读取或更新压力，并不需要按编号输出。`map` 利用键的顺序组织查找；不需要这个顺序时，还可以根据键计算查找线索，缩小需要比较的范围。

## 哈希把键变成查找线索

**哈希（hashing）在这里指根据键计算出一个整数，用它帮助组织查找。** 执行这项计算的函数称为哈希函数（hash function），所得整数称为哈希值（hash value）。它不需要知道当前保存了哪些记录，只根据输入键和固定的计算规则得到结果。

例如，只考虑非负整数编号，暂用“把十进制各位数字相加”这条规则：编号 `12` 得到 `1 + 2 = 3`，编号 `21` 也得到 `2 + 1 = 3`。这是一条便于观察关系的教学规则，标准库不规定采用它。

两个不同键得到了相同哈希值，这称为哈希碰撞（hash collision）。所以，哈希值不能代替原键，也不能单独证明两条记录属于同一台传感器。它提供的是查找线索，确认身份仍需要比较原键。

## 哈希定位候选，等价判断确认身份

容器按照哈希结果把记录组织到不同的候选分组，这些分组称为桶（bucket）。相同哈希值的键进入同一个桶；不同哈希值也可能对应到同一个桶。这种利用哈希组织记录的查找结构称为哈希表（hash table）。

沿用上述教学规则，保存编号 `12` 和 `21` 的压力记录时，两者因哈希值同为 `3` 被放入同一个桶，原来的编号和压力值都保留下来。查询 `21` 时，再算出 `3`，进入对应的桶，然后通过原键的 `==` 确认编号为 `21` 的记录。

查询 `30` 也会得到 `3`，但已保存的 `12`、`21` 都不等于 `30`，因此结果是缺失。桶中有记录，不等于查询的键存在；不同键也不会仅因哈希碰撞而覆盖彼此。

接收两个键、返回 `bool` 来判断它们是否等价的函数，称为键相等谓词（key equality predicate）。整数编号可以用 `==`；无序映射用这个判断决定两次查询是否指向同一项键值关联。

保存和查询要能沿着一致的路径找到记录，因此**等价的键必须产生相同哈希值**。如果规则把等价键算成不同结果，查询可能进入不同的候选范围，原键比较也就无法保证完成查找。这是正确性的前提；不同键产生相同哈希值则允许存在。

> [!IMPORTANT]
> 哈希用于缩小候选范围，键等价用于确认身份。同桶不一定同哈希，同哈希也不一定同键；容器需要保存原键与映射值，才能区分碰撞并返回正确记录。

## 默认规则可以直接用于整数键

头文件 `<unordered_map>` 提供 `std::unordered_map<Key, T>`，把上述查找方式封装为容器接口。它保存键与映射值的关联，每个等价键最多保存一条记录，不维护 `map` 那样的键顺序。这类容器称为无序关联容器（unordered associative container）。

`std::unordered_map<int, int>` 默认通过整数的 `==` 判断键是否等价，并使用 `std::hash<int>` 计算哈希值。

`std::hash<Key>` 是标准库提供的哈希函数对象类型。例如，包含 `<functional>` 后，`const std::hash<int> hash_key{};` 建立一个对象，`hash_key(21)` 调用它，返回 `std::size_t` 类型的无符号整数。这里使用的是[对象的调用接口](../23-callable-objects-and-lambda-expressions/01-function-objects-and-call-operators.md#让对象支持调用表达式)。`std::size_t` 的声明由 `<cstddef>` 提供。

默认哈希也支持 `std::string`；字符串类型及对应支持由 `<string>` 提供，默认等价判断按字符串内容相等。自定义类则不会仅因为有几个可比较成员，就自动获得适用的哈希规则。

同一次程序执行中，相同键值的哈希结果必须一致；具体数字不属于业务契约，标准不承诺不同实现或不同次运行给出相同数字。因此，不能把 `std::hash` 的结果保存为跨运行稳定的记录编号，也不能假定整数的哈希值就是整数本身。

## 查询结果仍由原键决定

`find(key)` 返回命中位置或 `end()`，`contains(key)` 返回是否存在，这些查询不会插入元素。元素类型仍是 `std::pair<const Key, T>`，可以通过 `position->first` 访问键、`position->second` 访问映射值，键不能直接赋成另一个值。

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    const std::unordered_map<int, int> readings{{12, 240}, {21, 242}};

    const auto position{readings.find(21)};
    if (position != readings.end()) {
        std::cout << position->first << ' ' << position->second << '\n';
    }
    std::cout << readings.size() << ' ' << readings.contains(30) << '\n';
}
```

输出为 `21 242` 和 `2 0`：查询 `21` 得到相应压力，查询 `30` 仍是缺失，容器中保持两条记录。程序使用默认的 `std::hash<int>`，并没有采用教学例子的数字求和规则；这些结果不依赖具体哈希值、桶编号或遍历顺序。

写入仍可用 [`try_emplace` 保留已有值，或用 `insert_or_assign` 更新已有值](../26-keyed-data-and-ordered-maps/03-insertion-updates-and-subscript-access.md#保留已有值或覆盖已有值)。仅查询时不要随意改用 `[]`，它仍会在[键缺失时补建元素](../26-keyed-data-and-ordered-maps/03-insertion-updates-and-subscript-access.md#下标访问会补建缺失元素)；对于当前的 `int` 映射值，这会产生一条零读数。

## 查找成本与遍历顺序是不同的保证

对于含有 `n` 个元素的无序映射，按键 `find` 的平均复杂度是常数量级，最坏情况是线性量级。分布合适时，一次查询只需处理较小的候选范围；大量键挤在一起时，这个范围仍可能接近整个容器。

这里的“常数”描述工作量相对于元素数量的增长关系，不表示固定耗时。哈希计算和键比较也有成本，例如文本键的长度会影响这些操作，因此不能据此判断每次查找都比 `map` 快。

`begin()`、`end()` 仍可组成遍历区间，范围循环也能访问每条关联，但遍历既不保证键升序，也不保证插入顺序。“无序”不表示每次遍历随机打乱，而是接口没有交付可供业务依赖的排列规则。

其迭代器至少提供前向遍历能力：可以复制有效位置并用 `++` 前进，不能依赖 `--`、位置加整数或位置相减。它也不提供按大小寻找分界的成员 `lower_bound`、`upper_bound`，因而不能直接承担按键顺序查询一段编号的任务。

## 参考资料

- [C++23 工作草案：unordered_map 的键、元素类型与接口](https://timsong-cpp.github.io/cppwp/n4950/unord.map.overview)
- [C++23 工作草案：哈希、等价关系、桶与查找复杂度](https://timsong-cpp.github.io/cppwp/n4950/unord.req)
- [C++23 工作草案：标准哈希函数对象](https://timsong-cpp.github.io/cppwp/n4950/unord.hash)
- [C++23 工作草案：哈希函数的结果与稳定性要求](https://timsong-cpp.github.io/cppwp/n4950/hash.requirements)
- [C++23 工作草案：无序映射的下标与 at](https://timsong-cpp.github.io/cppwp/n4950/unord.map.elem)
