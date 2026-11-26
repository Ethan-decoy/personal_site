---
title: 线性代数
date: 2026-11-20
order: 3
---

# 线性代数

[数据预处理](02-data-preprocessing.md#转换为张量格式)把四套房屋的特征整理成了一个形状为 `(4, 3)` 的矩阵。行对应样本，列对应特征。

本节先从一个数讲起，再读向量、矩阵和高阶张量。学会读形状后，就能在运行代码之前判断哪些值会参与运算、结果会有几条轴。

在同一个 Notebook 中选定一个框架，从上到下执行该框架的代码。后面的例子会继续用前面创建的 `x`、`A` 和 `X`。MXNet 标签沿用原书的接口，需要与所用版本兼容的 Python 和 NumPy 环境。

## 对象与形状

代码中用**张量（tensor）**组织数值。**轴（axis）**是可以独立改变索引的一个方向。以房价矩阵为例，改变轴 0 的索引会换到另一套房，改变轴 1 的索引会换到另一项特征。

> [!IMPORTANT] 形状的每一项给出一条轴的长度
>
> 形状 `(4, 3)` 有两项，所以张量有两条轴。轴 0 长度为 4，轴 1 长度为 3。**数形状有几项，可以知道轴数。读每一项的值，可以知道相应轴有多长。**

正文用元组写形状。各框架在输出中可能用不同的形式显示同一个形状。

### 标量

**标量（scalar）就是一个单独的数值。** 华氏温度的读数 52、年龄 20、价格 99.9 都是标量。用 $c=\frac{5}{9}(f-32)$ 换算温度时，输入 $f$、输出 $c$ 以及式中的常数也都是单个数。

#### 实数的记号

本书用普通小写字母表示标量。写成 $x\in\mathbb{R}$ 时，可以把三个符号分开读。

- $x$ 是我们讨论的数值变量。
- $\in$ 表示「属于」。
- $\mathbb{R}$ 是实数集合。

所以 $x=3$、$x=2.5$ 或 $x=-7$ 都符合 $x\in\mathbb{R}$ 的说明。

#### 用零维张量表示标量

把一个数直接传给张量构造函数，可以得到一个**零维张量**。这个张量存有一个值，形状记为 `()`，轴数为 0。下面用两个这样的张量做运算，再从输出中读出形状和数值。

<div data-note-tabs="创建零维标量并运算" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
from mxnet import np, npx

npx.set_np()

s = np.array(3.0)
t = np.array(2.0)
s.shape, s + t, s * t, s / t, s ** t
```

```text
((), array(5.), array(6.), array(1.5), array(9.))
```

</div>

<div data-note-tab="PyTorch">

```python
import torch

s = torch.tensor(3.0)
t = torch.tensor(2.0)
s.shape, s + t, s * t, s / t, s ** t
```

```text
(torch.Size([]), tensor(5.), tensor(6.), tensor(1.5000), tensor(9.))
```

1. `torch.tensor(3.0)` 和 `torch.tensor(2.0)` 各接收一个数。`s` 和 `t` 分别存着 3.0 和 2.0。
1. `s.shape` 得到 `torch.Size([])`。方括号里有零项轴长，所以 `s` 有零条轴。
1. 最后一行依次做加法、乘法、除法和乘方。`s ** t` 就是 $3^2$。四个结果依次为 5、6、1.5 和 9，`tensor(5.)` 这样的写法表示结果仍是零维张量。

**元素个数相同的张量可以有不同形状。** 把 `3.0` 放进一层列表，会增加一条长度为 1 的轴。

| 创建方式 | 形状 `.shape` | 轴数 `.ndim` | 元素个数 `.numel()` |
| --- | --- | ---: | ---: |
| `torch.tensor(3.0)` | `torch.Size([])` | 0 | 1 |
| `torch.tensor([3.0])` | `torch.Size([1])` | 1 | 1 |

要区分这三项，可以用 `shape` 读各轴的长度，用 `ndim` 查轴数，用 `numel()` 查元素个数。

</div>

<div data-note-tab="TensorFlow">

```python
import tensorflow as tf

s = tf.constant(3.0)
t = tf.constant(2.0)
s.shape, s + t, s * t, s / t, s ** t
```

```text
(TensorShape([]),
 <tf.Tensor: shape=(), dtype=float32, numpy=5.0>,
 <tf.Tensor: shape=(), dtype=float32, numpy=6.0>,
 <tf.Tensor: shape=(), dtype=float32, numpy=1.5>,
 <tf.Tensor: shape=(), dtype=float32, numpy=9.0>)
```

</div>

<div data-note-tab="Paddle">

```python
import paddle

s = paddle.to_tensor(3.0)
t = paddle.to_tensor(2.0)
s.shape, s + t, s * t, s / t, s ** t
```

```text
(paddle.Size([]),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        5.),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        6.),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        1.50000000),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        9.))
```

</div>

</div>

### 向量

**向量（vector）**由一组有顺序的标量组成，每个值称为一个**分量（component）**。例如，一套房屋的三个输入特征可放进一个向量。用粗体小写字母表示向量 $\mathbf{x}$，用 $x_i$ 表示其中的第 $i$ 个分量。

前面的 $x\in\mathbb{R}$ 指一个实数。写成 $\mathbf{x}\in\mathbb{R}^n$ 时，$n$ 指向量由 $n$ 个实数分量组成。本书在数学推导中默认把这 $n$ 项竖着写成列向量。

<div id="equation-eq-vec-def" role="region" aria-label="公式 2.3.1" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{x} =\begin{bmatrix}x_{1}  \\x_{2}  \\ \vdots  \\x_{n}\end{bmatrix},
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.1)</span>
</div>
</div>

代码中的 `x` 依次存放这 $n$ 个值，形状是 `(n,)`。这里只给出一个轴长。若要把同一组数排成有 $n$ 行、1 列的矩阵，形状就写成 `(n, 1)`，此时有两条轴。

下面用 `[0, 1, 2, 3]` 检查索引和形状。数学记号 $x_1$ 指第一项，代码用 `x[0]` 取第一项，因此 `x[3]` 会取到第四项，也就是 3。`len(x)` 读第一条轴的长度，结果是 4。`x.shape` 列出所有轴长，结果对应 `(4,)`。

<div data-note-tabs="向量的索引、长度和形状" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
x = np.arange(4, dtype="float32")
x, x[3], len(x), x.shape
```

```text
(array([0., 1., 2., 3.]), array(3.), 4, (4,))
```

</div>

<div data-note-tab="PyTorch">

```python
x = torch.arange(4, dtype=torch.float32)
x, x[3], len(x), x.shape
```

```text
(tensor([0., 1., 2., 3.]), tensor(3.), 4, torch.Size([4]))
```

`torch.arange(4, dtype=torch.float32)` 从 0 开始生成到 4 之前的数。`dtype=torch.float32` 指定用浮点数存放这些值，后面的点积和矩阵乘法会沿用这个向量。

</div>

<div data-note-tab="TensorFlow">

```python
x = tf.range(4, dtype=tf.float32)
x, x[3], len(x), x.shape
```

```text
(<tf.Tensor: shape=(4,), dtype=float32, numpy=array([0., 1., 2., 3.], dtype=float32)>,
 <tf.Tensor: shape=(), dtype=float32, numpy=3.0>,
 4,
 TensorShape([4]))
```

</div>

<div data-note-tab="Paddle">

```python
x = paddle.arange(4, dtype="float32")
x, x[3], len(x), x.shape
```

```text
(Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [0., 1., 2., 3.]),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        3.),
 4,
 paddle.Size([4]))
```

</div>

</div>

### 矩阵

**矩阵（matrix）**在代码中对应有两条轴的张量。用粗体大写字母表示矩阵，$\mathbf{A}\in\mathbb{R}^{m\times n}$ 表示它有 $m$ 行、$n$ 列。$a_{ij}$ 表示第 $i$ 行、第 $j$ 列的标量，也可以写作 $[\mathbf{A}]_{ij}$。

<div id="equation-eq-matrix-def" role="region" aria-label="公式 2.3.2" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}=\begin{bmatrix} a_{11} & a_{12} & \cdots & a_{1n} \\ a_{21} & a_{22} & \cdots & a_{2n} \\ \vdots & \vdots & \ddots & \vdots \\ a_{m1} & a_{m2} & \cdots & a_{mn} \\ \end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.2)</span>
</div>
</div>

在 `A[行索引, 列索引]` 中，第一个索引沿轴 0 选行，第二个索引沿轴 1 选列。代码的索引从 0 开始，因此数学中的 $a_{23}$ 是第二行、第三列，在代码里写成 `A[1, 2]`。

行数和列数相等的矩阵叫**方阵（square matrix）**。

#### 转置与对称矩阵

**转置（transpose）**交换行和列。如果 $\mathbf{B}=\mathbf{A}^{\top}$，就有 $b_{ij}=a_{ji}$，形状也从 $(m,n)$ 变为 $(n,m)$。把原矩阵中的列依次排成行，可得到下式。

<div id="equation-chapter-preliminaries-linear-algebra-0" role="region" aria-label="公式 2.3.3" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}^\top =
\begin{bmatrix}
    a_{11} & a_{21} & \dots  & a_{m1} \\
    a_{12} & a_{22} & \dots  & a_{m2} \\
    \vdots & \vdots & \ddots  & \vdots \\
    a_{1n} & a_{2n} & \dots  & a_{mn}
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.3)</span>
</div>
</div>

下面把 0 到 19 按每行 4 个值排成 `A`，形状是 `(5, 4)`。第二行是 `[4, 5, 6, 7]`，所以 `A[1, 2]` 取到 6。转置后，6 移到第三行、第二列，原来的第一列 `[0, 4, 8, 12, 16]` 则成为第一行。输出的形状是 `(4, 5)`。

<div data-note-tabs="创建矩阵并转置" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A = np.arange(20, dtype="float32").reshape(5, 4)
A, A.T
```

```text
(array([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.],
        [12., 13., 14., 15.],
        [16., 17., 18., 19.]]),
 array([[ 0.,  4.,  8., 12., 16.],
        [ 1.,  5.,  9., 13., 17.],
        [ 2.,  6., 10., 14., 18.],
        [ 3.,  7., 11., 15., 19.]]))
```

</div>

<div data-note-tab="PyTorch">

```python
A = torch.arange(20, dtype=torch.float32).reshape(5, 4)
A, A.T
```

```text
(tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [12., 13., 14., 15.],
         [16., 17., 18., 19.]]),
 tensor([[ 0.,  4.,  8., 12., 16.],
         [ 1.,  5.,  9., 13., 17.],
         [ 2.,  6., 10., 14., 18.],
         [ 3.,  7., 11., 15., 19.]]))
```

`torch.arange(20, dtype=torch.float32)` 先生成一维数据，`reshape(5, 4)` 再按 5 行、4 列解释这 20 项。最后一行的两个输出依次是 `A` 和它的转置 `A.T`。

</div>

<div data-note-tab="TensorFlow">

```python
A = tf.reshape(tf.range(20, dtype=tf.float32), (5, 4))
A, tf.transpose(A)
```

```text
(<tf.Tensor: shape=(5, 4), dtype=float32, numpy=
 array([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.],
        [12., 13., 14., 15.],
        [16., 17., 18., 19.]], dtype=float32)>,
 <tf.Tensor: shape=(4, 5), dtype=float32, numpy=
 array([[ 0.,  4.,  8., 12., 16.],
        [ 1.,  5.,  9., 13., 17.],
        [ 2.,  6., 10., 14., 18.],
        [ 3.,  7., 11., 15., 19.]], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
A = paddle.arange(20, dtype="float32").reshape((5, 4))
A, paddle.transpose(A, perm=[1, 0])
```

```text
(Tensor(shape=[5, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0. , 1. , 2. , 3. ],
         [4. , 5. , 6. , 7. ],
         [8. , 9. , 10., 11.],
         [12., 13., 14., 15.],
         [16., 17., 18., 19.]]),
 Tensor(shape=[4, 5], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0. , 4. , 8. , 12., 16.],
         [1. , 5. , 9. , 13., 17.],
         [2. , 6. , 10., 14., 18.],
         [3. , 7. , 11., 15., 19.]]))
```

</div>

</div>

**对称矩阵（symmetric matrix）**是满足 $\mathbf{S}=\mathbf{S}^{\top}$ 的方阵。它的每一对对称位置都相等。例如，下面的 `S[0, 1]` 和 `S[1, 0]` 都是 2。

示例将 `S` 与转置后的矩阵逐项比较。第二个输出是一个形状仍为 `(3, 3)` 的布尔张量，其中九项都是 `True`。

<div data-note-tabs="构造并比较对称矩阵" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
S = np.array([[1, 2, 3], [2, 0, 4], [3, 4, 5]])
S, S == S.T
```

```text
(array([[1., 2., 3.],
        [2., 0., 4.],
        [3., 4., 5.]]),
 array([[ True,  True,  True],
        [ True,  True,  True],
        [ True,  True,  True]]))
```

</div>

<div data-note-tab="PyTorch">

```python
S = torch.tensor([[1, 2, 3], [2, 0, 4], [3, 4, 5]])
S, S == S.T
```

```text
(tensor([[1, 2, 3],
         [2, 0, 4],
         [3, 4, 5]]),
 tensor([[True, True, True],
         [True, True, True],
         [True, True, True]]))
```

</div>

<div data-note-tab="TensorFlow">

```python
S = tf.constant([[1, 2, 3], [2, 0, 4], [3, 4, 5]])
S, S == tf.transpose(S)
```

```text
(<tf.Tensor: shape=(3, 3), dtype=int32, numpy=
 array([[1, 2, 3],
        [2, 0, 4],
        [3, 4, 5]], dtype=int32)>,
 <tf.Tensor: shape=(3, 3), dtype=bool, numpy=
 array([[ True,  True,  True],
        [ True,  True,  True],
        [ True,  True,  True]])>)
```

</div>

<div data-note-tab="Paddle">

```python
S = paddle.to_tensor([[1, 2, 3], [2, 0, 4], [3, 4, 5]])
S, S == paddle.transpose(S, perm=[1, 0])
```

```text
(Tensor(shape=[3, 3], dtype=int64, place=Place(cpu), stop_gradient=True,
        [[1, 2, 3],
         [2, 0, 4],
         [3, 4, 5]]),
 Tensor(shape=[3, 3], dtype=bool, place=Place(cpu), stop_gradient=True,
        [[True, True, True],
         [True, True, True],
         [True, True, True]]))
```

</div>

</div>

### 张量

张量可以有多条轴。标量、向量和矩阵分别对应零阶、一阶和二阶张量。一张 RGB 图像可以沿高度、宽度和颜色通道这三条轴来组织像素值。三阶张量可记作 $\mathsf{X}$，$x_{ijk}$ 指由三个索引共同确定的值。

下面把 0 到 23 排成形状为 `(2, 3, 4)` 的 `X`。读代码输出时，可以从外到内逐层选取。

- `X[1]` 选第二组，留下一个 `(3, 4)` 的矩阵。
- `X[1, 0]` 再选这组的第一行，得到 `[12, 13, 14, 15]`。
- `X[1, 0, 2]` 取这一行的第三项，得到值为 14 的标量。

<div data-note-tabs="创建形状为 2 × 3 × 4 的张量" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X = np.arange(24).reshape(2, 3, 4)
X
```

```text
array([[[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.]],

       [[12., 13., 14., 15.],
        [16., 17., 18., 19.],
        [20., 21., 22., 23.]]])
```

</div>

<div data-note-tab="PyTorch">

```python
X = torch.arange(24).reshape(2, 3, 4)
X
```

```text
tensor([[[ 0,  1,  2,  3],
         [ 4,  5,  6,  7],
         [ 8,  9, 10, 11]],

        [[12, 13, 14, 15],
         [16, 17, 18, 19],
         [20, 21, 22, 23]]])
```

</div>

<div data-note-tab="TensorFlow">

```python
X = tf.reshape(tf.range(24), (2, 3, 4))
X
```

```text
<tf.Tensor: shape=(2, 3, 4), dtype=int32, numpy=
array([[[ 0,  1,  2,  3],
        [ 4,  5,  6,  7],
        [ 8,  9, 10, 11]],

       [[12, 13, 14, 15],
        [16, 17, 18, 19],
        [20, 21, 22, 23]]], dtype=int32)>
```

</div>

<div data-note-tab="Paddle">

```python
X = paddle.arange(24).reshape((2, 3, 4))
X
```

```text
Tensor(shape=[2, 3, 4], dtype=int64, place=Place(cpu), stop_gradient=True,
       [[[0 , 1 , 2 , 3 ],
         [4 , 5 , 6 , 7 ],
         [8 , 9 , 10, 11]],

        [[12, 13, 14, 15],
         [16, 17, 18, 19],
         [20, 21, 22, 23]]])
```

</div>

</div>

## 逐元素运算与按轴归约

### 逐元素运算

逐元素的一元运算独立处理每个位置。两个输入形状相同时，逐元素的二元运算在相同位置计算，输出保留原形状。对两个同形矩阵，逐元素乘法称为 **Hadamard 积（Hadamard product）**，用 $\odot$ 表示。

沿用 [(2.3.2)](#equation-eq-matrix-def) 的 $\mathbf A$。若 $\mathbf B\in\mathbb{R}^{m\times n}$，每项结果就是 $a_{ij}b_{ij}$。

<div id="equation-chapter-preliminaries-linear-algebra-1" role="region" aria-label="公式 2.3.4" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A} \odot \mathbf{B} =
\begin{bmatrix}
    a_{11}  b_{11} & a_{12}  b_{12} & \dots  & a_{1n}  b_{1n} \\
    a_{21}  b_{21} & a_{22}  b_{22} & \dots  & a_{2n}  b_{2n} \\
    \vdots & \vdots & \ddots & \vdots \\
    a_{m1}  b_{m1} & a_{m2}  b_{m2} & \dots  & a_{mn}  b_{mn}
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.4)</span>
</div>
</div>

取同一个矩阵作为两个输入，先只看第二行、第三列。`A[1, 2]` 是 6，所以 `A + A` 在这个位置算出 $6+6=12$，`A * A` 在这个位置算出 $6\times6=36$。其他位置按同样的方式各自计算，两个结果都保留 `(5, 4)` 的形状。

<div data-note-tabs="矩阵逐元素相加与相乘" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A + A, A * A
```

```text
(array([[ 0.,  2.,  4.,  6.],
        [ 8., 10., 12., 14.],
        [16., 18., 20., 22.],
        [24., 26., 28., 30.],
        [32., 34., 36., 38.]]),
 array([[  0.,   1.,   4.,   9.],
        [ 16.,  25.,  36.,  49.],
        [ 64.,  81., 100., 121.],
        [144., 169., 196., 225.],
        [256., 289., 324., 361.]]))
```

</div>

<div data-note-tab="PyTorch">

```python
A + A, A * A
```

```text
(tensor([[ 0.,  2.,  4.,  6.],
         [ 8., 10., 12., 14.],
         [16., 18., 20., 22.],
         [24., 26., 28., 30.],
         [32., 34., 36., 38.]]),
 tensor([[  0.,   1.,   4.,   9.],
         [ 16.,  25.,  36.,  49.],
         [ 64.,  81., 100., 121.],
         [144., 169., 196., 225.],
         [256., 289., 324., 361.]]))
```

</div>

<div data-note-tab="TensorFlow">

```python
A + A, A * A
```

```text
(<tf.Tensor: shape=(5, 4), dtype=float32, numpy=
 array([[ 0.,  2.,  4.,  6.],
        [ 8., 10., 12., 14.],
        [16., 18., 20., 22.],
        [24., 26., 28., 30.],
        [32., 34., 36., 38.]], dtype=float32)>,
 <tf.Tensor: shape=(5, 4), dtype=float32, numpy=
 array([[  0.,   1.,   4.,   9.],
        [ 16.,  25.,  36.,  49.],
        [ 64.,  81., 100., 121.],
        [144., 169., 196., 225.],
        [256., 289., 324., 361.]], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
A + A, A * A
```

```text
(Tensor(shape=[5, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0. , 2. , 4. , 6. ],
         [8. , 10., 12., 14.],
         [16., 18., 20., 22.],
         [24., 26., 28., 30.],
         [32., 34., 36., 38.]]),
 Tensor(shape=[5, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0.  , 1.  , 4.  , 9.  ],
         [16. , 25. , 36. , 49. ],
         [64. , 81. , 100., 121.],
         [144., 169., 196., 225.],
         [256., 289., 324., 361.]]))
```

</div>

</div>

张量与标量相加或相乘时，**广播（broadcasting）**让每个位置都使用同一个标量。这里把 `X` 中的每个数加 2，`(a + X)[0, 0]` 只查看第一组的第一行。原来这一行是 `[0, 1, 2, 3]`，加法后变成 `[2, 3, 4, 5]`。`(a * X).shape` 检查乘法的结果，形状仍是 `(2, 3, 4)`。

<div data-note-tabs="标量与张量的广播" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
a = 2
(a + X)[0, 0], (a * X).shape
```

```text
(array([2., 3., 4., 5.]), (2, 3, 4))
```

</div>

<div data-note-tab="PyTorch">

```python
a = 2
(a + X)[0, 0], (a * X).shape
```

```text
(tensor([2, 3, 4, 5]), torch.Size([2, 3, 4]))
```

</div>

<div data-note-tab="TensorFlow">

```python
a = 2
(a + X)[0, 0], (a * X).shape
```

```text
(<tf.Tensor: shape=(4,), dtype=int32, numpy=array([2, 3, 4, 5], dtype=int32)>,
 TensorShape([2, 3, 4]))
```

</div>

<div data-note-tab="Paddle">

```python
a = 2
(a + X)[0, 0], (a * X).shape
```

```text
(Tensor(shape=[4], dtype=int64, place=Place(cpu), stop_gradient=True,
        [2, 3, 4, 5]),
 paddle.Size([2, 3, 4]))
```

</div>

</div>

### 求和与均值

取矩阵中的一个数时，用 `A[行号, 列号]` 来定位。轴从 `0` 开始编号，所以 `A` 的形状 `(5, 4)` 中，**轴 0 对应 5 个行号，轴 1 对应 4 个列号**。只改变行号，就沿着同一列向下走。只改变列号，就沿着同一行向右走。

**归约（reduction）**把一组数合成一个结果。沿一条轴求和时，固定另一个索引，把沿途的数加起来。

<figure class="markdown-illustration" style="max-width: 376px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/matrix-axis-sums.svg" alt="矩阵 A 有 5 行 4 列。沿轴 0 向下把每列加成一个和，结果是 40、45、50、55，形状为 (4,)。沿轴 1 向右把每行加成一个和，结果是 6、22、38、54、70，形状为 (5,)。" width="376" height="308" style="min-width: 0;" />
  </div>
  <figcaption>矩阵 A 按轴求和。箭头末端的数是对应的一整行或一整列的和。</figcaption>
</figure>

- **沿轴 0 向下加。** 固定在第一列，$0+4+8+12+16=40$。四列各得到一个和，所以 `column_sums` 的形状是 `(4,)`。
- **沿轴 1 向右加。** 固定在第一行，$0+1+2+3=6$。五行各得到一个和，所以 `row_sums` 的形状是 `(5,)`。

沿轴 1 求和后，还可以按原来的行号找到每个和。`(5,)` 只有一项，表示剩下一条长度为 5 的轴，里面有 5 个数。逗号是 Python 单项元组的写法。

> [!IMPORTANT] 归约结果由保留的轴决定
>
> 指定一条轴求和或求均值时，默认从输出形状中去掉该轴对应的一项，其余轴的顺序保持不变。如果选择保留该轴，就把原位置的长度改为 1。例如沿轴 1 求和并保留它，`(5, 4)` 就变成 `(5, 1)`。

向量只有一条轴，求和写成 $\sum_{i=1}^n x_i$。把矩阵的两条轴都归约，就是对全部元素求和，写成 $\sum_{i=1}^m\sum_{j=1}^n a_{ij}$。对 `A` 来说，这会得到一个形状为 `()` 的标量 `190`。

下面的代码依次输出向量的和、矩阵的和、各列的和、各行的和，最后用同时指定两条轴的写法核对矩阵总和。

<div data-note-tabs="对向量和矩阵求和" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
total = A.sum()
column_sums = A.sum(axis=0)
row_sums = A.sum(axis=1)
x.sum(), total, column_sums, row_sums, A.sum(axis=(0, 1))
```

```text
(array(6.),
 array(190.),
 array([40., 45., 50., 55.]),
 array([ 6., 22., 38., 54., 70.]),
 array(190.))
```

</div>

<div data-note-tab="PyTorch">

```python
total = A.sum()
column_sums = A.sum(dim=0)
row_sums = A.sum(dim=1)
x.sum(), total, column_sums, row_sums, A.sum(dim=(0, 1))
```

```text
(tensor(6.),
 tensor(190.),
 tensor([40., 45., 50., 55.]),
 tensor([ 6., 22., 38., 54., 70.]),
 tensor(190.))
```

在 `A.sum(dim=0)` 和 `A.sum(dim=1)` 中，`dim` 指定要合并的轴。`A.sum(dim=(0, 1))` 指定两条轴，所以矩阵的所有值合并成一个零维张量。

</div>

<div data-note-tab="TensorFlow">

```python
total = tf.reduce_sum(A)
column_sums = tf.reduce_sum(A, axis=0)
row_sums = tf.reduce_sum(A, axis=1)
tf.reduce_sum(x), total, column_sums, row_sums, tf.reduce_sum(A, axis=[0, 1])
```

```text
(<tf.Tensor: shape=(), dtype=float32, numpy=6.0>,
 <tf.Tensor: shape=(), dtype=float32, numpy=190.0>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([40., 45., 50., 55.], dtype=float32)>,
 <tf.Tensor: shape=(5,), dtype=float32, numpy=array([ 6., 22., 38., 54., 70.], dtype=float32)>,
 <tf.Tensor: shape=(), dtype=float32, numpy=190.0>)
```

</div>

<div data-note-tab="Paddle">

```python
total = A.sum()
column_sums = A.sum(axis=0)
row_sums = A.sum(axis=1)
x.sum(), total, column_sums, row_sums, A.sum(axis=[0, 1])
```

```text
(Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        6.),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        190.),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [40., 45., 50., 55.]),
 Tensor(shape=[5], dtype=float32, place=Place(cpu), stop_gradient=True,
        [6. , 22., 38., 54., 70.]),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        190.))
```

</div>

</div>

**均值（mean）**等于和除以参与求和的元素数。这里要先看每个输出值汇总了哪一组输入。

- 全矩阵只有一个总和 190，由 20 个元素得到，因此均值是 $190/20=9.5$。
- 沿轴 0 求均值时，每列各有 5 个元素。第一列的均值是 $40/5=8$。四列分别求均值，得到 `[8, 9, 10, 11]`，形状为 `(4,)`。

示例把框架直接求出的均值与「先求和再除」的结果并排展示。

<div data-note-tabs="对比求平均值与求和后再除" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A.mean(), total / A.size, A.mean(axis=0), column_sums / A.shape[0]
```

```text
(array(9.5), array(9.5), array([ 8.,  9., 10., 11.]), array([ 8.,  9., 10., 11.]))
```

</div>

<div data-note-tab="PyTorch">

```python
A.mean(), total / A.numel(), A.mean(dim=0), column_sums / A.shape[0]
```

```text
(tensor(9.5000),
 tensor(9.5000),
 tensor([ 8.,  9., 10., 11.]),
 tensor([ 8.,  9., 10., 11.]))
```

全矩阵的分母由 `A.numel()` 给出。逐列求均值的分母是 `A.shape[0]`，也就是轴 0 的长度。两种写法中的 `total` 和 `column_sums` 都来自上一组代码。

</div>

<div data-note-tab="TensorFlow">

```python
count = tf.cast(tf.size(A), A.dtype)
whole_mean = tf.reduce_mean(A)
column_means = tf.reduce_mean(A, axis=0)
whole_mean, total / count, column_means, column_sums / A.shape[0]
```

```text
(<tf.Tensor: shape=(), dtype=float32, numpy=9.5>,
 <tf.Tensor: shape=(), dtype=float32, numpy=9.5>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 8.,  9., 10., 11.], dtype=float32)>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 8.,  9., 10., 11.], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
count = paddle.cast(A.numel(), A.dtype)
A.mean(), total / count, A.mean(axis=0), column_sums / A.shape[0]
```

```text
(Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        9.50000000),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        9.50000000),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [8. , 9. , 10., 11.]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [8. , 9. , 10., 11.]))
```

</div>

</div>

### 保留轴与逐行归一化

**逐行归一化**在这里指把每个数除以**它所在行的和**。对 `A` 的第一行，四个分母都是 6。对第二行，四个分母都是 22。这要求每行的和非零。

1. 沿轴 1 求和并保留该轴，把 5 个行和排成一列。这样 `row_totals` 的形状是 `(5, 1)`，第一行放 6，第二行放 22。
1. 做 `A / row_totals` 时，广播从右侧对齐 `(5, 4)` 和 `(5, 1)`。两边的行数都是 5，长度为 1 的列轴可以扩展到 4，于是每一行的四个元素共用本行的分母。

第一行 `[0, 1, 2, 3]` 除以 6 后得到 $[0,1/6,1/3,1/2]$。对归一化后的矩阵再沿轴 1 求和，每行应得到 1。

<div data-note-tabs="保留归约轴并逐行归一化" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
row_totals = A.sum(axis=1, keepdims=True)
normalized = A / row_totals
row_totals.shape, normalized[0], normalized.sum(axis=1)
```

```text
((5, 1),
 array([0.        , 0.16666667, 0.33333334, 0.5       ]),
 array([1., 1., 1., 1., 1.]))
```

</div>

<div data-note-tab="PyTorch">

```python
row_totals = A.sum(dim=1, keepdim=True)
normalized = A / row_totals
row_totals.shape, normalized[0], normalized.sum(dim=1)
```

```text
(torch.Size([5, 1]),
 tensor([0.0000, 0.1667, 0.3333, 0.5000]),
 tensor([1., 1., 1., 1., 1.]))
```

`A.sum(dim=1, keepdim=True)` 中，`dim=1` 让每行的列值合并为一个和，`keepdim=True` 把这条轴保留在原位置。核对输出时，三项依次是分母的形状、归一化后的第一行和五个归一化后的行和。

</div>

<div data-note-tab="TensorFlow">

```python
row_totals = tf.reduce_sum(A, axis=1, keepdims=True)
normalized = A / row_totals
row_totals.shape, normalized[0], tf.reduce_sum(normalized, axis=1)
```

```text
(TensorShape([5, 1]),
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([0.        , 0.16666667, 0.33333334, 0.5       ], dtype=float32)>,
 <tf.Tensor: shape=(5,), dtype=float32, numpy=array([1., 1., 1., 1., 1.], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
row_totals = A.sum(axis=1, keepdim=True)
normalized = A / row_totals
row_totals.shape, normalized[0], normalized.sum(axis=1)
```

```text
(paddle.Size([5, 1]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [0.        , 0.16666667, 0.33333334, 0.50000000]),
 Tensor(shape=[5], dtype=float32, place=Place(cpu), stop_gradient=True,
        [1., 1., 1., 1., 1.]))
```

</div>

</div>

### 累积求和

沿轴 0 **累积求和（cumulative sum）**时，每个位置得到本列从开头累加到当前行的和。第一列 `[0, 4, 8, 12, 16]` 逐步累加得到 `[0, 4, 12, 24, 40]`，最后一项 40 正好是这一列的总和。

每个位置都留下一个累加结果，输出形状仍为 `(5, 4)`。结果的最后一行可以与前面的 `column_sums` 对照。

<div data-note-tabs="沿轴 0 累积求和" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A.cumsum(axis=0)
```

```text
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  6.,  8., 10.],
       [12., 15., 18., 21.],
       [24., 28., 32., 36.],
       [40., 45., 50., 55.]])
```

</div>

<div data-note-tab="PyTorch">

```python
A.cumsum(dim=0)
```

```text
tensor([[ 0.,  1.,  2.,  3.],
        [ 4.,  6.,  8., 10.],
        [12., 15., 18., 21.],
        [24., 28., 32., 36.],
        [40., 45., 50., 55.]])
```

</div>

<div data-note-tab="TensorFlow">

```python
tf.cumsum(A, axis=0)
```

```text
<tf.Tensor: shape=(5, 4), dtype=float32, numpy=
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  6.,  8., 10.],
       [12., 15., 18., 21.],
       [24., 28., 32., 36.],
       [40., 45., 50., 55.]], dtype=float32)>
```

</div>

<div data-note-tab="Paddle">

```python
A.cumsum(axis=0)
```

```text
Tensor(shape=[5, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[0. , 1. , 2. , 3. ],
        [4. , 6. , 8. , 10.],
        [12., 15., 18., 21.],
        [24., 28., 32., 36.],
        [40., 45., 50., 55.]])
```

</div>

</div>

## 点积与矩阵乘法

### 点积

两个同长度的实向量 $\mathbf{x},\mathbf{y}\in\mathbb{R}^d$ 的**点积（dot product）**先乘对应分量，再把乘积相加。结果是标量。

$$
\mathbf{x}^{\top}\mathbf{y}=\sum_{i=1}^{d}x_i y_i.
$$

式中的 $x_i y_i$ 表示同一个位置上的两项相乘，$\sum$ 再把每个位置的乘积加起来。下面沿用 `x = [0, 1, 2, 3]`，让 `y` 的四项都等于 1。按位置依次相乘，得到 `0 × 1 = 0`、`1 × 1 = 1`、`2 × 1 = 2` 和 `3 × 1 = 3`，再把这四个乘积相加，得到 `0 + 1 + 2 + 3 = 6`。代码用两种写法核对这个标量结果。

<div data-note-tabs="用两种方式计算向量点积" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
y = np.ones(4, dtype="float32")
np.dot(x, y), np.sum(x * y)
```

```text
(array(6.), array(6.))
```

</div>

<div data-note-tab="PyTorch">

```python
y = torch.ones(4, dtype=torch.float32)
torch.dot(x, y), torch.sum(x * y)
```

```text
(tensor(6.), tensor(6.))
```

`torch.dot(x, y)` 一次完成乘和加。拆开写时，`x * y` 先产生形状为 `(4,)` 的乘积张量，`torch.sum(x * y)` 再沿唯一的轴把四项相加。

</div>

<div data-note-tab="TensorFlow">

```python
y = tf.ones(4, dtype=tf.float32)
tf.tensordot(x, y, axes=1), tf.reduce_sum(x * y)
```

```text
(<tf.Tensor: shape=(), dtype=float32, numpy=6.0>,
 <tf.Tensor: shape=(), dtype=float32, numpy=6.0>)
```

</div>

<div data-note-tab="Paddle">

```python
y = paddle.ones(shape=[4], dtype="float32")
paddle.dot(x, y), paddle.sum(x * y)
```

```text
(Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        6.),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        6.))
```

</div>

</div>

点积也可以表示加权和。令 $\mathbf{w}$ 为与 $\mathbf{x}$ 同长度的权重向量，$\mathbf{x}^{\top}\mathbf{w}$ 就是 $\sum_i x_iw_i$。若 $w_i\ge 0$ 且 $\sum_i w_i=1$，这个加权和就是加权平均（weighted average）。

对于两个**非零向量**，先用各自的 $L_2$ 范数将它们化为单位向量，再求点积，所得值等于两向量夹角的余弦。范数的定义见本节后文。

### 矩阵向量积

把 [(2.3.2)](#equation-eq-matrix-def) 的矩阵 $\mathbf{A}\in\mathbb{R}^{m\times n}$ 写成由 $m$ 个行向量组成的形式。每一行 $\mathbf{a}_i^{\top}$ 有 $n$ 个分量。

<div id="equation-chapter-preliminaries-linear-algebra-2" role="region" aria-label="公式 2.3.5" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}=
\begin{bmatrix}
\mathbf{a}^\top_{1} \\
\mathbf{a}^\top_{2} \\
\vdots \\
\mathbf{a}^\top_m \\
\end{bmatrix},
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.5)</span>
</div>
</div>

对于 [(2.3.1)](#equation-eq-vec-def) 中的列向量 $\mathbf{x}\in\mathbb{R}^n$，矩阵向量积的第 $i$ 项是 $\mathbf{a}_i^{\top}\mathbf{x}$。结果是一个有 $m$ 项的列向量。

<div id="equation-chapter-preliminaries-linear-algebra-3" role="region" aria-label="公式 2.3.6" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}\mathbf{x}
= \begin{bmatrix}
\mathbf{a}^\top_{1} \\
\mathbf{a}^\top_{2} \\
\vdots \\
\mathbf{a}^\top_m \\
\end{bmatrix}\mathbf{x}
= \begin{bmatrix}
 \mathbf{a}^\top_{1} \mathbf{x}  \\
 \mathbf{a}^\top_{2} \mathbf{x} \\
\vdots\\
 \mathbf{a}^\top_{m} \mathbf{x}\\
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.6)</span>
</div>
</div>

代码用一维张量 `x` 表示这个向量。`A` 有 4 列，`x` 有 4 项，因此可以让每一行都和同一个 `x` 做点积。第一行 `[0, 1, 2, 3]` 与 `x` 的点积是 $0\cdot0+1\cdot1+2\cdot2+3\cdot3=14$。这个 14 放在结果的第一项。

`A` 有 5 行，每行给出一个值，结果形状是 `(5,)`。代码先显示两个输入的形状，再显示这 5 个点积。

<div data-note-tabs="矩阵与向量相乘" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A.shape, x.shape, np.dot(A, x)
```

```text
((5, 4), (4,), array([ 14.,  38.,  62.,  86., 110.]))
```

</div>

<div data-note-tab="PyTorch">

```python
A.shape, x.shape, torch.mv(A, x)
```

```text
(torch.Size([5, 4]), torch.Size([4]), tensor([ 14.,  38.,  62.,  86., 110.]))
```

</div>

<div data-note-tab="TensorFlow">

```python
A.shape, x.shape, tf.linalg.matvec(A, x)
```

```text
(TensorShape([5, 4]),
 TensorShape([4]),
 <tf.Tensor: shape=(5,), dtype=float32, numpy=array([ 14.,  38.,  62.,  86., 110.], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
A.shape, x.shape, paddle.mv(A, x)
```

```text
(paddle.Size([5, 4]),
 paddle.Size([4]),
 Tensor(shape=[5], dtype=float32, place=Place(cpu), stop_gradient=True,
        [14. , 38. , 62. , 86. , 110.]))
```

</div>

</div>

因此，$\mathbf{A}\mathbf{x}$ 可以看成从 $\mathbb{R}^n$ 到 $\mathbb{R}^m$ 的映射。后续的全连接层会用类似的运算，把一条输入变换成新的特征。

### 矩阵乘法

假设 $\mathbf{A}\in\mathbb{R}^{n\times k}$，$\mathbf{B}\in\mathbb{R}^{k\times m}$。

<div id="equation-chapter-preliminaries-linear-algebra-4" role="region" aria-label="公式 2.3.7" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}=\begin{bmatrix}
 a_{11} & a_{12} & \cdots & a_{1k} \\
 a_{21} & a_{22} & \cdots & a_{2k} \\
\vdots & \vdots & \ddots & \vdots \\
 a_{n1} & a_{n2} & \cdots & a_{nk} \\
\end{bmatrix},\quad
\mathbf{B}=\begin{bmatrix}
 b_{11} & b_{12} & \cdots & b_{1m} \\
 b_{21} & b_{22} & \cdots & b_{2m} \\
\vdots & \vdots & \ddots & \vdots \\
 b_{k1} & b_{k2} & \cdots & b_{km} \\
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.7)</span>
</div>
</div>

> [!IMPORTANT] 矩阵乘法匹配内维，保留外维
>
> 左矩阵的列数须等于右矩阵的行数。`(n, k)` 乘 `(k, m)` 得到 `(n, m)`，每项 $c_{ij}$ 是左矩阵第 $i$ 行与右矩阵第 $j$ 列的点积。

把 $\mathbf{A}$ 按行展开，把 $\mathbf{B}$ 按列展开，其中 $\mathbf{a}_i^{\top}$ 与 $\mathbf{b}_j$ 各有 $k$ 个分量。

<div id="equation-chapter-preliminaries-linear-algebra-5" role="region" aria-label="公式 2.3.8" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{A}=
\begin{bmatrix}
\mathbf{a}^\top_{1} \\
\mathbf{a}^\top_{2} \\
\vdots \\
\mathbf{a}^\top_n \\
\end{bmatrix},
\quad \mathbf{B}=\begin{bmatrix}
 \mathbf{b}_{1} & \mathbf{b}_{2} & \cdots & \mathbf{b}_{m} \\
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.8)</span>
</div>
</div>

每个输出位置对应一个行列组合。也可以依次用 $\mathbf{A}$ 乘 $\mathbf{B}$ 的每一列，再将得到的 $m$ 个列向量拼成一张矩阵。

<div id="equation-chapter-preliminaries-linear-algebra-6" role="region" aria-label="公式 2.3.9" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathbf{C} = \mathbf{AB} = \begin{bmatrix}
\mathbf{a}^\top_{1} \\
\mathbf{a}^\top_{2} \\
\vdots \\
\mathbf{a}^\top_n \\
\end{bmatrix}
\begin{bmatrix}
 \mathbf{b}_{1} & \mathbf{b}_{2} & \cdots & \mathbf{b}_{m} \\
\end{bmatrix}
= \begin{bmatrix}
\mathbf{a}^\top_{1} \mathbf{b}_1 & \mathbf{a}^\top_{1}\mathbf{b}_2& \cdots & \mathbf{a}^\top_{1} \mathbf{b}_m \\
 \mathbf{a}^\top_{2}\mathbf{b}_1 & \mathbf{a}^\top_{2} \mathbf{b}_2 & \cdots & \mathbf{a}^\top_{2} \mathbf{b}_m \\
 \vdots & \vdots & \ddots &\vdots\\
\mathbf{a}^\top_{n} \mathbf{b}_1 & \mathbf{a}^\top_{n}\mathbf{b}_2& \cdots& \mathbf{a}^\top_{n} \mathbf{b}_m
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.9)</span>
</div>
</div>

沿用 `(5, 4)` 的 `A`，令 `B` 为 `(4, 3)` 的全 1 矩阵。内侧两个轴的长度都是 4，乘积的每一项都合并四个乘积。外侧保留下来的 5 和 3 决定输出形状为 `(5, 3)`。

想核对第二行、第三列的 $c_{23}$，取 `A` 的第二行 `[4, 5, 6, 7]` 和 `B` 的第三列 `[1, 1, 1, 1]`。两者的点积为 $4+5+6+7=22$，因此输出的第二行、第三列是 22。`B` 的三列相同，所以输出的三列也相同。

<div data-note-tabs="矩阵与矩阵相乘" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
B = np.ones((4, 3), dtype="float32")
np.dot(A, B)
```

```text
array([[ 6.,  6.,  6.],
       [22., 22., 22.],
       [38., 38., 38.],
       [54., 54., 54.],
       [70., 70., 70.]])
```

</div>

<div data-note-tab="PyTorch">

```python
B = torch.ones(4, 3, dtype=torch.float32)
torch.mm(A, B)
```

```text
tensor([[ 6.,  6.,  6.],
        [22., 22., 22.],
        [38., 38., 38.],
        [54., 54., 54.],
        [70., 70., 70.]])
```

</div>

<div data-note-tab="TensorFlow">

```python
B = tf.ones((4, 3), dtype=tf.float32)
tf.matmul(A, B)
```

```text
<tf.Tensor: shape=(5, 3), dtype=float32, numpy=
array([[ 6.,  6.,  6.],
       [22., 22., 22.],
       [38., 38., 38.],
       [54., 54., 54.],
       [70., 70., 70.]], dtype=float32)>
```

</div>

<div data-note-tab="Paddle">

```python
B = paddle.ones(shape=[4, 3], dtype="float32")
paddle.mm(A, B)
```

```text
Tensor(shape=[5, 3], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[6. , 6. , 6. ],
        [22., 22., 22.],
        [38., 38., 38.],
        [54., 54., 54.],
        [70., 70., 70.]])
```

</div>

</div>

Hadamard 积按相同位置相乘并保留形状。矩阵乘法按行与列配对，沿匹配的内维求和。

## 范数

### 范数的性质

**范数（norm）**用一个非负实数描述向量的大小。例如，把 $\mathbf{u}=(3,-4)$ 的分量绝对值 3 和 4 当作两条直角边的长度，得到的斜边长为 5。这就是该向量的 $L_2$ 范数。

用 $f(\mathbf{x})$ 表示向量 $\mathbf{x}$ 的范数。对同一空间里的向量 $\mathbf{x}$、$\mathbf{y}$ 和实数 $\alpha$，范数满足以下性质。

将向量缩放 $\alpha$ 倍，其范数缩放 $|\alpha|$ 倍。

<div id="equation-chapter-preliminaries-linear-algebra-7" role="region" aria-label="公式 2.3.10" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
f(\alpha \mathbf{x}) = |\alpha| f(\mathbf{x}).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.10)</span>
</div>
</div>

两个向量相加时，结果的范数至多为各自范数的和，这就是三角不等式。

<div id="equation-chapter-preliminaries-linear-algebra-8" role="region" aria-label="公式 2.3.11" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
f(\mathbf{x} + \mathbf{y}) \leq f(\mathbf{x}) + f(\mathbf{y}).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.11)</span>
</div>
</div>

范数总是非负的，且只有零向量的范数为零。

<div id="equation-chapter-preliminaries-linear-algebra-9" role="region" aria-label="公式 2.3.12" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
f(\mathbf{x}) \geq 0.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.12)</span>
</div>
</div>

<div id="equation-chapter-preliminaries-linear-algebra-10" role="region" aria-label="公式 2.3.13" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
f(\mathbf{x})=0 \Longleftrightarrow \mathbf{x}=\mathbf{0}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.13)</span>
</div>
</div>

### 向量的 L1、L2 与 Lp 范数

$L_2$ 范数是分量平方和的平方根。它给出向量到原点的欧氏距离。对两向量 $\mathbf{x}$、$\mathbf{y}$，两点之间的欧氏距离是 $\lVert\mathbf{x}-\mathbf{y}\rVert_2$。

<div id="equation-chapter-preliminaries-linear-algebra-11" role="region" aria-label="公式 2.3.14" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\|\mathbf{x}\|_2 = \sqrt{\sum_{i=1}^n x_i^2},
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.14)</span>
</div>
</div>

$L_1$ 范数把各分量的绝对值相加。

<div id="equation-chapter-preliminaries-linear-algebra-12" role="region" aria-label="公式 2.3.15" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\|\mathbf{x}\|_1 = \sum_{i=1}^n \left|x_i \right|.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.15)</span>
</div>
</div>

用同一个向量 $\mathbf{u}=(3,-4)$，可以对照两种计算过程。

- 求 $L_1$ 范数时，先取绝对值得到 3 和 4，再把它们相加，得到 7。
- 求 $L_2$ 范数时，先平方得到 9 和 16，再相加并开平方，得到 5。

<div data-note-tabs="计算向量的 L1 与 L2 范数" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
u = np.array([3.0, -4.0])
np.abs(u).sum(), np.linalg.norm(u, ord=2)
```

```text
(array(7.), array(5.))
```

</div>

<div data-note-tab="PyTorch">

```python
u = torch.tensor([3.0, -4.0])
u.abs().sum(), torch.linalg.vector_norm(u, ord=2)
```

```text
(tensor(7.), tensor(5.))
```

`u.abs().sum()` 把取绝对值和求和写成两步。`torch.linalg.vector_norm(u, ord=2)` 通过 `ord=2` 选用向量的 $L_2$ 范数。两个输出都把整个向量合并为一个标量。

</div>

<div data-note-tab="TensorFlow">

```python
u = tf.constant([3.0, -4.0])
tf.reduce_sum(tf.abs(u)), tf.norm(u, ord=2)
```

```text
(<tf.Tensor: shape=(), dtype=float32, numpy=7.0>,
 <tf.Tensor: shape=(), dtype=float32, numpy=5.0>)
```

</div>

<div data-note-tab="Paddle">

```python
u = paddle.to_tensor([3.0, -4.0])
u.abs().sum(), paddle.linalg.norm(u, p=2)
```

```text
(Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        7.),
 Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
        5.))
```

</div>

</div>

这两种范数可以用同一个 $L_p$ 公式表示。分量先取绝对值并逐项取 $p$ 次幂，求和后再取 $1/p$ 次幂。代入 $p=1$ 得到绝对值之和，代入 $p=2$ 得到平方和的平方根。下式作为范数使用时，取有限的 $p\ge 1$。

<div id="equation-chapter-preliminaries-linear-algebra-13" role="region" aria-label="公式 2.3.16" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\|\mathbf{x}\|_p = \left(\sum_{i=1}^n \left|x_i \right|^p \right)^{1/p}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.16)</span>
</div>
</div>

### 矩阵的 Frobenius 范数

矩阵的 **Frobenius 范数（Frobenius norm）**把矩阵所有元素平方后求和并开平方，等价于把元素排成一个向量后求 $L_2$ 范数。

<div id="equation-chapter-preliminaries-linear-algebra-14" role="region" aria-label="公式 2.3.17" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\|\mathbf{X}\|_F = \sqrt{\sum_{i=1}^m \sum_{j=1}^n x_{ij}^2}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.3.17)</span>
</div>
</div>

下面的 `M` 有 4 行、每行 9 个 1。每个元素平方后仍是 1，合计 36，开平方得到 6。这里的计算同时把行轴和列轴合并，最后得到一个值。

<div data-note-tabs="计算矩阵的 Frobenius 范数" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
M = np.ones((4, 9), dtype="float32")
np.linalg.norm(M, ord="fro")
```

```text
array(6.)
```

</div>

<div data-note-tab="PyTorch">

```python
M = torch.ones((4, 9), dtype=torch.float32)
torch.linalg.matrix_norm(M, ord="fro")
```

```text
tensor(6.)
```

`torch.linalg.matrix_norm(M, ord="fro")` 中的 `ord="fro"` 选择 Frobenius 范数。此处 `M` 有两条轴，输出的 `tensor(6.)` 对应整个矩阵。

</div>

<div data-note-tab="TensorFlow">

```python
M = tf.ones((4, 9), dtype=tf.float32)
tf.norm(M, ord="fro", axis=(0, 1))
```

```text
<tf.Tensor: shape=(), dtype=float32, numpy=6.0>
```

</div>

<div data-note-tab="Paddle">

```python
M = paddle.ones(shape=[4, 9], dtype="float32")
paddle.linalg.norm(M, p="fro", axis=[0, 1])
```

```text
Tensor(shape=[], dtype=float32, place=Place(cpu), stop_gradient=True,
       6.)
```

</div>

</div>

### 范数和目标

范数可以用来定义预测误差、衡量向量之间的距离，或约束模型参数的大小。在预测任务中，每项预测值减去真实值得到一个**残差**，所有残差组成向量 $\mathbf{r}$。

同一项的残差幅度从 2 增至 4 时，绝对值从 2 变成 4，平方从 4 变成 16。把各项相加后，绝对误差之和是 $\lVert\mathbf{r}\rVert_1$，平方误差之和是 $\lVert\mathbf{r}\rVert_2^2$。这给出了大残差在两种计算中怎样影响总误差。

想进一步了解矩阵分解、几何和线性变换，可以阅读[线性代数运算的在线附录](https://d2l.ai/chapter_appendix-mathematics-for-deep-learning/geometry-linear-algebraic-ops.html)，或参考 [Strang, 1993](https://zh.d2l.ai/chapter_references/zreferences.html#id156)、[Kolter, 2008](https://zh.d2l.ai/chapter_references/zreferences.html#id85) 和 [Petersen et al., 2008](https://zh.d2l.ai/chapter_references/zreferences.html#id127)。

## 小结

- **先读形状。** 张量有几条轴，取决于形状有几项。每一项给出对应轴的长度，行、列、样本或通道的含义由数据排布决定。
- **沿轴归约时追踪剩下的轴。** 求和与均值默认去掉指定的轴。把该轴保留为长度 1 后，可以与原张量对齐广播。
- **乘法前核对两侧如何配对。** 逐元素乘法使用对应位置，点积再把乘积求和。矩阵乘法匹配内维，输出由左矩阵的行与右矩阵的列决定。
- **求范数时明确对象和轴。** 向量的 $L_1$、$L_2$ 和矩阵的 Frobenius 范数度量不同形式的数据。轴的选择决定得到一个整体结果，还是按组得到多个结果。

## 练习

1. **重复转置。** 证明 $(\mathbf A^{\top})^{\top}=\mathbf A$。

   > [!ANSWER]
   > 第一次转置把原矩阵的 $(i,j)$ 项放到 $(j,i)$，第二次再放回 $(i,j)$。结果的行列数也回到原形状，因此每个位置和值都与原矩阵一致。

1. **加法与转置。** 对两个同形矩阵 $\mathbf A$ 和 $\mathbf B$，证明 $(\mathbf A+\mathbf B)^{\top}=\mathbf A^{\top}+\mathbf B^{\top}$。

   > [!ANSWER]
   > 左边的第 $(i,j)$ 项是 $(\mathbf A+\mathbf B)_{ji}=a_{ji}+b_{ji}$。右边的同一项是 $(\mathbf A^{\top})_{ij}+(\mathbf B^{\top})_{ij}=a_{ji}+b_{ji}$。两边都是将原形状的行列交换后的矩阵。

1. **构造对称矩阵。** 对任意方阵 $\mathbf A$，$\mathbf A+\mathbf A^{\top}$ 总是对称的吗？说明理由。

   > [!ANSWER]
   > 是。根据前两题，$(\mathbf A+\mathbf A^{\top})^{\top}=\mathbf A^{\top}+\mathbf A$。矩阵加法满足交换律，所得矩阵等于 $\mathbf A+\mathbf A^{\top}$。

1. **读取张量的第一轴。** 对本节形状为 `(2, 3, 4)` 的 `X`，`len(X)` 返回什么？

   > [!ANSWER]
   > 返回 `2`。外层有两组 `(3, 4)` 的数组，`len(X)` 只取第一轴的长度。

1. **检查长度的适用范围。** 在 PyTorch 中，`len(X)` 对有轴的张量查询哪一条轴？对零维标量张量调用时会发生什么？

   > [!ANSWER]
   > 张量有至少一条轴时，`len(X)` 返回轴 0 的长度。零维张量的形状是 `()`，没有可供查询的第一条轴，因此会抛出 `TypeError`。

1. **定位广播失败。** 取本节 `(5, 4)` 的 `A`，在 PyTorch 中单独运行 `A / A.sum(dim=1)` 并解释结果。怎样改成逐行归一化？

   > [!ANSWER]
   > `A.sum(dim=1)` 得到 `(5,)`。广播从右侧对齐，`A` 的末轴长度 4 与分母的长度 5 都大于 1，表达式会报错。改用 `A / A.sum(dim=1, keepdim=True)`，分母形状变为 `(5, 1)`，行和扩展到对应行的四个位置。
   >
   > 若换成行列等长的方阵，省略 `keepdim` 可能仍能执行。按末轴对齐会使第 $j$ 个分母施加到第 $j$ 列，因此核对归一化结果时可以再次沿轴 1 求和。

1. **预测归约形状。** 对形状为 `(2, 3, 4)` 的张量，分别沿轴 0、1、2 求和，且去掉归约轴。三次结果各是什么形状？

   > [!ANSWER]
   > 依次为 `(3, 4)`、`(2, 4)`、`(2, 3)`。每次去掉相应轴的长度，剩余轴的顺序保持不变。

1. **比较整体范数与逐矩阵范数。** 在 PyTorch 中，将前文的三轴整数张量 `X` 转成浮点张量。试着计算整个张量展平后的 $L_2$ 范数，再沿末两轴求每个矩阵的 Frobenius 范数。两种结果各有几个值？

   > [!ANSWER]
   > 整体计算将所有 24 个值看成一个向量，得到一个标量 $\sqrt{4324}$。逐矩阵计算只合并最后两条轴，保留长度为 2 的第 0 轴，因而每个 `(3, 4)` 矩阵各得到一个值。
   >
   > ```python
   > values = X.to(dtype=torch.float32)
   > overall = torch.linalg.vector_norm(values)
   > per_matrix = torch.linalg.matrix_norm(values, ord="fro", dim=(-2, -1))
   > overall, per_matrix.shape
   > ```
