---
title: 封装与类不变式（Encapsulation and Class Invariants）
date: 2026-08-29
order: 5
---

# 封装与类不变式（Encapsulation and Class Invariants）

轮胎压力不能是任意 `double` 值。假设当前业务模型只接受闭区间 `[0.0, 5.0]` bar，类型需要同时控制对象怎样开始存在，以及之后怎样改变状态：

```cpp
class tire_pressure {
  public:
    tire_pressure() : stored_value_bar{2.3} {}

    double value_bar() const {
        return stored_value_bar;
    }

    bool try_set_value_bar(double requested_value_bar) {
        const bool is_valid{requested_value_bar >= 0.0 && requested_value_bar <= 5.0};

        if (!is_valid) {
            return false;
        }

        stored_value_bar = requested_value_bar;
        return true;
    }

  private:
    double stored_value_bar;
};
```

这个类把“压力始终位于有效区间”作为类不变式（class invariant）：对象完成初始化后，以及每次公开操作完成后，类型都应当继续满足的条件。它是类型设计需要维护的语义约束，不是编译器自动识别和证明的语言属性。

## 初始化建立第一个有效状态

```cpp
tire_pressure front_left{};
```

构造函数把 `stored_value_bar` 直接初始化为有效值 `2.3`。私有成员使外部代码不能绕过接口，在对象创建之后直接写入 `-3.0`；公开修改操作则负责审查新的候选值。

`try_set_value_bar` 先完成验证，只有整个条件成立才修改成员：

```cpp
const bool successful_update{front_left.try_set_value_bar(2.5)};
```

调用结束后，`successful_update` 为 `true`，`front_left.value_bar()` 返回 `2.5`。

无效输入走提前返回路径：

```cpp
const bool failed_update{front_left.try_set_value_bar(-3.0)};
```

函数在赋值之前返回 `false`，成员仍然保存调用前的值；若承接上一次成功调用，就是 `2.5`。这项失败路径既向调用者报告结果，也保持对象原有状态。

合法区间使用两个正向比较共同定义。`NaN` 与有序数值进行比较不会得到 `true`；在当前表达式中，第一个比较为 `false` 后，`&&` 短路并使整项验证失败，因此 `NaN` 也会被拒绝。只检查“不是过小，也不是过大”反而可能漏掉这种不属于有效区间的浮点值。

**不变式不是 private 自动附带的效果，而是所有能够建立或改变对象状态的公开路径共同维护的设计约束。**

## 读取接口不暴露修改路径

`value_bar()` 按值返回一个 `double` 结果：

```cpp
double measured{front_left.value_bar()};
measured = -3.0;
```

`measured` 是独立的 `double` 对象。改变这个副本不会改写 `front_left` 的私有成员；调用者只能通过 `try_set_value_bar` 请求改变轮胎压力。

如果把下面的成员函数加入 `public` 接口，返回的可修改引用就会绕过原本的访问边界：

```cpp
double& unsafe_value_bar() {
    return stored_value_bar;
}
```

调用者不需要写出私有名称，也能通过返回的引用直接赋值：

```cpp
front_left.unsafe_value_bar() = -3.0;
```

返回指向该成员的可修改指针会造成相同问题。`private` 只能禁止未经授权的名称访问；公开接口主动交出的别名仍然具有接口声明所允许的能力。对复制成本很低的 `double`，按值返回既能提供状态，又不会泄漏内部修改路径。

## 封装服务于约束而不是隐藏本身

封装（encapsulation）把内部状态与操作这些状态的接口组织在同一类型中，使类型能够集中维护状态转换规则。它并不要求所有数据都改成私有，也不是把实现细节藏得越多越好。

| 建模需要 | 更直接的形式 |
| --- | --- |
| 一组没有额外业务约束、允许调用者逐项读写的数据 | 拥有公开成员的 `struct` |
| 初始化后必须持续满足条件、修改需要经过审查的状态 | 由公开操作保护私有表示的类 |

第九章的 `tire_state` 适合表达透明状态记录；当前 `tire_pressure` 则把“有效压力”提升为类型自身负责维持的语义。两者不是高低层级关系，而是对不同约束强度的准确表达。

## 参考资料

- [C++23 工作草案：成员访问控制](https://timsong-cpp.github.io/cppwp/n4950/class.access.general)
- [C++ Core Guidelines：class 用于维持不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-class)
- [C++ Core Guidelines：构造函数应建立类不变式](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#Rc-complete)
