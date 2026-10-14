---
title: 文件系统失败与状态观察（Filesystem Failures and State Observation）
date: 2026-10-08
order: 5
---

# 文件系统失败与状态观察（Filesystem Failures and State Observation）

查询文件是否存在，也会遇到无法访问、设备失败等情况。“不存在”和“无法判断是否存在”应当分别表达。

## error_code 保留访问失败

`std::error_code` 位于 `<system_error>`，保存错误值与解释该值的类别。文件系统许多操作同时提供异常形式和接收 error_code 的形式。

```cpp
#include <expected>
#include <filesystem>
#include <iostream>
#include <system_error>

std::expected<bool, std::error_code> path_exists(const std::filesystem::path& path) {
    std::error_code error;
    const bool found = std::filesystem::exists(path, error);
    if (error) {
        return std::unexpected{error};
    }
    return found;
}

int main() {
    const auto result = path_exists("not-created-file");
    if (!result) {
        std::cerr << result.error().message() << '\n';
        return 1;
    }
    std::cout << *result << '\n'; // 在路径不存在的前提下输出 0
}
```

一个成功的 false 与错误状态不同。message 用于诊断，不宜用字符串匹配决定稳定业务分支；要按错误类别和相应值判断。

## 先查询不锁定后续状态

检查存在之后，文件仍可能被其他组件删除或替换。最终打开、重命名或读取操作必须检查自己的结果，不能用先前 exists 代替。

目录迭代的顺序通常不保证稳定；遍历中目录内容变化的观察也有边界。需要确定输出次序时，先收集符合契约的值，再明确排序。

> [!PRACTICE]
> 对外部状态，将每次操作看作可能失败的一次请求。error_code 形式避免通过相应文件系统异常报告操作错误，但不等于整个函数所有分配和用户操作都不会抛出。

## 参考资料

- [C++23 工作草案：文件系统错误报告](https://timsong-cpp.github.io/cppwp/n4950/fs.err.report)
- [C++23 工作草案：exists](https://timsong-cpp.github.io/cppwp/n4950/fs.op.exists)
