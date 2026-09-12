---
title: 相等运算符与对象状态（Equality Operators and Object State）
date: 2026-08-31
order: 4
---

# 相等运算符与对象状态（Equality Operators and Object State）

两个不同对象可以保存相同状态。对于以完整状态表达值的类型，对象地址回答“是否为同一个对象”，相等运算符则应回答“按照当前类型的值语义，两个对象是否表示相同的值”。

```cpp
class tire_snapshot {
  public:
    tire_snapshot(int pressure_kpa, int temperature_c, int wear_percent)
        : stored_pressure_kpa{pressure_kpa}, stored_temperature_c{temperature_c},
          stored_wear_percent{wear_percent} {}

    int pressure_kpa() const {
        return stored_pressure_kpa;
    }

    int temperature_c() const {
        return stored_temperature_c;
    }

    int wear_percent() const {
        return stored_wear_percent;
    }

  private:
    int stored_pressure_kpa;
    int stored_temperature_c;
    int stored_wear_percent;
};
```

这项类型把轮胎在一次测量中的压力、温度和磨损程度共同作为对象状态。相等运算符可以通过公开只读接口比较这三项状态：

```cpp
bool operator==(const tire_snapshot& left, const tire_snapshot& right) {
    return left.pressure_kpa() == right.pressure_kpa() &&
           left.temperature_c() == right.temperature_c() &&
           left.wear_percent() == right.wear_percent();
}
```

`operator==` 通过两个 `const` 引用读取对象，不修改任一操作数，并返回 `bool` 结果。

## 值相等不等于身份相同

```cpp
const tire_snapshot first{220, 35, 18};
const tire_snapshot second{220, 35, 18};
const tire_snapshot changed_pressure{225, 35, 18};

const bool equal_state{first == second};               // true
const bool different_state{first == changed_pressure}; // false
const bool same_identity{&first == &second};           // false
```

`first` 和 `second` 位于不同地址，因此它们具有不同身份；三个状态值相同，所以重载的 `==` 判定它们相等。`changed_pressure` 只改变了压力，但压力属于这项类型承诺的值状态，因此比较结果为 `false`。

若把 `operator==` 实现成 `&left == &right`，它只能重复对象身份判断。这样的实现会让两个独立却状态相同的值对象永远不相等，违背当前 `tire_snapshot` 的值语义。

**地址相等比较对象身份；对于当前这样的值类型，`operator==` 应当比较类型对外承诺的逻辑状态。**

## 相等由类型语义决定

C++ 不会自动判断哪些成员构成对象的值。若上面的函数只比较压力而忽略温度和磨损，代码仍然能够通过编译，却会把本应不同的轮胎快照判为相等。反过来，类也可能保存用于加速计算的缓存或调用统计；若这些数据不属于类型公开表达的值，机械比较全部实现状态同样会得到错误接口。

指针成员也不能只因为位于对象内部就机械决定相等含义。比较两个指针值回答的是它们是否指向同一目标；若类型承诺比较目标所表示的内容，还需要按照该项领域语义完成比较。数据成员的存储形式不能替类型定义逻辑相等。

若类型希望把 `==` 定义为普通值等价关系，这项关系应当满足稳定的基本性质：

- 自反性：有效对象 `value` 与自身相等；
- 对称性：若 `left == right`，则 `right == left`；
- 传递性：若 `first == second` 且 `second == third`，则 `first == third`。

编译器只检查函数声明和表达式是否合法，不会证明实现满足这些性质。破坏其中任一项都会使调用者难以把 `==` 理解为真正的相等关系。

**对于当前这样的值类型，相等运算符是一项类型契约：它把对象的公开值语义压缩为稳定、对称且可推演的布尔关系。**

## 参考资料

- [C++23 工作草案：相等运算符](https://timsong-cpp.github.io/cppwp/n4950/expr.eq)
- [C++23 工作草案：二元运算符](https://timsong-cpp.github.io/cppwp/n4950/over.binary)
- [C++ Core Guidelines：让相等运算保持对称](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#rc-eq)
