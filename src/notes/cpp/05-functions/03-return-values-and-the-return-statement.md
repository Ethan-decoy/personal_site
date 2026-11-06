---
title: 返回值与函数结束（Return Values and Function Completion）
date: 2026-08-27
---

# 返回值与函数结束（Return Values and Function Completion）

运费函数算出的金额还要交给调用位置，用来初始化对象或继续计算；显示运费的函数则可以只负责输出，无须交回一个金额。调用怎样结束，以及调用提供什么结果，需要分别判断。

`return` 语句（return statement）发起从当前函数返回的控制转移，返回类型规定调用的结果形式。下面讨论普通辅助函数按值返回 `int`，以及用 `void` 表示不提供值结果的用法；金额以整数元记录，计算示例使用非负的小整数。各个完整程序独立运行。

## 返回表达式建立调用结果

把基本费与附加费相加后，可以先用函数体内的局部对象保存总运费，再把它的值作为调用结果返回。下面是完整程序：

```cpp
#include <iostream>

int calculate_shipping_fee(int base_fee, int surcharge) {
    int total_fee{base_fee + surcharge};

    return total_fee;
}

int main() {
    int shipping_fee{calculate_shipping_fee(5, 10)};
    std::cout << shipping_fee << '\n'; // 15
    return 0;
}
```

`return total_fee;` 中的表达式 `total_fee` 读取局部对象当前保存的整数值。执行关系是：

1. 函数体中的 `total_fee` 完成初始化，保存 `5 + 10` 得到的 `15`；
2. 求值返回表达式，用这个整数值建立本次调用的 `int` 结果；
3. 返回过程离开函数体，局部对象 `total_fee` 的生命周期结束；
4. 调用所在的声明执行完毕后，`main` 中的下一条输出语句读取 `shipping_fee`，显示 `15`。

调用结果用于初始化 `main` 中的 `shipping_fee`。`total_fee` 的声明仍受函数体的块作用域限制，`main` 使用的是返回的整数值。

> [!IMPORTANT] 返回的整数值与局部对象生命周期
> **普通函数正常按值返回 `int` 时，先由返回表达式建立本次调用的整数结果，再完成相应的作用域退出。**对于本次离开的代码块，块中定义且仍然存活的普通自动存储期局部对象会结束生命周期。返回的整数值不依赖这些局部对象继续存在，返回也不会扩大局部名称的作用域。

## return 结束整个函数调用

再考虑一种标准配送规则：商品金额达到 `100` 元时免运费，未达到时收取 `5` 元。达到门槛时，结果已经能够确定，可以直接返回：

```cpp
#include <iostream>

int calculate_standard_shipping_fee(int goods_total) {
    if (goods_total >= 100) {
        return 0;
    }

    return 5;
}

int main() {
    int shipping_fee{calculate_standard_shipping_fee(100)};
    std::cout << shipping_fee << '\n'; // 0
    return 0;
}
```

商品金额为 `100` 时，条件为 `true`，`return 0;` 从运费函数返回，后面的 `return 5;` 不再执行。`main` 仍然继续执行输出语句，显示免邮对应的整数结果 `0`。

| 商品金额 | `goods_total >= 100` | 实际返回路径 | 运费结果 |
| ---: | --- | --- | ---: |
| `99` | `false` | 跳过分支，执行末尾的 `return 5;` | `5` |
| `100` | `true` | 执行分支内的 `return 0;` | `0` |
| `120` | `true` | 执行分支内的 `return 0;` | `0` |

> [!IMPORTANT] return 结束当前函数调用
> **在普通函数中，一条 `return` 正常完成时，结束的是当前调用，而不只是它所在的分支或循环。**返回结果建立并完成相应的作用域退出后，控制交还调用者，本次调用中尚未执行的后续函数体语句不再执行。函数可以包含多条 `return`，实际返回结果取决于本次调用走到的返回路径。

## 不提供值结果的函数

显示运费时，函数可以直接完成输出，而不再向调用位置交回一个金额。返回类型 `void` 表示调用不提供值结果。下面是另一个独立的完整程序；显示函数遇到负数时输出错误消息，再提前返回：

```cpp
#include <iostream>

void print_shipping_fee(int shipping_fee) {
    if (shipping_fee < 0) {
        std::cout << "invalid fee\n";
        return;
    }

    std::cout << "shipping fee: " << shipping_fee << '\n';
}

int main() {
    print_shipping_fee(15);
    print_shipping_fee(-1);
    std::cout << "printing complete\n";
    return 0;
}
```

程序依次输出：

```text
shipping fee: 15
invalid fee
printing complete
```

第一次调用显示运费后，沿正常路径到达函数体末尾。对于这种普通 `void` 函数，到达末尾等价于执行不带操作数的 `return;`，控制回到 `main`。

第二次调用显示错误消息后执行 `return;`，跳过后面的正常运费输出；它结束显示函数的当前调用，`main` 随后仍会输出 `printing complete`。

> [!IMPORTANT] void 不提供值结果，调用仍可完成一项工作
> **返回类型 `void` 表示调用不提供值结果；函数仍然可以通过输出等副作用完成工作。普通 `void` 函数可以通过 `return;` 返回，也可以在沿正常路径到达函数体末尾时返回调用者。**返回整数 `0` 仍然提供一个值结果，与 `void` 的无值结果不同。

因此，调用 `print_shipping_fee(15);` 可以完成显示工作，却不能用它的调用结果初始化一个 `int`。下面的错误片段用于替换这个完整程序中 `main` 的第一条调用语句：

```cpp
int fee{print_shipping_fee(15)}; // 错误：void 调用不提供 int 初始化所需的值
```

这行代码无法通过编译。显示函数的输出作用，与调用是否提供一个可用于初始化的值，是两件事。

## 非 void 函数不能遗漏结果

回到满 `100` 元免运费、否则收取 `5` 元的标准配送规则。如果只保留免邮分支，删除末尾的 `return 5;`，就会遗漏一条提供结果的路径。下面的错误定义只用于语法与执行路径分析，不作为运行示例：

```cpp
int calculate_standard_shipping_fee(int goods_total) {
    if (goods_total >= 100) {
        return 0;
    }
}
```

商品金额为 `100` 时，分支内的 `return 0;` 仍能正常返回；商品金额为 `99` 时，条件为 `false`，控制就会到达函数体末尾，却没有建立所要求的 `int` 结果。

> [!IMPORTANT] 普通 int 函数的正常返回路径必须提供结果
> **对于本节返回 `int` 的普通辅助函数，正常返回调用者的路径必须提供结果；实际到达函数体末尾而没有返回值，会产生未定义行为，即使调用位置忽略返回值也一样。**不能依赖任何所谓的默认返回值，也不能用某次运行结果为这条路径建立可靠含义。

编译器通常会警告这个缺口，但语言规则不要求它必然表现为编译错误。它也不同于在 `int` 函数中写出没有操作数的 `return;`：后者没有提供所需结果，属于不合法的返回语句，须被诊断。

`main` 到达末尾相当于执行 `return 0;`，是[入口函数的特殊规则](06-main-function-and-program-entry.md#返回程序终止状态)，不适用于这里的普通辅助函数。

用下面的定义替换错误版本，在未达到门槛的路径上补足结果：

```cpp
int calculate_standard_shipping_fee(int goods_total) {
    if (goods_total >= 100) {
        return 0;
    }

    return 5;
}
```

现在，商品金额为 `99` 时返回 `5`，为 `100` 或 `120` 时返回 `0`，每条正常返回路径都提供了所需的整数结果。

> [!PRACTICE] 返回值应符合当前路径的含义
> 补足返回值时，应按当前路径的业务含义选择结果。这里的 `0` 表示免邮，若只为消除警告而在末尾随意补上 `return 0;`，未达到门槛的订单也会被免除运费；程序可以编译，却没有完成原定的收费规则。

## 参考资料

- [C++23 工作草案：返回语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++23 工作草案：跳转语句及作用域退出](https://timsong-cpp.github.io/cppwp/n4950/stmt.jump)
- [C++23 工作草案：main 函数](https://timsong-cpp.github.io/cppwp/n4950/basic.start.main)
