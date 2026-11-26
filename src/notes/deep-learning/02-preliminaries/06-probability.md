---
title: 概率
date: 2026-11-20
order: 6
---

# 概率

模型常常要在信息有限时做判断。看到一张模糊的照片，模型可以给“猫”和“狗”分别估计一个概率。手里有了更清楚的照片，就可以重新判断。概率让我们说清**目前有多确定，以及看到新信息后怎样更新判断**。

<figure id="fig-cat-dog" class="markdown-illustration" style="max-width: 355px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/cat-dog-pixels.png" alt="同一对猫狗图像以从 10 × 10 到 160 × 160 像素的五种分辨率呈现，分辨率较低时可辨认的细节较少。" width="355" height="349" style="min-width: 0; width: min(100%, 300px);" />
  </div>
  <figcaption>图 2.6.1 同一对猫狗图像在五种分辨率下的样子。</figcaption>
</figure>

如果任务只包含猫和狗，照片也没提供区分线索，判断就从两类原先的比例出发。两类在数据里各占一半时，可以先给各自 $0.5$。天气预测也类似。假设某个模型根据手里的天气数据给出明天下雨的概率 $0.5$，这个值描述的是在当前信息下对尚未发生的事件的判断。

## 基本概率论

先从一颗公平的六面骰子开始。每次投掷，六个点数各有 $1/6$ 的概率。下面用它来看**一次投掷得到什么、很多次投掷能估计什么**。

### 概率论公理

所有可能的结果 $\mathcal{S}=\{1,2,3,4,5,6\}$ 组成**样本空间（sample space）**。其中一个点数是一个**结果（outcome）**。**事件（event）**是我们关心的一组结果。例如“掷出奇数”是集合 $\{1,3,5\}$，掷出 $3$ 就算这个事件发生了。

概率给每个事件一个介于 $0$ 和 $1$ 之间的数。它满足三条基本规则。

- 任意事件 $A$ 的概率非负。
- 所有可能结果合起来的概率是 $1$，即 $P(\mathcal{S})=1$。
- 若可数个事件 $A_1,A_2,\ldots$ 两两**互斥（mutually exclusive）**，至少发生一个的概率等于各自概率之和，即 $P(\bigcup_i A_i)=\sum_i P(A_i)$。

这些规则由科尔莫戈洛夫在 1933 年公理化。骰子例子里，掷出 $1$、$3$、$5$ 互斥，所以“掷出奇数”的概率为 $1/6+1/6+1/6=1/2$。同一套规则也给出空事件的概率 $P(\emptyset)=0$。

### 随机变量

用 **随机变量（random variable）** $X$ 记录每次掷出的点数。投掷前，$X$ 有多种可能取值。掷出 $3$ 后，这次观测值就是 $3$。$P(X=3)=1/6$ 表示掷出 $3$ 的概率。对 $X$ 的每种可能取值都给出概率，就得到这个离散随机变量的**分布（distribution）**。

点数是离散的。以身高为例，在用**概率密度（probability density）**建模时，单点的概率为 $0$。要求身高落在 $1.79$ 至 $1.81$ 米之间的概率，要在这个区间对密度积分。后面的计算先用离散例子。有关连续分布可参阅数学附录的[随机变量](https://d2l.ai/chapter_appendix-mathematics-for-deep-learning/random-variables.html)。

### 从计数到频率

从指定分布生成结果，叫作**抽样（sampling）**。让骰子独立地掷若干次，每次使用同一组点数概率。得到的六项计数服从**多项分布（multinomial distribution）**。下面 PyTorch 输出的第一行 `[0, 0, 0, 1, 0, 0]` 表示只投了一次，结果是 $4$。连续掷十次，计数仍有六项，六项相加等于 $10$。

把某一点数出现的次数除以总投掷次数，就得到它的**相对频率**。例如 PyTorch 的第三行在第 3 格写了 `0.15`，表示掷 $1000$ 次看到 $3$ 点 $150$ 次。这是对真实概率 $1/6$ 的一次估计。

在新启动的 CPU Notebook 中选定一个框架，按顺序执行本节两组代码。两个标签组会一起切换。首组设置种子并输出一次、十次投掷的计数，最后一行是另一批 $1000$ 次投掷的六项频率。**先核对六个位置的含义和总次数，再读具体数字。** 各框架的随机序列各自生成。

本节的 Windows CPU 示例使用 Python 3.12.11，分别搭配 PyTorch 2.10.0、TensorFlow 2.18.0 与 TensorFlow Probability 0.25.0（`tf-keras 2.18.0`），或 Paddle 3.3.1。MXNet 示例使用 Python 3.7.9、MXNet 1.7.0.post2 和 NumPy 1.16.6。绘图使用 Matplotlib 3.10.8，MXNet 兼容环境使用 Matplotlib 3.3.4。

<div data-note-tabs="投掷骰子并读取频率" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
from mxnet import np, npx, random

npx.set_np()
random.seed(42)
fair_probs = [1.0 / 6] * 6

one_roll = np.random.multinomial(1, fair_probs)
ten_rolls = np.random.multinomial(10, fair_probs)
counts = np.random.multinomial(1000, fair_probs)
relative_frequencies = (counts.astype("float32") / 1000).asnumpy().tolist()

print(one_roll.asnumpy().tolist())
print(ten_rolls.asnumpy().tolist())
print([round(value, 3) for value in relative_frequencies])
```

```text
[0, 0, 0, 0, 1, 0]
[2, 3, 0, 3, 0, 2]
[0.139, 0.16, 0.18, 0.177, 0.16, 0.184]
```

</div>

<div data-note-tab="PyTorch">

```python
import torch
from torch.distributions import Multinomial

torch.manual_seed(42)
fair_probs = torch.full((6,), 1.0 / 6, dtype=torch.float32)

one_roll = Multinomial(1, probs=fair_probs).sample()
ten_rolls = Multinomial(10, probs=fair_probs).sample()
counts = Multinomial(1000, probs=fair_probs).sample()
relative_frequencies = (counts / 1000).tolist()

print(one_roll.to(torch.int64).tolist())
print(ten_rolls.to(torch.int64).tolist())
print([round(value, 3) for value in relative_frequencies])
```

```text
[0, 0, 0, 1, 0, 0]
[3, 0, 2, 1, 0, 4]
[0.173, 0.182, 0.15, 0.186, 0.154, 0.155]
```

</div>

<div data-note-tab="TensorFlow">

```python
import tensorflow as tf
import tensorflow_probability as tfp

tf.random.set_seed(42)
fair_probs = tf.fill((6,), 1.0 / 6)
Multinomial = tfp.distributions.Multinomial

one_roll = Multinomial(1, probs=fair_probs).sample()
ten_rolls = Multinomial(10, probs=fair_probs).sample()
counts = Multinomial(1000, probs=fair_probs).sample()
relative_frequencies = (counts / 1000).numpy().tolist()

print(tf.cast(one_roll, tf.int64).numpy().tolist())
print(tf.cast(ten_rolls, tf.int64).numpy().tolist())
print([round(value, 3) for value in relative_frequencies])
```

```text
[1, 0, 0, 0, 0, 0]
[2, 2, 1, 3, 1, 1]
[0.165, 0.179, 0.167, 0.154, 0.173, 0.162]
```

</div>

<div data-note-tab="Paddle">

```python
import paddle
from paddle.distribution import Multinomial

paddle.seed(42)
fair_probs = paddle.full((6,), 1.0 / 6, dtype="float32")

one_roll = Multinomial(1, probs=fair_probs).sample()
ten_rolls = Multinomial(10, probs=fair_probs).sample()
counts = Multinomial(1000, probs=fair_probs).sample()
relative_frequencies = (counts / 1000).numpy().tolist()

print(one_roll.astype("int64").numpy().tolist())
print(ten_rolls.astype("int64").numpy().tolist())
print([round(value, 3) for value in relative_frequencies])
```

```text
[0, 0, 0, 0, 0, 1]
[1, 2, 0, 0, 2, 5]
[0.18, 0.166, 0.16, 0.164, 0.147, 0.183]
```

</div>

</div>

### 累计频率

把投掷分成 $500$ 组，每组掷 $10$ 次。计数表有 $500$ 行和 $6$ 列，**一行是一组，一列是一个点数**。沿组这一轴累加，再把每行的六项除以当时的累计投掷次数。

例如前两组分别出现 $1$ 次和 $2$ 次 $3$ 点，前两个频率点就是 $1/10$ 和 $(1+2)/(10+10)=3/20$。下面取第 3 列，也就是索引 `2`，得到画图所需的 $500$ 个频率点。输出的最后一行是累计投掷次数 $5000$。

<div data-note-tabs="按组计算累计频率" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

```python
group_counts = np.random.multinomial(10, fair_probs, size=500)
cumulative_counts = group_counts.astype("float32").cumsum(axis=0)
cumulative_totals = cumulative_counts.sum(axis=1, keepdims=True)
estimates = cumulative_counts / cumulative_totals
point_three_frequencies = estimates[:, 2].asnumpy().tolist()

print(tuple(group_counts.shape), len(point_three_frequencies))
print(int(cumulative_totals[-1, 0].item()))
```

```text
(500, 6) 500
5000
```

</div>

<div data-note-tab="PyTorch">

```python
group_counts = Multinomial(10, probs=fair_probs).sample((500,))
cumulative_counts = group_counts.cumsum(dim=0)
cumulative_totals = cumulative_counts.sum(dim=1, keepdim=True)
estimates = cumulative_counts / cumulative_totals
point_three_frequencies = estimates[:, 2].tolist()

print(tuple(group_counts.shape), len(point_three_frequencies))
print(int(cumulative_totals[-1, 0].item()))
```

```text
(500, 6) 500
5000
```

</div>

<div data-note-tab="TensorFlow">

```python
group_counts = Multinomial(10, probs=fair_probs).sample(500)
cumulative_counts = tf.cumsum(group_counts, axis=0)
cumulative_totals = tf.reduce_sum(cumulative_counts, axis=1, keepdims=True)
estimates = cumulative_counts / cumulative_totals
point_three_frequencies = estimates[:, 2].numpy().tolist()

print(tuple(group_counts.shape), len(point_three_frequencies))
print(int(cumulative_totals[-1, 0].numpy()))
```

```text
(500, 6) 500
5000
```

</div>

<div data-note-tab="Paddle">

```python
group_counts = Multinomial(10, probs=fair_probs).sample((500,))
cumulative_counts = group_counts.cumsum(axis=0)
cumulative_totals = cumulative_counts.sum(axis=1, keepdim=True)
estimates = cumulative_counts / cumulative_totals
point_three_frequencies = estimates[:, 2].numpy().tolist()

print(tuple(group_counts.shape), len(point_three_frequencies))
print(int(cumulative_totals[-1, 0].item()))
```

```text
(500, 6) 500
5000
```

</div>

</div>

<figure id="fig-dice-frequency" class="markdown-illustration" style="max-width: 448px;">
  <div class="markdown-illustration-scroll" style="padding: 0; border: 0; background: transparent;">
    <img src="/assets/notes/deep-learning/preliminaries/dice-frequency.svg" alt="PyTorch 样本中掷出 3 点的累计频率。横轴为累计投掷次数，虚线标出公平骰子的真实概率 1/6，实线随投掷次数增加在虚线附近波动。" width="448" height="254" style="min-width: 0;" />
  </div>
  <figcaption>图取 PyTorch 标签的一次完整运行。投完 5000 次时，共看到 829 次 3 点，累计频率为 0.1658。虚线标出公平骰子的真实概率 1/6。</figcaption>
</figure>

> [!IMPORTANT] 相对频率会在波动中趋近真实概率
>
> 各次投掷彼此独立、每次都使用同一分布时，**大数定律（law of large numbers）**说明相对频率会随投掷次数增多而趋近真实概率。有限次投掷仍然会有偏差，图中的实线也可能暂时离虚线更远。

执行下面的单元，可以绘制当前框架的同一列频率。横坐标从 $10$ 开始，每多一组就增加 $10$。

```python
import matplotlib.pyplot as plt

roll_totals = range(10, 5001, 10)
fig, ax = plt.subplots()
ax.plot(roll_totals, point_three_frequencies, label="Face 3")
ax.axhline(1 / 6, color="gray", linestyle="--", label="1/6")
ax.set(xlabel="Cumulative rolls", ylabel="Relative frequency")
ax.legend()
plt.show()
```

## 处理多个随机变量

一条观测常常包含多个量。例如给照片记录颜色、地点和标签，或同时观察一个人的症状与检测结果。先用骰子看这些量怎样一起出现，再看已知其中一个量会怎样改变判断。

### 联合概率

记事件 $A$ 为“掷出偶数”，$B$ 为“点数大于 $3$”。两条条件同时成立时，结果只能落在 $\{4,6\}$，所以 **联合概率（joint probability）** $P(A,B)=2/6=1/3$。共同发生的结果落在每个事件各自的范围内，因此 $P(A,B)$ 不大于 $P(A)$ 或 $P(B)$。

当 $A,B$ 表示随机变量时，$P(A=a,B=b)$ 也这样读，表示 $A$ 和 $B$ 同时取得指定值的概率。

### 条件概率

已知 $B$，就只看点数 $\{4,5,6\}$。其中 $4$ 和 $6$ 是偶数，所以此时掷出偶数的概率是 $2/3$。竖线右侧写已知条件，$P(A\mid B)$ 读作“给定 $B$ 时，$A$ 的概率”。

> [!IMPORTANT] 条件决定先看哪些结果
>
> 给定 $B$ 时，**条件概率（conditional probability）**只在 $B$ 发生的范围里计算。$P(B)>0$ 时，$P(A\mid B)=P(A,B)/P(B)$。在骰子例子中，这就是用 $2/6$ 除以 $3/6$。

### 贝叶斯定理

有时知道“如果 $A$ 发生，$B$ 多常见”，想反过来问“看到 $B$ 后，$A$ 有多可能”。当 $P(A)>0$ 且 $P(B)>0$ 时，同一个联合概率既等于 $P(B\mid A)P(A)$，也等于 $P(A\mid B)P(B)$。令两式相等再除以 $P(B)$，得到**贝叶斯定理（Bayes’ theorem）**。

<div id="equation-chapter-preliminaries-probability-0" role="region" aria-label="公式 2.6.1" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
P(A \mid B) = \frac{P(B \mid A) P(A)}{P(B)}.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.1)</span>
</div>
</div>

$P(A)$ 是看到 $B$ 之前对 $A$ 的判断，叫作**先验概率**。观察 $B$ 后得到的 $P(A\mid B)$ 叫作**后验概率**。分子是 $A$ 和 $B$ 一起发生的概率，分母是看到 $B$ 的所有情况的概率。

### 边际化

如果只关心 $B$ 是否发生，就把“同时发生 $A$”与“没有发生 $A$”两部分加起来。骰子例子中，大于 $3$ 的偶数是 $4,6$，大于 $3$ 的奇数是 $5$，所以 $P(B)=2/6+1/6=1/2$。

对于两个离散随机变量，要求 $B=b$ 的概率，把 $A$ 的所有取值对应的联合概率加起来。这叫**边际化（marginalization）**，求到的 $P(B=b)$ 是一个**边际概率（marginal probability）**。

<div id="equation-chapter-preliminaries-probability-1" role="region" aria-label="公式 2.6.2" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
P(B=b) = \sum_a P(A=a, B=b).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.2)</span>
</div>
</div>

### 独立性

如果 $P(A,B)=P(A)P(B)$，就说两个事件**独立（independent）**。当 $P(B)>0$ 时，这也意味着 $P(A\mid B)=P(A)$。在同一次掷骰例子中，给定点数大于 $3$ 后，偶数概率从 $1/2$ 变为 $2/3$，所以这两个事件有依赖关系。用独立投掷的模型时，第一掷和第二掷的结果则彼此独立。

两个离散随机变量独立，要求联合分布在每一对取值上都等于两个边际分布的乘积。给定第三个量 $C$ 时，可以对条件分布做同样的检查。对每个满足 $P(C=c)>0$ 的 $c$，若 $A,B$ 的联合条件分布都能写成各自条件分布的乘积，就说它们给定 $C$ 时**条件独立（conditionally independent）**。

### 应用

设有两种 HIV 检测，用 $D_1,D_2$ 记录检测结果，$1$ 表示阳性，$0$ 表示阴性。用 $H$ 记录感染状态，$H=1$ 表示感染 HIV。**下面的检测率和人群占比都是题设。** 假定 $P(H=1)=0.0015$，计算看到阳性后 HIV 感染的概率。

#### 一次阳性

第一次检测在感染者中总是呈阳性，在未感染者中有 $1\%$ 呈阳性。每一列固定一种感染状态，阳性和阴性的概率相加为 $1$。两种感染状态下的阳性率见[表 2.6.1](#conditional-prob-d1)。

<div id="conditional-prob-d1"></div>

表 2.6.1 给定感染状态时第一次检测的结果

| 检测结果 | 已感染 $H=1$ | 未感染 $H=0$ |
| --- | --- | --- |
| 阳性 $D_1=1$ | 1 | 0.01 |
| 阴性 $D_1=0$ | 0 | 0.99 |

先算**所有阳性**的概率。感染者阳性和未感染者阳性是两块互斥的情况，各自用“人群占比乘以这一类人的阳性率”计算。

<div id="equation-chapter-preliminaries-probability-2" role="region" aria-label="公式 2.6.3" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
P(D_1=1)
&=P(D_1=1\mid H=0)P(H=0)+P(D_1=1\mid H=1)P(H=1)\\
&=0.01\times0.9985+1\times0.0015\\
&=0.011485.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.3)</span>
</div>
</div>

把题设比例换成 $20$ 万人的预计人数。有 $300$ 人感染且呈阳性，另有 $1997$ 人未感染也呈阳性。在全部 $2297$ 名阳性者中，感染者约占 $300/2297$。

<div id="equation-chapter-preliminaries-probability-3" role="region" aria-label="公式 2.6.4" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
P(H=1\mid D_1=1)
&=\frac{P(D_1=1\mid H=1)P(H=1)}{P(D_1=1)}\\
&=\frac{0.0015}{0.011485}\approx 0.1306.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.4)</span>
</div>
</div>

#### 两次阳性

第二次检测的题设数据见[表 2.6.2](#conditional-prob-d2)。现在观察到两次结果都为阳性，求新的后验概率。**本例额外假定，给定感染状态后，两次检测结果彼此独立。** 有了这个条件，就能在两个感染状态下分别把阳性率相乘。

<div id="conditional-prob-d2"></div>

表 2.6.2 给定感染状态时第二次检测的结果

| 检测结果 | 已感染 $H=1$ | 未感染 $H=0$ |
| --- | --- | --- |
| 阳性 $D_2=1$ | 0.98 | 0.03 |
| 阴性 $D_2=0$ | 0.02 | 0.97 |

<div id="equation-chapter-preliminaries-probability-4" role="region" aria-label="公式 2.6.5" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
P(D_1=1,D_2=1\mid H=0)
&=P(D_1=1\mid H=0)P(D_2=1\mid H=0)\\
&=0.01\times0.03=0.0003.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.5)</span>
</div>
</div>

<div id="equation-chapter-preliminaries-probability-5" role="region" aria-label="公式 2.6.6" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
P(D_1=1,D_2=1\mid H=1)
&=P(D_1=1\mid H=1)P(D_2=1\mid H=1)\\
&=1\times0.98=0.98.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.6)</span>
</div>
</div>

按感染和未感染各占多少，把两类人中的双阳性概率加起来。

<div id="equation-chapter-preliminaries-probability-6" role="region" aria-label="公式 2.6.7" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
&P(D_1=1,D_2=1)\\
&=P(D_1=1,D_2=1\mid H=0)P(H=0)\\
&\quad+P(D_1=1,D_2=1\mid H=1)P(H=1)\\
&=0.0003\times0.9985+0.98\times0.0015\\
&=0.00176955.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.7)</span>
</div>
</div>

最后，在全部双阳性结果里，算感染 HIV 的那部分占多少。

<div id="equation-chapter-preliminaries-probability-7" role="region" aria-label="公式 2.6.8" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\begin{aligned}
&P(H=1\mid D_1=1,D_2=1)\\
&=\frac{P(D_1=1,D_2=1\mid H=1)P(H=1)}{P(D_1=1,D_2=1)}\\
&=\frac{0.98\times0.0015}{0.00176955}\approx0.8307.
\end{aligned}
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.8)</span>
</div>
</div>

在这组题设下，一次阳性把感染概率更新到约 $13.06\%$，第二个阳性再把它更新到约 $83.07\%$。读这两个数时，先看是哪种观察，再看假定了怎样的感染比例与检测关系。

## 期望和方差

还是用骰子的点数 $X$。**期望（expectation）**是按概率加权的平均值。公平骰子各面权重一样，期望就是 $(1+2+3+4+5+6)/6=3.5$。这个数描述大量独立投掷时的平均点数。

<div id="equation-chapter-preliminaries-probability-8" role="region" aria-label="公式 2.6.9" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
E[X] = \sum_x x P(X=x).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.9)</span>
</div>
</div>

如果关心的是由点数计算出来的值 $f(X)$，就把每个 $x$ 换成 $f(x)$，保留这一项原来的概率作为权重。例如把每个样本的损失当作 $f(x)$，按数据分布加权求到的就是期望损失。下式用于离散取值且期望存在的情形。

<div id="equation-chapter-preliminaries-probability-9" role="region" aria-label="公式 2.6.10" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
E[f(X)] = \sum_x f(x) P(X=x).
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.10)</span>
</div>
</div>

**方差（variance）**看的是结果围绕期望有多分散。先把每个取值与均值的差平方，再对平方后的差求期望。$E[X^2]$ 有限时，方差也可以用第二种写法计算。

<div id="equation-chapter-preliminaries-probability-10" role="region" aria-label="公式 2.6.11" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathrm{Var}[X] = E\!\left[(X-E[X])^2\right] = E[X^2] - (E[X])^2.
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.11)</span>
</div>
</div>

公平骰子的 $E[X^2]=(1^2+2^2+3^2+4^2+5^2+6^2)/6=91/6$，再减去 $3.5^2$，得到方差 $35/12$。方差开平方是**标准差（standard deviation）**，它和点数用相同的单位。

同样可以量 $f(X)$ 的离散程度。此时先算 $f(X)$ 的期望，再用它作为衡量偏离的中心。

<div id="equation-chapter-preliminaries-probability-11" role="region" aria-label="公式 2.6.12" tabindex="0" style="max-width: 100%; overflow-x: auto;">
<div style="display: grid; grid-template-columns: minmax(max-content, 1fr) auto; align-items: center; gap: 0.75rem; width: max-content; min-width: 100%;">

$$
\mathrm{Var}[f(X)] = E\!\left[(f(X)-E[f(X)])^2\right].
$$

<span style="white-space: nowrap;" aria-hidden="true">(2.6.12)</span>
</div>
</div>

## 小结

- **计数除以总次数得到相对频率。** 在独立、同分布的投掷中，增加样本会让相对频率逐渐趋近真实概率。
- **条件概率先缩小范围。** 贝叶斯定理用已有的先验和观察条件来更新判断。边际化把暂时不关心的变量各取值加在一起。
- **期望说平均是多少，方差说结果有多分散。** 两者都要按各个结果的概率加权。

## 练习

1. 从 $m=500$ 组、每组 $n=10$ 次投掷开始。先固定总次数 $mn$ 改变分组，再试着增加总次数。观察图上的点数、最后一个频率和波动。

   > [!ANSWER]
   >
   > 保持 $5000$ 次投掷，把同一批结果分别按 $500$ 组每组 $10$ 次、$100$ 组每组 $50$ 次统计。第一种记下 $500$ 个点，第二种记下 $100$ 个点。最后一次都用到同一批 $5000$ 个结果，所以末尾的频率一样。
   >
   > 单独生成两批独立样本时，末尾频率可以不同。增大总投掷次数时，频率通常更靠近 $1/6$，中途仍会波动。

1. 只知道 $p=P(A)$ 和 $q=P(B)$。用文氏图想一想，$P(A\cap B)$ 与 $P(A\cup B)$ 各能大到多少、小到多少？

   > [!ANSWER]
   >
   > 交集至多和较小的事件一样大。$p+q\leq 1$ 时，两事件可以完全分开。$p+q>1$ 时，它们至少重叠出超出 $1$ 的那部分。
   >
   > $$
   > \max(0,p+q-1)\leq P(A\cap B)\leq \min(p,q).
   > $$
   >
   > 用 $P(A\cup B)=p+q-P(A\cap B)$ 就能得到并集的范围。
   >
   > $$
   > \max(p,q)\leq P(A\cup B)\leq \min(1,p+q).
   > $$

1. 对离散随机变量 $A,B,C$，给定 $B$ 时，$A$ 与 $C$ 条件独立。按 $A,B,C$ 的顺序分解联合概率并化简。

   > [!ANSWER]
   >
   > 先用乘法法则把联合概率写成 $P(A=a)P(B=b\mid A=a)P(C=c\mid A=a,B=b)$。在给定事件的概率为正时，条件独立让最后一项化为 $P(C=c\mid B=b)$，所以联合概率是
   >
   > $$
   > P(A=a,B=b,C=c)=P(A=a)P(B=b\mid A=a)P(C=c\mid B=b).
   > $$
   >
   > 这对应 $A\to B\to C$ 的马尔可夫链。

1. 沿用[应用](#应用)的题设。如果把第一次检测重复两次，并且给定感染状态后两次结果条件独立，收到两个阳性时感染 HIV 的概率是多少？如果第二次完全重复第一次的结果呢？

   > [!ANSWER]
   >
   > 条件独立时，感染者双阳性的概率是 $1^2=1$，未感染者双阳性的概率是 $0.01^2=0.0001$。这组条件下的后验概率为
   >
   > $$
   > \frac{0.0015}{0.0015+0.9985\times0.0001}\approx93.76\%.
   > $$
   >
   > 如果第二次完全重复第一次的结果，两次阳性提供的观察就等价于第一次阳性，后验约为 $13.06\%$。比较不同检测组合时，要弄清两次结果是否会一起出错。
