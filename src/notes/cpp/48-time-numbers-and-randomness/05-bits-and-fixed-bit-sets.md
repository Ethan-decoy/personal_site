---
title: 位操作与固定比特集合（Bit Operations and Fixed Bit Sets）
date: 2026-10-08
order: 5
---

# 位操作与固定比特集合（Bit Operations and Fixed Bit Sets）

位可以表达多个独立开关；一个枚举状态则通常表示当前处于哪一项。先判断两项能否同时成立，再决定是标量状态还是比特集合。

## bitset 表达固定数量的开关

`std::bitset<N>` 位于 `<bitset>`，保存 N 个逻辑比特，默认构造时所有位都为 0。`set(position)` 将相应位设为 1，`test(position)` 读取布尔值，`count()` 统计置位项数。

`<bit>` 中的 `std::popcount` 对受支持的无符号整数统计二进制一的数量。

```cpp
#include <bit>
#include <bitset>
#include <iostream>

int main() {
    std::bitset<8> enabled{};
    enabled.set(2);
    std::cout << enabled.test(2) << ' ' << enabled.count() << '\n'; // 1 1
    std::cout << std::popcount(5u) << '\n';                         // 2，二进制 101
}
```

position 是从零开始的逻辑位号，不是对象字节地址。超出 bitset 相应检查接口的范围会抛出 out_of_range；其他访问接口仍须检查自己的前提。

## 整数位操作有独立边界

对内建整数移位 `value << shift` 或 `value >> shift`，两个操作数先各自进行整数提升。**移位量 shift 必须非负，并小于提升后的左操作数 value 所用类型的位宽。**若该位宽为 32，移位量的允许范围是 `0～31`，`32` 已经过大；并非按右操作数类型的大小判断。

选择无符号整数可以明确部分位运算与模运算关系，但不能使负移位或过大移位合法。实际使用整数移位时，先确认左操作数提升后的类型与位宽，再核对数量；bitset 的移位则另按它的成员契约判断。

比特集合的访问可能用代理对象实现，不一定得到独立 bool 的引用。vector<bool> 也有特殊的元素访问契约，不能将它无条件视为普通连续 bool 数组或直接构成 span<bool>。

> [!PRACTICE]
> 协议定义字段宽度、位序和字节序，代码再选择表示工具。bitset 管理逻辑位，不自动规定网络传输布局；普通数值转换与对象表示转换仍是不同问题。

## 参考资料

- [C++23 工作草案：bitset](https://timsong-cpp.github.io/cppwp/n4950/template.bitset)
- [C++23 工作草案：位计数](https://timsong-cpp.github.io/cppwp/n4950/bit.count)
- [C++23 工作草案：移位](https://timsong-cpp.github.io/cppwp/n4950/expr.shift)
