---
title: 模块接口与导入（Module Interfaces and Imports）
date: 2026-10-08
order: 3
---

# 模块接口与导入（Module Interfaces and Imports）

头文件按文本包含提供声明；模块（Module）将接口声明按模块归属和可见性组织，导入（Import）取得相应接口，不简单复制全部预处理文本。

## export 选择公开声明

下面接口文件 pressure.cppm：

```cpp
export module pressure;

export int read_pressure() {
    return 220;
}
```

调用方 main.cpp：

```cpp
import pressure;
#include <iostream>

int main() {
    std::cout << read_pressure() << '\n'; // 220
}
```

`export module pressure;` 声明具名模块接口；export 函数提供可导入接口。未导出的内部声明仍可供模块自身实现使用，不自动成为调用方普通可见名称。

## 构建先形成导入依赖

模块接口需要按工具链协议生成可供导入的编译产物，再编译依赖它的翻译单元，并链接相关对象代码。文件扩展名、产物格式与命令选项是工具链约定，不是可跨编译器复用的标准二进制格式。

需要在模块中包含传统头文件时，可以使用全局模块片段 `module;`，把对应预处理包含安排在模块声明之前，按模块规则控制归属。头文件单元与具名模块也不是同一形式。

C++23 规定标准库模块，但使用 `import std;` 还需要实现支持和正确构建配置；不能只用普通头文件编译命令就假定可导入。

> [!IMPORTANT]
> 模块改变声明的组织与导入依赖，不取消 ODR、链接、对象初始化或 ABI 要求。迁移时按接口边界与构建依赖推进，不只把 include 改成 import。

## 参考资料

- [C++23 工作草案：模块](https://timsong-cpp.github.io/cppwp/n4950/module)
- [Clang 官方文档：标准 C++ 模块与构建](https://clang.llvm.org/docs/StandardCPlusPlusModules.html)
