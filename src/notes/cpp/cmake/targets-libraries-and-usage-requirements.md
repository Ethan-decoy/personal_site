---
title: CMake Target、库与使用要求
date: 2026-07-23
---

# CMake Target、库与使用要求

CMake 的核心对象是 target（构建目标），不是目录中的全部文件。target 描述要生成的产物，以及它需要的源码、语言特性、头文件路径和其他 target。

## 配置、生成与构建

在 PowerShell 或 `cmd.exe` 中，可以使用不依赖 Bash 续行符的命令：

```text
cmake -S . -B build -G Ninja -DCMAKE_CXX_COMPILER=clang++
cmake --build build
```

`-S` 指定源码目录，`-B` 指定构建目录。首次命令完成配置和生成，第二条命令调用生成的构建系统。

generator 决定生成哪种构建系统，例如 Ninja、Visual Studio 或 MinGW Makefiles。编译器负责把源码翻译成目标代码；两者不是同一个选择。

编译器和 generator 会进入构建目录的缓存。切换它们时，使用新的构建目录或删除旧缓存后重新配置，不要假设修改命令会安全覆盖既有缓存。

## 一个自洽的项目

目录：

```text
shipment/
├─ CMakeLists.txt
├─ include/
│  └─ shipment/
│     └─ shipment.hpp
├─ src/
│  ├─ main.cpp
│  └─ shipment.cpp
└─ tests/
   └─ shipment_tests.cpp
```

`CMakeLists.txt`：

```cmake
cmake_minimum_required(VERSION 3.25)

project(shipment LANGUAGES CXX)

enable_testing()

add_library(shipment_logic STATIC
    src/shipment.cpp
)

target_include_directories(shipment_logic
    PUBLIC
        "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_compile_features(shipment_logic
    PUBLIC
        cxx_std_23
)

add_executable(shipment_app
    src/main.cpp
)

target_link_libraries(shipment_app
    PRIVATE
        shipment_logic
)

add_executable(shipment_tests
    tests/shipment_tests.cpp
)

target_link_libraries(shipment_tests
    PRIVATE
        shipment_logic
)

add_test(
    NAME shipment_logic_tests
    COMMAND shipment_tests
)

set_target_properties(
    shipment_logic
    shipment_app
    shipment_tests
    PROPERTIES
        CXX_EXTENSIONS OFF
)
```

库、公开 include 路径和使用者在同一个例子中相互对应。应用和测试都链接 `shipment_logic`，因此使用同一个库 target 的实现和公开使用要求。

`add_executable(shipment_tests ...)` 只创建可执行 target；`enable_testing()` 与 `add_test(...)` 才把它注册给 CTest。注册后可以在构建目录运行 `ctest`。测试程序仍需用退出状态等方式报告成功或失败。

## 只有列入 target 的源文件才会编译

磁盘上存在 `shipment.cpp` 不会让它自动加入项目。它必须直接属于某个 target，或通过链接的库 target 间接成为构建依赖。

如果把同一 `.cpp` 分别列进多个 target，它通常会为每个 target 和构建配置分别编译。要让应用与测试共享逻辑，建立库 target 往往比复制源文件列表更清楚。

普通头文件通过 `#include` 进入翻译单元，不会独立生成目标文件。可以把头文件列入 target 方便 IDE 展示，但这不会改变其编译模型。

## `cxx_std_23` 表示最低特性要求

```cmake
target_compile_features(shipment_logic PUBLIC cxx_std_23)
```

它要求编译该 target 及其使用者时至少提供 C++23。CMake 可能选择 C++23，也可能保留一个已经满足要求的更新标准模式；它不是“必须精确等于 C++23”的断言。

`CXX_EXTENSIONS OFF` 请求使用不带编译器扩展的标准方言，例如优先选择 `-std=c++23` 而不是 `-std=gnu++23`。它是逐 target 的属性，不会像 `PUBLIC` 使用要求那样自动传播，所以示例对三个会编译 C++ 源文件的 target 分别设置。这不保证编译器实现了全部标准，也不替代严格警告和可移植性测试。

若公开头文件使用 C++23 特性，`cxx_std_23` 应为 `PUBLIC`。若只有库的 `.cpp` 实现需要它，可以考虑 `PRIVATE`；决定依据是使用者编译公开接口时是否也需要该要求。

## `PUBLIC`、`PRIVATE` 与 `INTERFACE`

对于 `target_*` 命令中常见的使用要求作用域：

| 关键字 | 当前 target 使用 | 链接它的使用者获得 |
| --- | --- | --- |
| `PRIVATE` | 是 | 否 |
| `PUBLIC` | 是 | 是 |
| `INTERFACE` | 否 | 是 |

库的公开头文件位于 `include/`，库本身和使用者都要搜索该目录，因此示例使用 `PUBLIC`。

应用链接库只描述应用自己的依赖，不需要把该依赖继续传播给应用的潜在使用者，因此示例使用 `PRIVATE`。

这些词描述的是 CMake 使用要求的传播，不是 C++ 类成员的访问控制。

## 什么时候值得建立库 target

只有一个小程序时，把全部 `.cpp` 直接列入 `add_executable` 往往足够。出现多个使用者、独立测试或清晰模块边界时，库 target 才能明显减少重复并表达依赖图。

库的物理文件名和扩展名取决于库类型、平台、generator 与工具链。target 名称和 target 间关系比假设输出一定是 `.a` 或 `.lib` 更稳定。

## 检查清单

1. 每个必须编译的 `.cpp` 是否属于正确 target？
2. 公开头文件路径是否随库传播？
3. 语言特性要求的可见范围是否正确？
4. 是否明确选择了标准扩展策略？
5. 可执行目标是否链接真正提供实现的库？
6. 当前规模是否真的需要单独的库？
