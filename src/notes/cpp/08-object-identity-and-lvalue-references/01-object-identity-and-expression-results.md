---
title: 对象身份与表达式结果（Object Identity and Expression Results）
date: 2026-08-28
order: 1
---

# 对象身份与表达式结果（Object Identity and Expression Results）

表达式具有类型，但类型不能完整说明表达式的结果怎样参与后续求值。名称表达式可以确定已经存在的对象，算术表达式则通常为所在语境计算一个值。C++ 使用值类别（value category）描述这种区别。

## 类型与值类别是两个维度

```cpp
int engine_temperature_c{78};
int next_temperature_c{engine_temperature_c + 1};
```

第二行中的几个表达式都具有 `int` 类型，但它们的结果并不相同：

| 表达式 | 类型 | 当前值类别 | 求值结果 |
| --- | --- | --- | --- |
| `engine_temperature_c` | `int` | 左值（lvalue） | 确定已有对象 `engine_temperature_c` 的身份 |
| `1` | `int` | 纯右值（prvalue） | 为所在语境提供数值 `1` |
| `engine_temperature_c + 1` | `int` | prvalue | 为所在语境提供计算结果 `79` |

**表达式的类型说明结果按照什么类型解释；值类别说明求值结果与对象身份之间具有怎样的关系。**两个表达式可以具有相同类型，却采用不同的值类别。

在本章直接出现的基本类型与内建表达式中，lvalue 与 prvalue 已足以建立对象访问、基本运算和引用绑定的当前模型；这不是对 C++ 全部值类别的穷举。

## lvalue 确定已有对象的身份

在当前对象语境中，lvalue 的求值结果能够确定某个对象的身份。对象名称是最直接的例子；对有效对象指针进行间接访问，也会得到指定被指对象的 lvalue：

```cpp
int engine_temperature_c{78};
int* temperature_target{&engine_temperature_c};

engine_temperature_c = 80;
*temperature_target = 82;
```

两条赋值的左操作数都是 lvalue。第一条通过对象名称确定 `engine_temperature_c`，第二条通过指针确定同一个对象；它们没有先复制对象的当前值，再尝试修改副本。

已经认识的部分内建表达式也会保留对象身份：

| 表达式 | 值类别 | 结果 |
| --- | --- | --- |
| `engine_temperature_c` | lvalue | 指定已有对象 |
| `*temperature_target` | lvalue | 指定已有的被指对象 |
| `engine_temperature_c = 80` | lvalue | 指定完成赋值后的左侧对象 |
| `++engine_temperature_c` | lvalue | 指定完成递增后的对象 |

**lvalue 的核心不是“写在赋值号左边”，而是求值能够确定实体身份。**名称来自语言早期历史，不能作为现代 C++ 中的定义。

## lvalue 不一定允许修改

值类别与可修改性也不是同一个维度：

```cpp
const int maximum_temperature_c{120};
```

名称表达式 `maximum_temperature_c` 仍然是 lvalue，因为它确定已有对象的身份；它的类型是 `const int`，因此不是可修改的 lvalue，不能成为普通赋值的左操作数。

另一方面，赋值的右操作数同样可以是 lvalue：

```cpp
int current_temperature_c{78};
int saved_temperature_c{current_temperature_c};
```

初始化器 `current_temperature_c` 是 lvalue。这里只需要读取对象当前保存的值，因此它出现在初始化器中并不会改变自身的值类别。

## prvalue 为所在语境计算值

prvalue 用于初始化对象，或计算运算符所需的值。在当前基本类型范围内，字面量、内建算术结果和按值返回函数的调用都是常见的 prvalue：

```cpp
int calculate_warning_temperature_c(int temperature_c) {
    return temperature_c + 5;
}

int warning_temperature_c{calculate_warning_temperature_c(78)};
```

字面量 `78`、加法 `temperature_c + 5` 和调用表达式 `calculate_warning_temperature_c(78)` 都是 `int` 类型的 prvalue。调用结果用于初始化 `warning_temperature_c`，但它不指定函数体中某个继续存在的局部对象。

后置自增同样产生 prvalue：

```cpp
int sample_count{4};
int previous_count{sample_count++};
```

`sample_count++` 修改已有对象，却产生修改前数值对应的 prvalue。由此也能看到，**值类别描述表达式结果与身份的关系，不描述表达式是否具有副作用。**

## 从对象身份读取当前值

当某个语境需要值，而操作数首先以 lvalue 确定对象身份时，通常会发生左值到右值转换（lvalue-to-rvalue conversion）。对于当前普通 `int` 对象，这项转换读取对象当前保存的值，并产生 `int` 类型的 prvalue：

```cpp
int engine_temperature_c{78};
int next_temperature_c{engine_temperature_c + 1};
```

内建加法需要两个用于计算的值，因此：

1. 名称表达式 `engine_temperature_c` 先以 lvalue 确定已有对象；
2. lvalue-to-rvalue conversion 读取其中保存的 `78`；
3. 读取结果与字面量 `1` 参与加法；
4. 加法产生 prvalue `79`，用于初始化 `next_temperature_c`。

并非每次写出对象名称都会读取其中的值：

```cpp
int engine_temperature_c{78};
int* temperature_target{&engine_temperature_c};

engine_temperature_c = 80;
```

取地址表达式需要对象身份，赋值的左操作数需要待修改对象，因此这两个位置不会为了当前作用而先执行普通的 lvalue-to-rvalue conversion。**先确定对象身份，还是从对象中取得值，取决于表达式所在语境需要什么。**

## 参考资料

- [C++23 工作草案：值类别](https://timsong-cpp.github.io/cppwp/n4950/basic.lval)
- [C++23 工作草案：左值到右值转换](https://timsong-cpp.github.io/cppwp/n4950/conv.lval)
- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
