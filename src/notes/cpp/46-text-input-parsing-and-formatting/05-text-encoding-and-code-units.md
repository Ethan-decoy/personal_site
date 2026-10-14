---
title: 文本编码与码元边界（Text Encoding and Code-Unit Boundaries）
date: 2026-10-08
order: 5
---

# 文本编码与码元边界（Text Encoding and Code-Unit Boundaries）

string 可以保存文本，但 size 不统一表示“人看见多少个字”。读取、切片和文件接口处理的单位，需要与编码规则分别说明。

## 容器元素不等于完整字符

编码（Encoding）规定字符怎样映射为数据。码点（Code Point）标识字符编码空间中的一项；码元（Code Unit）是某种编码的基本存储单位；字素簇（Grapheme Cluster）还描述多个码点怎样组成用户感知的字符。

UTF-8 用可变数量的码元表示码点。C++ 的 `u8` 文本字面量具有 UTF-8 语义，`char8_t` 表示相应码元类型；`std::u8string` 是保存这些码元的字符串类型。

先看两段短文本。第一段是“压”；第二段是字母 e 后接组合重音 U+0301，通常显示为 é。下面的 `\u0301` 用十六进制码点指定这个重音，是文本字面量中的转义写法。

```cpp
#include <iostream>
#include <string>

int main() {
    const std::u8string text{u8"压"};
    std::cout << text.size() << '\n'; // 3 个 UTF-8 码元
    const std::u8string accented{u8"e\u0301"};
    std::cout << accented.size() << '\n'; // 同样是 3 个 UTF-8 码元
}
```

这两次 size 都得到 3，但它们在另外两层并不具有相同数量：

| 统计层次 | “压” | e 后接 U+0301 | 正在数什么 |
| --- | ---: | ---: | --- |
| UTF-8 码元 | 3 | 3 | u8string 保存的元素 |
| 码点 | 1 | 2 | Unicode 编号序列中的项 |
| 默认扩展字素簇 | 1 | 1 | 按 Unicode 默认分段规则组成的一簇 |

第二段的 e 占一个 UTF-8 码元，组合重音占两个；它们是两个码点，默认扩展字素簇规则却将重音与前面的字母放在同一簇中。因此，**容器元素数、码点数和按字素规则分出的数量，需要按各自的单位判断。**实际业务若采用其他分段约定，还须核对相应规则。

text 不是一个长度为一的字符串对象。直接按元素下标或 substr 切断它，可能把一个 UTF-8 序列拆开。即使切片保留了完整码点，也可能把第二段的字母与重音分开，破坏当前想保留的字素边界。

## std::string 不自动声明编码

string 保存 char 序列；字面量、文件和外部接口所使用的编码还要单独约定。char8_t 序列也不能直接当作普通窄字符流的文本接口，类型与编码转换需要明确处理。

“将每个 char 转大写”不等于完整 Unicode 大小写转换；有些映射会改变长度或依赖上下文。字符分类函数还须满足对应输入范围与区域设置契约。

> [!IMPORTANT]
> 元素数、码点数和用户感知字符数分别统计。容器保证合法访问边界，不保证每个切片都构成合法编码，也不替外部输入验证文本。

## 外部边界需要保留完整数据语义

按块读取可能切断编码序列，应保留尚未完成的部分，或将解码职责交给具有明确错误策略的文本设施。业务还需规定无效序列、替换字符和规范化的处理方式。

> [!PRACTICE]
> 在文件与协议边界写明编码，内部切片依据任务选择码元、码点或字素边界。C++ 字符串是存储基础；完整 Unicode 处理属于额外文本能力，不能靠一种 string 类型自动完成。

## 参考资料

- [C++23 工作草案：字符串字面量与编码](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
- [Unicode 标准：字符编码与文本模型](https://www.unicode.org/versions/latest/)
- [Unicode 附录 29：字素簇边界规则](https://www.unicode.org/reports/tr29/tr29-49.html#Grapheme_Cluster_Boundary_Rules)
