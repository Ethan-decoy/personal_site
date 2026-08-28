---
title: 引用返回与生命周期边界（Reference Returns and Lifetime Boundaries）
date: 2026-08-28
order: 6
---

# 引用返回与生命周期边界（Reference Returns and Lifetime Boundaries）

按值返回的函数调用产生可供调用者使用的独立结果。函数也可以返回引用，使调用表达式继续指定某个已经存在的对象。引用返回没有复制对象状态，但把目标对象的生命周期边界带到了调用位置。

## 引用返回保留已有对象身份

```cpp
int& select_higher_pressure_kpa(int& first_pressure_kpa, int& second_pressure_kpa) {
    if (first_pressure_kpa < second_pressure_kpa) {
        return second_pressure_kpa;
    }

    return first_pressure_kpa;
}
```

函数返回类型是 `int&`。两条 `return` 语句都用形参名称表达式初始化返回引用；形参已经绑定调用者对象，因此返回结果继续指定相应的原对象，没有创建新的 `int` 副本。

```cpp
int front_pressure_kpa{230};
int rear_pressure_kpa{250};

int& selected_pressure_kpa{select_higher_pressure_kpa(front_pressure_kpa, rear_pressure_kpa)};

selected_pressure_kpa += 5;
```

调用选择 `rear_pressure_kpa`，因此 `selected_pressure_kpa` 绑定这个对象。最后一条语句把 `rear_pressure_kpa` 修改为 `255`。

**返回左值引用的函数调用是 lvalue：它的结果确定被返回对象的身份，而不是只提供该对象当前保存的值。**

## 返回形式决定调用结果关系

返回类型不仅说明调用结果的基础类型，也决定调用者获得独立值还是已有对象的访问路径：

| 返回形式 | 调用表达式的当前值类别 | 调用者得到的关系 |
| --- | --- | --- |
| `int` | prvalue | 用于初始化或计算的独立数值结果 |
| `int&` | lvalue | 对已有、可修改 `int` 对象的访问 |
| `const int&` | lvalue | 对已有对象的受限访问 |
| `int*` | prvalue | 指针值；可以指向对象，也可以为空 |

按值返回通常让调用者最容易维护结果生命周期。引用返回适合接口确实要暴露某个已有对象身份的情况；指针返回还能表达“没有目标”。`const` 引用只限制经调用结果修改对象，不能保证目标仍然有效。

## 不能返回局部对象的引用

普通局部对象会在函数调用离开相应代码块时结束生命周期：

```cpp
const int& invalid_pressure_source() {
    int local_pressure_kpa{210};
    const int& local_pressure_source{local_pressure_kpa};

    return local_pressure_source;
}
```

名称表达式 `local_pressure_source` 是 lvalue，指定 `local_pressure_kpa`，因此能够初始化返回的 `const int&`。函数退出时，局部引用的生命周期结束，`local_pressure_kpa` 对象也随即销毁；调用表达式随后没有仍在生命周期内的目标：

```cpp
const int& dangling_pressure_kpa{invalid_pressure_source()};
int measured_pressure_kpa{dangling_pressure_kpa}; // 未定义行为
```

编译器或静态分析工具可能发现这类问题，但诊断不能替代接口本身的正确性判断。**返回引用的目标必须在函数返回后继续存在，并且至少覆盖调用者使用该引用的整个时间范围。**

返回局部对象的指针具有同样的生命周期问题。指针与引用的语法不同，但都不能让已经离开生命周期的局部对象继续存在。

## return 中的临时对象不会得到延长

直接在 `return` 中用 prvalue 初始化返回引用也不能建立长期目标：

```cpp
const int& invalid_answer() {
    return 42;
}
```

在 C++23 中，为引用返回物化的临时 `const int` 对象不会延长到调用者作用域。返回引用先完成初始化，临时对象随后在 `return` 操数所属的完整表达式结束时销毁；函数调用提供的是已经失去有效目标的 lvalue。

编译器通常会对这段代码发出警告，但 C++23 规则不要求把它作为必须拒绝的编译错误。调用者即使立即再用 `const int&` 绑定调用结果，也不能重新延长已经结束的临时对象生命周期。

**引用返回只能传递对象身份，不能把函数体内即将结束的对象生命周期一同返回。**

## 按值返回建立独立结果

函数需要产生自己的计算结果时，按值返回没有上述目标生存期要求：

```cpp
int make_default_pressure_kpa() {
    return 210;
}

int configured_pressure_kpa{make_default_pressure_kpa()};
```

`return 210;` 用 `int` prvalue 建立本次调用的值结果，调用表达式同样是 `int` prvalue，再用于初始化调用者自己的 `configured_pressure_kpa`。这个结果不需要函数体中的某个对象在调用结束后继续存在。

因此，函数只是计算一个结果时，应默认通过值返回。只有调用者确实需要继续访问某个已有对象，并且接口能够清楚保证该对象的生命周期时，引用返回才准确表达需求；目标可能不存在时，再由指针值表达这一状态。

## 参考资料

- [C++23 工作草案：函数调用](https://timsong-cpp.github.io/cppwp/n4950/expr.call)
- [C++23 工作草案：return 语句](https://timsong-cpp.github.io/cppwp/n4950/stmt.return)
- [C++23 工作草案：临时对象](https://timsong-cpp.github.io/cppwp/n4950/class.temporary)
- [C++23 工作草案：对象生命周期](https://timsong-cpp.github.io/cppwp/n4950/basic.life)
