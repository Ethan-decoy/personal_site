---
title: 文件输入与资源生命周期（File Input and Resource Lifetime）
date: 2026-10-08
order: 2
---

# 文件输入与资源生命周期（File Input and Resource Lifetime）

文件输入不仅有文本解析，还涉及打开、读取与关闭的资源责任。`std::ifstream` 将输入文件绑定到 RAII 对象，但每次操作的成功仍须检查。

## 打开成功与完整读取分别判断

`std::ifstream` 位于 `<fstream>`，可以接收文件路径。对象销毁时释放文件资源；提前 return 或异常传播也由这份生命周期处理。

`std::cerr` 是 `<iostream>` 提供的标准错误输出流（Standard Error Stream）。这里用 cout 输出正常读取的内容，用 cerr 输出失败说明，使正常结果与诊断信息可以分别接收或重定向；它们也可能显示在同一个终端中。

下面完整程序的运行前提是：当前工作目录有 readings.txt，内容为两行 `220`、`230`。

```cpp
#include <fstream>
#include <iostream>
#include <string>

int main() {
    std::ifstream input{"readings.txt"};
    if (!input) {
        std::cerr << "open failed\n";
        return 1;
    }

    std::string line;
    while (std::getline(input, line)) {
        std::cout << line << '\n';
    }
    if (input.bad() || !input.eof()) {
        std::cerr << "read failed\n";
        return 2;
    }
}
```

循环输出两行。结束后区分正常读到末尾与其他失败；打开成功不是所有后续读取成功的保证。

## 资源结束不负责解释业务内容

getline 成功取得 `bad` 这一行，表示读取成功，不表示数字合法。文本读取之后仍须按解析契约检查语法和业务范围。

输入可以为空，可以有无末尾换行；若业务要求固定数量或必需字段，流的 EOF 状态不能替代这些完整性要求。

> [!PRACTICE]
> 将文件获取、读取边界、文本解析和业务验证分成可辨认步骤，并让错误保留足以定位问题的路径或行号。RAII 负责资源结束，不负责自动生成业务错误说明。

## 参考资料

- [C++23 工作草案：ifstream](https://timsong-cpp.github.io/cppwp/n4950/ifstream)
- [C++23 工作草案：文件缓冲与关闭](https://timsong-cpp.github.io/cppwp/n4950/filebuf)
- [C++23 工作草案：标准输入输出流](https://timsong-cpp.github.io/cppwp/n4950/narrow.stream.objects)
