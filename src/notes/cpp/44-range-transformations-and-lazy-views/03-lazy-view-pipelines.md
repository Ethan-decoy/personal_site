---
title: 延迟视图与处理链（Lazy Views and Processing Pipelines）
date: 2026-10-08
order: 3
---

# 延迟视图与处理链（Lazy Views and Processing Pipelines）

“选出合格读数，再减去基准，取前两项”可以是对数据的描述，不必立即生成几份中间 vector。范围视图（Range View）保存遍历方式，在读取时产生相应元素。

## 适配器组合的是遍历规则

`<ranges>` 中的 `std::views` 提供范围适配器（Range Adaptor）：`filter` 筛选满足谓词的项，`transform` 对读取项作变换，`take` 限制最多取得的项数。

`|` 在这里是库定义的组合运算，将范围交给适配器；它不是位或计算。

```cpp
#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> source{200, 220, 240, 260};
    auto selected = source | std::views::filter([](int value) { return value >= 220; }) |
                    std::views::transform([](int value) { return value - 200; }) |
                    std::views::take(2);

    for (int value : selected) {
        std::cout << value << ' ';
    }
    std::cout << '\n'; // 20 40

    source[1] = 230;
    std::vector<int> saved;
    for (int value : selected) {
        saved.push_back(value);
    }
    std::cout << saved[0] << ' ' << saved[1] << '\n'; // 30 40
}
```

selected 本身没有保存两个独立结果值。第二次读取观察源值的变化；saved 则在循环中形成自己的元素，成为一次明确的结果快照。

## 延迟计算改变执行时刻与次数

构造视图与完整遍历是不同操作。filter 的搜索可以在取得起点或推进时发生，transform 的计算在访问对应元素时发生；适配器还可能缓存部分位置。

不能依赖某项回调恰好执行一次。相同输入的谓词和变换应满足相应稳定调用契约，不把必需日志、计数或修改塞进“应该只访问一遍”的假设中。

> [!IMPORTANT]
> 视图保存处理规则，结果通常在遍历时产生。需要独立结果、重复计算不合适或源寿命不足时，应明确物化到拥有型容器。

## 筛选范围还依赖元素和位置稳定性

修改源容器的结构可能使视图已保存或缓存的位置失效。即使不改变结构，改变筛选条件所依赖的值，也不能假定视图会重新扫描全部数据。

通过 filter 的迭代入口改写元素，使它不再满足谓词，违反该视图的相应使用条件。需要这样的更新时，先明确原容器中的修改范围或收集结果，再进行修改。

## 参考资料

- [C++23 工作草案：范围适配器](https://timsong-cpp.github.io/cppwp/n4950/range.adaptors)
- [C++23 工作草案：filter_view](https://timsong-cpp.github.io/cppwp/n4950/range.filter)
- [C++23 工作草案：transform_view](https://timsong-cpp.github.io/cppwp/n4950/range.transform)
