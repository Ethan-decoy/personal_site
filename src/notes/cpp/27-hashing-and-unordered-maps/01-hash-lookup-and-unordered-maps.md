---
title: 哈希查找与无序映射（Hash Lookup and Unordered Maps）
date: 2026-09-21
order: 1
---

# 哈希查找与无序映射（Hash Lookup and Unordered Maps）

维护传感器的当前压力时，有些程序只会询问“编号 20 是否存在”“把编号 20 的压力更新为多少”，并不需要按编号输出，也不需要查询一段编号。唯一键关联仍然有用，但键的先后顺序不再是这项任务的要求。

头文件 `<unordered_map>` 提供 `std::unordered_map<Key, T>`。它也是一组键与映射值的关联，每个等价键最多保存一条记录；区别在于，它通过哈希和等价判断组织查找，不维护 `map` 那样的键顺序。这类容器称为无序关联容器（unordered associative container）。

## 哈希定位候选，等价判断确认身份

哈希函数（hash function）把键转换为一个整数，结果称为哈希值（hash value）。容器利用这个值，把元素组织到不同的桶（bucket）中。桶是查找时用于缩小候选范围的分组，不是业务编号，也不是序列中的元素位置。

同一容器中，哈希值相同的键位于同一个桶；哈希值不同的键也可能落到同一桶。桶的数量和分组办法属于容器的组织方式，不能把某个键的哈希值直接当作桶编号或对象地址。

**哈希值相同不等于键相同。** 不同的键可能产生相同哈希值，这称为哈希碰撞（hash collision）。容器还需要键相等谓词（key equality predicate）：接收两个键、返回 `bool`，用来判断它们是否代表同一项。

因此，两个规则必须配合：等价的键必须产生相同的哈希值；相同哈希值则不要求键等价。哈希负责缩小查找范围，等价判断才决定某条记录是否命中，以及插入是否属于重复键。

> [!IMPORTANT]
> 无序映射保存的是键与值的关联，不是“哈希值与值”的关联。发生碰撞不会要求两条不同键的记录互相覆盖；容器仍要依据键的等价关系区分它们。

## 默认规则可以直接用于整数键

`std::unordered_map<int, int>` 默认通过整数的 `==` 判断键是否等价，并使用 `std::hash<int>` 计算哈希值。整数编号相同就命中同一条记录，编号不同则允许分别保存。

`std::hash<Key>` 是标准库提供的哈希函数对象类型。例如，包含 `<functional>` 后，`const std::hash<int> hash_key{};` 建立一个对象，`hash_key(20)` 调用它，返回 `std::size_t` 类型的无符号整数。这里使用的是[对象的调用接口](../23-callable-objects-and-lambda-expressions/01-function-objects-and-call-operators.md#让对象支持调用表达式)，不是要求读者自己编写哈希算法。`std::size_t` 的声明由 `<cstddef>` 提供。

默认哈希也支持 `std::string`；字符串类型及对应支持由 `<string>` 提供，默认等价判断按字符串内容相等。自定义类则不会仅因为有几个可比较成员，就自动获得适用的哈希规则。

哈希结果的具体数字不属于业务契约。同一次程序执行中，相同键值的哈希结果必须一致，但标准不承诺不同实现或不同次运行给出相同数字。它也不保证整数的哈希值就是整数本身。

## 映射接口仍表达查询与写入的区别

元素类型仍然是 `std::pair<const Key, T>`：通过迭代器用 `position->first` 访问键，用 `position->second` 访问映射值，键不能直接赋成另一个值。

`find(key)` 返回命中位置或 `end()`，`contains(key)` 返回是否存在，`at(key)` 返回映射值的引用、缺失时抛出 `std::out_of_range`。这些查询不会插入元素；对 `const` 容器，取得的位置和引用提供只读访问。选择仍依据[是否需要位置、真假或异常契约](../26-keyed-data-and-ordered-maps/02-key-lookup-and-missing-results.md#只问是否存在或要求必须存在)。

`try_emplace(key, args...)` 保留已有值，`insert_or_assign(key, value)` 更新已有值，缺失时都插入；当前调用形式返回的 `pair` 仍由迭代器和插入标志组成。它们的[插入与赋值区别](../26-keyed-data-and-ordered-maps/03-insertion-updates-and-subscript-access.md#保留已有值或覆盖已有值)没有因为换了组织方式而改变。

```cpp
#include <iostream>
#include <unordered_map>

int main() {
    std::unordered_map<int, int> readings{{30, 250}, {10, 240}};

    const auto added{readings.try_emplace(20, 245)};
    std::cout << added.second << ' ' << added.first->second << '\n';

    const auto updated{readings.insert_or_assign(10, 242)};
    std::cout << updated.second << ' ' << updated.first->second << '\n';

    const auto position{readings.find(30)};
    if (position != readings.end()) {
        std::cout << position->second << '\n';
    }
    std::cout << readings.contains(99) << ' ' << readings.size() << '\n';
}
```

输出为 `1 245`、`0 242`、`250` 和 `0 3`。结果来自指定键的查找与更新，不依赖容器怎样安排遍历次序。

`readings[key]` 也保留[缺失时补建元素](../26-keyed-data-and-ordered-maps/03-insertion-updates-and-subscript-access.md#下标访问会补建缺失元素)的行为：本例的映射值是 `int`，因此缺失时从零开始，再返回引用。仅为查询而使用下标，仍可能把“没有读数”变成一条人为建立的零读数；`const` 容器不提供这个接口。

## 平均常数查找不提供顺序保证

对于含有 `n` 个元素的无序映射，按键 `find` 的平均复杂度是常数量级，最坏情况则是线性量级。这里的“常数”描述查找工作量相对于元素数量的增长关系，不表示固定耗时，也不表示哈希计算免费。文本键的长度、碰撞分布和实际存储访问都会影响耗时。

从分组模型看，键分散在各桶中时，查找通常只需检查较小的候选集合；大量键挤在同一处时，候选范围就可能接近整个容器。这也解释了为什么无序映射不保证每次都比 `map` 快。

`begin()`、`end()` 仍可组成遍历区间，范围循环也能访问每条关联，但遍历既不保证键升序，也不保证插入顺序。“无序”不表示每次遍历随机打乱，而是接口没有交付可供业务依赖的排列规则。

其迭代器至少提供前向遍历能力：可以复制有效位置并用 `++` 前进，不能依赖 `--`、位置加整数或位置相减。它也不提供按大小寻找分界的成员 `lower_bound`、`upper_bound`；要输出一段有序编号，仍需选择具备相应顺序的结构。

> [!PRACTICE]
> 当任务主要是按唯一标识精确查询和更新，且不依赖遍历次序时，可以考虑 `unordered_map`。不要把偶然看到的输出顺序用于报告顺序或业务优先级，也不要把 `std::hash` 的结果保存为跨运行稳定的记录编号。

## 参考资料

- [C++23 工作草案：unordered_map 的键、元素类型与接口](https://timsong-cpp.github.io/cppwp/n4950/unord.map.overview)
- [C++23 工作草案：哈希、等价关系、桶与查找复杂度](https://timsong-cpp.github.io/cppwp/n4950/unord.req)
- [C++23 工作草案：标准哈希函数对象](https://timsong-cpp.github.io/cppwp/n4950/unord.hash)
- [C++23 工作草案：哈希函数的结果与稳定性要求](https://timsong-cpp.github.io/cppwp/n4950/hash.requirements)
- [C++23 工作草案：无序映射的下标与 at](https://timsong-cpp.github.io/cppwp/n4950/unord.map.elem)
