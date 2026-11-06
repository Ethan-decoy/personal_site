---
title: 路径值与文件位置（Path Values and File Locations）
date: 2026-10-08
order: 1
---

# 路径值与文件位置（Path Values and File Locations）

一个路径对象描述文件位置，不证明那里已经有文件。路径拼接、文本规范化和真实文件访问需要分别理解。

## path 保存平台路径语义

`std::filesystem::path` 位于 `<filesystem>`。`/` 按路径组件拼接；`filename()` 得到最后组件；`lexically_normal()` 只按路径语法整理点号等组件，不访问文件系统。

```cpp
#include <filesystem>
#include <iostream>

int main() {
    const std::filesystem::path directory{"data"};
    const auto input = directory / "readings.txt";
    std::cout << input.filename().generic_string() << '\n'; // readings.txt

    const std::filesystem::path source{"data/../readings.txt"};
    std::cout << source.lexically_normal().generic_string() << '\n'; // readings.txt
}
```

`generic_string()` 形成通用分隔形式的窄字符串，不能据此假定全部平台原生编码相同。

## 相对位置依赖当前工作目录

相对路径通常按进程当前工作目录解释，不自动以可执行文件所在目录为基准。绝对路径含平台规定的根位置；驱动器、根目录与网络路径也有平台语义。

拼接右侧含根信息的路径时，可能替换先前部分，不能把 `/` 当成不加判断的字符串连接。

词法消去 `..` 不等于沿符号链接访问后的真实位置。`canonical` 等访问型规范化还需要文件系统状态，并可能失败。

> [!IMPORTANT]
> 路径值、词法处理结果与实际文件对象是三层关系。文件是否存在、访问权限与链接目标都不能从 path 构造成功推导出来。

## 参考资料

- [C++23 工作草案：path](https://timsong-cpp.github.io/cppwp/n4950/fs.class.path)
- [C++23 工作草案：路径拼接](https://timsong-cpp.github.io/cppwp/n4950/fs.path.append)
