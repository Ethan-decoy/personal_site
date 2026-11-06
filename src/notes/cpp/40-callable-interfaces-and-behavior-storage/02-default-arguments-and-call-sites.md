---
title: 默认实参与调用位置（Default Arguments and Call Sites）
date: 2026-10-08
order: 2
---

# 默认实参与调用位置（Default Arguments and Call Sites）

某个接口常用修正量为零，可以允许调用方省略这一实参。默认实参（Default Argument）为缺省调用补出表达式，但它既不是函数体中的局部默认值，也不是函数指针类型的一部分。

## 默认表达式在实际缺省调用时求值

声明 `int adjusted(int value, int offset = 0);` 后，`adjusted(220)` 使用默认表达式，`adjusted(220, 10)` 使用明确实参。

默认实参中名称绑定依据声明位置，表达式则在每次实际使用默认实参的调用中求值。例如以下完整程序：

```cpp
#include <iostream>

using reader = int(int, int);

int current_adjustment{10};

int adjusted(int value, int offset = current_adjustment) {
    return value + offset;
}

int main() {
    std::cout << adjusted(220) << '\n'; // 230
    current_adjustment = 20;
    std::cout << adjusted(220) << '\n'; // 240

    reader* const operation{&adjusted};
    std::cout << operation(220, 0) << '\n'; // 220
}
```

通过函数指针调用必须提供两个实参；`operation(220)` 编译失败。默认实参属于可见声明提供的调用信息，不随函数地址一同保存。

默认实参通常从末尾连续提供；在同一作用域中已有默认实参不能重复定义。多文件接口一般将它放在调用方可见的头文件声明中，定义处不再重复。

## 虚分派不会重新选择默认实参

默认实参由调用位置可见的声明确定，虚函数实现再由实际对象选择。这是完整的对照程序：

```cpp
#include <iostream>

struct pressure_source {
    virtual ~pressure_source() = default;
    virtual int read(int offset = 0) const {
        return 220 + offset;
    }
};

struct calibrated_source : pressure_source {
    int read(int offset = 10) const override {
        return 230 + offset;
    }
};

int main() {
    const calibrated_source value{};
    const pressure_source& source = value;
    std::cout << value.read() << '\n';  // 240
    std::cout << source.read() << '\n'; // 230
}
```

两次都执行派生类实现，所以都以 `230` 为基准。`value.read()` 按派生类声明补入 `10`，得到 `240`；`source.read()` 按基类声明补入 `0`，得到 `230`。若第二次执行的是基类实现，结果会是 `220`；当前的 `230` 因而也显示了虚分派仍然生效。

> [!WARNING]
> 改写覆盖函数的默认实参，不会改写经基类声明调用时使用的默认值。共同接口若要求统一缺省行为，通常在共同声明上维持一项约定，避免不同静态入口给出不同结果。

## 缺省行为仍须有稳定含义

默认值适合常见而明确的选择，不适合掩盖重要策略。修改头文件中的默认实参会改变重新编译的调用方行为；只替换已编译函数的实现不一定改变旧调用方已经传入的数值。

## 参考资料

- [C++23 工作草案：默认实参](https://timsong-cpp.github.io/cppwp/n4950/dcl.fct.default)
