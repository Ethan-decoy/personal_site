---
title: 用户定义转换与重载决议（User-Defined Conversions and Overload Resolution）
date: 2026-09-01
order: 4
---

# 用户定义转换与重载决议（User-Defined Conversions and Overload Resolution）

重载决议会为每个实参建立初始化相应形参所需的隐式转换序列。内建类型之间的路径可以只包含标准转换；类提供隐式转换入口后，实参到形参的路径还可能属于用户定义转换序列（user-defined conversion sequence）。

当多项函数都成为候选时，需要比较不同形式的转换序列怎样影响最佳可行函数。

下面两个类分别开放从 `int` 和 `double` 建立对象的转换入口：

```cpp
class pressure_kpa {
  public:
    pressure_kpa(int value_kpa);
};

class pressure_bar {
  public:
    pressure_bar(double value_bar);
};
```

两项构造函数都没有声明为 `explicit`，因而可以在允许的语境中提供隐式用户定义转换。

## 标准转换序列先胜过用户定义转换序列

以下重载分别接收一个内建类型和一个类类型：

```cpp
int classify_pressure(double value_kpa);
int classify_pressure(pressure_kpa pressure);

const int category{classify_pressure(260)};
```

两项重载都可行，但实参到形参的路径属于不同形式：

| 候选函数 | `int` 实参到形参的路径 | 序列形式 |
| --- | --- | --- |
| `classify_pressure(double)` | `int` 转换为 `double` | 标准转换序列 |
| `classify_pressure(pressure_kpa)` | 调用 `pressure_kpa(int)` | 用户定义转换序列 |

`int` 到 `double` 在标准转换序列内部只有 Conversion 等级，但整条路径仍然只使用标准转换。另一条路径必须调用类的构造函数，因此属于用户定义转换序列。比较这两种基本形式时，标准转换序列更好，所以调用选择 `classify_pressure(double)`。

**Exact Match、Promotion 与 Conversion 用于标准转换序列内部的等级判断，不能把一条用户定义转换序列重新归入这些等级。**先比较序列形式，再在相应规则允许的范围内比较更细的转换质量。

## 不同的用户定义转换可能彼此无法排序

把重载集改为两个类类型目标后，两条候选路径都会使用类的转换接口：

```cpp
int classify_pressure(pressure_kpa pressure);
int classify_pressure(pressure_bar pressure);

const int category{classify_pressure(220)}; // 错误：调用存在歧义
```

第一项候选可以直接把 `220` 传给 `pressure_kpa(int)`。第二项候选会先把 `int` 转换为 `double`，再调用 `pressure_bar(double)`。两项候选最终都需要一次用户定义转换，因此都可行。

第一条路径在进入构造函数前看起来更直接，却不能因此胜出：两条序列分别调用不同的构造函数，标准规则没有把构造函数前的局部差异变成这两条用户定义转换序列之间的普遍排序依据。当前不存在唯一最佳函数，所以调用不合法。

函数名称、单位在项目中的常用程度，以及构造函数体执行多少工作，都不参与这项排序。重载决议依据声明所形成的类型关系，而不是依据运行时数值或业务偏好猜测意图。

调用者明确构造目标类型，可以同时表达单位选择并消除歧义：

```cpp
const int kpa_category{classify_pressure(pressure_kpa{220})};
const int bar_category{classify_pressure(pressure_bar{2.2})};
```

第一条调用的实参已经是 `pressure_kpa`，第二条调用的实参已经是 `pressure_bar`。相应重载获得精确匹配；当前接口又没有在两个类类型之间提供转换，因此另一项重载不可行。

若两个构造函数都声明为 `explicit`，裸整数调用不会变得更容易排序，而是让两项候选都无法通过隐式用户定义转换接收 `220`。上面明确构造实参的两条调用仍然成立。

## 构造函数与转换函数并非总会同时竞争

当源类型和目标类型都是类时，同一转换方向可能有两个声明位置：目标类可以提供接收源类型的构造函数，源类也可以提供产生目标类型的转换函数。初始化语境决定两者是否进入同一次候选选择：

```cpp
class pressure_pa;

class pressure_kpa {
  public:
    pressure_kpa(const pressure_pa& source_pressure);
};

class pressure_pa {
  public:
    operator pressure_kpa() const;
};

void record_pressure(const pressure_pa& source_pressure) {
    const pressure_kpa direct_pressure{source_pressure}; // 选择目标类构造函数
    const pressure_kpa copied_pressure = source_pressure; // 错误：两条路径歧义
}
```

直接列表初始化 `direct_pressure` 时，程序只在 `pressure_kpa` 的构造函数中进行选择，源类的转换函数不会与它们一同参与。复制初始化 `copied_pressure` 时，构造函数与转换函数都能提供所需转换；两条序列采用不同的用户定义转换，因而无法确定唯一选择。

两端都能声明转换能力，不代表它们会在所有初始化语境中同时成为候选。

## 转换入口属于整个重载接口

新增一条隐式转换路径，可能使原本不可行的候选成为可行函数，也可能让原本唯一的调用变成歧义。删除这条路径或把相应接口改为 `explicit`，同样会改变哪些候选可行。因此，隐式转换不是某个构造表达式的局部便利，而是类型公开给所有相关重载的接口能力。

一条用户定义转换序列也不能任意串联转换。[用户定义转换序列与重载排序](deep-dives/01-user-defined-conversion-sequences-and-overload-ranking.md)进一步拆解它的组成、数量限制和内部排序边界。

**标准转换序列优于用户定义转换序列；两条路径采用不同的用户定义转换时，不能仅凭其中一段标准转换看起来更短就判定胜负。初始化语境还会改变构造函数与转换函数是否同时参与选择，因此每一条隐式转换入口都会影响整个重载接口。**

## 参考资料

- [C++23 工作草案：隐式转换序列](https://timsong-cpp.github.io/cppwp/n4950/over.best.ics)
- [C++23 工作草案：最佳可行函数](https://timsong-cpp.github.io/cppwp/n4950/over.match.best.general)
- [C++23 工作草案：隐式转换序列的排序](https://timsong-cpp.github.io/cppwp/n4950/over.ics.rank)
