---
title: Vector & Basic Operations
date: 2026-06-11
---
# 向量与基本运算

## 向量  Vector

- 向量是一个有序数列

> 箭头只是二维/三维空间中向量的一种可视化方式，本质上向量就是有序数列——Rⁿ 中的一个点。比如 [3, 5, 2, 7] 是一个四维向量，我们没法在纸上画箭头表示它，但它完全合法。

## 向量加法

- 对应分量相加：

$$
\begin{bmatrix} 1 \\ 3 \end{bmatrix} + \begin{bmatrix} 4 \\ -1 \end{bmatrix} = \begin{bmatrix} 5 \\ 2 \end{bmatrix}
$$
几何上箭头的"首尾相接"

---

## 标量乘法

- 每个分量乘以同一个数：

$$
3 \times \begin{bmatrix} 2 \\ -1 \end{bmatrix} = \begin{bmatrix} 6 \\ -3 \end{bmatrix}
$$
几何上把向量拉长（或缩短、反向）

### 共线  Collinear

$$ 
\vec{v_1} = a\vec{v_2}
$$

### 共面  Coplanar
$$
\vec{v_1} \neq k,\vec{v_2}, \quad \forall k \in \mathbb{R}
$$

简单来说，不共线，且不是零向量的两条直线可以取到平面的任意点。

---

## 点积  Dot product/Inner product

$$
\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n
$$

对应分量相乘再相加。结果是**一个数（标量）**，不是向量。

比如：$\begin{bmatrix} 1 \\ 3 \end{bmatrix} \cdot \begin{bmatrix} 4 \\ -2 \end{bmatrix} = 1 \times 4 + 3 \times (-2) = -2$

点积最重要的几何意义：

$$
\vec{a} \cdot \vec{b} = |\vec{a}| |\vec{b}| \cos\theta
$$

其中 $\theta$ 是两个向量的夹角。这个公式告诉我们：

- 点积 > 0 → 夹角 < 90°（方向大致相同）
- 点积 = 0 → 夹角 = 90°（**正交**，垂直）
- 点积 < 0 → 夹角 > 90°（方向大致相反）

### cos(x)

```plot
Math.cos(x)
```

---

## 投影  Projection

投影是**向量对向量**的：$\vec{a}$ 在 $\vec{b}$ 上的投影，参考系是 $\vec{b}$ 的方向

$$
\text{proj}_{\vec{b}}\vec{a} = \frac{\vec{a} \cdot \vec{b}}{|\vec{b}|}
$$

这个公式里 $\vec{b}$ 就是参考方向。

投影为正：夹角 < 90°，a 的方向和 b 大致一致，影子落在 b 的前方
投影为负：夹角 > 90°，a 的方向和 b 大致相反，影子落在 b 的反方向

### 归一化  Normalization

把一个向量除以它自己的长度，结果就是长度为 1 的单位向量：

$$\text{单位化}(\vec{v}) = \frac{\vec{v}}{|\vec{v}|}$$

比如 $\vec{v} = \begin{bmatrix} 3 \\ 4 \end{bmatrix}$，$|\vec{v}| = \sqrt{9+16} = 5$

归一化后：$\frac{1}{5}\begin{bmatrix} 3 \\ 4 \end{bmatrix} = \begin{bmatrix} 0.6 \\ 0.8 \end{bmatrix}$，长度是 1，方向不变。

#### 归一化应用方向：
- 判断方向时长度可以忽略
- 避免了过多的除数计算
- 数值稳定性：大矩阵运算中，数值差异太大会导致溢出或精度丢失。归一化让所有向量在同一个"尺度"上，计算更稳定
- 机器学习中的梯度下降：不归一化的话，某些维度的数值特别大，优化过程会很慢

---

## 叉积  Cross product

一个向量（不是标量）垂直于 $\vec{a}$ 和 $\vec{b}$ 构成的平面，由右手定则确定

- 定义域：仅三维空间
- 长度：$|\vec{a} \times \vec{b}| = |\vec{a}||\vec{b}|\sin\theta$，等于两向量构成的平行四边形面积
- 用途：求法向量、判断方向、计算面积/体积

坐标系意义：若 $\vec{a} \perp \vec{b}$，则 {$\vec{a}$, $\vec{b}$, $\vec{a} \times \vec{b}$} 构成正交坐标系（归一化后为标准基）

### 叉积计算

    i    j    k
    a1   a2   a3
    b1   b2   b3
$$
\begin{bmatrix}
a_2 b_3 - a_3 b_2 & a_3 b_1 - a_1 b_3 & a_1 b_2 - a_2 b_1
\end{bmatrix}
$$

---

## 基与坐标系  Basis & Coordinate Systems

基向量只需要满足两个条件：

- 线性无关 — 不能互相表示
- 张成空间 — 线性组合能覆盖整个空间
长度没有限制。

标准基（单位向量）：

- 在二维空间 $\mathbb{R}^2$ 里，标准基是：

  $$\vec{e_1} = \begin{bmatrix} 1 \\ 0 \end{bmatrix}, \quad \vec{e_2} = \begin{bmatrix} 0 \\ 1 \end{bmatrix}$$

- 在三维空间 $\mathbb{R}^3$ 里，标准基是：

  $$\vec{e_1} = \begin{bmatrix} 1 \\ 0 \\ 0 \end{bmatrix}, \quad \vec{e_2} = \begin{bmatrix} 0 \\ 1 \\ 0 \end{bmatrix}, \quad \vec{e_3} = \begin{bmatrix} 0 \\ 0 \\ 1 \end{bmatrix}$$

  注意：$\vec{e_1}, \vec{e_2}, \vec{e_3}$ 就是之前叉积里用的 $\mathbf{i}, \mathbf{j}, \mathbf{k}$。

非标准基（可以不是单位向量）：

$$\vec{b_1} = \begin{bmatrix} 2 \\ 0 \end{bmatrix}, \quad \vec{b_2} = \begin{bmatrix} 0 \\ 3 \end{bmatrix}$$

这组基也能张成二维空间，但每个向量长度不是 1。用这组基表示 [2, 3] 时，坐标是 [1, 1]（1 个 b1 + 1 个 b2），而不是标准基下的 [2, 3]。