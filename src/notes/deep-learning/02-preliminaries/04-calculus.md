---
title: 微积分
date: 2026-11-20
order: 4
---

# 微积分

训练模型时，**优化**关心怎样调整参数来降低训练目标。**泛化**关心模型在新数据上的表现。要知道一个参数只改动一点时损失会怎样变，可以用微分计算它的变化率。

微积分包含微分和积分。微分研究变化率，积分描述面积等累积量。古希腊数学家曾用内接正多边形逼近圆的面积。如[图 2.4.1](#fig-circle-area)所示，同一个圆内的正多边形边数越多，面积越接近这个圆。这是**逼近法（method of exhaustion）**的例子。

<figure id="fig-circle-area" class="markdown-illustration" style="max-width: 448px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/calculus-polygon-approximation.svg" alt="四个同样大小的圆，分别有内接的正四边形、正五边形、正六边形和正八边形。边数增多时，填色的多边形越来越接近圆的面积。" width="448" height="120" style="min-width: 0;" />
  </div>
  <figcaption>图 2.4.1 增加内接正多边形的边数，逐步逼近圆的面积。</figcaption>
</figure>

## 在深度学习中的作用

| 概念 | 在深度学习中的作用 |
| --- | --- |
| 微分 | 损失可微时，估算参数改一小步会让损失增减多少。 |
| 导数 | 看损失随单个参数变化的快慢，帮助判断该把参数调大还是调小。 |
| 积分 | 有概率密度时，算数值落在某个范围里的概率，也能求期望，比如模型在这个分布上的平均损失。 |
| 微积分 | 训练时用它分析损失和调整参数，做连续概率模型时用它算概率和期望。 |

## 导数和微分

### 从差商到导数

设 $y=f(x)$，输入和输出都是一个数。把输入从 $x$ 移到 $x+h$，输出就从 $f(x)$ 变成 $f(x+h)$。当 $h\ne 0$ 时，用**输出的变化量除以输入的变化量**，就得到这段上的平均变化率，也叫**差商**。

> [!IMPORTANT] 导数是差商的极限
>
> 固定 $x$，让 $h$ 从正负两侧趋近于 $0$。如果差商趋向同一个有限值，就把这个值记作 $f'(x)$，称为 $f$ 在 $x$ 处的**导数（derivative）**。此时 $f$ 在 $x$ 处**可微（differentiable）**。

<div id="equation-eq-derivative" role="region" aria-label="公式 2.4.1" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
f'(x) = \lim_{h\to 0} \frac{f(x+h)-f(x)}{h}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.1)</span>
</div>
</div>

拿 $f(x)=3x^2-4x$ 来算。取 $x=1$、$h=0.1$，两个输入就是 $1$ 和 $1.1$。代入分别得到 $f(1)=-1$、$f(1.1)=-0.77$。输出增加了 $0.23$，所以差商是 $(-0.77-(-1))/0.1=2.3$。

下面依次让 $h$ 缩小为原来的十分之一，重复同样的计算。这一段可以直接用 Python 运行，也可以在 Notebook 中作为一格运行。

```python
def f(x):
    return 3 * x**2 - 4 * x


def difference_quotient(function, x, h):
    return (function(x + h) - function(x)) / h


h = 0.1
for _ in range(5):
    print(f"h={h:.5f}, 差商={difference_quotient(f, 1, h):.5f}")
    h *= 0.1
```

```text
h=0.10000, 差商=2.30000
h=0.01000, 差商=2.03000
h=0.00100, 差商=2.00300
h=0.00010, 差商=2.00030
h=0.00001, 差商=2.00003
```

这里列出了五个正步长下的差商。代数上，展开可得 $f(1+h)=-1+2h+3h^2$。减去 $f(1)=-1$ 再除以 $h$，差商就是 $2+3h$。因此从两侧令 $h$ 趋近 $0$，极限都是 $2$，也就是 $f'(1)=2$。

### 求导法则

对函数求导也叫**微分运算**。对于 $y=f(x)$，可以把同一个导数写成 $f'(x)$、$y'$ 或 $\frac{dy}{dx}$。$\frac{d}{dx}$ 和 $D$ 是运算符，表示对后面的式子求关于 $x$ 的导数。

<div id="equation-chapter-preliminaries-calculus-0" role="region" aria-label="公式 2.4.2" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
f'(x) &= y' = \frac{dy}{dx} = \frac{df}{dx} \\
      &= \frac{d}{dx} f(x) = Df(x) = D_x f(x).
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.2)</span>
</div>
</div>

- **常数。** $DC=0$，其中 $C$ 为常数。
- **幂函数。** 对于 $x>0$ 和任意实数 $n$，$Dx^n=nx^{n-1}$。整数幂的定义域可由具体表达式判断，例如 $x^2$ 在所有实数处均可求导。
- **指数函数。** $De^x=e^x$。
- **自然对数。** $D\ln x=1/x$，其中 $x>0$。

设 $f$ 和 $g$ 在当前点可微、$C$ 为常数，可以将它们组合起来求导。

**常数倍法则**

<div id="equation-chapter-preliminaries-calculus-1" role="region" aria-label="公式 2.4.3" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{d}{dx}[Cf(x)] = C f'(x).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.3)</span>
</div>
</div>

**加法法则**

<div id="equation-chapter-preliminaries-calculus-2" role="region" aria-label="公式 2.4.4" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{d}{dx}[f(x)+g(x)] = f'(x)+g'(x).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.4)</span>
</div>
</div>

**乘法法则**

<div id="equation-chapter-preliminaries-calculus-3" role="region" aria-label="公式 2.4.5" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{d}{dx}[f(x)g(x)] = f'(x)g(x)+f(x)g'(x).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.5)</span>
</div>
</div>

**商法则**要求当前点的 $g(x)\ne 0$。

<div id="equation-chapter-preliminaries-calculus-4" role="region" aria-label="公式 2.4.6" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{d}{dx}\!\left[\frac{f(x)}{g(x)}\right]
= \frac{f'(x)g(x)-f(x)g'(x)}{[g(x)]^2}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.6)</span>
</div>
</div>

回到 $f(x)=3x^2-4x$。因为 $x^2$ 的导数是 $2x$，$x$ 的导数是 $1$，保留两项原来的系数再相加，就得到 $f'(x)=3\cdot 2x-4\cdot 1=6x-4$。代入 $x=1$ 得到 $2$，和刚才从差商求出的极限一致。

### 从导数写出切线

导数也给出了曲线在该点的**切线斜率**。在这个例子里，切线经过 $(1,-1)$，因为 $f(1)=-1$。从这个点出发，横坐标改变 $x-1$，斜率为 $2$ 的直线上，纵坐标就从 $-1$ 改变 $2(x-1)$。于是切线方程是 $y=-1+2(x-1)=2x-3$。

<figure id="fig-tangent-at-one" class="markdown-illustration" style="max-width: 448px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/calculus-tangent.svg" alt="实线是函数 f(x)=3x²−4x，虚线是 y=2x−3。两条线在 (1, −1) 相切，该处切线斜率为 2。" width="448" height="300" style="min-width: 0;" />
  </div>
  <figcaption>以点 (1, −1) 和斜率 2 确定切线。横坐标增加一小段时，切线给出函数值改变量的近似。</figcaption>
</figure>

绘图使用 NumPy 和 Matplotlib。在同一 Python 会话中继续运行这段，沿用上面定义的 `f`。此时 `x` 是一组横坐标，`f(x)` 和 `tangent` 分别给出两条线在这些位置的纵坐标。

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2.4, 241)
x0 = 1
slope = 2
tangent = f(x0) + slope * (x - x0)

_, ax = plt.subplots()
ax.plot(x, f(x), label="f(x)")
ax.plot(x, tangent, "--", label="y = 2x - 3")
ax.plot(x0, f(x0), "o")
ax.set(xlabel="x", ylabel="y", xlim=(0, 2.4), ylim=(-3, 8))
ax.legend()
plt.show()
```

## 偏导数

一个损失函数往往有多个输入。要看其中一个输入怎样影响结果，可以先把其余输入保持在原来的值。

> [!IMPORTANT] 求偏导时固定其他输入
>
> **偏导数（partial derivative）**是函数对其中一个输入的变化率。求关于 $x_i$ 的偏导数时，只让 $x_i$ 改变 $h$，把其他输入当作常数，用同样的差商极限来求导。

设 $y=f(x_1,\ldots,x_n)$。下面两个函数值的输入只在第 $i$ 项相差 $h$。

<div id="equation-chapter-preliminaries-calculus-5" role="region" aria-label="公式 2.4.7" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{\partial y}{\partial x_i}
= \lim_{h\to 0}
\frac{f(x_1,\ldots,x_{i-1},x_i+h,x_{i+1},\ldots,x_n)-f(x_1,\ldots,x_n)}{h}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.7)</span>
</div>
</div>

我们用 $F(x_1,x_2)=x_1^2+x_1x_2$ 来算，取输入为 $(1,2)$。

- **对 $x_1$ 求偏导。** 固定 $x_2=2$，$F$ 就是关于 $x_1$ 的 $x_1^2+2x_1$。求导得到 $2x_1+2$，代入 $x_1=1$ 得到 $4$。
- **对 $x_2$ 求偏导。** 固定 $x_1=1$，$F$ 就是关于 $x_2$ 的 $1+x_2$。它的导数是 $1$。

$\partial$ 用于表示偏导数。常见写法如下，$f_{x_i}$ 和 $f_i$ 都用下标标记求导的输入。

<div id="equation-chapter-preliminaries-calculus-6" role="region" aria-label="公式 2.4.8" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
\frac{\partial y}{\partial x_i} &= \frac{\partial f}{\partial x_i} = f_{x_i} \\
                               &= f_i = D_i f = D_{x_i}f.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.8)</span>
</div>
</div>

## 梯度

刚才在 $(1,2)$ 算出了两个偏导数。第一个数 $4$ 来自改变 $x_1$，第二个数 $1$ 来自改变 $x_2$，按输入顺序把它们排在一起就是梯度。

> [!IMPORTANT] 梯度按输入顺序排列偏导数
>
> 对一个输出为标量的函数，在同一个输入点求出各项偏导数，按输入顺序排成列向量，就得到**梯度（gradient）**。输入有 $n$ 项，梯度也有 $n$ 项。

设 $f:\mathbb{R}^n\to\mathbb{R}$，输入为列向量 $\mathbf{x}=[x_1,\ldots,x_n]^\top$。$\nabla_{\mathbf{x}}$ 表示对 $\mathbf{x}$ 求梯度，变量明确时也可写成 $\nabla$。

<div id="equation-chapter-preliminaries-calculus-7" role="region" aria-label="公式 2.4.9" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\nabla_{\mathbf{x}} f(\mathbf{x})
= \begin{bmatrix}
\frac{\partial f(\mathbf{x})}{\partial x_1} \\
\vdots \\
\frac{\partial f(\mathbf{x})}{\partial x_n}
\end{bmatrix}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.9)</span>
</div>
</div>

因此 $\nabla F(1,2)=[4,1]^\top$。模型的损失为一个数时，也可以这样记录它关于每个参数的偏导数。

### 常用的梯度

- **向量的 $L_2$ 范数平方。** $\|\mathbf{x}\|_2^2=\mathbf{x}^\top\mathbf{x}$ 是各项平方的和。对第 $i$ 项求偏导得到 $2x_i$，因此 $\nabla_{\mathbf{x}}\|\mathbf{x}\|_2^2=2\mathbf{x}$。
- **矩阵的 Frobenius 范数平方。** $\|\mathbf{X}\|_F^2$ 是每个矩阵元素的平方和。每个位置的偏导数为对应元素的两倍，因此 $\nabla_{\mathbf{X}}\|\mathbf{X}\|_F^2=2\mathbf{X}$，梯度与 $\mathbf{X}$ 的形状相同。
- **二次型。** 当 $\mathbf{A}\in\mathbb{R}^{n\times n}$ 为常量时，$\mathbf{x}^\top\mathbf{A}\mathbf{x}$ 是一个标量。对两侧出现的 $\mathbf{x}$ 分别求导并相加，得到 $(\mathbf{A}+\mathbf{A}^\top)\mathbf{x}$，形状仍为 $n$ 维列向量。

[范数和目标](03-linear-algebra.md#范数和目标)中的残差平方和，就是平方范数用于训练目标的例子。

> [!NOTE] 向量输出的导数排成矩阵
>
> 有 $m$ 个输出分量时，每个分量各有一列关于输入的梯度。沿用原书的记法，把这 $m$ 列排在一起，得到一个 $n\times m$ 的导数矩阵，行对应输入项，列对应输出项。
>
> - 若 $\mathbf{A}$ 为常量且形状为 $m\times n$，$\mathbf{A}\mathbf{x}$ 的第 $j$ 个输出由 $\mathbf{A}$ 的第 $j$ 行给出系数。把这些系数列起来，得到 $\nabla_{\mathbf{x}}(\mathbf{A}\mathbf{x})=\mathbf{A}^\top$。
> - 若 $\mathbf{A}$ 为常量且形状为 $n\times m$，$\mathbf{x}^\top\mathbf{A}$ 的第 $j$ 个输出使用 $\mathbf{A}$ 的第 $j$ 列作为系数。因此 $\nabla_{\mathbf{x}}(\mathbf{x}^\top\mathbf{A})=\mathbf{A}$。

## 链式法则

### 沿一条路径相乘

如果 $y=f(u)$、$u=g(x)$，$x$ 改变时会先让 $u$ 变化，再由 $u$ 影响 $y$。当内层在 $x$ 处可微、外层在 $u=g(x)$ 处可微时，两段变化率相乘，就得到 $y$ 对 $x$ 的导数。

<div id="equation-chapter-preliminaries-calculus-8" role="region" aria-label="公式 2.4.10" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{dy}{dx} = \frac{dy}{du}\frac{du}{dx}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.10)</span>
</div>
</div>

例如 $u=x^2$，$y=3u$。$u$ 随 $x$ 的变化率是 $2x$，$y$ 随 $u$ 的变化率是 $3$。把两段相乘，得到 $\frac{dy}{dx}=3\cdot 2x=6x$。

### 把多条路径的结果加起来

> [!IMPORTANT] 每条路径上相乘，再把各条路径相加
>
> 一个输入可能同时影响多个中间量。对每个中间量，用它相对于输入的导数，乘上输出相对于它的导数。把这些乘积加起来，就得到输出对这个输入的偏导数。

设 $y=f(u_1,\ldots,u_m)$，各个 $u_j$ 都依赖于 $x_1,\ldots,x_n$。各层函数在所求位置可微时，对于任意一个输入 $x_i$，依次用 $j=1,\ldots,m$ 枚举中间量并求和。外层的偏导数在当前中间量的取值处求出。

<div id="equation-chapter-preliminaries-calculus-9" role="region" aria-label="公式 2.4.11" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\frac{\partial y}{\partial x_i}
= \sum_{j=1}^{m} \frac{\partial y}{\partial u_j}\frac{\partial u_j}{\partial x_i}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.4.11)</span>
</div>
</div>

继续用 $F(x_1,x_2)=x_1^2+x_1x_2$。设 $x_1=t$、$x_2=2t$，则 $t$ 同时影响两个输入。当 $t=1$ 时，$(x_1,x_2)=(1,2)$，前面已在这个点算出偏导数 $4$ 和 $1$。

- **经过 $x_1$。** $x_1$ 随 $t$ 的变化率是 $1$，这条路径的贡献是 $4\cdot 1=4$。
- **经过 $x_2$。** $x_2$ 随 $t$ 的变化率是 $2$，这条路径的贡献是 $1\cdot 2=2$。

两条路径相加，得到 $F(t,2t)$ 在 $t=1$ 处的导数 $6$。代入原函数也可以核对，$F(t,2t)=t^2+t(2t)=3t^2$，它在 $t=1$ 的导数同样是 $6$。下一节的[自动微分](05-automatic-differentiation.md#自动微分)会用程序记录这样的计算关系并求出梯度。

## 小结

- **导数。** 让输入的改变量趋近于 $0$，差商的极限给出该点的瞬时变化率和切线斜率。
- **偏导数。** 只改变一个输入，将其余输入当作常数。
- **梯度。** 对标量输出，在同一个点按输入顺序排列各项偏导数。
- **链式法则。** 复合函数中每条依赖路径上的导数相乘，各条路径的结果相加。

## 练习

1. 绘制函数 $y=f(x)=x^3-\frac{1}{x}$ 和它在 $x=1$ 处的切线。可以选取包含 $1$ 的正区间，例如 $[0.5,2]$。

   > [!ANSWER]
   >
   > $f(1)=0$，而 $f'(x)=3x^2+\frac{1}{x^2}$，所以 $f'(1)=4$。切线经过 $(1,0)$，方程为 $y=4(x-1)$。原函数的定义域要求 $x\ne 0$，下面画的是包含切点的正区间。
   >
   > ```python
   > import matplotlib.pyplot as plt
   > import numpy as np
   >
   > x = np.linspace(0.5, 2, 301)
   > _, ax = plt.subplots()
   > ax.plot(x, x**3 - 1 / x, label="f(x)")
   > ax.plot(x, 4 * (x - 1), "--", label="y = 4(x - 1)")
   > ax.plot(1, 0, "o")
   > ax.set(xlabel="x", ylabel="y")
   > ax.legend()
   > plt.show()
   > ```

1. 求函数 $f(\mathbf{x})=3x_1^2+5e^{x_2}$ 的梯度。

   > [!ANSWER]
   >
   > 固定 $x_2$ 时，$5e^{x_2}$ 是常数，第一项求导得到 $6x_1$。固定 $x_1$ 时，$3x_1^2$ 是常数，第二项求导得到 $5e^{x_2}$。按输入顺序排成一列，梯度为 $[6x_1,5e^{x_2}]^\top$。

1. 求 $f(\mathbf{x})=\|\mathbf{x}\|_2$ 的梯度，分别考虑 $\mathbf{x}\ne\mathbf{0}$ 和 $\mathbf{x}=\mathbf{0}$。

   > [!ANSWER]
   >
   > 对非零向量，先对外层平方根求导，再乘上 $\sum_j x_j^2$ 关于 $x_i$ 的偏导数 $2x_i$。于是
   >
   > $$
   > \frac{\partial f}{\partial x_i}
   > = \frac{1}{2\|\mathbf{x}\|_2}\cdot 2x_i
   > = \frac{x_i}{\|\mathbf{x}\|_2}.
   > $$
   >
   > 将各分量排成列向量，得到 $\nabla f=\mathbf{x}/\|\mathbf{x}\|_2$。在原点，只改变第一项会得到函数 $|x_1|$。左侧斜率是 $-1$，右侧斜率是 $1$，因此范数在原点不可微。

1. 设 $u=f(x,y,z)$，且 $x=x(a,b)$、$y=y(a,b)$、$z=z(a,b)$。假设各层函数可微，写出 $\frac{\partial u}{\partial a}$ 和 $\frac{\partial u}{\partial b}$。

   > [!ANSWER]
   >
   > 对 $a$ 求偏导时固定 $b$，把经过 $x$、$y$、$z$ 的三条路径相加。对 $b$ 求偏导时固定 $a$，沿相同的中间量计算。
   >
   > $$
   > \begin{aligned}
   > \frac{\partial u}{\partial a}
   > &= \frac{\partial u}{\partial x}\frac{\partial x}{\partial a}
   >  + \frac{\partial u}{\partial y}\frac{\partial y}{\partial a}
   >  + \frac{\partial u}{\partial z}\frac{\partial z}{\partial a},\\
   > \frac{\partial u}{\partial b}
   > &= \frac{\partial u}{\partial x}\frac{\partial x}{\partial b}
   >  + \frac{\partial u}{\partial y}\frac{\partial y}{\partial b}
   >  + \frac{\partial u}{\partial z}\frac{\partial z}{\partial b}.
   > \end{aligned}
   > $$
