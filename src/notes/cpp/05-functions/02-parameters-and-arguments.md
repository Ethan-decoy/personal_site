---
title: 参数与实参（Parameters and Arguments）
date: 2026-08-27
---

# 参数与实参（Parameters and Arguments）

基本运费 `5` 元加上附加费 `10` 元，得到 `15` 元；换成基本费 `8` 元和附加费 `3` 元，则得到 `11` 元。计算规则相同，参与计算的费用却可以不同。

参数让调用位置提供这些数据，同一个运费函数便能处理不同的配送方案。以下费用示例以整数元记录，使用非负的小整数值。

## 函数体中的输入对象

`calculate_shipping_fee` 接收起始费用与附加费。`fee` 保存本次计算中的费用，先由调用位置提供的基本费初始化，再累加附加费。下面是可独立编译的完整程序：

```cpp
#include <iostream>

int calculate_shipping_fee(int fee, int surcharge) {
    fee += surcharge;
    return fee;
}

int main() {
    int base_fee{5};

    int shipping_fee{calculate_shipping_fee(base_fee, 10)};

    std::cout << base_fee << '\n';
    std::cout << shipping_fee << '\n';
    return 0;
}
```

参数列表中的 `int fee` 和 `int surcharge` 是两个形参（parameter）声明。调用圆括号内，用来向形参提供初始值的表达式称为实参（argument）。在 `calculate_shipping_fee(base_fee, 10)` 中，对应关系是：

| 列表位置 | 形参声明 | 实参表达式 | 提供的值 |
| --- | --- | --- | --- |
| 第一个 | `int fee` | `base_fee` | 读取调用方对象，得到 `5` |
| 第二个 | `int surcharge` | `10` | 字面量提供 `10` |

这张表表示位置对应，不规定两个实参谁先求值。

> [!IMPORTANT] 形参与实参的职责
> **在本节算术类型的按值传递（pass by value）模型中，形参是每次调用时建立并初始化的新对象；实参是调用位置提供初始值的表达式。**实参与形参按列表位置对应；全部形参完成初始化之后，函数体才开始执行。

## 当前的按值传递模型

进入运费函数的函数体时，调用方的 `base_fee` 仍保存 `5`，新的形参对象 `fee` 也保存 `5`。两者初始值相同，却是两个对象。

执行 `fee += surcharge;` 后，变化发生在形参对象上：

| 对象 | 所在位置 | 函数体开始执行时 | 执行 `fee += surcharge` 后 |
| --- | --- | ---: | ---: |
| `base_fee` | 调用方 `main` 中 | `5` | `5` |
| `fee` | 本次调用的形参 | `5` | `15` |
| `surcharge` | 本次调用的形参 | `10` | `10` |

`return fee;` 读取形参当前保存的 `15`，建立调用结果；`main` 再用这个整数值完成 `shipping_fee` 的初始化。因此，开篇程序依次输出 `5` 和 `15`：基本费记录保持原值，另一个对象保存计算得到的运费。

> [!IMPORTANT] 按值形参与调用方对象彼此独立
> **按值传递算术类型时，实参产生的值用于初始化新的形参对象；在函数体中修改该形参，不会修改提供初始值的调用方对象。**返回结果可以用于初始化或更新调用方的对象，具体是否写回、写到哪个对象，由调用位置的表达式决定。

同一个函数也可以通过 `calculate_shipping_fee(8, 3)` 取得 `11`。这次形参由另一组值初始化，计算规则仍然是累加两项费用。

## 实参不必是对象名称

开篇调用中的 `base_fee` 是对象名称表达式，`10` 是字面量。计算表达式同样可以提供实参值。保留开篇的函数定义，用下面片段替换 `main` 中 `return 0;` 之前的语句：

```cpp
int base_fee{5};

int shipping_fee{calculate_shipping_fee(base_fee + 2, 2 * 5)};
std::cout << shipping_fee << '\n'; // 17
```

第一个实参 `base_fee + 2` 产生 `7`，用来初始化 `fee`；第二个实参 `2 * 5` 产生 `10`，用来初始化 `surcharge`。函数体累加得到 `17`，输出语句因而显示 `17`，调用方的 `base_fee` 仍保存 `5`。

函数体读取已经初始化好的形参，不需要知道实参值来自对象、字面量还是计算表达式。

当前这个函数的调用需要提供两个实参。下面是用于替换开篇 `main` 中 `shipping_fee` 初始化语句的错误片段：

```cpp
int shipping_fee{calculate_shipping_fee(base_fee)}; // 错误：缺少第二个实参
```

这里没有为形参 `surcharge` 提供实参，编译器在分析这次调用时便会报告错误，程序无法通过编译。

## 对应位置不规定求值先后

实参与形参按照列表位置对应，但不表示实参表达式必定从左向右求值。C++23 规定，不同形参的初始化及其关联的值计算、副作用之间具有[顺序不定的关系](../02-expressions-and-operators/06-expression-structure-and-evaluation-order.md#三种求值关系)：一项完整完成后再进行另一项，不指定哪项在前，但两项不会交错。

`encode_pair` 用第一个形参提供十位、第二个形参提供个位；这里仅组合 `0` 到 `9` 的一位数字。输入 `1`、`2` 得到 `12`，交换输入后得到 `21`。下面是另一个独立的完整程序，调用中的两次自增都修改同一个 `counter`：

```cpp
#include <iostream>

int encode_pair(int first_digit, int second_digit) {
    return first_digit * 10 + second_digit;
}

int main() {
    int counter{0};
    int encoded_value{encode_pair(++counter, ++counter)};

    std::cout << counter << '\n';
    std::cout << encoded_value << '\n';
    return 0;
}
```

进入 `encode_pair` 的函数体之前，两次自增都已经完成，所以第一行输出始终为 `2`。第二行输出则取决于允许的求值次序：

| 实参的求值次序 | `first_digit` 得到的值 | `second_digit` 得到的值 | 返回结果 |
| --- | ---: | ---: | ---: |
| 左侧先求值 | `1` | `2` | `12` |
| 右侧先求值 | `2` | `1` | `21` |

右侧先求值时，先得到的 `1` 仍然初始化第二个形参，不会因为它先算出，就改去初始化第一个形参。

> [!IMPORTANT] 位置对应不规定求值顺序
> **实参与形参的位置对应，与不同形参初始化的求值先后是两件事。C++23 的普通函数调用不保证从左向右准备形参，但保证每项初始化及其关联求值完整完成后，再进行另一项。**全部形参初始化完成之后，才进入函数体。

上例在 C++23 中不构成未定义行为，但程序不能依赖只得到 `12`，也不能用一次运行结果确定固定的左右次序。编译器仍可能对这种在实参中重复修改同一对象的写法发出警告；警告不能代替指定语言版本的求值规则。

如果要求第一个形参得到 `1`、第二个得到 `2`，可以把相互影响的操作拆成独立的完整表达式。保留 `encode_pair` 的定义，用下面片段替换上一个程序中 `main` 内 `return 0;` 之前的语句：

```cpp
int counter{0};

int first_digit{++counter};
int second_digit{++counter};
int encoded_value{encode_pair(first_digit, second_digit)};

std::cout << counter << '\n';
std::cout << encoded_value << '\n';
```

两次自增现在属于两个顺序执行的完整表达式。前一行的更新完成后，才执行下一行，因而 `first_digit` 保存 `1`，`second_digit` 保存 `2`；调用结果稳定为 `12`。改写后的程序依次输出 `2` 和 `12`。

> [!PRACTICE] 明确写出相互依赖的求值顺序
> 多个实参表达式读写同一状态、结果又依赖谁先求值时，先按所需次序完成操作并保存结果，再发起调用。没有相互影响的普通值读取，不必机械地全部拆成临时对象。

## 参数名称属于函数边界

形参名称属于相应的函数参数作用域（function parameter scope）；在本节这样的函数定义中，其作用域延伸到函数定义末尾。调用者不会因为执行过一次调用，就获得这些形参名称。

例如，把下面的错误语句追加在开篇运费程序的 `main` 中、`return 0;` 之前：

```cpp
fee = 0; // 错误：main 中找不到形参 fee 的声明
```

`main` 能找到自己的 `base_fee` 和 `shipping_fee`，却不能通过 `fee` 这个名称访问运费函数的形参。这与先前有没有执行过那次调用无关。

名称相同也不表示共享对象：在拆分自增的写法中，`main` 的 `first_digit` 与 `encode_pair` 的形参 `first_digit` 属于不同作用域，是不同对象。反过来，运费程序中的 `base_fee` 与形参 `fee` 名称不同，仍然可以按列表位置传递值。

> [!IMPORTANT] 形参名称不会进入调用者的作用域
> **形参名称的可用范围由声明所在的作用域决定，不会随调用结果传到调用位置。**在本节算术类型的按值传递模型中，名称相同不会把形参与调用方对象合并为同一个对象，名称不同也不妨碍按位置传值。

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：函数参数作用域](https://timsong-cpp.github.io/cppwp/n4950/basic.scope.param)
