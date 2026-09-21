---
title: 自定义哈希与键等价（Custom Hashes and Key Equivalence）
date: 2026-09-21
order: 2
---

# 自定义哈希与键等价（Custom Hashes and Key Equivalence）

一条传感器记录可能同时带有编号和来源标签。若业务认定“编号相同就是同一台传感器”，两个标签不同的键也应命中同一条记录。无序映射需要把这项身份规则同时落实到等价判断和哈希计算中。

## 两个函数对象共同表达键的身份

`std::unordered_map<Key, T, Hash, KeyEqual>` 的第三、第四个类型分别指定哈希函数对象和键相等谓词。容器保存这些类型的对象，查询时用 `hash(key)` 计算哈希值，用 `equal(left, right)` 判断等价；其中 `hash`、`equal` 是这里用于说明角色的对象名。

默认的第四项是 `<functional>` 中的 `std::equal_to<Key>`，它调用键的 `==`。显式提供自己的 `KeyEqual` 后，容器使用这个谓词，不要求它与键的 `operator==` 完全相同。它也不同于 `map` 的比较器：返回真表示“是同一个键”，不是“左边排在右边前面”。

相等谓词必须形成等价关系（equivalence relation）：一个键与自身等价，交换比较方向不改变结果，且“甲与乙等价、乙与丙等价”能够推出“甲与丙等价”。按整数编号相等判断，满足这些条件。

下面的 `sensor_key` 保存编号与标签，`same_sensor` 只比较编号，`sensor_hash` 也只对编号计算哈希。两个调用函数都只读取参数；其中的整数比较和标准整数哈希不抛异常，因此可以声明为 `noexcept`。

```cpp
#include <cstddef>
#include <functional>
#include <iostream>
#include <string>
#include <unordered_map>

struct sensor_key {
    int id;
    std::string label;
};

struct sensor_hash {
    std::size_t operator()(const sensor_key& key) const noexcept {
        const std::hash<int> hash_id{};
        return hash_id(key.id);
    }
};

struct same_sensor {
    bool operator()(const sensor_key& left, const sensor_key& right) const noexcept {
        return left.id == right.id;
    }
};

int main() {
    std::unordered_map<sensor_key, int, sensor_hash, same_sensor> readings{};
    readings.try_emplace(sensor_key{10, "front-left"}, 240);

    const auto repeated{readings.try_emplace(sensor_key{10, "renamed"}, 250)};
    std::cout << repeated.second << ' ' << readings.size() << '\n';
    std::cout << repeated.first->first.label << ' ' << repeated.first->second << '\n';

    const auto position{readings.find(sensor_key{10, "query"})};
    if (position != readings.end()) {
        std::cout << position->second << '\n';
    }
}
```

输出为 `0 1`、`front-left 240` 和 `240`。创建空容器时默认构造了两个规则对象。后来传入的键虽然标签不同，但编号相同，哈希值也相同，所以仍能找到最初保存的元素。

`repeated.first` 是返回结果中的迭代器，`repeated.first->first` 是元素中的键；查询参数不会替换这个键。若标签本来就是需要持续更新的数据，把编号单独作为键、把标签放入映射值，通常更直接。

## 等价的键必须得到相同哈希值

上述设计可以写成一个条件：只要 `equal(left, right)` 为真，`hash(left) == hash(right)` 就必须为真。实现哈希时应依据这项身份规则选择输入，而不是机械地把对象的所有字段都混进去。

如果等价判断忽略标签，哈希却把标签也用于区分结果，那么两个等价键就可能得到不同哈希值，违反容器的使用要求。它们即使偶然落入同一桶，也不能证明这套规则正确；换一组键或改变桶的组织后，原来的偶然结果便不足以支撑查找。

> [!WARNING]
> “等价却哈希不同”破坏的是正确性前提；“不等价却哈希相同”则是允许出现的碰撞。前者需要修正规则，后者需要关注分布和查找成本，不能把两者混为一谈。

## 碰撞保留记录，但可能增加查找成本

下面故意使用一个极差的哈希函数：无论编号是什么，都返回零。它仅用于把碰撞的后果明确展示出来，不是工程实现建议。第三项 `same_hash` 替换默认哈希，第四项省略，因此仍按整数 `==` 判断等价。

```cpp
#include <cstddef>
#include <iostream>
#include <unordered_map>

struct same_hash {
    std::size_t operator()(int) const noexcept {
        return 0;
    }
};

int main() {
    std::unordered_map<int, int, same_hash> readings{};
    readings.try_emplace(10, 240);
    readings.try_emplace(20, 245);

    const auto repeated{readings.try_emplace(10, 999)};
    std::cout << readings.size() << ' ' << repeated.second << '\n';
    std::cout << readings.at(10) << ' ' << readings.at(20) << '\n';
}
```

输出为 `2 0` 和 `240 245`。编号 `10` 与 `20` 的哈希相同，但并不等价，因此分别保存；再次插入 `10` 才是重复键。这里 `operator()(int)` 没有给参数起名，因为函数刻意不读取输入。

所有键都集中到同一个桶时，哈希没有提供有效的候选缩减。增加更多桶也不能分开这些相同哈希值的键，查找可能退化到线性工作量。正确的等价关系保证记录能够被区分，良好的哈希分布才让这套组织方式具有预期的查询价值。

## 存入之后维持规则和输入稳定

元素的键带有 `const`，但哈希和等价判断也可能读取外部配置，或通过 `string_view` 读取外部字符。键对象不能直接赋值，不代表它依赖的一切数据都不会改变。

对于保存在同一个容器中的键，哈希结果和两键之间的等价结果必须保持一致。若改变外部字符或规则开关，使已存键的哈希结果改变，容器不会自动把它重新登记到应在的位置；即使字符仍可访问，也已经不能依赖原来的查找契约。需要更换某条记录的键时，应在旧键仍满足上述要求时删除旧关联，再用新键插入。

规则的异常行为也属于接口条件。无序容器的单元素插入若因哈希函数以外的操作抛异常，插入没有效果；若用户提供的哈希函数本身抛出异常，不能直接套用这项保证。示例中的规则不抛异常，但容器仍可能因分配或元素构造失败而抛出异常。

> [!PRACTICE]
> 先确定哪些信息定义业务身份，再让等价判断与哈希使用一致的身份信息。规则尽量只做稳定的值计算；对于需要长期保存的文本键，拥有字符的 `std::string` 通常比依赖外部可变字符更容易维护这项契约。

## 参考资料

- [C++23 工作草案：键等价与哈希一致性的要求](https://timsong-cpp.github.io/cppwp/n4950/unord.req)
- [C++23 工作草案：unordered_map 的规则参数](https://timsong-cpp.github.io/cppwp/n4950/unord.map.overview)
- [C++23 工作草案：哈希函数的输入、返回类型与分布](https://timsong-cpp.github.io/cppwp/n4950/hash.requirements)
- [C++23 工作草案：标准哈希的异常承诺](https://timsong-cpp.github.io/cppwp/n4950/unord.hash)
- [C++23 工作草案：无序关联容器的异常保证](https://timsong-cpp.github.io/cppwp/n4950/unord.req.except)
