---
title: 领域值与边界责任（Domain Values and Boundary Responsibilities）
date: 2026-10-08
order: 1
---

# 领域值与边界责任（Domain Values and Boundary Responsibilities）

一个小型压力报告程序需要读取外部文本、验证数值、计算均值并保存报告。合理组合从责任分界开始，不从“把所有学过的设施都用上”开始。

## 类型保存已经成立的事实

外部文本可能有任意内容；pressure 对象只保存合法的 0–500 整数压力。工厂在创建处验证，因此取得 pressure 后可以依赖范围不变式。

下面保存为本章共用头文件 pressure-domain.hpp：

```cpp
#pragma once
#include <expected>

enum class pressure_error { out_of_range };

class pressure {
  public:
    static std::expected<pressure, pressure_error> make(int value) {
        if (value < 0 || value > 500) {
            return std::unexpected{pressure_error::out_of_range};
        }
        return pressure{value};
    }

    int read() const {
        return pressure_kpa;
    }

  private:
    explicit pressure(int value) : pressure_kpa{value} {}
    int pressure_kpa;
};
```

私有构造限制未经验证的原始输入。默认复制移动保持这个小值的不变式，不需要共享拥有者、继承层次或手写资源操作。

## 每个边界传递明确关系

| 步骤 | 输入关系 | 输出事实 |
| --- | --- | --- |
| 解析一行 | 临时借用字符范围 | 有效 pressure，或语法／范围错误 |
| 读取全部记录 | 借用输入流 | 拥有独立记录的 vector，或带行号的错误 |
| 计算均值 | 只读借用记录范围 | 独立数值；空范围没有均值 |
| 保存报告 | 借用输出资源 | 完成或失败；失败可能留下部分外部内容 |

解析不能只依赖工厂：`220kPa` 的前缀是有效压力，但不是接口约定的一整行整数。输出也不能只依赖资源析构：完成失败需要在可报告位置检查。

> [!IMPORTANT]
> 每层消费已经建立的事实，并产生下一层可依赖的事实。类型、结果状态和拥有关系共同构成接口，不能让调用方从几处散落变量重新猜出它们。

## 参考资料

- [C++23 工作草案：类访问与封装](https://timsong-cpp.github.io/cppwp/n4950/class.access)
- [C++23 工作草案：expected](https://timsong-cpp.github.io/cppwp/n4950/expected)
