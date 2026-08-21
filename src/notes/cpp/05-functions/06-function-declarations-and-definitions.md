---
title: 函数声明与定义（Function Declarations and Definitions）
date: 2026-08-14
---

# 函数声明与定义（Function Declarations and Definitions）

普通函数的定义可以位于调用位置之前：

```cpp
int add(int left, int right) {
    return left + right;
}

int main() {
    int total{add(2, 3)};
    return 0;
}
```

函数定义本身已经向后续代码引入函数名称及其类型信息，因此 `main` 能够形成正确的调用。但程序规模扩大后，源码的阅读顺序和函数实现的排列顺序未必始终相同；这就需要将函数声明与函数定义区分开来。

## 函数声明

**函数声明（function declaration）向当前作用域引入函数名称，并提供形成调用所需的类型信息。普通函数声明可以概括为：**

```text
return_type function_name(parameter_list);
```

例如：

```cpp
int add(int left, int right);
```

这条声明告诉编译器：存在一个名为 `add` 的函数，它接收两个 `int` 参数，并产生 `int` 结果。声明没有提供函数体，不会说明加法具体怎样完成。

**末尾的分号是函数声明的一部分，用于结束这条声明。它与函数定义不同：函数定义由函数体的右花括号结束，后面不再添加分号。**

函数声明提供的信息已经足以让编译器检查后续调用中的函数名、实参数量以及基本类型关系：

```cpp
int add(int left, int right);

int result{add(2, 3)};
```

**C++ 不会看到 `add(2, 3)` 后再自动猜测并补出函数声明。形成调用时，名称查找必须已经能够找到相应声明。**

## 函数定义

函数定义（function definition）在声明所提供的信息之外，进一步给出函数体：

```cpp
int add(int left, int right) {
    return left + right;
}
```

定义同样会引入并描述函数，**因此每个函数定义也都是一次声明；反过来，只有函数声明而没有函数体时，它并不是定义。**

可以将二者的职责概括为：

| 结构 | 提供的信息 |
|---|---|
| 函数声明 | 函数存在，以及调用所需的名称和类型信息 |
| 函数定义 | 函数声明的信息，以及真正执行的函数体 |

**普通函数不能直接定义在另一个函数体内部：**

```cpp
int main() {
    int add(int left, int right) { // 错误：不能在函数体内定义普通函数
        return left + right;
    }

    return 0;
}
```

函数体内部可以调用其他函数，但这类普通函数的完整定义需要放在函数体之外。

## 前向声明

当函数定义位于使用位置之后时，可以先写一条函数声明：

```cpp
int add(int left, int right);

int main() {
    int total{add(2, 3)};
    return 0;
}

int add(int left, int right) {
    return left + right;
}
```

第一行使 `add` 的名称与类型信息在 `main` 之前可见，因此编译器能够处理其中的函数调用。位于完整定义之前、让前面的代码能够使用该名称的声明，**通常称为前向声明（forward declaration）。前向声明不是另一种特殊语法；它仍然是一条普通函数声明，只是承担了提前提供信息的作用。**

**程序运行时不会执行前向声明。调用发生后，最终执行的是后面函数定义中的函数体。**

## 声明与定义需要保持一致

**同一个函数可以在程序中被声明多次，但这些声明必须彼此对应并一致地描述同一函数。在当前使用的基本类型示例中，应当让前向声明与定义保持相同的返回类型和参数类型：**

```cpp
int add(int left, int right);

int add(int left, int right) {
    return left + right;
}
```

**形参名称不属于区分这个函数所需的类型信息，因此声明中可以省略名称：**

```cpp
int add(int, int);
```

声明与定义中的形参名称也可以不同：

```cpp
int add(int first, int second);

int add(int left, int right) {
    return left + right;
}
```

不过，**在供人阅读的声明中保留有意义的形参名称，并让它们与定义保持一致，通常更能直接表达每个参数的用途。**

函数声明的一致性还有更完整的类型规则。当前只使用已经认识的基本类型时，让同一函数的声明与定义采用完全一致的返回类型与参数类型，就能形成清晰而稳定的写法。

## 声明不能代替定义

**声明足以让编译器处理调用位置，但实际执行函数仍然需要定义：**

```cpp
int add(int left, int right);

int main() {
    return add(2, 3);
}
```

如果整个程序始终没有提供 `add` 的定义，单个源文件的编译阶段可能仍然成功，但链接器通常无法找到调用所需的实现，最终构建失败。**声明回答“这个函数可以怎样被调用”，定义回答“调用以后具体执行什么”。**

**如果程序实际调用了 `add`，整个程序就必须提供 `add` 的定义。同一个 `add` 可以被一致地声明多次，但不能提供多份定义。**这属于单一定义规则（One Definition Rule，ODR）的基础部分。

## 接口与实现

**函数声明只公开调用所需的信息，函数定义则保存实现细节。**这种分离为组织更大的 C++ 工程提供了基础：头文件通常存放需要由多个源文件共享的函数声明，源文件则提供相应函数定义。

调用代码只需要看到声明便能通过函数接口表达需求，不需要把实现细节复制到每个使用位置。构建程序时，各个源文件经过编译，链接器再把调用与相应定义连接起来。

**声明描述函数接口，定义提供函数实现，调用使用这项接口。**

相关语言规则可参阅 C++23 工作草案中的[声明与定义](https://timsong-cpp.github.io/cppwp/n4950/basic.def)、[函数定义](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.def.general)与[单一定义规则](https://timsong-cpp.github.io/cppwp/n4950/basic.def.odr)。
