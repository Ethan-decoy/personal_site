---
title: Visual Studio Code
date: 2026-06-25
---

# Visual Studio Code

> 记录有关 Visual Studio Code 兼容问题解决方案

## CMake编译错误找寻NMake的解决方法

### 1.创建 `.vscode/settings.json`

每个新项目（LLVM 默认）：
手动建 `.vscode/settings.json`：

```json
{
    "cmake.generator": "MinGW Makefiles",
    "cmake.preferredGenerators": ["MinGW Makefiles"]
}
```

**默认行为（当前）**：用 LLVM clang

PATH 里 LLVM 在前 → CMake 自动找到 `clang/clang++`
新项目不需要做任何额外配置

### 2.Qt 项目额外动作：

Qt 项目切换为 gcc：

```json
{
    "cmake.generator": "MinGW Makefiles",
    "cmake.preferredGenerators": ["MinGW Makefiles"],
    "cmake.configureSettings": {
        "CMAKE_TOOLCHAIN_FILE": "${workspaceFolder}/cmake/toolchain-qt-gcc.cmake"
    }
}
```

在项目里建 `cmake/toolchain-qt-gcc.cmake`：

```cmake
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_C_COMPILER   "D:/dev_env/toolchain/qt/Tools/mingw1310_64/bin/gcc.exe")
set(CMAKE_CXX_COMPILER "D:/dev_env/toolchain/qt/Tools/mingw1310_64/bin/g++.exe")
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

`.vscode/settings.json` 里加上：

```json
"cmake.configureSettings": {
    "CMAKE_TOOLCHAIN_FILE": "${workspaceFolder}/cmake/toolchain-qt-gcc.cmake"
}
```

### 3.清理 CMake 缓存重新构建

`Ctrl+Shift+P` → `CMake: Delete Cache` → 重新配置