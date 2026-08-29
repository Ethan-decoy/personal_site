---
title: 引用的语言语义与实现模型（Reference Semantics and Implementation Models）
date: 2026-08-28
order: 1
---

# 引用的语言语义与实现模型（Reference Semantics and Implementation Models）

引用在源码中建立对象身份关系，编译后的程序则必须用目标平台提供的寄存器、地址和存储完成这项行为。语言语义与实现手段可以相互对应，但不能把某一种机器实现反过来当作引用的定义。

## 语言规定绑定关系

```cpp
int engine_temperature_c{78};
int& observed_temperature_c{engine_temperature_c};

observed_temperature_c = 82;
```

C++ 对这段代码规定的是：

- `observed_temperature_c` 是引用变量，不是对象；
- 引用初始化把它绑定到 `engine_temperature_c`；
- 引用绑定完成后不能改为指代另一个对象；
- 名称表达式 `observed_temperature_c` 是指定 `engine_temperature_c` 的 lvalue；
- 赋值最终修改 `engine_temperature_c`。

这些语义足以判断程序中哪个对象被访问，不需要先假定引用在内存中采用哪种 bit pattern。

标准明确保留了一项实现自由：**引用是否需要独立存储并没有被规定。**引用变量具有生命周期，绑定关系在这段时间内存在；但这不等于语言承诺某片内存中一定存放着一个固定大小的“引用值”。

## 源代码不能取得引用自身的对象地址

```cpp
int engine_temperature_c{78};
int& observed_temperature_c{engine_temperature_c};

bool same_address{&observed_temperature_c == &engine_temperature_c}; // true
```

`observed_temperature_c` 作为表达式时指定被绑定对象，因此 `&observed_temperature_c` 取得的是 `engine_temperature_c` 的地址。这条表达式不能用来观察引用实现可能占用的存储位置。

这与指针对象不同：

```cpp
int* temperature_target{&engine_temperature_c};
int** pointer_address{&temperature_target};
```

`temperature_target` 是 `int*` 对象，`&temperature_target` 能够取得这个指针对象自身的地址。引用不是对象，语言没有提供一个与 `&temperature_target` 对称的表达式去取得“引用对象地址”。

**引用名称的表达式语义已经落在被绑定对象上；可能存在的实现存储不构成另一个可由 C++ 对象操作访问的引用对象。**

## 常见 ABI 使用对象地址传递引用

第五章的[应用二进制接口：编译产物之间的契约](../../05-functions/deep-dives/02-application-binary-interface.md)已经建立了 ABI 的通用模型。本篇只观察其中与引用有关的一项实现规则：以许多 GCC 与 Clang 目标采用的 Itanium C++ ABI 为例，引用参数通过指向被绑定对象的指针传递，引用返回也以指向目标对象的指针形式返回。

```cpp
void increase_temperature_c(int& temperature_c) {
    ++temperature_c;
}
```

在这种 ABI 下，调用者可以把目标对象的地址放入约定的寄存器或参数位置，函数再借此访问对象。这个方案自然满足“被调用函数需要找到同一个对象”的语言语义。

它仍然只是特定 ABI 的二进制契约：

- C++ 标准没有规定引用参数必须使用机器指针；
- 不同平台可以采用不同调用约定；
- 地址位于寄存器还是内存槽，由调用约定与生成代码决定；
- ABI 使用地址传递，也不会让源码中的引用获得空指针或重新赋值能力。

## 优化可以消除具体表示

如果函数被内联，编译器可能直接在调用位置修改已知对象，不再生成一次真实的参数传递。即使函数没有内联，局部引用的绑定关系也可能完全由编译器在分析阶段确定，不需要为引用单独保留运行期存储。

反过来，在禁止某些优化的调试构建中，编译器也可能为引用保留一个便于生成和观察代码的地址槽。两种程序都可以满足同一份 C++ 语义。

因此，下面三种断言都超出了语言保证：

- “引用一定占一个指针大小”；
- “引用一定不占任何存储”；
- “引用一定存放在调用栈中”。

**生成代码能够说明某个编译器在特定平台、选项与上下文中的选择，不能单独证明所有 C++ 引用都采用相同的机器表示或存储形式。**

## 引用不是隐藏指针

把引用想成“实现可能借助地址找到目标”，可以帮助阅读汇编或调用约定；把引用定义成“自动解引用的 const 指针”，则会导出错误结论：

- 引用名称表达式指定被绑定对象，指针名称表达式首先指定指针对象；
- 引用不向程序暴露一份可以赋值、比较或设为空的指针值状态；
- ABI 使用地址传递引用，不会为引用增加空状态或重新绑定能力。

即使某个 ABI 用机器指针实现引用参数，这些源码层面的区别仍然成立。**实现模型只能解释语言契约怎样落到机器上，不能替换语言契约。**

## 工程判断建立在语义之上

选择引用时，应依据接口是否要求必有目标、是否保留对象身份以及是否允许经这条路径修改对象。不要因为假定引用“只是一个地址”就把所有按值参数改成引用，也不要因为调试器显示了地址形式就尝试用指针规则推演引用。

需要判断性能时，应在实际类型、目标平台、编译选项与调用路径中测量。需要判断正确性时，则先回到语言保证：引用绑定哪个对象、该对象是否仍在生命周期内，以及当前访问路径允许执行什么操作。

## 参考资料

- [C++23 工作草案：基本类型](https://timsong-cpp.github.io/cppwp/n4950/basic.types)
- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [Itanium C++ ABI：引用参数与引用返回](https://itanium-cxx-abi.github.io/cxx-abi/abi.html#normal-call)
