---
title: 时钟与时间点（Clocks and Time Points）
date: 2026-10-08
order: 2
---

# 时钟与时间点（Clocks and Time Points）

日期时间用于定位现实中的时刻，经过时长用于测量一段操作。系统调整时钟时，两项需求可能需要不同设施。

## time_point 属于某个时钟

时间点（Time Point）`std::chrono::time_point<Clock, Duration>` 记录相对对应时钟基准的时长。同一时钟的时间点相减得到时长，时间点加时长得到另一个时间点。

`std::chrono::steady_clock` 是稳定时钟，保证时间点不随物理时间向后走，适合经过时长与超时期限。

```cpp
#include <chrono>
#include <iostream>

int main() {
    const auto first = std::chrono::steady_clock::now();
    const auto second = std::chrono::steady_clock::now();
    const auto elapsed = second - first;
    std::cout << (elapsed >= std::chrono::steady_clock::duration::zero()) << '\n'; // 1
}
```

两次读数可能相同，非负不证明时钟具有任意高分辨率，也不证明被测操作耗时为零。

## 系统时刻和稳定计时不混用

`system_clock` 服务于系统日历时间，可以被校正。`high_resolution_clock` 只强调实现提供的精度属性，可能是其他时钟的别名，不统一承诺稳定性。

不同 Clock 类型的时间点不能只因都能取 count 就直接相减。跨系统保存时间点，还要规定纪元、单位、时区与精度；日期表示与时区换算不等于等待期限。

> [!PRACTICE]
> 测量操作和设置经过时长期限时，以 steady_clock 为起点。展示或保存现实日期时使用对应日历时间契约，并独立处理时区和外部格式。

## 参考资料

- [C++23 工作草案：时钟](https://timsong-cpp.github.io/cppwp/n4950/time.clock)
- [C++23 工作草案：time_point](https://timsong-cpp.github.io/cppwp/n4950/time.point)
