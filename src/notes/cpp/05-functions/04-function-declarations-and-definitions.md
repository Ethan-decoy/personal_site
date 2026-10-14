---
title: 函数声明与定义（Function Declarations and Definitions）
date: 2026-08-27
---

# 函数声明与定义（Function Declarations and Definitions）

函数调用出现时，编译器必须已经知道相应函数的名称、返回类型和参数类型。函数定义能够提供这些信息，也可以先用一条不包含函数体的声明建立调用所需的边界。

## 函数定义同时也是声明

下面的函数定义既声明了函数，也提供了调用时执行的函数体：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa) {
    return pressure_kpa + 5;
}

int calculate_target_pressure_kpa() {
    return calculate_adjusted_pressure_kpa(215);
}
```

编译器处理 `calculate_target_pressure_kpa` 的函数体时，前面的定义已经使 `calculate_adjusted_pressure_kpa` 可见，因此调用表达式能够成立。

**函数定义一定是声明，但函数声明不一定提供定义。**定义除了承诺函数具有怎样的调用边界，还提供这项行为的实现。

## 在定义之前提供声明

如果希望把被调用函数的定义放在调用位置之后，可以先写前向声明（forward declaration）：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa);

int calculate_target_pressure_kpa() {
    return calculate_adjusted_pressure_kpa(215);
}

int calculate_adjusted_pressure_kpa(int pressure_kpa) {
    return pressure_kpa + 5;
}
```

第一行没有函数体，以分号结束。它只说明：存在一个名为 `calculate_adjusted_pressure_kpa` 的函数，接收一个 `int` 参数，并产生 `int` 结果。调用位置据此完成检查；后面的定义再提供函数体。

如果删除前向声明，同时仍把定义放在调用位置之后，程序不合法：

```cpp
int calculate_target_pressure_kpa() {
    return calculate_adjusted_pressure_kpa(215); // 错误：此处尚无可见声明
}

int calculate_adjusted_pressure_kpa(int pressure_kpa) {
    return pressure_kpa + 5;
}
```

C++ 不会因为后文恰好出现了同名定义，就替较早的调用自动补出声明。**调用位置必须依据此前已经可见的声明理解函数。**

## 声明中的参数名称

函数声明中的参数名称可以省略：

```cpp
int calculate_adjusted_pressure_kpa(int);
```

参数类型足以描述当前函数的调用边界；参数名称不决定声明与定义是否指向同一个函数。因此，下面的声明与定义可以使用不同的参数名称：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa);

int calculate_adjusted_pressure_kpa(int measured_pressure_kpa) {
    return measured_pressure_kpa + 5;
}
```

语言允许这样写，但接口中的名称也承担说明数据含义的责任。**声明与定义保持相同且有意义的参数名称，更有利于读者把调用边界与函数体对应起来。**

## 多次声明与一次定义

同一个函数可以在完整程序中出现多次彼此一致的声明：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa);
int calculate_adjusted_pressure_kpa(int pressure_kpa);
```

重复声明不会创建多个函数，也不会执行任何函数体。对于当前示例中的同一函数，完整程序只能提供一份定义：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa) {
    return pressure_kpa + 5;
}
```

只有声明而始终没有定义，则调用点虽然可能拥有足够信息通过当前源文件的编译，完整程序仍缺少可以执行的函数体：

```cpp
int calculate_adjusted_pressure_kpa(int pressure_kpa);

int calculate_target_pressure_kpa() {
    return calculate_adjusted_pressure_kpa(215);
}
```

这类问题在常见构建过程中表现为链接失败，但它不同于“调用位置根本找不到声明”：前者缺少整个程序所需的定义，后者在分析调用表达式时已经无法确定函数含义。

## 函数定义不能嵌套

当前使用的普通自由函数定义位于其他函数体之外。语言把这个位置称为命名空间作用域（namespace scope）。不能在一个函数体中直接定义另一个函数：

```cpp
int calculate_target_pressure_kpa() {
    int calculate_adjusted_pressure_kpa(int pressure_kpa) { // 错误
        return pressure_kpa + 5;
    }

    return calculate_adjusted_pressure_kpa(215);
}
```

需要复用内部行为时，应当把被调用函数定义在当前函数之外，并在调用点之前提供定义或声明。代码块仍然可以包含对象声明和控制流，却不是普通自由函数定义的合法位置。

**声明使函数在当前位置可被认识；定义使完整程序拥有能够执行的函数体。**把这两项责任分开，函数之间就不必完全依赖源码中的定义先后排列。

## 参考资料

- [C++23 工作草案：函数](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct)
- [C++23 工作草案：函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)
