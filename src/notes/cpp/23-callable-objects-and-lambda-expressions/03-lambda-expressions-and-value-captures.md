---
title: Lambda 表达式与按值捕获（Lambda Expressions and Value Captures）
date: 2026-09-17
order: 3
---

# Lambda 表达式与按值捕获（Lambda Expressions and Value Captures）

判断规则只在一个位置使用时，单独声明一个类会把行为与使用位置分开。Lambda 表达式（lambda expression）允许在表达式所在位置创建一个函数对象，把短小的操作写在需要它的地方。

**Lambda 表达式产生对象；对这个对象执行调用，才会运行函数体。** 它仍然具有类型、状态和生命周期，不能只把它理解成一段粘贴到算法里的代码。

## 先读懂一个不捕获外部状态的表达式

下面的写法定义“是否为负值”的操作：

```cpp
const auto is_negative = [](double value) -> bool { return value < 0.0; };
```

这段声明可以放入函数体，不需要包含专门的 Lambda 头文件。各部分承担不同职责：

| 写法 | 含义 |
| --- | --- |
| `[]` | 捕获列表（capture list）；这里为空，不捕获外层局部对象 |
| `(double value)` | 每次调用接收一个 `double` 参数 |
| `-> bool` | 尾置返回类型（trailing return type），声明调用结果为 `bool` |
| `{ return value < 0.0; }` | 调用时执行的函数体 |
| 末尾的 `;` | 结束整个变量声明 |

编译器为这个 Lambda 表达式建立一个独有的、没有可直接书写名称的类类型，称为闭包类型（closure type）；产生的对象称为闭包对象（closure object）。本篇这种写法提供了接收 `double`、返回 `bool` 的 `operator()`。

声明中的 `auto` 让编译器根据初始化表达式推导变量类型（type deduction）。这里的 `is_negative` 因而具有这个闭包类型，不是 `bool`；`const` 则使变量成为不可修改的闭包对象。类型在编译期已经确定，不会在运行时随着调用结果变化。

`auto` 也不会自动表示引用。这里的声明保存一个对象；`is_negative(-2.0)` 才调用它并产生 `bool` 结果。

本篇显式写出 `-> bool`，便于识别接口。对于这个函数体，也可以省略它，由 `return value < 0.0;` 推导出 `bool`。省略时并不是任意返回类型都能混用：多个返回分支需要能推导出同一类型。

## 直接把对象交给算法

Lambda 表达式可以直接作为实参。下面的 `find_if` 接收刚创建的函数对象，并在查找期间调用它：

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    const std::vector<double> samples{240.0, -2.0, 245.0};
    const std::vector<double>::const_iterator found{std::find_if(
        samples.cbegin(), samples.cend(), [](double value) -> bool { return value < 0.0; })};

    if (found != samples.cend()) {
        std::cout << *found << '\n';
    }
}
```

输出 `-2`。`[]...{...}` 先描述并创建操作，函数体里的 `value` 由算法每次调用时提供；写出 Lambda 表达式本身不会先判断某个读数。

这与先声明 `is_negative` 再传入它使用相同的接口。直接作为实参适合很短、只在当前调用使用的规则；保存到具名变量中则方便复用或说明规则含义。

## 按值捕获保存建立时的配置

如果上限是外层局部变量，闭包需要保存它，才能在只接收一个读数时完成判断。捕获（capture）描述闭包如何取得这类外部状态；`[limit]` 表示按值捕获（capture by copy）局部对象 `limit`。

对这里的 `double limit`，求值 Lambda 表达式时就把当前数值复制进闭包。捕获发生在创建对象时，不是每次调用时。

```cpp
#include <iostream>

int main() {
    double limit{245.0};
    const auto check = [limit](double value) -> bool { return value > limit; };

    limit = 250.0;
    const auto copy{check};

    std::cout << check(248.0) << '\n';
    std::cout << copy(248.0) << '\n';
    std::cout << limit << '\n';
}
```

输出 `1`、`1`、`250`。`check` 保存的是创建时的 `245.0`。之后外部 `limit` 改为 `250.0`，不会改写闭包中的副本；复制 `check` 又复制了这份配置，`copy` 也使用 `245.0`。

这里可以用“包含一个 `double` 成员和一个调用成员函数的对象”理解闭包的行为，与[具名函数对象](01-function-objects-and-call-operators.md#对象保存配置参数提供本次输入)一致。这是状态与调用关系的模型，不是对编译器生成类型名称或对象布局的承诺。

若把本例的 `[limit]` 改为 `[]`，函数体读取这个外层可变局部变量就会因缺少捕获而编译失败。形参 `value` 属于本次调用，不需要捕获。捕获列表也不是调用实参列表：`limit` 在创建闭包时确定，`value` 在调用时提供。

> [!IMPORTANT]
> 按值捕获先把配置存入闭包，再用它处理后续输入。改变外部原对象，不会同步改变闭包中的这份副本；复制闭包也不会重新从外部读取一次配置。

## 默认调用只读闭包自身的状态

本篇没有额外限定的 Lambda 写法，其 `operator()` 默认是 `const` 成员函数。因此 `const auto check` 可以调用，而函数体不能直接给按值捕获的 `double limit` 重新赋值。

这是对闭包自身的调用权限，不会把外部 `limit` 一并变成 `const`。捕获一个指针或视图时，复制的也只是相应对象，不能据此推断它所指数据被复制或变成只读；访问关系仍取决于被捕获类型的语义。

> [!PRACTICE]
> 小而稳定的配置适合显式按值捕获：从列表就能看到操作保存了哪些输入，也容易判断复制成本。对于 `string`、`vector` 等拥有数据的对象，捕获会复制其内容；需要借用时，应同时明确来源在调用期间保持有效的条件。

## 参考资料

- [C++23 工作草案：Lambda 表达式与闭包对象](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.general)
- [C++23 工作草案：闭包类型与调用运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.closure)
- [C++23 工作草案：按值捕获与捕获初始化](https://timsong-cpp.github.io/cppwp/n4950/expr.prim.lambda.capture)
- [C++23 工作草案：auto 类型推导](https://timsong-cpp.github.io/cppwp/n4950/dcl.spec.auto)
