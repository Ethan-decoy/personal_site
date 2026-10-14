---
title: C 接口与语言边界（C Interfaces and Language Boundaries）
date: 2026-10-08
order: 2
---

# C 接口与语言边界（C Interfaces and Language Boundaries）

C 与 C++ 可以共同组成程序，但调用入口的语言链接、类型布局和错误契约要明确。`extern "C"` 只处理相应语言链接，不把任意 C++ 类型改造成 C 能理解的对象。

## 共用头文件条件声明语言链接

语言链接（Language Linkage）描述函数类型与名称的相关链接关系。下面头文件 pressure-api.h 用 `__cplusplus` 检测 C++ 编译语境；该宏由实现定义，不是用户自己命名的接口。

```c
#ifndef PRESSURE_API_H
#define PRESSURE_API_H

#ifdef __cplusplus
extern "C" {
#endif

int pressure_is_valid(int value);

#ifdef __cplusplus
}
#endif

#endif
```

实现保存为 pressure-api.cpp：

```cpp
#include "pressure-api.h"

int pressure_is_valid(int value) {
    return value >= 0 && value <= 500;
}
```

C 调用方保存为 main.c：

```c
#include "pressure-api.h"
#include <stdio.h>

int main(void) {
    printf("%d\n", pressure_is_valid(220));
    return 0;
}
```

分别用 C++ 与 C 编译器编译为目标文件，再用兼容工具链链接，输出 1。实现定义继承前置声明的链接关系。extern C 不强制函数体采用 C 语法。

## 对象与失败不能越界猜测

边界通常选择双方已约定的整数、缓冲区和不透明句柄，明确长度、所有权、释放入口与错误码。标准库 string、expected 或可抛异常的类接口，不是 C 调用方自动理解的格式。

异常不能任意穿过不具备相应异常处理契约的 C 调用链；C++ 适配层应按约定捕获并转换。上面仅做不抛出的整数比较，不依赖异常传播。

> [!IMPORTANT]
> 语言链接连接调用名称与类型规则，不保证任意工具链二进制兼容，也不定义资源释放和错误协议。互操作边界仍需共同 ABI 与表示约定。

## 参考资料

- [C++23 工作草案：语言链接](https://timsong-cpp.github.io/cppwp/n4950/dcl.link)
