---
title: 时长与单位类型（Durations and Unit Types）
date: 2026-10-08
order: 1
---

# 时长与单位类型（Durations and Unit Types）

同样的整数 1500，可以表示毫秒、秒或次数。`std::chrono` 把时间单位放进类型，使相加和转换建立在明确比例上。

## duration 保存数值与单位比例

`<chrono>` 中的时长（Duration）`std::chrono::duration<Rep, Period>` 使用 Rep 保存数值，Period 表示每个单位相对于秒的比例。milliseconds、seconds 等是常用时长别名。

省略 Period 时，每个计数单位默认是一秒，因此 `duration<double>` 用 double 保存秒数。

```cpp
#include <chrono>
#include <iostream>

int main() {
    const std::chrono::milliseconds delay{1500};
    const auto whole = std::chrono::duration_cast<std::chrono::seconds>(delay);
    const std::chrono::duration<double> precise{delay};

    std::cout << whole.count() << '\n';   // 1
    std::cout << precise.count() << '\n'; // 1.5
}
```

`count()` 取出当前类型单位下的数值。`duration_cast` 明确执行单位转换；整数目标无法保存小数，本例向零截去不足一秒的部分。

## 转换还受表示范围约束

由秒转换到毫秒可能扩大数值，目标表示类型还须容纳结果。单位类型阻止含义混用，不自动消除溢出。

chrono 只允许满足相应条件的隐式时长转换；可能截断的整数单位转换通常需要显式 cast。需要特定舍入策略时，可以使用该库的 floor、ceil、round 等相应接口，并核对目标表示与舍入契约。

> [!IMPORTANT]
> count 的结果离开时长类型后失去单位信息。接口尽量传递 duration；确需整数协议值时，先指定目标单位，再验证范围和舍入策略。

## 参考资料

- [C++23 工作草案：duration](https://timsong-cpp.github.io/cppwp/n4950/time.duration)
- [C++23 工作草案：时长转换](https://timsong-cpp.github.io/cppwp/n4950/time.duration.cast)
