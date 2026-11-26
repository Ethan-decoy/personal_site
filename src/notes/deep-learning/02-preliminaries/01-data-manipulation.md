---
title: 数据操作
date: 2026-11-20
order: 1
---

# 数据操作

读入数据后，程序要把数存下来，才能接着求和、相乘。深度学习用**张量（tensor）**保存输入数据、模型参数和计算结果。你可以先把张量看成一组按一定方式摆放、可以一起拿来计算的数值。

## 入门

### 创建一维张量

先把从 `0` 到 `11` 的 12 个数存进 `x`。代码从 `0` 开始数，到 `12` 前停下。这些数排成一串，沿一个方向就能逐项读取。这个方向叫一条**轴**，所以 `x` 是一维张量。

**Notebook** 是一份能一格一格运行代码的笔记。前一格创建的变量，后一格可以接着用。动手时开一个新的 Python 会话，用 CPU（运行代码的机器上的通用处理器）来计算。

在页面上选定框架，其他标签组会一起切换到这个框架。从它的第一格顺序往下跑，`x`、`X` 和 `Y` 会随运行重新赋值或被修改。可以用文中的输出核对结果。

<div data-note-tabs="创建一维张量" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

`npx.set_np()` 启用 MXNet 的 NumPy 语义。原书的 `np.arange(12)` 生成浮点元素。

```python
from mxnet import np, npx
npx.set_np()
```

```python
x = np.arange(12)
x
```

```text
[07:09:13] ../src/storage/storage.cc:196: Using Pooled (Naive) StorageManager for CPU
```

```text
array([ 0.,  1.,  2.,  3.,  4.,  5.,  6.,  7.,  8.,  9., 10., 11.])
```

</div>

<div data-note-tab="PyTorch">

`torch.arange(12)` 在这里用整数存下这些值。需要浮点数时，可以用 `dtype` 指定元素类型。

```python
import torch
```

```python
x = torch.arange(12)
x
```

```text
tensor([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11])
```

</div>

<div data-note-tab="TensorFlow">

```python
import tensorflow as tf
```

```python
x = tf.range(12)
x
```

```text
<tf.Tensor: shape=(12,), dtype=int32, numpy=array([ 0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11], dtype=int32)>
```

</div>

<div data-note-tab="Paddle">

```python
import warnings
warnings.filterwarnings(action='ignore')
import paddle
```

```python
x = paddle.arange(12)
x
```

```text
Tensor(shape=[12], dtype=int64, place=Place(cpu), stop_gradient=True,
       [0 , 1 , 2 , 3 , 4 , 5 , 6 , 7 , 8 , 9 , 10, 11])
```

</div>

</div>

现在 `x` 里存着这 12 个数。写 `x * 2`，框架会把每个数乘以 2，返回一个新张量，里面的数依次是 0、2、4，一直到 22。

### 形状与元素总数

**形状说的是这些数怎么摆。** 刚才的 `x` 把 12 个数排成一串，所以 `x.shape` 对应 `(12,)`。括号里只有一项，说明只有一条轴。这一项是 12，说明这条轴上有 12 个位置。

> [!IMPORTANT] 从形状读轴长与元素总数
>
> `shape` 按顺序列出各轴的长度。轴从 `0` 开始编号。把各轴的长度乘起来，就得到元素总数。

<div data-note-tabs="形状与元素总数" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

`x.shape` 查看轴长，`x.size` 给出元素总数。

```python
x.shape
```

```text
(12,)
```

```python
x.size
```

```text
12
```

</div>

<div data-note-tab="PyTorch">

`x.shape` 显示为 `torch.Size([12])`，这就是 PyTorch 写出形状 `(12,)` 的方式。`x.numel()` 返回 `12`，表示 `x` 中一共有 12 个数。

```python
x.shape
```

```text
torch.Size([12])
```

```python
x.numel()
```

```text
12
```

</div>

<div data-note-tab="TensorFlow">

`tf.size(x)` 返回包含元素总数的标量张量。

```python
x.shape
```

```text
TensorShape([12])
```

```python
tf.size(x)
```

```text
<tf.Tensor: shape=(), dtype=int32, numpy=12>
```

</div>

<div data-note-tab="Paddle">

```python
x.shape
```

```text
[12]
```

```python
x.numel()
```

```text
Tensor(shape=[1], dtype=int64, place=Place(cpu), stop_gradient=True,
       [12])
```

</div>

</div>

### 改变形状

把刚才的 12 个数重新摆一摆。`[0, 1, 2, 3]` 放第一行，`[4, 5, 6, 7]` 放第二行，剩下四个放第三行。这个操作叫**改变形状（reshape）**，排出来的结果记作 `X`。

现在有 3 行，每行 4 个，所以形状是 `(3, 4)`，元素总数仍然是 12。`x` 的形状 `(12,)` 和 `X` 的形状 `(3, 4)` 描述的是同一组数的两种摆法。这里保留了数值和顺序。

改形状时，各轴长度的乘积仍要等于 12。知道每行放 4 个，行数就可以用 `12 / 4` 算出来。写形状时，可以用一个 `-1` 让框架算出这条轴的长度。

<div data-note-tabs="改变形状" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X = x.reshape(3, 4)
X
```

```text
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  5.,  6.,  7.],
       [ 8.,  9., 10., 11.]])
```

</div>

<div data-note-tab="PyTorch">

```python
X = x.reshape(3, 4)
X
```

```text
tensor([[ 0,  1,  2,  3],
        [ 4,  5,  6,  7],
        [ 8,  9, 10, 11]])
```

在 PyTorch 中，`x.reshape(-1, 4)` 会算出这一轴的长度是 3，得到的形状也是 `(3, 4)`。

PyTorch 的 `reshape` 可能返回共享存储的视图，也可能复制数据，取决于输入的布局。后续需要通过写入来修改源数据时，要按[张量视图的规则](https://docs.pytorch.org/docs/2.15/tensor_view.html)判断。

</div>

<div data-note-tab="TensorFlow">

```python
X = tf.reshape(x, (3, 4))
X
```

```text
<tf.Tensor: shape=(3, 4), dtype=int32, numpy=
array([[ 0,  1,  2,  3],
       [ 4,  5,  6,  7],
       [ 8,  9, 10, 11]], dtype=int32)>
```

</div>

<div data-note-tab="Paddle">

```python
X = paddle.reshape(x, (3, 4))
X
```

```text
Tensor(shape=[3, 4], dtype=int64, place=Place(cpu), stop_gradient=True,
       [[0 , 1 , 2 , 3 ],
        [4 , 5 , 6 , 7 ],
        [8 , 9 , 10, 11]])
```

</div>

</div>

### 用常量、随机数与列表初始化

运行随机采样的例子时，可以用文中的输出核对形状，再看代码从哪种分布取数。每次抽到的数值可能不同。后面可以用随机张量试跑代码，也可以用正态随机数给模型参数设置初值。

<div data-note-tabs="用常量、随机数与列表初始化" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

用 `zeros` 或 `ones` 构造元素全为 0 或 1 的张量。形状 `(2, 3, 4)` 可以读成两个 `3 × 4` 的矩阵，分别对应三个轴的长度。

```python
np.zeros((2, 3, 4))
```

```text
array([[[0., 0., 0., 0.],
        [0., 0., 0., 0.],
        [0., 0., 0., 0.]],

       [[0., 0., 0., 0.],
        [0., 0., 0., 0.],
        [0., 0., 0., 0.]]])
```

```python
np.ones((2, 3, 4))
```

```text
array([[[1., 1., 1., 1.],
        [1., 1., 1., 1.],
        [1., 1., 1., 1.]],

       [[1., 1., 1., 1.],
        [1., 1., 1., 1.],
        [1., 1., 1., 1.]]])
```

这里生成一个 `(3, 4)` 的张量，元素从均值为 `0`、标准差为 `1` 的标准正态分布采样。下面是一组可能的结果。

```python
np.random.normal(0, 1, size=(3, 4))
```

```text
array([[ 2.2122064 ,  1.1630787 ,  0.7740038 ,  0.4838046 ],
       [ 1.0434403 ,  0.29956347,  1.1839255 ,  0.15302546],
       [ 1.8917114 , -1.1688148 , -1.2347414 ,  1.5580711 ]])
```

已知每个元素的值时，可以直接传入列表。对二维列表，外层给出各行，内层给出每行的元素。

```python
np.array([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
```

```text
array([[2., 1., 4., 3.],
       [1., 2., 3., 4.],
       [4., 3., 2., 1.]])
```

</div>

<div data-note-tab="PyTorch">

用 `zeros` 或 `ones` 构造元素全为 0 或 1 的张量。形状 `(2, 3, 4)` 可以读成两个 `3 × 4` 的矩阵，分别对应三个轴的长度。

```python
torch.zeros((2, 3, 4))
```

```text
tensor([[[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]],

        [[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]]])
```

```python
torch.ones((2, 3, 4))
```

```text
tensor([[[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]],

        [[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]]])
```

`torch.randn(3, 4)` 生成一个 `(3, 4)` 的张量，元素从均值为 `0`、标准差为 `1` 的标准正态分布采样。下面是一组可能的结果。

```python
torch.randn(3, 4)
```

```text
tensor([[-0.0135,  0.0665,  0.0912,  0.3212],
        [ 1.4653,  0.1843, -1.6995, -0.3036],
        [ 1.7646,  1.0450,  0.2457, -0.7732]])
```

已知每个元素的值时，可以直接传入列表。对二维列表，外层给出各行，内层给出每行的元素。

```python
torch.tensor([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
```

```text
tensor([[2, 1, 4, 3],
        [1, 2, 3, 4],
        [4, 3, 2, 1]])
```

</div>

<div data-note-tab="TensorFlow">

用 `zeros` 或 `ones` 构造元素全为 0 或 1 的张量。形状 `(2, 3, 4)` 可以读成两个 `3 × 4` 的矩阵，分别对应三个轴的长度。

```python
tf.zeros((2, 3, 4))
```

```text
<tf.Tensor: shape=(2, 3, 4), dtype=float32, numpy=
array([[[0., 0., 0., 0.],
        [0., 0., 0., 0.],
        [0., 0., 0., 0.]],

       [[0., 0., 0., 0.],
        [0., 0., 0., 0.],
        [0., 0., 0., 0.]]], dtype=float32)>
```

```python
tf.ones((2, 3, 4))
```

```text
<tf.Tensor: shape=(2, 3, 4), dtype=float32, numpy=
array([[[1., 1., 1., 1.],
        [1., 1., 1., 1.],
        [1., 1., 1., 1.]],

       [[1., 1., 1., 1.],
        [1., 1., 1., 1.],
        [1., 1., 1., 1.]]], dtype=float32)>
```

这里生成一个 `(3, 4)` 的张量，元素从均值为 `0`、标准差为 `1` 的标准正态分布采样。下面是一组可能的结果。

```python
tf.random.normal(shape=[3, 4])
```

```text
<tf.Tensor: shape=(3, 4), dtype=float32, numpy=
array([[-1.9437447 ,  1.7360141 ,  0.03836465, -0.23741092],
       [-0.7939557 , -0.89138025,  0.17875476, -1.8298926 ],
       [ 1.0334245 , -0.06715401, -1.0667316 , -1.1286876 ]],
      dtype=float32)>
```

已知每个元素的值时，可以直接传入列表。对二维列表，外层给出各行，内层给出每行的元素。

```python
tf.constant([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
```

```text
<tf.Tensor: shape=(3, 4), dtype=int32, numpy=
array([[2, 1, 4, 3],
       [1, 2, 3, 4],
       [4, 3, 2, 1]], dtype=int32)>
```

</div>

<div data-note-tab="Paddle">

用 `zeros` 或 `ones` 构造元素全为 0 或 1 的张量。形状 `(2, 3, 4)` 可以读成两个 `3 × 4` 的矩阵，分别对应三个轴的长度。

```python
paddle.zeros((2, 3, 4))
```

```text
Tensor(shape=[2, 3, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]],

        [[0., 0., 0., 0.],
         [0., 0., 0., 0.],
         [0., 0., 0., 0.]]])
```

```python
paddle.ones((2, 3, 4))
```

```text
Tensor(shape=[2, 3, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]],

        [[1., 1., 1., 1.],
         [1., 1., 1., 1.],
         [1., 1., 1., 1.]]])
```

这里生成一个 `(3, 4)` 的张量，元素从均值为 `0`、标准差为 `1` 的标准正态分布采样。下面是一组可能的结果。

```python
paddle.randn((3, 4), 'float32')
```

```text
Tensor(shape=[3, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[ 0.34377271,  1.05267835, -0.08373270,  1.80384696],
        [-0.71695501, -0.93773055,  0.46765271,  0.22694604],
        [ 0.48074690, -1.88347197,  0.66850376,  0.23313034]])
```

已知每个元素的值时，可以直接传入列表。对二维列表，外层给出各行，内层给出每行的元素。

```python
paddle.to_tensor([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
```

```text
Tensor(shape=[3, 4], dtype=int64, place=Place(cpu), stop_gradient=True,
       [[2, 1, 4, 3],
        [1, 2, 3, 4],
        [4, 3, 2, 1]])
```

</div>

</div>

## 运算符

### 逐元素运算

**逐元素运算（elementwise operation）**在每个位置上应用同一个标量函数。对单个张量，函数接收该位置的值，例如 `exp` 对每个元素计算 $e^x$。对两个同形状的张量，函数接收两个张量在相同位置上的值。

以长度同为 $d$ 的向量 $\mathbf{u}$ 和 $\mathbf{v}$ 为例，对有定义的输入，二元标量运算 $f$ 逐位给出 $c_i = f(u_i, v_i)$。因此从 $\mathbf{u}$ 和 $\mathbf{v}$ 得到的向量 $\mathbf{c}$ 仍有 $d$ 个元素。下面依次计算加、减、乘、除和幂。

<div data-note-tabs="逐元素运算" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
x = np.array([1, 2, 4, 8])
y = np.array([2, 2, 2, 2])
x + y, x - y, x * y, x / y, x ** y  # **运算符是求幂运算
```

```text
(array([ 3.,  4.,  6., 10.]),
 array([-1.,  0.,  2.,  6.]),
 array([ 2.,  4.,  8., 16.]),
 array([0.5, 1. , 2. , 4. ]),
 array([ 1.,  4., 16., 64.]))
```

```python
np.exp(x)
```

```text
array([2.7182817e+00, 7.3890562e+00, 5.4598148e+01, 2.9809580e+03])
```

</div>

<div data-note-tab="PyTorch">

```python
x = torch.tensor([1.0, 2, 4, 8])
y = torch.tensor([2, 2, 2, 2])
x + y, x - y, x * y, x / y, x ** y  # **运算符是求幂运算
```

```text
(tensor([ 3.,  4.,  6., 10.]),
 tensor([-1.,  0.,  2.,  6.]),
 tensor([ 2.,  4.,  8., 16.]),
 tensor([0.5000, 1.0000, 2.0000, 4.0000]),
 tensor([ 1.,  4., 16., 64.]))
```

```python
torch.exp(x)
```

```text
tensor([2.7183e+00, 7.3891e+00, 5.4598e+01, 2.9810e+03])
```

</div>

<div data-note-tab="TensorFlow">

```python
x = tf.constant([1.0, 2, 4, 8])
y = tf.constant([2.0, 2, 2, 2])
x + y, x - y, x * y, x / y, x ** y  # **运算符是求幂运算
```

```text
(<tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 3.,  4.,  6., 10.], dtype=float32)>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([-1.,  0.,  2.,  6.], dtype=float32)>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 2.,  4.,  8., 16.], dtype=float32)>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([0.5, 1. , 2. , 4. ], dtype=float32)>,
 <tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 1.,  4., 16., 64.], dtype=float32)>)
```

```python
tf.exp(x)
```

```text
<tf.Tensor: shape=(4,), dtype=float32, numpy=
array([2.7182817e+00, 7.3890562e+00, 5.4598148e+01, 2.9809580e+03],
      dtype=float32)>
```

</div>

<div data-note-tab="Paddle">

```python
x = paddle.to_tensor([1.0, 2, 4, 8])
y = paddle.to_tensor([2, 2, 2, 2])
x + y, x - y, x * y, x / y, x ** y  # **运算符是求幂运算
```

```text
(Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [3. , 4. , 6. , 10.]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [-1.,  0.,  2.,  6.]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [2. , 4. , 8. , 16.]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [0.50000000, 1.        , 2.        , 4.        ]),
 Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [1. , 4. , 16., 64.]))
```

```python
paddle.exp(x)
```

```text
Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [2.71828175   , 7.38905621   , 54.59814835  , 2980.95800781])
```

</div>

</div>

逐元素乘法会把同一位置的两个值相乘。向量点积和矩阵乘法还涉及沿轴求和，见[线性代数](03-linear-algebra.md#线性代数)。

### 沿已有轴拼接

拼接把多个张量沿一个**已有的轴**接在一起。对下面的两个矩阵，拼接轴长度相加，另一轴长度须一致。

- 沿轴 `0` 拼接，把 `Y` 的行接在 `X` 下方，得到 `(6, 4)`。
- 沿轴 `1` 拼接，把 `Y` 的列接在 `X` 右侧，得到 `(3, 8)`。

此处创建的 `X` 和 `Y` 都是形状为 `(3, 4)` 的浮点张量。后续的比较、索引和写入会沿用它们。

<div data-note-tabs="沿已有轴拼接" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X = np.arange(12).reshape(3, 4)
Y = np.array([[2, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
np.concatenate([X, Y], axis=0), np.concatenate([X, Y], axis=1)
```

```text
(array([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.],
        [ 2.,  1.,  4.,  3.],
        [ 1.,  2.,  3.,  4.],
        [ 4.,  3.,  2.,  1.]]),
 array([[ 0.,  1.,  2.,  3.,  2.,  1.,  4.,  3.],
        [ 4.,  5.,  6.,  7.,  1.,  2.,  3.,  4.],
        [ 8.,  9., 10., 11.,  4.,  3.,  2.,  1.]]))
```

</div>

<div data-note-tab="PyTorch">

```python
X = torch.arange(12, dtype=torch.float32).reshape(3, 4)
Y = torch.tensor([[2.0, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
torch.cat((X, Y), dim=0), torch.cat((X, Y), dim=1)
```

```text
(tensor([[ 0.,  1.,  2.,  3.],
         [ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.],
         [ 2.,  1.,  4.,  3.],
         [ 1.,  2.,  3.,  4.],
         [ 4.,  3.,  2.,  1.]]),
 tensor([[ 0.,  1.,  2.,  3.,  2.,  1.,  4.,  3.],
         [ 4.,  5.,  6.,  7.,  1.,  2.,  3.,  4.],
         [ 8.,  9., 10., 11.,  4.,  3.,  2.,  1.]]))
```

</div>

<div data-note-tab="TensorFlow">

```python
X = tf.reshape(tf.range(12, dtype=tf.float32), (3, 4))
Y = tf.constant([[2.0, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
tf.concat([X, Y], axis=0), tf.concat([X, Y], axis=1)
```

```text
(<tf.Tensor: shape=(6, 4), dtype=float32, numpy=
 array([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.],
        [ 2.,  1.,  4.,  3.],
        [ 1.,  2.,  3.,  4.],
        [ 4.,  3.,  2.,  1.]], dtype=float32)>,
 <tf.Tensor: shape=(3, 8), dtype=float32, numpy=
 array([[ 0.,  1.,  2.,  3.,  2.,  1.,  4.,  3.],
        [ 4.,  5.,  6.,  7.,  1.,  2.,  3.,  4.],
        [ 8.,  9., 10., 11.,  4.,  3.,  2.,  1.]], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
X = paddle.arange(12, dtype='float32').reshape((3, 4))
Y = paddle.to_tensor([[2.0, 1, 4, 3], [1, 2, 3, 4], [4, 3, 2, 1]])
paddle.concat((X, Y), axis=0), paddle.concat((X, Y), axis=1)
```

```text
(Tensor(shape=[6, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0. , 1. , 2. , 3. ],
         [4. , 5. , 6. , 7. ],
         [8. , 9. , 10., 11.],
         [2. , 1. , 4. , 3. ],
         [1. , 2. , 3. , 4. ],
         [4. , 3. , 2. , 1. ]]),
 Tensor(shape=[3, 8], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[0. , 1. , 2. , 3. , 2. , 1. , 4. , 3. ],
         [4. , 5. , 6. , 7. , 1. , 2. , 3. , 4. ],
         [8. , 9. , 10., 11., 4. , 3. , 2. , 1. ]]))
```

</div>

</div>

### 比较得到布尔张量

`X == Y` 比较两个张量同一位置的元素，相等得到 `True`，其余位置得到 `False`。本例返回一个形状为 `(3, 4)` 的布尔张量。首行的第二、第四个元素相等。

<div data-note-tabs="比较得到布尔张量" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X == Y
```

```text
array([[False,  True, False,  True],
       [False, False, False, False],
       [False, False, False, False]])
```

</div>

<div data-note-tab="PyTorch">

```python
X == Y
```

```text
tensor([[False,  True, False,  True],
        [False, False, False, False],
        [False, False, False, False]])
```

</div>

<div data-note-tab="TensorFlow">

```python
X == Y
```

```text
<tf.Tensor: shape=(3, 4), dtype=bool, numpy=
array([[False,  True, False,  True],
       [False, False, False, False],
       [False, False, False, False]])>
```

</div>

<div data-note-tab="Paddle">

```python
X == Y
```

```text
Tensor(shape=[3, 4], dtype=bool, place=Place(cpu), stop_gradient=True,
       [[False, True , False, True ],
        [False, False, False, False],
        [False, False, False, False]])
```

</div>

</div>

### 对所有元素求和

沿所有轴归约，把 `X` 的十二个元素相加，结果只包含数值 `66`。

<div data-note-tabs="对所有元素求和" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X.sum()
```

```text
array(66.)
```

</div>

<div data-note-tab="PyTorch">

`X.sum()` 沿所有轴归约，把 `X` 的十二个元素相加。在 PyTorch 中，结果是形状为 `()` 的零维张量，其值为 `66`。

```python
X.sum()
```

```text
tensor(66.)
```

</div>

<div data-note-tab="TensorFlow">

```python
tf.reduce_sum(X)
```

```text
<tf.Tensor: shape=(), dtype=float32, numpy=66.0>
```

</div>

<div data-note-tab="Paddle">

```python
X.sum()
```

```text
Tensor(shape=[1], dtype=float32, place=Place(cpu), stop_gradient=True,
       [66.])
```

</div>

</div>

## 广播机制

有些逐元素运算支持**广播（broadcasting）**，例如加法可以组合形状为 `(3, 1)` 和 `(1, 2)` 的两个张量。先用形状判断运算能否进行，再确定每个结果位置取哪两个输入值。

> [!IMPORTANT] 广播从末轴对齐形状
> 从最右侧逐轴对齐，缺失的轴按长度 `1` 处理。两轴长度相同就保留该长度。有一个长度为 `1` 时，结果使用另一个轴的长度。两个长度不同且都不为 `1` 时，这两个形状无法广播。

| 左侧形状 | 右侧形状 | 结果 |
| --- | --- | --- |
| `(3, 1)` | `(1, 2)` | `(3, 2)` |
| `(2, 3, 1)` | `(4,)`，对齐为 `(1, 1, 4)` | `(2, 3, 4)` |
| `(2, 3)` | `(2, 4)` | 末轴的 `3` 与 `4` 冲突 |

第一组中，`a` 在列方向重复取同一个值，`b` 在行方向重复取同一行。结果的第 $i$ 行、第 $j$ 列是 `a[i, 0] + b[0, j]`。

<div data-note-tabs="广播机制" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
a = np.arange(3).reshape(3, 1)
b = np.arange(2).reshape(1, 2)
a, b
```

```text
(array([[0.],
        [1.],
        [2.]]),
 array([[0., 1.]]))
```

```python
a + b
```

```text
array([[0., 1.],
       [1., 2.],
       [2., 3.]])
```

</div>

<div data-note-tab="PyTorch">

PyTorch 可以按这条规则直接读取输入数据，无需先复制出两个 `(3, 2)` 的输入张量。[PyTorch 广播规则](https://docs.pytorch.org/docs/2.15/notes/broadcasting.html)

```python
a = torch.arange(3).reshape((3, 1))
b = torch.arange(2).reshape((1, 2))
a, b
```

```text
(tensor([[0],
         [1],
         [2]]),
 tensor([[0, 1]]))
```

```python
a + b
```

```text
tensor([[0, 1],
        [1, 2],
        [2, 3]])
```

</div>

<div data-note-tab="TensorFlow">

```python
a = tf.reshape(tf.range(3), (3, 1))
b = tf.reshape(tf.range(2), (1, 2))
a, b
```

```text
(<tf.Tensor: shape=(3, 1), dtype=int32, numpy=
 array([[0],
        [1],
        [2]], dtype=int32)>,
 <tf.Tensor: shape=(1, 2), dtype=int32, numpy=array([[0, 1]], dtype=int32)>)
```

```python
a + b
```

```text
<tf.Tensor: shape=(3, 2), dtype=int32, numpy=
array([[0, 1],
       [1, 2],
       [2, 3]], dtype=int32)>
```

</div>

<div data-note-tab="Paddle">

```python
a = paddle.reshape(paddle.arange(3), (3, 1))
b = paddle.reshape(paddle.arange(2), (1, 2))
a, b
```

```text
(Tensor(shape=[3, 1], dtype=int64, place=Place(cpu), stop_gradient=True,
        [[0],
         [1],
         [2]]),
 Tensor(shape=[1, 2], dtype=int64, place=Place(cpu), stop_gradient=True,
        [[0, 1]]))
```

```python
a + b
```

```text
Tensor(shape=[3, 2], dtype=int64, place=Place(cpu), stop_gradient=True,
       [[0, 1],
        [1, 2],
        [2, 3]])
```

</div>

</div>

## 索引和切片

### 读取指定的行

索引从 `0` 开始，`-1` 表示相应轴的最后一个位置。对前面的二维 `X`，只给一个索引会操作第一个轴，也就是行。`X[-1]` 取最后一行，结果形状为 `(4,)`。切片 `X[1:3]` 包含索引 `1` 和 `2`，选出第二、第三行，结果形状为 `(2, 4)`。

<div data-note-tabs="读取指定的行" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X[-1], X[1:3]
```

```text
(array([ 8.,  9., 10., 11.]),
 array([[ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.]]))
```

</div>

<div data-note-tab="PyTorch">

```python
X[-1], X[1:3]
```

```text
(tensor([ 8.,  9., 10., 11.]),
 tensor([[ 4.,  5.,  6.,  7.],
         [ 8.,  9., 10., 11.]]))
```

</div>

<div data-note-tab="TensorFlow">

```python
X[-1], X[1:3]
```

```text
(<tf.Tensor: shape=(4,), dtype=float32, numpy=array([ 8.,  9., 10., 11.], dtype=float32)>,
 <tf.Tensor: shape=(2, 4), dtype=float32, numpy=
 array([[ 4.,  5.,  6.,  7.],
        [ 8.,  9., 10., 11.]], dtype=float32)>)
```

</div>

<div data-note-tab="Paddle">

```python
X[-1], X[1:3]
```

```text
(Tensor(shape=[4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [8. , 9. , 10., 11.]),
 Tensor(shape=[2, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
        [[4. , 5. , 6. , 7. ],
         [8. , 9. , 10., 11.]]))
```

</div>

</div>

### 写入元素与切片

先把第二行第三列改成 9，再把前两行的所有元素写成 12。

<div data-note-tabs="写入元素与切片" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
X[1, 2] = 9
X
```

```text
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  5.,  9.,  7.],
       [ 8.,  9., 10., 11.]])
```

```python
X[0:2, :] = 12
X
```

```text
array([[12., 12., 12., 12.],
       [12., 12., 12., 12.],
       [ 8.,  9., 10., 11.]])
```

后续内存示例会沿用写入后的 `X`。

</div>

<div data-note-tab="PyTorch">

`X[1, 2] = 9` 将第二行第三列的元素写成 9。`X[0:2, :] = 12` 选前两行和所有列，把这个范围内的元素都写成 `12`。

```python
X[1, 2] = 9
X
```

```text
tensor([[ 0.,  1.,  2.,  3.],
        [ 4.,  5.,  9.,  7.],
        [ 8.,  9., 10., 11.]])
```

```python
X[0:2, :] = 12
X
```

```text
tensor([[12., 12., 12., 12.],
        [12., 12., 12., 12.],
        [ 8.,  9., 10., 11.]])
```

后续内存示例会沿用写入后的 `X`。

</div>

<div data-note-tab="TensorFlow">

普通 `tf.Tensor` 的值在创建后固定。写入时，先用 `tf.Variable` 管理可变状态，再对索引位置或切片调用 `assign`。

`GradientTape` 默认监视在记录范围内被读取的可训练变量，后续运算可微时，可以求当前计算对该变量的梯度。赋值更新变量的当前值。之后读取这个值时，梯度到达变量，赋值之前的计算历史在这次读取处被截断。[TensorFlow 自动微分指南](https://www.tensorflow.org/guide/autodiff)

```python
X_var = tf.Variable(X)
X_var[1, 2].assign(9)
X_var
```

```text
<tf.Variable 'Variable:0' shape=(3, 4) dtype=float32, numpy=
array([[ 0.,  1.,  2.,  3.],
       [ 4.,  5.,  9.,  7.],
       [ 8.,  9., 10., 11.]], dtype=float32)>
```

```python
X_var = tf.Variable(X)
rows = X_var[0:2, :]
rows.assign(tf.ones(rows.shape, dtype=tf.float32) * 12)
X_var
```

```text
<tf.Variable 'Variable:0' shape=(3, 4) dtype=float32, numpy=
array([[12., 12., 12., 12.],
       [12., 12., 12., 12.],
       [ 8.,  9., 10., 11.]], dtype=float32)>
```

两个写入单元各自从原始 `X` 构造 `X_var`。后续内存示例继续使用 `X`。

</div>

<div data-note-tab="Paddle">

```python
X[1, 2] = 9
X
```

```text
Tensor(shape=[3, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[0. , 1. , 2. , 3. ],
        [4. , 5. , 9. , 7. ],
        [8. , 9. , 10., 11.]])
```

```python
X[0:2, :] = 12
X
```

```text
Tensor(shape=[3, 4], dtype=float32, place=Place(cpu), stop_gradient=True,
       [[12., 12., 12., 12.],
        [12., 12., 12., 12.],
        [8. , 9. , 10., 11.]])
```

后续内存示例会沿用写入后的 `X`。

</div>

</div>

## 节省内存

### 重新绑定名称

`Y = Y + X` 先生成加法结果，再把名称 `Y` 绑定到结果。若其他名称仍引用原来的 `Y`，它们会继续读到旧对象。Python 的 `id()` 可以比较同一次运行中对象的身份。这里结果为 `False`，表示两次观察到的 `Y` 是不同的 Python 对象。

<div data-note-tabs="重新绑定名称" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
before = id(Y)
Y = Y + X
id(Y) == before
```

```text
False
```

</div>

<div data-note-tab="PyTorch">

```python
before = id(Y)
Y = Y + X
id(Y) == before
```

```text
False
```

</div>

<div data-note-tab="TensorFlow">

```python
before = id(Y)
Y = Y + X
id(Y) == before
```

```text
False
```

</div>

<div data-note-tab="Paddle">

```python
before = id(Y)
Y = Y + X
id(Y) == before
```

```text
False
```

</div>

</div>

### 写回已有张量

先建立一个与 `Y` 同形状的写入目标 `Z`，再比较计算前后的对象身份。

<div data-note-tabs="写回已有张量" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
Z = np.zeros_like(Y)
print('id(Z):', id(Z))
Z[:] = X + Y
print('id(Z):', id(Z))
```

```text
id(Z): 139772097851776
id(Z): 139772097851776
```

</div>

<div data-note-tab="PyTorch">

先用 `zeros_like(Y)` 建立与 `Y` 同形状的目标 `Z`。接着用 `Z[:] = X + Y` 把加法结果写到 `Z` 的元素中。两次 `id(Z)` 相同，对应写入前后的同一个 Python 对象。

```python
Z = torch.zeros_like(Y)
print('id(Z):', id(Z))
Z[:] = X + Y
print('id(Z):', id(Z))
```

```text
id(Z): 140327634811696
id(Z): 140327634811696
```

</div>

<div data-note-tab="TensorFlow">

`assign` 将 `X + Y` 写入已有的 `tf.Variable`，示例中的两次 `id(Z)` 对应同一个对象。

```python
Z = tf.Variable(tf.zeros_like(Y))
print('id(Z):', id(Z))
Z.assign(X + Y)
print('id(Z):', id(Z))
```

```text
id(Z): 140005044197312
id(Z): 140005044197312
```

</div>

<div data-note-tab="Paddle">

原书在这里用 `Z = X + Y` 重新绑定名称，所以前后 `id(Z)` 不同。

```python
Z = paddle.zeros_like(Y)
print('id(Z):', id(Z))
Z = X + Y
print('id(Z):', id(Z))
```

```text
id(Z): 140016047430960
id(Z): 140016046997040
```

</div>

</div>

> [!IMPORTANT] 重新绑定与原地写入
> 以 PyTorch 为例，`Y = Y + X` 改变名称指向的对象。`Z[:] = X + Y` 复用已有的写入目标，右侧加法仍会生成结果张量。PyTorch 的 `X += Y` 在本例中直接把加法结果写入 `X`。

### 用原地加法更新

<div data-note-tabs="用原地加法更新" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
before = id(X)
X += Y
id(X) == before
```

```text
True
```

</div>

<div data-note-tab="PyTorch">

本例的 `X` 和 `Y` 形状相同，且不参与梯度计算，可以就地更新 `X`。此后再读取 `X` 会得到更新后的元素。涉及自动微分时，还要判断旧值是否会在反向传播中用到，见[自动微分](05-automatic-differentiation.md#自动微分)。

```python
before = id(X)
X += Y
id(X) == before
```

```text
True
```

</div>

<div data-note-tab="TensorFlow">

`tf.function` 把计算转换成图。图优化可以裁剪与返回值无关的运算，例如例子中创建 `Z` 的运算。存储复用取决于图和运行条件。下面的输出展示计算的数值结果。[TensorFlow 图执行指南](https://www.tensorflow.org/guide/intro_to_graphs)

```python
@tf.function
def computation(X, Y):
    Z = tf.zeros_like(Y)  # Z 不参与返回值的计算
    A = X + Y
    B = A + Y
    C = B + Y
    return C + Y

computation(X, Y)
```

```text
<tf.Tensor: shape=(3, 4), dtype=float32, numpy=
array([[ 8.,  9., 26., 27.],
       [24., 33., 42., 51.],
       [56., 57., 58., 59.]], dtype=float32)>
```

</div>

<div data-note-tab="Paddle">

在原书记录的运行环境中，`X += Y` 之后的 `X` 对应另一个 Python 对象。下面的 `False` 是该次运行的观察结果。

```python
before = id(X)
X += Y
id(X) == before
```

```text
False
```

</div>

</div>

`id()` 验证的是对象身份。张量的底层存储和临时分配由框架管理，评价峰值内存需要在给定设备和运算条件下单独测量。

## 转换为其他Python对象

### 在张量与 NumPy 数组之间转换

框架张量和 NumPy 的 `ndarray` 都能表示这里的数值。转换时分别核对返回类型和共享存储的条件。

<div data-note-tabs="在张量与 NumPy 数组之间转换" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
A = X.asnumpy()
B = np.array(A)
type(A), type(B)
```

```text
(numpy.ndarray, mxnet.numpy.ndarray)
```

</div>

<div data-note-tab="PyTorch">

先用 `X.numpy()` 得到 NumPy 数组，再用 `torch.tensor(A)` 构造 PyTorch 张量。下面的输出可以用来核对两次转换的对象类型。

```python
A = X.numpy()
B = torch.tensor(A)
type(A), type(B)
```

```text
(numpy.ndarray, torch.Tensor)
```

> [!IMPORTANT] 共享存储使两侧都能看到写入
> 对本例的普通 CPU 张量，`X.numpy()` 返回共享存储的数组。`torch.from_numpy(A)` 也为兼容数组建立共享存储的张量。`torch.tensor(A)` 会复制元素，创建独立的数据。

`numpy()` 的默认转换要求张量在 CPU 上、不需要梯度，且类型和布局受 NumPy 支持。共轭视图等其他情况参见[张量转 NumPy 的条件](https://docs.pytorch.org/docs/2.15/generated/torch.Tensor.numpy.html)，共享数据的用法可看 [PyTorch 示例](https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html#bridge-with-numpy)。

下面用新的两元素张量独立演示修改的传播。写入数组后，共享同一存储的两个张量 `original` 和 `shared` 都读到 `9`，通过复制创建的 `copied` 仍读到 `1`。

```python
original = torch.tensor([1, 2])
array = original.numpy()
copied = torch.tensor(array)
shared = torch.from_numpy(array)

array[0] = 9
original.tolist(), copied.tolist(), shared.tolist()
```

```text
([9, 2], [1, 2], [9, 2])
```

</div>

<div data-note-tab="TensorFlow">

```python
A = X.numpy()
B = tf.constant(A)
type(A), type(B)
```

```text
(numpy.ndarray, tensorflow.python.framework.ops.EagerTensor)
```

</div>

<div data-note-tab="Paddle">

```python
A = X.numpy()
B = paddle.to_tensor(A)
type(A), type(B)
```

```text
(numpy.ndarray, paddle.Tensor)
```

</div>

</div>

### 从单元素张量提取 Python 数值

包含一个元素的张量可以用 `.item()` 提取对应的 Python 数值，再按需调用 `float()` 或 `int()`。这里 `int(3.5)` 得到 `3`。

<div data-note-tabs="从单元素张量提取 Python 数值" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
a = np.array([3.5])
value = a.item()
a, value, float(value), int(value)
```

```text
(array([3.5]), 3.5, 3.5, 3)
```

</div>

<div data-note-tab="PyTorch">

```python
a = torch.tensor([3.5])
value = a.item()
a, value, float(value), int(value)
```

```text
(tensor([3.5000]), 3.5, 3.5, 3)
```

</div>

<div data-note-tab="TensorFlow">

`tf.constant([3.5]).numpy()` 返回一维 `ndarray`。NumPy 2.4 起，这类数组需要先用 `.item()` 等方式提取单个值，再调用 `float()` 或 `int()`。[NumPy 2.4 发布说明](https://numpy.org/doc/2.4/release/2.4.0-notes.html)

```python
a = tf.constant([3.5]).numpy()
value = a.item()
a, value, float(value), int(value)
```

```text
(array([3.5], dtype=float32), 3.5, 3.5, 3)
```

</div>

<div data-note-tab="Paddle">

```python
a = paddle.to_tensor([3.5])
value = a.item()
a, value, float(value), int(value)
```

```text
(Tensor(shape=[1], dtype=float32, place=Place(cpu), stop_gradient=True,
        [3.50000000]),
 3.5,
 3.5,
 3)
```

</div>

</div>

## 小结

- 先看形状和轴，再判断逐元素运算、广播、拼接或索引后的输出形状。
- 写入时看名称绑定、对象与底层存储。多个对象共享存储时，可以看到同一份数据的修改。
- 在张量、NumPy 数组和 Python 数值之间转换时，分别核对返回类型与复制条件。

## 练习

1. 重新运行[拼接示例](#沿已有轴拼接)以恢复 `X` 和 `Y` 的初值，再把 `X == Y` 分别改为 `X < Y` 和 `X > Y`。先判断哪些位置会为 `True`，再核对输出的形状、类型和值。
1. 用三维张量替换[广播示例](#广播机制)中的两个输入，例如形状为 `(2, 1, 3)` 和 `(1, 4, 1)`。先预测结果形状，再运行代码确认。若把后一形状改为 `(1, 4, 2)`，观察哪一轴使加法无法进行。
