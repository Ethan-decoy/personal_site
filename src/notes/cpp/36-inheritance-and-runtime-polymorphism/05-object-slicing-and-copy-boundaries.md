---
title: 对象切片与复制边界（Object Slicing and Copy Boundaries）
date: 2026-10-05
order: 5
---

# 对象切片与复制边界（Object Slicing and Copy Boundaries）

虚函数可以通过基类引用调用派生实现。如果把函数形参从 `const pressure_sensor&` 改成 `pressure_sensor`，它还能保留校准对象的行为吗？

按值传参建立一个形参对象。**对象的类型由形参声明决定，虚函数不会让一个基类形参自动变成派生类对象。**这个复制边界造成对象切片（Object Slicing）。

## 按值复制基类部分，形成新的基类对象

从派生对象初始化一个基类值对象时，基类的复制构造函数可以借用源对象的基类部分，按自身规则创建一个新的基类对象。派生类增加的状态和完整对象类型不会因此被复制过去。

下面是完整程序。为了明确展示复制语义，基类显式默认复制构造和复制赋值；虚析构则允许这个多态基类用于相应的销毁接口。

```cpp
#include <iostream>

class pressure_sensor {
  public:
    explicit pressure_sensor(int value) : stored{value} {}

    pressure_sensor(const pressure_sensor&) = default;
    pressure_sensor& operator=(const pressure_sensor&) = default;
    virtual ~pressure_sensor() = default;

    virtual int read() const {
        return stored;
    }

  private:
    int stored;
};

class calibrated_sensor : public pressure_sensor {
  public:
    calibrated_sensor(int value, int adjustment) : pressure_sensor{value}, offset{adjustment} {}

    int read() const override {
        return pressure_sensor::read() + offset;
    }

  private:
    int offset;
};

int read_by_value(pressure_sensor source) {
    return source.read();
}

int read_by_reference(const pressure_sensor& source) {
    return source.read();
}

int main() {
    const calibrated_sensor source{220, 10};

    std::cout << read_by_value(source) << '\n';     // 220
    std::cout << read_by_reference(source) << '\n'; // 230
    std::cout << source.read() << '\n';             // 230
}
```

`read_by_value` 创建的是 `pressure_sensor` 形参。复制构造把原对象基类部分的 `stored` 复制为 `220`，新对象没有 `offset` 成员，它自己的虚调用自然选择 `pressure_sensor::read()`。

`read_by_reference` 则没有创建新的传感器对象。它借用原 `calibrated_sensor` 的基类部分，虚调用仍然能够到达派生覆盖。

| 接口 | 是否创建新的传感器对象 | 正常使用期的调用目标 |
| --- | --- | --- |
| `pressure_sensor source` | 是，创建一个基类形参 | 新基类对象的 `read` |
| `const pressure_sensor& source` | 否，借用原对象 | 原派生对象的 `read` |

> [!IMPORTANT]
> 切片的关键是目的对象被声明为基类值。它得到基类部分所提供的状态，成为独立的基类对象；源派生对象没有被裁掉或改变。`virtual` 根据当前目标选择实现，不会恢复复制时没有保留的派生类型。

## 切片不是虚调用失效

在上面 `main` 中，可以把同类型复制与复制成基类值放在一起观察。本例中，`calibrated_sensor` 的默认复制构造会先调用基类的复制构造函数来初始化基类子对象，再复制自身的 `offset` 成员；目的对象仍然是 `calibrated_sensor`。

```cpp
const calibrated_sensor copied{source};
const pressure_sensor sliced{source};

std::cout << copied.read() << '\n'; // 230
std::cout << sliced.read() << '\n'; // 220
std::cout << source.read() << '\n'; // 230
```

`copied` 的基类成员 `stored` 为 `220`，派生成员 `offset` 为 `10`，它自己的虚调用仍选择校准版本。它与 `source` 各有独立的子对象；读数相同，不表示二者是同一个对象。前面的引用传参则没有创建传感器副本。

`sliced` 的完整对象类型是 `pressure_sensor`，没有 `offset` 成员，因此返回 `220` 完全符合虚函数规则。两次复制都没有改变源对象，`source.read()` 仍为 `230`。

切片也不等于复制了“前若干字节”。实际执行的是[基类的复制构造语义](../15-copying-class-objects-and-copyability/03-implicit-copy-operations-and-member-semantics.md#复制构造按成员初始化新对象)。如果基类自定义复制构造，结果就由那个接口决定；派生类型仍不会由此成为目的对象的类型。

移动也不能越过这个类型边界。即使初始化选择了基类移动构造，目的对象仍然是基类对象；改变源的值类别不等于改变目的类型。

## 通过基类赋值，只修改相应子对象

复制构造建立新对象，复制赋值修改已有对象。通过基类引用赋值时，左侧原来是派生对象，也不会被替换成一个完整基类对象。

把以下片段放在前面完整程序的 `main` 中：

```cpp
calibrated_sensor target{220, 10};
const pressure_sensor replacement{250};
pressure_sensor& base_target{target};

base_target = replacement;

std::cout << target.read() << '\n'; // 260
```

这里选择 `pressure_sensor` 的默认复制赋值，把 `target` 的基类成员 `stored` 改为 `250`。它没有处理派生类的 `offset`，修正量仍是 `10`，因此读数为 `260`。

完整对象仍然是 `calibrated_sensor`，其虚调用选择也保持不变。**这项基类赋值只操作已有基类子对象，不会改变完整对象的类型。**

本例的同类型派生复制赋值会先对基类子对象赋值，再对自身成员赋值。通过 `base_target` 进行的赋值选择的是基类接口，因此没有执行这项完整的派生复制赋值。

若派生类的不变式要求基类状态与派生状态一起更新，暴露这样的基类赋值入口就可能破坏语义。示例中的结果能够算清楚，并不意味着所有派生类型都适合允许这项局部更新。

## 多态接口应明确允许哪种复制

抽象基类不能创建完整对象，因此直接按抽象基类值传参无法成为可用接口。示例刻意使用可实例化的基类，才展示了这种能够编译、却失去派生行为的切片。

对需要保留实际对象行为的接口，可以作如下选择：

| 目的 | 合适的表达方式 | 必须维持的条件 |
| --- | --- | --- |
| 使用同一个对象 | 基类引用或指针 | 原对象在使用期间有效 |
| 转交同一个动态对象的拥有责任 | `std::unique_ptr<pressure_sensor>` | 公开基类销毁契约成立 |
| 创建一个新的基类值 | 基类复制接口 | 接受结果只具有基类状态和行为 |

`std::vector<pressure_sensor>` 的元素本身就是 `pressure_sensor` 对象。把派生对象插入其中，也不会让某个元素变成完整的派生对象。若需要持有不同的多态对象，`std::vector<std::unique_ptr<pressure_sensor>>` 可以分别保存它们的拥有者；各目标仍然保留自己的实际类型，并遵循虚析构契约。

> [!PRACTICE]
> 多态接口主要用于保留并使用实际对象时，避免把基类按值作为传参、返回或存储边界。如果需要通过基类接口复制完整的实际对象，必须另外设计这项操作；普通基类复制没有表达这个要求。

也可以在基类公开部分删除复制接口，以拒绝当前这种基类值复制。以下声明用于替换示例中两项 `= default` 声明：

```cpp
pressure_sensor(const pressure_sensor&) = delete;
pressure_sensor& operator=(const pressure_sensor&) = delete;
```

这是一项设计选择，并非所有继承都必须采用。删除基类复制还会影响派生类的默认复制，因为它需要复制基类子对象；不能只把它视为调用方一侧的限制。

## 参考资料

- [C++23 工作草案：复制和移动构造](https://timsong-cpp.github.io/cppwp/n4950/class.copy.ctor)
- [C++23 工作草案：复制和移动赋值](https://timsong-cpp.github.io/cppwp/n4950/class.copy.assign)
- [C++23 工作草案：虚函数调用](https://timsong-cpp.github.io/cppwp/n4950/class.virtual)
