---
title: 随机引擎与分布（Random Engines and Distributions）
date: 2026-10-08
order: 3
---

# 随机引擎与分布（Random Engines and Distributions）

生成测试读数时，需要分别决定“怎样产生伪随机序列”和“怎样让结果落在所需范围”。引擎和分布承担这两项职责。

## 引擎维护序列状态，分布映射结果

`<random>` 中的 `std::mt19937` 是具有规定算法的伪随机引擎（Pseudo-Random Engine）。相同种子产生相同引擎序列。`std::uniform_int_distribution<int>` 则形成闭区间上的均匀整数分布。

```cpp
#include <iostream>
#include <random>

int main() {
    std::mt19937 first{7};
    std::mt19937 second{7};
    std::cout << (first() == second()) << '\n'; // 1

    std::uniform_int_distribution<int> pressure{200, 250};
    const int value = pressure(first);
    std::cout << (value >= 200 && value <= 250) << '\n'; // 1
}
```

每次调用推进引擎状态；反复在每次采样前用同一种子重新构造引擎，会不断得到相同起始序列。

## 可复现性必须说明边界

引擎的规定序列不等于所有分布在所有标准库中采用相同映射算法。因此只保存种子，不一定让跨库的最终分布结果逐项一致。

`std::random_device` 可用作实现提供的随机来源，但标准允许其实现条件不同，也可能失败；不能只凭名称断言一定来自硬件或一定不可预测。

> [!TIP]
> 可复现测试固定种子，并记录引擎、分布和库条件。真正不可预测的安全用途需要相应密码学随机契约，不能用普通伪随机引擎替代。

## 参考资料

- [C++23 工作草案：随机数设施](https://timsong-cpp.github.io/cppwp/n4950/rand)
