---
title: 视图拥有关系与有效期（View Ownership and Lifetimes）
date: 2026-10-08
order: 4
---

# 视图拥有关系与有效期（View Ownership and Lifetimes）

视图轻量，并不等于所有视图都只借用；视图存在，也不等于它经过的每一层目标都存活。需要沿完整保存关系判断。

## 左值适配通常借用，临时范围可以被拥有

`std::views::all` 将可适配范围形成视图。对普通左值容器通常形成引用视图；对满足条件的临时容器，C++23 可以形成拥有视图。

```cpp
#include <iostream>
#include <ranges>
#include <vector>

auto make_readings() {
    return std::views::all(std::vector<int>{220, 230});
}

int main() {
    auto owned = make_readings();
    for (int value : owned) {
        std::cout << value << ' ';
    }
    std::cout << '\n'; // 220 230
}
```

临时 vector 移入拥有关系中，函数返回后仍由所得视图维持。不能由此推出“返回任何 views 表达式都安全”。

如果函数先建立局部 vector，再返回对该**左值**的 filter 或 all 视图，视图一般借用局部容器；函数退出后容器销毁，访问就失效。

## 回调也可能借用外部状态

视图即使拥有基础容器，变换 Lambda 若引用捕获局部配置，该配置仍可能先销毁。返回视图要同时检查基础范围、回调捕获和其他嵌套视图的关系。

复制一个引用视图不会复制容器。移动拥有视图也可能影响此前取得的迭代入口，不能只按基础容器某项移动保证判断整条视图链。

> [!WARNING]
> 迭代器可能需要访问视图对象中保存的谓词或变换。源元素还活着，不保证销毁视图之后它的迭代器仍然有效。

## const 视图不统一保证 const 元素

对借用可修改数据的视图加 const，不一定将目标数据变成只读；某些视图还不支持 const 遍历，例如其取得起点需要更新缓存。若接口要求只读元素，应从基础访问类型和适配操作判断。

## 参考资料

- [C++23 工作草案：views::all](https://timsong-cpp.github.io/cppwp/n4950/range.all)
- [C++23 工作草案：ref_view](https://timsong-cpp.github.io/cppwp/n4950/range.ref.view)
- [C++23 工作草案：owning_view](https://timsong-cpp.github.io/cppwp/n4950/range.owning.view)
