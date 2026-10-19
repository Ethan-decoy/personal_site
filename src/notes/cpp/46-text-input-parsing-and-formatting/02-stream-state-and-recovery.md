---
title: 流状态与恢复（Stream State and Recovery）
date: 2026-10-08
order: 2
---

# 流状态与恢复（Stream State and Recovery）

一次读取到达末尾，不一定意味着这次没有取得值。流状态（Stream State）用多个标志记录不同事实，不能只用 eof 解释全部成功与失败。

## 结束位置与失败不是同一标志

| 状态 | 主要含义 |
| --- | --- |
| eofbit | 操作遇到输入序列结束 |
| failbit | 格式读取等操作未能满足要求 |
| badbit | 更低层的读写错误 |
| goodbit | 没有错误状态位 |

`eof()` 检查 eofbit；`fail()` 检查 failbit 或 badbit；流的条件判断相当于 `!fail()`，不是 `good()`。

```cpp
#include <iostream>
#include <sstream>

int main() {
    std::istringstream input{"220"};
    int value{};
    input >> value;
    std::cout << value << ' ' << input.eof() << ' ' << input.fail() << '\n'; // 220 1 0

    int next{};
    input >> next;
    std::cout << input.fail() << '\n'; // 1
}
```

第一次已成功识别 220，同时遇到末尾；第二次才因没有下一项失败。只在提取成功后使用结果，不能依据初始化值猜测读取成功。

## clear 只修改状态，不修复输入

`input.clear()` 清除相应错误状态，但不移走造成格式错误的字符，也不重新打开资源。对同一坏字符反复 clear、重试，可能形成不前进的循环。

恢复要结合输入边界：例如按行组织的数据，可以结束该行的处理，保留错误说明，再从下一行继续；底层 badbit 则通常不适合机械清空后继续。

下面只演示一条已知坏行后的恢复：第一行无法提取整数，按行丢弃它，再读取下一行。格式提取是否消费完整合法行，是另一项需要单独检查的协议条件。

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::istringstream input{"bad\n220\n"};
    int value{};
    if (!(input >> value)) {
        std::cout << "bad line\n";
        input.clear();
        std::string discarded{};
        std::getline(input, discarded);
    }
    if (input >> value) {
        std::cout << value << '\n';
    }
}
```

输出 `bad line`、`220`。第一次提取在字符 `b` 处失败；`clear()` 后状态恢复，但下一次读取仍会面对这个字符。`getline` 才把坏行及其换行消耗掉，使输入位置来到 220。随后整数提取成功，程序才使用新的 `value`。

若只清状态就立刻重试，相同失败原因仍在；若不清状态就调用 `getline`，它也不能正常推进。这个恢复依赖已知的格式失败与行边界，不能泛化为对底层错误或任何协议都丢一行继续。

`exceptions(mask)` 可以配置哪些状态导致 `std::ios_base::failure`。设置掩码时也可能因已有状态触发异常，因此它属于失败契约的一部分。

> [!PRACTICE]
> 对外部数据区分正常结束、格式失败和资源错误。默认流状态与异常模式都可以成立，但一次接口应让调用方知道检查哪条路径。

## 参考资料

- [C++23 工作草案：流状态检查与异常掩码](https://timsong-cpp.github.io/cppwp/n4950/iostate.flags)
