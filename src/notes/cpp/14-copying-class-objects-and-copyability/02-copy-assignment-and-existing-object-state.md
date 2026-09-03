---
title: 复制赋值与既有对象状态（Copy Assignment and Existing Object State）
date: 2026-09-03
order: 2
---

# 复制赋值与既有对象状态（Copy Assignment and Existing Object State）

当赋值号两侧的同类型对象都已经存在时，右侧对象提供状态，左侧对象接收修改。类可以用复制赋值运算符（copy assignment operator）定义这项状态更新：

```cpp
class tire_snapshot {
  public:
    tire_snapshot(int initial_pressure_kpa, int initial_temperature_c)
        : pressure_kpa{initial_pressure_kpa}, temperature_c{initial_temperature_c} {}

    tire_snapshot& operator=(const tire_snapshot& source) {
        pressure_kpa = source.pressure_kpa;
        temperature_c = source.temperature_c;
        return *this;
    }

    int current_pressure_kpa() const {
        return pressure_kpa;
    }

    int current_temperature_c() const {
        return temperature_c;
    }

  private:
    int pressure_kpa;
    int temperature_c;
};
```

`tire_snapshot& operator=(const tire_snapshot&)` 是 `tire_snapshot` 的复制赋值运算符。复制赋值运算符是非静态成员函数：调用对象提供左操作数，`source` 形参绑定右操作数。

## 赋值修改左侧的已有对象

```cpp
tire_snapshot active{210, 40};
const tire_snapshot baseline{230, 20};

active = baseline;
```

求值 `active = baseline` 时，`active` 成为 `operator=` 的调用对象，`baseline` 绑定到 `source`。函数体依次把源对象的两个成员值赋给调用对象中已经存在的成员子对象。调用结束后，`active` 保存压力 `230` 和温度 `20`，`baseline` 保持不变。

这里没有构造新的 `active`，也没有先销毁它再重新构造。可以在赋值前保存它的地址，并在赋值后观察同一个对象：

```cpp
tire_snapshot* const active_identity{&active};

active = baseline;

const bool still_same_object{active_identity == &active}; // true
```

指针在前后都指向同一个 `active`。赋值替换的是该对象的状态，不会改变它的类型、身份或存储位置。

**复制构造建立新的同类型对象；复制赋值读取同类型源对象，并修改已经存在的目标对象。**

## operator= 的返回值仍然指代左侧对象

返回类型 `tire_snapshot&` 与函数体末尾的 `return *this;` 共同决定赋值表达式的结果：

```cpp
tire_snapshot active{210, 40};
const tire_snapshot baseline{230, 20};

tire_snapshot& updated{active = baseline};
const bool result_is_active{&updated == &active}; // true
```

`*this` 是指定调用对象 `active` 的 lvalue，按引用返回不会创建另一个 `tire_snapshot`。因此 `active = baseline` 完成状态修改后，表达式结果仍然是指定 `active` 的 lvalue。这与内建赋值的结果模型一致，也使连续赋值能够把右侧赋值后的左对象继续交给下一次赋值。

C++ 的运算符函数语法并不强制用户定义的 `operator=` 必须返回 `tire_snapshot&`；当前返回形式是类型接口主动兑现的赋值惯例。若选择其他返回类型，状态修改仍可发生，但表达式结果与普通赋值的使用方式可能不再一致。

## 源对象与目标对象可能相同

`const tire_snapshot& source` 可以绑定另一个对象，也可以绑定当前调用对象本身：

```cpp
tire_snapshot active{210, 40};
tire_snapshot& same_object{active};

active = same_object;
```

`same_object` 与 `active` 指定同一个对象，因此这仍然是自赋值（self-assignment）。当前函数体对两个 `int` 成员分别执行自赋值，每项操作都保持原值，`active` 仍然保存压力 `210` 和温度 `40`。不需要为了识别自赋值而额外加入地址比较。

类作者不能假定赋值号两侧必然具有不同身份。若一项复制赋值实现会在读取 `source` 之前破坏调用对象中的必要状态，那么左右两侧恰好是同一对象时就可能产生错误。当前直接的成员赋值没有这项问题。

## 可修改性由左右两侧承担不同职责

右侧形参是 `const tire_snapshot&`，因此普通的可修改对象和 `const` 对象都能提供复制源。左侧调用对象则必须允许修改：

```cpp
const tire_snapshot baseline{230, 20};
tire_snapshot active{210, 40};

active = baseline; // 正确：读取 baseline，修改 active
```

若左侧对象是 `const`，当前非 `const` 成员函数不能通过它调用：

```cpp
const tire_snapshot parked{210, 40};
const tire_snapshot baseline{230, 20};

parked = baseline; // 错误：不能修改 const 调用对象
```

这种不对称正是复制赋值接口的含义：右侧对象提供状态而不通过当前形参被修改，左侧已有对象接受状态更新。**`T& operator=(const T&)` 中的两个引用承担不同角色：返回引用保留赋值结果的左对象身份，参数的 `const` 引用提供只读复制源。**

## 参考资料

- [C++23 工作草案：复制赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：重载的赋值运算符](https://timsong-cpp.github.io/cppwp/n4950/over.ass)
- [C++23 工作草案：赋值表达式](https://timsong-cpp.github.io/cppwp/n4950/expr.ass)
