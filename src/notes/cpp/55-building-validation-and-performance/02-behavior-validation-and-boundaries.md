---
title: 行为验证与边界输入（Behavior Validation and Boundary Inputs）
date: 2026-10-08
order: 2
---

# 行为验证与边界输入（Behavior Validation and Boundary Inputs）

编译器检查形式，自动验证检查具体契约。验证应围绕调用方所依赖的行为，而不是按实现每一条语句再写一个相同分支。

## 检查成功状态与值的含义

下面完整程序验证“0–500 是合法压力，边界之外返回错误，成功零值不能误判为空”。

```cpp
#include <expected>
#include <iostream>

enum class pressure_error { out_of_range };

std::expected<int, pressure_error> accept(int value) {
    if (value < 0 || value > 500) {
        return std::unexpected{pressure_error::out_of_range};
    }
    return value;
}

int main() {
    const auto zero = accept(0);
    const auto upper = accept(500);
    const auto below = accept(-1);
    const auto above = accept(501);

    if (!zero || *zero != 0 || !upper || *upper != 500 || below || above ||
        below.error() != pressure_error::out_of_range ||
        above.error() != pressure_error::out_of_range) {
        std::cerr << "pressure contract failed\n";
        return 1;
    }
    std::cout << "passed\n";
}
```

短路判断保证只有失败状态才访问 error，只有成功状态才读取值。检查不依赖 assert，因此不会被 NDEBUG 关闭。

## 接口验证还覆盖失败后的状态

资源类型应验证责任是否恰好结束，借用是否按声明有效，失败是否留下已承诺的状态。并发验证还要检查结束关系与协议，而不只检查最终一个数值。

负向编译用例适合确认禁止的接口确实不可用；未定义行为不能靠一次运行输出当作正向证明。

> [!IMPORTANT]
> 样例通过说明被检查条件成立，不证明全部输入正确。验证与模型推演互相补充，边界选择来自接口要求，而不是为了增加用例数量。

## 参考资料

- [C++23 工作草案：expected 访问前提](https://timsong-cpp.github.io/cppwp/n4950/expected.object.obs)
