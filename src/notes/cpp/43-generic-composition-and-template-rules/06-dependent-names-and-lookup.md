---
title: 依赖名称与分阶段查找（Dependent Names and Phased Lookup）
date: 2026-10-08
order: 6
---

# 依赖名称与分阶段查找（Dependent Names and Phased Lookup）

模板中有些名称在定义时就确定，有些随实参类型改变。编译器还要在不知道实际类型时正确解析代码，因此“这是类型”与“这是模板成员”的说明符承担了独立职责。

## 依赖基类需要明确的访问路径

依赖名称（Dependent Name）的含义取决于模板实参。下面的 reader_adapter 继承 Source，但定义模板时还没有选定具体 Source，编译器不能把某一个来源类型的成员都当作当前已经确定的接口。

`this` 指向当前适配器对象。写成 `this->raw()`，就明确通过该对象访问成员；在本例中，这项查找还需要结合实际基类 Source。实例化 reader_adapter<sensor> 时，才可以从 sensor 的接口中找到 raw。直接写没有限定路径的 `raw()`，则会遇到不同的定义阶段查找要求。

`typename T::value_type` 在需要的语境中说明它是类型。`this->template converted<double>()` 中的 template 则说明 converted 是模板，后面的尖括号属于模板实参列表。

```cpp
#include <iostream>

struct sensor {
    using value_type = int;

    int raw() const {
        return 220;
    }

    template <typename T> T converted() const {
        return static_cast<T>(raw());
    }
};

template <typename Source> class reader_adapter : public Source {
  public:
    using result_type = typename Source::value_type;

    result_type read() const {
        return this->raw();
    }

    double as_double() const {
        return this->template converted<double>();
    }
};

int main() {
    const reader_adapter<sensor> value{};
    std::cout << value.read() << ' ' << value.as_double() << '\n'; // 220 220
}
```

这些说明符让语法与查找路径成立；如果 Source 实际没有相应类型或成员，实例化仍会失败。它们不是跳过类型检查的指令。

只把上面 read 的定义替换为下面一项，便得到当前查找问题的错误对照：

```cpp
result_type read() const {
    return raw(); // 错误：当前非依赖查找中没有 raw 的声明
}
```

这个无参调用没有通过 `this` 指定对象，也没有依赖实参提供查找关系。即使调用方后来选择 sensor，定义阶段缺少的普通名称声明也不会自动补上。原来的 `this->raw()` 则保留了经当前对象、结合具体 Source 查找成员的关系。

本例中，`using result_type = typename Source::value_type;` 的右侧已经是明确的类型语境，C++23 允许省去这里的 typename；保留它可以显式表达类型意图。[函数体内声明局部元素](../32-class-templates-and-generic-types/05-type-aliases-and-member-types.md#函数模板通过容器取得元素类型)时，尚未确定为类型的 `Container::value_type` 则需要 typename。`this->template converted<double>()` 中的 template 负责标明随后的尖括号是模板实参列表，this-> 负责提供当前对象的访问路径，两者承担不同任务。

## 定义阶段的声明不能被任意后置声明改写

普通非依赖名称通常在模板定义时绑定，这也解释了上面无限定 raw 调用的失败。[名称查找与模板实例化](../31-function-templates-and-type-deduction/04-instantiation-and-operation-requirements.md#名称查找并非全部推迟到调用处)中的普通调用同样需要在定义处有依据。依赖调用还按相应定义阶段规则和[实参依赖查找](../28-namespaces-and-name-lookup/04-argument-dependent-lookup-and-non-member-interfaces.md#从实参类型找到相关命名空间)规则查找，不是实例化时重新扫描所有后来出现的普通声明。

因此，给泛型操作提供普通可见声明应当在模板定义前完成；类型相关扩展可以利用已成立的 ADL 关系。相同模板在不同翻译单元看到不一致的含义，还可能违反定义一致性要求。

> [!TIP]
> 先判断名称是否依赖实参，再判断解析需要类型说明还是模板说明，最后核对实际查找范围。typename、template 和 this-> 分别解决不同问题，不能互相代替。

并非每个依赖类型位置都要求 typename，例如语法已经明确为类型的部分语境有专门规则。使用时核对当前语境，避免把简化示例推广成“所有 T::name 前面都写 typename”。

## 参考资料

- [C++23 工作草案：依赖名称](https://timsong-cpp.github.io/cppwp/n4950/temp.dep)
- [C++23 工作草案：模板名称解析](https://timsong-cpp.github.io/cppwp/n4950/temp.names)
- [C++23 工作草案：依赖调用的候选查找](https://timsong-cpp.github.io/cppwp/n4950/temp.dep.candidate)
- [C++23 工作草案：类型语境与 typename](https://timsong-cpp.github.io/cppwp/n4950/temp.res.general)
