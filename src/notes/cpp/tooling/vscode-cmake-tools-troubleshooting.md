---
title: Visual Studio Code 与 CMake Tools 排障
date: 2026-07-23
---

# Visual Studio Code 与 CMake Tools 排障

这是一份环境排障记录，不是所有 Windows 机器都应复制的模板。路径、扩展行为、Preset schema 和命令名称可能随 CMake、CMake Tools、Qt 与工具链版本变化。

CMake target 的项目内设计见[Target、库与使用要求](../cmake/targets-libraries-and-usage-requirements.md)。

## 先分清四个角色

| 名称 | 职责 | 示例 |
| --- | --- | --- |
| generator | 生成构建系统 | Ninja、Visual Studio、MinGW Makefiles |
| compiler | 编译 C++ | Clang、GCC、MSVC |
| toolchain file | 描述特殊工具链 | 编译器、目标平台、查找规则 |
| configure preset | 保存配置选择 | generator、目录、缓存变量 |

generator 不是编译器。选择 `MinGW Makefiles` 不会自动保证使用某个特定版本的 GCC，选择 Clang 也不决定必须使用哪种 generator。

## 先验证默认环境

在 VS Code 外部的 PowerShell 中先运行：

```text
cmake --version
where.exe cmake
clang++ --version
where.exe clang++
ninja --version
```

只检查项目实际使用的工具。若这里已经找不到程序，先修复 PATH 或使用明确路径；编辑器扩展不能可靠补救一个尚未成立的命令行环境。

随后查看 CMake Tools 的 Configure 输出，确认实际 generator、编译器和 build 目录。不要只依据状态栏名称推断。

## 首选 Preset 保存项目配置

一个使用 Ninja 和 PATH 中 Clang 的示例：

```json
{
  "version": 6,
  "cmakeMinimumRequired": {
    "major": 3,
    "minor": 25,
    "patch": 0
  },
  "configurePresets": [
    {
      "name": "windows-clang-debug",
      "displayName": "Windows Clang Debug",
      "generator": "Ninja",
      "binaryDir": "${sourceDir}/out/build/${presetName}",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_C_COMPILER": "clang",
        "CMAKE_CXX_COMPILER": "clang++"
      }
    }
  ]
}
```

它应保存为项目根目录的 `CMakePresets.json`。首次配置前仍要保证 Ninja 与 Clang 可被找到，或者把机器相关路径放入不提交的 `CMakeUserPresets.json`。

CMake Tools 中选择 `CMake: Select Configure Preset`，再执行配置。若项目启用了 Presets，不要同时依赖旧的 Kit、`cmake.generator` 和 `cmake.configureSettings` 来表达同一选择。

Preset schema 和扩展支持范围与版本有关。复制示例前先核对本机 `cmake --version`、CMake Tools 版本以及项目声明的最低 CMake 版本。

## 旧项目的 legacy settings

没有 Preset 的旧项目可能仍使用 `.vscode/settings.json`：

```json
{
  "cmake.generator": "Ninja",
  "cmake.configureSettings": {
    "CMAKE_C_COMPILER": "clang",
    "CMAKE_CXX_COMPILER": "clang++"
  }
}
```

这组设置只应作为旧配置模式维护。不要再额外放入一个表达不同 generator 或 compiler 的 Preset，否则实际来源会变得难以判断。

具体设置名、废弃状态和优先级可能随 CMake Tools 版本变化。升级扩展后若行为改变，应查该版本文档和 Configure 日志，不把旧机器上的经验当成永久规则。

## 为什么会突然寻找 NMake

常见原因包括旧 build 目录缓存了 generator、扩展选择了不同 Kit 或 Preset，或者 Visual Studio 环境改变了可用工具。

按证据排查：

1. 查看 Configure 输出中的 build 目录和 generator；
2. 查看该 build 目录的 `CMakeCache.txt` 中 `CMAKE_GENERATOR` 与编译器路径；
3. 确认当前选择的是 Preset、Kit 还是 legacy settings；
4. 删除缓存并重新配置，或直接使用新的 build 目录；
5. 再次核对 Configure 输出。

CMake Tools 通常提供 `CMake: Delete Cache and Reconfigure`。若扩展状态仍与界面不一致，可使用其重置状态命令；准确命令名以当前扩展版本的命令面板为准。

不要通过设置 `CMAKE_SYSTEM_NAME Windows` 来解决本机 Windows 的 generator 选择。手动设置系统名会让 CMake 按跨平台工具链语义处理配置，并可能改变查找和 `CMAKE_CROSSCOMPILING` 状态。

## Qt 与编译器 ABI 必须匹配

Qt 的 Windows 二进制包通常对应特定 MSVC 或 MinGW 工具链。项目应使用与所选 Qt 包兼容的编译器和运行库，不能只因“都是 Windows”就任意混用。

若只为本机项目固定 Qt 附带的 MinGW，可以在不提交的 `CMakeUserPresets.json` 中选择兼容 generator，并引用一个同样只供本机使用的工具链文件。下面只展示该用户 Preset 的核心字段：

```json
{
  "name": "qt-mingw-debug",
  "generator": "MinGW Makefiles",
  "binaryDir": "${sourceDir}/out/build/${presetName}",
  "toolchainFile": "D:/dev_env/cmake/toolchains/qt-mingw.cmake",
  "cacheVariables": {
    "CMAKE_BUILD_TYPE": "Debug"
  }
}
```

这个本机工具链文件只写实际需要固定的工具，不伪装成跨系统构建：

```cmake
set(CMAKE_C_COMPILER
    "D:/dev_env/qt/Tools/mingw/bin/gcc.exe"
    CACHE FILEPATH ""
)

set(CMAKE_CXX_COMPILER
    "D:/dev_env/qt/Tools/mingw/bin/g++.exe"
    CACHE FILEPATH ""
)
```

上述路径只是示例，不能直接视为其他机器的事实。含本机绝对路径的用户 Preset 和工具链文件不应直接共享；若项目需要提交共享工具链文件，应把工具链根路径参数化，并记录调用方必须提供的缓存变量或环境变量。

还要确认 `mingw32-make` 可用，并让 `find_package(Qt6 ...)` 找到与该工具链匹配的 Qt 安装。

切换 Qt 版本、编译器或 generator 后，应使用新的 build 目录或清除缓存。编译器 ABI、Qt 包位置和生成器工具是三个分别需要验证的条件。

## 记录机器边界

一次可复现的环境记录至少包括：

- 操作系统与架构；
- VS Code 和 CMake Tools 版本；
- CMake、generator 工具与编译器版本；
- 实际选择的 Preset 或 legacy settings；
- build 目录；
- Qt 版本、套件和编译器 ABI；
- Configure 输出中的第一条有效错误。

这能把“我的机器上可以”变成可比较的配置证据，也能避免把一次本机修复误写成通用 CMake 规则。

## 官方参考

- [CMake Tools：CMake Presets](https://github.com/microsoft/vscode-cmake-tools/blob/main/docs/cmake-presets.md)：启用 Presets 后，哪些旧设置会被忽略，以及扩展怎样选择 Preset。

- [CMAKE_CROSSCOMPILING](https://cmake.org/cmake/help/latest/variable/CMAKE_CROSSCOMPILING.html)：手动设置 `CMAKE_SYSTEM_NAME` 对跨平台状态的影响。

- [CXX 环境变量](https://cmake.org/cmake/help/latest/envvar/CXX.html)与 [CMAKE_CXX_COMPILER](https://cmake.org/cmake/help/latest/variable/CMAKE_CXX_COMPILER.html)：编译器在首次配置时进入缓存后的边界。
