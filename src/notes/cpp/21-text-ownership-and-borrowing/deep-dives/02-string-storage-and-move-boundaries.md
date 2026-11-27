---
title: 字符串的存储选择与移动边界（String Storage and Move Boundaries）
date: 2026-09-15
order: 2
---

# 字符串的存储选择与移动边界（String Storage and Move Boundaries）

`std::string` 拥有连续字符。实现可以把字符放在对象内部，也可以让对象管理一块外部存储。存放位置影响移动构造时需要处理的信息，也会影响旧字符访问能否继续使用。[文本借用的移动边界](../05-text-lifetimes-and-interface-boundaries.md#移动字符串也不能保证旧视图跟随目标)

## 短文本可以直接放进拥有者对象

一些标准库实现可以把较短的文本放在 `std::string` 对象内的字符数组中，省去单独分配和释放字符存储的开销。这称为短字符串优化（Small String Optimization，SSO）。

在 libc++ 22.1.0 中，短表示与长表示共用一个联合体（union）的存储。短表示直接包含内嵌字符数组，长表示保存外部字符存储的指针、长度和容量。实现根据长表示的大小计算内嵌容量。下面的示意只画字符的拥有关系。

```text
短表示：string 对象 [管理信息 | 内嵌字符数组]

长表示：string 对象 [管理信息 | 指针] ──拥有──> 外部字符存储
```

在这个版本中，采用短表示的字符串调用 `reserve`，请求超过当前容量且预留成功时，会换用外部存储。原文本和长度保持原值，因此相同的短文本可以使用不同的存储表示。

SSO 的布局、可容纳的字符数量和使用条件由实现决定，也可能随平台和构建配置变化。

## 移动的成本取决于能转交什么

这里讨论只传入源字符串的普通移动构造。C++23 要求该操作具有恒定复杂度。下表按源对象当前采用的表示，说明 libc++ 22.1.0 怎样构造目标字符串。[移动构造与资源责任](../../17-rvalue-references-and-move-semantics/03-move-construction-and-resource-transfer.md#两个对象身份一份资源责任)

| 源对象当前的表示 | 普通移动构造的机制 |
| --- | --- |
| 短表示 | 将字符和管理信息复制到目标对象自己的表示空间 |
| 长表示 | 将外部存储的指针和管理信息转交目标，字符留在原来的外部存储中 |

短表示复制的数据量受内嵌数组容量约束。长表示只需转交固定大小的管理信息。两条路径都满足恒定复杂度。

普通移动构造保证目标取得源原有的文本值，源保持有效，状态未指定。字符串的失效规则允许这一操作使旧字符指针和引用失效。对于上表的短表示，目标把字符保存在自己的内嵌数组中，旧视图仍记录的是移动前取得的地址。

> [!IMPORTANT] 移动后的文本值与字符位置
> 移动构造后的目标拥有源原来的文本值。旧视图仍保存原来的起点和长度，它能否继续读取取决于字符的有效性。需要读取目标文本时，从目标重新建立视图。

## 对象大小不是整份文本的存储账单

对一个 `std::string` 对象 `text`，`sizeof(text)` 给出对象本身占用的字节数，包括容纳其表示的空间和填充。在同一构建中，`sizeof(text)` 由类型决定，短表示和长表示的对象大小相同。长表示使用的外部字符存储另计。

`text.size()` 给出内容包含的 `char` 数量。评估存储开销时，要同时考虑对象自身的大小和它实际使用的外部存储。

> [!PRACTICE] 先确定拥有与借用，再测量字符串开销
> 先按接口职责和字符的有效期选择拥有值或借用。需要评估开销时，在目标标准库和构建配置下，结合实际文本长度与预留、追加等操作，测量字符复制与存储分配的成本。

## 参考资料

- [libc++ 22.1.0：短表示、长表示与联合体](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.0/libcxx/include/string#L804)
- [libc++ 22.1.0：预留容量](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.0/libcxx/include/string#L3065)
- [libc++ 22.1.0：普通移动构造](https://github.com/llvm/llvm-project/blob/llvmorg-22.1.0/libcxx/include/string#L922)
- [C++23 工作草案：字符串构造与移动后的状态](https://timsong-cpp.github.io/cppwp/n4950/string.cons)
- [C++23 工作草案：容器移动构造的复杂度](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts)
- [C++23 工作草案：字符串元素访问的失效规则](https://timsong-cpp.github.io/cppwp/n4950/string.require#4)
- [C++23 工作草案：sizeof 的对象大小语义](https://timsong-cpp.github.io/cppwp/n4950/expr.sizeof)
