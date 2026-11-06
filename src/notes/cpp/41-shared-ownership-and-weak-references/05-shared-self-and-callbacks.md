---
title: 自身共享责任与回调（Shared Self and Callbacks）
date: 2026-10-08
order: 5
---

# 自身共享责任与回调（Shared Self and Callbacks）

一个由 shared_ptr 管理的对象，有时要把“继续维持我”的入口交给其他组件。仅有 `this` 不包含原所有权组的身份，不能据此再创建一组独立责任。

## shared_from_this加入已经存在的所有权组

`std::enable_shared_from_this<T>` 是 `<memory>` 提供的基类模板。公开且无歧义地继承它，并通过合适的 shared_ptr 创建对象后，`shared_from_this()` 可以取得接入该所有权组的 shared_ptr。

```cpp
#include <iostream>
#include <memory>

class pressure_source : public std::enable_shared_from_this<pressure_source> {
  public:
    std::shared_ptr<pressure_source> share() {
        return shared_from_this();
    }

    int read() const {
        return 220;
    }
};

int main() {
    auto first = std::make_shared<pressure_source>();
    auto second = first->share();
    first.reset();
    std::cout << second->read() << '\n'; // 220
}
```

继承模板不直接拥有对象。创建一个普通局部 `pressure_source` 后调用 share，没有已建立的共享关系，`shared_from_this` 会抛出 `std::bad_weak_ptr`。

普通构造函数执行时，shared_ptr 对对象的这项关联尚未建立，因此也不能在构造函数里假定 `shared_from_this` 可用。

## weak_from_this适合不强制保活的回调

`weak_from_this()` 取得关联到自身的 weak_ptr；尚无关联时得到空弱观察，不抛出 bad_weak_ptr。早先取得的空弱观察不会在之后自动变成一次新的有效查询。

需要保存回调又避免自身拥有环时，可以捕获弱观察，执行时 lock，无法取得时按订阅契约退出。需要保证一次任务运行期间对象存活时，可以在任务开始时取得共享责任并保持到结束。

保留前例的 `pressure_source` 和头文件，将 `main` 替换为下面的过程。回调保存在对象之外，先执行一次，再释放原拥有者，最后再次执行：

```cpp
int main() {
    auto owner = std::make_shared<pressure_source>();
    const auto observed = owner->weak_from_this();
    const auto callback = [observed] {
        const auto source = observed.lock();
        if (!source) {
            std::cout << "source expired\n";
            return;
        }
        std::cout << source->read() << '\n';
    };

    callback();
    owner.reset();
    callback();
}
```

输出 `220`、`source expired`。按保存、执行与释放的阶段检查责任：

- **保存回调时：**捕获的是 `weak_ptr`，没有取得维持对象的强责任；`owner` 仍使对象存活。
- **第一次执行时：**`lock()` 成功，局部 `source` 接入已有所有权组，覆盖本次读取。回调返回后，这一局部强责任结束。
- **原拥有者释放后：**没有其他强拥有者，对象销毁；回调本身仍可以存在。
- **再次执行时：**`lock()` 得到空 `shared_ptr`，回调报告失效并返回，跳过 `read()`。

弱捕获表达“到时仍有效才执行”，并不保证对象一直活到任务开始。若任务必须在原拥有者释放后仍能执行，应在保存任务时取得并捕获强拥有者，同时检查回调的存放位置是否形成拥有环。

> [!PRACTICE]
> 回调需要什么寿命保证，就传递什么关系。强捕获用于维持必要生命周期，弱捕获用于可取消观察；同时检查回调最终保存在哪里，避免自身拥有环。

## 参考资料

- [C++23 工作草案：enable_shared_from_this](https://timsong-cpp.github.io/cppwp/n4950/util.smartptr.enab)
