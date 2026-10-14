---
title: 文本比较与组合（Text Comparison and Composition）
date: 2026-09-15
order: 2
---

# 文本比较与组合（Text Comparison and Composition）

判断两个传感器名称是否相同，关心的是字符序列；把位置名称接到 `"sensor="` 后面，关心的是组合后的文本。`std::string` 的比较和拼接围绕这样的文本值工作，字符指针上的运算则仍遵循指针规则。选择哪种表达式，首先取决于手中的类型表达了什么。

## 相同文本不要求相同地址

两个 `std::string` 使用 `==` 比较时，只有长度相同、对应位置的 `char` 都相同，结果才为 `true`。字符串也可以直接与普通字符串字面量比较，例如 `label == "front"`；字面量一侧的文本取到第一个空字符之前。

这种比较不会自动忽略大小写，也不会判断两段不同的编码是否在显示时看起来一样。它判断的是当前保存的字符序列。

下面的完整程序让两份相同内容存放在不同的字符数组中，以便区分文本相等与指针相等。数组中的结尾空字符使字符串构造能够找到内容的结束位置：

```cpp
#include <iostream>
#include <string>

int main() {
    const char first_text[3]{'o', 'k', '\0'};
    const char second_text[3]{'o', 'k', '\0'};
    const char* const first{first_text};
    const char* const second{second_text};
    const std::string left{first};
    const std::string right{second};

    std::cout << (first == second) << '\n';
    std::cout << (left == right) << '\n';
}
```

输出：

```text
0
1
```

数组在初始化指针时[转换为指向首元素的指针](../20-fixed-size-sequences-and-contiguous-ranges/deep-dives/01-built-in-arrays-and-pointer-conversion.md#转换产生首元素指针数组仍然存在)。`first` 和 `second` 指向不同数组中的元素，所以不相等；`left` 和 `right` 都拥有两个字符 `'o'`、`'k'`，所以文本相等。

> [!IMPORTANT]
> `const char*` 上的 `==` 比较指针，`std::string` 上的 `==` 比较文本内容。把地址传进字符串构造函数，会按该构造接口读取并保存文本；地址本身不会因此获得文本比较的语义。

这里特意使用两个独立的数组，没有用两个相同字面量的地址作为证据。实现允许复用字符串字面量的存储，不能靠字面量地址比较推断它们的内容是否相同。

## 修改现有文本与生成组合结果

`std::string` 的 `+=` 在当前内容末尾追加字符，长度增加所追加的字符数量。右侧可以是另一个字符串、普通字符串字面量或单个 `char`：字符串按长度追加，字面量取到第一个空字符之前，单个字符则追加一个元素。

`+` 也能组合文本，但表达式的结果是一个拥有文本的 `std::string`。例如，两个具名字符串 `prefix` 和 `location` 都作为左值参与 `prefix + location` 时，结果包含两段内容，两个原对象保持不变。这个结论有左值条件；把对象转换成右值再参与拼接，可能允许操作使用并改变原对象的资源。

下面的函数用 `+=` 逐步构造一条记录，并按值返回。参数 `const std::string&` 只读地借用调用方字符串，局部变量 `result` 则保存独立的结果：

```cpp
#include <iostream>
#include <string>

std::string make_entry(const std::string& location) {
    std::string result{"sensor="};
    result += location;
    result += ';';
    return result;
}

int main() {
    const std::string location{"front"};
    const std::string prefix{"sensor="};
    const std::string joined{prefix + location};
    const std::string entry{make_entry(location)};

    std::cout << joined << '\n';
    std::cout << entry << '\n';
    std::cout << prefix << ' ' << location << '\n';
    std::cout << (joined == "sensor=front") << '\n';
}
```

输出：

```text
sensor=front
sensor=front;
sensor= front
1
```

`joined` 由一次组合表达式产生；`entry` 则由函数先追加位置名称，再追加分号。两条路径都得到拥有文本的对象，既不会让结果依赖 `prefix` 或 `location` 的存储，也不会留下对局部变量 `result` 的引用。`return result;` 使用[返回局部对象的规则](../17-rvalue-references-and-move-semantics/07-returning-local-objects.md#不要为普通局部返回额外添加移动转换)，不需要额外写 `std::move(result)`。

## 字面量不会自行变成字符串运算

`"sensor=" + "front"` 不是字符串拼接表达式。两个操作数都是数组，在这里会转换为指针；内置运算不允许把两个指针相加，而表达式中也没有 `std::string` 操作数来选择字符串的拼接运算。

如果需要组合这些内容，可以明确建立字符串，例如 `std::string{"sensor="} + "front"`。这里左侧的类型给出了文本拼接所需的语义。仅仅把变量命名为 `text` 或 `name`，并不会改变运算规则。

## 字符串增长与存储变化

`+=` 能够增加内容长度，但字符仍需要存储空间。与其他可增长序列一样，`std::string` 区分当前内容与为增长准备的容量：

| 操作 | 返回值的含义 |
| --- | --- |
| `size()` | 当前内容包含的 `char` 数量 |
| `capacity()` | 当前字符存储能够容纳的内容字符数量 |

`capacity()` 的返回类型同样是 `std::string::size_type`，容量不小于长度。两者都不把额外的末尾空字符计入内容数量；额外容量也不属于现有内容，不能按容量上限使用下标读写字符。内容下标及末尾标记的访问仍遵循[字符串的下标边界](01-string-objects-and-character-sequences.md#内容边界与结尾空字符)。

当追加后的内容超出原容量时，原有存储就不足以保存结果，成功完成增长需要扩展字符存储。重新分配会取得新的存储，将已有字符内容转移过去，并结束对旧存储的使用。因此，一次追加可能既要保存新字符，也要为已有内容取得新空间、复制字符；连续构造较长文本时，这些工作可能反复发生。

**字符串对象仍然存在，不代表它的字符始终保存在原位置。** 重新分配会使原字符的指针和引用失效，不会让它们自动找到新存储。容量的具体初值和增长幅度由实现选择，不能根据字面量长度假定初始容量，也不能假定每次都按固定倍数扩容。

> [!WARNING]
> `string` 的追加、整串赋值等操作允许使旧字符访问失效，不能照搬 `vector`“剩余容量内追加保留已有元素访问”的保证。容量用于理解和安排存储，不能单独证明修改后的旧指针或引用仍然有效。通过有效下标给已有字符赋值则保留访问关系。

### 已知结果长度时预留容量

成员函数 `reserve(count)` 请求预留至少能容纳 `count` 个内容字符的容量，返回类型为 `void`；它不改变当前文本或 `size()`。在 C++23 中，正常返回时，若请求超过原容量，就发生重新分配，新容量至少达到请求值；若原容量已经足够，则容量保持不变，不发生重新分配。`reserve` 也不会因为收到较小的数量就缩小存储。

前面的记录由固定前缀、位置名称和一个分号组成，可以先计算最终长度，再连续追加。下面的函数可替换前面完整程序中的 `make_entry` 定义，仍使用已包含的 `<string>`：

```cpp
std::string make_entry(const std::string& location) {
    std::string result{"sensor="};
    const std::string::size_type final_size{result.size() + location.size() + 1};
    result.reserve(final_size);
    result += location;
    result += ';';
    return result;
}
```

传入示例中的 `"front"` 时，计划长度为 `7 + 5 + 1`，共十三个字符；这里的 `1` 是分号，不是结尾空字符。成功预留后，`result` 的内容仍是 `sensor=`，长度仍为七；两次追加才形成长度为十三的 `sensor=front;`。预留结果只保证容量至少为十三，不要求恰好为十三，也不能据这段短文本断言原容量一定不足。

预留自身也可能使旧字符访问失效，需要保留字符位置时，应在完成预留与文本构造后再取得相应指针或引用。存储或长度请求无法满足时，`reserve`、`+=` 都可能抛出异常；失败的这一次操作不会改变原字符串的值。

> [!PRACTICE]
> 已有一个需要继续构造的字符串时，`+=` 直接表达“把内容追加到这个对象”；需要保留已有文本并取得组合结果时，可以用 `+` 或在函数内部构造字符串后按值返回。
>
> 已知大致最终长度时，可以在一轮连续追加前预留容量，减少增长过程中重复分配和转移字符的机会。无需把 `reserve` 变成每次追加前的例行调用；它表达存储需求，不负责增加内容长度。

## 参考

- [C++23 草案 N4950：字符串比较](https://timsong-cpp.github.io/cppwp/n4950/string.cmp)
- [C++23 草案 N4950：字符串修改操作](https://timsong-cpp.github.io/cppwp/n4950/string.modifiers)
- [C++23 草案 N4950：字符串拼接](https://timsong-cpp.github.io/cppwp/n4950/string.op.plus)
- [C++23 草案 N4950：字符串容量与预留](https://timsong-cpp.github.io/cppwp/n4950/string.capacity)
- [C++23 草案 N4950：字符串操作的异常与失效规则](https://timsong-cpp.github.io/cppwp/n4950/string.require)
- [C++23 草案 N4950：字符串字面量的存储](https://timsong-cpp.github.io/cppwp/n4950/lex.string)
