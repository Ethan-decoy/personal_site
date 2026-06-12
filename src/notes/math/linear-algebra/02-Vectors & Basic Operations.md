---
title: Vector & Basic Operations
date: 2026-06-11
---
# 向量与基本运算

## 向量

- 向量是一个有序数列

箭头只是二维/三维空间中向量的一种可视化方式，本质上向量就是有序数列——Rⁿ 中的一个点。比如 [3, 5, 2, 7] 是一个四维向量，我们没法在纸上画箭头表示它，但它完全合法。

### 向量加法

- 对应分量相加：

$$
\begin{bmatrix} 1 \ 3 \end{bmatrix} + \begin{bmatrix} 4 \ -1 \end{bmatrix} = \begin{bmatrix} 5 \ 2 \end{bmatrix}
$$
几何上箭头的"首尾相接"
$$
 \begin{bmatrix} 1 \ 3 \end{bmatrix} + \begin{bmatrix} 4 \ -1 \end{bmatrix} = \begin{bmatrix} 5 \ 2 \end{bmatrix}
$$

---

### 标量乘法 

- 每个分量乘以同一个数：

$$
3 \times \begin{bmatrix} 2 \ -1 \end{bmatrix} = \begin{bmatrix} 6 \ -3 \end{bmatrix}
$$
几何上把向量拉长（或缩短、反向）

#### 共线

$$ 
\vec{v_1} = a\vec{v_2}
$$

#### 共面
$$
\vec{v_1} \neq k,\vec{v_2}, \quad \forall k \in \mathbb{R}
$$

简单来说，不共线，且不是零向量的两条直线可以取到平面的任意点。

---

### 点积

$$
\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2 + \cdots + a_n b_n
$$

对应分量相乘再相加。结果是**一个数（标量）**，不是向量。

比如：$\begin{bmatrix} 1 \ 3 \end{bmatrix} \cdot \begin{bmatrix} 4 \ -2 \end{bmatrix} = 1 \times 4 + 3 \times (-2) = -2$

点积最重要的几何意义：

$$
\vec{a} \cdot \vec{b} = |\vec{a}| |\vec{b}| \cos\theta
$$

其中 $\theta$ 是两个向量的夹角。这个公式告诉我们：

- 点积 > 0 → 夹角 < 90°（方向大致相同）
- 点积 = 0 → 夹角 = 90°（正交，垂直）
- 点积 < 0 → 夹角 > 90°（方向大致相反）

---