---
title: 类级状态与静态成员（Class State and Static Members）
date: 2026-10-08
order: 2
---

# 类级状态与静态成员（Class State and Static Members）

每个压力对象保存自己的读数，但“允许的最大压力”属于类型接口。静态成员（Static Member）在类中命名，却不属于每个对象的成员子对象。

## 共享成员只有一份类级身份

静态数据成员通过 `类型名::成员名` 访问；静态成员函数没有 `this`，只能直接访问静态成员，或通过明确给出的对象访问非静态成员。

```cpp
#include <iostream>

class pressure_policy {
  public:
    inline static int limit{500};

    static bool accepts(int value) {
        return value >= 0 && value <= limit;
    }
};

int main() {
    std::cout << pressure_policy::accepts(450) << '\n'; // 1
    pressure_policy::limit = 400;
    std::cout << pressure_policy::accepts(450) << '\n'; // 0
}
```

`inline static` 的这一定义可以放在类定义中，按 inline 实体规则跨翻译单元形成同一成员身份。它不为每个 pressure_policy 对象另存一份 limit。

若是 `static constexpr int limit{500};`，表达的是不可修改、可用于相应常量语境的类级常量；C++17 起这样的静态数据成员隐含 inline。

## static 在不同位置承担不同规则

类中的 static 表达成员与对象身份的关系；函数局部 static 表达存储期和初始化；命名空间作用域 static 还影响链接。不能因为关键字相同就把三种声明的定义位置和访问规则互相套用。

非 inline 的静态数据成员声明通常仍须按要求在类外提供定义，例如类内 `static int limit;`，相应源文件中写 `int pressure_policy::limit{500};`。

> [!IMPORTANT]
> 静态成员是类作用域中的共享实体，不是普通成员的一种“自动同步”形式。访问控制、初始化、跨文件定义和并发访问仍分别判断。

## 类级可变状态仍是共享依赖

本例改动 limit 会影响之后所有检查；这有助于展示身份，也带来隐含全局依赖。对象各自需要不同配置时，应把配置作为对象状态或明确实参。

静态成员函数适合无需某个对象即可完成的类型相关操作，不因为名字放在类里就获得当前对象。

## 参考资料

- [C++23 工作草案：静态成员](https://timsong-cpp.github.io/cppwp/n4950/class.static)
- [C++23 工作草案：inline](https://timsong-cpp.github.io/cppwp/n4950/dcl.inline)
