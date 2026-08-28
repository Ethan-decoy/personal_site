---
title: 间接访问与被指对象（Indirection and Pointees）
date: 2026-08-27
order: 3
---

# 间接访问与被指对象（Indirection and Pointees）

## 沿指针回到原对象

一元 `*` 是间接运算符（indirection operator）；对指针执行这种操作通常称为解引用（dereferencing）。`*temperature_target` 是间接访问表达式，求值时读取指针对象当前保存的指针值，并指定相应的被指对象（pointee）：

```cpp
int engine_temperature_c{78};
int* temperature_target{&engine_temperature_c};

const int measured_temperature_c{*temperature_target};
```

`*temperature_target` 表示的不是新对象，而是原来的 `engine_temperature_c`。最后一行读取这个对象当前保存的 `78`，再用该值初始化独立对象 `measured_temperature_c`。

因此，真正发生复制的是初始化 `measured_temperature_c` 的过程，而不是 `*` 运算符本身。

## 通过指针修改被指对象

间接访问得到的表达式也可以成为赋值目标：

```cpp
*temperature_target = 82;
```

执行后，`engine_temperature_c` 的值变为 `82`。`temperature_target` 保存的指针值没有改变，仍然指向同一个对象；`measured_temperature_c` 则仍然是先前取得的独立值 `78`。

这段关系可以概括为：

```text
temperature_target  ──指向──>  engine_temperature_c
     int* 对象                       int 对象
```

**通过指针进行间接访问时，表达式接触的是原来的被指对象，而不是它的副本。**

## 同一个符号，不同的语法角色

`*` 的含义取决于它出现的语法位置：

| 写法 | `*` 的角色 | 结果 |
| --- | --- | --- |
| `int* temperature_target` | 指针声明符的一部分 | 声明一个 `int*` 对象 |
| `*temperature_target` | 一元间接访问运算符 | 表示指针当前指向的 `int` 对象 |

不能只看到符号就判断含义。声明负责建立对象及其类型，表达式中的运算符则参与求值。

## 间接访问需要有效目标

`*` 不会先替程序确认目标是否存在。只有当指针值确实指向一个仍在生命周期内、类型关系也允许访问的对象时，才能用间接访问读取或修改该对象。

如果指针没有可访问的目标，程序仍然写下 `*pointer` 并不会得到“空结果”；一旦通过这种表达式访问对象，程序会产生未定义行为。指针对象本身存在，也不等于被指对象仍然存在。

## 参考资料

- [C++23 工作草案：一元运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.unary.op)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
- [C++23 工作草案：存储期](https://timsong-cpp.github.io/cppwp/n4950/basic.stc)
