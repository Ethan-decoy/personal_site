---
title: 指针复制、重新指向与别名关系（Pointer Copying, Reseating, and Aliasing）
date: 2026-08-27
order: 4
---

# 指针复制、重新指向与别名关系（Pointer Copying, Reseating, and Aliasing）

## 复制的是指针值

指针对象可以像已经认识的基本类型对象一样，用另一个同类型对象的当前值完成初始化：

```cpp
int engine_temperature_c{78};

int* primary_calibration_target{&engine_temperature_c};
int* secondary_calibration_target{primary_calibration_target};
```

第二条指针声明创建了新的 `int*` 对象。初始化读取并复制的是 `primary_calibration_target` 当前保存的指针值，而不是 `engine_temperature_c` 对象本身。

此时有两个彼此独立的指针对象，但它们保存相同的指针值，都指向唯一的 `engine_temperature_c`：

```cpp
*secondary_calibration_target = 82;
```

这次赋值把 `engine_temperature_c` 修改为 `82`。`primary_calibration_target` 也能观察到这个新值，因为两条路径接触的是同一个对象，并不是两个副本在自动同步。

## 重新指向只改变指针对象

给已有指针对象赋予另一个指针值，会让它改为指向另一个对象。这种关系变化常称为重新指向（reseating）：

```cpp
int coolant_temperature_c{65};

secondary_calibration_target = &coolant_temperature_c;
```

赋值后，各对象的状态与关系是：

| 对象 | 当前值或指向关系 |
| --- | --- |
| `engine_temperature_c` | `82` |
| `coolant_temperature_c` | `65` |
| `primary_calibration_target` | 指向 `engine_temperature_c` |
| `secondary_calibration_target` | 指向 `coolant_temperature_c` |

最后一行只改变 `secondary_calibration_target` 保存的指针值。它不会修改两个温度对象，也不会让 `primary_calibration_target` 跟随改变。

**复制指针对象时复制的是指针值；给指针对象赋予另一个指针值，只改变接受赋值的那个指针对象。**

## 多条路径与同一个对象

多个名称或表达式最终指定同一个对象时，它们之间存在别名关系（aliasing）。在重新指向之前，下面三条访问路径都指定 `engine_temperature_c`：

- 对象名称 `engine_temperature_c`；
- 表达式 `*primary_calibration_target`；
- 表达式 `*secondary_calibration_target`。

可修改的别名越多，判断“某个对象可能在哪里被改变”就越困难。引入指针时，应让每条指向关系具有明确用途和受控范围。

## 参考资料

- [C++23 工作草案：复合类型与指针值](https://timsong-cpp.github.io/cppwp/n4950/basic.compound)
- [C++23 工作草案：初始化](https://timsong-cpp.github.io/cppwp/n4950/dcl.init)
- [C++23 工作草案：赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
