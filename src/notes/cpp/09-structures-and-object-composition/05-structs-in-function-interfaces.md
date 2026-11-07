---
title: 结构体与函数接口（Structs in Function Interfaces）
date: 2026-08-28
order: 5
---

# 结构体与函数接口（Structs in Function Interfaces）

绘图程序可以先计算移动后的新位置，也可以直接更新原位置。结构体对象进入函数接口后，值、引用和指针形式仍决定函数得到独立状态，还是访问某个已有对象。

## 参数形式作用于完整状态

这里使用[结构体定义中的 `position`](01-user-defined-types-and-struct-definitions.md#用-struct-定义一种类型)，两个成员依次是横向位置 `x` 和纵向位置 `y`。以下坐标与位移取较小整数，并保证相加结果可以由 `int` 表示。函数定义放在该类型定义之后、`main` 之前，调用片段放在 `main` 的函数体内。

`shifted` 按值接收一个位置，在自己的副本中更新 `x`，再按值返回一个独立的位置结果。`leftmost` 用只读引用访问两个位置，返回横向位置较小的原对象的引用；相同时选择第一个。`move_right` 则通过可写引用直接修改调用者的位置：

```cpp
position shifted(position value, const int dx) {
    value.x += dx;
    return value;
}

const position& leftmost(const position& first, const position& second) {
    if (first.x <= second.x) {
        return first;
    }

    return second;
}

void move_right(position& target, const int dx) {
    target.x += dx;
}
```

三种形式仍具有此前建立的参数语义，但现在作用于完整的 `position` 对象：

- 按值参数 `value` 是由实参初始化的独立对象，函数可以改变这份副本；
- `const position&` 直接绑定原对象，既保留身份，也限制经该参数修改成员；
- `position&` 直接指定调用者对象，成员赋值会修改原对象。

在 `main` 中调用：

```cpp
position first{20, 10};
const position second{60, 10};

const position preview{shifted(first, 15)};
const position& left{leftmost(first, second)};
move_right(first, 50);
```

第一项调用计算出横向位置 `35`、纵向位置 `10`，用于建立独立的 `preview`，没有修改 `first`。第二项调用选择 `first`，使 `left` 绑定它。最后一项调用才把 `first.x` 改为 `70`。

这些调用完成后：

| 访问对象或路径 | `x` | `y` |
| --- | ---: | ---: |
| `first` | `70` | `10` |
| `second` | `60` | `10` |
| `preview` | `35` | `10` |
| 通过 `left` 读取 `first` | `70` | `10` |

移动后，`first.x` 已经大于 `second.x`，但 `left` 仍绑定先前选中的 `first`。此时重新调用 `leftmost(first, second)` 会选中 `second`；新的选择结果不会改变已有 `left` 的绑定。

> [!IMPORTANT] 参数形式决定复制还是绑定
> **按值形参建立独立的结构体对象，直接绑定的引用形参访问原对象。**`const position&` 限制经该路径修改，`position&` 允许修改。返回引用可以保留选中对象的身份，但不会自动重新执行选择；这里的 `left` 始终绑定本次调用选中的 `first`。

`first` 和 `second` 都由 `main` 创建，在这些调用和读取期间保持存活。`leftmost` 返回不会销毁它们，也不会延长它们本来的生命周期。

## 指针参数保留无目标状态

有选中的位置时才执行移动，可以用指针参数保留“没有目标”的状态。保留相同的 `position` 定义，将下面的独立函数放在 `main` 之前：

```cpp
void move_right_if_present(position* const target, const int dx) {
    if (target != nullptr) {
        target->x += dx;
    }
}
```

`target` 是按值初始化的独立指针对象，可以保存空指针值。这里的 `const` 限制对指针形参自身的赋值，经它访问的 `position` 成员仍可修改。目标存在时，成员访问运算符 `->` 经指针确定被指对象，再选择其中的成员。下面是独立的 `main` 函数体：

```cpp
position current{20, 10};

move_right_if_present(&current, 5);
move_right_if_present(nullptr, 5);
```

第一个调用把 `current.x` 改为 `25`，`y` 保持 `10`；第二个调用明确表示没有目标，不执行成员访问。

> [!IMPORTANT] 经指针访问结构体成员
> **对于指向有效结构体对象的普通指针，`target->x` 与 `(*target).x` 指定同一个成员子对象。**第二种写法中的括号不可省略：`.` 比一元间接访问运算符 `*` 更紧密地结合。`->` 直接表达经指针访问成员。

> [!WARNING] 判空与成员访问不验证目标生命周期
> `->` 不会检查目标是否有效。对可正常读取和比较的指针值，判空只区分空与非空；经非空分支访问成员时，仍须保证目标处于生命周期内、类型关系允许访问，并满足相应修改约束。目标生命周期已经结束时，继续经该指针读取或修改原成员会产生未定义行为。当前示例的目标由调用者保持存活，这项保证不能由判空替代。

## 按值返回建立结果对象

函数也可以直接产生一个新的位置。下面的函数放在 `main` 之前，仍使用相同的 `position` 类型：

```cpp
position make_origin() {
    return position{0, 0};
}
```

在一个独立的 `main` 函数体中接收结果：

```cpp
const position origin{make_origin()};
```

返回表达式建立本次调用的 `position` 值结果，用于初始化调用者对象 `origin`，其两个分量都为 `0`。调用者获得自己的完整对象，不依赖函数体中某个局部对象继续存在。

> [!IMPORTANT] 值结果与引用结果的生命周期关系
> **按值返回为调用者提供独立结果；引用返回继续指定已有目标，目标必须在使用期间保持有效。**返回类型换成结构体，不会让引用或指针获得延长目标生命周期的能力。

> [!PRACTICE] 按接口需要选择对象关系
> 复制成本低且接口只需要坐标值时，按值输入通常最直接。需要修改原位置时，用可写引用；需要像 `leftmost` 一样保留某个原对象的身份并只读访问时，用 `const` 引用。允许没有目标时，再用指针表达可选状态。选择依据是所需的对象关系，性能判断还须结合实际类型和测量结果。

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
- [C++23 工作草案：成员访问表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ref)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++ Core Guidelines：函数参数传递](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rf-conventional)
