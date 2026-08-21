---
title: 返回值与 return 语句（Return Values and the Return Statement）
date: 2026-08-14
---

# 返回值与 return 语句（Return Values and the Return Statement）

形参与实参解决了数据怎样进入函数。函数体完成计算以后，还需要把结果交还给调用位置；返回类型与 `return` 语句共同描述这一过程。

## 返回类型与返回值

在基本函数形式中，函数名之前的数据类型是返回类型（return type）：

```cpp
int add(int left, int right) {
    return left + right;
}
```

这里的返回类型是 `int`。**当函数按值返回基本类型时，它表示函数正常完成调用会建立一个 `int` 结果，调用表达式也由此成为一个 `int` 表达式。**

```cpp
int total{add(2, 3)};
int scaled_total{add(2, 3) * 4};
```

两次调用都产生 `int` 值 `5`。第一个结果用于初始化 `total`；第二个结果继续作为乘法表达式的左操作数，最终使 `scaled_total` 保存 `20`。

**返回类型由函数定义确定，不会随着某一次调用的实参或函数体走过的分支而改变。调用者因此能够在不阅读实现的情况下，知道正常调用会产生哪种类型的结果。**

## 带表达式的 return 语句

对于产生值的函数，`return` 语句的基本形式是：

```text
return expression;
```

**执行这条语句时，`expression` 先完成求值，其结果随后按照函数声明的返回类型建立函数调用的结果。完成返回结果后，当前函数结束执行，控制流回到调用位置。**

```cpp
int pressure_difference(int front_pressure, int rear_pressure) {
    int difference{rear_pressure - front_pressure};
    return difference;
}
```

`return difference;` 会读取局部对象 `difference` 当前保存的 `int` 值，并用它建立函数调用的结果。**它并不是把局部对象本身交给调用者，也不意味着实现必须机械地执行一次可以观察到的复制。局部对象离开函数时会结束生命周期，已经建立的返回结果仍可由调用者继续使用。**

## 返回表达式的类型转换

**返回表达式的类型与函数返回类型不同时，只要语言允许建立相应结果，就会在返回过程中发生转换：**

```cpp
int whole_part(double measurement) {
    return measurement;
}
```

`measurement` 产生 `double` 值，而函数返回类型是 `int`。执行 `return measurement;` 时，转换发生在建立函数返回结果的过程中，具体规则参见[整数类型与浮点类型之间](../06-constants-literals-and-type-conversions/04-implicit-type-conversions.md#整数类型与浮点类型之间)。

**返回语句不是列表初始化，不会自动获得花括号初始化拒绝窄化的保护；外层列表初始化也只会看到函数调用最终产生的类型，参见[列表初始化只检查直接需要的转换](../06-constants-literals-and-type-conversions/05-narrowing-and-explicit-type-conversions.md#列表初始化只检查直接需要的转换)。**返回类型应当真实表达函数希望交付的结果；如果转换可能损失业务需要的信息，应重新检查接口和计算过程。

## 每条执行路径都需要产生结果

**对于普通非 `void`、非 `main` 函数，任何实际能够执行到函数体末尾的路径都必须先通过 `return` 产生结果：**

```cpp
int sign(int value) {
    if (value > 0) {
        return 1;
    }

    if (value < 0) {
        return -1;
    }

    return 0;
}
```

无论 `value` 为正、为负还是为零，函数都会执行到一条 `return` 语句。

下面的函数则遗漏了一条路径：

```cpp
int sign(int value) {
    if (value > 0) {
        return 1;
    }
} // value <= 0 时执行到函数体末尾
```

**如果调用真的沿着遗漏路径执行到函数体末尾，程序行为未定义。**编译器通常会为这种代码给出警告，但 C++ 并不把它统一规定为必然发生的编译错误。`main` 的函数体末尾具有特殊规则。

## 不返回值的函数

有些函数只需要执行一项行为，不需要向调用者提供可继续使用的值。它们使用 `void` 作为返回类型：

```cpp
void process_pressure(int pressure) {
    if (pressure < 0) {
        return;
    }

    // 处理有效的气压数据
}
```

**`void` 表示函数调用不产生可供调用者使用的返回值。它并不表示函数执行后不再回到调用者；函数仍会结束，控制流仍会恢复到调用位置。**

**`void` 函数可以使用不带表达式的 `return;` 提前结束，也可以自然执行到函数体末尾。对于这里的普通 `void` 函数，执行到右花括号等价于执行一条不带表达式的 `return`。**

调用 `void` 函数形成的表达式具有 `void` 类型，可以作为一条表达式语句：

```cpp
process_pressure(240);
```

但它没有能够用来初始化 `int` 等对象的返回值。

## 提前返回

`return` 不必只出现在函数体最后。函数已经能够确定结果、或确认后续工作不应继续时，可以提前返回：

```cpp
int non_negative(int value) {
    if (value < 0) {
        return 0;
    }

    return value;
}
```

当 `value < 0` 为 `true` 时，第一条 `return` 立即结束整个 `non_negative` 调用，后面的 `return value;` 不再执行。

**即使 `return` 位于 `if`、`switch` 或循环内部，它结束的也是当前整个函数。**`break` 只结束直接包含它的循环或 `switch`，`continue` 只改变当前循环的执行；`return` 则把控制流交还给函数的调用者。

相关语言规则可参阅 C++23 工作草案中的[返回语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)与[函数调用表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.call)。
