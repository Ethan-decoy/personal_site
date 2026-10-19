---
title: 整行读取与格式化输入（Whole-Line and Formatted Input）
date: 2026-10-08
order: 1
---

# 整行读取与格式化输入（Whole-Line and Formatted Input）

输入操作要先确定一项数据的边界：按空白分开的字段，还是保留空格的一整行。两种入口不能只按“都读入 string”互换。

## getline 按分隔符读取一行

`std::getline(input, text)` 在 `<string>` 中读取到换行或输入结束，换行被取出但不存入 text。它不自动跳过前导空白；空行可以是成功取得的合法一行。

`<sstream>` 中的 `std::istringstream` 用已保存文本作为输入源，提供与普通输入流相同的读取接口。下面用它显示整行内容：

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input{"front channel\n\nrear channel"};
    std::string line{};
    while (std::getline(input, line)) {
        std::cout << '[' << line << "]\n";
    }
}
```

输出依次为 `[front channel]`、`[]`、`[rear channel]`。末行没有换行，仍可被成功读取；下一次无法取得字符时才退出循环。

## operator>> 按目标类型读取字段

`input >> integer` 是格式化输入（Formatted Input），按流的格式与区域设置识别一个整数。通常跳过前导空白，但不把字段之后的换行一并消费。

若先读取整数，再调用 getline，流中残留的换行可能让第一次 getline 成功得到空字符串。需要明确策略：输入按行组织时，先读取整行再解析；按字段组织时，继续使用对应字段接口。

`std::ws` 可以消费连续空白，但也会略过业务上可能有意义的空行，不能作为任何混用问题的统一修复。

> [!IMPORTANT]
> 读取循环的条件应是本次读取结果。先判断 eof 再读取，不能提前证明“还有一个完整字段”，也可能漏判读取失败。

输入结果的状态含义见[流状态与恢复](02-stream-state-and-recovery.md#结束位置与失败不是同一标志)。std::cin 可以使用同样接口，但终端行为和输入来源属于运行环境。

## 参考资料

- [C++23 工作草案：字符串输入与 getline](https://timsong-cpp.github.io/cppwp/n4950/string.io)
- [C++23 工作草案：字符串输入流](https://timsong-cpp.github.io/cppwp/n4950/istringstream)
