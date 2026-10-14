---
title: 可重复构建与目标依赖（Reproducible Builds and Target Dependencies）
date: 2026-10-08
order: 1
---

# 可重复构建与目标依赖（Reproducible Builds and Target Dependencies）

程序由多个翻译单元组成后，“我这台机器上能编译”还不足以说明其他构建具有同样接口、选项与依赖。构建目标（Build Target）集中描述这些条件。

## 目标声明源文件与语言要求

CMake 是组织编译与链接依赖的构建配置工具，具体编译仍由所选工具链完成。下面 main.cpp 是完整程序：

```cpp
#include <expected>
#include <iostream>

std::expected<int, int> accept(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{1};
    }
    return value;
}

int main() {
    const auto result = accept(220);
    if (!result) {
        return 1;
    }
    std::cout << *result << '\n'; // 220
}
```

同目录 CMakeLists.txt：

```cmake
cmake_minimum_required(VERSION 3.25)
project(pressure_report LANGUAGES CXX)

add_executable(pressure_report main.cpp)
target_compile_features(pressure_report PRIVATE cxx_std_23)
set_target_properties(pressure_report PROPERTIES CXX_EXTENSIONS OFF)
```

配置生成构建描述，再执行构建。例如在已安装 Ninja 与相应编译器的环境中：

```shell
cmake -S . -B build -G Ninja
cmake --build build
```

build 保存产物，与源目录分开。多源文件加入同一目标或明确的库目标，再用目标关系描述链接；模块等编译产物也需要其实际依赖顺序。

## 语言模式与库支持分别验证

cxx_std_23 请求满足语言模式，不保证每项 C++23 库设施都已实现。依赖 expected、format、generator 等接口时，还须核对标准库和平台支持。

构建记录包含工具链、库、选项、依赖版本及输入。Debug、Release 和平台配置可能影响断言、优化与 ABI；复制一个可执行文件名不能证明配置相同。

> [!PRACTICE]
> 将影响语义与兼容的要求放进可重复配置，新增依赖按目标传递，避免靠某个开发终端偶然的全局选项。配置成功后仍需编译、链接和行为验证。

## 参考资料

- [CMake 官方文档：编译特征](https://cmake.org/cmake/help/latest/manual/cmake-compile-features.7.html)
- [CMake 官方文档：目标与构建模型](https://cmake.org/cmake/help/latest/manual/cmake-buildsystem.7.html)
