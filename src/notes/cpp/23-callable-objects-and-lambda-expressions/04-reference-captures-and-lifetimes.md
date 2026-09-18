---
title: 引用捕获与对象有效期（Reference Captures and Object Lifetimes）
date: 2026-09-17
order: 4
---

# 引用捕获与对象有效期（Reference Captures and Object Lifetimes）

按值捕获可以保存创建闭包时的配置。但有些操作需要读取外部对象当前的状态，或者修改调用方提供的对象。这时，闭包可以保存访问原对象的关系，而不建立它的独立副本。

这种关系称为按引用捕获（capture by reference）。它延续[引用的非拥有语义](../08-object-identity-and-lvalue-references/02-lvalue-references-and-reference-binding.md)：闭包能够访问原对象，但不负责延长它的生命周期。

## 一个保存快照，一个读取原对象

捕获列表中的 `[&limit]` 表示按引用捕获局部对象 `limit`。这里的 `&` 是捕获语法，不是在函数体里计算 `limit` 的地址；调用时仍直接用 `limit` 访问原对象。

下面只改变捕获方式，让同一个读数分别与保存的上限、当前的上限比较：

```cpp
#include <iostream>

int main() {
    double limit{245.0};
    const auto snapshot = [limit](double value) -> bool { return value > limit; };
    const auto live = [&limit](double value) -> bool { return value > limit; };
    const auto copy{live};

    limit = 250.0;

    std::cout << snapshot(248.0) << '\n';
    std::cout << live(248.0) << '\n';
    std::cout << copy(248.0) << '\n';
}
```

输出 `1`、`0`、`0`。`snapshot` 使用自己保存的 `245.0`；`live` 读取原对象当前的 `250.0`。复制 `live` 不会把引用捕获转换成值捕获，`copy` 仍然访问同一个外部对象。

| 捕获方式 | 闭包依赖什么 | 外部 limit 改值后 |
| --- | --- | --- |
| `[limit]` | 闭包内保存的 `double` 副本 | 仍使用创建时的数值 |
| `[&limit]` | 外部原对象继续有效 | 读取原对象的新数值 |

两种方式没有统一的优劣。若规则要求固定本次处理使用的上限，按值捕获更准确；若规则本来就要观察外部对象的变化，引用捕获才表达了这种关系。

默认的 `const` 调用也不使引用目标变成只读。若在函数体内执行 `limit = value;`，`[&limit]` 仍允许给本例的外部 `double` 赋值；这修改的是外部对象，而不是闭包中某个按值保存的 `double`。如果原对象本身为 `const`，捕获不会移除其只读限制。

## 返回闭包，不延长局部目标的生命周期

闭包可以按值返回，让调用方保存并继续使用。由于闭包类型没有可直接书写的名称，下面把函数返回类型写成 `auto`：编译器从函数体的返回表达式推导出具体类型。它在这里表示按值返回该闭包对象，不是返回引用；函数定义放在调用之前，使返回类型已经能够确定。

以下函数把参数中的上限复制进闭包，因此函数退出后仍可调用结果：

```cpp
#include <iostream>

auto make_limit_check(double limit) {
    return [limit](double value) -> bool { return value > limit; };
}

int main() {
    const auto check{make_limit_check(245.0)};
    std::cout << check(248.0) << '\n';
}
```

输出 `1`。返回的闭包已经保存独立的 `double`，不依赖参数对象 `limit` 继续存在。闭包的按值返回遵循[返回结果对象的规则](../17-rvalue-references-and-move-semantics/06-return-by-value-and-result-objects.md)，不需要把内部配置改成引用才能离开函数。

下面是一个可以独立定义的错误版本。错误不在返回类型，而在返回结果所借用的对象：

```cpp
auto make_dangling_check(double limit) {
    return [&limit](double value) -> bool { return value > limit; };
}
```

`[&limit]` 借用的是本次调用的按值参数对象。把返回闭包保存到变量，再在下一条语句调用时，这个参数对象已经结束生命周期；此时读取 `limit` 具有未定义行为。复制这个闭包，或给它加上 `const`，都不会补出已经结束的参数对象。

这里分析的是对按值参数的借用。若函数接收的是调用方对象的引用，引用捕获所访问的仍是那个调用方对象；能否继续调用取决于实际目标的生命周期，不能只根据“创建闭包的函数已经返回”判断。

> [!WARNING]
> 闭包对象还活着，只能证明操作本身仍被保存。只要操作包含借用，每次调用时还必须保证借用目标及其访问关系有效；返回或复制闭包不会延长外部目标的生命周期。

## 按值捕获借用对象，仍然依赖原数据

“按值捕获”说明复制了哪个对象，不说明这个对象拥有哪份资源。例如，已有 `std::string_view view` 时，`[view]` 保存的是视图副本，仍借用原来的字符；已有 `std::span` 或指针时，按值捕获也不会复制它们访问的元素。

若原字符串销毁，或修改字符串使[旧字符访问关系失效](../21-text-ownership-and-borrowing/05-text-lifetimes-and-interface-boundaries.md)，读取所捕获视图的字符仍然错误。闭包自己的视图成员完整存在，也不能代替字符拥有者。

需要独立保存一段文本时，可以先从仍然有效的视图建立 `std::string text{view}`，再按值捕获 `text`。这时闭包保存拥有字符的字符串副本，代价是复制文本；单纯把 `[&view]` 改成 `[view]`，只消除了对视图对象本身的依赖，没有消除对字符的借用。

> [!IMPORTANT]
> 判断捕获是否独立，要继续看被捕获对象的语义。`double` 的副本保存独立数值，`string` 的副本保存独立文本，`string_view` 的副本仍然只保存借用范围。

## 把借用有效期与实际调用范围对齐

这里使用的普通 `std::find_if(first, last, pred)` 会在这次函数调用内完成判断，不把谓词保存到调用返回之后。因此，把仍然有效的局部配置按引用捕获，并在配置存活期间立即交给它使用，可以满足生命周期要求。

但“只在这次调用中使用”并不自动保证安全：谓词若让来源销毁，或使正在借用的存储失效，仍然会破坏前提。原对象活着和访问位置有效需要同时成立。

> [!PRACTICE]
> 捕获少量数值配置时，按值保存通常更容易维持固定规则。借用较大的对象能避免复制，但接口需要明确操作何时执行、是否被保存，以及谁维持来源。对需要长期保存的操作，不能仅为了减少复制就把局部对象改为引用捕获。

## 参考资料

- [C++23 工作草案：引用捕获与被引用对象的生命周期](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.capture)
- [C++23 工作草案：auto 返回类型推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
- [C++23 工作草案：函数参数的生命周期](https://timsong-cpp.github.io/cppwp/n4950/expr.call#6)
- [C++23 工作草案：对象生命周期结束后的访问](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：string_view 的范围与失效关系](https://timsong-cpp.github.io/cppwp/n4950/string.view.template)
