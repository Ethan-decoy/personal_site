---
title: 多路选择与标签（Multiway Selection and Labels）
date: 2026-08-26
---

# 多路选择与标签（Multiway Selection and Labels）

订单可以选择加急配送、普通配送或到店自提。这里约定：字符 `'e'` 表示加急配送，运费为 `15` 元；`'s'` 表示普通配送，运费为 `5` 元；`'p'` 表示到店自提，运费为 `0` 元。其他字符表示未识别的配送方式，需要单独记录。

这里要判断的是“选择了哪一种方式”，每种方式对应一个固定编码。`switch` 语句根据控制值选择执行入口；入口位置由 `case` 或 `default` 标签（label）标记。

以下代码片段各自独立，均放在 `main` 函数体内；错误片段会单独说明。

## 从控制值选择入口

用 `delivery_method` 保存配送方式，用 `shipping_fee` 保存运费。`method_supported` 记录这种方式是否被识别，初始假定为 `true`，遇到未识别编码时再改为 `false`：

```cpp
char delivery_method{'e'};
int shipping_fee{0};
bool method_supported{true};

switch (delivery_method) {
case 'e':
    shipping_fee = 15;
    break;
case 's':
    shipping_fee = 5;
    break;
case 'p':
    shipping_fee = 0;
    break;
default:
    method_supported = false;
    break;
}

int recorded_fee{shipping_fee};
```

执行到 `switch` 时，先求值控制表达式 `delivery_method`，得到 `'e'`。当前值与 `case 'e':` 匹配，程序从这个标签后的语句开始，把运费改为 `15`。

随后执行 `break` 语句，结束包围它的这条 `switch`，转到整条语句之后。`recorded_fee` 因而保存 `15`，其他入口的赋值没有执行。

> [!IMPORTANT] 控制值决定入口，未匹配值由默认入口处理
> **一次执行 `switch` 时，控制表达式只求值一次；有匹配的 `case` 时，从对应标签开始执行。**没有匹配项时，选择 `default`；若也没有 `default`，则不执行 `switch` 内部的语句，直接继续后续代码。

保持其他代码不变，只改变配送方式，可以看到各条路径：

| `delivery_method` | 选择的入口 | `shipping_fee` | `method_supported` | `recorded_fee` |
| --- | --- | ---: | --- | ---: |
| `'e'` | `case 'e':` | `15` | `true` | `15` |
| `'s'` | `case 's':` | `5` | `true` | `5` |
| `'p'` | `case 'p':` | `0` | `true` | `0` |
| `'x'` | `default:` | `0` | `false` | `0` |

未知编码 `'x'` 使 `method_supported` 变为 `false`；此时运费保留初始的 `0`，不能把它解释为已经确认免费。只有方式被识别，运费值才是有效的收费结果。无论从哪个入口执行并离开，后面的 `recorded_fee` 定义都会执行。

`default` 最多出现一次，也可以省略。若删去首例的整个 `default` 部分，再把配送方式改为 `'x'`，就没有任何入口被选中：运费仍为 `0`，后续记录仍会发生，而 `method_supported` 会错误地保留为 `true`。因此，省略默认处理是否合适，取决于未匹配值是否可能出现，以及它应当怎样被记录。

本节使用整数类型作为控制表达式。`char` 属于整数类型，在匹配前会进行相应的整数提升；控制表达式不会像 `if` 的条件那样统一转换为 `bool`。`float`、`double` 和 `long double` 不能直接用于 `switch`。

## case 标签的值

`case` 的标签值在编译期确定，运行时不会从上到下求值各个标签。前面使用的字符字面量满足这个要求，普通可修改变量则不满足。下面是一个独立的错误片段：

```cpp
char delivery_method{'e'};
char express_method{'e'};

switch (delivery_method) {
case express_method: // 错误：express_method 不是常量表达式
    break;
default:
    break;
}
```

`express_method` 虽然初始化为 `'e'`，仍是一个普通可修改对象；当前保存的值不能让它自动成为合法标签。标准把这里的要求称为转换后的常量表达式（converted constant expression）：标签表达式必须能按规定在编译期确定，并转换为控制表达式完成必要整数提升后的类型。

同一条 `switch` 中，各个 `case` 值经过转换后还必须互不相同。下面的错误片段为同一个值写了两个入口：

```cpp
char delivery_method{'e'};

switch (delivery_method) {
case 'e':
    break;
case 'e': // 错误：重复的入口值
    break;
default:
    break;
}
```

> [!IMPORTANT] 标签值在编译期固定，转换后不能重复
> **`case` 使用符合常量表达式要求的固定值，同一条 `switch` 中的标签值经过转换后必须互不相同。**因此，一个控制值至多匹配一个 `case` 入口；`default` 只在没有匹配项时被选为入口。

## 标签不会自动停止执行

在首例中，只去掉加急入口末尾的 `break`，保留标签顺序和其他代码：

```cpp
char delivery_method{'e'};
int shipping_fee{0};
bool method_supported{true};

switch (delivery_method) {
case 'e':
    shipping_fee = 15;
case 's':
    shipping_fee = 5;
    break;
case 'p':
    shipping_fee = 0;
    break;
default:
    method_supported = false;
    break;
}

int recorded_fee{shipping_fee};
```

程序仍从 `case 'e':` 开始，先把运费改为 `15`。由于没有 `break`，执行继续越过 `case 's':`，把运费改为 `5`，随后才离开 `switch`；`recorded_fee` 最终保存 `5`。

这里不会再次检查配送方式是否等于 `'s'`。这种继续越过后续标签执行的行为称为贯穿执行（fallthrough）。

> [!IMPORTANT] 标签标记入口，不会隔离后续执行
> **`case` 与 `default` 本身既不重新判断条件，也不停止执行。**控制进入一个入口后，仍沿源码顺序继续，直到执行 `break` 等控制转移或到达 `switch` 末尾。对于这里彼此独立的收费处理，需要在进入下一种处理之前结束当前路径。

| 配送方式 | 保留加急入口的 `break` | 只去掉这个 `break` |
| --- | ---: | ---: |
| `'e'` | `15` | `5` |
| `'s'` | `5` | `5` |
| `'p'` | `0` | `0` |

表中比较的是最终运费。加急方式的结果发生了变化，说明“选中哪个入口”和“之后执行哪些语句”是两个需要分别追踪的问题。

## 共享逻辑与有意贯穿

如果增加自提柜取件，用 `'l'` 表示，并约定它与到店自提一样不收配送费，这两个标签可以共享同一段赋值。其余收费规则保持不变：

```cpp
char delivery_method{'l'};
int shipping_fee{0};
bool method_supported{true};

switch (delivery_method) {
case 'e':
    shipping_fee = 15;
    break;
case 's':
    shipping_fee = 5;
    break;
case 'p':
case 'l':
    shipping_fee = 0;
    break;
default:
    method_supported = false;
    break;
}
```

`case 'p':` 与 `case 'l':` 之间没有需要单独执行的操作，两个入口都执行同一条赋值，再由同一个 `break` 离开。这种连续标签表达的是共享处理，不是遗漏了停止位置。

回到最初的三种方式，加急运费 `15` 也可以拆成加急附加费 `10` 与普通配送费 `5`。加急入口先加上专有的附加费，再有意继续执行普通配送的收费步骤：

```cpp
char delivery_method{'e'};
int shipping_fee{0};
bool method_supported{true};

switch (delivery_method) {
case 'e':
    shipping_fee += 10;
    [[fallthrough]];
case 's':
    shipping_fee += 5;
    break;
case 'p':
    break;
default:
    method_supported = false;
    break;
}
```

配送方式为 `'e'` 时，运费先从 `0` 增加为 `10`，再增加为 `15`；为 `'s'` 时，直接进入普通配送入口，只增加到 `5`；为 `'p'` 时，不增加运费，仍为 `0`。

`[[fallthrough]]` 是标准属性（standard attribute），用于标明这次贯穿是有意行为，并可避免相应编译器警告。末尾的分号属于这条带属性的空语句（null statement），不能省略。沿当前路径，它后面将要执行的下一条语句必须带有同一条 `switch` 的 `case` 或 `default` 标签。

> [!IMPORTANT] 共享入口与有意贯穿表达不同步骤
> **连续标签让多个入口共享同一段处理；有意贯穿则先执行当前入口的专有步骤，再继续后续处理。**`[[fallthrough]];` 只标明贯穿意图，不改变运行时控制流，也不会替代 `break`。

`default` 同样只是入口标签，不要求位于源码中的最后位置。在首例中，若仅把整个 `default` 部分移到 `case 'e':` 前面并保留它的 `break`，所有输入的结果都不变：已识别的值仍直接进入对应 `case`。若再删去这个 `break`，未知编码 `'x'` 就会先把 `method_supported` 改为 `false`，再贯穿到加急收费，把运费改为 `15`。

## 标签与局部对象作用域

一个局部对象可能只供某个入口使用，但它的作用域不会因此自动限制在这个入口。`case` 与 `default` 只是标签，不会像额外的一对花括号那样建立独立的块作用域。

下面只考虑已确认的加急配送与普通配送，用 `express_fee` 保存加急运费。它只在加急入口中被使用，普通入口直接把运费设为 `5`；这段代码仍然不合法：

```cpp
char delivery_method{'s'};
int shipping_fee{0};

switch (delivery_method) {
case 'e':
    int express_fee{15};
    shipping_fee = express_fee;
    break;
case 's': // 错误：跳过初始化，进入同一块中声明之后的位置
    shipping_fee = 5;
    break;
}
```

`express_fee` 声明在 `switch` 外层花括号形成的块中。它的名称在声明后生效，一直延续到这个块结束；`break` 只负责转移执行位置，不会在源码中结束该名称的作用域。因此，在 `case 's':` 所在的位置，名称查找仍能找到前面的 `express_fee` 声明，即使那里的语句没有使用这个名称。

从控制表达式直接选择普通配送入口，所要求的跳转路径会越过 `int express_fee{15};`，进入同一块中该声明之后的位置。C++ 禁止这里绕过初始化的跳转，判断不以目标位置之后是否读取对象为依据。

> [!IMPORTANT] 跳过初始化的限制与后续是否使用对象无关
> **对于这里带初始化器的普通自动局部对象，不能通过标签跳转绕过初始化，进入同一块中该局部变量已生效的位置。**即使后续语句完全不使用该对象，这条路径仍不合法；名称属于哪个作用域，与语句有没有使用它，需要分别判断。

> [!WARNING] 当前输入不会消除初始化检查
> **上面的片段在编译期就不合法；把 `delivery_method` 改为 `'e'`，也不能使它通过编译。**前一个入口已经写有 `break`，仍不能修复从控制表达式直接进入普通配送标签、绕过初始化的路径。

既然 `express_fee` 只供加急入口使用，就为这段处理增加一条复合语句，让声明所属的作用域与用途一致。下面也为普通配送入口保留同样的块结构：

```cpp
char delivery_method{'s'};
int shipping_fee{0};

switch (delivery_method) {
case 'e': {
    int express_fee{15};
    shipping_fee = express_fee;
    break;
}
case 's': {
    shipping_fee = 5;
    break;
}
}
```

现在，`express_fee` 的作用域在加急入口的内层 `}` 处结束。选择 `'s'` 时，控制直接进入另一个代码块，不会进入 `express_fee` 所属的作用域，因此这条路径合法，最终运费为 `5`。

选择 `'e'` 时，执行路径进入加急代码块，执行到定义并完成初始化后，`express_fee` 的生命周期开始。把 `15` 写入外层运费对象后，`break` 使程序离开该块和 `switch`，局部对象的生命周期随之结束，外层运费对象仍保存 `15`。

> [!IMPORTANT] 花括号界定作用域，break 结束 switch
> **标签本身不建立独立作用域，额外的复合语句可以为局部对象建立块作用域；`break` 则负责结束这里的 `switch`。**两者职责不同：离开内层花括号，不会自动结束外层的 `switch`。

如果只删去修正示例中加急入口的 `break`，`express_fee` 会在自己的代码块结束时结束生命周期，但执行仍会继续到 `case 's':`，把运费从 `15` 改为 `5`。是否创建对象取决于是否实际执行到它的定义；进入代码块既可能来自入口匹配，也可能来自前一入口的贯穿。

## switch 与条件分支的选择

配送方式是否等于 `'e'`、`'s'` 或 `'p'`，是在比较同一个离散控制值与若干固定值。库存是否足以满足订单、成绩是否达到某个分数，则是在判断大小关系或范围。

> [!IMPORTANT] 固定值匹配与范围条件采用不同结构
> **本节使用的 `switch` 适合对同一个整数结果进行固定值的相等匹配；范围判断、多个对象之间的关系，以及结构不同的布尔条件，适合用 `if` 与连续条件分支表达。**选择依据是问题需要怎样判断，而不是分支数量。

> [!PRACTICE] 让入口、停止位置与默认处理清楚可见
> 彼此独立的处理通常显式以 `break` 结束；共享处理使用连续标签，有意贯穿使用 `[[fallthrough]];` 标明。到达 `switch` 末尾也会自然离开，因此末尾的 `break` 并非语法上总是必需；保留清楚的停止位置，有助于在增加标签时核对执行路径。
>
> 未匹配值是否可能出现、应被拒绝还是采用某种默认处理，应由业务规则决定。`default` 负责提供这样的入口，不能仅为了凑齐语法就随意给出一个看似有效的结果。

## 参考资料

- [C++23 工作草案：switch 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.switch)
- [C++23 工作草案：break 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.break)
- [C++23 工作草案：控制转移与局部变量](https://timsong-cpp.github.io/cppwp/n4950/stmt.dcl)
- [C++23 工作草案：fallthrough 属性](https://timsong-cpp.github.io/cppwp/n4950/dcl.attr.fallthrough)
