---
title: 移动接口的设计边界（Design Boundaries of Move Interfaces）
date: 2026-09-05
order: 8
---

# 移动接口的设计边界（Design Boundaries of Move Interfaces）

每项校准登记应当恰好解除一次。由另一个对象接手时，接口要交代谁负责最终解除、源对象此后还能怎样使用，以及计数是否存活到解除时。

## 不可复制的责任也可以转交

本篇沿用前文可移动的 `registration`。每项登记只允许一个对象负责解除，因此这个类型删除了复制操作。移动构造和移动赋值可以把同一项登记交给另一个对象，`is_active()` 用来查询对象当前是否承担登记。见[登记的移动构造](03-move-construction-and-resource-transfer.md#让源对象能够处于无责任状态)和[登记的移动赋值](04-move-assignment-and-existing-resource-responsibility.md#结束旧责任再接收新责任)。

复制和移动分别表达接口决定。对这类资源对象，能否允许移动，要看解除责任及其关联状态能否一起转交给目标。

对象身份也可能约束转交。假设调用方保存了对 `source` 的引用。把登记交给另一个对象后，原引用仍绑定 `source`。在 `source` 存活且尚未接手新登记时，经这个引用调用 `is_active()` 会得到 `false`。如果调用方必须一直通过这个引用访问原来的活动登记，转交给另一个对象就会违反该约定。

## 按照契约使用交接后的源对象

> [!IMPORTANT] 按选中的操作判断移后状态
> **在构造或赋值处，先根据类声明、来源类型和值类别确定重载选择，再按所选操作的契约使用源和目标。** `std::move(source)` 提供指代源对象的将亡值，由选中的操作处理对象状态。能绑定该来源的复制构造也可能被选中。

`registration` 向另一个对象交接后，源进入空状态。它可以接受活动状态查询、通过移动赋值接手新登记，或结束生命周期。自移动赋值在本例中保留原登记。见[空状态参与赋值](04-move-assignment-and-existing-resource-responsibility.md#空状态也参与赋值)和[自移动赋值的约定](04-move-assignment-and-existing-resource-responsibility.md#本例自移动时保留原登记)。

标准库类型默认保证移后对象有效，具体状态未指定，类型可另行给出更明确的保证。例如，可以用 `empty()` 查询移后的 `std::vector` 是否为空，并在按下标访问前核对当前大小。设计自己的移动接口时，应让操作成功后的源和目标都满足类不变式，并明确后续操作所需的条件。

## 责任交接不修复外部生命周期

> [!WARNING] 计数必须存活到最终解除登记
> `registration` 负责解除登记，计数对象由调用方持有，`counter` 借用它。登记转交之后，所借用的计数必须存活到接收方解除这项登记。解除可能发生在析构时，也可能发生在后续移动赋值中。
>
> 如果计数对象的生命周期先结束，接收方保存的 `counter` 就会悬垂。随后清理时执行 `--(*counter)` 会产生未定义行为。

前面的移动赋值示例把两个计数声明在登记对象的外层作用域。目标解除旧登记时，旧计数有效。目标随后销毁并解除接手的登记时，另一个计数也仍有效。见[移动赋值中的计数生命周期](04-move-assignment-and-existing-resource-responsibility.md#结束旧责任再接收新责任)。

## 在责任边界处实现，在组合边界处复用

`inspection` 把轮胎编号 `tire_id` 与负责登记的成员 `entry` 组合起来。见[检查对象的定义和默认移动示例](05-generation-and-selection-of-move-operations.md#默认移动把成员分别交给相应操作)。

> [!PRACTICE] 成员操作满足外层约定时复用默认移动
> 假如对活动的 `registration` 使用默认移动构造，源和目标都会持有同一计数指针。随后两者各自析构时，就会对同一项登记递减两次。实际的移动构造转交 `counter` 后将源指针设为空，由目标负责解除。`inspection` 可以让默认移动调用 `entry` 的移动操作，避免在外层重复实现登记规则。
>
> 检查默认移动完成后的成员组合。源 `inspection` 保留原来的 `tire_id`，`entry.is_active()` 返回 `false`，本例允许这样的状态。如果类型约定非零编号必然对应活动登记，这组状态就会破坏类不变式，移动操作需要维护编号与登记的关系。

## 性能收益服从真实操作

只传源容器的 `std::vector` 移动构造接管已有元素，复杂度为常数。若使用显式传入分配器的重载，且传入的分配器与源的不相等，该构造的复杂度为线性。见[采样序列的移动构造](03-move-construction-and-resource-transfer.md#从序列副本到已有元素的接管)。

调用方允许源序列状态改变，且所选移动构造能接管其元素时，可以省去创建副本的工作。需要各自独立的两组元素时，复制负责建立第二组元素。只需读取时，可以借用源序列，前提是序列在整个访问期间保持有效。

可复制的读数快照 `snapshot` 只保存一个整数。由将亡值初始化时，重载决议选中复制构造，仍要用源读数初始化目标成员。见[快照的复制构造示例](05-generation-and-selection-of-move-operations.md#没有移动操作也可能接收右值)。

移动赋值还要核对目标原有状态的处理成本。例如，在两个不同的 `registration` 对象之间赋值时，目标有旧登记就会先递减原计数，再接手来源的登记。评估收益时，应按实际选中的操作核对接管了哪些资源，以及仍需完成哪些初始化和清理。

## 参考资料

- [C++ Core Guidelines：移动操作应保持源对象处于有效状态](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-move-semantic)
- [C++23 对象生命周期规则](https://timsong-cpp.github.io/cppwp/n4950/basic.life#7)
- [C++23 标准库类型的移后状态](https://timsong-cpp.github.io/cppwp/n4950/lib.types.movedfrom)
- [C++23 默认移动构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor#14)
- [C++23 默认移动赋值](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign#12)
- [C++23 分配器感知容器的移动构造](https://timsong-cpp.github.io/cppwp/n4950/container.alloc.reqmts#16)
