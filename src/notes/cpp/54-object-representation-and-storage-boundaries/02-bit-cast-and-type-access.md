---
title: 表示转换与类型访问（Representation Conversion and Type Access）
date: 2026-10-08
order: 2
---

# 表示转换与类型访问（Representation Conversion and Type Access）

数值转换按源值计算目标类型的值，结果可能舍入或截断；表示转换按位形成另一类型的值。两项操作不能用同一种“强制转换”直觉解释。

## bit_cast 形成独立目标值

`std::bit_cast<To>(source)` 位于 `<bit>`，按源对象的表示形成一个独立的 `To` 值，不执行普通数值转换。它要求源类型与目标类型的 `sizeof` 相同，且两者都是可平凡复制（Trivially Copyable）类型。

**可平凡复制是一项关于对象表示的属性。**对于这种类型的完整对象，将全部字节保存到字节缓冲区，再原样复制回去，可以恢复原值；在两个仍存活的同类型完整对象之间复制全部字节，也能使目标具有源的值。“平凡”不表示复制成本低，也不等同于能调用普通拷贝构造函数。

`int`、`float` 满足这项属性；例如 `struct reading { int pressure_kpa; };` 这样沿用默认复制、移动与析构的简单类型也满足。`std::string` 可以按内容复制，却不属于可平凡复制类型：它的复制与析构还承担资源管理。`<type_traits>` 中的 `std::is_trivially_copyable_v<T>` 可以查询这项属性。

以下例子要求支持对应 IEEE 浮点表示且 float 与 uint32_t 同大小；uint32_t 在提供它的实现中是精确 32 位无符号整数类型。

```cpp
#include <bit>
#include <cstdint>
#include <iostream>
#include <limits>
#include <type_traits>

int main() {
    static_assert(std::numeric_limits<float>::is_iec559);
    static_assert(sizeof(float) == sizeof(std::uint32_t));
    static_assert(std::is_trivially_copyable_v<float>);
    static_assert(std::is_trivially_copyable_v<std::uint32_t>);
    const float pressure{220.5f};
    const auto bits = std::bit_cast<std::uint32_t>(pressure);
    const auto restored = std::bit_cast<float>(bits);
    std::cout << (restored == pressure) << '\n'; // 1
}
```

本例从有效浮点值取得表示，再转回。**大小相同与可平凡复制只是类型前提，还须检查产生的目标表示是否合法。**C++23 中，若产生的值表示不能对应目标类型的值，行为未定义；源中的填充位或未确定的位进入目标值表示时，也受到相应规则限制。因此，不能把任意整数位模式都当作合法目标值，也不能由此得到可跨平台保存的文件格式。

## reinterpret_cast 不开始新对象生命

`reinterpret_cast<T*>` 可以按规定形成另一类指针入口，不进行对应数值转换，也不因此创建 T 对象。将 int 地址改写成 float 指针后读取，不能当作 bit_cast 的替代。

类型可访问性（Type Accessibility）规则限制经哪些类型访问对象。字符或字节表示访问有相应许可，其他不相关类型的别名访问不能只凭大小相同成立。

> [!WARNING]
> 通过编译的指针转换不证明目标类型对象存在。检查表示转换的合法值，和检查经指针访问的实际对象，是两项独立工作。

## 参考资料

- [C++23 工作草案：可平凡复制与字节复制保证](https://timsong-cpp.github.io/cppwp/n4950/basic.types)
- [C++23 工作草案：bit_cast](https://timsong-cpp.github.io/cppwp/n4950/bit.cast)
- [C++23 工作草案：reinterpret_cast](https://timsong-cpp.github.io/cppwp/n4950/expr.reinterpret.cast)
- [C++23 工作草案：类型可访问性](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
