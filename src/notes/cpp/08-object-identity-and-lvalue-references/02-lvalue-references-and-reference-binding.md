---
title: 左值引用与引用绑定（Lvalue References and Reference Binding）
date: 2026-08-28
order: 2
---

# 左值引用与引用绑定（Lvalue References and Reference Binding）

用已有对象的当前值初始化新对象，会创建一份独立状态。有些代码需要的不是副本，而是让另一个名称继续指定原来的对象。左值引用（lvalue reference）用类型表达这种绑定关系。

## 引用绑定保留对象身份

```cpp
int engine_temperature_c{78};
int& observed_temperature_c{engine_temperature_c};
```

`int&` 表示“对 `int` 的左值引用”。第二行声明引用变量（reference variable）`observed_temperature_c`，并把它绑定到 `engine_temperature_c`。

这次初始化没有创建另一个 `int` 对象，也没有复制数值 `78`。在引用完成绑定后，名称表达式 `observed_temperature_c` 是一个 lvalue，指定的就是原来的 `engine_temperature_c`：

```cpp
observed_temperature_c = 82;
```

执行后，`engine_temperature_c == 82`。赋值通过引用名称找到原对象，再修改原对象的状态。

```text
observed_temperature_c  ──指代──>  engine_temperature_c
       int& 变量                         int 对象
```

**引用绑定保留已有对象的身份；通过引用名称访问时，表达式直接指定被绑定对象。**

## 引用变量不是对象

`observed_temperature_c` 是变量，但不是对象。C++ 中，变量既可以由对象声明引入，也可以由引用声明引入；对象与引用仍是不同种类的实体。

| 声明 | 引入的实体 | 是否创建独立对象 |
| --- | --- | --- |
| `int saved_temperature_c{engine_temperature_c};` | `int` 对象 | 是，复制当前值 |
| `int* temperature_target{&engine_temperature_c};` | `int*` 对象 | 是，保存指针值 |
| `int& observed_temperature_c{engine_temperature_c};` | `int&` 引用变量 | 否，建立绑定关系 |

引用具有自己的生命周期，绑定关系也会在引用初始化完成后建立；这并不使引用成为具有独立对象表示的“引用对象”。被引用名称指定的 `engine_temperature_c` 才是这里保存温度状态的对象。

对引用名称使用取地址运算符，得到的也是被绑定对象的地址：

```cpp
int* first_address{&engine_temperature_c};
int* second_address{&observed_temperature_c};

bool same_address{first_address == second_address}; // true
```

`&observed_temperature_c` 不会暴露某个假想的引用对象地址。它对 lvalue `observed_temperature_c` 取地址，而这个 lvalue 指定原来的 `engine_temperature_c`。

## 声明符与取地址运算符

同一个 `&` 符号在两处承担不同语法角色：

| 写法 | `&` 的角色 | 含义 |
| --- | --- | --- |
| `int& observed_temperature_c` | 引用声明符（reference declarator） | 构成“对 `int` 的左值引用”类型 |
| `&engine_temperature_c` | 一元取地址运算符 | 产生指向对象的 `int*` 值 |

`int&` 不是“把地址运算符写进类型”，`&engine_temperature_c` 也不是引用声明。**声明中的符号构成引用类型，表达式中的符号执行取地址运算；语法位置决定其含义。**

## 引用必须初始化且不能重新绑定

这样的局部引用变量在定义时必须提供初始化器：

```cpp
int& observed_temperature_c; // 错误：引用没有初始化器
```

引用一旦绑定，就不能改为指代另一个对象。给引用名称赋值，修改的是当前被指代对象：

```cpp
int primary_temperature_c{78};
int backup_temperature_c{65};

int& selected_temperature_c{primary_temperature_c};
selected_temperature_c = backup_temperature_c;
```

最后，`primary_temperature_c == 65`，`backup_temperature_c == 65`，而 `selected_temperature_c` 仍然指代 `primary_temperature_c`。右侧 lvalue 读取 `backup_temperature_c` 当前保存的值，再把该值写入引用所指定的对象；没有发生重新绑定。

**初始化建立引用绑定；之后对引用名称赋值，是给被绑定对象赋值。**

## 引用也能绑定指针对象

引用绑定的是与目标类型相容的对象，并不只限于整数对象。指针变量本身是指针对象，因此也可以成为引用的目标：

```cpp
int engine_temperature_c{78};
int coolant_temperature_c{65};

int* temperature_target{&engine_temperature_c};
int*& selected_target{temperature_target};

selected_target = &coolant_temperature_c;
```

`selected_target` 的类型是 `int*&`，即“对 `int*` 的左值引用”。它绑定的是指针对象 `temperature_target`，而不是该指针所指向的温度对象。最后一行通过引用修改 `temperature_target` 保存的指针值，使它改为指向 `coolant_temperature_c`。

这段关系包含两层：

```text
selected_target  ──指代──>  temperature_target  ──指向──>  coolant_temperature_c
     int*&                         int* 对象                         int 对象
```

分别追踪每一层的类型与目标，就不会把“引用指针对象”和“指针指向温度对象”混成同一种关系。

## 引用与指针表达不同约束

引用与指针都能形成通往已有对象的访问路径，但它们的语言契约不同：

| 性质 | 左值引用 | 对象指针 |
| --- | --- | --- |
| 自身是否为对象 | 否 | 是 |
| 建立关系后能否重新指向 | 不能 | 指针对象通常可以重新赋值 |
| 是否具有正常的空状态 | 没有 | 可以保存空指针值 |
| 访问目标的语法 | 直接使用引用名称 | 对指针执行间接访问 |
| 是否延长普通目标对象的生命周期 | 不会 | 不会 |

正常初始化的引用必须绑定有效对象，不能用 `nullptr` 表示“暂时没有目标”。但不能重新绑定和没有空状态，并不等于引用永远有效：如果被绑定对象先结束生命周期，继续通过引用访问它，同样会产生悬空关系。

当关系要求目标始终存在、并且引用本身不需要改换目标时，引用可以把这些约束写入类型。目标允许不存在或关系需要重新指向时，指针具有相应的值状态与赋值能力。两者都不负责让目标对象继续存活。

## 参考资料

- [C++23 工作草案：基本概念与变量](https://timsong-cpp.github.io/cppwp/n4950/basic.pre)
- [C++23 工作草案：引用声明](https://timsong-cpp.github.io/cppwp/n4950/dcl.ref)
- [C++23 工作草案：引用初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init.ref)
