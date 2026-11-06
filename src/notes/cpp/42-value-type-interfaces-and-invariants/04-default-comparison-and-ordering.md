---
title: 默认比较与顺序类别（Default Comparison and Ordering Categories）
date: 2026-10-08
order: 4
---

# 默认比较与顺序类别（Default Comparison and Ordering Categories）

“成员可以比较”不保证“按成员声明顺序比较”就是业务需要的顺序。默认比较减少重复实现，仍需要先明确相等身份和排序依据。

## 默认三路比较按子对象顺序工作

三路比较运算符（Three-Way Comparison Operator）`<=>` 返回比较类别，表达小于、相等或大于；某些类别还允许无法比较。

`<compare>` 提供比较类别类型。对下面两个整数成员，默认 `<=>` 按成员声明顺序作字典序比较，结果为 `std::strong_ordering`；此处还隐式形成默认的 `==`。

这里的字典序比较（Lexicographical Comparison）先比较 `channel`；两项不同，就由它确定顺序。只有 `channel` 相同，才继续比较 `sequence`。两个成员都相同，结果才是相等。

```cpp
#include <compare>
#include <iostream>

struct reading_key {
    int channel;
    int sequence;
    auto operator<=>(const reading_key&) const = default;
};

int main() {
    const reading_key first{1, 3};
    const reading_key second{1, 4};
    std::cout << (first < second) << ' ' << (first == second) << '\n'; // 1 0
    std::cout << ((first <=> second) < 0) << '\n';                     // 1

    const reading_key earlier{1, 9};
    const reading_key later{2, 0};
    std::cout << (earlier < later) << '\n'; // 1
}
```

`first` 与 `second` 的 `channel` 都是 1，因此由 `sequence` 的 3 小于 4 确定顺序。对照中，`earlier` 的 `channel` 为 1，已经小于 `later` 的 2；即使它的 `sequence` 为 9、大于另一项的 0，也不再改变结果。成员的声明顺序由此决定哪一项先参与判断。

语言可根据三路比较形成相应关系表达式。手写任意 `<=>` 不等于所有情况下都自动获得相等比较；本例的相等生成依赖默认声明及相关规则。

## 比较类别保留不同保证

| 类别 | 可以表达的关系 |
| --- | --- |
| strong_ordering | 小于、相等、大于；等价值在该顺序所承诺的替代意义上可互换 |
| weak_ordering | 小于、等价、大于；等价不必具有相同表示或全部可观察属性 |
| partial_ordering | 小于、等价、大于，也允许无序 |

把这些关系放回具体对象，可以看出表中“相等”与“等价”的范围。两个 `reading_key{1, 3}` 的对应整数成员都相等，默认比较给出 strong_ordering 的相等结果。若另一项文本业务按忽略字母大小写的顺序比较，`"front"` 与 `"FRONT"` 可以在该顺序中等价，读取原字符却仍能看到差异；weak_ordering 允许这种关系。

strong_ordering 的相等还承诺该顺序中的替代性：经公开 const 成员读取比较相关状态时，等价值应给出相同结果。对象地址或与比较无关的缓存不属于这项承诺，不能把“可互换”扩大成任意外部观察都相同。

无序又是另一种结果。例如 NaN 与 `220.0` 作三路比较会得到 partial_ordering 的无序结果，既不表示小于或大于，也不表示正常的等价。**无法比较出大小，不等于两项在当前顺序中等价。**NaN 的关系不会因为换成 `<=>` 而消失。

含浮点成员的默认比较可能得到 partial_ordering。用这种关系构造排序比较器时，要核对实际输入范围能否满足严格弱序；类别允许无序，并不表示每个限定输入集合都一定存在无序项。需要直接调用的是这些关系的区别，类别的精确运算和返回类型则按当前成员及输入值域核对文末条款。

默认相等按各对应子对象相等判断；默认顺序按子对象顺序比较。它们不能替代“忽略时间戳”“只按业务编号识别”等领域契约。

> [!WARNING]
> 增加成员或调整声明顺序，可能改变默认比较的含义。若成员只是缓存、诊断信息或可变元数据，不应未经审查就把整份对象的默认比较当作稳定业务身份。

## 参考资料

- [C++23 工作草案：默认比较](https://timsong-cpp.github.io/cppwp/n4950/class.compare)
- [C++23 工作草案：比较类别](https://timsong-cpp.github.io/cppwp/n4950/cmp.categories)
