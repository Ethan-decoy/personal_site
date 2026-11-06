---
title: 输出完成与错误报告（Output Completion and Error Reporting）
date: 2026-10-08
order: 3
---

# 输出完成与错误报告（Output Completion and Error Reporting）

将文本交给输出流、将缓冲数据交给文件系统，以及保证断电后仍存在，是不同层次的完成。接口必须说明承诺停在哪一层。

## 显式检查写入与关闭

`std::ofstream` 位于 `<fstream>`，默认的文件输出打开方式会截断已有内容。下面程序写当前工作目录中的 pressure-report.txt；该文件用于生成报告，允许替换原内容。

```cpp
#include <fstream>
#include <iostream>

int main() {
    std::ofstream output{"pressure-report.txt"};
    if (!output) {
        return 1;
    }

    output << "220\n230\n";
    output.flush();
    if (!output) {
        return 2;
    }

    output.close();
    if (!output) {
        return 3;
    }
    std::cout << "saved\n";
}
```

`flush()` 请求将流缓冲内容向底层同步；`close()` 完成相应文件关闭操作。对象析构仍负责最终资源清理，但需要向调用方报告最终写出失败时，应在可检查的位置显式完成操作。

使用 `std::ios::app` 可以请求追加模式；它与默认截断具有不同业务含义，不应由调用方猜测。

## 标准流完成不等于持久化事务

flush 与 close 不提供统一的断电持久化或多文件原子提交保证。可靠替换、目录同步和平台持久化要求，需要额外的文件系统与操作系统契约。

同样，输出中途失败可能留下部分文件。错误返回不会自动恢复原内容，恢复策略应明确，例如保留旧版本、写临时文件后按平台规则替换。

> [!IMPORTANT]
> RAII 保证资源责任得到处理，不保证数据保存成功，更不自动回滚外部副作用。需要报告完成时，检查最后可能失败的操作。

## 参考资料

- [C++23 工作草案：ofstream](https://timsong-cpp.github.io/cppwp/n4950/ofstream)
- [C++23 工作草案：flush](https://timsong-cpp.github.io/cppwp/n4950/ostream.unformatted)
- [C++23 工作草案：文件关闭](https://timsong-cpp.github.io/cppwp/n4950/filebuf.members)
