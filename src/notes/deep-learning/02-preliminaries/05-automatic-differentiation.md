---
title: 自动微分
date: 2026-11-20
order: 5
---

# 自动微分

训练模型时，先用当前参数算出预测，再用**损失**衡量预测的偏差。算出了损失，**参数往哪边微调，损失会变小？** 这要看损失对参数的梯度。

## 从损失回到参数

设输入固定为 $2$，模型使用一个参数 $w$，预测为 $p=2w$。正确答案是 $3$，用预测与答案的差的平方 $L=(p-3)^2$ 作为损失。图中顺着实线从参数算到损失，沿着虚线从损失往回求导。

<div id="fig-training-autograd" style="max-width: 448px;">
<div data-note-tabs="比较两个参数取值" data-note-tabs-default="w = 1">

<div data-note-tab="w = 1">
<figure class="markdown-illustration" style="margin: 0;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/autograd-training-flow.svg" alt="w 等于 1 时，正向从左往右算出预测 2 和损失 1。反向从右往左算出损失对预测的梯度 −2，再乘 2 得到对 w 的梯度 −4。" width="448" height="208" style="min-width: 0;" />
  </div>
  <figcaption>从右边的损失出发，先求损失对预测的梯度，再求损失对参数的梯度。</figcaption>
</figure>
</div>

<div data-note-tab="w = 1.01">
<figure class="markdown-illustration" style="margin: 0;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/autograd-training-flow.svg#raised-weight" alt="w 调大到 1.01，预测变为 2.02，损失降到 0.9604。反向算出损失对预测的梯度 −1.96，以及对 w 的梯度 −3.92。" width="448" height="208" style="min-width: 0;" />
  </div>
  <figcaption>把参数调大 0.01 后，预测更接近答案 3，损失随之降低。</figcaption>
</figure>
</div>

</div>
</div>

从 $w=1$ 的状态看，预测是 $2$。预测值略微升高时，它会更接近 $3$，损失因此降低。平方求导得到损失对预测的变化率 $2(2-3)=-2$。再往回看一层，$w$ 每增加一点，预测就增加两倍那么多。把这两段变化率相乘，损失对 $w$ 的梯度就是 $-4$。负号说明在当前位置稍微调大 $w$ 会降低损失，切到第二个标签即可核对。

> [!IMPORTANT] 先记录运算依赖，再沿依赖求梯度
>
> 正向计算时，框架会记录参与求导的运算和它们的输入。这些依赖关系组成**计算图（computational graph）**。框架能根据记录自动求梯度，这就是**自动微分（automatic differentiation）**。**反向传播（backpropagation）**从选定的输出往回应用[链式法则](04-calculus.md#链式法则)。沿同一条路径乘上各步的导数，同一个输入经过多条路径影响输出时，把这些路径的贡献相加。

本节在同一个 CPU Notebook 中按顺序运行。选中一个框架后，其他标签组会一起切换。前几个例子沿用创建的 `x`，重做这一套示例时从创建 `x` 开始。

PyTorch 2.10.0 CPU、TensorFlow 2.21.0 和 Paddle 3.3.1 示例使用 Python 3.13。MXNet 示例使用兼容环境 Python 3.7.9、MXNet 1.7.0.post2 和 NumPy 1.16.6。

## 计算与累积梯度

### 从点积算出梯度

取 `x = [0, 1, 2, 3]`，求 $y=2\mathbf{x}^{\top}\mathbf{x}$ 关于 $\mathbf{x}$ 的梯度。把 [点积](03-linear-algebra.md#点积)展开，每个数与自己相乘，再把四个平方相加，最后乘以 $2$。

$$
y = 2(0^2+1^2+2^2+3^2) = 28.
$$

对其中一项 $x_i$ 求偏导时，其余项固定。$2x_i^2$ 求导得到 $4x_i$，例如最后一项的输入是 $3$，对应的偏导数为 $4\times 3=12$。按输入顺序排好，四个偏导数就是 `[0.0, 4.0, 8.0, 12.0]`。

下面先设置要跟踪的浮点输入，再计算 `y`，最后取得梯度。输出中的 `28.0 ()` 表示 `y` 的值为 `28.0`，形状为 `()`，也就是零维张量。梯度有四项，每项对应 `x` 的一个位置。

<div data-note-tabs="二次函数的正向计算与求梯度" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

`attach_grad(grad_req="write")` 把 `x.grad` 初始化为零。每次求导时，框架用本次结果更新 `x.grad`。把正向运算放在 `autograd.record()` 内记录。

```python
from mxnet import autograd, np, npx

npx.set_np()

x = np.arange(4, dtype="float32")
x.attach_grad(grad_req="write")
print(x.grad.asnumpy().tolist())

with autograd.record():
    y = 2 * np.dot(x, x)

print(y.asnumpy().item(), tuple(y.shape))
y.backward()
print(x.grad.asnumpy().tolist())
```

```text
[0.0, 0.0, 0.0, 0.0]
28.0 ()
[0.0, 4.0, 8.0, 12.0]
```

</div>

<div data-note-tab="PyTorch">

`requires_grad_(True)` 在原来的 `x` 上开启梯度记录。此时 `x.grad` 是 `None`。算出 `y` 后，从 `y.backward()` 开始按依赖关系反向计算，结果写入 `x.grad`。

```python
import torch

x = torch.arange(4, dtype=torch.float32)
x.requires_grad_(True)
print(x.grad)

y = 2 * torch.dot(x, x)
print(y.item(), tuple(y.shape))
y.backward()
print(x.grad.tolist())
```

```text
None
28.0 ()
[0.0, 4.0, 8.0, 12.0]
```

</div>

<div data-note-tab="TensorFlow">

`GradientTape` 默认跟踪在其上下文中使用的可训练变量。`tape.gradient(y, x)` 返回梯度张量，代码用 `quadratic_grad` 保存它。

```python
import tensorflow as tf

x = tf.Variable(tf.range(4, dtype=tf.float32))
with tf.GradientTape() as tape:
    y = 2 * tf.tensordot(x, x, axes=1)

print(y.numpy().item(), tuple(y.shape))
quadratic_grad = tape.gradient(y, x)
print(quadratic_grad.numpy().tolist())
```

```text
28.0 ()
[0.0, 4.0, 8.0, 12.0]
```

</div>

<div data-note-tab="Paddle">

将 `stop_gradient` 设为 `False`，让 `x` 参与梯度计算。第一次调用 `backward()` 后，可以从 `x.grad` 取到梯度。

```python
import paddle

x = paddle.arange(4, dtype="float32")
x.stop_gradient = False
print(x.grad)

y = 2 * paddle.dot(x, x)
print(y.item(), tuple(y.shape))
y.backward()
print(x.grad.numpy().tolist())
```

```text
None
28.0 ()
[0.0, 4.0, 8.0, 12.0]
```

</div>

</div>

### 新算一次时怎样处理旧梯度

接着用同一个 `x` 计算 $s=x_1+x_2+x_3+x_4$。任意一项增加 $h$，总和就增加 $h$，所以这次产生的梯度是 `[1.0, 1.0, 1.0, 1.0]`。

> [!IMPORTANT] 累积时，新梯度加到原来的数上
>
> 在 PyTorch 和 Paddle 的例子里，前一段已经把 `[0.0, 4.0, 8.0, 12.0]` 存到了 `x.grad`。直接对新算出的 `s` 反向传播，每一项会再加 $1$，得到 `[1.0, 5.0, 9.0, 13.0]`。要单独读出求和的梯度，先清理已存在的 `x.grad`，再对新算出的 `s` 反向传播。

MXNet 在本例中设置为写入本次梯度。TensorFlow 为每次求导返回一个张量，可以用不同的名称分别接住二次函数的梯度和求和的梯度。

<div data-note-tabs="沿用同一个输入计算新的梯度" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

`x` 使用 `grad_req="write"`。先看原来的二次函数梯度，再看 `s.backward()` 写入的新梯度。

```python
print(x.grad.asnumpy().tolist())

with autograd.record():
    s = x.sum()

s.backward()
print(x.grad.asnumpy().tolist())
```

```text
[0.0, 4.0, 8.0, 12.0]
[1.0, 1.0, 1.0, 1.0]
```

</div>

<div data-note-tab="PyTorch">

第一次保留旧梯度，读出两次的和。接着用 `zero_()` 清零已存在的梯度张量，再为同一个求和重新执行正向和反向运算。

```python
s = x.sum()
s.backward()
print(x.grad.tolist())

x.grad.zero_()
s = x.sum()
s.backward()
print(x.grad.tolist())
```

```text
[1.0, 5.0, 9.0, 13.0]
[1.0, 1.0, 1.0, 1.0]
```

</div>

<div data-note-tab="TensorFlow">

用新的 `GradientTape` 记录 `s`，把本次返回的张量存到 `sum_grad`。两个变量可以分别读取。

```python
with tf.GradientTape() as tape:
    s = tf.reduce_sum(x)

sum_grad = tape.gradient(s, x)
print(quadratic_grad.numpy().tolist())
print(sum_grad.numpy().tolist())
```

```text
[0.0, 4.0, 8.0, 12.0]
[1.0, 1.0, 1.0, 1.0]
```

</div>

<div data-note-tab="Paddle">

默认将新梯度加进 `x.grad`。用 `clear_gradient()` 清理积累值后，再做一次独立求导。

```python
s = paddle.sum(x)
s.backward()
print(x.grad.numpy().tolist())

x.clear_gradient()
s = paddle.sum(x)
s.backward()
print(x.grad.numpy().tolist())
```

```text
[1.0, 5.0, 9.0, 13.0]
[1.0, 1.0, 1.0, 1.0]
```

</div>

</div>

在训练中，梯度供优化器更新参数。需要在哪一次更新前清理梯度，取决于要合并哪些批次的结果。PyTorch 的状态和接口用法可参见[官方教程的梯度累积示例](https://docs.pytorch.org/tutorials/beginner/basics/autogradqs_tutorial.html#optional-reading-tensor-gradients-and-jacobian-products)。

## 非标量输出的反向传播

`y = x * x` 逐项平方，得到 `[0.0, 1.0, 4.0, 9.0]`。沿向量唯一的轴求和，得到标量 `s = 14.0`。这次选定 `s` 作为求导目标。

> [!IMPORTANT] 向量输出先选定求导目标
>
> 对 `s = y.sum()` 求梯度时，先把 `y` 的各项加成标量，再看这个标量随每个输入怎么变化。本例 $s=\sum_i x_i^2$，所以梯度是 $2\mathbf{x}$，有四项。

**雅可比矩阵（Jacobian matrix）**把每项输出对每项输入的偏导数排成一张表。沿用上一节的写法，行对应输入，列对应输出。比如第 2 行第 3 列回答「其余输入固定，只微调第 2 项输入时，第 3 项输出的变化率是多少？」本例有四项输入和四项输出，所以矩阵的形状是 $4\times 4$。

下面先把四项输出相加再求导。得到的四项梯度，相当于把矩阵的四列逐项相加。

<div data-note-tabs="对向量各项之和求梯度" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

在记录范围内求总和，再对总和调用 `backward()`。

```python
with autograd.record():
    y = x * x
    s = y.sum()

s.backward()
print(y.asnumpy().tolist(), s.asnumpy().item())
print(x.grad.asnumpy().tolist())
```

```text
[0.0, 1.0, 4.0, 9.0] 14.0
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="PyTorch">

沿用前面已经有梯度的 `x`，清零以后对 `s` 求导。重新计算一次 `y` 时，也可以用 `y.backward(torch.ones_like(y))` 给每个输出项相同的系数 1，得到同一个求和梯度。

```python
x.grad.zero_()
y = x * x
s = y.sum()
s.backward()

print(y.tolist(), s.item())
print(x.grad.tolist())
```

```text
[0.0, 1.0, 4.0, 9.0] 14.0
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="TensorFlow">

这里把求和写进正向计算。直接把 `y` 交给 `tape.gradient` 时，默认也求输出各项之和的梯度。

```python
with tf.GradientTape() as tape:
    y = x * x
    s = tf.reduce_sum(y)

sum_grad = tape.gradient(s, x)
print(y.numpy().tolist(), s.numpy().item())
print(sum_grad.numpy().tolist())
```

```text
[0.0, 1.0, 4.0, 9.0] 14.0
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="Paddle">

先清理前一段的梯度，再让求和结果 `s` 发起反向传播。

```python
x.clear_gradient()
y = x * x
s = paddle.sum(y)
s.backward()

print(y.numpy().tolist(), s.item())
print(x.grad.numpy().tolist())
```

```text
[0.0, 1.0, 4.0, 9.0] 14.0
[0.0, 2.0, 4.0, 6.0]
```

</div>

</div>

## 分离计算

现在令 `y = x * x`，取出与 `y` 数值相同的 `u`，再算 `z = u * x`。用 `detach()` 或 `stop_gradient()` 得到 `u` 时，正向仍使用平方后的值，反向会在 `y → u` 处停止。

<figure id="fig-detach-path" class="markdown-illustration" style="max-width: 448px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/autograd-detach-path.svg" alt="把 x 等于 2 平方得到 y 等于 4。经由虚线的分离步骤，u 仍为 4。直接传入的 x 等于 2 与 u 相乘得到 z 等于 8。反向求导时，经过分离步骤的路径停止，x 直接进入乘法的路径有效。" width="448" height="220" style="min-width: 0;" />
  </div>
  <figcaption>箭头表示正向的数值依赖。虚线所在的分离步骤保留值 4，并截断沿这条边返回的梯度。</figcaption>
</figure>

把原来 `x` 中的 $2$ 单独拎出来手算。两条路径都保留时，$z=x^3$，代入 $x=2$ 得到 $z=8$，导数是 $3x^2=12$。分离这一步后，正向值仍是 $4\times 2=8$。求导时把 $u=4$ 当作常数，`u * x` 对 `x` 的导数就是 $4$。

对整个向量做同样的计算，求 `z` 各项之和关于 `x` 的梯度，得到 `[0.0, 1.0, 4.0, 9.0]`。随后仍可以选原来的 `y`，对 `y` 各项之和求导，读到 `[0.0, 2.0, 4.0, 6.0]`。

<div data-note-tabs="分离中间值后分别计算两个梯度" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

用 `y.detach()` 得到分离的 `u`。在记录区分别准备两个求和目标。每次反向传播把该次结果写到 `x.grad`。

```python
with autograd.record():
    y = x * x
    u = y.detach()
    z = u * x
    z_total = z.sum()
    y_total = y.sum()

print(z.asnumpy().tolist())
z_total.backward()
print(x.grad.asnumpy().tolist())
y_total.backward()
print(x.grad.asnumpy().tolist())
```

```text
[0.0, 1.0, 8.0, 27.0]
[0.0, 1.0, 4.0, 9.0]
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="PyTorch">

`u` 和 `y` 共享底层存储，在任一张量上原地改值都可能影响另一个。这里的 `u` 用于生成 `z`，原来的 `y` 仍可用作第二次求导的目标。

```python
x.grad.zero_()
y = x * x
u = y.detach()
z = u * x

print(z.tolist())
z.sum().backward()
print(x.grad.tolist())

x.grad.zero_()
y.sum().backward()
print(x.grad.tolist())
```

```text
[0.0, 1.0, 8.0, 27.0]
[0.0, 1.0, 4.0, 9.0]
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="TensorFlow">

用 `tf.stop_gradient(y)` 分离中间值。设置 `persistent=True` 后，一次记录可供两个目标使用。取完两份梯度后，用 `del tape` 释放这段记录。

```python
with tf.GradientTape(persistent=True) as tape:
    y = x * x
    u = tf.stop_gradient(y)
    z = u * x
    z_total = tf.reduce_sum(z)
    y_total = tf.reduce_sum(y)

print(z.numpy().tolist())
print(tape.gradient(z_total, x).numpy().tolist())
print(tape.gradient(y_total, x).numpy().tolist())
del tape
```

```text
[0.0, 1.0, 8.0, 27.0]
[0.0, 1.0, 4.0, 9.0]
[0.0, 2.0, 4.0, 6.0]
```

</div>

<div data-note-tab="Paddle">

用 `y.detach()` 分离中间值。两次求导各自清理梯度，便于比较两份结果。

```python
x.clear_gradient()
y = x * x
u = y.detach()
z = u * x

print(z.numpy().tolist())
paddle.sum(z).backward()
print(x.grad.numpy().tolist())

x.clear_gradient()
paddle.sum(y).backward()
print(x.grad.numpy().tolist())
```

```text
[0.0, 1.0, 8.0, 27.0]
[0.0, 1.0, 4.0, 9.0]
[0.0, 2.0, 4.0, 6.0]
```

</div>

</div>

## Python 控制流里的梯度

循环次数和分支会随输入改变。本例取有限的非零浮点输入。先从 `b = a * 2` 开始，`b` 的范数小于 $1000$ 时继续翻倍。退出循环后，若 `b` 的总和为正，就直接返回 `b`，否则返回 `100 * b`。

固定 `a = 300.0`。第一步得到 $b=600$，小于 $1000$，因此再乘一次 $2$，得到 $1200$。此时已退出循环，而且 `b` 为正，返回值就是 $d=1200$。在 $300$ 附近，按同样的分支执行，$d=4a$，所以梯度为 $4$。

> [!IMPORTANT] 控制流按本次执行的路径记录运算
>
> 自动微分会沿这次实际执行的运算求导。在输入发生小幅变化且依然走同一条路径的区间内，可以根据该路径上的表达式手算梯度。本例先读出 `d` 和梯度，再用 `d / a` 核对系数。

<div data-note-tabs="固定输入后追踪控制流的梯度" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

用 `autograd.record()` 记录实际执行的运算。

```python
def f(a):
    if np.linalg.norm(a) == 0:
        raise ValueError("a 的范数必须大于 0")

    b = a * 2
    while np.linalg.norm(b) < 1000:
        b = b * 2
    if b.sum() > 0:
        return b
    return 100 * b


a = np.array(300.0, dtype="float32")
a.attach_grad()
with autograd.record():
    d = f(a)

d.backward()
print(d.asnumpy().item(), a.grad.asnumpy().item())
print((d / a).asnumpy().item())
```

```text
1200.0 4.0
4.0
```

</div>

<div data-note-tab="PyTorch">

对 `d` 反向传播后，从 `a.grad` 读出新输入 `a` 的梯度。

```python
def f(a):
    if a.norm() == 0:
        raise ValueError("a 的范数必须大于 0")

    b = a * 2
    while b.norm() < 1000:
        b = b * 2
    if b.sum() > 0:
        return b
    return 100 * b


a = torch.tensor(300.0, dtype=torch.float32, requires_grad=True)
d = f(a)
d.backward()
print(d.item(), a.grad.item())
print((d / a).item())
```

```text
1200.0 4.0
4.0
```

</div>

<div data-note-tab="TensorFlow">

在磁带内运行 Python 的循环和分支，让它记录本次走到的运算。

```python
def f(a):
    if tf.norm(a) == 0:
        raise ValueError("a 的范数必须大于 0")

    b = a * 2
    while tf.norm(b) < 1000:
        b = b * 2
    if tf.reduce_sum(b) > 0:
        return b
    return 100 * b


a = tf.Variable(300.0, dtype=tf.float32)
with tf.GradientTape() as tape:
    d = f(a)

a_grad = tape.gradient(d, a)
print(d.numpy().item(), a_grad.numpy().item())
print((d / a).numpy().item())
```

```text
1200.0 4.0
4.0
```

</div>

<div data-note-tab="Paddle">

用一个长度为 1 的张量装入数值 300，最后用 `item()` 读出单个数。

```python
def f(a):
    if paddle.norm(a) == 0:
        raise ValueError("a 的范数必须大于 0")

    b = a * 2
    while paddle.norm(b) < 1000:
        b = b * 2
    if paddle.sum(b) > 0:
        return b
    return 100 * b


a = paddle.to_tensor([300.0], dtype="float32", stop_gradient=False)
d = f(a)
d.backward()
print(d.item(), a.grad.item())
print((d / a).item())
```

```text
1200.0 4.0
4.0
```

</div>

</div>

> [!WARNING] 零输入和分支切换点要单独判断
>
> 范数为零的输入乘以 $2$ 后范数仍为零，所以例子先检查这一条件并报出输入错误。$a=250$ 恰好位于分界，程序执行 $d=4a$ 的路径，得到 $1000$ 和路径上的梯度 $4$。从略小于 $250$ 的一侧靠近时，会多乘一次 $2$，此时 $d$ 趋近 $2000$。函数在这个分界处发生跳变，因此不可导。

## 小结

- **正向计算记录依赖，反向传播计算梯度。** 对单个标量输出，梯度的各项对应输入的位置。
- **查看梯度的存放方式。** PyTorch 和 Paddle 可从 `x.grad` 读累积结果。MXNet 本例写入本次梯度，TensorFlow 通过调用返回结果。
- **向量输出先确定求导目标。** 对各项之和求梯度适用于本节的向量示例。分离中间值可以截断指定路径上的梯度。
- **控制流决定本次记录的运算。** 分界处的可导性需要根据相邻分支判断。

## 练习

代码用 PyTorch 举例。最后一道绘图题需要 Matplotlib。涉及两次运行的题目从各自给出的初始状态开始。

1. 以 $y=x^3$ 为例，求二阶导数时需要比求一阶导数多保留什么？

   > [!ANSWER]
   >
   > 在 $x=3$ 时，一阶导数是 $3x^2=27$。继续求导需要保留 $3x^2$ 随 $x$ 变化的计算关系，才能得到二阶导数 $6x=18$。
   >
   > 在 PyTorch 中，`torch.autograd.grad(y, x, create_graph=True)` 会为这次梯度计算建立可继续求导的图。二阶求导多了这部分记录和后续计算，具体开销取决于函数和框架实现。

1. 在新的 PyTorch 会话中，运行二次函数的第一个示例。对同一次正向计算得到的 `y` 再调用 `y.backward()`，随后比较重新计算一次 `y` 的情形。

   > [!ANSWER]
   >
   > 对同一个 `y` 再调用 `backward()` 时，这个点积例子会抛出 `RuntimeError`。第一次反向传播已经释放了二次函数再次求导需要的中间数据。
   >
   > 要另算一次相同的梯度，可以清理旧值，重新执行点积，再从新的 `y` 发起反向传播。
   >
   > ```python
   > x.grad = None
   > y = 2 * torch.dot(x, x)
   > y.backward()
   > print(x.grad.tolist())
   > ```
   >
   > 输出为 `[0.0, 4.0, 8.0, 12.0]`。

1. 将控制流例子中的 `a` 改为向量或矩阵。选取一个非零的例子，写出用来求导的标量目标，再预测梯度形状。

   > [!ANSWER]
   >
   > 运行过正文的 PyTorch 函数 `f` 后，可以给它一个 $2\times 2$ 的矩阵。下面的输入仍然走两次乘 $2$ 的正分支，返回值的每项都是对应输入的四倍。对这些输出求和后再求梯度，每个输入位置都得到 $4$，梯度形状为 $(2,2)$。
   >
   > ```python
   > a = torch.tensor([[300.0, 0.0], [0.0, 100.0]], requires_grad=True)
   > d = f(a)
   > d.sum().backward()
   > print(a.grad.tolist())
   > ```
   >
   > 输出为 `[[4.0, 4.0], [4.0, 4.0]]`。矩阵中含有零项时，逐项计算 `d / a` 会出现除以零，因此这里直接用选中分支的乘数核对梯度。

1. 重新设计一个含控制流的求导例子。给两个输入各走一条分支，手算后与框架结果对照。

   > [!ANSWER]
   >
   > 对正数返回 $3a$，其导数是 $3$。对负数返回 $a^2$，其导数是 $2a$，所以在 $a=-2$ 处是 $-4$。
   >
   > ```python
   > import torch
   >
   >
   > def g(a):
   >     if a > 0:
   >         return 3 * a
   >     return a**2
   >
   >
   > for value in (2.0, -2.0):
   >     a = torch.tensor(value, requires_grad=True)
   >     g(a).backward()
   >     print(value, a.grad.item())
   > ```
   >
   > 两次分别输出 `2.0 3.0` 和 `-2.0 -4.0`。在 $a=0$ 处，左侧斜率趋近于 $0$，右侧斜率为 $3$，需要单独判断这个分界。

1. 绘制 $f(x)=\sin(x)$ 和它的导数图像，用自动微分得到导数值。

   > [!ANSWER]
   >
   > 先在 $[-2\pi,2\pi]$ 取一组横坐标。每项 `y[i]` 只依赖同一位置的 `x[i]`，因此对 `y.sum()` 求梯度，`x.grad` 每一项就是那个位置的导数。把两组纵坐标画在同一组横坐标上即可。
   >
   > ```python
   > import matplotlib.pyplot as plt
   > import torch
   >
   > x = torch.linspace(-2 * torch.pi, 2 * torch.pi, 201, requires_grad=True)
   > y = torch.sin(x)
   > y.sum().backward()
   >
   > x_values = x.detach().tolist()
   > _, ax = plt.subplots()
   > ax.plot(x_values, y.detach().tolist(), label="sin(x)")
   > ax.plot(x_values, x.grad.tolist(), "--", label="derivative")
   > ax.set_xlabel("x")
   > ax.legend()
   > plt.show()
   > ```
