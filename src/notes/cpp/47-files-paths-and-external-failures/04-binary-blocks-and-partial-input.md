---
title: 二进制块与不完整输入（Binary Blocks and Partial Input）
date: 2026-10-08
order: 4
---

# 二进制块与不完整输入（Binary Blocks and Partial Input）

按固定大小读块时，最后一块常小于缓冲区。请求读取的数量和实际取得的数量不同，不能把上次残留的数据当作这次输入。

## gcount 报告实际取得数量

`read(buffer, count)` 请求读取指定数量的字符；`gcount()` 报告相应非格式化输入实际取得的数量。`std::streamsize` 是流接口表示数量的整数类型。

下面程序的前提是 bytes.dat 含三个字节 `ABC`。`std::ios::binary` 请求二进制打开方式，避免文本模式的相应转换。

```cpp
#include <array>
#include <fstream>
#include <iostream>

int main() {
    std::ifstream input{"bytes.dat", std::ios::binary};
    if (!input) {
        return 1;
    }
    std::array<char, 2> buffer{};
    while (true) {
        input.read(buffer.data(), static_cast<std::streamsize>(buffer.size()));
        const auto count = input.gcount();
        std::cout.write(buffer.data(), count);
        if (input.bad()) {
            return 2;
        }
        if (input.eof()) {
            break;
        }
        if (input.fail()) {
            return 3;
        }
    }
}
```

输出 ABC：最后只取得一个字符，仍先处理 count 指定的有效部分，再根据状态结束。输出 write 按指定数量写字符，不要求缓冲区以空字符结尾。

## 完整记录需要额外验证

若协议规定每条记录必须两字节，最后一字节不是合法完整记录，应该报告截断。上面只是展示块读取，不将每块自动解释为一条记录。

不要直接把文件块解释成任意类对象：对象表示涉及字节序、填充、类型与生命周期，二进制模式不会定义这些规则。

> [!TIP]
> 区分缓冲容量、实际字节数和业务记录长度。任何解码或计算只使用本次取得的有效数据，再按协议检查是否完整。

## 参考资料

- [C++23 工作草案：非格式化输入与 gcount](https://timsong-cpp.github.io/cppwp/n4950/istream.unformatted)
