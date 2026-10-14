# 复制、借用与移动的设计动机研究 · 2026-09-11

本记录保存篇章组织的研究依据，末节反映后续讨论及本轮正文修正。语言规则按 C++23 草案 N4950 核对；Core Guidelines 是工程建议；历史提案只用于说明设计动机。篇章安排属于本次编辑判断。

## 低开销是目标，但需要先明确实现什么语义

Stroustrup 将 C++ 的目标表述为：在资源约束下仍能使用尽可能高层的抽象，抽象不应比仔细手写的对应实现增加额外时空开销。零额外开销原则兼顾未使用的设施和已使用的抽象；它不意味着程序不需要执行工作。[Foundations of C++，第 2 节与 PDF 第 4 页](https://stroustrup.com/ETAPS12-corrected.pdf#page=2)。

WG21 方向组也把直接映射硬件与零额外开销抽象作为两项基础，同时追求更简单、更有表达力、更安全的程序。这是语言设计方向，不能当作每个合法程序都会高效的保证。[P0939R1，PDF 第 4–5 页](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2018/p0939r1.pdf#page=4)。

据此，本次编辑建议的主线是：**先决定需要怎样的对象关系与责任，再减少实现这些需求时的多余工作。**把某次复制改成借用，可能减少数据复制，也会改变独立性与生命周期条件，因此需要先确认业务所需语义。

## 指针或引用可以避免复制，但三种需求不同

| 需求 | 得到的关系 | 仍需承担什么 |
| --- | --- | --- |
| 暂时读取或修改已有测量记录 | 多条访问路径指向同一对象 | 原对象在使用期间有效；其他访问路径的修改仍会影响观察结果 |
| 保存一份此后可独立修改的记录 | 目标保有独立内容 | 若类型以独立存储保存大量数据，复制这些内容是实现需求的一部分 |
| 把记录交给下一阶段负责保存、最终释放 | 目标接手资源，源按约定改变状态 | 交接必须同时处理源状态与最终释放责任 |

这是根据引用与对象生命周期规则建立的设计对照。借用已有对象时无需构造该对象的副本，但原对象和引用各有生命周期，多条访问路径也形成了需要推理的别名关系。[引用示例](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref#3)、[生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life#7)。

第二行描述独立值契约，不能推广为所有复制都深拷贝。C.61 区分值语义与指针语义：复制指针得到相同指针值，两个指针仍可指向同一对象。[Core Guidelines C.61](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#c61-a-copy-operation-should-copy)、[指针值](https://timsong-cpp.github.io/cppwp/n4950/basic.compound#3)。

## 指针已经能交接资源，移动增加了什么

2002 年的移动提案指出，当时智能指针、容器交换等操作已经能转移资源；欠缺的是让泛型代码统一使用这类能力的语法与语义。移动的动机包含减少昂贵复制，也包含把交接做成能与构造、赋值及泛型代码配合的常规操作。提案强调移动补充复制，类型可以支持二者、仅支持其一，或都不支持。[N1377 的 Motivation 与 Copy vs Move](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2002/n1377.htm)。

C++23 的具体实例是 `unique_ptr`：它禁用复制，移动构造后目标持有原指针，源的指针为空；析构按删除器契约处理所持资源。这说明移动还能表达“这一份责任只能转交，不能复制”的类型，并不限于给可复制大对象加速。[声明](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single)、[移动构造后置条件](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.ctor#18)、[析构](https://timsong-cpp.github.io/cppwp/n4950/unique.ptr.single.dtor#1)。这只是研究证据，不意味着当前篇章需要提前展开智能指针。

## 应保留的边界

- 小值复制可能比间接访问更合适。F.16 建议便宜的输入按值传，其他输入用 const 引用；收益依赖类型、架构和优化。[F.16](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f16-for-in-parameters-pass-cheaply-copied-types-by-value-and-others-by-reference-to-const)。
- 裸指针和引用本身不编码释放责任。R.3、R.4 的“非拥有”是接口约定，不能据此声称语言禁止拥有型裸指针。[R.3](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r3-a-raw-pointer-a-t-is-non-owning)、[R.4](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#r4-a-raw-reference-a-t-is-non-owning)。
- `std::move` 只产生引用转换的结果，实际构造或赋值执行类型规定的操作。默认移动逐个处理成员，指针成员不会因此自动使源指针变空；也不能假定任意移动都便宜。[C++23 forward/move helpers 第 10 段](https://timsong-cpp.github.io/cppwp/n4950/utility#forward)、[默认复制与移动构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor#14)。
- F.18 面向将取走源内容的接口，F.19 面向转发接口；二者不是普遍加速语法。C.64 建议移动后给源留下有效状态，这也不是编译器替任意用户类型自动执行的重置。[F.18](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f18-for-will-move-from-parameters-pass-by-x-and-stdmove-the-parameter)、[F.19](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#f19-for-forward-parameters-pass-by-tp-and-only-stdforward-the-parameter)、[C.64](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#c64-a-move-operation-should-move-and-leave-its-source-in-a-valid-state)。

## 篇章安排与本轮修正

最初提出在第 9 章完成成本对照，但后续讨论确认：当前小结构体足以说明独立状态与访问关系，尚不足以支撑大量数据的复制及存储接管。修正方案是在类接口之后正式建立真实序列的使用模型，再让复制、资源生命周期与移动章节依赖它。原第 11—16 章随新增章节顺延为第 12—17 章；早期审阅覆盖文件保留当时路径，作为历史快照。

| 位置 | 当前职责 |
| --- | --- |
| [第 0 章：控制力与抽象能力](../00-introduction/01-cpp-overview.md) | 说明高层表达与成本控制的设计目标，区分目标与具体程序的性能保证 |
| [第 7 章：指针复制](../07-object-addresses-and-pointers/04-pointer-copying-reseating-and-aliasing.md)、[第 8 章：引用参数](../08-object-identity-and-lvalue-references/05-reference-parameters-and-caller-objects.md) | 建立访问已有对象的用途和依赖；说明直接绑定目标不需要复制目标对象 |
| [第 9 章：结构体接口](../09-structures-and-object-composition/05-structs-in-function-interfaces.md) | 用现有小结构体比较独立状态、只读访问和原地修改 |
| [第 11 章：序列与数据访问](../11-sequences-and-data-access/_index.md) | 通过真实的 `std::vector<double>` 建立元素访问、遍历、复制与借用、存储增长及访问有效性；高层契约先于内部实现 |
| [第 15 章：类对象复制](../15-copying-class-objects-and-copyability/_index.md) | 将已知的副本关系连接到类型作者定义的复制操作与成员语义 |
| [第 16 章：资源生命周期](../16-class-object-destruction-and-resource-lifetime/_index.md) | 说明用对象生命周期承载清理责任的实现方式与适用边界 |
| [第 17 章：移动构造](../17-rvalue-references-and-move-semantics/03-move-construction-and-resource-transfer.md) | 保留登记责任的交接示例，并用真实序列的普通移动构造解释如何取得同一批元素及其存储管理关系 |

这条安排采用写作规范已有的“高层抽象可以先于实现机制”的原则。新章正式介绍当前操作需要的类型和接口契约，后续章节再解释这些操作如何由语言机制支撑。成本说明限定到具体操作；不会从小结构体或一次运行结果推出所有引用、移动都更快。
